// GenSpark 커스텀 에이전트 대시보드 - Node.js Express 서버
// ARM64 Windows 호환 버전
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

// 데이터 파일 경로
const DATA_FILE = path.join(__dirname, 'data', 'buttons.json');

// 미들웨어 설정
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));

// 세션 저장소 (메모리 기반 - 개발용)
const sessions = new Map();

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

// 데이터 읽기
async function readButtons() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('버튼 데이터 읽기 실패:', error);
    return [];
  }
}

// 데이터 쓰기
async function writeButtons(buttons) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(buttons, null, 2));
    return true;
  } catch (error) {
    console.error('버튼 데이터 쓰기 실패:', error);
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

// 메인 페이지 (GenSpark 스타일)
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GenSpark 슈퍼 에이전트</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .agent-icon { background: linear-gradient(135deg, var(--icon-color-1), var(--icon-color-2)); transition: all 0.3s ease; }
        .agent-icon:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .icon-purple { --icon-color-1: #e0c3fc; --icon-color-2: #9bb5ff; }
        .icon-blue { --icon-color-1: #a8e6cf; --icon-color-2: #88d8ff; }
        .icon-green { --icon-color-1: #c3f0ca; --icon-color-2: #a8e6cf; }
        .icon-pink { --icon-color-1: #ffc3d8; --icon-color-2: #ffb3d9; }
        .icon-orange { --icon-color-1: #ffd3a5; --icon-color-2: #fd9853; }
        .icon-yellow { --icon-color-1: #fff2a8; --icon-color-2: #ffcc70; }
        .icon-teal { --icon-color-1: #a8f0e6; --icon-color-2: #70d0c4; }
        .icon-red { --icon-color-1: #ffb3ba; --icon-color-2: #ff9aa2; }
        .icon-indigo { --icon-color-1: #c5b9ff; --icon-color-2: #a29bfe; }
        .management-btn { position: fixed; bottom: 2rem; right: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); transition: all 0.3s ease; z-index: 1000; }
        .management-btn:hover { transform: scale(1.1); box-shadow: 0 15px 35px rgba(0,0,0,0.3); }
        .chat-input { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.1); }
        .agents-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
        @media (min-width: 640px) { .agents-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); } }
    </style>
</head>
<body class="min-h-screen bg-white">
    <div class="text-center py-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">GenSpark 슈퍼 에이전트 ●</h1>
    </div>
    <div class="max-w-2xl mx-auto px-4 mb-12">
        <div class="relative">
            <input type="text" placeholder="무엇이든 물어보고 만들어보세요" class="chat-input w-full px-6 py-4 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400">
            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
                <button class="text-gray-400 hover:text-gray-600 transition-colors"><i class="fas fa-microphone text-lg"></i></button>
                <button class="text-gray-400 hover:text-gray-600 transition-colors"><i class="fas fa-camera text-lg"></i></button>
                <button class="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-colors"><i class="fas fa-paper-plane text-sm"></i></button>
            </div>
        </div>
        <div class="flex flex-wrap justify-center gap-3 mt-4">
            <span class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm text-gray-700 cursor-pointer transition-colors">내 노션 노트 검색하기</span>
            <span class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm text-gray-700 cursor-pointer transition-colors">Reddit의 첫 페이지에서 핫한 기사 인기 인지 알아 계시나요?</span>
        </div>
    </div>
    <div class="px-4 mb-16"><div id="agentsContainer" class="agents-grid"></div></div>
    <a href="/login" class="management-btn text-white hover:no-underline" title="대시보드 관리"><i class="fas fa-cogs text-xl"></i></a>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script type="module">
        window.loadTypebot = async function(apiHost) {
            const { default: Typebot } = await import('https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js');
            return Typebot;
        };
        
        const defaultAgents = [
            { id: 'ai-guide', title: 'AI 슈퍼가이드', icon: 'fas fa-book-open', color: 'purple' },
            { id: 'ai-site', title: 'AI 사이트', icon: 'fas fa-globe', color: 'blue' },
            { id: 'ai-writing', title: 'AI 문서', icon: 'fas fa-pen-fancy', color: 'green' },
            { id: 'ai-dev', title: 'AI 개발자', icon: 'fas fa-code', color: 'pink' },
            { id: 'ai-designer', title: 'AI 디자이너', icon: 'fas fa-paint-brush', color: 'orange' },
            { id: 'ai-business', title: 'AI 지니어스', icon: 'fas fa-chart-line', color: 'yellow' },
            { id: 'ai-search', title: 'AI 서치', icon: 'fas fa-search', color: 'teal' },
            { id: 'ai-image', title: 'AI 이미지', icon: 'fas fa-image', color: 'red' },
            { id: 'ai-translate', title: 'AI 통역사', icon: 'fas fa-language', color: 'indigo' },
            { id: 'ai-write-note', title: 'AI 회의 노트', icon: 'fas fa-clipboard', color: 'purple' },
            { id: 'more', title: '모든 에이전트', icon: 'fas fa-plus', color: 'blue' }
        ];
        
        const colorClasses = { purple: 'icon-purple', blue: 'icon-blue', green: 'icon-green', pink: 'icon-pink', orange: 'icon-orange', yellow: 'icon-yellow', teal: 'icon-teal', red: 'icon-red', indigo: 'icon-indigo' };
        
        async function loadAgents() {
            try {
                const response = await axios.get('/api/buttons');
                const customButtons = response.data || [];
                const allAgents = [...defaultAgents];
                customButtons.forEach(button => {
                    allAgents.splice(-1, 0, {
                        id: button.id, title: button.title, icon: button.icon || 'fas fa-star', color: button.color || 'purple', custom: true, type: button.type, url: button.url, htmlContent: button.htmlContent, typebotId: button.typebotId, apiHost: button.apiHost, description: button.description
                    });
                });
                renderAgents(allAgents);
            } catch (error) { renderAgents(defaultAgents); }
        }
        
        function renderAgents(agents) {
            const container = document.getElementById('agentsContainer');
            container.innerHTML = agents.map(agent => createAgentHTML(agent)).join('');
            agents.forEach(agent => {
                const element = document.getElementById('agent-' + agent.id);
                if (element) element.addEventListener('click', () => handleAgentClick(agent));
            });
        }
        
        function createAgentHTML(agent) {
            const colorClass = colorClasses[agent.color] || 'icon-purple';
            return '<div id="agent-' + agent.id + '" class="text-center cursor-pointer group">' +
                '<div class="agent-icon ' + colorClass + ' w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mx-auto">' +
                    '<i class="' + agent.icon + ' text-xl text-white"></i>' +
                '</div>' +
                '<h3 class="text-sm font-medium text-gray-800 group-hover:text-purple-600 transition-colors">' + agent.title + '</h3>' +
                (agent.custom && agent.description ? '<p class="text-xs text-gray-500 mt-1">' + agent.description + '</p>' : '') +
                (agent.custom && agent.type === 'typebot' ? '<span class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full mt-1 inline-block">Typebot</span>' : '') +
            '</div>';
        }
        
        async function handleAgentClick(agent) {
            if (agent.custom) {
                if (agent.type === 'link') {
                    window.open(agent.url, '_blank');
                } else if (agent.type === 'modal') {
                    showModal(agent.title, agent.htmlContent);
                } else if (agent.type === 'typebot') {
                    await initTypebot(agent.typebotId, agent.apiHost);
                }
            } else if (agent.id === 'more') {
                window.open('/login', '_blank');
            }
        }
        
        async function initTypebot(typebotId, apiHost) {
            try {
                const Typebot = await window.loadTypebot();
                const config = { typebot: typebotId };
                if (apiHost && apiHost.trim()) config.apiHost = apiHost;
                Typebot.initPopup(config);
            } catch (error) { console.error('Typebot 로드 실패:', error); }
        }
        
        function showModal(title, htmlContent) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
            modal.innerHTML = '<div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">' +
                '<div class="flex justify-between items-center p-6 border-b border-gray-200">' +
                    '<h3 class="text-xl font-semibold text-gray-800">' + title + '</h3>' +
                    '<button onclick="this.closest(\\'.fixed\\').remove()" class="text-gray-500 hover:text-gray-700 text-2xl"><i class="fas fa-times"></i></button>' +
                '</div>' +
                '<div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">' + htmlContent + '</div>' +
            '</div>';
            document.body.appendChild(modal);
            modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
            document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { modal.remove(); } });
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            loadAgents();
            setInterval(loadAgents, 30000);
        });
    </script>
</body>
</html>`;
  res.send(html);
});

// 로그인 페이지
app.get('/login', (req, res) => {
  const authParam = req.query.auth;
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>관리자 로그인</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div class="container mx-auto px-4 py-8">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-white mb-4"><i class="fas fa-robot mr-3"></i>관리자 로그인</h1>
            <p class="text-gray-300 text-lg">나만의 에이전트와 링크를 관리하세요</p>
        </div>
        
        ${authParam === 'required' ? '<div class="max-w-md mx-auto mb-6 p-4 bg-yellow-600 text-white rounded-lg"><i class="fas fa-exclamation-triangle mr-2"></i>인증이 필요합니다.</div>' : ''}
        ${authParam === 'expired' ? '<div class="max-w-md mx-auto mb-6 p-4 bg-red-600 text-white rounded-lg"><i class="fas fa-clock mr-2"></i>세션이 만료되었습니다.</div>' : ''}
        
        <div class="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <form id="loginForm" class="space-y-6">
                <div>
                    <label class="block text-white text-sm font-medium mb-2"><i class="fas fa-lock mr-2"></i>비밀번호</label>
                    <input type="password" id="password" class="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="비밀번호를 입력하세요" required />
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"><i class="fas fa-sign-in-alt mr-2"></i>로그인</button>
            </form>
            <div id="authMessage" class="mt-4 text-center text-sm"></div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const authMessage = document.getElementById('authMessage');
            
            try {
                const response = await axios.post('/api/login', { password });
                if (response.data.success) {
                    document.cookie = 'session=' + response.data.sessionId + '; path=/; max-age=' + (24 * 60 * 60);
                    authMessage.innerHTML = '<div class="text-green-400"><i class="fas fa-check mr-2"></i>로그인 성공! 리디렉션 중...</div>';
                    setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
                }
            } catch (error) {
                const message = error.response?.data?.message || '로그인 실패';
                authMessage.innerHTML = '<div class="text-red-400"><i class="fas fa-times mr-2"></i>' + message + '</div>';
            }
        });
    </script>
</body>
</html>`;
  res.send(html);
});

// 대시보드 (간단한 버전)
app.get('/dashboard', authMiddleware, async (req, res) => {
  const buttons = await readButtons();
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>에이전트 대시보드</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-white"><i class="fas fa-tachometer-alt mr-3"></i>Agent Dashboard</h1>
            <div class="flex space-x-3">
                <a href="/" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">홈</a>
                <button onclick="logout()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">로그아웃</button>
            </div>
        </div>
        
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <h2 class="text-xl font-semibold text-white mb-4">새 버튼 추가</h2>
            <form id="addButtonForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" id="title" placeholder="제목" class="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300" required />
                    <select id="type" class="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white">
                        <option value="link">링크</option>
                        <option value="modal">모달</option>
                        <option value="typebot">Typebot 에이전트</option>
                    </select>
                </div>
                <input type="text" id="description" placeholder="설명 (선택)" class="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300" />
                <div id="urlField"><input type="url" id="url" placeholder="URL" class="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300" /></div>
                <div id="htmlField" style="display:none;"><textarea id="htmlContent" rows="4" placeholder="HTML 내용" class="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300"></textarea></div>
                <div id="typebotField" style="display:none;" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" id="typebotId" placeholder="Typebot ID" class="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300" />
                    <input type="url" id="apiHost" placeholder="API Host (선택)" class="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" id="icon" placeholder="아이콘 (예: fas fa-robot)" class="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300" />
                    <select id="color" class="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white">
                        <option value="purple">보라색</option><option value="blue">파란색</option><option value="green">초록색</option><option value="red">빨간색</option><option value="yellow">노란색</option><option value="pink">분홍색</option>
                    </select>
                </div>
                <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">버튼 추가</button>
            </form>
        </div>
        
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 class="text-xl font-semibold text-white mb-4">현재 버튼들</h2>
            <div id="buttonsList" class="space-y-2">
                ${buttons.map(btn => `
                    <div class="flex justify-between items-center bg-white/10 p-3 rounded-lg">
                        <div><strong class="text-white">${btn.title}</strong> <span class="text-gray-300">(${btn.type})</span></div>
                        <button onclick="deleteButton('${btn.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">삭제</button>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        document.getElementById('type').addEventListener('change', function() {
            const type = this.value;
            document.getElementById('urlField').style.display = type === 'link' ? 'block' : 'none';
            document.getElementById('htmlField').style.display = type === 'modal' ? 'block' : 'none';
            document.getElementById('typebotField').style.display = type === 'typebot' ? 'block' : 'none';
        });
        
        document.getElementById('addButtonForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const data = {
                title: document.getElementById('title').value,
                type: document.getElementById('type').value,
                description: document.getElementById('description').value,
                url: document.getElementById('url').value,
                htmlContent: document.getElementById('htmlContent').value,
                typebotId: document.getElementById('typebotId').value,
                apiHost: document.getElementById('apiHost').value,
                icon: document.getElementById('icon').value || 'fas fa-star',
                color: document.getElementById('color').value
            };
            
            try {
                await axios.post('/api/buttons', data);
                location.reload();
            } catch (error) {
                alert('버튼 추가 실패: ' + error.response?.data?.error);
            }
        });
        
        async function deleteButton(id) {
            if (confirm('정말 삭제하시겠습니까?')) {
                try {
                    await axios.delete('/api/buttons/' + id);
                    location.reload();
                } catch (error) {
                    alert('삭제 실패');
                }
            }
        }
        
        async function logout() {
            await axios.post('/api/logout');
            document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href = '/login';
        }
    </script>
</body>
</html>`;
  res.send(html);
});

// API: 로그인
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const correctPassword = 'admin123';
  
  if (password !== correctPassword) {
    return res.status(401).json({ success: false, message: '비밀번호가 틀렸습니다.' });
  }
  
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    authenticated: true,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  });
  
  res.json({ success: true, sessionId });
});

// API: 로그아웃
app.post('/api/logout', (req, res) => {
  const sessionCookie = req.headers.cookie?.match(/session=([^;]+)/)?.[1];
  if (sessionCookie) {
    sessions.delete(sessionCookie);
  }
  res.json({ success: true });
});

// API: 버튼 목록 조회
app.get('/api/buttons', async (req, res) => {
  const buttons = await readButtons();
  res.json(buttons);
});

// API: 버튼 추가
app.post('/api/buttons', authMiddleware, async (req, res) => {
  const { title, type, description, url, htmlContent, typebotId, apiHost, icon, color } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ error: '제목과 타입은 필수입니다.' });
  }
  
  if (type === 'link' && !url) {
    return res.status(400).json({ error: '링크 타입에는 URL이 필요합니다.' });
  }
  
  if (type === 'modal' && !htmlContent) {
    return res.status(400).json({ error: '모달 타입에는 HTML 내용이 필요합니다.' });
  }
  
  if (type === 'typebot' && !typebotId) {
    return res.status(400).json({ error: 'Typebot 타입에는 Typebot ID가 필요합니다.' });
  }
  
  const buttons = await readButtons();
  const newButton = {
    id: uuidv4(),
    title, type, description: description || '', url: url || '', htmlContent: htmlContent || '',
    typebotId: typebotId || '', apiHost: apiHost || '', icon: icon || 'fas fa-star',
    color: color || 'purple', createdAt: new Date().toISOString()
  };
  
  buttons.push(newButton);
  const success = await writeButtons(buttons);
  
  if (success) {
    res.json({ success: true, button: newButton });
  } else {
    res.status(500).json({ error: '버튼 저장 실패' });
  }
});

// API: 버튼 삭제
app.delete('/api/buttons/:id', authMiddleware, async (req, res) => {
  const buttons = await readButtons();
  const filteredButtons = buttons.filter(btn => btn.id !== req.params.id);
  const success = await writeButtons(filteredButtons);
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '버튼 삭제 실패' });
  }
});

// 서버 시작
await initDataFile();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 시작되었습니다!`);
  console.log(`📱 메인 페이지: http://localhost:${PORT}`);
  console.log(`⚙️  대시보드: http://localhost:${PORT}/login`);
  console.log(`🔑 비밀번호: admin123`);
  console.log(`🌐 네트워크 접근: http://내PC아이피:${PORT}`);
});