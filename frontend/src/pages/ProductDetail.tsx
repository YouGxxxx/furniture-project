import { Link, useParams } from 'react-router-dom'
import { getProduct, type Product } from '../api'
import { useAsync } from '../hooks'
import { gradientFor } from '../utils'
import { ArrowRight } from '../components/icons'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const pid = Number(id)
  const { data, loading, error } = useAsync<Product>(() => getProduct(pid), [pid])

  if (loading) return <div className="section wrap">加载中…</div>
  if (error || !data) return <div className="section wrap">产品不存在或加载失败。</div>

  const cover = data.cover_image
  const specs = [
    { k: '所属系列', v: data.series_name || '—' },
    { k: '适用空间', v: data.applicable_space || data.category_name || '—' },
    { k: '材质', v: data.material || '—' },
    { k: '尺寸', v: data.size || '—' },
    { k: '风格', v: data.style || '—' },
    { k: '价格', v: '暂不展示', muted: true },
  ]

  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div style={{ marginBottom: 18 }}>
          <Link to="/products" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            ← 返回产品中心
          </Link>
        </div>
        <div className="modal" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="modal-body">
            <div className="gallery">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="g"
                  style={cover ? { background: `center/cover no-repeat url(${cover})` } : { background: gradientFor(data.id + i) }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} width={40} height={40}>
                    <path d="M3 11l9-7 9 7" />
                    <path d="M5 10v10h14V10" />
                  </svg>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 26, marginBottom: 12 }}>{data.name}</h3>
            <div className="spec">
              {specs.map((s) => (
                <div className="item" key={s.k}>
                  <div className="k">{s.k}</div>
                  <div className="v" style={s.muted ? { color: 'var(--muted)' } : undefined}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            <div className="detail-text">
              <p>{data.description || '暂无详细描述。'}</p>
            </div>
            <Link to="/contact" className="btn btn-primary" style={{ marginTop: 8 }}>
              对此产品留言 / 询价 <ArrowRight width={16} height={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
