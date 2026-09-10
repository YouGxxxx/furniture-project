import { getAbout, type About } from '../api'
import { useAsync } from '../hooks'

export default function About() {
  const { data, loading } = useAsync<About>(() => getAbout('about'), [])

  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="wrap">
        <div className="sec-head" style={{ textAlign: 'left' }}>
          <div className="eyebrow">ABOUT HEMU</div>
          <h2>关于栖木家具</h2>
          <p>以东方木作工艺为根，做经得起时间的生活家具。</p>
        </div>
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>加载中…</p>
        ) : (
          <div
            style={{ maxWidth: 820, color: 'var(--text-2)', fontSize: 16, lineHeight: 1.9 }}
            dangerouslySetInnerHTML={{ __html: data?.content || '内容更新中。' }}
          />
        )}
      </div>
    </section>
  )
}
