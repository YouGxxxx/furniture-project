import { Link, useParams } from 'react-router-dom'
import { getNewsDetail, type NewsItem } from '../api'
import { useAsync } from '../hooks'
import { gradientFor, formatDate } from '../utils'

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const nid = Number(id)
  const { data, loading, error } = useAsync<NewsItem>(() => getNewsDetail(nid), [nid])

  if (loading) return <div className="section wrap">加载中…</div>
  if (error || !data) return <div className="section wrap">新闻不存在或加载失败。</div>

  const cover = data.cover_image
  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap" style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <Link to="/news/company" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            ← 返回新闻
          </Link>
        </div>
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>{data.title}</h2>
        <div className="news-detail">
          <div className="meta">
            <span>来源：{data.category_name || '资讯'}</span>
            <span>发布：{formatDate(data.published_at)}</span>
            {data.author && <span>作者：{data.author}</span>}
          </div>
          <div
            className="cover"
            style={cover ? { background: `center/cover no-repeat url(${cover})` } : { background: gradientFor(data.id) }}
          >
            {data.category_name || '资讯'}
          </div>
          <div
            className="detail-text"
            // 内容经后端 bleach 清洗，安全；此处按富文本渲染
            dangerouslySetInnerHTML={{ __html: data.content || '暂无正文。' }}
          />
        </div>
      </div>
    </section>
  )
}
