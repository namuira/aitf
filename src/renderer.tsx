import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Custom Agent Dashboard</title>
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* FontAwesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Custom CSS */}
        <link href="/static/style.css" rel="stylesheet" />
        
        {/* Custom Tailwind Config */}
        <script>{`
          tailwind.config = {
            theme: {
              extend: {
                animation: {
                  'fade-in': 'fadeIn 0.5s ease-in-out',
                  'slide-up': 'slideUp 0.3s ease-out'
                }
              }
            }
          }
        `}</script>
      </head>
      <body class="font-sans antialiased">
        {children}
        
        {/* Axios for HTTP requests */}
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        {/* Custom JavaScript */}
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
})
