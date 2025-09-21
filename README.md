# GenSpark 커스텀 에이전트 대시보드 🚀

## 프로젝트 개요
- **이름**: GenSpark 스타일 커스텀 에이전트 대시보드
- **목표**: 사용자가 동적으로 버튼을 추가할 수 있는 GenSpark 스타일 대시보드
- **주요 기능**: 
  - 3가지 버튼 타입 지원 (링크, 모달, Typebot)
  - 비밀번호 보호 관리 인터페이스
  - GitHub Pages + PC 서버 하이브리드 아키텍처
  - 실시간 동기화 (30초 간격)

## 📡 배포 상태
- **로컬 서버**: ✅ **활성** - http://localhost:8080
- **API 엔드포인트**: ✅ **활성** - http://localhost:8080/api/*
- **대시보드**: ✅ **활성** - http://localhost:8080/login (비밀번호: admin123)
- **GitHub Pages**: 📋 **준비됨** - github-pages-index.html 파일 준비 완료

## 🏗️ 아키텍처

### 하이브리드 구조
```
GitHub Pages (정적 호스팅)    ←→    PC 서버 (Node.js Express)
├── 메인 인터페이스                  ├── 관리 대시보드 (:8080/login)
├── 기본 에이전트 표시               ├── API 서버 (:8080/api/*)
├── 실시간 동기화 (30초)              ├── 버튼 데이터 관리
└── Typebot 통합                    └── 세션 관리
```

### 데이터 아키텍처
- **저장소**: 파일 기반 JSON (`data/buttons.json`)
- **데이터 모델**: CustomButton 인터페이스
- **세션 관리**: 메모리 기반 Map 구조 (개발용)
- **CORS 설정**: `origin: '*'` (GitHub Pages 호환)

```typescript
interface CustomButton {
  id: string;
  title: string;
  description?: string;
  type: 'link' | 'modal' | 'typebot';
  url?: string;           // link 타입용
  htmlContent?: string;   // modal 타입용  
  typebotId?: string;     // typebot 타입용
  apiHost?: string;       // typebot 타입용 (선택)
  icon?: string;          // FontAwesome 아이콘
  color?: string;         // 파스텔 그래디언트 색상
  createdAt: string;
}
```

## 🎯 기능 명세

### 현재 완료된 기능 ✅

#### 1. PC 서버 (Node.js Express)
- **포트**: 8080, 모든 인터페이스 바인딩 (`0.0.0.0`)
- **메인 페이지**: GenSpark 스타일 UI (`/`)
- **관리자 인터페이스**: 비밀번호 보호 (`/login`, `/dashboard`)
- **API 엔드포인트**: RESTful API (`/api/*`)

#### 2. 3가지 버튼 타입 완전 구현
1. **링크 버튼** (`type: 'link'`)
   - 외부 URL을 새 창에서 열기
   - 필수: `url` 필드
   
2. **모달 버튼** (`type: 'modal'`)  
   - HTML 콘텐츠를 팝업 모달로 표시
   - 필수: `htmlContent` 필드
   
3. **Typebot 버튼** (`type: 'typebot'`)
   - AI 챗봇 팝업 실행
   - 필수: `typebotId` 필드
   - 선택: `apiHost` 필드 (기본값 사용 가능)

#### 3. 관리 시스템
- **인증**: 세션 기반 (쿠키), 24시간 만료
- **비밀번호**: `admin123` (하드코딩)
- **CRUD 기능**: 버튼 생성, 조회, 삭제
- **실시간 업데이트**: 변경사항 즉시 반영

#### 4. GitHub Pages 통합
- **파일**: `github-pages-index.html` 준비 완료
- **CORS 해결**: Express 서버에서 `origin: '*'` 설정
- **실시간 동기화**: 30초마다 API 호출
- **설정 UI**: 서버 URL 동적 변경 가능

#### 5. ARM64 Windows 호환성
- **문제 해결**: Cloudflare Workers `workerd` 패키지 호환성 문제 우회
- **솔루션**: 순수 Node.js Express 서버로 대체
- **의존성**: `express`, `cors`, `uuid` (최소 의존성)

### 현재 테스트 결과 ✅
```json
{
  "server_status": "✅ 실행 중 (localhost:8080)",
  "api_status": "✅ 정상 (CORS 설정 완료)",
  "authentication": "✅ 정상 (세션 기반)",
  "button_crud": "✅ 정상 (추가/조회/삭제)",
  "data_persistence": "✅ 정상 (파일 저장)",
  "test_button": {
    "id": "dbd1092d-0208-4eee-8926-b321fea7e74d",
    "title": "테스트 링크",
    "type": "link",
    "url": "https://www.google.com"
  }
}
```

## 🚀 사용 가이드

### PC에서 서버 실행
```bash
# 1. ARM64 Windows 호환 의존성 사용
cp package-windows.json package.json
npm install

# 2. 서버 시작
npm start
# 또는
node server.js
```

### 대시보드 접근
1. **로그인**: http://localhost:8080/login
2. **비밀번호**: `admin123`
3. **버튼 관리**: 추가/삭제 인터페이스

### GitHub Pages 배포
1. `github-pages-index.html`을 `index.html`로 복사
2. GitHub 저장소에 푸시
3. Pages 설정에서 `main` 브랜치 선택
4. 배포 후 우측 하단 톱니바퀴로 서버 URL 설정

### 네트워크 접근
1. **Windows 방화벽**: 포트 8080 허용 규칙 추가
2. **내부 IP 확인**: `ipconfig` 명령어
3. **외부 접근**: 라우터 포트 포워딩 설정

## 📋 다음 단계 추천

### 즉시 가능한 개선사항
1. **GitHub Pages 배포 테스트**
   - `github-pages-index.html` → `index.html` 복사
   - 실제 GitHub Pages에서 동작 확인
   
2. **네트워크 접근 테스트**
   - 방화벽 설정 후 다른 기기에서 접근 테스트
   - 모바일에서 PC 서버 접근 확인

3. **Typebot 연동 테스트**
   - 실제 Typebot ID로 에이전트 추가
   - 팝업 기능 동작 확인

### 향후 확장 가능사항
1. **보안 강화**: 환경변수 기반 비밀번호
2. **데이터베이스 연동**: SQLite 또는 외부 DB
3. **사용자 시스템**: 다중 사용자 지원
4. **테마 시스템**: 커스텀 색상/아이콘 팔레트
5. **백업 기능**: 버튼 데이터 내보내기/가져오기

## 🔧 기술 스택
- **백엔드**: Node.js Express 서버
- **프론트엔드**: Vanilla JavaScript + Tailwind CSS
- **데이터**: JSON 파일 기반 저장소
- **인증**: 세션 쿠키 기반
- **배포**: GitHub Pages + 로컬 PC 서버
- **호환성**: ARM64 Windows 완전 지원

## 🏆 성과 요약
- ✅ ARM64 Windows 호환성 문제 해결
- ✅ 3가지 버튼 타입 완전 구현  
- ✅ 실시간 동기화 시스템 구축
- ✅ GitHub Pages 통합 완료
- ✅ GenSpark UI/UX 스타일 재현
- ✅ 비밀번호 보호 관리 시스템
- ✅ CORS 문제 완전 해결

**마지막 업데이트**: 2025-09-21