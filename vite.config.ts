import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
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
