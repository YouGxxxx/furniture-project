import { NavLink } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="wrap foot-grid">
        <div>
          <div className="foot-brand">
            <span className="logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 11l9-7 9 7" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
            </span>
            栖木家具
          </div>
          <p className="desc">
            专注企业家居全案定制，以匠心木作承载东方生活美学。品牌实力展示 · 产品案例 · 新闻资讯 · 招商合作。
          </p>
        </div>
        <div>
          <h4>产品</h4>
          <NavLink to="/products">产品中心</NavLink>
          <NavLink to="/cases">新案例展示</NavLink>
          <NavLink to="/brand">品牌介绍</NavLink>
        </div>
        <div>
          <h4>资讯</h4>
          <NavLink to="/news/company">企业新闻</NavLink>
          <NavLink to="/news/industry">行业资讯</NavLink>
          <NavLink to="/recruit/social">社会招聘</NavLink>
        </div>
        <div>
          <h4>联系</h4>
          <NavLink to="/contact">联系我们</NavLink>
          <NavLink to="/history">发展历程</NavLink>
          <NavLink to="/about">关于栖木家具</NavLink>
        </div>
      </div>
      <div className="wrap foot-bottom">
        © 2026 栖木家具（企业）有限公司 · 客服热线 400-888-0000 · 邮箱 service@hemuhome.com
        <br />
        粤ICP备00000000号
      </div>
    </footer>
  )
}
