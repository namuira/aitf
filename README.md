# GenSpark 스타일 Custom Agent Dashboard

## 프로젝트 개요
- **이름**: GenSpark 스타일 Custom Agent Dashboard (webapp)
- **목표**: GenSpark과 같은 아름다운 메인 페이지와 관리자 대시보드를 통한 커스텀 에이전트 관리
- **특징**: 흰색 배경, 파스텔톤 아이콘, 실시간 동적 버튼 생성, HTML 모달 지원

## 공용 URL
- **개발 서버**: https://3000-i3ixrw2hugdlbs9khnsxi-6532622b.e2b.dev
- **GitHub**: (GitHub 연동 예정)

## 페이지 구조

### 📱 메인 페이지 (`/`)
**GenSpark 스타일의 에이전트 허브**
- 흰색 배경의 깔끔한 디자인
- 파스텔톤 그라데이션 아이콘 (9가지 색상)
- 기본 11개 에이전트 + 커스텀 에이전트
- 검색 입력창과 제안 태그
- 우측 하단 관리 버튼 (톱니바퀴 아이콘)

### 🔐 로그인 페이지 (`/login`)
**관리자 전용 인증 페이지**
- 어두운 그라데이션 배경
- Glass morphism 로그인 폼
- 세션 기반 인증 (24시간 유효)

### ⚙️ 대시보드 (`/dashboard`)
**커스텀 에이전트 관리 인터페이스**
- 새 버튼 생성 폼 (링크/모달 타입)
- 기존 버튼 관리 (삭제 기능)
- 메인 페이지로 돌아가기 버튼

## 현재 완료된 기능

✅ **GenSpark 스타일 메인 페이지**
- 파스텔톤 그라데이션 아이콘 (보라, 파랑, 초록, 분홍, 오렌지, 노랑, 청록, 빨강, 남색)
- 반응형 그리드 레이아웃 (모바일/태블릿/데스크톱)
- 부드러운 호버 애니메이션
- 실시간 커스텀 버튼 동기화 (30초마다 자동 새로고침)

✅ **완전 분리된 인증 시스템**
- 메인 페이지는 인증 불필요 (퍼블릭 접근)
- 관리 기능만 인증 필요
- 기본 비밀번호: `admin123`

✅ **실시간 연동 시스템**
- 대시보드에서 버튼 추가 → 즉시 메인 페이지에 반영
- API를 통한 실시간 데이터 동기화
- 링크/모달 타입 모두 지원

✅ **커스텀 버튼 기능**
- **링크 타입**: 새 탭에서 외부 URL 열기
- **모달 타입**: HTML 콘텐츠 팝업 표시
- FontAwesome 아이콘 지원
- 9가지 파스텔 색상 테마

## URL 구조 및 주요 API

### 페이지 URL
- `GET /` - GenSpark 스타일 메인 페이지
- `GET /login` - 관리자 로그인 페이지  
- `GET /dashboard` - 관리 대시보드 (인증 필요)

### API 엔드포인트
- `POST /api/login` - 로그인
- `POST /api/logout` - 로그아웃
- `GET /api/buttons` - 버튼 목록 (퍼블릭)
- `POST /api/buttons` - 새 버튼 추가 (인증 필요)
- `DELETE /api/buttons/:id` - 버튼 삭제 (인증 필요)

## 사용자 가이드

### 👥 일반 사용자 (메인 페이지)
1. 메인 URL 접속
2. 기본 에이전트들 및 커스텀 추가된 에이전트들 확인
3. **링크 에이전트**: 클릭 시 새 탭에서 링크 열기
4. **모달 에이전트**: 클릭 시 HTML 콘텐츠 팝업

### 👨‍💼 관리자 (대시보드)
1. 우측 하단 톱니바퀴 버튼 클릭
2. 비밀번호 입력: `admin123`
3. **버튼 추가**:
   - 제목, 타입(링크/모달), 설명 입력
   - 링크 타입: URL 입력
   - 모달 타입: HTML 내용 입력
   - 아이콘 및 색상 선택
4. **버튼 삭제**: 각 버튼 호버 시 휴지통 아이콘 클릭

### 💡 사용 예시

**링크 에이전트 추가:**
```
제목: "ChatGPT"
타입: 링크
URL: https://chat.openai.com
아이콘: fas fa-comments
색상: 초록색
```

**모달 에이전트 추가:**
```
제목: "회사 연락처"
타입: 모달
HTML 내용:
<h2>📞 주요 연락처</h2>
<ul>
  <li><strong>개발팀:</strong> dev@company.com</li>
  <li><strong>디자인팀:</strong> design@company.com</li>
  <li><strong>대표번호:</strong> 02-1234-5678</li>
</ul>
```

## 데이터 아키텍처
- **저장소**: Cloudflare KV (`WEBAPP_KV` 네임스페이스)
- **세션 관리**: KV 기반, 24시간 TTL
- **데이터 모델**:
  ```typescript
  interface CustomButton {
    id: string;
    title: string;
    description?: string;
    type: 'link' | 'modal';
    url?: string;
    htmlContent?: string;
    icon?: string;  // FontAwesome 클래스
    color?: string; // purple|blue|green|pink|orange|yellow|teal|red|indigo
    createdAt: string;
  }
  ```

## 배포 정보
- **플랫폼**: Cloudflare Pages 준비 완료
- **상태**: ✅ 개발 서버 활성화
- **기술 스택**: 
  - Backend: Hono + TypeScript + Cloudflare KV
  - Frontend: Vanilla JavaScript + TailwindCSS + FontAwesome
  - 인증: 세션 기반 (쿠키)
- **마지막 업데이트**: 2025-09-20

## 파스텔 색상 팔레트
```css
보라색 (purple): #e0c3fc → #9bb5ff
파란색 (blue): #a8e6cf → #88d8ff  
초록색 (green): #c3f0ca → #a8e6cf
분홍색 (pink): #ffc3d8 → #ffb3d9
오렌지 (orange): #ffd3a5 → #fd9853
노란색 (yellow): #fff2a8 → #ffcc70
청록색 (teal): #a8f0e6 → #70d0c4
빨간색 (red): #ffb3ba → #ff9aa2
남색 (indigo): #c5b9ff → #a29bfe
```

## 향후 개발 계획

### 🔴 우선순위 높음
- **보안 강화**: 비밀번호 해싱, XSS 방지
- **데이터 관리**: 버튼 순서 변경 (드래그앤드롭)
- **검색 기능**: 메인 페이지 검색 입력 실제 구현

### 🟡 우선순위 중간
- **카테고리**: 에이전트 그룹화 기능
- **통계**: 클릭 수, 사용 빈도 추적
- **테마**: 다크모드, 추가 색상 팔레트

### 🟢 우선순위 낮음
- **다중 사용자**: 사용자별 에이전트 관리
- **공유 기능**: 퍼블릭 에이전트 링크
- **PWA**: 모바일 앱 같은 경험

## 기술 특징

**✨ 혁신적인 아키텍처**
- 메인 페이지와 관리 기능의 완전 분리
- 실시간 API 동기화로 즉시 반영
- 인증 없이도 사용 가능한 퍼블릭 인터페이스

**🎨 GenSpark 수준의 UI/UX**
- 파스텔 그라데이션으로 부드러운 시각적 경험
- 반응형 디자인으로 모든 기기 지원
- 직관적인 관리 인터페이스

**⚡ 최적화된 성능**
- Cloudflare Workers 엣지 런타임
- KV 스토리지로 빠른 데이터 접근
- 30초 주기 자동 새로고침으로 실시간성 보장

이제 당신만의 GenSpark 스타일 에이전트 허브를 가지게 되었습니다! 🚀✨