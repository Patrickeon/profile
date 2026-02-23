/**
 * 멀티모달 AI 어시스턴트 모듈 (V2: On-Device AI 지원)
 * 1. Online Mode: Groq/Hugging Face API 연동
 * 2. Offline Mode (On-Device): Transformers.js 기반 브라우저 내 구동 (API 키 불필요)
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// CDN 환경에서 로컬 경로 대신 HF 허브 사용 설정
env.allowLocalModels = false;

export function initAIAssistant(supabase) {
    const aiTrigger = document.getElementById('ai-trigger');
    const aiPopup = document.getElementById('ai-popup');
    const closeChat = document.getElementById('close-chat');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatBody = document.getElementById('ai-chat-body');
    const statusText = document.querySelector('.status-indicator');

    if (!aiTrigger || !aiPopup) return;

    let generator = null; // On-Device 모델 인스턴스
    let isModelLoading = false;

    // 팝업 열기/닫기
    aiTrigger.addEventListener('click', () => {
        aiPopup.classList.toggle('active');
        if (aiPopup.classList.contains('active')) {
            aiChatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        aiPopup.classList.remove('active');
    });

    // 메시지 UI 추가
    function addChatMessage(sender, text, type = 'text') {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message', sender === 'AI' ? 'ai-message' : 'user-message');

        let content = '';
        if (type === 'image') {
            content = `<div class="message-bubble"><img src="${text}" class="ai-generated-image" alt="Generated Image" onclick="window.open('${text}')"></div>`;
        } else if (type === 'audio') {
            content = `<div class="message-bubble"><audio controls class="ai-audio-player"><source src="${text}" type="audio/mpeg"></audio></div>`;
        } else {
            // 줄바꿈 보존
            content = `<div class="message-bubble">${text.replace(/\n/g, '<br>')}</div>`;
        }

        msgDiv.innerHTML = content;
        aiChatBody.appendChild(msgDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }

    // 로딩 인디케이터
    function createLoader(message) {
        const loaderDiv = document.createElement('div');
        loaderDiv.classList.add('chat-message', 'ai-message', 'loading-msg');
        loaderDiv.innerHTML = `
            <div class="message-bubble">
                <div class="loading-container">
                    <div class="ai-spinner"></div>
                    <span class="code-font" style="font-size:0.7rem;">${message}</span>
                </div>
            </div>`;
        aiChatBody.appendChild(loaderDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
        return loaderDiv;
    }

    /**
     * [핵심] On-Device AI 모델 로드 (최초 호출 시 실행)
     */
    async function loadOnDeviceModel() {
        if (generator) return generator;
        if (isModelLoading) return null;

        isModelLoading = true;
        const loader = createLoader('매칭 중: On-Device Model (SmolLM-135M)...');
        statusText.innerText = "Status: Loading Local AI Engine...";

        try {
            // 초소형 모델 로드 (SmolLMv2 135M) - 공식 ONNX 커뮤니티 경로로 수정
            generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX');
            loader.remove();
            addChatMessage('AI', "시스템 연결 완료. 이제 서버 없이도 대화가 가능합니다! (On-Device Mode 활성화)");
            statusText.innerText = "Status: On-Device AI Active (Keyless)";
            isModelLoading = false;
            return generator;
        } catch (err) {
            console.error('On-Device Model Load Error:', err);
            loader.remove();
            addChatMessage('AI', "로컬 모델 로드에 실패했습니다. API 키 모드를 권장합니다.");
            isModelLoading = false;
            return null;
        }
    }

    // API 연동 로직 (Online Mode)
    async function getLlama3BResponse(userQuery) {
        // [IMPORTANT] 여기에 실제 Groq API 키를 넣으시면 온라인 모드가 활성화됩니다.
        const GROQ_API_KEY = 'YOUR_GROQ_API_KEY';

        // 키가 기본값이면 'On-Device(Keyless)' 모드로 실행
        if (GROQ_API_KEY === 'YOUR_GROQ_API_KEY' || GROQ_API_KEY === '') {
            console.log('[AI] Running in On-Device (Keyless) Mode');
            const localGen = await loadOnDeviceModel();
            if (localGen) {
                const output = await localGen(userQuery, {
                    max_new_tokens: 128,
                    temperature: 0.7,
                    repetition_penalty: 1.2
                });
                return output[0].generated_text;
            }
            return "On-Device 모델 로딩 중입니다. 잠시만 기다려 주세요...";
        }

        // ... 기존 Groq API 호출 로직 ...
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.2-3b-preview",
                messages: [{ role: "user", content: userQuery }],
                temperature: 0.7
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 입력 처리
    aiChatInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && aiChatInput.value.trim() !== '') {
            const query = aiChatInput.value.trim();
            addChatMessage('USER', query);
            aiChatInput.value = '';

            let loader;
            try {
                if (query.startsWith('/image ')) {
                    addChatMessage('AI', "이미지 생성은 Hugging Face API 키(Online)가 필요합니다.");
                } else if (query.startsWith('/music ')) {
                    addChatMessage('AI', "음악 생성은 Hugging Face API 키(Online)가 필요합니다.");
                } else {
                    loader = createLoader('AI가 생각하는 중...');
                    const response = await getLlama3BResponse(query);
                    loader.remove();
                    addChatMessage('AI', response);
                }
            } catch (err) {
                if (loader) loader.remove();
                addChatMessage('AI', "죄송합니다. 처리 중 오류가 발생했습니다.");
                console.error(err);
            }
        }
    });
}
