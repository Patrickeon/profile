/**
 * 터미널 스타일 Contact 섹션 모듈
 * 사용자로부터 메시지를 입력받아 EmailJS 등을 통해 전송합니다.
 */

export function initContact() {
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
            chatInput.focus();
        }, delay);
    }

    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            const text = this.value.trim();
            addMessage('USER', text);
            this.value = '';

            switch (chatStep) {
                case 0:
                    userData.message = text;
                    aiRespond("메시지를 정상적으로 수신했습니다. 기록을 위해 성함(또는 닉네임)을 알려주시겠어요?", 1200);
                    chatStep++;
                    break;
                case 1:
                    userData.name = text;
                    aiRespond(`반갑습니다, ${userData.name}님. 답변을 받으실 수 있는 이메일 주소를 입력해 주세요.`, 1000);
                    chatStep++;
                    break;
                case 2:
                    userData.email = text;
                    aiRespond(`[System Logged]<br>데이터 패킷 준비 완료. 보안 연결(SMTP)을 통해 메일을 전송합니다...`, 1500);
                    chatInput.placeholder = "메일 전송 중...";
                    chatInput.disabled = true;

                    // EmailJS 연동 로직 (필요 시 init 호출)
                    if (window.emailjs) {
                        const templateParams = {
                            from_name: userData.name,
                            from_email: userData.email,
                            message: userData.message,
                            to_email: "01051188129e@gmail.com"
                        };

                        window.emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
                            .then(() => {
                                addMessage('AI', `<span style="color:var(--neon-blue)">[SUCCESS]</span> 메일이 성공적으로 전송되었습니다.`);
                                chatInput.placeholder = "연결이 종료되었습니다.";
                            })
                            .catch((err) => {
                                console.error('EmailJS Error:', err);
                                addMessage('AI', `<span style="color:#ff5f56">[ERROR]</span> 전송 실패. 01051188129e@gmail.com으로 연락주세요.`);
                                chatInput.placeholder = "전송 실패 (Closed)";
                            });
                    } else {
                        // SDK 미로드 시 mailto 폴백
                        setTimeout(() => {
                            window.location.href = `mailto:01051188129e@gmail.com?subject=Contact&body=${userData.message}`;
                            addMessage('AI', "[FALLBACK] 메일 앱을 준비했습니다. 전송 버튼을 눌러주세요.");
                        }, 2000);
                    }
                    chatStep++;
                    break;
                default:
                    break;
            }
        }
    });
}
