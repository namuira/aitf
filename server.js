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

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 세션 저장소 (에이전트별 독립)
const sessions = new Map();

// 8개 에이전트별 데이터 파일 경로
const getDataFile = (agentId) => path.join(__dirname, 'data', `agent${agentId}_buttons.json`);

// 데이터 파일 초기화
async function initDataFiles() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    for (let i = 1; i <= 8; i++) {
      const dataFile = getDataFile(i);
      try {
        await fs.access(dataFile);
      } catch {
        await fs.writeFile(dataFile, JSON.stringify([]));
      }
    }
  } catch (error) {
    console.error('데이터 파일 초기화 실패:', error);
  }
}

// 에이전트별 데이터 읽기
async function readButtons(agentId) {
  try {
    const data = await fs.readFile(getDataFile(agentId), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Agent ${agentId} 버튼 데이터 읽기 실패:`, error);
    return [];
  }
}

// 에이전트별 데이터 쓰기
async function writeButtons(agentId, buttons) {
  try {
    await fs.writeFile(getDataFile(agentId), JSON.stringify(buttons, null, 2));
    return true;
  } catch (error) {
    console.error(`Agent ${agentId} 버튼 데이터 쓰기 실패:`, error);
    return false;
  }
}

// 에이전트별 인증 미들웨어
function createAuthMiddleware(agentId) {
  return (req, res, next) => {
    const sessionCookie = req.headers.cookie?.match(new RegExp(`agent${agentId}_session=([^;]+)`))?.[1];
    
    if (!sessionCookie) {
      return res.redirect(`/agent/${agentId}/login?auth=required`);
    }
    
    const sessionKey = `agent${agentId}_${sessionCookie}`;
    const session = sessions.get(sessionKey);
    if (!session || !session.authenticated || Date.now() > session.expiresAt) {
      sessions.delete(sessionKey);
      return res.redirect(`/agent/${agentId}/login?auth=expired`);
    }
    
    next();
  };
}

// 메인 페이지 (index.html은 이미 public 폴더에 있음)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 에이전트 페이지들 (1.html ~ 8.html은 이미 public 폴더에 있음)
for (let i = 1; i <= 8; i++) {
  app.get(`/${i}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${i}.html`));
  });
}

// 에이전트별 로그인 페이지
app.get('/agent/:id/login', (req, res) => {
  const agentId = req.params.id;
  const authParam = req.query.auth;
  
  if (agentId < 1 || agentId > 8) {
    return res.status(404).send('Agent not found');
  }
  
  const agentNames = {
    1: 'AI 어시스턴트',
    2: '지식 관리',
    3: '크리에이티브',
    4: '아이디어 생성',
    5: '프로젝트 관리',
    6: '분석 리포트',
    7: '보안 관리',
    8: '팀 협업'
  };
  
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent ${agentId} 관리 로그인 | CCQE AX Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'Inter', sans-serif; }
        
        .login-container {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
            position: relative;
            overflow: hidden;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .form-input {
            background: rgba(255, 255, 255, 0.9);
            border: 1.5px solid rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
        }
        
        .form-input:focus {
            border-color: #000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
            outline: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        
        .alert-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        
        .alert-error {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
        }
    </style>
</head>
<body class="login-container">
    <div class="min-h-screen flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-md">
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-cogs text-white text-2xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-black mb-2">Agent ${agentId} 관리</h1>
                <p class="text-gray-600 font-medium">${agentNames[agentId]} 에이전트 설정</p>
            </div>
            
            ${authParam === 'required' ? 
                '<div class="alert-error mb-6 p-4 rounded-xl text-center font-medium">' +
                    '<i class="fas fa-lock mr-2"></i>인증이 필요합니다' +
                '</div>' : ''}
            ${authParam === 'expired' ? 
                '<div class="alert-error mb-6 p-4 rounded-xl text-center font-medium">' +
                    '<i class="fas fa-clock mr-2"></i>세션이 만료되었습니다' +
                '</div>' : ''}
            
            <div class="glass-card rounded-2xl p-8">
                <form id="loginForm" class="space-y-6">
                    <div>
                        <label class="block text-gray-700 text-sm font-semibold mb-2">
                            <i class="fas fa-key mr-2 text-gray-400"></i>관리자 비밀번호
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            class="form-input w-full px-4 py-3 rounded-xl" 
                            placeholder="비밀번호를 입력하세요" 
                            required 
                        />
                    </div>
                    
                    <button type="submit" class="btn-primary w-full py-3 px-6 rounded-xl text-white font-semibold">
                        <i class="fas fa-sign-in-alt mr-2"></i>로그인
                    </button>
                </form>
                
                <div id="authMessage" class="mt-6 text-center"></div>
                
                <div class="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p class="text-xs text-gray-500 mb-3">기본 비밀번호: <code class="bg-gray-100 px-2 py-1 rounded">agent${agentId}123</code></p>
                    <a href="/${agentId}.html" class="text-sm text-gray-600 hover:text-gray-800">
                        <i class="fas fa-arrow-left mr-1"></i>Agent ${agentId} 페이지로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const authMessage = document.getElementById('authMessage');
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>로그인 중...';
            submitBtn.disabled = true;
            
            try {
                const response = await axios.post('/api/agent/${agentId}/login', { password });
                if (response.data.success) {
                    document.cookie = 'agent${agentId}_session=' + response.data.sessionId + '; path=/; max-age=' + (24 * 60 * 60);
                    authMessage.innerHTML = '<div class="alert-success p-3 rounded-lg text-center font-medium">' +
                        '<i class="fas fa-check mr-2"></i>로그인 성공! 대시보드로 이동 중...' +
                        '</div>';
                    setTimeout(() => { window.location.href = '/agent/${agentId}/dashboard'; }, 1500);
                }
            } catch (error) {
                const message = error.response?.data?.message || '로그인 실패';
                authMessage.innerHTML = '<div class="alert-error p-3 rounded-lg text-center font-medium">' +
                    '<i class="fas fa-exclamation-triangle mr-2"></i>' + message +
                    '</div>';
                
                setTimeout(() => {
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>로그인';
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
    </script>
</body>
</html>`;
  
  res.send(html);
});

// 에이전트별 로그인 API
app.post('/api/agent/:id/login', (req, res) => {
  const agentId = req.params.id;
  const { password } = req.body;
  const correctPassword = `agent${agentId}123`;
  
  if (password !== correctPassword) {
    return res.status(401).json({ success: false, message: '비밀번호가 틀렸습니다.' });
  }
  
  const sessionId = uuidv4();
  const sessionKey = `agent${agentId}_${sessionId}`;
  sessions.set(sessionKey, {
    authenticated: true,
    agentId: agentId,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  });
  
  // 쿠키 설정
  res.cookie(`agent${agentId}_session`, sessionId, {
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    httpOnly: true,
    secure: false // 개발 환경에서는 false
  });
  
  res.json({ success: true, sessionId });
});

// 에이전트별 대시보드
app.get('/agent/:id/dashboard', (req, res, next) => {
  const agentId = req.params.id;
  createAuthMiddleware(agentId)(req, res, next);
}, async (req, res) => {
  const agentId = req.params.id;
  const buttons = await readButtons(agentId);
  
  const agentNames = {
    1: 'AI 어시스턴트',
    2: '지식 관리', 
    3: '크리에이티브',
    4: '아이디어 생성',
    5: '프로젝트 관리',
    6: '분석 리포트',
    7: '보안 관리',
    8: '팀 협업'
  };
  
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent ${agentId} 대시보드 | CCQE AX Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'Inter', sans-serif; }
        
        .dashboard-container {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
        }
        
        .form-input, .custom-select {
            background: rgba(255, 255, 255, 0.9);
            border: 1.5px solid rgba(0, 0, 0, 0.15);
            color: #1a1a1a;
            transition: all 0.3s ease;
        }
        
        .form-input:focus, .custom-select:focus {
            border-color: #000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
            outline: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            border: none;
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.9);
            color: #000;
            border: 1.5px solid rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            transition: all 0.3s ease;
        }
        
        .card-item {
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }
        
        .card-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body class="dashboard-container">
    <div class="max-w-7xl mx-auto p-8">
        <!-- 헤더 -->
        <div class="glass-card rounded-2xl p-8 mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-4xl font-bold text-black mb-2">Agent ${agentId} Dashboard</h1>
                    <p class="text-gray-600 font-medium">${agentNames[agentId]} 에이전트 관리</p>
                </div>
                <div class="flex space-x-4">
                    <a href="/${agentId}.html" class="btn-secondary px-6 py-3 rounded-xl font-medium">
                        <i class="fas fa-arrow-left mr-2"></i>에이전트로
                    </a>
                    <button onclick="logout()" class="btn-danger px-6 py-3 rounded-xl font-medium">
                        <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 새 버튼 추가 -->
        <div class="glass-card rounded-2xl p-8 mb-8">
            <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-plus text-white text-lg"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-black">새 기능 추가</h2>
                    <p class="text-gray-600">Agent ${agentId}에 새로운 링크나 모달을 추가하세요</p>
                </div>
            </div>
            
            <form id="addButtonForm" class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">제목</label>
                        <input type="text" id="title" placeholder="예: 유용한 도구" class="form-input px-4 py-3 rounded-xl w-full" required />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">타입</label>
                        <select id="type" class="custom-select px-4 py-3 rounded-xl w-full">
                            <option value="link">🔗 링크 (새 창에서 열기)</option>
                            <option value="modal">📱 모달 (HTML 컨텐츠)</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">설명 (선택사항)</label>
                    <input type="text" id="description" placeholder="간단한 설명" class="form-input w-full px-4 py-3 rounded-xl" />
                </div>
                
                <div id="urlField">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">URL 주소</label>
                    <input type="url" id="url" placeholder="https://example.com" class="form-input w-full px-4 py-3 rounded-xl" />
                </div>
                
                <div id="htmlField" style="display:none;">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">HTML 컨텐츠</label>
                    <textarea id="htmlContent" rows="6" placeholder="<div class='p-6'><h3>제목</h3><p>내용</p></div>" class="form-input w-full px-4 py-3 rounded-xl"></textarea>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">아이콘</label>
                        <select id="icon" class="custom-select px-4 py-3 rounded-xl w-full">
                            <option value="fas fa-robot">🤖 로봇</option>
                            <option value="fas fa-brain">🧠 두뇌</option>
                            <option value="fas fa-magic">✨ 마법</option>
                            <option value="fas fa-lightbulb">💡 전구</option>
                            <option value="fas fa-rocket">🚀 로켓</option>
                            <option value="fas fa-star">⭐ 별</option>
                            <option value="fas fa-heart">❤️ 하트</option>
                            <option value="fas fa-gem">💎 보석</option>
                            <option value="fas fa-crown">👑 왕관</option>
                            <option value="fas fa-fire">🔥 불꽃</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">색상</label>
                        <select id="color" class="custom-select px-4 py-3 rounded-xl w-full">
                            <option value="purple">🟣 보라색</option>
                            <option value="blue">🔵 파란색</option>
                            <option value="green">🟢 초록색</option>
                            <option value="red">🔴 빨간색</option>
                            <option value="yellow">🟡 노란색</option>
                            <option value="pink">🩷 분홍색</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex justify-end">
                    <button type="submit" class="btn-primary px-8 py-4 rounded-xl font-semibold">
                        <i class="fas fa-plus mr-2"></i>추가하기
                    </button>
                </div>
            </form>
        </div>
        
        <!-- 등록된 기능 목록 -->
        <div class="glass-card rounded-2xl p-8">
            <h2 class="text-2xl font-bold text-black mb-6">등록된 기능 (${buttons.length}개)</h2>
            
            ${buttons.length === 0 ? 
                '<div class="text-center py-12"><p class="text-gray-500">등록된 기능이 없습니다.</p></div>' :
                '<div class="grid gap-4">' +
                buttons.map(btn => `
                    <div class="card-item rounded-xl p-6">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center mb-3">
                                    <div class="w-10 h-10 bg-${btn.color || 'gray'}-100 rounded-lg flex items-center justify-center mr-3">
                                        <i class="${btn.icon || 'fas fa-star'} text-${btn.color || 'gray'}-600"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-gray-900 text-lg">${btn.title}</h3>
                                        <span class="bg-gray-100 px-3 py-1 rounded-full text-xs mt-1 inline-block">
                                            ${btn.type === 'link' ? '🔗 링크' : '📱 모달'}
                                        </span>
                                    </div>
                                </div>
                                ${btn.description ? '<p class="text-gray-600 text-sm mb-2">' + btn.description + '</p>' : ''}
                                ${btn.url ? '<p class="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">' + btn.url + '</p>' : ''}
                            </div>
                            <button onclick="deleteButton(\\'' + btn.id + '\\')" class="btn-danger px-4 py-2 rounded-lg text-sm font-medium ml-4">
                                <i class="fas fa-trash mr-1"></i>삭제
                            </button>
                        </div>
                    </div>
                `).join('') +
                '</div>'
            }
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // 타입 변경 시 필드 표시/숨김
        document.getElementById('type').addEventListener('change', function() {
            const type = this.value;
            document.getElementById('urlField').style.display = type === 'link' ? 'block' : 'none';
            document.getElementById('htmlField').style.display = type === 'modal' ? 'block' : 'none';
        });
        
        // 폼 제출
        document.getElementById('addButtonForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                title: document.getElementById('title').value,
                type: document.getElementById('type').value,
                description: document.getElementById('description').value,
                url: document.getElementById('url').value,
                htmlContent: document.getElementById('htmlContent').value,
                icon: document.getElementById('icon').value,
                color: document.getElementById('color').value
            };
            
            try {
                const response = await axios.post('/api/agent/${agentId}/buttons', data);
                if (response.data.success) {
                    location.reload();
                }
            } catch (error) {
                alert('추가 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
            }
        });
        
        async function deleteButton(id) {
            if (confirm('정말 삭제하시겠습니까?')) {
                try {
                    await axios.delete('/api/agent/${agentId}/buttons/' + id);
                    location.reload();
                } catch (error) {
                    alert('삭제 실패');
                }
            }
        }
        
        async function logout() {
            await axios.post('/api/agent/${agentId}/logout');
            document.cookie = 'agent${agentId}_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href = '/agent/${agentId}/login';
        }
    </script>
</body>
</html>`;
  
  res.send(html);
});

// 에이전트별 로그아웃 API
app.post('/api/agent/:id/logout', (req, res) => {
  const agentId = req.params.id;
  const sessionCookie = req.headers.cookie?.match(new RegExp(`agent${agentId}_session=([^;]+)`))?.[1];
  if (sessionCookie) {
    const sessionKey = `agent${agentId}_${sessionCookie}`;
    sessions.delete(sessionKey);
  }
  res.json({ success: true });
});

// 에이전트별 버튼 목록 조회
app.get('/api/agent/:id/buttons', async (req, res) => {
  const agentId = req.params.id;
  const buttons = await readButtons(agentId);
  res.json(buttons);
});

// 에이전트별 버튼 추가
app.post('/api/agent/:id/buttons', (req, res, next) => {
  const agentId = req.params.id;
  createAuthMiddleware(agentId)(req, res, next);
}, async (req, res) => {
  const agentId = req.params.id;
  const { title, type, description, url, htmlContent, icon, color } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ error: '제목과 타입은 필수입니다.' });
  }
  
  if (type === 'link' && !url) {
    return res.status(400).json({ error: '링크 타입에는 URL이 필요합니다.' });
  }
  
  if (type === 'modal' && !htmlContent) {
    return res.status(400).json({ error: '모달 타입에는 HTML 내용이 필요합니다.' });
  }
  
  const buttons = await readButtons(agentId);
  const newButton = {
    id: uuidv4(),
    title, type, description: description || '', url: url || '', htmlContent: htmlContent || '',
    icon: icon || 'fas fa-star', color: color || 'purple', createdAt: new Date().toISOString()
  };
  
  buttons.push(newButton);
  const success = await writeButtons(agentId, buttons);
  
  if (success) {
    res.json({ success: true, button: newButton });
  } else {
    res.status(500).json({ error: '버튼 저장 실패' });
  }
});

// 에이전트별 버튼 삭제
app.delete('/api/agent/:id/buttons/:buttonId', (req, res, next) => {
  const agentId = req.params.id;
  createAuthMiddleware(agentId)(req, res, next);
}, async (req, res) => {
  const agentId = req.params.id;
  const buttonId = req.params.buttonId;
  
  const buttons = await readButtons(agentId);
  const filteredButtons = buttons.filter(btn => btn.id !== buttonId);
  const success = await writeButtons(agentId, filteredButtons);
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '버튼 삭제 실패' });
  }
});

// 서버 시작
await initDataFiles();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CCQE AX Platform 서버 시작!`);
  console.log(`📱 메인 페이지: http://localhost:${PORT}`);
  console.log(`🎛️ Agent 관리:`);
  for (let i = 1; i <= 8; i++) {
    console.log(`   Agent ${i}: http://localhost:${PORT}/agent/${i}/login (비밀번호: agent${i}123)`);
  }
  console.log(`🌐 네트워크 접근: http://내PC아이피:${PORT}`);
});