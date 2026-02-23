document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Initialize tsParticles (Neural Network)
    // ==========================================
    tsParticles.load("particle-canvas", {
        fpsLimit: 60,
        interactivity: {
            events: {
                onHover: {
                    enable: true,
                    mode: "grab" // Lines stretch to mouse
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 200,
                    links: {
                        opacity: 0.8,
                        color: "#00f3ff"
                    }
                }
            }
        },
        particles: {
            color: {
                value: ["#00f3ff", "#9d00ff", "#ffffff"]
            },
            links: {
                color: "rgba(255, 255, 255, 0.2)",
                distance: 150,
                enable: true,
                opacity: 0.5,
                width: 1
            },
            move: {
                direction: "none",
                enable: true,
                outModes: {
                    default: "bounce"
                },
                random: false,
                speed: 1,
                straight: false
            },
            number: {
                density: {
                    enable: true,
                    area: 800
                },
                value: 80
            },
            opacity: {
                value: 0.6
            },
            shape: {
                type: "circle"
            },
            size: {
                value: { min: 1, max: 3 }
            }
        },
        detectRetina: true
    });

    // ==========================================
    // 2. Typing Effect & Glitch Setup
    // ==========================================
    const glitchElement = document.querySelector('.glitch-text');
    if (glitchElement) {
        // Prepare the element
        const fullText = "> System Initialized...";
        glitchElement.innerHTML = ''; // Clear fallback text

        let i = 0;
        const typeSpeed = 100; // ms per character

        function typeWriter() {
            if (i < fullText.length) {
                // Add character and the blinking cursor
                glitchElement.innerHTML = fullText.substring(0, i + 1) + '<span class="cursor">|</span>';
                i++;
                // Random variation in typing speed for realism
                setTimeout(typeWriter, typeSpeed + Math.random() * 50);
            } else {
                // Done typing, leave cursor blinking
                glitchElement.innerHTML = fullText + '<span class="cursor">|</span>';
                // Trigger occasional glitch class
                setInterval(() => {
                    glitchElement.classList.add('active-glitch');
                    setTimeout(() => glitchElement.classList.remove('active-glitch'), 200);
                }, 3000);
            }
        }

        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }

    // ==========================================
    // 3. Skill Graph Interactivity
    // ==========================================
    const skillGraph = document.getElementById('skill-graph');
    const svgLayer = document.getElementById('skill-links-svg');
    const nodes = document.querySelectorAll('.skill-node');
    const links = []; // Store link references { sourceId, targetId, lineEl }

    if (skillGraph && svgLayer && nodes.length > 0) {
        // Function to draw lines based on data-connects-to
        function drawLinks() {
            svgLayer.innerHTML = ''; // Clear existing
            links.length = 0;

            const graphRect = skillGraph.getBoundingClientRect();

            nodes.forEach(sourceNode => {
                const sourceId = sourceNode.dataset.id;
                const connectsTo = sourceNode.dataset.connectsTo;

                if (connectsTo) {
                    const targets = connectsTo.split(',').map(t => t.trim()).filter(Boolean);

                    targets.forEach(targetId => {
                        const targetNode = document.querySelector(`.skill-node[data-id="${targetId}"]`);
                        if (targetNode) {
                            // Calculate center points relative to the container
                            const sRect = sourceNode.getBoundingClientRect();
                            const tRect = targetNode.getBoundingClientRect();

                            const x1 = sRect.left - graphRect.left + (sRect.width / 2);
                            const y1 = sRect.top - graphRect.top + (sRect.height / 2);
                            const x2 = tRect.left - graphRect.left + (tRect.width / 2);
                            const y2 = tRect.top - graphRect.top + (tRect.height / 2);

                            // Create SVG Line
                            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                            line.setAttribute('x1', x1);
                            line.setAttribute('y1', y1);
                            line.setAttribute('x2', x2);
                            line.setAttribute('y2', y2);
                            line.classList.add('skill-line');

                            svgLayer.appendChild(line);
                            links.push({ sourceId, targetId, lineEl: line });
                        }
                    });
                }
            });
        }

        // Draw initial links
        // Small delay to ensure CSS layout is computed
        setTimeout(drawLinks, 100);
        window.addEventListener('resize', drawLinks);

        // Hover Interactions
        nodes.forEach(node => {
            node.addEventListener('mouseenter', () => {
                skillGraph.classList.add('has-active-node');
                node.classList.add('active');

                const nodeId = node.dataset.id;

                // Highlight connected nodes and lines
                links.forEach(link => {
                    if (link.sourceId === nodeId || link.targetId === nodeId) {
                        link.lineEl.classList.add('active');
                        // Make the connected node active too
                        const connectedNodeId = link.sourceId === nodeId ? link.targetId : link.sourceId;
                        document.querySelector(`.skill-node[data-id="${connectedNodeId}"]`).classList.add('active');
                    }
                });
            });

            node.addEventListener('mouseleave', () => {
                skillGraph.classList.remove('has-active-node');
                nodes.forEach(n => n.classList.remove('active'));
                links.forEach(link => link.lineEl.classList.remove('active'));
            });
        });
    }

    // ==========================================
    // 4. GSAP Horizontal Scroll (Project Timeline)
    // ==========================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const timelineTrack = document.querySelector('.timeline-track');
        const projectsSection = document.getElementById('projects');

        if (timelineTrack && projectsSection) {
            // Calculate how far to move horizontally
            function getScrollAmount() {
                let trackWidth = timelineTrack.scrollWidth;
                return -(trackWidth - window.innerWidth);
            }

            const tween = gsap.to(timelineTrack, {
                x: getScrollAmount,
                ease: "none"
            });

            ScrollTrigger.create({
                trigger: ".projects-section",
                start: "top top",
                end: () => `+=${getScrollAmount() * -1}`,
                pin: true,
                animation: tween,
                scrub: 1,
                invalidateOnRefresh: true
            });
        }
    }

    // ==========================================
    // 5. Vanilla-Tilt 3D Cards
    // ==========================================
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".project-card"), {
            max: 15, // max tilt rotation (degrees)
            speed: 400, // Speed of the enter/exit transition
            glare: true, // effect
            "max-glare": 0.3 // max glare opacity
        });
    }

    // ==========================================
    // 6. Interactive Terminal Chatbot
    // ==========================================
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');

    if (chatInput && chatHistory) {
        // Conversation state manager
        let chatStep = 0;
        let userData = { name: '', email: '', message: '' };

        // Helper to scroll to bottom
        function scrollToBottom() {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        // Helper to add a message to the DOM
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

        // Helper for AI "Typing" delay
        function aiRespond(text, delay = 1000) {
            chatInput.disabled = true; // prevent typing while AI thinks

            // Add a temporary loading indicator
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
                // Remove loading
                const loader = document.getElementById(loadingId);
                if (loader) loader.remove();

                // Add actual response
                addMessage('AI', text);
                chatInput.disabled = false;
                chatInput.focus();
            }, delay);
        }

        // Handle User Input
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                const text = this.value.trim();
                addMessage('USER', text);
                this.value = ''; // clear input

                // Conversation Flow Switcher
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
                        // Initialize EmailJS just before sending if possible, or assume it was initialized
                        if (window.emailjs) {
                            emailjs.init("YOUR_PUBLIC_KEY"); // TODO: Replace with real public key
                        }
                        userData.email = text;
                        aiRespond(`[System Logged]<br>데이터 패킷 준비 완료. 보안 연결(SMTP)을 통해 메일을 전송합니다...`, 1500);
                        chatInput.placeholder = "메일 전송 중...";
                        chatInput.disabled = true;
                        chatStep++;

                        // Send Email via EmailJS
                        if (window.emailjs) {
                            const templateParams = {
                                from_name: userData.name,
                                from_email: userData.email,
                                message: userData.message,
                                to_email: "01051188129e@gmail.com"
                            };

                            emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
                                .then(function (response) {
                                    console.log('SUCCESS!', response.status, response.text);
                                    addMessage('AI', `<span style="color:var(--neon-blue)">[SUCCESS]</span> 메일이 성공적으로 전송되었습니다. 확인 후 곧 연락드리겠습니다.`);
                                    chatInput.placeholder = "연결이 종료되었습니다.";
                                }, function (error) {
                                    console.log('FAILED...', error);
                                    addMessage('AI', `<span style="color:#ff5f56">[ERROR]</span> 메일 전송에 실패했습니다. (사유: ${error.text || 'Service Unavailable'})<br>01051188129e@gmail.com으로 직접 메일을 보내주세요.`);
                                    chatInput.placeholder = "전송 실패 (Closed)";
                                });
                        } else {
                            // Fallback if SDK not loaded
                            setTimeout(() => {
                                const mailToEmail = "01051188129e@gmail.com";
                                const subject = encodeURIComponent(`[Portfolio Contact] ${userData.name}님의 메시지`);
                                const body = encodeURIComponent(`보낸 사람: ${userData.name}\n회신 이메일: ${userData.email}\n\n메시지 내용:\n${userData.message}`);
                                window.location.href = `mailto:${mailToEmail}?subject=${subject}&body=${body}`;
                                addMessage('AI', "[FALLBACK] 메일 앱을 준비했습니다. 전송 버튼을 눌러주세요.");
                            }, 2000);
                        }
                        break;
                    default:
                        break;
                }
            }
        });
    }

    // ==========================================
    // 7. Floating AI Assistant Logic
    // ==========================================
    const aiTrigger = document.getElementById('ai-trigger');
    const aiPopup = document.getElementById('ai-popup');
    const closeChat = document.getElementById('close-chat');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatBody = document.getElementById('ai-chat-body');

    if (aiTrigger && aiPopup) {
        aiTrigger.addEventListener('click', () => {
            aiPopup.classList.toggle('active');
            if (aiPopup.classList.contains('active')) {
                aiChatInput.focus();
            }
        });

        closeChat.addEventListener('click', () => {
            aiPopup.classList.remove('active');
        });

        function addAiChatMessage(sender, text) {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('chat-message', sender === 'AI' ? 'ai-message' : 'user-message');
            msgDiv.innerHTML = `<div class="message-bubble">${text}</div>`;
            aiChatBody.appendChild(msgDiv);
            aiChatBody.scrollTop = aiChatBody.scrollHeight;
        }

        aiChatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                const query = this.value.trim();
                addAiChatMessage('USER', query);
                this.value = '';

                // Simple keyword-based AI responses
                setTimeout(() => {
                    let response = "흥미로운 질문이네요! 패트릭님의 포트폴리오 프로젝트 섹션을 확인해 보시면 더 자세한 내용을 보실 수 있습니다.";

                    const q = query.toLowerCase();
                    if (q.includes('경력') || q.includes('경험')) {
                        response = "패트릭님은 2012년부터 공정 자동화 시스템을 시작으로, 현재는 LLM 기반의 AI 시스템을 구축하는 8년 차 베테랑 개발자입니다.";
                    } else if (q.includes('기술') || q.includes('스택')) {
                        response = "Java, Python, Spring Boot뿐만 아니라 n8n, Flowise 같은 최신 AI 워크플로우 도구까지 다재다능하게 다루십니다.";
                    } else if (q.includes('연락') || q.includes('메일')) {
                        response = "화면 하단의 'Establish Link' 섹션에서 직접 메시지를 남기시거나, 01051188129e@gmail.com으로 연락 주시면 됩니다.";
                    }

                    addAiChatMessage('AI', response);
                }, 800);
            }
        });
    }

});
