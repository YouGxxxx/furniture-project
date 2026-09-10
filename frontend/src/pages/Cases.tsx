import { getCases, type CaseItem } from '../api'
import { useAsync } from '../hooks'
import CaseCard from '../components/CaseCard'

export default function Cases() {
  const list = useAsync<{ items: CaseItem[]; total: number }>(() => getCases({ page: 1, page_size: 50 }), [])

  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">CASES</div>
          <h2>新案例展示</h2>
          <p>精选落地案例，呈现栖木家具在住宅、民宿与办公空间中的真实交付。</p>
        </div>
        <div className="case-grid">
          {(list.data?.items || []).map((c) => (
            <CaseCard key={c.id} item={c} />
          ))}
          {!list.loading && (list.data?.items || []).length === 0 && (
            <div className="empty">暂无案例，敬请期待。</div>
          )}
        </div>
      </div>
    </section>
  )
}
