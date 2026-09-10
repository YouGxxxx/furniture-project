import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 开发期将 /api 代理到后端（避免跨域），对应后端前缀 /api/v1
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // 上传文件经后端 /media 静态映射提供，前端经此代理读取（否则 /media 404）
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
