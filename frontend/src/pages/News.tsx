import { NavLink, useParams } from 'react-router-dom'
import { getNews, type NewsItem } from '../api'
import { useAsync } from '../hooks'
import NewsCard from '../components/NewsCard'

const CAT_MAP: Record<string, string> = {
  company: '企业新闻',
  industry: '行业资讯',
}

export default function News() {
  const { cat = 'company' } = useParams<{ cat: string }>()
  const catName = CAT_MAP[cat] || '企业新闻'

  const list = useAsync<{ items: NewsItem[]; total: number }>(
    () => getNews({ keyword: undefined, page: 1, page_size: 50 }).then((d) => ({
      items: d.items.filter((n) => (n.category_name || '') === catName),
      total: d.total,
    })),
    [catName],
  )

  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">NEWS</div>
          <h2>{catName}</h2>
          <p>按发布时间倒序排列，点击查看正文。</p>
        </div>

        <div className="news-tabs">
          <NavLink to="/news/company" className={({ isActive }) => (isActive ? 'active' : '')}>
            企业新闻
          </NavLink>
          <NavLink to="/news/industry" className={({ isActive }) => (isActive ? 'active' : '')}>
            行业资讯
          </NavLink>
        </div>

        <div className="news-grid">
          {(list.data?.items || []).map((n) => (
            <NewsCard key={n.id} news={n} />
          ))}
          {!list.loading && (list.data?.items || []).length === 0 && (
            <div className="empty">暂无{catName}内容。</div>
          )}
        </div>
      </div>
    </section>
  )
}
