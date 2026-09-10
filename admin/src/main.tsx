/**
 * 后台入口：挂载 antd 中文语言包 + React Query + 路由。
 */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { useAuth } from './store/auth'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function Root() {
  const init = useAuth((s) => s.init)
  useEffect(() => {
    void init()
  }, [init])
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#a87b4f' } }}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <Root />
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
