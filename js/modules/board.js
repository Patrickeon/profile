/**
 * 프로젝트 보드(Archive) 모듈
 * Supabase 데이터 페칭, 필터링, 검색 및 렌더링을 담당합니다.
 */

export async function initProjectBoard(supabase) {
    const projectGrid = document.getElementById('project-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('board-search-input');

    if (!projectGrid) return;

    // 초기 렌더링
    await renderProjects(projectGrid, supabase);

    // 필터 버튼 이벤트 바인딩
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            const search = searchInput ? searchInput.value : '';
            await renderProjects(projectGrid, supabase, filter, search);
        });
    });

    // 검색 입력 이벤트 바인딩
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const activeFilterBtn = document.querySelector('.filter-btn.active');
            const filter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
            const search = e.target.value;
            await renderProjects(projectGrid, supabase, filter, search);
        });
    }
}

/**
 * 프로젝트 데이터를 가져와서 그리드에 렌더링합니다.
 */
async function renderProjects(container, supabase, filter = 'all', search = '') {
    container.innerHTML = '<p class="code-font" style="grid-column: 1/-1; text-align: center;">> Scanning Knowledge Base...</p>';

    // Fallback Data (DB 연결 전 또는 데이터가 없을 때 사용)
    // 사용자의 요청에 따라 거의 모든 프로젝트를 WEB 카테고리에도 포함되도록 보강했습니다.
    const fallbackData = [
        { id: 1, category: 'web', title: '코닝정밀소재 AI 문서표준화', year: '2025', desc: 'Java, Spring Boot, Vue.js 기반의 기업용 AI 솔루션' },
        { id: 2, category: 'web', title: '하나캐피탈 LLM 챗봇', year: '2025-2026', desc: 'Java, Spring Boot, JSP, jQuery를 활용한 금융권 챗봇 시스템' },
        { id: 3, category: 'ai', title: 'Gen AI 페르소나 솔루션', year: '2024-2025', desc: '자체 LLM 페르소나 엔진 및 관리툴 개발 (WEB 기반)' },
        { id: 4, category: 'web', title: 'SBL G.AI 문서표준화플랫폼', year: '2024', desc: '삼성바이오로직스용 Java, Spring, Vue.js 웹 플랫폼' },
        { id: 5, category: 'web', title: 'STO 플랫폼 (ST Galaxia)', year: '2023-2024', desc: '갤럭시아머니트리 STO 웹 서비스 (JS, jQuery, Java)' },
        { id: 6, category: 'web', title: 'AGING LOC HealthCare', year: '2022-2023', desc: 'Flutter 기반이지만 웹 관리 모듈을 포함한 헬스케어 플랫폼' },
        { id: 7, category: 'web', title: '㈜살방 구축 서비스', year: '2021', desc: 'JS, React Native, Expo, GraphQL 기반 웹/앱 서비스' },
        { id: 8, category: 'ai', title: 'AI 챗봇 솔루션', year: '2017-2019', desc: '롯데카드, 우리카드용 대형 AI 챗봇 엔진 (Java, Meteor)' },
        { id: 9, category: 'system', title: '공정 자동화 설비', year: '2012-2013', desc: 'C, PLC, Window 기반의 시스템 제어 및 모니터링' },
    ];

    // AI/WEB 중복 표시를 위해 카테고리 체크 로직 개선
    // 사용자가 'WEB에도 추가해달라'고 함.
    fallbackData.forEach(item => {
        if (item.title.includes('AI') || item.title.includes('챗봇') || item.title.includes('LLM')) {
            // 이 데이터들은 AI 카테고리이지만 사실상 WEB이기도 함. 
            // 렌더링 시 필터 로직에서 유연하게 처리.
        }
    });

    let projects = [];

    try {
        if (supabase) {
            let query = supabase.from('projects').select('*');
            if (filter !== 'all') {
                query = query.eq('category', filter);
            }
            const { data, error } = await query;
            if (error) throw error;
            projects = data;
        } else {
            // 필터링 적용 (WEB 카테고리일 경우 AI 프로젝트 중 WEB 기반인 것들도 포함)
            projects = fallbackData.filter(p => {
                if (filter === 'all') return true;
                if (filter === 'web') {
                    // WEB 카테고리 선택 시, 명시적 web 외에도 ai 프로젝트 중 상당수를 포함
                    return p.category === 'web' || p.category === 'ai';
                }
                return p.category === filter;
            });
        }

        // 검색어 필터링
        if (search) {
            projects = projects.filter(p =>
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                (p.description || p.desc).toLowerCase().includes(search.toLowerCase())
            );
        }

        container.innerHTML = '';

        if (projects.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">연결된 기록이 없습니다.</p>';
            return;
        }

        projects.forEach((p) => {
            const card = document.createElement('div');
            card.classList.add('board-card');
            card.style.opacity = '0';
            card.innerHTML = `
                <div class="card-tag">${p.category.toUpperCase()}</div>
                <h3 class="card-title">${p.title}</h3>
                <p class="card-desc">${p.description || p.desc}</p>
                <div class="card-footer">
                    <span class="card-date">${p.year}</span>
                    <span class="read-more" data-title="${p.title}">DETAIL ></span>
                </div>
            `;
            container.appendChild(card);
        });

        // DETAIL 버튼 클릭 이벤트 바인딩 (이벤트 위임 사용)
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-more')) {
                const title = e.target.getAttribute('data-title');
                if (window.showProjectDetail) window.showProjectDetail(title);
            }
        });

        // GSAP 애니메이션 적용
        if (window.gsap) {
            window.gsap.fromTo('.board-card',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
            );
        } else {
            document.querySelectorAll('.board-card').forEach(c => c.style.opacity = '1');
        }

    } catch (err) {
        console.error('Board Rendering Error:', err);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff5f56;">[ERROR] 데이터베이스 연결에 실패했습니다.</p>';
    }
}

/**
 * 프로젝트 상세 보기 (글로벌 함수로 정의하여 onclick에서 호출 가능하게 함)
 */
window.showProjectDetail = function (title) {
    // 실제 운영 시에는 모달창을 띄우는 것이 좋지만, 우선은 alert으로 반응 확인
    alert(`[Project Detail]\n\n선택하신 '${title}' 프로젝트의 상세 정보 패킷을 요청 중입니다.\n현재는 프로토타입 단계로, 정식 버전에서 상세 내용을 확인하실 수 있습니다.`);
};
