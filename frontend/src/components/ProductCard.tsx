import { Link } from 'react-router-dom'
import type { Product } from '../api'
import { gradientFor } from '../utils'
import { ArrowRight } from './icons'

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.cover_image
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div
        className="cover"
        style={cover ? { background: `center/cover no-repeat url(${cover})` } : { background: gradientFor(product.id) }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v10h14V10" />
        </svg>
      </div>
      <div className="body">
        <h4>{product.name}</h4>
        <div className="meta">
          {product.series_name && <span>{product.series_name}</span>}
          {product.applicable_space && <span>{product.applicable_space}</span>}
          {!product.series_name && !product.applicable_space && product.category_name && (
            <span>{product.category_name}</span>
          )}
        </div>
        <div className="view">
          查看详情 <ArrowRight width={14} height={14} />
        </div>
      </div>
    </Link>
  )
}
