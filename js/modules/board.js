import { projectsData } from '../data/projects-data.js';

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

    // 사용자의 요청으로 DB 연동 대신 중앙 집중화된 projectsData를 사용합니다.
    let projects = projectsData.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'web') {
            return p.category === 'web' || p.category === 'ai';
        }
        return p.category === filter;
    });

    try {
        // 검색어 필터링
        if (search) {
            projects = projects.filter(p =>
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.desc.toLowerCase().includes(search.toLowerCase())
            );
        }

        container.innerHTML = '';

        if (projects.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);" data-i18n="board.empty">관련 프로젝트가 없습니다.</p>';
            return;
        }

        projects.forEach((p) => {
            const card = document.createElement('div');
            card.classList.add('board-card');
            card.style.opacity = '0';
            card.setAttribute('data-id', p.id); // ID 저장
            card.innerHTML = `
                <div class="card-tag">${p.category.toUpperCase()}</div>
                <h3 class="card-title">${p.title}</h3>
                <p class="card-desc">${p.desc}</p>
                <div class="card-footer">
                    <span class="card-date">${p.year}</span>
                    <span class="read-more">DETAIL ></span>
                </div>
            `;
            container.appendChild(card);
        });

        // 카드 클릭 이벤트 바인딩 (이벤트 위임 사용 - 카드 전체 클릭 가능)
        container.onclick = (e) => {
            const card = e.target.closest('.board-card');
            if (card) {
                const id = parseInt(card.getAttribute('data-id'));
                const project = projectsData.find(p => p.id === id);

                if (project) {
                    openModal(project.year, project.title, project.desc, project.tech);
                }
            }
        };

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
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff5f56;">[ERROR] 데이터 렌더링에 실패했습니다.</p>';
    }
}