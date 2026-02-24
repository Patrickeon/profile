/**
 * AI Worker (On-Device Inference Thread)
 * 이 스레드는 메인 UI 스레드와 분리되어 모델 로딩 및 텍스트 생성을 담당합니다.
 */
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// CDN 및 모델 접근 설정 최적화
env.allowLocalModels = false;
env.useBrowserCache = true;

let generator = null;
let currentModelName = ''; // 💡 수정 포인트: 현재 로드된 모델 이름을 추적할 변수 추가

// 메인 스레드로부터 메시지 수신
self.onmessage = async (e) => {
    // 방어적 코드: e.data가 비어있으면 무시
    if (!e || !e.data) return;

    const { type, text, options } = e.data;

    if (type === 'load') {
        try {
            if (!generator) {
                // 첫 번째 시도: GPT-2
                currentModelName = 'Xenova/gpt2';
                generator = await pipeline('text-generation', currentModelName, {
                    quantized: true,
                    progress_callback: (progress) => {
                        self.postMessage({ type: 'progress', data: progress });
                    }
                });
            }
            self.postMessage({ type: 'ready' });
        } catch (err) {
            console.error('Worker GPT2 Load Error:', err);
            // 두 번째 시도: Qwen 모델
            try {
                currentModelName = 'Xenova/Qwen1.5-0.5B-Chat';
                generator = await pipeline('text-generation', currentModelName, {
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
            // text가 undefined일 경우를 대비해 빈 문자열로 처리
            let prompt = text || '';

            // 💡 수정 포인트: generator.model_id 대신 currentModelName 사용
            if (currentModelName.includes('Qwen')) {
                prompt = `<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
            }

            const output = await generator(prompt, {
                max_new_tokens: options?.max_new_tokens || 128,
                temperature: options?.temperature || 0.7,
                do_sample: true,
            });

            // 💡 방어적 코드: output 배열과 generated_text가 정상적으로 있는지 확인
            let response = (output && output[0] && output[0].generated_text) ? output[0].generated_text : '';

            // response가 정상적인 문자열일 때만 includes 실행
            if (typeof response === 'string' && response.includes('assistant\n')) {
                response = response.split('assistant\n').pop().trim();
            }

            // 결과 전송
            self.postMessage({ type: 'result', data: response || "응답이 비어있습니다." });
        } catch (err) {
            self.postMessage({ type: 'error', data: err.message || "알 수 없는 생성 오류" });
        }
    }
};