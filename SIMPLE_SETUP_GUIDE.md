# 🚀 초간단 설치 및 사용 가이드

## 📋 목차
1. [GitHub Pages 배포](#1-github-pages-배포-5분)
2. [PC에서 서버 실행](#2-pc에서-서버-실행-5분)
3. [연동 및 사용법](#3-연동-및-사용법-2분)

---

## 1. GitHub Pages 배포 (5분)

### ⬇️ 파일 다운로드
```bash
# 1. 파일 다운로드
wget https://raw.githubusercontent.com/사용자이름/저장소/main/github-pages-index.html
# 또는 프로젝트에서 github-pages-index.html 복사
```

### 📁 GitHub 업로드
1. GitHub.com → 새 Repository 생성
2. `Add file` → `Upload files`
3. `github-pages-index.html`을 `index.html`로 업로드
4. Settings → Pages → Deploy from branch (main) → Save
5. 완료! `https://사용자명.github.io/저장소명/` 접속 가능

---

## 2. PC에서 서버 실행 (5분)

### 📦 필요한 것들
- **Node.js** (18 이상)
- **Git**

### ⬇️ 서버 다운로드
```bash
# 1. 프로젝트 다운로드
git clone https://github.com/사용자명/저장소.git
cd webapp

# 2. 패키지 설치
npm install

# 3. 빌드
npm run build
```

### 🖥️ 서버 실행 (8080 포트)
```bash
# PM2로 서버 실행 (자동 재시작)
npm install -g pm2
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npx wrangler pages dev dist --ip 0.0.0.0 --port 8080
```

### 🌐 외부 접근 설정
```bash
# 방화벽 포트 8080 열기 (Windows)
netsh advfirewall firewall add rule name="GenSpark-8080" dir=in action=allow protocol=TCP localport=8080

# 방화벽 포트 8080 열기 (Linux/macOS)
sudo ufw allow 8080
# 또는
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

### 📋 접근 URL
- **로컬**: http://localhost:8080
- **네트워크**: http://내PC아이피:8080
- **대시보드**: http://내PC아이피:8080/login

---

## 3. 연동 및 사용법 (2분)

### 🔗 GitHub Pages ↔ PC 서버 연동

**1단계: GitHub Pages 설정**
```
GitHub Pages 사이트 접속 → 우측 하단 톱니바퀴 버튼 클릭
서버 URL 입력: http://내PC아이피:8080
저장 클릭
```

**2단계: 즉시 연동 확인**
- 30초 내로 PC 서버의 버튼들이 GitHub Pages에 표시됨
- 실시간 동기화 시작 ✅

### ⚙️ 관리자 버튼 추가

**PC 서버 대시보드 접속:**
```
http://내PC아이피:8080/login
비밀번호: admin123
```

**버튼 추가 예시:**

**🔗 링크 버튼**
```
제목: "ChatGPT"
타입: 링크
URL: https://chat.openai.com
아이콘: fas fa-comments
색상: 초록색
```

**📱 모달 버튼**
```
제목: "연락처"
타입: 모달
HTML 내용:
<h2>📞 팀 연락처</h2>
<ul>
  <li>개발팀: dev@company.com</li>
  <li>디자인팀: design@company.com</li>
</ul>
```

**🤖 Typebot 에이전트 버튼**
```
제목: "AI 상담봇"
타입: Typebot 에이전트
Typebot ID: your-typebot-id
API Host: https://bot.linkpingchat.xyz
아이콘: fas fa-robot
색상: 보라색
```

### 🎯 사용자 경험

**GitHub Pages 사용자가 버튼 클릭 시:**
- **링크**: 새 창에서 외부 사이트 열림
- **모달**: HTML 콘텐츠 팝업 표시  
- **Typebot**: AI 채팅봇 팝업 실행 🤖

---

## 🔧 문제 해결

### ❌ 연동 안 될 때
```bash
# 1. 서버 상태 확인
curl http://내PC아이피:8080/api/buttons

# 2. 방화벽 확인
telnet 내PC아이피 8080

# 3. PM2 상태 확인  
pm2 list
pm2 logs
```

### 🌐 외부 접근 설정
```bash
# 내 PC IP 확인
ipconfig (Windows)
ifconfig (Linux/macOS)

# 공유기 포트포워딩 설정
# 공유기 관리페이지 → 포트포워딩 → 8080 포트 추가
```

---

## 📊 폴더 구조

```
webapp/
├── github-pages-index.html    ← GitHub Pages에 업로드할 파일
├── src/index.tsx             ← 서버 메인 코드
├── public/static/app.js      ← 대시보드 JavaScript
├── ecosystem.config.cjs      ← PM2 설정
├── package.json              ← 패키지 정보
└── README.md                 ← 상세 문서
```

---

## ✅ 완료 체크리스트

**GitHub Pages 배포:**
- [ ] Repository 생성
- [ ] index.html 업로드
- [ ] Pages 활성화
- [ ] 접속 확인

**PC 서버 실행:**
- [ ] Node.js 설치
- [ ] 프로젝트 다운로드
- [ ] npm install 실행
- [ ] 서버 실행 (8080 포트)
- [ ] 방화벽 포트 열기

**연동 확인:**
- [ ] GitHub Pages에서 서버 URL 설정
- [ ] 버튼 연동 확인
- [ ] 대시보드 접근 확인 (admin123)

---

## 🎉 완성!

이제 다음을 가지게 되었습니다:

- 🌍 **전 세계 접근 가능**: GitHub Pages로 무료 호스팅
- 🖥️ **개인 서버 관리**: PC에서 완전 제어  
- 🤖 **3가지 버튼 타입**: 링크, 모달, Typebot 에이전트
- ⚡ **실시간 동기화**: 30초마다 자동 업데이트
- 📱 **모든 기기 지원**: 모바일/태블릿/데스크톱

**사용자**: GitHub Pages에서 아름다운 에이전트 허브 이용  
**관리자**: PC 서버에서 간편한 버튼 관리  
**개발자**: 완전한 코드 제어와 커스터마이징 가능