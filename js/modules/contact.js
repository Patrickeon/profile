/**
 * 터미널 스타일 Contact 섹션 모듈
 * Supabase Edge Function (Resend API)을 통해 이메일을 전송합니다.
 */

export function initContact(supabase) {
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');

    if (!chatInput || !chatHistory) return;

    let chatStep = 0;
    let userData = { name: '', email: '', message: '' };

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function addMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message', sender === 'AI' ? 'ai-message' : 'user-message');
        msgDiv.innerHTML = `
            <span class="avatar">${sender}</span>
            <div class="message-bubble">${text}</div>
        `;
        chatHistory.appendChild(msgDiv);
        scrollToBottom();
    }

    let userHasInteracted = false;

    function aiRespond(text, delay = 1000) {
        chatInput.disabled = true;
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('chat-message', 'ai-message');
        loadingDiv.id = loadingId;
        loadingDiv.innerHTML = `
            <span class="avatar">AI</span>
            <div class="message-bubble code-font">typing<span class="cursor">|</span></div>
        `;
        chatHistory.appendChild(loadingDiv);
        scrollToBottom();

        setTimeout(() => {
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();
            addMessage('AI', text);
            chatInput.disabled = false;
            // 사용자가 먼저 입력한 경우에만 focus (페이지 자동 스크롤 방지)
            if (userHasInteracted) {
                chatInput.focus();
            }
        }, delay);
    }

    // 초기 인사말 — 이메일 전송임을 명확히 안내
    aiRespond(`[Secure Channel Active] 안녕하세요! 👋<br><br>
Patrick에게 이메일을 보내는 채널입니다.<br>
전송하실 <strong>메시지 내용</strong>을 입력해주세요.
(Message will be delivered to Patrick's inbox)`, 800);

    chatInput.addEventListener('keypress', function (e) {
        userHasInteracted = true; // 첫 입력 시 flag 활성화
        if (e.key === 'Enter' && this.value.trim() !== '') {
            const text = this.value.trim();
            addMessage('USER', text);
            this.value = '';

            switch (chatStep) {
                case 0:
                    userData.message = text;
                    aiRespond("메시지를 수신했습니다. 📨<br>성함(또는 닉네임)을 알려주시겠어요?", 1200);
                    chatStep++;
                    break;
                case 1:
                    userData.name = text;
                    aiRespond(`반갑습니다, <strong>${userData.name}</strong>님! 📬<br>Patrick의 답변을 받으실 <strong>이메일 주소</strong>를 입력해 주세요.`, 1000);
                    chatStep++;
                    break;
                case 2:
                    userData.email = text;
                    aiRespond(`[System] 데이터 패킷 암호화 중...<br>보안 채널을 통해 Patrick에게 이메일을 전송합니다. ✉️`, 1500);
                    chatInput.placeholder = "전송 중...";
                    chatInput.disabled = true;

                    // ✅ aiRespond 1500ms 딜레이 이후에 실행 (메시지 순서 보장)
                    setTimeout(() => {
                        if (supabase) {
                            supabase
                                .from('contacts')
                                .insert({
                                    from_name: userData.name,
                                    from_email: userData.email,
                                    message: userData.message,
                                })
                                .then(({ error }) => {
                                    if (error) {
                                        console.error('[Contact] DB Error:', error);
                                        window.location.href = `mailto:01051188129e@gmail.com?subject=Contact from ${encodeURIComponent(userData.name)}&body=${encodeURIComponent(userData.message)}`;
                                        addMessage('AI', `<span style="color:#ffcc00">[FALLBACK]</span> 메일 앱을 열었습니다. 전송 버튼을 눌러주세요.`);
                                    } else {
                                        addMessage('AI', `<span style="color:var(--neon-blue)">[SUCCESS] ✅ 메시지가 성공적으로 전달되었습니다!</span><br>Patrick이 빠른 시일 내에 연락드릴 것입니다.<br><br>감사합니다, <strong>${userData.name}</strong>님! 🙏`);
                                        chatInput.placeholder = "메시지가 전달되었습니다.";
                                    }
                                });
                        } else {
                            window.location.href = `mailto:01051188129e@gmail.com?subject=Contact from ${encodeURIComponent(userData.name)}&body=${encodeURIComponent(userData.message)}`;
                            addMessage('AI', "[FALLBACK] 메일 앱을 열었습니다. 전송 버튼을 눌러주세요.");
                        }
                    }, 1700); // aiRespond delay(1500ms) + 여유 200ms

                    chatStep++;
                    break;
                default:
                    break;
            }
        }
    });
}
