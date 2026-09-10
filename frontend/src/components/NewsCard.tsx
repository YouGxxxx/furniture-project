import { Link } from 'react-router-dom'
import type { NewsItem } from '../api'
import { gradientFor, formatDate } from '../utils'

export default function NewsCard({ news }: { news: NewsItem }) {
  const cover = news.cover_image
  return (
    <Link to={`/news/detail/${news.id}`} className="news-card">
      <div
        className="cover"
        style={cover ? { background: `center/cover no-repeat url(${cover})` } : { background: gradientFor(news.id) }}
      >
        {news.category_name || '资讯'}
      </div>
      <div className="body">
        <div className="date">{formatDate(news.published_at) || formatDate(news.summary)}</div>
        <h4>{news.title}</h4>
        <p>{news.summary}</p>
      </div>
    </Link>
  )
}
