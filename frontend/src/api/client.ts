import axios from 'axios'

/**
 * 全局 axios 实例。
 * baseURL 取自 .env 的 VITE_API_BASE（开发期 http://localhost:8000/api/v1）。
 * 统一响应信封 { code, message, data } 由各模块在调用处按需解包。
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api/v1',
  timeout: 15000,
})

// 请求拦截：注入 JWT（Phase 2 登录后写入 localStorage）
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一解包 { code, message, data }
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // 401 统一跳登录由路由守卫处理；此处仅透传
    return Promise.reject(error)
  },
)

export default api
