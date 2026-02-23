# API 키 없는 'On-Device AI' 구현 가이드

패트릭님, API 키를 전혀 사용하지 않고 AI 모델을 구동하는 가장 확실한 방법은 사용자의 **웹 브라우저(GPU)를 서버처럼 활용**하는 것입니다. 이를 **"On-Device AI"**라고 부릅니다.

---

## 1. 핵심 기술: Transformers.js (WebGPU)
Hugging Face에서 만든 이 라이브러리를 사용하면, 서버 없이 브라우저 안에서 AI 모델을 직접 돌릴 수 있습니다.

-   **작동 방식:** 사용자가 페이지에 접속하면 AI 모델 파일(약 100~300MB)을 한 번 다운로드하고, 그 다음부터는 사용자의 그래픽 카드(WebGPU)를 빌려 답변을 생성합니다.
-   **장점:** 
    -   API 키가 100% 필요 없습니다.
    -   서버 비용이 평생 0원입니다.
    -   데이터가 외부로 나가지 않아 보안이 완벽합니다.
-   **추천 모델:** `HuggingFaceTB/SmolLM2-135M-Instruct` (약 270MB로 가벼우면서도 똑똑함)

---

## 2. 구현 예시 코드 (HTML/JS 추가)

포트폴리오의 `index.html`에 아래 스크립트를 추가하면 키 없이 챗봇 대화가 가능해집니다.

```javascript
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';

// 1. 모델 로드 (최초 1회 다운로드 발생)
const generator = await pipeline('text-generation', 'Xenova/SmolLM-135M-Instruct');

// 2. 답변 생성 (서버 통신 없음!)
const output = await generator('Hello, who are you?', {
    max_new_tokens: 50,
    temperature: 0.7,
});

console.log(output[0].generated_text);
```

---

## 3. 다른 대안: 내 PC를 서버로 쓰기 (Ollama)
만약 패트릭님의 PC 성능이 좋다면, PC에 모델을 올려두고 포트폴리오에서 그 PC의 API를 쓰게 할 수도 있습니다.

1.  **Ollama 설치:** 내 PC에 Llama 3B 같은 모델을 설치합니다.
2.  **터널링 (ngrok):** 외부 URL을 생성하여 포트폴리오 웹사이트가 내 PC의 Ollama와 통신하게 합니다.
3.  **결과:** API 키를 발급받을 필요 없이 내가 가진 모델을 그대로 활용합니다.

---

## 4. 최종 추천
> [!IMPORTANT]
> **"포트폴리오"** 용도로 가장 추천드리는 'No Key' 방식은 **Transformers.js**입니다. 
> 방문자가 접속했을 때 "패트릭님의 포트폴리오는 사용자 기기의 성능을 활용해 서버 없이 작동하는 On-Device AI 기술이 적용되었습니다"라는 문구를 띄워주면, 기술적으로도 매우 깊이 있는 개발자라는 인상을 줄 수 있기 때문입니다.

이 방식을 실제 `ai-assistant.js`에 적용해 드릴까요? (모델 다운로드 시간이 좀 걸릴 수 있다는 점만 참고해 주세요!)
