/**
 * 后台认证状态（zustand）。
 * - 登录后保存 token（localStorage）与当前用户（含权限码列表）；
 * - 提供 hasPerm() 供菜单/路由做权限过滤；super_admin 等同全权限。
 */
import { create } from 'zustand'
import { authApi } from '../api'
import type { User } from '../api/types'

interface AuthState {
  token: string | null
  user: User | null
  initialized: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
  /** 启动时若存在 token，拉取最新用户信息。 */
  init: () => Promise<void>
  /** 判断是否拥有某权限（super_admin 短路）。 */
  hasPerm: (perm: string) => boolean
  /** 当前用户是否超级管理员。 */
  isAdmin: () => boolean
}

function loadUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: loadUser(),
  initialized: false,

  login: async (username, password) => {
    const res = await authApi.login(username, password)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user', JSON.stringify(res.user))
    set({ token: res.access_token, user: res.user })
    return res.user
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      /* 服务端无状态，失败亦可清除本地 */
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  init: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ initialized: true })
      return
    }
    try {
      const user = await authApi.me()
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, initialized: true })
    } catch {
      // token 失效：清除并停留在未登录态
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ token: null, user: null, initialized: true })
    }
  },

  hasPerm: (perm) => {
    const u = get().user
    if (!u) return false
    if (u.role?.code === 'super_admin') return true
    return u.permissions.includes(perm)
  },

  isAdmin: () => get().user?.role?.code === 'super_admin',
}))
