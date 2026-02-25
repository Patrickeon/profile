/**
 * 멀티모달 AI 어시스턴트 모듈 (V2: On-Device AI 지원)
 * 1. Online Mode: Groq/Hugging Face API 연동
 * 2. Offline Mode (On-Device): Transformers.js 기반 브라우저 내 구동 (API 키 불필요)
 */
import { HfInference } from 'https://esm.sh/@huggingface/inference';

export function initAIAssistant(supabase) {
    // 💡 가장 먼저 로그를 찍어보세요.
    console.log('[AI-Module] 전달받은 supabase 객체:', supabase);

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

        aiWorker = new Worker(new URL('./ai-worker.js', import.meta.url), { type: 'module' });

        aiWorker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === 'progress') {
                if (data && data.status === 'progress' && data.progress !== undefined) {
                    statusText.innerText = `Status: Downloading... ${data.progress.toFixed(1)}%`;
                }
            } else if (type === 'ready') {
                modelReady = true;
                statusText.innerText = "Status: On-Device AI Active (Lightweight)";
                document.dispatchEvent(new CustomEvent('ai-model-ready'));
            } else if (type === 'error') {
                statusText.innerText = "Status: Worker Error";
                // data가 객체일 수도 있고 문자열일 수도 있으므로 안전하게 처리
                const errorMessage = data === undefined ? 'No error details received' : (typeof data === 'string' ? data : JSON.stringify(data));
                console.error('Worker Error:', errorMessage);
            }
        };
    }

    // 👇 (새로 추가할 부분) 추천 질문 칩 생성 함수
    function addSuggestionChips() {
        // 이미 칩이 생성되어 있다면 중복 생성 방지
        if (document.querySelector('.suggestion-chips')) return;

        const chipsContainer = document.createElement('div');
        chipsContainer.classList.add('suggestion-chips');

        // 방문자에게 유도할 추천 질문 리스트
        const suggestions = [
            "🛠️ 주요 기술 스택은 뭐야?",
            "📂 주요 프로젝트 요약해줘",
            "👨💻 Patrick은 어떤 성향의 개발자야?",
            "🎨 /image 사이버펑크 도시",
            "🎵 /music 미래지향적 비트"
        ];

        suggestions.forEach(text => {
            const chip = document.createElement('button');
            chip.classList.add('suggestion-chip');
            chip.innerText = text;

            chip.addEventListener('click', () => {
                const cleanText = text.replace(/^[^\s]+\s/, ''); // 이모지 제거
                const aiChatInput = document.getElementById('ai-chat-input');
                aiChatInput.value = cleanText;

                // 엔터 키 이벤트 강제 발생시켜 메시지 전송
                const enterEvent = new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true });
                aiChatInput.dispatchEvent(enterEvent);
                chipsContainer.style.display = 'none'; // 클릭 후 숨김
            });
            chipsContainer.appendChild(chip);
        });

        // 첫 번째 AI 웰컴 메시지 하단에 칩 컨테이너 부착
        const firstMessage = aiChatBody.querySelector('.ai-message .message-bubble');
        if (firstMessage) {
            firstMessage.parentElement.appendChild(chipsContainer);
        }
    }

    // 팝업 열기/닫기 (이 부분을 아래처럼 수정)
    aiTrigger.addEventListener('click', () => {
        aiPopup.classList.toggle('active');
        if (aiPopup.classList.contains('active')) {
            aiChatInput.focus();
            if (!aiWorker) initWorker();

            // 👇 팝업이 열릴 때 추천 칩 생성 함수 호출
            addSuggestionChips();
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
            content = `
                <div class="message-bubble">
                    <img src="${text}" class="ai-generated-image" alt="AI Generated" style="width:100%; border-radius:8px;">
                    <p style="font-size:0.7rem; margin-top:5px; color:var(--neon-blue);">> Image Generated via FLUX.1</p>
                </div>`;
        } else if (type === 'audio') {
            content = `
                <div class="message-bubble">
                    <audio controls style="width:100%; margin-top:5px;">
                        <source src="${text}" type="audio/mpeg">
                    </audio>
                    <p style="font-size:0.7rem; margin-top:5px; color:var(--neon-purple);">> Audio Synthesized via MusicGen</p>
                </div>`;
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
        // const GROQ_API_KEY = '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';

        // 💡 방어적 코드 추가: supabase 객체가 없으면 로컬 모드로 폴백하거나 에러 출력
        if (!supabase) {
            console.error("Supabase client is not initialized. Check your API keys.");
            return "시스템 연결 설정(Supabase)이 완료되지 않았습니다.";
        }
        // Online Mode (Groq API 사용)
        try {
            // 👇 AI에게 학습시킬 '나의 정보(대본)'를 변수로 만듭니다.
            // 👇 [Step 3 핵심] Patrick의 데이터를 AI에게 주입합니다.
            const myProfileInfo = `
                너는 8년 차 Full-Stack AI Engineer 'Patrick(김건훈)'의 포트폴리오 사이트를 안내하는 전용 AI 시스템 'Logon-AI'야.
                방문자가 Patrick에 대해 물어보면 아래의 [데이터베이스]를 바탕으로 전문적이고 자신감 있게 답변해줘.

                [데이터베이스: Patrick 프로필]
                - 이름: Patrick (김건훈) / 생년월일: 1994.01.20
                - 경력: 총 8년 차 (2016~2026). 2012년부터 공정 자동화 설비 개발 시작.
                - 핵심 가치: 복잡한 AI 로직을 유저 친화적인 UX로 풀어내는 브릿지(Bridge) 역할 수행.

                [데이터베이스: 기술 스택 (Skill Tree)]
                - Backend: Java, Spring Boot, Node.js, Python, Meteor.js
                - Frontend: JavaScript, React.js, Vue.js, Svelte.js, jQuery
                - Mobile: Flutter, React Native, Expo
                - Database: MySQL, MariaDB, MongoDB, Oracle, PostgreSQL, Neo4j
                - AI/Tools: LLM RAG 파이프라인 구축, n8n, Flowise

                [데이터베이스: 주요 프로젝트 타임라인]
                - 2024~2026: 페르소나 AI에서 자체 Gen AI 솔루션 개발. 하나캐피탈, 세라젬, KERIS, 코닝정밀소재 LLM 챗봇 구축. 삼성바이오로직스 G.AI 문서표준화 플랫폼.
                - 2021~2024: STO 플랫폼(갤럭시아머니트리), 헬스케어 앱(메디아이오티), 살방 앱 구축.
                - 2016~2019: 롯데/우리카드/CJ오쇼핑 AI 챗봇 솔루션 개발.

                [말투 및 규칙]
                1. 웹사이트의 터미널 테마에 맞춰 "[System] 검색 완료..." 같은 표현을 섞어줘.
                2. 없는 사실을 지어내지 마. 모르는 건 "Contact 섹션에서 Patrick에게 직접 문의해주세요"라고 안내해.
                3. 한국어로 질문하면 한국어로, 영어로 질문하면 영어로 친절하게 답해줘.
            `;

            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: {
                    type: 'text',
                    prompt: [
                        { role: "system", content: myProfileInfo },
                        { role: "user", content: userQuery }
                    ]
                }
            });

            if (error) {
                console.error('에러 발생:', error);
                return "죄송합니다. 서버 연결에 실패했습니다.";
            }

            // Groq API 응답 구조에 맞춰 결과 반환
            return data.choices[0].message.content;
        } catch (err) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

    }

    // 허깅페이스 API 호출 함수
    async function generateAIContent(type, prompt) {
        const HF_TOKEN = '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'; // 발급받은 토큰

        // 모델 설정
        const model = type === 'image'
            ? 'black-forest-labs/FLUX.1-schnell' // 이미지 생성 (매우 빠름)
            : 'facebook/musicgen-small';         // 음악 생성

        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            headers: { Authorization: `Bearer ${HF_TOKEN}` },
            method: "POST",
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) throw new Error("AI 생성 실패");

        const blob = await response.blob();
        return URL.createObjectURL(blob); // 생성된 파일의 임시 URL 반환
    }

    // ai-assistant.js 내 generateMedia 함수 수정
    async function generateMedia(type, prompt) {
        try {
            // 💡 핵심: responseType을 'blob'으로 지정하여 바이너리 데이터를 명확히 요청합니다.
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { type, prompt },
                responseType: 'blob'
            });

            // 💡 400 에러 등이 발생했을 때 처리
            if (error) {
                let errorMsg = error.message;
                try {
                    // error.context가 Response 객체인 경우
                    if (error.context && typeof error.context.text === 'function') {
                        const errorText = await error.context.text();
                        console.error("[System] 에러 원문:", errorText);
                        const errorBody = JSON.parse(errorText);

                        // 자세한 에러 메시지를 얻기 위함
                        const detailsInfo = typeof errorBody.details === 'string' && errorBody.details.startsWith('{')
                            ? JSON.parse(errorBody.details).error
                            : errorBody.details;

                        errorMsg = detailsInfo || errorBody.error || errorMsg;
                    }
                } catch (e) {
                    console.error("[System] 에러 파싱 실패:", e);
                }

                if (errorMsg.includes('Token is expired') || errorMsg.includes('Invalid token')) {
                    errorMsg = 'Hugging Face 토큰이 만료되었거나 올바르지 않습니다. (Supabase 환경변수 HF_TOKEN을 확인해주세요)';
                }
                throw new Error(errorMsg);
            }

            // 2. 강제로 Blob 생성
            const finalBlob = new Blob([data], { type: type === 'image' ? 'image/jpeg' : 'audio/mpeg' });
            console.log(`[System] 가벼운 모델로부터 ${finalBlob.size} 바이트 수신 성공.`);

            // 3. 404가 절대 날 수 없는 Base64(Data URL)로 변환
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(finalBlob);
            });

            // 2. 💡 [핵심] 수신된 데이터를 강제로 Blob으로 만듭니다. 
            // ArrayBuffer로 왔든, 이미 Blob이든 상관없이 이 코드가 처리합니다.
            // const finalBlob = new Blob([data], { type: type === 'image' ? 'image/png' : 'audio/mpeg' });

            // console.log(`[System] 데이터 확보 완료 (크기: ${finalBlob.size} 바이트)`);

            // // 3. FileReader를 통해 404 에러가 절대 날 수 없는 Data URL로 변환합니다.
            // return new Promise((resolve, reject) => {
            //     const reader = new FileReader();

            //     reader.onloadend = () => {
            //         const base64Data = reader.result;
            //         // 변환된 데이터가 너무 짧으면 이미지 생성 실패로 간주
            //         if (base64Data.length < 500) {
            //             reject(new Error("데이터가 너무 작아 정상적인 이미지로 변환할 수 없습니다."));
            //         } else {
            //             console.log(`[System] Base64 변환 성공. 주소 생성 완료.`);
            //             resolve(base64Data);
            //         }
            //     };

            //     reader.onerror = () => {
            //         console.error("[System] FileReader 에러 발생");
            //         reject(new Error("바이너리 데이터를 읽는 중 오류가 발생했습니다."));
            //     };

            //     // 이제 finalBlob은 확실히 Blob 타입이므로 에러가 나지 않습니다.
            //     reader.readAsDataURL(finalBlob);
            // });

        } catch (err) {
            console.error(`[System] ${type} 생성 실패:`, err.message);
            throw err;
        }
    }

    // 💡 타이핑 효과 함수 (새로 추가)
    async function typeWriterEffect(element, text, speed = 20) {
        element.innerHTML = '';
        let i = 0;
        return new Promise((resolve) => {
            function type() {
                if (i < text.length) {
                    // 줄바꿈 처리 포함
                    element.innerHTML = text.substring(0, i + 1).replace(/\n/g, '<br>') + '<span class="cursor">|</span>';
                    i++;
                    setTimeout(type, speed);
                } else {
                    element.innerHTML = text.replace(/\n/g, '<br>'); // 커서 제거
                    resolve();
                }
            }
            type();
        });
    }

    // 입력 처리 루틴 수정 (ai-assistant.js 내 keypress 이벤트)
    aiChatInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && aiChatInput.value.trim() !== '') {
            const query = aiChatInput.value.trim();
            addChatMessage('USER', query);
            aiChatInput.value = '';

            let loader;
            try {
                // 1. 이미지 생성 명령어 (/image)
                if (query.startsWith('/image ')) {
                    const prompt = query.replace('/image ', '');
                    loader = createLoader(`이미지 생성 프로토콜 가동: "${prompt}"...`);
                    const imageUrl = await generateMedia('image', prompt); // Step 4에서 구현
                    loader.remove();
                    addChatMessage('AI', imageUrl, 'image');
                }
                // 2. 음악 생성 명령어 (/music)
                else if (query.startsWith('/music ')) {
                    const prompt = query.replace('/music ', '');
                    loader = createLoader(`오디오 데이터 합성 중: "${prompt}"...`);
                    const audioUrl = await generateMedia('music', prompt); // Step 4에서 구현
                    loader.remove();
                    addChatMessage('AI', audioUrl, 'audio');
                }
                // 3. 일반 대화 (Groq)
                else {
                    loader = createLoader('데이터 패킷 분석 중...');
                    const response = await getLlama3BResponse(query);
                    loader.remove();

                    const msgDiv = document.createElement('div');
                    msgDiv.classList.add('chat-message', 'ai-message');
                    const bubble = document.createElement('div');
                    bubble.classList.add('message-bubble');
                    msgDiv.appendChild(bubble);
                    document.getElementById('ai-chat-body').appendChild(msgDiv);

                    await typeWriterEffect(bubble, response); // 타이핑 효과 적용
                }
            } catch (err) {
                if (loader) loader.remove();
                addChatMessage('AI', "[System: Error] 연결 오류가 발생했습니다.");
                console.error(err);
            }
        }
    });

}