import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import { CustomButton, AuthSession, CloudflareBindings } from './types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Serve main index.html (GenSpark style page)
app.get('/', async (c) => {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GenSpark 슈퍼 에이전트</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- FontAwesome Icons -->
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    
    <style>
        /* Custom Tailwind Configuration */
        .agent-icon {
            background: linear-gradient(135deg, var(--icon-color-1), var(--icon-color-2));
            transition: all 0.3s ease;
        }
        
        .agent-icon:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        /* Pastel color variants */
        .icon-purple { --icon-color-1: #e0c3fc; --icon-color-2: #9bb5ff; }
        .icon-blue { --icon-color-1: #a8e6cf; --icon-color-2: #88d8ff; }
        .icon-green { --icon-color-1: #c3f0ca; --icon-color-2: #a8e6cf; }
        .icon-pink { --icon-color-1: #ffc3d8; --icon-color-2: #ffb3d9; }
        .icon-orange { --icon-color-1: #ffd3a5; --icon-color-2: #fd9853; }
        .icon-yellow { --icon-color-1: #fff2a8; --icon-color-2: #ffcc70; }
        .icon-teal { --icon-color-1: #a8f0e6; --icon-color-2: #70d0c4; }
        .icon-red { --icon-color-1: #ffb3ba; --icon-color-2: #ff9aa2; }
        .icon-indigo { --icon-color-1: #c5b9ff; --icon-color-2: #a29bfe; }
        
        /* Management button style */
        .management-btn {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .management-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        }
        
        /* Chat input style */
        .chat-input {
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.1);
        }
        
        /* Agent grid responsive */
        .agents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        @media (min-width: 640px) {
            .agents-grid {
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            }
        }
    </style>
</head>
<body class="min-h-screen bg-white">
    <!-- Header -->
    <div class="text-center py-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
            GenSpark 슈퍼 에이전트 ●
        </h1>
    </div>

    <!-- Search Input -->
    <div class="max-w-2xl mx-auto px-4 mb-12">
        <div class="relative">
            <input 
                type="text" 
                placeholder="무엇이든 물어보고 만들어보세요"
                class="chat-input w-full px-6 py-4 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
                <button class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-microphone text-lg"></i>
                </button>
                <button class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-camera text-lg"></i>
                </button>
                <button class="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-colors">
                    <i class="fas fa-paper-plane text-sm"></i>
                </button>
            </div>
        </div>
        
        <!-- Suggestion Pills -->
        <div class="flex flex-wrap justify-center gap-3 mt-4">
            <span class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm text-gray-700 cursor-pointer transition-colors">
                내 노션 노트 검색하기
            </span>
            <span class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm text-gray-700 cursor-pointer transition-colors">
                Reddit의 첫 페이지에서 핫한 기사 인기 인지 알아 계시나요?
            </span>
        </div>
    </div>

    <!-- Agents Grid -->
    <div class="px-4 mb-16">
        <div id="agentsContainer" class="agents-grid">
            <!-- Default agents will be loaded here -->
        </div>
    </div>

    <!-- Management Button -->
    <a href="/login" class="management-btn text-white hover:no-underline" title="대시보드 관리">
        <i class="fas fa-cogs text-xl"></i>
    </a>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Default agents configuration
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

        // Color classes mapping
        const colorClasses = {
            purple: 'icon-purple',
            blue: 'icon-blue', 
            green: 'icon-green',
            pink: 'icon-pink',
            orange: 'icon-orange',
            yellow: 'icon-yellow',
            teal: 'icon-teal',
            red: 'icon-red',
            indigo: 'icon-indigo'
        };

        // Load and display agents
        async function loadAgents() {
            try {
                // Try to load custom agents from the dashboard API
                const response = await axios.get('/api/buttons');
                const customButtons = response.data || [];
                
                // Combine default agents with custom buttons
                const allAgents = [...defaultAgents];
                
                // Add custom buttons as agents
                customButtons.forEach(button => {
                    allAgents.splice(-1, 0, {
                        id: button.id,
                        title: button.title,
                        icon: button.icon || 'fas fa-star',
                        color: button.color || 'purple',
                        custom: true,
                        type: button.type,
                        url: button.url,
                        htmlContent: button.htmlContent,
                        description: button.description
                    });
                });
                
                renderAgents(allAgents);
            } catch (error) {
                console.log('Loading custom agents failed, showing defaults only');
                renderAgents(defaultAgents);
            }
        }

        // Render agents grid
        function renderAgents(agents) {
            const container = document.getElementById('agentsContainer');
            container.innerHTML = agents.map(agent => createAgentHTML(agent)).join('');
            
            // Add click event listeners
            agents.forEach(agent => {
                const element = document.getElementById(\`agent-\${agent.id}\`);
                if (element) {
                    element.addEventListener('click', () => handleAgentClick(agent));
                }
            });
        }

        // Create HTML for single agent
        function createAgentHTML(agent) {
            const colorClass = colorClasses[agent.color] || 'icon-purple';
            
            return \`
                <div id="agent-\${agent.id}" class="text-center cursor-pointer group">
                    <div class="agent-icon \${colorClass} w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mx-auto">
                        <i class="\${agent.icon} text-xl text-white"></i>
                    </div>
                    <h3 class="text-sm font-medium text-gray-800 group-hover:text-purple-600 transition-colors">
                        \${agent.title}
                    </h3>
                    \${agent.custom && agent.description ? 
                        \`<p class="text-xs text-gray-500 mt-1">\${agent.description}</p>\` : 
                        ''
                    }
                </div>
            \`;
        }

        // Handle agent click
        function handleAgentClick(agent) {
            if (agent.custom) {
                // Handle custom agents
                if (agent.type === 'link') {
                    window.open(agent.url, '_blank');
                } else if (agent.type === 'modal') {
                    showModal(agent.title, agent.htmlContent);
                }
            } else {
                // Handle default agents (placeholder functionality)
                showNotification(\`\${agent.title} 클릭됨! (기본 에이전트)\`, 'info');
            }
        }

        // Show modal for HTML content
        function showModal(title, htmlContent) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
            modal.innerHTML = \`
                <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div class="flex justify-between items-center p-6 border-b border-gray-200">
                        <h3 class="text-xl font-semibold text-gray-800">\${title}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        \${htmlContent}
                    </div>
                </div>
            \`;
            
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Close modal with escape key
            const escapeHandler = function(e) {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }

        // Show notification
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`
                fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm
                \${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
                transform translate-x-full transition-transform duration-300
            \`;
            
            const icon = type === 'success' ? 'fas fa-check' : type === 'error' ? 'fas fa-exclamation-triangle' : 'fas fa-info';
            
            notification.innerHTML = \`
                <div class="flex items-center space-x-3">
                    <i class="\${icon}"></i>
                    <span>\${message}</span>
                    <button onclick="this.closest('.fixed').remove()" class="ml-auto text-white/80 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            \`;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 100);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('translate-x-full');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 5000);
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            loadAgents();
            
            // Reload agents periodically to get updates from dashboard
            setInterval(loadAgents, 30000); // Reload every 30 seconds
        });

        // Handle search input
        document.querySelector('input[type="text"]').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    showNotification(\`검색: "\${query}" (기능 준비 중)\`, 'info');
                    this.value = '';
                }
            }
        });
    </script>
</body>
</html>`
  
  return c.html(html)
})

// Use JSX renderer for other pages
app.use('/login', renderer)
app.use('/dashboard', renderer)

// Authentication middleware for protected routes
const authMiddleware = async (c: any, next: any) => {
  const sessionCookie = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1]
  
  if (!sessionCookie) {
    return c.redirect('/login?auth=required')
  }
  
  try {
    const session: AuthSession | null = await c.env.WEBAPP_KV.get(`session:${sessionCookie}`, 'json')
    if (!session || !session.authenticated || Date.now() > session.expiresAt) {
      return c.redirect('/login?auth=expired')
    }
    
    await next()
  } catch (error) {
    return c.redirect('/login?auth=error')
  }
}

// Login page
app.get('/login', (c) => {
  const authParam = c.req.query('auth')
  
  return c.render(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            <i className="fas fa-robot mr-3"></i>
            관리자 로그인
          </h1>
          <p className="text-gray-300 text-lg">나만의 에이전트와 링크를 관리하세요</p>
        </div>

        {/* Authentication Status Messages */}
        {authParam === 'required' && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-yellow-600 text-white rounded-lg">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            인증이 필요합니다.
          </div>
        )}
        {authParam === 'expired' && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-600 text-white rounded-lg">
            <i className="fas fa-clock mr-2"></i>
            세션이 만료되었습니다. 다시 로그인해주세요.
          </div>
        )}
        {authParam === 'error' && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-600 text-white rounded-lg">
            <i className="fas fa-times mr-2"></i>
            인증 중 오류가 발생했습니다.
          </div>
        )}

        {/* Login Form */}
        <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form id="loginForm" className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <i className="fas fa-lock mr-2"></i>
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              로그인
            </button>
          </form>
          
          <div id="authMessage" className="mt-4 text-center text-sm"></div>
        </div>
      </div>
    </div>
  )
})

// Dashboard page (protected)
app.get('/dashboard', authMiddleware, async (c) => {
  try {
    // Get all custom buttons from KV
    const buttonsData = await c.env.WEBAPP_KV.get('custom_buttons', 'json') || []
    
    return c.render(
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <i className="fas fa-tachometer-alt mr-3"></i>
                Agent Dashboard
              </h1>
              <p className="text-gray-300">커스텀 에이전트와 링크를 관리하고 사용하세요</p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                <i className="fas fa-home mr-2"></i>
                메인 페이지
              </a>
              <button
                id="logoutBtn"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                로그아웃
              </button>
            </div>
          </div>

          {/* Add New Button Section */}
          <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              <i className="fas fa-plus mr-2"></i>
              새 버튼 추가
            </h2>
            
            <form id="addButtonForm" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">제목</label>
                  <input
                    type="text"
                    id="buttonTitle"
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="버튼 제목"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">타입</label>
                  <select
                    id="buttonType"
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="link">링크</option>
                    <option value="modal">모달</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">설명 (선택)</label>
                <input
                  type="text"
                  id="buttonDescription"
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="버튼 설명"
                />
              </div>
              
              <div id="urlField">
                <label className="block text-white text-sm font-medium mb-2">URL</label>
                <input
                  type="url"
                  id="buttonUrl"
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com"
                />
              </div>
              
              <div id="htmlField" style="display: none;">
                <label className="block text-white text-sm font-medium mb-2">HTML 내용</label>
                <textarea
                  id="buttonHtml"
                  rows={6}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="모달에 표시할 HTML 내용을 입력하세요"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">아이콘 (FontAwesome)</label>
                  <input
                    type="text"
                    id="buttonIcon"
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="예: fas fa-robot"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">색상</label>
                  <select
                    id="buttonColor"
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="purple">보라색</option>
                    <option value="blue">파란색</option>
                    <option value="green">초록색</option>
                    <option value="red">빨간색</option>
                    <option value="yellow">노란색</option>
                    <option value="pink">분홍색</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
              >
                <i className="fas fa-plus mr-2"></i>
                버튼 추가
              </button>
            </form>
          </div>

          {/* Custom Buttons Grid */}
          <div id="buttonsContainer">
            <h2 className="text-xl font-semibold text-white mb-6">
              <i className="fas fa-th-large mr-2"></i>
              내 에이전트 & 링크
            </h2>
            
            <div id="buttonsGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Buttons will be loaded dynamically */}
            </div>
          </div>
        </div>
        
        {/* Modal for HTML content */}
        <div id="htmlModal" className="fixed inset-0 bg-black/50 backdrop-blur-sm hidden z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 id="modalTitle" className="text-xl font-semibold text-gray-800"></h3>
                <button
                  id="closeModal"
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div id="modalContent" className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* HTML content will be loaded here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return c.text('Error loading dashboard', 500)
  }
})

// API: Login
app.post('/api/login', async (c) => {
  try {
    const { password } = await c.req.json()
    
    // Simple password check (in production, use proper hashing)
    const correctPassword = 'admin123' // Change this to your desired password
    
    if (password !== correctPassword) {
      return c.json({ success: false, message: '비밀번호가 틀렸습니다.' }, 401)
    }
    
    // Create session
    const sessionId = crypto.randomUUID()
    const session: AuthSession = {
      authenticated: true,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    
    // Store session in KV
    await c.env.WEBAPP_KV.put(`session:${sessionId}`, JSON.stringify(session), { expirationTtl: 24 * 60 * 60 })
    
    return c.json({ success: true, sessionId })
  } catch (error) {
    return c.json({ success: false, message: '로그인 중 오류가 발생했습니다.' }, 500)
  }
})

// API: Logout
app.post('/api/logout', async (c) => {
  try {
    const sessionCookie = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1]
    
    if (sessionCookie) {
      await c.env.WEBAPP_KV.delete(`session:${sessionCookie}`)
    }
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, message: '로그아웃 중 오류가 발생했습니다.' }, 500)
  }
})

// API: Get all buttons (public - no auth required for main page)
app.get('/api/buttons', async (c) => {
  try {
    const buttons = await c.env.WEBAPP_KV.get('custom_buttons', 'json') || []
    return c.json(buttons)
  } catch (error) {
    return c.json({ error: '버튼 목록을 가져오는 중 오류가 발생했습니다.' }, 500)
  }
})

// API: Add new button
app.post('/api/buttons', authMiddleware, async (c) => {
  try {
    const buttonData = await c.req.json()
    
    // Validate required fields
    if (!buttonData.title || !buttonData.type) {
      return c.json({ error: '제목과 타입은 필수입니다.' }, 400)
    }
    
    if (buttonData.type === 'link' && !buttonData.url) {
      return c.json({ error: '링크 타입에는 URL이 필요합니다.' }, 400)
    }
    
    if (buttonData.type === 'modal' && !buttonData.htmlContent) {
      return c.json({ error: '모달 타입에는 HTML 내용이 필요합니다.' }, 400)
    }
    
    // Get existing buttons
    const existingButtons: CustomButton[] = await c.env.WEBAPP_KV.get('custom_buttons', 'json') || []
    
    // Create new button
    const newButton: CustomButton = {
      id: crypto.randomUUID(),
      title: buttonData.title,
      description: buttonData.description || '',
      type: buttonData.type,
      url: buttonData.url || '',
      htmlContent: buttonData.htmlContent || '',
      icon: buttonData.icon || 'fas fa-star',
      color: buttonData.color || 'purple',
      createdAt: new Date().toISOString()
    }
    
    // Add to existing buttons
    existingButtons.push(newButton)
    
    // Save to KV
    await c.env.WEBAPP_KV.put('custom_buttons', JSON.stringify(existingButtons))
    
    return c.json({ success: true, button: newButton })
  } catch (error) {
    return c.json({ error: '버튼 추가 중 오류가 발생했습니다.' }, 500)
  }
})

// API: Delete button
app.delete('/api/buttons/:id', authMiddleware, async (c) => {
  try {
    const buttonId = c.req.param('id')
    
    // Get existing buttons
    const existingButtons: CustomButton[] = await c.env.WEBAPP_KV.get('custom_buttons', 'json') || []
    
    // Filter out the button to delete
    const updatedButtons = existingButtons.filter(button => button.id !== buttonId)
    
    // Save updated list
    await c.env.WEBAPP_KV.put('custom_buttons', JSON.stringify(updatedButtons))
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: '버튼 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

export default app
