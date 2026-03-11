/**
 * Internationalization (i18n) Module
 * Handles toggling between Korean (KO) and English (EN) languages.
 */

const translations = {
    ko: {
        'hero.title.prefix': 'Hello, World.<br>I build ',
        'hero.title.highlight': 'intelligent',
        'hero.title.suffix': ' conversations.',
        'hero.subtitle': '2016년부터 AI와 인간을 잇는 시스템을 설계해 온 8년 차 개발자 <strong>Patrick</strong>입니다.',
        'hero.btn': 'Initialize Connection',
        'about.role': '복잡한 AI 로직을 유저 친화적인 UX로 풀어내는 브릿지(Bridge) 역할을 수행합니다.',
        'profile.name': '김건훈',
        'profile.exp': '8년 차 (2016 ~ 2026)',
        'contact.ai_msg': '연결이 수립되었습니다. 어떤 메시지를 남기시겠습니까?',
        'ai.greeting': '안녕하세요! Patrick님의 8년 차 개발 여정에 대해 궁금한 점이 있으신가요?',
        'ai.placeholder': '질문을 입력하세요...',
        'board.filter.all': 'ALL',
        'board.filter.ai': 'AI / LLM',
        'board.filter.web': 'WEB / APP',
        'board.filter.system': 'SYSTEM'
    },
    en: {
        'hero.title.prefix': 'Hello, World.<br>I build ',
        'hero.title.highlight': 'intelligent',
        'hero.title.suffix': ' conversations.',
        'hero.subtitle': 'An 8-year developer <strong>Patrick</strong>, designing systems bridging AI and humans since 2016.',
        'hero.btn': 'Initialize Connection',
        'about.role': 'I act as a bridge, translating complex AI logic into user-friendly UX.',
        'profile.name': 'Geonhun Kim',
        'profile.exp': '8 Years (2016 ~ 2026)',
        'contact.ai_msg': 'Connection established. What message would you like to leave?',
        'ai.greeting': 'Hello! Do you have any questions about Patrick\'s 8-year development journey?',
        'ai.placeholder': 'Ask a question...',
        'board.filter.all': 'ALL',
        'board.filter.ai': 'AI / LLM',
        'board.filter.web': 'WEB / APP',
        'board.filter.system': 'SYSTEM'
    }
};

export function initI18n() {
    const langBtn = document.createElement('button');
    langBtn.id = 'lang-toggle-btn';
    langBtn.title = 'Toggle Language';
    langBtn.setAttribute('aria-label', 'Toggle KO/EN Language');
    
    // Style the button
    Object.assign(langBtn.style, {
        position: 'fixed',
        top: '85px',       // Right below the theme button
        right: '30px',
        zIndex: '2000',
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-heading)',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
    });
    
    document.body.appendChild(langBtn);

    // Initial check
    const savedLang = localStorage.getItem('lang') || 'ko';
    setLang(savedLang);

    langBtn.addEventListener('click', () => {
        const currentLang = document.documentElement.getAttribute('lang') || 'ko';
        const newLang = currentLang === 'ko' ? 'en' : 'ko';
        setLang(newLang);
    });

    langBtn.addEventListener('mouseenter', () => {
        langBtn.style.transform = 'scale(1.1)';
        langBtn.style.borderColor = 'var(--neon-purple)';
    });

    langBtn.addEventListener('mouseleave', () => {
        langBtn.style.transform = 'scale(1)';
        langBtn.style.borderColor = 'var(--glass-border)';
    });
}

function setLang(lang) {
    const langBtn = document.getElementById('lang-toggle-btn');
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('lang', lang);
    
    if (langBtn) {
        langBtn.innerHTML = lang === 'ko' ? 'EN' : 'KO';
    }

    // Replace all text elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Some elements need innerHTML (like subtitle with <strong>)
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerHTML = translations[lang][key];
            }
        }
    });
}
