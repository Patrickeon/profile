/**
 * Project Detail Modal Module
 * Handles opening, closing, and injecting content into the project detail modal.
 */

export function initModal() {
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('modal-close');
    
    // Setup close listeners
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            // Close if clicked on the overlay (outside content)
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Escape key listener for accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Add click listeners to all project cards (Timeline & Archive)
    setupCardListeners();
}

export function setupCardListeners() {
    const cards = document.querySelectorAll('.project-card, .board-card');
    
    cards.forEach(card => {
        // Prevent adding multiple listeners
        if (card.dataset.modalListenerAttached) return;
        
        card.addEventListener('click', () => {
            const year = card.querySelector('.project-year, .board-meta span')?.innerText || 'Year Info';
            const title = card.querySelector('.project-title, .board-title')?.innerText || 'Project Title';
            const desc = card.querySelector('.project-desc, .board-desc')?.innerText || 'Description...';
            
            // Extract some keywords for tech stack based on description
            // Realistic implementation might fetch from an API or object, here we parse the desc
            let techStack = [];
            const techMatch = desc.match(/[A-Za-z.\s,]+/); // Simple approximation
            if (techMatch) {
                techStack = techMatch[0].split(',').map(t => t.trim()).filter(Boolean);
            }

            openModal(year, title, desc, techStack);
        });
        
        card.dataset.modalListenerAttached = "true";
    });
}

export function openModal(year, title, desc, techStack = []) {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    
    document.getElementById('modal-year').innerText = year;
    document.getElementById('modal-title').innerText = title;
    
    // In a real scenario, this description could be richer (HTML)
    document.getElementById('modal-desc').innerHTML = desc.replace(/\n/g, '<br>');
    
    const techContainer = document.getElementById('modal-tech');
    techContainer.innerHTML = '';
    
    techStack.forEach(tech => {
        const badge = document.createElement('span');
        badge.className = 'modal-tech-badge';
        badge.innerText = tech;
        techContainer.appendChild(badge);
    });
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

export function closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}
