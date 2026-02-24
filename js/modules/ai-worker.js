/**
 * AI Worker (On-Device Inference Thread)
 * 이 스레드는 메인 UI 스레드와 분리되어 모델 로딩 및 텍스트 생성을 담당합니다.
 */
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// CDN 및 모델 접근 설정 최적화
env.allowLocalModels = false;
env.useBrowserCache = true;
// HuggingFace 접근 에러 해결을 위해 커스텀 호스트 설정 고려 가능 (필요시)
// env.remoteHost = 'https://huggingface.co'; 

let generator = null;

// 메인 스레드로부터 메시지 수신
self.onmessage = async (e) => {
    const { type, text, options } = e.data;

    if (type === 'load') {
        try {
            if (!generator) {
                // Start with the smallest, most reliable model (GPT-2) to potentially avoid large downloads/warnings first
                generator = await pipeline('text-generation', 'Xenova/gpt2', {
                    quantized: true,
                    progress_callback: (progress) => {
                        self.postMessage({ type: 'progress', data: progress });
                    }
                });
            }
            self.postMessage({ type: 'ready' });
        } catch (err) {
            console.error('Worker GPT2 Load Error:', err);
            // If GPT2 fails, attempt the preferred, larger Qwen model as a secondary option (may cause warning)
            try {
                generator = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat', {
                    quantized: true,
                    progress_callback: (p) => self.postMessage({ type: 'progress', data: p })
                });
                self.postMessage({ type: 'ready' });
            } catch (innerErr) {
                self.postMessage({ type: 'error', data: `Critical Load Failed: ${innerErr.message}` });
            }
        }
    }

    if (type === 'generate') {
        if (!generator) {
            self.postMessage({ type: 'error', data: 'Model not loaded' });
            return;
        }

        try {
            // 모델에 맞는 프롬프트 템플릿 처리 (Qwen 기준)
            let prompt = text;
            if (generator.model_id.includes('Qwen')) {
                prompt = `<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;
            }

            const output = await generator(prompt, {
                max_new_tokens: options?.max_new_tokens || 128, // 속도를 위해 토큰 수 제한
                temperature: options?.temperature || 0.7,
                do_sample: true,
            });

            let response = output[0].generated_text;
            if (response.includes('assistant\n')) {
                response = response.split('assistant\n').pop().trim();
            }

            self.postMessage({ type: 'result', data: response });
        } catch (err) {
            self.postMessage({ type: 'error', data: err.message });
        }
    }
};
