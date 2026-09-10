import type { CaseItem } from '../api'
import { gradientFor } from '../utils'

export default function CaseCard({ item }: { item: CaseItem }) {
  const cover = item.cover_image
  return (
    <div className="case-card">
      <div
        className="cover"
        style={cover ? { background: `center/cover no-repeat url(${cover})` } : { background: gradientFor(item.id) }}
      >
        {item.title.split('·')[0]}
      </div>
      <div className="body">
        <h4 style={{ marginBottom: 6 }}>{item.title}</h4>
        <p>{item.summary}</p>
      </div>
    </div>
  )
}
