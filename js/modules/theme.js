/**
 * Theme Manager Module
 * Handles toggling between Dark Mode and Light Mode, and saves user preference via localStorage.
 */

export function initThemeToggle() {
    const themeBtn = document.createElement('button');
    themeBtn.id = 'theme-toggle-btn';
    themeBtn.title = 'Toggle Theme';
    themeBtn.setAttribute('aria-label', 'Toggle Dark/Light Mode');
    themeBtn.innerHTML = '🌞'; // Default to sun since default is dark mode
    
    // Style the button
    Object.assign(themeBtn.style, {
        position: 'fixed',
        top: '30px',
        right: '30px',
        zIndex: '2000',
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        color: 'var(--text-primary)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
    });
    
    document.body.appendChild(themeBtn);

    // Check system preference & localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        setTheme('light');
    } else {
        setTheme('dark');
    }

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    themeBtn.addEventListener('mouseenter', () => {
        themeBtn.style.transform = 'scale(1.1)';
        themeBtn.style.borderColor = 'var(--neon-blue)';
    });

    themeBtn.addEventListener('mouseleave', () => {
        themeBtn.style.transform = 'scale(1)';
        themeBtn.style.borderColor = 'var(--glass-border)';
    });
}

function setTheme(theme) {
    const themeBtn = document.getElementById('theme-toggle-btn');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark' ? '🌞' : '🌙';
    }

    // You can optionally refresh specific canvas effects here
    // e.g., if particles need a color update, dispatch an event
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}
