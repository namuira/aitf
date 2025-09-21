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
                    // Typebot 타입은 모달로 변환
                    const buttonType = button.type === 'typebot' ? 'modal' : button.type;
                    const buttonContent = button.type === 'typebot' ? 
                        '<div class="p-4"><h3 class="text-lg font-bold mb-4">' + button.title + '</h3><p class="text-gray-600">이 기능은 모달로 변환되었습니다.</p><p class="mt-2 text-sm text-gray-500">원래 설정: ' + (button.description || 'Typebot 에이전트') + '</p></div>' : 
                        button.htmlContent;
                    
                    allAgents.splice(-1, 0, {
                        id: button.id, title: button.title, icon: button.icon || 'fas fa-star', color: button.color || 'purple', custom: true, type: buttonType, url: button.url, htmlContent: buttonContent, description: button.description
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

            '</div>';
        }
        
        async function handleAgentClick(agent) {
            if (agent.custom) {
                if (agent.type === 'link') {
                    window.open(agent.url, '_blank');
                } else if (agent.type === 'modal') {
                    showModal(agent.title, agent.htmlContent);
                }
            } else if (agent.id === 'more') {
                window.open('/login', '_blank');
            }
        }
        

        
        function showModal(title, htmlContent) {
            // 기존 모달이 있다면 제거
            const existingModal = document.querySelector('.modal-overlay');
            if (existingModal) {
                existingModal.remove();
            }

            const modal = document.createElement('div');
            modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
            modal.style.animation = 'fadeIn 0.3s ease-out';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden';
            modalContent.style.animation = 'slideIn 0.3s ease-out';
            
            modalContent.innerHTML = 
                '<div class="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">' +
                    '<h3 class="text-xl font-semibold text-gray-800">' + title + '</h3>' +
                    '<button class="modal-close text-gray-500 hover:text-gray-700 text-2xl transition-colors duration-200">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>' +
                '<div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white">' +
                    htmlContent +
                '</div>';
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // 애니메이션 CSS 추가
            if (!document.getElementById('modal-animations')) {
                const style = document.createElement('style');
                style.id = 'modal-animations';
                style.textContent = 
                    '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }' +
                    '@keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' +
                    '.modal-overlay { backdrop-filter: blur(4px); }';
                document.head.appendChild(style);
            }
            
            // 이벤트 리스너
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => modal.remove());
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) modal.remove();
            });
            
            // ESC 키로 닫기
            const escapeHandler = function(e) {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            // 바디 스크롤 방지
            document.body.style.overflow = 'hidden';
            modal.addEventListener('DOMNodeRemoved', () => {
                document.body.style.overflow = '';
            });
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

// 로그인 페이지 (고급 블랙&화이트 디자인)
app.get('/login', (req, res) => {
  const authParam = req.query.auth;
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GenSpark Admin</title>
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
        
        .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(0, 0, 0, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.05) 0%, transparent 50%);
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        
        .form-input {
            background: rgba(255, 255, 255, 0.9);
            border: 1.5px solid rgba(0, 0, 0, 0.15);
            color: #1a1a1a;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 400;
        }
        
        .form-input:focus {
            border-color: #000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
            outline: none;
            background: rgba(255, 255, 255, 1);
        }
        
        .form-input::placeholder { 
            color: #64748b; 
            font-weight: 300;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
        }
        
        .btn-primary:active {
            transform: translateY(0);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
        }
        
        .logo-text {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            letter-spacing: -1px;
        }
        
        .floating-shapes {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 1;
        }
        
        .shape {
            position: absolute;
            background: linear-gradient(45deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.05));
            border-radius: 50%;
            animation: float 20s infinite linear;
        }
        
        .shape:nth-child(1) { width: 100px; height: 100px; top: 20%; left: 10%; animation-delay: 0s; }
        .shape:nth-child(2) { width: 150px; height: 150px; top: 60%; right: 10%; animation-delay: -5s; }
        .shape:nth-child(3) { width: 80px; height: 80px; bottom: 20%; left: 20%; animation-delay: -10s; }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-20px) rotate(120deg); }
            66% { transform: translateY(20px) rotate(240deg); }
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
    <div class="floating-shapes">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
    </div>
    
    <div class="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-md">
            <!-- 로고 및 제목 -->
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i class="fas fa-robot text-white text-2xl"></i>
                </div>
                <h1 class="logo-text text-4xl mb-2">GenSpark</h1>
                <p class="text-gray-600 font-medium">Agent Management Platform</p>
            </div>
            
            <!-- 알림 메시지 -->
            ${authParam === 'required' ? 
                '<div class="alert-error mb-6 p-4 rounded-xl text-center font-medium shadow-lg">' +
                    '<i class="fas fa-lock mr-2"></i>인증이 필요합니다' +
                '</div>' : ''}
            ${authParam === 'expired' ? 
                '<div class="alert-error mb-6 p-4 rounded-xl text-center font-medium shadow-lg">' +
                    '<i class="fas fa-clock mr-2"></i>세션이 만료되었습니다' +
                '</div>' : ''}
            
            <!-- 로그인 폼 -->
            <div class="glass-card rounded-2xl p-8">
                <form id="loginForm" class="space-y-6">
                    <div class="space-y-2">
                        <label class="block text-gray-700 text-sm font-semibold mb-2">
                            <i class="fas fa-key mr-2 text-gray-400"></i>관리자 비밀번호
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            class="form-input w-full px-4 py-4 rounded-xl text-lg" 
                            placeholder="비밀번호를 입력하세요" 
                            required 
                            autocomplete="current-password"
                        />
                    </div>
                    
                    <button type="submit" class="btn-primary w-full py-4 px-6 rounded-xl text-lg">
                        <i class="fas fa-sign-in-alt mr-2"></i>로그인
                    </button>
                </form>
                
                <div id="authMessage" class="mt-6 text-center"></div>
                
                <!-- 추가 정보 -->
                <div class="mt-8 pt-6 border-t border-gray-100">
                    <div class="text-center text-xs text-gray-500 space-y-1">
                        <p><i class="fas fa-shield-alt mr-1"></i>보안 로그인</p>
                        <p>기본 비밀번호: <code class="bg-gray-100 px-2 py-1 rounded font-mono">admin123</code></p>
                    </div>
                </div>
            </div>
            
            <!-- 푸터 -->
            <div class="text-center mt-8 text-sm text-gray-500">
                <p>
                    <i class="fas fa-heart text-red-400 mr-1"></i>
                    Powered by GenSpark AI
                </p>
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
            
            // 로딩 상태
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>로그인 중...';
            submitBtn.disabled = true;
            
            try {
                const response = await axios.post('/api/login', { password });
                if (response.data.success) {
                    document.cookie = 'session=' + response.data.sessionId + '; path=/; max-age=' + (24 * 60 * 60);
                    authMessage.innerHTML = '<div class="alert-success p-3 rounded-lg text-center font-medium">' +
                        '<i class="fas fa-check mr-2"></i>로그인 성공! 대시보드로 이동 중...' +
                        '</div>';
                    setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
                }
            } catch (error) {
                const message = error.response?.data?.message || '로그인 실패';
                authMessage.innerHTML = '<div class="alert-error p-3 rounded-lg text-center font-medium">' +
                    '<i class="fas fa-exclamation-triangle mr-2"></i>' + message +
                    '</div>';
                
                // 버튼 복원
                setTimeout(() => {
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>로그인';
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
        
        // 엔터 키 이벤트
        document.getElementById('password').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }
        });
    </script>
</body>
</html>`;
  res.send(html);
});

// 대시보드 (블랙&화이트 고급 디자인)
app.get('/dashboard', authMiddleware, async (req, res) => {
  const buttons = await readButtons();
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Dashboard</title>
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
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .form-input:focus, .custom-select:focus {
            border-color: #000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
            outline: none;
            background: rgba(255, 255, 255, 1);
        }
        
        .form-input::placeholder { color: #64748b; }
        
        .btn-primary {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
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
        
        .btn-secondary:hover {
            background: rgba(248, 249, 250, 1);
            border-color: #000;
            transform: translateY(-1px);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            border: none;
            transition: all 0.3s ease;
        }
        
        .btn-danger:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }
        
        .card-item {
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }
        
        .card-item:hover {
            background: rgba(255, 255, 255, 0.95);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .header-gradient {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
        }
        
        .section-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%);
        }
        
        .type-badge {
            background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
            color: #333;
            font-weight: 500;
            font-size: 0.75rem;
        }
    </style>
</head>
<body class="dashboard-container">
    <div class="max-w-7xl mx-auto p-8">
        <!-- 헤더 -->
        <div class="glass-card rounded-2xl p-8 mb-8">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-4xl font-bold text-black mb-2">Agent Dashboard</h1>
                    <p class="text-gray-600 font-medium">나만의 에이전트와 링크를 관리하세요</p>
                </div>
                <div class="flex space-x-4">
                    <a href="/" class="btn-secondary px-6 py-3 rounded-xl font-medium transition-all duration-300">
                        <i class="fas fa-home mr-2"></i>홈으로
                    </a>
                    <button onclick="logout()" class="btn-danger px-6 py-3 rounded-xl font-medium transition-all duration-300">
                        <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 새 에이전트 추가 섹션 -->
        <div class="glass-card rounded-2xl p-8 mb-8">
            <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-plus text-white text-lg"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-black">새 에이전트 추가</h2>
                    <p class="text-gray-600">링크 또는 모달 컨텐츠를 가진 새로운 에이전트를 만드세요</p>
                </div>
            </div>
            <div class="section-divider mb-6"></div>
            <form id="addButtonForm" class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">에이전트 제목</label>
                        <input type="text" id="title" placeholder="예: AI 어시스턴트" class="form-input px-4 py-3 rounded-xl w-full" required />
                    </div>
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">타입 선택</label>
                        <select id="type" class="custom-select px-4 py-3 rounded-xl w-full">
                            <option value="link">🔗 링크 (새 창에서 열기)</option>
                            <option value="modal">📱 모달 (HTML 컨텐츠)</option>
                        </select>
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">설명 (선택사항)</label>
                    <input type="text" id="description" placeholder="에이전트에 대한 간단한 설명을 입력하세요" class="form-input w-full px-4 py-3 rounded-xl" />
                </div>
                <div id="urlField" class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">URL 주소</label>
                    <input type="url" id="url" placeholder="https://example.com" class="form-input w-full px-4 py-3 rounded-xl" />
                    <p class="text-xs text-gray-500 mt-1">새 창에서 열릴 웹사이트 주소를 입력하세요</p>
                </div>
                
                <div id="htmlField" style="display:none;" class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">HTML 컨텐츠</label>
                    <textarea id="htmlContent" rows="6" placeholder="<div class='p-6 text-center'><h2>안녕하세요!</h2><p>여기에 HTML 내용을 작성하세요.</p></div>" class="form-input w-full px-4 py-3 rounded-xl font-mono text-sm"></textarea>
                    <p class="text-xs text-gray-500 mt-1">모달에 표시될 HTML 코드를 입력하세요</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">아이콘 선택</label>
                        <select id="icon" class="custom-select px-4 py-3 rounded-xl w-full">
                            <option value="fas fa-robot">🤖 로봇 (fas fa-robot)</option>
                            <option value="fas fa-brain">🧠 두뇌 (fas fa-brain)</option>
                            <option value="fas fa-magic">✨ 마법 (fas fa-magic)</option>
                            <option value="fas fa-lightbulb">💡 전구 (fas fa-lightbulb)</option>
                            <option value="fas fa-rocket">🚀 로켓 (fas fa-rocket)</option>
                            <option value="fas fa-star">⭐ 별 (fas fa-star)</option>
                            <option value="fas fa-heart">❤️ 하트 (fas fa-heart)</option>
                            <option value="fas fa-gem">💎 보석 (fas fa-gem)</option>
                            <option value="fas fa-crown">👑 왕관 (fas fa-crown)</option>
                            <option value="fas fa-fire">🔥 불꽃 (fas fa-fire)</option>
                            <option value="fas fa-bolt">⚡ 번개 (fas fa-bolt)</option>
                            <option value="fas fa-code">💻 코드 (fas fa-code)</option>
                            <option value="fas fa-paint-brush">🎨 브러시 (fas fa-paint-brush)</option>
                            <option value="fas fa-camera">📷 카메라 (fas fa-camera)</option>
                            <option value="fas fa-music">🎵 음악 (fas fa-music)</option>
                            <option value="fas fa-gamepad">🎮 게임 (fas fa-gamepad)</option>
                            <option value="fas fa-chart-line">📈 차트 (fas fa-chart-line)</option>
                            <option value="fas fa-shield-alt">🛡️ 방패 (fas fa-shield-alt)</option>
                            <option value="fas fa-globe">🌍 지구 (fas fa-globe)</option>
                            <option value="fas fa-users">👥 사용자 (fas fa-users)</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">색상 테마</label>
                        <select id="color" class="custom-select px-4 py-3 rounded-xl w-full">
                            <option value="purple">🟣 보라색 (Purple)</option>
                            <option value="blue">🔵 파란색 (Blue)</option>
                            <option value="green">🟢 초록색 (Green)</option>
                            <option value="red">🔴 빨간색 (Red)</option>
                            <option value="yellow">🟡 노란색 (Yellow)</option>
                            <option value="pink">🩷 분홍색 (Pink)</option>
                            <option value="orange">🟠 주황색 (Orange)</option>
                            <option value="teal">🔷 청록색 (Teal)</option>
                            <option value="indigo">🟦 남색 (Indigo)</option>
                        </select>
                    </div>
                </div>
                <div class="flex justify-end pt-4">
                    <button type="submit" class="btn-primary px-8 py-4 rounded-xl font-semibold text-lg">
                        <i class="fas fa-plus mr-2"></i>에이전트 추가
                    </button>
                </div>
            </form>
        </div>
        
        <!-- 에이전트 목록 -->
        <div class="glass-card rounded-2xl p-8">
            <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-4">
                    <i class="fas fa-list text-white text-lg"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-black">등록된 에이전트</h2>
                    <p class="text-gray-600">현재 ${buttons.length}개의 에이전트가 등록되어 있습니다</p>
                </div>
            </div>
            <div class="section-divider mb-6"></div>
            
            ${buttons.length === 0 ? 
                `<div class="text-center py-12">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-inbox text-gray-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-600 mb-2">등록된 에이전트가 없습니다</h3>
                    <p class="text-gray-500">위에서 첫 번째 에이전트를 추가해보세요!</p>
                </div>` :
                `<div id="buttonsList" class="grid gap-4">
                    ${buttons.map(btn => `
                        <div class="card-item rounded-xl p-6 border">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center mb-3">
                                        <div class="w-10 h-10 bg-${btn.color === 'purple' ? 'purple' : btn.color === 'blue' ? 'blue' : btn.color === 'green' ? 'green' : btn.color === 'red' ? 'red' : btn.color === 'yellow' ? 'yellow' : btn.color === 'pink' ? 'pink' : 'gray'}-100 rounded-lg flex items-center justify-center mr-3">
                                            <i class="${btn.icon || 'fas fa-star'} text-${btn.color === 'purple' ? 'purple' : btn.color === 'blue' ? 'blue' : btn.color === 'green' ? 'green' : btn.color === 'red' ? 'red' : btn.color === 'yellow' ? 'yellow' : btn.color === 'pink' ? 'pink' : 'gray'}-600"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-gray-900 text-lg">${btn.title}</h3>
                                            <span class="type-badge px-3 py-1 rounded-full text-xs mt-1 inline-block">
                                                ${btn.type === 'link' ? '🔗 링크' : '📱 모달'}
                                            </span>
                                        </div>
                                    </div>
                                    ${btn.description ? `<p class="text-gray-600 text-sm mb-2">${btn.description}</p>` : ''}
                                    ${btn.url ? `<p class="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">${btn.url}</p>` : ''}
                                    <p class="text-xs text-gray-400 mt-2">등록일: ${new Date(btn.createdAt).toLocaleDateString('ko-KR')}</p>
                                </div>
                                <button onclick="deleteButton('${btn.id}')" class="btn-danger px-4 py-2 rounded-lg text-sm font-medium ml-4">
                                    <i class="fas fa-trash mr-1"></i>삭제
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
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
        
        // 폼 제출 처리
        document.getElementById('addButtonForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                title: document.getElementById('title').value,
                type: document.getElementById('type').value,
                description: document.getElementById('description').value,
                url: document.getElementById('url').value,
                htmlContent: document.getElementById('htmlContent').value,
                typebotId: '', // Typebot 기능 제거됨
                apiHost: '',   // Typebot 기능 제거됨
                icon: document.getElementById('icon').value || 'fas fa-robot',
                color: document.getElementById('color').value
            };
            
            try {
                const response = await axios.post('/api/buttons', data);
                if (response.data.success) {
                    // 성공 메시지 표시
                    const successMsg = document.createElement('div');
                    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                    successMsg.innerHTML = '<i class="fas fa-check mr-2"></i>에이전트가 성공적으로 추가되었습니다!';
                    document.body.appendChild(successMsg);
                    
                    setTimeout(() => {
                        successMsg.remove();
                        location.reload();
                    }, 2000);
                }
            } catch (error) {
                const errorMsg = error.response?.data?.error || '에이전트 추가에 실패했습니다.';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                errorDiv.innerHTML = '<i class="fas fa-times mr-2"></i>' + errorMsg;
                document.body.appendChild(errorDiv);
                
                setTimeout(() => errorDiv.remove(), 5000);
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
  console.log(`✨ 업그레이드: 포트 8080, 고급 로그인 페이지 적용`);
});