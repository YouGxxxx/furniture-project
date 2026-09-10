import { NavLink, useParams } from 'react-router-dom'
import { getRecruits, type Recruit } from '../api'
import { useAsync } from '../hooks'
import { CheckIcon } from '../components/icons'

const TITLES: Record<string, string> = {
  social: '社会招聘',
  campus: '校园招聘',
}

const SOCIAL_ROLES = ['全案设计师', '生产工程师', '品牌策划', '城市经理', '定制顾问']
const CAMPUS_ROLES = ['管培生（设计/运营）', '实习设计师', '电商运营实习', '内容策划实习']
const BENEFITS = [
  '有竞争力的薪酬与项目奖金',
  '系统的木作与设计培训体系',
  '清晰的双通道晋升路径',
  '详情请咨询 hr@hemuhome.com',
]

export default function Recruit() {
  const { type = 'social' } = useParams<{ type: string }>()
  const isSocial = type === 'social'
  const list = useAsync<{ items: Recruit[]; total: number }>(
    () => getRecruits({ category: type, page: 1, page_size: 50 }),
    [type],
  )
  const roles = isSocial ? SOCIAL_ROLES : CAMPUS_ROLES

  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">CAREERS</div>
          <h2>{TITLES[type] || '社会招聘'}</h2>
          <p>以下为栖木家具当前重点招聘方向，具体岗位与要求以后期官网正式发布为准。</p>
        </div>

        <div className="news-tabs">
          <NavLink to="/recruit/social" className={({ isActive }) => (isActive ? 'active' : '')}>
            社会招聘
          </NavLink>
          <NavLink to="/recruit/campus" className={({ isActive }) => (isActive ? 'active' : '')}>
            校园招聘
          </NavLink>
        </div>

        <div className="recruit-grid">
          <div className="recruit-card">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                <path d="M9 21v-6h6v6" />
              </svg>
              岗位方向
            </h3>
            <ul>
              {(list.data?.items?.length ? list.data.items.map((r) => r.title) : roles).map((x) => (
                <li key={x}>
                  <CheckIcon />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="recruit-card">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l3 2" />
              </svg>
              我们提供
            </h3>
            <ul>
              {BENEFITS.map((x) => (
                <li key={x}>
                  <CheckIcon />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 30, color: 'var(--muted)' }}>
          提示：招聘岗位与要求以后期官网正式发布为准。
        </div>
      </div>
    </section>
  )
}
