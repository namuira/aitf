# 🚀 GenSpark 커스텀 에이전트 대시보드 - Windows ARM64 설정 가이드

## 📋 개요
ARM64 Windows 환경에서 Cloudflare Workers 호환성 문제를 해결하기 위한 Node.js Express 서버 솔루션입니다.

## 🔧 빠른 설정 (5분)

### 1️⃣ 필수 요구사항
- **Node.js 18+** 설치 (https://nodejs.org)
- **Windows ARM64** 지원
- **방화벽 설정** (포트 8080)

### 2️⃣ 서버 설정

```bash
# 1. 프로젝트 디렉토리로 이동
cd /your/project/path

# 2. 윈도우용 package.json 사용
cp package-windows.json package.json

# 3. 의존성 설치 (ARM64 호환)
npm install

# 4. 서버 시작
npm start
```

### 3️⃣ 서버 확인

```bash
# 로컬 접근 테스트
curl http://localhost:8080

# 또는 브라우저에서
http://localhost:8080
```

**서버 출력 예시:**
```
🚀 서버가 시작되었습니다!
📱 메인 페이지: http://localhost:8080
⚙️  대시보드: http://localhost:8080/login
🔑 비밀번호: admin123
🌐 네트워크 접근: http://내PC아이피:8080
```

### 4️⃣ 네트워크 접근 설정

#### Windows 방화벽 설정:
1. **제어판 → 시스템 및 보안 → Windows Defender 방화벽**
2. **고급 설정** 클릭
3. **인바운드 규칙 → 새 규칙**
4. **포트 → TCP → 특정 로컬 포트 → 8080**
5. **연결 허용 → 모든 프로필** 체크

#### 내부 IP 확인:
```cmd
ipconfig
```

**예시:** `192.168.1.100:8080`

### 5️⃣ GitHub Pages 배포

1. **github-pages-index.html**을 GitHub 저장소의 **index.html**로 복사
2. **GitHub Pages** 활성화 (Settings → Pages → Source: Deploy from a branch)
3. **Branch: main** 선택
4. **배포 완료 후** GitHub Pages URL 접근

## 🎯 사용법

### 대시보드 관리
- **URL**: `http://YOUR_PC_IP:8080/login`
- **비밀번호**: `admin123`
- **기능**: 버튼 추가/삭제, 3가지 타입 지원

### 버튼 타입
1. **링크 버튼**: 외부 URL 새 창 열기
2. **모달 버튼**: HTML 콘텐츠 팝업 표시  
3. **Typebot 버튼**: AI 챗봇 팝업 실행

### GitHub Pages 설정
- **서버 URL 설정**: 우측 하단 톱니바퀴 버튼
- **URL 입력**: `http://YOUR_PC_IP:8080`
- **실시간 동기화**: 30초마다 자동 업데이트

## 🔍 트러블슈팅

### 서버 시작 실패
```bash
# 포트 8080 사용 중
lsof -ti:8080 | xargs kill -9

# 다시 시작
npm start
```

### 네트워크 접근 불가
1. **방화벽 규칙** 재확인
2. **라우터 설정** 확인 (필요시 포트 포워딩)
3. **내부 IP 주소** 재확인

### GitHub Pages CORS 오류
- Node.js 서버에서 CORS 설정이 자동으로 처리됩니다
- `origin: '*'` 설정으로 모든 도메인 허용

## 📁 파일 구조

```
webapp/
├── server.js              # Node.js Express 서버 (메인)
├── package-windows.json   # ARM64 호환 의존성
├── github-pages-index.html # GitHub Pages 배포용
├── data/
│   └── buttons.json      # 버튼 데이터 (자동 생성)
└── WINDOWS_SETUP_GUIDE.md # 이 가이드
```

## ⚡ 성능 및 제한사항

### 장점
- **ARM64 Windows 완전 호환**
- **Cloudflare Workers 의존성 없음**
- **로컬 파일 저장소** (빠른 읽기/쓰기)
- **CORS 자동 처리**
- **실시간 동기화**

### 제한사항
- **PC가 켜져 있어야 함**
- **내부 네트워크에서만 접근 가능** (기본 설정)
- **외부 접근 시 포트 포워딩 필요**

## 🌐 외부 접근 설정 (선택사항)

### 포트 포워딩 설정:
1. **라우터 관리자 페이지** 접속
2. **포트 포워딩/가상 서버** 메뉴
3. **외부 포트: 8080 → 내부 IP:8080** 설정
4. **규칙 저장 및 적용**

### 동적 DNS 사용:
- **No-IP**, **DynDNS** 등 무료 서비스 활용
- **도메인명:8080**으로 어디서든 접근 가능

---

## 🎉 완료!

설정이 완료되면:
- **PC에서**: `http://localhost:8080`
- **같은 네트워크**: `http://내PC아이피:8080`  
- **GitHub Pages**: `https://your-username.github.io/your-repo`

**모든 디바이스에서 GenSpark 스타일 커스텀 에이전트 대시보드를 사용할 수 있습니다!**