import { LeafIcon, StarIcon, CheckIcon } from '../components/icons'

const CARDS = [
  { icon: StarIcon, title: '东方美学', desc: '以新中式设计语言，转译传统木作的礼序与留白。' },
  { icon: CheckIcon, title: '匠心工艺', desc: '榫卯结构与现代智造结合，兼顾稳固与温润触感。' },
  { icon: LeafIcon, title: '绿色责任', desc: '环保植物漆、可追溯木材，让家更安心。' },
]

export default function Brand() {
  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">OUR BRAND</div>
          <h2>品牌介绍</h2>
          <p>东方生活美学的当代木作表达。</p>
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto', color: 'var(--text-2)', fontSize: 16 }}>
          <p style={{ marginBottom: 16 }}>
            栖木家具相信，家具不仅是器物，更是生活方式的容器。我们以东方木作工艺为根，融合当代设计语言，让每一件产品都承载温润的手感与安静的气质。
          </p>
          <p>从选材到成型，我们坚持绿色制造与可追溯供应链，让"美"与"责任"并行。</p>
        </div>
        <div className="brand-grid">
          {CARDS.map((c) => {
            const Icon = c.icon
            return (
              <div className="brand-card" key={c.title}>
                <div className="ic">
                  <Icon />
                </div>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
