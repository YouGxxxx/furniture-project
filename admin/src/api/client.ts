import axios from 'axios'

/**
 * 后台全局 axios 实例。
 * baseURL 取自 .env 的 VITE_API_BASE（开发期 http://localhost:8000/api/v1）。
 * 后端统一信封 { code, message, data }：成功时 code===0；本文件仅在出错时做归一化。
 * 各 API 函数通过 api/index.ts 的 ok() 解包 data。
 */

export interface ApiErrorBody {
  code: number
  message: string
  data?: unknown
}

/** 业务/HTTP 错误统一类型，页面用 err.code / err.message 提示。 */
export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api/v1',
  timeout: 15000,
})

// 请求拦截：注入 JWT（登录后写入 localStorage）
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截（仅错误处理）：401 清除凭证并跳登录；其余归一为 ApiError
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const resp = error.response
    if (resp) {
      if (resp.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      const body = resp.data as ApiErrorBody | undefined
      const code = body?.code ?? resp.status
      const message = body?.message || error.message || '请求失败'
      return Promise.reject(new ApiError(code, message))
    }
    return Promise.reject(new ApiError(-1, error.message || '网络错误'))
  },
)

/**
 * 解包后端信封：code!==0 抛 ApiError，否则返回 data。
 * 使用动态 import 类型避免顶层引入 AxiosResponse 触发 verbatimModuleSyntax 报错。
 */
export async function ok<T>(
  p: Promise<import('axios').AxiosResponse<{ code: number; message: string; data: T }>>,
): Promise<T> {
  const resp = await p
  const env = resp.data
  if (env.code !== 0) {
    throw new ApiError(env.code, env.message || '请求失败')
  }
  return env.data
}
