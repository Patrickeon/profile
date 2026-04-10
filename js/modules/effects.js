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
    initAccessibilityEnhancements();
    initCareerTimeline();
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

        // Add proficiency indicators and tooltips to skill nodes
        nodes.forEach(node => {
            // Add proficiency dots
            const proficiency = parseInt(node.dataset.proficiency) || 0;
            const proficiencyDots = document.createElement('div');
            proficiencyDots.className = 'skill-proficiency';

            // Create 5 dots representing 20% increments
            for (let i = 0; i < 5; i++) {
                const dot = document.createElement('div');
                dot.className = 'proficiency-dot';
                if (proficiency > (i + 1) * 20) {
                    dot.classList.add('active');
                }
                proficiencyDots.appendChild(dot);
            }
            node.appendChild(proficiencyDots);

            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'skill-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-title">${node.textContent.trim()}</div>
                <div class="tooltip-proficiency">Proficiency: ${proficiency}%</div>
                <div class="tooltip-bar">
                    <div class="tooltip-bar-fill" style="width: ${proficiency}%"></div>
                </div>
            `;
            node.appendChild(tooltip);
        });

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

/**
 * 6. 접근성 향상 - 키보드_navigability 및 상호작용
 */
function initAccessibilityEnhancements() {
    // 프로젝트 카드 접근성 향상 (Enter/Space 키로 활성화)
    const projectCards = document.querySelectorAll('.project-card[role="button"]');

    projectCards.forEach(card => {
        // 키보드 이벤트 처리 (Enter 및 Space 키)
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // 페이지 스크롤 방지
                card.click(); // 클릭 이벤트 트리거
            }
        });

        // 시각적 피드백을 위한 포커스 스타일 추가
        card.addEventListener('focus', () => {
            card.style.boxShadow = '0 0 0 3px rgba(0, 243, 255, 0.5)';
        });

        card.addEventListener('blur', () => {
            card.style.boxShadow = '';
        });
    });
}

function initCareerTimeline() {
    const careerTimeline = document.querySelector('.career-timeline');
    if (!careerTimeline) return;

    // Clear existing content
    careerTimeline.innerHTML = '';

    // Add center line
    const centerLine = document.createElement('div');
    centerLine.className = 'career-timeline-line';
    careerTimeline.appendChild(centerLine);

    // 경력 데이터 정의
    const careerData = [
        {
            year: '2012-2013',
            title: 'Embedded Systems Engineer',
            company: '(주)JBL',
            description: 'PLC 기반 공정 자동화 설비 개발 및 유지보수',
            technologies: ['C', 'PLC', 'Windows'],
            side: 'left'
        },
        {
            year: '2016',
            title: 'Full Stack Developer',
            company: 'ABL',
            description: '화상 고객 서비스 시스템 개발',
            technologies: ['Java', 'MariaDB', 'MongoDB'],
            side: 'right'
        },
        {
            year: '2016-2017',
            title: 'Senior Java Developer',
            company: '전북은행 (JB Bank)',
            description: '통합 금융 솔루션 구축 및 아키텍처 설계',
            technologies: ['Java', 'MariaDB', 'MongoDB'],
            side: 'left'
        },
        {
            year: '2017-2019',
            title: 'AI Chatbot Solution Architect',
            company: '롯데카드/우리카드/CJ오쇼핑',
            description: '대형 AI 챗봇 솔루션 개발 및 구축',
            technologies: ['Java', 'Meteor.js'],
            side: 'right'
        },
        {
            year: '2021',
            title: 'Mobile App Developer',
            company: '플로리보스_살방',
            description: '라이프스타일 커뮤니티 앱 구축',
            technologies: ['JavaScript', 'React Native', 'Expo', 'GraphQL', 'PostgreSQL'],
            side: 'left'
        },
        {
            year: '2022-2023',
            title: 'Healthcare Systems Engineer',
            company: '(주)메디아이오티',
            description: '디지털 헬스케어 앱 개발 (Flutter 기반)',
            technologies: ['Java', 'Flutter', 'Meteor.js'],
            side: 'right'
        },
        {
            year: '2023-2024',
            title: 'Blockchain Developer',
            company: '(주)갤럭시아머니트리',
            description: 'STO 플랫폼 (ST Galaxia) 개발',
            technologies: ['JavaScript', 'jQuery', 'Java'],
            side: 'left'
        },
        {
            year: '2024',
            title: 'Enterprise AI Platform Engineer',
            company: '(주)삼성바이오로직스',
            description: 'G.AI 문서표준화 플랫폼 구축',
            technologies: ['Java', 'Spring', 'Vue.js'],
            side: 'right'
        },
        {
            year: '2024-2025',
            title: 'Lead AI Engineer',
            company: '페르소나 AI',
            description: 'Gen AI 페르소나 솔루션 자체 개발',
            technologies: ['Java', 'Spring Boot', 'Vue.js'],
            side: 'left'
        },
        {
            year: '2025',
            title: 'AI Document Processing Engineer',
            company: '페르소나 AI',
            description: '코닝정밀소재 AI 문서표준화 솔루션 개발',
            technologies: ['Java', 'Spring Boot', 'Vue.js'],
            side: 'right'
        },
        {
            year: '2025',
            title: 'Education AI Specialist',
            company: '페르소나 AI',
            description: '한국교육학술정보원(KERIS) LLM 챗봇 프로젝트',
            technologies: ['Java', 'Spring Boot', 'Vue.js'],
            side: 'left'
        },
        {
            year: '2025',
            title: 'Healthcare AI Developer',
            company: '페르소나 AI',
            description: '세라젬 LLM 챗봇 프로젝트 개발',
            technologies: ['Java', 'Spring Boot', 'Vue.js'],
            side: 'right'
        },
        {
            year: '2025-2026',
            title: 'Senior AI Consultant',
            company: '페르소나 AI',
            description: '하나캐피탈 LLM 챗봇 프로젝트 리드',
            technologies: ['Java', 'Spring Boot', 'JSP', 'jQuery'],
            side: 'left'
        }
    ];

    careerData.forEach((period, index) => {
        const periodElement = document.createElement('div');
        periodElement.className = `career-period ${period.side}`;

        // Calculate position based on index to distribute evenly
        const totalPeriods = careerData.length;
        const positionPercent = ((index + 1) / (totalPeriods + 1)) * 100;
        periodElement.style.top = `${positionPercent}%`;

        periodElement.innerHTML = `
            <div class="career-period dot"></div>
            <div class="career-period content">
                <div class="career-year">${period.year}</div>
                <div class="career-title">${period.title}</div>
                <div class="career-company">${period.company}</div>
                <div class="career-description">${period.description}</div>
                <div class="career-technologies">
                    ${period.technologies.map(tech => `<span class="career-tech-tag">${tech}</span>`).join('')}
                </div>
            </div>
        `;

        careerTimeline.appendChild(periodElement);
    });
}
