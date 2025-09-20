# 서버-GitHub Pages 연동 메커니즘

## 📋 연동 과정 상세 설명

### 1단계: 대시보드에서 버튼 추가

**관리자가 대시보드에서 버튼을 추가할 때:**

```typescript
// 사용자가 대시보드에서 "버튼 추가" 클릭
// /dashboard 페이지의 JavaScript에서 실행

async function addNewButton() {
  const buttonData = {
    title: "Google",           // 사용자 입력
    type: "link",             // 링크 또는 모달
    url: "https://google.com", // URL
    icon: "fas fa-search",     // 아이콘
    color: "blue"             // 색상
  };

  // 서버 API로 POST 요청
  const response = await axios.post('/api/buttons', buttonData);
}
```

### 2단계: 서버에서 데이터 저장

**Hono 서버의 API 엔드포인트에서:**

```typescript
// src/index.tsx의 POST /api/buttons 핸들러
app.post('/api/buttons', authMiddleware, async (c) => {
  // 1. 기존 버튼들을 KV에서 가져오기
  const existingButtons = await c.env.WEBAPP_KV.get('custom_buttons', 'json') || [];
  
  // 2. 새 버튼 객체 생성
  const newButton = {
    id: crypto.randomUUID(),        // 고유 ID 생성
    title: buttonData.title,
    type: buttonData.type,
    url: buttonData.url,
    icon: buttonData.icon,
    color: buttonData.color,
    createdAt: new Date().toISOString()
  };
  
  // 3. 배열에 추가
  existingButtons.push(newButton);
  
  // 4. Cloudflare KV에 저장
  await c.env.WEBAPP_KV.put('custom_buttons', JSON.stringify(existingButtons));
  
  return c.json({ success: true, button: newButton });
});
```

### 3단계: GitHub Pages에서 데이터 조회

**GitHub Pages의 index.html에서 30초마다 실행:**

```javascript
// github-pages-index.html의 JavaScript
async function loadAgents() {
  try {
    // 설정된 서버 URL로 API 요청
    const serverUrl = localStorage.getItem('dashboardServerUrl');
    const response = await axios.get(`${serverUrl}/api/buttons`);
    
    // 서버로부터 받은 커스텀 버튼 데이터
    const customButtons = response.data || [];
    
    // 기본 에이전트와 커스텀 버튼 합치기
    const allAgents = [...defaultAgents];
    customButtons.forEach(button => {
      allAgents.splice(-1, 0, {
        id: button.id,
        title: button.title,
        icon: button.icon,
        color: button.color,
        custom: true,
        type: button.type,
        url: button.url,
        htmlContent: button.htmlContent
      });
    });
    
    // 화면에 렌더링
    renderAgents(allAgents);
    
  } catch (error) {
    console.log('서버 연결 실패, 기본 에이전트만 표시');
    renderAgents(defaultAgents);
  }
}

// 30초마다 자동 실행
setInterval(loadAgents, 30000);
```

### 4단계: 서버 API에서 데이터 반환

**GET /api/buttons 엔드포인트:**

```typescript
// 인증 없이 접근 가능 (GitHub Pages용)
app.get('/api/buttons', async (c) => {
  try {
    // KV에서 저장된 버튼 데이터 조회
    const buttons = await c.env.WEBAPP_KV.get('custom_buttons', 'json') || [];
    
    // CORS 헤더와 함께 JSON 응답
    return c.json(buttons);
  } catch (error) {
    return c.json({ error: '데이터 조회 실패' }, 500);
  }
});
```

## 🔍 실제 데이터 흐름 예시

### 예시: "ChatGPT" 버튼 추가

**1. 관리자 입력 (대시보드):**
```json
{
  "title": "ChatGPT",
  "type": "link", 
  "url": "https://chat.openai.com",
  "icon": "fas fa-robot",
  "color": "green"
}
```

**2. 서버 저장 (KV Storage):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "ChatGPT",
    "type": "link",
    "url": "https://chat.openai.com", 
    "icon": "fas fa-robot",
    "color": "green",
    "createdAt": "2025-09-20T16:30:00.000Z"
  }
]
```

**3. GitHub Pages 요청:**
```javascript
GET https://3000-i3ixrw2hugdlbs9khnsxi-6532622b.e2b.dev/api/buttons

// 응답받은 데이터로 HTML 생성
<div class="agent-icon icon-green">
  <i class="fas fa-robot"></i>
</div>
<h3>ChatGPT</h3>
```

## 🕐 실시간 동기화 매커니즘

### 자동 폴링 시스템

```javascript
// 페이지 로드 시 즉시 실행
document.addEventListener('DOMContentLoaded', function() {
  loadAgents(); // 첫 로드
});

// 30초마다 자동 새로고침
setInterval(loadAgents, 30000);
```

### 수동 새로고침

```javascript
// 사용자가 페이지 새로고침하면 즉시 반영
window.addEventListener('focus', function() {
  loadAgents(); // 탭에 포커스 올 때마다 새로고침
});
```

## 🔧 CORS 설정으로 외부 접근 허용

**서버 측 설정:**

```typescript
app.use('/api/*', cors({
  origin: '*',                    // 모든 도메인에서 접근 허용
  credentials: false,             // 쿠키 없이 접근
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}))
```

이 설정으로 `https://username.github.io`에서 `https://your-server.com/api/buttons`로 요청 가능!

## 📱 사용자 관점에서의 경험

### GitHub Pages 사용자

```
1. https://username.github.io/agents/ 접속
2. 기본 11개 에이전트 + 커스텀 에이전트들 즉시 표시
3. 30초마다 자동으로 새로운 에이전트 확인
4. 새 에이전트 추가되면 자동으로 화면에 나타남
```

### 관리자

```
1. 대시보드에서 "Netflix" 링크 버튼 추가
2. 저장 버튼 클릭
3. 30초 이내에 GitHub Pages에 자동 반영
4. 전 세계 사용자들이 즉시 새 버튼 확인 가능
```

## 🚨 주의사항

### 네트워크 오류 처리

```javascript
try {
  const response = await axios.get(`${serverUrl}/api/buttons`, {
    timeout: 10000 // 10초 타임아웃
  });
} catch (error) {
  if (error.code === 'ERR_NETWORK') {
    showStatus('서버 연결 실패: 네트워크를 확인해주세요.', 'error');
  } else if (error.code === 'ECONNABORTED') {
    showStatus('서버 응답 시간 초과', 'error'); 
  }
  
  // 기본 에이전트만 표시
  renderAgents(defaultAgents);
}
```

### 캐시 무효화

```javascript
// 브라우저 캐시를 피하기 위해 타임스탬프 추가
const response = await axios.get(`${serverUrl}/api/buttons?t=${Date.now()}`);
```

이렇게 해서 대시보드에서 추가한 버튼이 실시간으로 GitHub Pages에 반영되는 완전한 시스템이 구축되었습니다! 🎉