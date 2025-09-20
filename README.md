# Custom Agent Dashboard

## 프로젝트 개요
- **이름**: Custom Agent Dashboard (webapp)
- **목표**: 비밀번호로 보호되는 개인용 커스텀 에이전트 및 링크 관리 대시보드
- **특징**: GenSpark 스타일의 아름다운 UI, 모달 팝업, 링크 관리, 동적 버튼 생성

## 공용 URL
- **개발 서버**: https://3000-i3ixrw2hugdlbs9khnsxi-6532622b.e2b.dev
- **GitHub**: (GitHub 연동 예정)

## 현재 완료된 기능
✅ **인증 시스템**
- 비밀번호 기반 로그인 (기본 비밀번호: `admin123`)
- 세션 관리 (24시간 유효)
- 자동 로그아웃 기능

✅ **대시보드 UI**
- GenSpark 스타일의 그라데이션 배경
- 반응형 디자인 (모바일/태블릿/데스크톱 지원)
- Glass morphism 효과
- 부드러운 애니메이션과 호버 효과

✅ **커스텀 버튼 관리**
- 동적 버튼 생성/삭제
- 링크 타입: 새 탭에서 외부 링크 열기
- 모달 타입: HTML 콘텐츠를 팝업 모달로 표시
- 6가지 색상 테마 (보라, 파랑, 초록, 빨강, 노랑, 분홍)
- FontAwesome 아이콘 지원

✅ **데이터 저장소**
- Cloudflare KV 스토리지 활용
- 실시간 데이터 동기화
- 영구 데이터 보존

## 주요 API 엔드포인트

### 인증
- `POST /api/login` - 로그인
- `POST /api/logout` - 로그아웃

### 버튼 관리  
- `GET /api/buttons` - 모든 버튼 목록 조회
- `POST /api/buttons` - 새 버튼 추가
- `DELETE /api/buttons/:id` - 버튼 삭제

### 페이지
- `GET /` - 로그인 페이지
- `GET /dashboard` - 대시보드 (인증 필요)

## 데이터 아키텍처
- **데이터 모델**: 
  ```typescript
  interface CustomButton {
    id: string;
    title: string;
    description?: string;
    type: 'link' | 'modal';
    url?: string;
    htmlContent?: string;
    icon?: string;
    color?: string;
    createdAt: string;
  }
  ```
- **저장소 서비스**: Cloudflare KV (`WEBAPP_KV` 네임스페이스)
- **세션 관리**: KV 스토리지 기반 세션 (TTL 24시간)

## 사용자 가이드

### 1. 로그인
1. 홈페이지 방문
2. 비밀번호 입력 (기본값: `admin123`)
3. '로그인' 버튼 클릭

### 2. 버튼 추가
1. 대시보드에서 "새 버튼 추가" 섹션으로 이동
2. 제목, 타입(링크/모달), 설명 입력
3. **링크 타입**: URL 입력
4. **모달 타입**: HTML 내용 입력
5. 아이콘(FontAwesome)과 색상 선택
6. '버튼 추가' 클릭

### 3. 버튼 사용
- **링크 버튼**: 클릭하면 새 탭에서 링크 열기
- **모달 버튼**: 클릭하면 HTML 콘텐츠가 팝업 모달로 표시

### 4. 버튼 삭제
- 각 버튼에 마우스 오버하면 삭제 버튼(휴지통) 표시
- 삭제 버튼 클릭 후 확인

## 배포 정보
- **플랫폼**: Cloudflare Pages (개발 중)
- **상태**: ✅ 개발 서버 활성화
- **기술 스택**: Hono + TypeScript + TailwindCSS + Cloudflare KV
- **마지막 업데이트**: 2025-09-20

## 향후 개발 계획

### 우선순위 높음
🔴 **보안 강화**
- 비밀번호 해싱 (현재 평문 저장)
- CSRF 토큰 구현
- 입력값 검증 및 XSS 방지

🔴 **사용자 설정**
- 비밀번호 변경 기능
- 테마 커스터마이징
- 버튼 순서 변경 (드래그앤드롭)

### 우선순위 중간  
🟡 **고급 기능**
- 카테고리별 버튼 그룹화
- 검색 및 필터링
- 버튼 내보내기/가져오기
- 사용 통계 및 분석

🟡 **UI/UX 개선**
- 다크모드 지원
- 키보드 단축키
- 더 많은 애니메이션 효과

### 우선순위 낮음
🟢 **추가 기능**
- 다중 사용자 지원
- 공유 링크 기능
- 모바일 앱 (PWA)
- API 문서화

## 기술 세부사항
- **프레임워크**: Hono (경량 웹 프레임워크)
- **런타임**: Cloudflare Workers
- **프론트엔드**: Vanilla JavaScript + TailwindCSS
- **데이터베이스**: Cloudflare KV
- **인증**: 세션 기반 (쿠키)
- **빌드 도구**: Vite
- **배포**: Wrangler (Cloudflare CLI)