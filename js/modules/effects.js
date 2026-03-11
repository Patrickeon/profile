/**
 * UI 효과 관련 모듈 (tsParticles, Glitch, Skill Graph, GSAP Scroll, Vanilla Tilt)
 * 모든 비주얼 이펙트 로직을 통합 관리합니다.
 */

export function initEffects() {
    initParticles();
    initTypingEffect();
    initSkillGraph();
    initHorizontalScroll();
    initVanillaTilt();
}

/**
 * 1. tsParticles 초기화 (신경망 배경 효과)
 */
function initParticles() {
    if (typeof tsParticles !== 'undefined') {
        tsParticles.load("particle-canvas", {
            fpsLimit: 60,
            interactivity: {
                events: {
                    onHover: { enable: true, mode: "grab" },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 200,
                        links: { opacity: 0.8, color: "#00f3ff" }
                    }
                }
            },
            particles: {
                color: { value: ["#00f3ff", "#9d00ff", "#ffffff"] },
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
                    outModes: { default: "bounce" },
                    random: false,
                    speed: 1,
                    straight: false
                },
                number: {
                    density: { enable: true, area: 800 },
                    value: 80
                },
                opacity: { value: 0.6 },
                shape: { type: "circle" },
                size: { value: { min: 1, max: 3 } }
            },
            detectRetina: true
        });
    }
}

/**
 * 2. Glitch & Typing 효과 (Hero 섹션)
 */
function initTypingEffect() {
    const glitchElement = document.querySelector('.glitch-text');
    if (glitchElement) {
        const fullText = "> System Initialized...";
        glitchElement.innerHTML = '';

        let i = 0;
        const typeSpeed = 100;

        function typeWriter() {
            if (i < fullText.length) {
                glitchElement.innerHTML = fullText.substring(0, i + 1) + '<span class="cursor">|</span>';
                i++;
                setTimeout(typeWriter, typeSpeed + Math.random() * 50);
            } else {
                glitchElement.innerHTML = fullText + '<span class="cursor">|</span>';
                setInterval(() => {
                    glitchElement.classList.add('active-glitch');
                    setTimeout(() => glitchElement.classList.remove('active-glitch'), 200);
                }, 3000);
            }
        }
        setTimeout(typeWriter, 500);
    }
}

/**
 * 3. 스킬 그래프 인터랙션 (About 섹션)
 */
function initSkillGraph() {
    const skillGraph = document.getElementById('skill-graph');
    const svgLayer = document.getElementById('skill-links-svg');
    const nodes = document.querySelectorAll('.skill-node');
    const links = [];

    if (skillGraph && svgLayer && nodes.length > 0) {
        function drawLinks() {
            svgLayer.innerHTML = '';
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
                            const sRect = sourceNode.getBoundingClientRect();
                            const tRect = targetNode.getBoundingClientRect();
                            const x1 = sRect.left - graphRect.left + (sRect.width / 2);
                            const y1 = sRect.top - graphRect.top + (sRect.height / 2);
                            const x2 = tRect.left - graphRect.left + (tRect.width / 2);
                            const y2 = tRect.top - graphRect.top + (tRect.height / 2);

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

        setTimeout(drawLinks, 100);
        window.addEventListener('resize', drawLinks);

        nodes.forEach(node => {
            node.addEventListener('mouseenter', () => {
                skillGraph.classList.add('has-active-node');
                node.classList.add('active');
                const nodeId = node.dataset.id;
                links.forEach(link => {
                    if (link.sourceId === nodeId || link.targetId === nodeId) {
                        link.lineEl.classList.add('active');
                        const connectedNodeId = link.sourceId === nodeId ? link.targetId : link.sourceId;
                        const connectedNode = document.querySelector(`.skill-node[data-id="${connectedNodeId}"]`);
                        if (connectedNode) connectedNode.classList.add('active');
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
}

/**
 * 4. GSAP 가로 스크롤 (타임라인 섹션)
 * 마우스 휠 지원을 강화했습니다.
 */
function initHorizontalScroll() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const timelineTrack = document.querySelector('.timeline-track');
        const projectsSection = document.getElementById('projects');

        if (timelineTrack && projectsSection) {
            // 트랙의 전체 스크롤 가능 거리 계산
            const getScrollAmount = () => -(timelineTrack.scrollWidth - window.innerWidth);

            // 가로 이동 애니메이션 정의
            const horizontalTween = gsap.to(timelineTrack, {
                x: getScrollAmount,
                ease: "none"
            });

            // ScrollTrigger 설정: 섹션 고정 및 애니메이션 바인딩
            const st = ScrollTrigger.create({
                trigger: "#projects", // .projects-section 대신 구체적인 ID 사용
                start: "top top",
                end: () => `+=${timelineTrack.scrollWidth * 0.5}`, // 더 빨리 끝나게 조정
                pin: true,
                animation: horizontalTween,
                scrub: 0.2, // 반응성 개선을 위해 1에서 0.2로 낮춤 (부드럽게 즉각 반응)
                invalidateOnRefresh: true
            });

            // 마우스 휠 수동 변환 (e.preventDefault()와 scrollBy) 방식은 특정 트랙패드나 브라우저에서 스크롤 끊김(Jank)을 발생시킬 수 있어 제거하고,
            // GSAP ScrollTrigger의 기본 scrub 기능을 신뢰하여 자연스러운 스크롤 경험(Native Scroll)을 제공하도록 개선했습니다.

            // 레이아웃 변경 시 리프레시
            window.addEventListener('resize', () => {
                ScrollTrigger.refresh();
            });

            // 데이터 로드 지연을 고려하여 잠시 후 다시 계산
            window.addEventListener('load', () => {
                ScrollTrigger.refresh();
            });
        }
    }
}

/**
 * 5. Vanilla-Tilt 3D 카드 효과
 */
function initVanillaTilt() {
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".project-card"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.3
        });
    }
}
