/**
 * 멀티모달 AI 어시스턴트 모듈 (V2: On-Device AI 지원)
 * 1. Online Mode: Groq/Hugging Face API 연동
 * 2. Offline Mode (On-Device): Transformers.js 기반 브라우저 내 구동 (API 키 불필요)
 */

export function initAIAssistant(supabase) {
    const aiTrigger = document.getElementById('ai-trigger');
    const aiPopup = document.getElementById('ai-popup');
    const closeChat = document.getElementById('close-chat');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatBody = document.getElementById('ai-chat-body');
    const statusText = document.querySelector('.status-indicator');

    if (!aiTrigger || !aiPopup) return;

    let aiWorker = null;
    let isModelLoading = false;
    let modelReady = false;

    // Web Worker 초기화
    function initWorker() {
        if (aiWorker) return;

        // 현재 스크립트 위치 기준으로 워커 경로 설정
        aiWorker = new Worker(new URL('./ai-worker.js', import.meta.url), { type: 'module' });

        aiWorker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'progress') {
                if (data.status === 'progress') {
                    statusText.innerText = `Status: Downloading... ${data.progress.toFixed(1)}%`;
                }
            } else if (type === 'ready') {
                modelReady = true;
                statusText.innerText = "Status: On-Device AI Active (Lightweight)";
                // 로딩 메시지 제거 로직은 호출부에서 처리
                document.dispatchEvent(new CustomEvent('ai-model-ready'));
            } else if (type === 'error') {
                statusText.innerText = "Status: Worker Error";
                console.error('Worker Error:', data);
            }
        };
    }

    // 팝업 열기/닫기
    aiTrigger.addEventListener('click', () => {
        aiPopup.classList.toggle('active');
        if (aiPopup.classList.contains('active')) {
            aiChatInput.focus();
            if (!aiWorker) initWorker();
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
     * [최초 실행] On-Device 모델 로드 요청
     */
    async function loadOnDeviceModel() {
        if (modelReady) return true;
        if (isModelLoading) return false;

        isModelLoading = true;
        const loader = createLoader('최적화된 로컬 모델 매칭 중 (SmolLM2-135M)...');
        statusText.innerText = "Status: Initializing AI Engine...";

        if (!aiWorker) initWorker();
        aiWorker.postMessage({ type: 'load' });

        return new Promise((resolve) => {
            const onReady = () => {
                loader.remove();
                addChatMessage('AI', "경량화된 로컬 모델이 준비되었습니다! 이제 UI 끊김 없이 대화할 수 있습니다.");
                document.removeEventListener('ai-model-ready', onReady);
                isModelLoading = false;
                resolve(true);
            };
            document.addEventListener('ai-model-ready', onReady);
        });
    }

    async function getLlama3BResponse(userQuery) {
        const GROQ_API_KEY = 'YOUR_GROQ_API_KEY';

        if (GROQ_API_KEY === 'YOUR_GROQ_API_KEY' || GROQ_API_KEY === '') {
            console.log('[AI] Handling via Web Worker (On-Device)');

            if (!modelReady) {
                await loadOnDeviceModel();
            }

            return new Promise((resolve) => {
                const handleMessage = (e) => {
                    if (e.data.type === 'result') {
                        aiWorker.removeEventListener('message', handleMessage);
                        resolve(e.data.data);
                    } else if (e.data.type === 'error') {
                        aiWorker.removeEventListener('message', handleMessage);
                        resolve("AI 생성 중 오류가 발생했습니다: " + e.data.data);
                    }
                };
                aiWorker.addEventListener('message', handleMessage);
                aiWorker.postMessage({ type: 'generate', text: userQuery });
            });
        }

        // Online Mode (Groq)
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
