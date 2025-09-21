# 📁 핵심 파일 다운로드 가이드

백업 파일에서 `server.js`가 누락되는 경우, 아래 방법으로 개별 파일을 다운로드하세요.

## 🔧 핵심 파일 목록

### 1️⃣ **server.js** (메인 서버 파일)
- **역할**: Node.js Express 서버 메인 로직
- **크기**: 약 25KB
- **필수**: ✅ 반드시 필요

### 2️⃣ **package.json** (의존성 설정)
```json
{
  "name": "webapp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js",
    "build": "echo 'No build needed for Node.js'",
    "test": "curl http://localhost:8080"
  },
  "dependencies": {
    "express": "^4.21.1",
    "cors": "^2.8.5",
    "uuid": "^10.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### 3️⃣ **github-pages-index.html** (GitHub Pages용)
- **역할**: GitHub Pages에서 호스팅할 메인 HTML
- **크기**: 약 22KB
- **사용법**: `index.html`로 이름 변경 후 GitHub에 업로드

## 🚀 빠른 복구 방법

### Option 1: 수동 파일 생성
1. **새 폴더 생성**: `genspark-dashboard`
2. **package.json 생성**: 위 내용 복사
3. **server.js 생성**: 아래 최소 버전 사용
4. **의존성 설치**: `npm install`

### Option 2: 최소 server.js 코드
이 문제가 발생하면 아래 최소 버전의 server.js를 사용하세요:

```javascript
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;
const DATA_FILE = path.join(__dirname, 'data', 'buttons.json');
const sessions = new Map();

// 미들웨어
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// 데이터 파일 초기화
async function initDataFile() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('데이터 파일 초기화 실패:', error);
  }
}

// 데이터 읽기/쓰기
async function readButtons() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeButtons(buttons) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(buttons, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

// 인증 미들웨어
function authMiddleware(req, res, next) {
  const sessionCookie = req.headers.cookie?.match(/session=([^;]+)/)?.[1];
  if (!sessionCookie) {
    return res.redirect('/login?auth=required');
  }
  const session = sessions.get(sessionCookie);
  if (!session || !session.authenticated || Date.now() > session.expiresAt) {
    sessions.delete(sessionCookie);
    return res.redirect('/login?auth=expired');
  }
  next();
}

// 라우트
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html><head><title>GenSpark Agent</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:50px;">
  <h1>GenSpark 에이전트 대시보드</h1>
  <p><a href="/login">관리자 로그인</a></p>
</body></html>`);
});

app.get('/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html><head><title>로그인</title></head>
<body style="font-family:Arial,sans-serif;padding:50px;">
  <h2>관리자 로그인</h2>
  <form onsubmit="login(event)">
    <input type="password" id="password" placeholder="비밀번호" required>
    <button type="submit">로그인</button>
  </form>
  <script>
    async function login(e) {
      e.preventDefault();
      const password = document.getElementById('password').value;
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({password})
        });
        const data = await res.json();
        if (data.success) {
          document.cookie = 'session=' + data.sessionId + '; path=/';
          window.location.href = '/dashboard';
        }
      } catch (error) {
        alert('로그인 실패');
      }
    }
  </script>
</body></html>`);
});

app.get('/dashboard', authMiddleware, async (req, res) => {
  const buttons = await readButtons();
  res.send(`
<!DOCTYPE html>
<html><head><title>대시보드</title></head>
<body style="font-family:Arial,sans-serif;padding:20px;">
  <h2>버튼 관리</h2>
  <form onsubmit="addButton(event)">
    <input type="text" id="title" placeholder="제목" required><br><br>
    <select id="type">
      <option value="link">링크</option>
      <option value="modal">모달</option>
      <option value="typebot">Typebot</option>
    </select><br><br>
    <input type="url" id="url" placeholder="URL"><br><br>
    <button type="submit">추가</button>
  </form>
  <h3>현재 버튼들:</h3>
  <div>${buttons.map(b => '<div>' + b.title + ' (' + b.type + ') <button onclick="deleteBtn(\'' + b.id + '\')">삭제</button></div>').join('')}</div>
  <script>
    async function addButton(e) {
      e.preventDefault();
      const data = {
        title: document.getElementById('title').value,
        type: document.getElementById('type').value,
        url: document.getElementById('url').value
      };
      await fetch('/api/buttons', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      location.reload();
    }
    async function deleteBtn(id) {
      await fetch('/api/buttons/' + id, {method: 'DELETE'});
      location.reload();
    }
  </script>
</body></html>`);
});

// API
app.post('/api/login', (req, res) => {
  if (req.body.password !== 'admin123') {
    return res.status(401).json({success: false});
  }
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    authenticated: true,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  });
  res.json({success: true, sessionId});
});

app.get('/api/buttons', async (req, res) => {
  const buttons = await readButtons();
  res.json(buttons);
});

app.post('/api/buttons', authMiddleware, async (req, res) => {
  const { title, type, url } = req.body;
  if (!title || !type) {
    return res.status(400).json({error: '제목과 타입 필요'});
  }
  
  const buttons = await readButtons();
  const newButton = {
    id: uuidv4(),
    title, type, url: url || '',
    createdAt: new Date().toISOString()
  };
  buttons.push(newButton);
  await writeButtons(buttons);
  res.json({success: true, button: newButton});
});

app.delete('/api/buttons/:id', authMiddleware, async (req, res) => {
  const buttons = await readButtons();
  const filtered = buttons.filter(b => b.id !== req.params.id);
  await writeButtons(filtered);
  res.json({success: true});
});

// 서버 시작
await initDataFile();
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 서버 시작: http://localhost:' + PORT);
  console.log('🔑 비밀번호: admin123');
});
```

## ✅ 복구 완료 확인

```bash
npm install
npm start

# 브라우저에서 접속
http://localhost:8080
```

이제 기본 기능이 작동하는지 확인하세요!