import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getProducts, getSeries, type NameId, type Product } from '../api'
import { useAsync } from '../hooks'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const [params] = useSearchParams()
  const initialSeries = params.get('series')
  const initialSpace = params.get('space')

  const [keyword, setKeyword] = useState('')
  const [seriesId, setSeriesId] = useState<number | null>(initialSeries ? Number(initialSeries) : null)
  const [categoryId, setCategoryId] = useState<number | null>(initialSpace ? Number(initialSpace) : null)
  const [page, setPage] = useState(1)
  const pageSize = 6

  const cats = useAsync<NameId[]>(() => getCategories(), [])
  const series = useAsync<NameId[]>(() => getSeries(), [])
  const list = useAsync<{ items: Product[]; total: number; page: number; page_size: number }>(
    () =>
      getProducts({
        series_id: seriesId ?? undefined,
        category_id: categoryId ?? undefined,
        keyword: keyword || undefined,
        page,
        page_size: pageSize,
      }),
    [seriesId, categoryId, keyword, page],
  )

  // series 参数变化同步到 state
  useEffect(() => {
    if (initialSeries) setSeriesId(Number(initialSeries))
    if (initialSpace) setCategoryId(Number(initialSpace))
  }, [initialSeries, initialSpace])

  const totalPages = Math.max(1, Math.ceil((list.data?.total || 0) / pageSize))

  function resetPage() {
    setPage(1)
  }

  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div className="sec-head" style={{ textAlign: 'left', marginBottom: 24 }}>
          <div className="eyebrow">PRODUCT CENTER</div>
          <h2>产品中心</h2>
          <p>按系列与适用空间筛选，关键词检索；产品详情不展示价格。</p>
        </div>

        <div className="filters">
          <div className="field">
            <label htmlFor="kw">关键词</label>
            <input
              id="kw"
              type="text"
              placeholder="搜索产品名称…"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                resetPage()
              }}
              onKeyDown={(e) => e.key === 'Enter' && resetPage()}
            />
          </div>
          <div className="field">
            <label>适用空间</label>
            <div className="chips" id="spaceChips">
              <button
                className={`chip${categoryId === null ? ' active' : ''}`}
                onClick={() => {
                  setCategoryId(null)
                  resetPage()
                }}
              >
                全部
              </button>
              {(cats.data || []).map((c) => (
                <button
                  key={c.id}
                  className={`chip${categoryId === c.id ? ' active' : ''}`}
                  onClick={() => {
                    setCategoryId(c.id)
                    resetPage()
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="ser">系列</label>
            <select
              id="ser"
              value={seriesId ?? ''}
              onChange={(e) => {
                setSeriesId(e.target.value ? Number(e.target.value) : null)
                resetPage()
              }}
            >
              <option value="">全部系列</option>
              {(series.data || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="product-grid">
          {(list.data?.items || []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {!list.loading && (list.data?.items || []).length === 0 && (
            <div className="empty">未找到匹配的产品，试试其他筛选条件。</div>
          )}
        </div>

        <div className="pager">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === page ? 'active' : ''}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
