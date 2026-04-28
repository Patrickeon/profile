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

    // API 연결 설정 완료

    // 👇 (향상된 부분) 추천 질문 칩 생성 함수 - 컨텍스트 인식 및 동적 제안
    function addSuggestionChips() {
        // 기존 칩 컨테이너가 있으면 제거 (중복 방지 및 깨끗한 상태 유지)
        const existingChips = document.querySelector('.suggestion-chips');
        if (existingChips) {
            existingChips.remove();
        }

        const chipsContainer = document.createElement('div');
        chipsContainer.classList.add('suggestion-chips');

        // 시간대나 컨텍스트에 따라 다른 제안 제공
        const hour = new Date().getHours();
        let suggestions = [];

        if (hour >= 6 && hour < 12) {
            // 아침: 학습 및 개발 관련 질문
            suggestions = [
                "🛠️ 오늘의 기술 스택 분석해줘",
                "📚 최근 학습 중인 기술은 뭐야?",
                "💡 현재 관심 있는 AI 트렌드는?",
                "🎨 /image futuristic workspace with holographic displays"
            ];
        } else if (hour >= 12 && hour < 18) {
            // 오후: 프로젝트 및 경력 관련 질문
            suggestions = [
                "📂 주요 프로젝트 요약해줘",
                "👨💻 Patrick은 어떤 성향의 개발자야?",
                "🚀 가장 도전적이었던 프로젝트는?",
                "🎨 /image cyberpunk city at night with neon lights"
            ];
        } else {
            // 저녁/밤: 반성 및 미래 지향 질문
            suggestions = [
                "🌟 오늘의 성찰: 배운 점은?",
                "🔮 미래 기술 로드맵은 어떻게 돼?",
                "📈 커리어 목표 및 방향성은?",
                "🎨 /image AI and human collaboration in the future"
            ];
        }

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
                // 칩은 제거하지 않고 그대로 유지 (다시 클릭 가능하도록)
                // 시각적 피드백 제공
                chip.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    chip.style.transform = 'scale(1)';
                }, 200);
            });

            // 칩 호버 효과 강화
            chip.addEventListener('mouseenter', () => {
                chip.style.transform = 'scale(1.05)';
            });

            chip.addEventListener('mouseleave', () => {
                chip.style.transform = 'scale(1)';
            });

            chipsContainer.appendChild(chip);
        });

        // AI 메시지 영역 하단에 칩 컨테이너 부착
        aiChatBody.appendChild(chipsContainer);

        // 스크롤을 최하로 유지
        aiChatBody.scrollTop = aiChatBody.scrollHeight;

        // 칩 컨테이너에 페이드인 효과 추가
        setTimeout(() => {
            chipsContainer.style.opacity = '1';
            chipsContainer.style.transform = 'translateY(0)';
        }, 50);
    }

    // 팝업 열기/닫기
    aiTrigger.addEventListener('click', () => {
        aiPopup.classList.toggle('active');
        if (aiPopup.classList.contains('active')) {
            aiChatInput.focus();

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
            // 마크다운 파싱 (marked 라이브러리 존재 여부 확인)
            let parsedText = text;
            try {
                if (window.marked && typeof window.marked.parse === 'function') {
                    parsedText = window.marked.parse(text);
                } else if (typeof marked === 'function') {
                    parsedText = marked(text);
                } else {
                    parsedText = text.replace(/\n/g, '<br>');
                }
            } catch (e) {
                console.error("Markdown parsing error:", e);
                parsedText = text.replace(/\n/g, '<br>');
            }
            content = `<div class="message-bubble markdown-body">${parsedText}</div>`;
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

    // Gemini/Groq 등 외부 API 프록시 (Supabase Edge Function 연동)

    async function getLlama3BResponse(userQuery) {

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
                let errorMsg = error.message;
                try {
                    if (error.context && typeof error.context.text === 'function') {
                        const errorText = await error.context.text();
                        console.error("[System] 에러 원문:", errorText);
                        const errorBody = JSON.parse(errorText);
                        errorMsg = errorBody.error || errorMsg;
                    }
                } catch (e) {
                    console.error("[System] 에러 파싱 실패:", e);
                }
                console.error('엣지 함수 에러 발생:', errorMsg);
                return `[단말기 오류] ${errorMsg}`;
            }

            // Groq API 응답 구조에 맞춰 결과 반환
            return data.choices[0].message.content;
        } catch (err) {
            console.error("AI 응답 처리 중 에러 (네트워크 혹은 서버 연결 실패):", err);
            return "죄송합니다. 현재 AI 서버(Supabase)에 연결할 수 없습니다. 호스팅 상태(프로젝트 일시 중지 등)를 확인해 주세요.";
        }

    }


    // ai-assistant.js 내 generateMedia 함수 수정
    async function generateMedia(type, prompt) {
        try {
            // responseType: 'blob' 옵션 제거 (JSON으로 받을 것이기 때문)
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { type, prompt }
            });

            // 에러 처리 로직
            if (error) {
                let errorMsg = error.message;
                try {
                    if (error.context && typeof error.context.text === 'function') {
                        const errorText = await error.context.text();
                        console.error("[System] 에러 원문:", errorText);
                        const errorBody = JSON.parse(errorText);
                        const detailsInfo = typeof errorBody.details === 'string' && errorBody.details.startsWith('{')
                            ? JSON.parse(errorBody.details).error
                            : errorBody.details;
                        errorMsg = detailsInfo || errorBody.error || errorMsg;
                    }
                } catch (e) {
                    console.error("[System] 에러 파싱 실패:", e);
                }

                if (errorMsg.includes('Token is expired') || errorMsg.includes('Invalid token')) {
                    errorMsg = 'Hugging Face 토큰이 만료되었거나 올바르지 않습니다.';
                }
                throw new Error(errorMsg);
            }

            // 💡 [핵심] FileReader와 Blob 로직을 전부 지우고, 바로 URL 반환!
            console.log(`[System] ${type} 데이터 수신 완료.`);
            return data.url;

        } catch (err) {
            console.error(`[System] ${type} 생성 실패:`, err.message);
            throw err;
        }
    }

    // 💡 향상된 타이핑 효과 함수 (커서 깜빡임 및 자연스러운 타이핑)
    async function typeWriterEffect(element, text, speed = 30) {
        element.innerHTML = '';
        let i = 0;

        // 커서 요소 생성
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.innerHTML = '|';

        return new Promise((resolve) => {
            function type() {
                if (i < text.length) {
                    // 줄바꿈 처리 및 텍스트 추가
                    element.innerHTML = text.substring(0, i + 1).replace(/\n/g, '<br>');
                    element.appendChild(cursor);
                    i++;

                    // 텍스트가 추가될 때마다 스크롤을 맨 아래로 자동 이동
                    const chatBody = document.getElementById('ai-chat-body');
                    if (chatBody) {
                        chatBody.scrollTop = chatBody.scrollHeight;
                    }

                    // 자연스러운 타이핑을 위한 랜덤 속도 변동
                    const randomSpeed = speed + Math.random() * 20;
                    setTimeout(type, randomSpeed);
                } else {
                    // 타이핑 완료 후 커서 제거 및 반짝임 효과
                    element.innerHTML = text.replace(/\n/g, '<br>');
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
                // 2. 일반 대화 (Supabase Edge Function API 연동)
                else {
                    loader = createLoader('AI 서버와 통신 중...');

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
                // 서버가 넘겨준 에러 메시지(err.message)를 텍스트로 출력합니다.
                addChatMessage('AI', `[System: Error] ${err.message}`);
                console.error("생성 에러:", err);
            }
        }
    });

}