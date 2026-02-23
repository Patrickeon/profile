/**
 * 메인 entry 포인트 스크립트 (모듈 통합 버전)
 * 모든 핵심 모듈(TOC, Board, AI, Effects, Contact)을 로드하고 초기화합니다.
 */
import { initTOC } from './modules/toc.js';
import { initProjectBoard } from './modules/board.js';
import { initAIAssistant } from './modules/ai-assistant.js';
import { initEffects } from './modules/effects.js';
import { initContact } from './modules/contact.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Supabase 초기화 구성
    const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
    const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

    let supabaseClient = null;
    // 글로벌 supabase 객체 확인 (SDK 로드 시 window.supabase에 할당됨)
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('[System] Secure Database Connection Established.');
    }

    // 2. 각 기능 모듈 통합 초기화
    try {
        // 비주얼 효과 및 인터랙션 (Particles, Typing, Skill Graph, GSAP Scroll, Tilt)
        initEffects();

        // 목차 내비게이션
        initTOC();

        // 프로젝트 보드 (Archive) - DB 데이터 및 WEB 보강 버전
        await initProjectBoard(supabaseClient);

        // AI 비서 위젯 (Chatbot)
        initAIAssistant(supabaseClient);

        // 터미널 Contact 섹션
        initContact();

        console.log('[System] Mission Control: All modules synchronized.');
    } catch (error) {
        console.error('[Critical Error] Module initialization phase failed:', error);
    }
});
