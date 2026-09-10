import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, MenuIcon } from './icons'

interface DropItem {
  label: string
  to: string
}
interface MenuGroup {
  label: string
  to?: string // 顶级可点击项（无下拉时）
  items?: DropItem[]
}

const MENUS: MenuGroup[] = [
  { label: '首页', to: '/' },
  {
    label: '产品',
    items: [
      { label: '产品中心', to: '/products' },
      { label: '新案例展示', to: '/cases' },
    ],
  },
  {
    label: '新闻',
    items: [
      { label: '企业新闻', to: '/news/company' },
      { label: '行业资讯', to: '/news/industry' },
    ],
  },
  {
    label: '招聘入口',
    items: [
      { label: '社会招聘', to: '/recruit/social' },
      { label: '校园招聘', to: '/recruit/campus' },
    ],
  },
  {
    label: '关于我们',
    items: [
      { label: '关于栖木家具', to: '/about' },
      { label: '发展历程', to: '/history' },
      { label: '品牌介绍', to: '/brand' },
      { label: '联系我们', to: '/contact' },
    ],
  },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [mobileDrop, setMobileDrop] = useState<number | null>(null)
  const location = useLocation()

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          <span className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 11l9-7 9 7" />
              <path d="M5 10v10h14V10" />
              <path d="M9 20v-6h6v6" />
            </svg>
          </span>
          <span>
            栖木家具<small>HEMU HOME</small>
          </span>
        </NavLink>

        <nav>
          <ul className={`menu${open ? ' open' : ''}`}>
            {MENUS.map((m, i) =>
              m.items ? (
                <li key={m.label}>
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={mobileDrop === i}
                    onClick={() => {
                      if (window.innerWidth <= 768) {
                        setMobileDrop(mobileDrop === i ? null : i)
                      }
                    }}
                  >
                    {m.label}
                    <ChevronDown />
                  </button>
                  <div className="dropdown">
                    {m.items.map((it) => (
                      <NavLink
                        key={it.to}
                        to={it.to}
                        className={({ isActive }) =>
                          isActive || location.pathname.startsWith(it.to) ? 'active' : ''
                        }
                        onClick={() => {
                          setOpen(false)
                          setMobileDrop(null)
                        }}
                      >
                        {it.label}
                      </NavLink>
                    ))}
                  </div>
                </li>
              ) : (
                <li key={m.label}>
                  <NavLink
                    to={m.to!}
                    end={m.to === '/'}
                    className={({ isActive }) => (isActive ? 'active' : '')}
                    onClick={() => {
                      setOpen(false)
                      setMobileDrop(null)
                    }}
                  >
                    {m.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="nav-cta">
          <NavLink to="/contact" className="btn-quote">
            留言 / 询价
          </NavLink>
          <button
            type="button"
            className="hamburger"
            aria-label="菜单"
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
