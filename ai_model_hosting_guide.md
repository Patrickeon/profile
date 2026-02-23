# 멀티모달 AI 모델 통합 및 서버 호스팅 가이드

이 가이드는 패트릭님의 포트폴리오에 **3B LLM(텍스트)**, **이미지 생성**, **음악 생성** 기능을 추가하기 위한 기술적 방안과 무료 호스팅 서버 정보를 담고 있습니다.

---

## 1. 요청하신 3가지 AI 모델 구성 제안

| 기능 | 권장 소형 모델 (Small Model) | 추천 API / 호스팅 서비스 |
| :--- | :--- | :--- |
| **3B 수준 LLM** | Llama 3.2 3B, SmolLM-1.7B | **Groq Cloud** (초고속 API, 무료 체험 가능) |
| **이미지 생성** | SDXL Turbo, Stable Diffusion v1.5 | **Cloudflare Workers AI** or **Hugging Face Inference** |
| **음악 생성** | MusicGen (Small), AudioCraft | **Hugging Face Spaces** (Gradio 기반 무료 호스팅) |

---

## 2. 무료 호스팅 서버 및 서비스 추천

소형 모델을 올리고 외부에서 호출할 수 있는 최고의 무료(또는 프리티어) 서비스들입니다.

### ① Groq Cloud (가장 추천 - 텍스트/LLM)
- **장점:** LPU 기술을 사용하여 응답 속도가 세계에서 가장 빠릅니다. Llama 3.2 3B 모델을 무료 API로 제공합니다.
- **용도:** 포트폴리오 내 메인 챗봇용.
- **URL:** [groq.com](https://groq.com/)

### ② Hugging Face Spaces (모델 직접 호스팅)
- **장점:** Python(Gradio/Streamlit) 코드로 모델을 직접 올릴 수 있습니다. "CPU Basic" 티어가 무료이며 16GB RAM을 제공하여 소형 모델(3B) 구동이 가능합니다.
- **용도:** 음악 생성 및 이미지 생성 데모용.
- **URL:** [huggingface.co/spaces](https://huggingface.co/spaces)

### ③ Cloudflare Workers AI (서버리스 AI)
- **장점:** 별도의 서버 관리 없이 API 호출만으로 Meta, Mistral 등의 모델을 사용할 수 있습니다. 무료 티어 범위가 넓습니다.
- **용도:** 고정 비용 없는 가벼운 AI 추론.
- **URL:** [workers.cloudflare.com/ai](https://workers.cloudflare.com/ai)

### ④ Vercel AI SDK (프론트엔드 통합)
- **장점:** Next.js와 연동하여 AI 응답을 스트리밍으로 전달하기 매우 쉽고 배포가 무료입니다.

---

## 3. 웹사이트 적용 가이드 (Step-by-Step)

### Step 1: API 키 발급
각 서비스에서 API Key를 발급받아 환경 변수로 설정합니다. (프론트엔드 호출 시에는 Proxy 서버나 Vercel Edge Function 권장)

### Step 2: 클라이언트 연동 (JavaScript)
`js/modules/ai-assistant.js` 파일에 아래와 같이 멀티모달 분기 로직을 추가합니다.

```javascript
// 예시 분기 로직
async function handleSpecialCommands(query) {
    if (query.startsWith('/image')) {
        // 이미지 생성 API 호출 (Cloudflare or Hugging Face)
        return await generateImage(query.replace('/image', ''));
    } else if (query.startsWith('/music')) {
        // 음악 생성 API 호출
        return await generateMusic(query.replace('/music', ''));
    } else {
        // 일반 텍스트 챗봇 (Groq 3B 모델) 호출
        return await getLlama3BResponse(query);
    }
}
```

### Step 3: 브라우저 내 직접 구동 (Zero Hosting 비용)
가장 스마트한 방법은 **WebGPU**를 사용하여 사용자의 브라우저 성능으로 모델을 돌리는 것입니다.
- **Transformers.js (v3):** Llama 3B 모델을 브라우저에 다운로드하여 로컬에서 즉시 구동할 수 있게 해줍니다. 서버 비용이 **0원**입니다.

---

## 4. 추가 팁: 로컬 서버 구축을 원하신다면
나중에 성능 좋은 PC가 있다면 **Ollama**를 설치하고, **ngrok** 또는 **Cloudflare Tunnel**을 통해 외부(포트폴리오 페이지)에서 접속 가능하게 터널링할 수 있습니다.

> [!TIP]
> 포트폴리오의 특성상 응답 속도가 생명이므로, 직접 호스팅하기보다는 **Groq(텍스트)**과 **Cloudflare(이미지)** API를 조합하는 것이 가장 전문적으로 보입니다!
