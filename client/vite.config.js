import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://tish-production.up.railway.app',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Proxy error:', err)
            console.log('Request URL:', req.url)
            console.log('Target:', options.target)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🚀 Sending Request to Target:', {
              method: req.method,
              url: req.url,
              target: 'https://tish-production.up.railway.app' + req.url,
              headers: proxyReq.getHeaders()
            })
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Received Response from Target:', {
              statusCode: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers,
              contentType: proxyRes.headers['content-type']
            })
          })
        }
      }
    }
  }
})
