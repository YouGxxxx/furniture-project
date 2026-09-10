import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 后台固定 5174，避免与官网前端(5173)端口冲突，且匹配后端 CORS 放行列表
  server: {
    port: 5174,
  },
})
