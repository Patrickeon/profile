# 🚀 배포 및 최종 설정 가이드 (Deployment Guide)

본 문서는 Patrick 포트폴리오 사이트를 실제 서버에 올리고, 기능을 활성화하기 위한 상세 가이드입니다.

## 1. 📧 이메일 전송(SMTP) 기능 활성화 (EmailJS)

현재 포트폴리오의 터미널 챗봇은 **EmailJS**를 사용합니다. 실제 메일을 받으려면 아래 설정을 완료해야 합니다.

1. [EmailJS 홈페이지](https://www.emailjs.com/)에 가입합니다.
2. **Email Services** 탭에서 메일을 받을 서비스(예: Gmail)를 연동하고 `Service ID`를 복사합니다.
3. **Email Templates** 탭에서 전송받을 메일 양식을 만들고 `Template ID`를 복사합니다.
   - 변수명은 코딩된 대로 `{{from_name}}`, `{{from_email}}`, `{{message}}`를 사용하세요.
4. **Account** 섹션에서 `Public Key`를 확인합니다.
5. `js/modules/contact.js` 파일을 열어 다음 부분을 수정합니다:
   ```javascript
   // 약 75-90번 라인 근처
   const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // 여기에 발급받은 Service ID 입력
   const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // 여기에 발급받은 Template ID 입력
   const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // 여기에 발급받은 Public Key 입력
   
   // Initialize EmailJS with your public key
   emailjs.init(EMAILJS_PUBLIC_KEY);
   
   window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams) // 실제 ID로 교체
   ```

## 2. 🔑 Supabase 설정

포트폴리오의 프로젝트 보드와 AI 어시스턴트 기능은 **Supabase**를 사용합니다.

1. [Supabase](https://supabase.com/)에 가입하고 새 프로젝트를 생성합니다.
2. 설정에서 프로젝트 URL과 anon/public 키를 복사합니다.
3. `js/main-modular.js` 파일을 열어 다음 부분을 수정합니다:
   ```javascript
   // 약 16-17번 라인 근처
   const SUPABASE_URL = 'https://your-project-ref.supabase.co'; // 여기에 Supabase URL 입력
   const SUPABASE_KEY = 'your-anon-key-here'; // 여기에 Supabase anon 키 입력
   ```

## 3. 🤗 Hugging Face 토큰 설정

포트폴리오의 AI 이미지 및 음악 생성 기능은 **Hugging Face**를 사용합니다.

1. [Hugging Face](https://huggingface.co/)에 가입하고 액세스 토큰을 생성합니다.
2. 설정에서 토큰을 복사합니다.
3. `js/modules/ai-assistant.js` 파일을 열어 다음 부분을 수정합니다:
   ```javascript
   // 약 255번 라인 근처
   const HF_TOKEN = 'hf_your_token_here'; // 여기에 Hugging Face 토큰 입력
   ```

## 4. 🌐 호스팅 및 배포 방법

### 옵션 A: Vercel (강력 추천)
가장 빠르고 현대적인 배포 방식입니다.
1. [Vercel](https://vercel.com/) 사이트에 로그인합니다.
2. `Add New` -> `Project` 선택 후 GitHub 저장소를 연동합니다.
3. `port-profile` 폴더가 루트가 되도록 설정하고 `Deploy`를 누릅니다.
4. 무료 HTTPS와 전 세계 가속 CDN 서비스가 즉시 적용됩니다.

### 옵션 B: GitHub Pages
GitHub 저장소를 그대로 사용하는 방식입니다.
1. 저장소의 `Settings` -> `Pages`로 이동합니다.
2. `Build and deployment` 소스를 `Deploy from a branch`로 선택합니다.
3. `master` 또는 `main` 브랜치를 선택하고 저장합니다.
4. 수 분 내에 `https://아이디.github.io/레포이름/` 주소로 배포됩니다.

## 5. ⚠️ GitHub Push "403 Permission Denied" 해결 방법

방금 발생한 `403` 에러는 로컬 Git의 사용자 인증 정보와 GitHub 설정이 일치하지 않을 때 발생합니다. 아래 단계를 따라 해결해 보세요:

1. **현재 계정 확인:**
   ```bash
   git config user.name
   ```
   이 이름이 GitHub의 `Patrickeon`과 일치하는지 확인하세요.

2. **원격 주소에 토큰 포함 (임시 해결):**
   GitHub에서 발급받은 **Personal Access Token(PAT)**을 사용하여 주소를 재설정하면 가장 확실합니다.
   ```bash
   git remote set-url origin https://[YOUR_TOKEN]@github.com/Patrickeon/profile.git
   ```

3. **윈도우 자격 증명 관리자 정리:**
   - 윈도우 검색창ge에 `자격 증명 관리자` 입력 -> `Windows 자격 증명` 클릭.
   - `git:https://github.com/` 항목 중 낡은 정보가 있다면 제거 후 다시 `push`를 시도하여 새 로그인을 수행하세요.

---
궁금한 점이 있거나 배포 중 에러가 발생하면 언제든 물어봐 주세요!
