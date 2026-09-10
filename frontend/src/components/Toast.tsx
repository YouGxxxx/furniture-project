import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ToastCtx {
  show: (msg: string) => void
}

const Ctx = createContext<ToastCtx>({ show: () => {} })

export function useToast(): ToastCtx {
  return useContext(Ctx)
}

/** 全局轻量 Toast：在 Layout 顶层挂载，任意页面调用 show()。 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((m: string) => {
    setMsg(m)
    setShow(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 2600)
  }, [])

  return (
    <Ctx.Provider value={{ show: showToast }}>
      {children}
      <div className={`toast${show ? ' show' : ''}`}>{msg}</div>
    </Ctx.Provider>
  )
}
