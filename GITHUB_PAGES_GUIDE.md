# GitHub Pages 배포 가이드

이 가이드는 현재 만든 GenSpark 스타일 index.html을 GitHub Pages에 배포하여 외부에서 접근할 수 있도록 설정하는 방법을 설명합니다.

## 📋 목차
1. [GitHub Repository 생성](#1-github-repository-생성)
2. [HTML 파일 업로드](#2-html-파일-업로드)
3. [GitHub Pages 활성화](#3-github-pages-활성화)
4. [대시보드 서버와 연동](#4-대시보드-서버와-연동)
5. [CORS 설정 확인](#5-cors-설정-확인)
6. [문제 해결](#6-문제-해결)

## 1. GitHub Repository 생성

### 1-1. 새 Repository 만들기
1. GitHub.com 접속 후 로그인
2. 우측 상단 `+` 버튼 클릭 → `New repository`
3. Repository 이름 입력 (예: `my-genspark-agents`)
4. `Public` 선택
5. `Add a README file` 체크
6. `Create repository` 클릭

### 1-2. Repository 설정
```bash
# 로컬에 클론 (선택사항)
git clone https://github.com/YOUR_USERNAME/my-genspark-agents.git
cd my-genspark-agents
```

## 2. HTML 파일 업로드

### 방법 1: GitHub 웹 인터페이스 사용 (권장)

1. Repository 페이지에서 `Add file` → `Upload files` 클릭
2. `github-pages-index.html` 파일을 드래그앤드롭
3. 파일명을 `index.html`로 변경
4. Commit 메시지 입력: "Add GenSpark style agent dashboard"
5. `Commit changes` 클릭

### 방법 2: Git 명령어 사용

```bash
# 1. HTML 파일 복사 (현재 프로젝트에서)
cp /home/user/webapp/github-pages-index.html ./index.html

# 2. Git 커밋
git add index.html
git commit -m "Add GenSpark style agent dashboard"
git push origin main
```

## 3. GitHub Pages 활성화

1. Repository 페이지에서 `Settings` 탭 클릭
2. 왼쪽 메뉴에서 `Pages` 클릭
3. **Source** 설정:
   - `Deploy from a branch` 선택
   - Branch: `main` 선택
   - Folder: `/ (root)` 선택
4. `Save` 클릭
5. 몇 분 후 다음 URL에서 접근 가능:
   ```
   https://YOUR_USERNAME.github.io/my-genspark-agents/
   ```

## 4. 대시보드 서버와 연동

### 4-1. 대시보드 서버 준비

**현재 개발 서버 사용 (임시)**
```
서버 URL: https://3000-i3ixrw2hugdlbs9khnsxi-6532622b.e2b.dev
```

**Cloudflare Pages에 배포 (권장)**
1. 대시보드를 Cloudflare Pages에 배포
2. 커스텀 도메인 설정 (예: `https://my-dashboard.pages.dev`)

### 4-2. GitHub Pages에서 서버 설정

1. GitHub Pages 사이트 접속
2. 우측 하단 톱니바퀴 버튼 클릭
3. 대시보드 서버 URL 입력
4. `저장` 클릭

## 5. CORS 설정 확인

### 5-1. 서버 측 CORS 설정 (이미 적용됨)

현재 대시보드 서버는 다음 CORS 설정을 사용합니다:

```typescript
app.use('/api/*', cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}))
```

### 5-2. CORS 동작 확인

브라우저 개발자 도구에서 다음 확인:
1. `F12` → `Console` 탭
2. 에러 메시지 확인
3. `Network` 탭에서 API 요청 상태 확인

## 6. 문제 해결

### 6-1. 일반적인 문제들

**❌ CORS 에러**
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```
**해결방법:**
- 서버 CORS 설정 확인
- 브라우저 캐시 삭제
- 시크릿 모드에서 테스트

**❌ 서버 연결 실패**
```
ERR_NETWORK 또는 timeout 에러
```
**해결방법:**
- 서버 URL 올바른지 확인
- 서버가 실행 중인지 확인
- 네트워크 연결 확인

**❌ GitHub Pages 404 에러**
```
404 - File not found
```
**해결방법:**
- 파일명이 `index.html`인지 확인
- Repository가 Public인지 확인
- GitHub Pages가 활성화되었는지 확인

### 6-2. 디버깅 팁

**브라우저 콘솔 확인**
```javascript
// 브라우저 콘솔에서 실행
console.log('Current server URL:', localStorage.getItem('dashboardServerUrl'));

// API 직접 테스트
fetch('https://YOUR_SERVER_URL/api/buttons')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**네트워크 상태 확인**
1. `F12` → `Network` 탭
2. `Clear` 클릭하여 로그 초기화
3. 페이지 새로고침
4. API 요청들의 Status 확인 (200 OK 여야 함)

## 📝 체크리스트

배포 전 확인사항:

- [ ] GitHub Repository 생성 완료
- [ ] `index.html` 파일 업로드 완료
- [ ] GitHub Pages 활성화 완료
- [ ] 대시보드 서버 URL 설정 완료
- [ ] 기본 에이전트들이 정상 표시되는지 확인
- [ ] 커스텀 에이전트 연동 테스트 완료
- [ ] 모바일에서도 정상 작동하는지 확인

## 🚀 완료 후 결과

성공적으로 배포되면:

1. **메인 페이지**: `https://YOUR_USERNAME.github.io/REPOSITORY_NAME/`
2. **대시보드**: 우측 하단 톱니바퀴 → 설정된 서버 URL
3. **기능**: 
   - 기본 11개 에이전트 표시
   - 대시보드에서 추가한 커스텀 에이전트 실시간 동기화
   - 링크/모달 타입 모두 정상 작동

## 💡 추가 팁

### 커스텀 도메인 설정
1. `Settings` → `Pages` → `Custom domain`
2. 도메인 입력 (예: `agents.yoursite.com`)
3. DNS 설정에서 CNAME 레코드 추가

### 업데이트 방법
1. `github-pages-index.html` 파일 수정
2. GitHub Repository의 `index.html` 덮어쓰기
3. 몇 분 후 자동 반영

이제 전 세계 어디서나 접근 가능한 나만의 GenSpark 스타일 에이전트 허브를 가지게 되었습니다! 🎉