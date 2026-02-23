/**
 * TOC (Table of Contents) 모듈
 * 기능: 플로팅 목차 내비게이션, 스무스 스크롤, 섹션 감지 하이라이트
 */
export function initTOC() {
    const tocItems = document.querySelectorAll('.toc-item');
    const sections = document.querySelectorAll('.section');

    if (tocItems.length === 0 || sections.length === 0) return;

    // 1. 목차 아이템 클릭 시 해당 섹션으로 부드럽게 이동
    tocItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.dataset.section;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 2. IntersectionObserver를 이용한 현재 섹션 감지 및 목차 하이라이트
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // 화면의 중간 지점 통과 시 감지
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeSectionId = entry.target.id;

                // 모든 항목에서 active 클래스 제거 후 현재 섹션에만 추가
                tocItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.dataset.section === activeSectionId) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    // 모든 섹션 관찰 시작
    sections.forEach(section => observer.observe(section));
}
