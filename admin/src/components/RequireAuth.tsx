/**
 * 路由守卫：未登录（无 token）直接跳 /login。
 * 依赖 useAuth.init() 在 App 启动阶段完成用户信息刷新。
 */
import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../store/auth'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token)
  const initialized = useAuth((s) => s.initialized)
  const location = useLocation()

  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中…" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
