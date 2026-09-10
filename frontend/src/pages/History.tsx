const ITEMS = [
  ['2008', '品牌创立', '栖木家具成立，专注实木家具研发与制造。'],
  ['2013', '智造升级', '引入数控产线，建立现代化厂区。'],
  ['2018', '全案定制', '推出全屋木作定制服务，覆盖多空间场景。'],
  ['2021', '绿色制造', '全面采用环保植物漆与可追溯木材。'],
  ['2024', '品牌焕新', '胡桃禮等七大系列发布，东方美学体系成型。'],
  ['2026', '全国布局', '启动城市合伙人计划，渠道网络加速扩张。'],
]

export default function History() {
  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">HISTORY</div>
          <h2>发展历程</h2>
          <p>以时间为轴，记录栖木家具的关键里程碑。</p>
        </div>
        <div className="timeline">
          {ITEMS.map((it) => (
            <div className="tl-item" key={it[0]}>
              <div className="year">{it[0]}</div>
              <h4>{it[1]}</h4>
              <p>{it[2]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
