/**
 * 전역 프로젝트 데이터베이스
 * 모든 프로젝트 섹션(Archive Timeline, Project Hub, AI Assistant)에서 공통으로 사용됩니다.
 */
export const projectsData = [
    {
        id: 1,
        category: 'ai',
        title: '하나캐피탈 렌터카 AI 챗봇',
        year: '2025-2026',
        company: '페르소나 AI',
        desc: '폐쇄망 환경에서 LLM 모델을 반입 및 튜닝하고, 프롬프팅과 RAG를 적용한 렌터카 맞춤형 AI 챗봇 시스템 구축 참여',
        tech: ['Python', 'vLLM', 'Java', 'Spring Boot', 'JSP', 'jQuery', 'MySQL', 'Linux']
    },
    {
        id: 2,
        category: 'ai',
        title: '세라젬 LLM 챗봇',
        year: '2025',
        company: '페르소나 AI',
        desc: '사내 데이터를 활용한 RAG 기반 질의응답 및 고객 맞춤형 응대를 지원하는 세라젬 전용 LLM 챗봇 솔루션 연동 개발',
        tech: ['Java', 'Spring Boot', 'Vue.js', 'LLM']
    },
    {
        id: 3,
        category: 'ai',
        title: '한국교육학술정보원(KERIS) LLM 챗봇',
        year: '2025',
        company: '페르소나 AI',
        desc: '교육 분야 특화 데이터셋을 활용한 한국교육학술정보원 맞춤형 LLM 챗봇 솔루션 통합 및 백오피스 시스템 구축',
        tech: ['Java', 'Spring Boot', 'Vue.js', 'LLM']
    },
    {
        id: 4,
        category: 'web',
        title: '코닝정밀소재 AI 문서표준화',
        year: '2025',
        company: '페르소나 AI',
        desc: '사내 비정형 문서의 데이터 추출 및 정형화를 위한 기업용 AI 문서 표준화 솔루션 통합 웹 플랫폼 개발',
        tech: ['Java', 'Spring Boot', 'Vue.js']
    },
    {
        id: 5,
        category: 'ai',
        title: 'Gen AI 페르소나 솔루션',
        year: '2024-2025',
        company: '페르소나 AI',
        desc: '다양한 LLM을 참고하여 모델을 병합 및 튜닝하고, 이를 Agent화하여 다중 제어할 수 있는 Gen AI 페르소나 솔루션 자체 엔진 및 플랫폼 개발',
        tech: ['Java', 'Spring Boot', 'Vue.js', 'Python', 'LLM']
    },
    {
        id: 6,
        category: 'web',
        title: 'SBL G.AI 문서표준화플랫폼',
        year: '2024',
        company: '(주)삼성바이오로직스',
        desc: '삼성바이오로직스 사내 규정 및 규격 문서의 표준화 작업과 AI 학습 데이터화를 지원하는 G.AI 웹 플랫폼 아키텍처 설계 및 구축',
        tech: ['Java', 'Spring', 'Vue.js']
    },
    {
        id: 7,
        category: 'web',
        title: 'STO 플랫폼 (ST Galaxia)',
        year: '2023-2024',
        company: '(주)갤럭시아머니트리',
        desc: '갤럭시아머니트리의 토큰증권(STO) 발행 및 거래를 지원하는 통합 웹 플랫폼 프론트엔드 UI 및 백엔드 서비스 개발',
        tech: ['JavaScript', 'jQuery', 'Java', 'Oracle']
    },
    {
        id: 8,
        category: 'web',
        title: 'AGING LOC HealthCare',
        year: '2022-2023',
        company: '(주)메디아이오티',
        desc: 'Flutter 기반의 사용자용 디지털 헬스케어 모바일 앱 개발 및 데이터 관리를 위한 통합 백오피스 웹 시스템 서버 구축',
        tech: ['Java', 'Flutter', 'Meteor.js', 'MongoDB']
    },
    {
        id: 9,
        category: 'web',
        title: '㈜살방 라이프스타일 커뮤니티',
        year: '2021',
        company: '플로리보스_살방',
        desc: 'React Native와 GraphQL을 활용한 모바일 라이프스타일 커뮤니티 앱 프론트엔드 연동 및 백엔드 아키텍처 구축',
        tech: ['JavaScript', 'React Native', 'Expo', 'GraphQL', 'PostgreSQL']
    },
    {
        id: 10,
        category: 'ai',
        title: '대형 AI 챗봇 솔루션',
        year: '2017-2019',
        company: '롯데카드/우리카드/CJ오쇼핑',
        desc: '대형 금융권 및 이커머스 기업의 고객 응대 자동화를 위한 대규모 자연어 처리(NLP) 기반 AI 챗봇 엔진 및 관리자 시스템 개발',
        tech: ['Java', 'Meteor.js', 'Oracle', 'NLP']
    },
    {
        id: 11,
        category: 'web',
        title: 'JB Bank 통합 금융 솔루션',
        year: '2016-2017',
        company: '전북은행 (JB Bank)',
        desc: '전북은행의 안정적인 금융 서비스 제공을 위한 통합 금융 솔루션 백엔드 로직 구현 및 엔터프라이즈 시스템 아키텍처 설계',
        tech: ['Java', 'MariaDB', 'MongoDB', 'Spring Boot']
    },
    {
        id: 12,
        category: 'web',
        title: 'ABL 화상 고객 서비스',
        year: '2016',
        company: 'ABL',
        desc: '고객과 상담원 간의 실시간 화상 통신을 지원하는 화상 고객 상담 시스템의 소프트웨어 및 백엔드 비즈니스 로직 개발',
        tech: ['Java', 'Spring Boot', 'jQuery', 'MariaDB']
    }
];