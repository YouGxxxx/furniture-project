import axios from 'axios'

/**
 * 统一 API 客户端。
 * - baseURL 取 .env 的 VITE_API_BASE（开发期 /api/v1，经 Vite 代理转发到后端 8000）。
 * - 响应拦截统一解包后端信封 { code, message, data }：成功(code=0)直接返回 data；
 *   业务错误(code!=0)或非 0 HTTP 状态抛 ApiError。
 */
export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1',
  timeout: 15000,
})

// 请求拦截：注入 JWT（后台登录后写入 localStorage 的 'token'）
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：解包信封 + 统一错误
api.interceptors.response.use(
  (resp) => {
    const body = resp.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code !== 0) {
        return Promise.reject(new ApiError(body.code, body.message || '请求失败'))
      }
      return body.data
    }
    return body
  },
  (error) => {
    const body = error.response?.data ?? {}
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    const msg = body?.message || error.message || '网络错误'
    const code = body?.code ?? error.response?.status ?? -1
    return Promise.reject(new ApiError(code, msg))
  },
)

export default api
