/**
 * 后台路由表：
 * - /login 公开；其余页面经 RequireAuth 守卫，并在 AdminLayout 内通过权限过滤菜单。
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import AdminLayout from './layout/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import News from './pages/News'
import Banners from './pages/Banners'
import About from './pages/About'
import Cases from './pages/Cases'
import Recruits from './pages/Recruits'
import Messages from './pages/Messages'
import UserList from './pages/UserList'
import RoleList from './pages/RoleList'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="news" element={<News />} />
          <Route path="banners" element={<Banners />} />
          <Route path="about" element={<About />} />
          <Route path="cases" element={<Cases />} />
          <Route path="recruits" element={<Recruits />} />
          <Route path="messages" element={<Messages />} />
          <Route path="system/users" element={<UserList />} />
          <Route path="system/roles" element={<RoleList />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
