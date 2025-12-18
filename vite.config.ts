import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log proxied requests in development
            console.log('🟢 Proxy Request to backend:', {
              method: req.method,
              originalUrl: req.url,
              targetUrl: `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
              headers: {
                'content-type': proxyReq.getHeader('content-type'),
                'authorization': proxyReq.getHeader('authorization') ? 'Bearer ***' : 'none'
              }
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Log backend responses
            console.log('🟡 Proxy Response from backend:', {
              statusCode: proxyRes.statusCode,
              statusMessage: proxyRes.statusMessage,
              url: req.url
            });
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy Error:', err);
          });
        },
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ['prop-types'],
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@colors': path.resolve(__dirname, './src/colors'),
      '@redux': path.resolve(__dirname, './src/redux-toolkit'),
      '@root': path.resolve(__dirname, './src'),
    },
  },
})
