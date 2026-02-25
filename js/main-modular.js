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
    const SUPABASE_URL = 'https://jviurhfueipyhiangwpv.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aXVyaGZ1ZWlweWhpYW5nd3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDQwMjYsImV4cCI6MjA4NzUyMDAyNn0.PYtPJcQDtsrkPbpxNNxeMLUaTB5xv_t_CI0GO4NPOO0';

    let supabaseClient = null;
    // 3. 브라우저용 SDK 초기화 (공식 문서의 createClient와 동일한 역할)
    if (typeof window.supabase !== 'undefined') {
        // 외부 let 변수에 할당하여 전역적으로 사용 가능하게 함
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('[System] Supabase Client Initialized:', supabaseClient);
    }

    // 2. 각 기능 모듈 통합 초기화
    try {
        // 비주얼 효과 및 인터랙션 (Particles, Typing, Skill Graph, GSAP Scroll, Tilt)
        initEffects();

        // 목차 내비게이션
        initTOC();

        // 프로젝트 보드 (Archive) - DB 데이터 및 WEB 보강 버전
        await initProjectBoard(supabaseClient);

        console.log('====================== ', supabaseClient);

        // AI 비서 위젯 (Chatbot)
        initAIAssistant(supabaseClient);

        // 터미널 Contact 섹션
        initContact();

        console.log('[System] Mission Control: All modules synchronized.');
    } catch (error) {
        console.error('[Critical Error] Module initialization phase failed:', error);
    }
});
