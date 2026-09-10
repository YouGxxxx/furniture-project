import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Nav from './Nav'
import Footer from './Footer'
import { ToastProvider } from './Toast'

export default function Layout() {
  const location = useLocation()

  // 路由切换回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <ToastProvider>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </ToastProvider>
  )
}
