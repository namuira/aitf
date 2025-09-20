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

// Use JSX renderer
app.use(renderer)

// Authentication middleware for protected routes
const authMiddleware = async (c: any, next: any) => {
  const sessionCookie = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1]
  
  if (!sessionCookie) {
    return c.redirect('/?auth=required')
  }
  
  try {
    const session: AuthSession | null = await c.env.WEBAPP_KV.get(`session:${sessionCookie}`, 'json')
    if (!session || !session.authenticated || Date.now() > session.expiresAt) {
      return c.redirect('/?auth=expired')
    }
    
    await next()
  } catch (error) {
    return c.redirect('/?auth=error')
  }
}

// Main page with login form or dashboard
app.get('/', (c) => {
  const authParam = c.req.query('auth')
  const sessionCookie = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1]
  
  return c.render(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            <i className="fas fa-robot mr-3"></i>
            Custom Agent Dashboard
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
            <button
              id="logoutBtn"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              로그아웃
            </button>
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

// API: Get all buttons
app.get('/api/buttons', authMiddleware, async (c) => {
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
