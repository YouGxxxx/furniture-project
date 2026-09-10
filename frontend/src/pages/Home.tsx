import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getBanners, getNews, getSeries, type Banner, type NewsItem, type NameId } from '../api'
import { useAsync } from '../hooks'
import { gradientFor } from '../utils'
import { ArrowRight } from '../components/icons'

const DEFAULT_SLIDES = [
  {
    kicker: 'HEMU HOME',
    title: '以木作，栖居东方',
    desc: '专注企业家居全案定制，承载东方生活美学与当代匠心。',
    c1: '#7D5A3C',
    c2: '#5C4128',
    to: '/products',
  },
  {
    kicker: 'NEW ARRIVAL',
    title: '胡桃禮系列 全新上市',
    desc: '沉稳胡桃木色，东方礼序设计语言，邀您亲鉴。',
    c1: '#A8554E',
    c2: '#7E3B36',
    to: '/products',
  },
  {
    kicker: 'B2B',
    title: '诚邀城市合伙人',
    desc: '全国招商进行中，为经销商提供全案赋能与定制支持。',
    c1: '#3F5E8F',
    c2: '#2B426B',
    to: '/contact',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const banners = useAsync<Banner[]>(() => getBanners(), [])
  const series = useAsync<NameId[]>(() => getSeries(), [])
  const news = useAsync<PagedLite<NewsItem>>(() => getNews({ page_size: 3 }), [])

  const slides = (banners.data && banners.data.length ? banners.data : []).map((b, i) => ({
    kicker: 'FEATURED',
    title: b.title || '栖木家具',
    desc: '',
    c1: '',
    c2: '',
    to: b.link_url || '/products',
    bg: b.image_url,
    idx: i,
  }))

  const merged = slides.length ? slides : DEFAULT_SLIDES

  const [cur, setCur] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % merged.length), 5000)
    return () => clearInterval(t)
  }, [merged.length])

  return (
    <>
      {/* Hero 轮播 */}
      <section className="hero">
        {merged.map((s, i) => (
          <div
            key={i}
            className={`slide${i === cur ? ' active' : ''}`}
            style={
              'bg' in s && s.bg
                ? { background: `center/cover no-repeat url(${s.bg})` }
                : { background: `linear-gradient(135deg, ${s.c1}, ${s.c2})` }
            }
          >
            <div className="overlay" />
            <div className="content">
              <div className="kicker">{s.kicker}</div>
              <h1>{s.title}</h1>
              {s.desc && <p>{s.desc}</p>}
              {String(s.to).startsWith('http') ? (
                <a href={s.to} className="btn" target="_blank" rel="noreferrer">
                  了解更多 <ArrowRight width={16} height={16} />
                </a>
              ) : (
                <Link to={s.to} className="btn">
                  了解更多 <ArrowRight width={16} height={16} />
                </Link>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="hero-arrow prev"
          aria-label="上一张"
          onClick={() => setCur((c) => (c - 1 + merged.length) % merged.length)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          className="hero-arrow next"
          aria-label="下一张"
          onClick={() => setCur((c) => (c + 1) % merged.length)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div className="hero-dots">
          {merged.map((_, i) => (
            <button
              key={i}
              className={i === cur ? 'active' : ''}
              aria-label={`第${i + 1}张`}
              onClick={() => setCur(i)}
            />
          ))}
        </div>
      </section>

      {/* 品牌实力 */}
      <section className="section strength">
        <div className="wrap strength-grid">
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)', letterSpacing: 3, fontSize: 13, fontWeight: 700 }}>
              BRAND STRENGTH
            </div>
            <h2>十八年匠心木作，实力筑底信任</h2>
            <p>
              栖木家具集研发、制造、全案设计于一体，以绿色制造与柔性定制为核心能力，为经销商与采购方提供稳定可靠的家居产品与交付。
            </p>
            <p>从单品到全屋，从标准到定制，我们让东方木作美学可落地、可规模、可传承。</p>
            <Link to="/brand" className="btn btn-ghost" style={{ marginTop: 8 }}>
              了解品牌 →
            </Link>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="num">2008</div>
              <div className="lbl">成立年份</div>
            </div>
            <div className="stat">
              <div className="num">50,000㎡</div>
              <div className="lbl">现代化厂区</div>
            </div>
            <div className="stat">
              <div className="num">12</div>
              <div className="lbl">智能生产线</div>
            </div>
            <div className="stat">
              <div className="num">3000+</div>
              <div className="lbl">服务客户</div>
            </div>
          </div>
        </div>
      </section>

      {/* 产品系列入口 */}
      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">PRODUCT SERIES</div>
            <h2>产品系列入口</h2>
            <p>系列产品覆盖全屋空间，点击进入产品中心浏览全部 SKU。</p>
          </div>
          <div className="series-grid">
            {(series.data || []).map((s) => (
              <div
                key={s.id}
                className="series-card"
                onClick={() => navigate(`/products?series=${s.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/products?series=${s.id}`)}
              >
                <div className="thumb" style={{ background: gradientFor(s.id) }}>
                  {s.name}
                </div>
                <div className="body">
                  <h4>{s.name}</h4>
                  <span>查看该系列</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 新闻动态 */}
      <section className="section" style={{ background: 'var(--surface-2)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">NEWS</div>
            <h2>新闻动态</h2>
            <p>最新企业新闻与行业资讯，洞察品牌与行业脉搏。</p>
          </div>
          <div className="news-grid">
            {(news.data?.items || []).map((n) => (
              <div
                key={n.id}
                className="news-card"
                onClick={() => navigate(`/news/detail/${n.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/news/detail/${n.id}`)}
              >
                <div className="cover" style={{ background: gradientFor(n.id) }}>
                  {n.category_name || '资讯'}
                </div>
                <div className="body">
                  <div className="date">{n.published_at?.slice(0, 10)}</div>
                  <h4>{n.title}</h4>
                  <p>{n.summary}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <Link to="/news/company" className="btn btn-ghost">
              查看全部新闻 →
            </Link>
          </div>
        </div>
      </section>

      {/* 招商 · 招聘入口 */}
      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">JOIN US</div>
            <h2>招商 · 招聘入口</h2>
            <p>成为城市合伙人，或加入我们的团队，共筑东方木作家居事业。</p>
          </div>
          <div className="recruit-grid">
            <div className="recruit-card">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-6h6v6" />
                </svg>
                城市招商合作
              </h3>
              <p>面向全国招募经销商与项目合伙人，提供全案设计、定制生产与门店赋能支持。</p>
              <Link to="/contact" className="btn btn-primary">
                立即咨询 →
              </Link>
            </div>
            <div className="recruit-card">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-1a6 6 0 0 1 12 0v1" />
                </svg>
                人才招聘
              </h3>
              <p>设计、研发、品牌、运营等多岗位开放，欢迎有热爱木作与生活美学的你。</p>
              <Link to="/recruit/social" className="btn btn-ghost">
                查看职位 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// 局部轻量分页类型（仅取 items）
interface PagedLite<T> {
  items: T[]
  total: number
}
