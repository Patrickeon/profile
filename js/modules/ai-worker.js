/**
 * AI Worker (On-Device Inference Thread)
 * 이 스레드는 메인 UI 스레드와 분리되어 모델 로딩 및 텍스트 생성을 담당합니다.
 */
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// CDN 환경 설정
env.allowLocalModels = false;

let generator = null;

// 메인 스레드로부터 메시지 수신
self.onmessage = async (e) => {
    const { type, text, options } = e.data;

    if (type === 'load') {
        try {
            if (!generator) {
                generator = await pipeline('text-generation', 'Xenova/SmolLM2-135M-Instruct', {
                    quantized: true,
                    progress_callback: (progress) => {
                        self.postMessage({ type: 'progress', data: progress });
                    }
                });
            }
            self.postMessage({ type: 'ready' });
        } catch (err) {
            self.postMessage({ type: 'error', data: err.message });
        }
    }

    if (type === 'generate') {
        if (!generator) {
            self.postMessage({ type: 'error', data: 'Model not loaded' });
            return;
        }

        try {
            // SmolLM2 전용 프롬프트 템플릿 적용
            const prompt = `<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;

            const output = await generator(prompt, {
                max_new_tokens: options?.max_new_tokens || 256,
                temperature: options?.temperature || 0.7,
                repetition_penalty: 1.1,
                do_sample: true,
                callback_function: (beams) => {
                    // 선택 사항: 스트리밍 구현 시 사용 가능
                }
            });

            const fullText = output[0].generated_text;
            const response = fullText.split('assistant\n').pop().trim();

            self.postMessage({ type: 'result', data: response || fullText });
        } catch (err) {
            self.postMessage({ type: 'error', data: err.message });
        }
    }
};
