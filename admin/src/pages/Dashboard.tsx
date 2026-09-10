/**
 * 后台仪表盘：汇总各模块数量概览 + 最近留言。无某模块权限时对应卡片显示 —。
 */
import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Spin, Typography } from 'antd'
import {
  AppstoreOutlined,
  FileTextOutlined,
  PictureOutlined,
  MessageOutlined,
  ProjectOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { bannerApi, caseApi, messageApi, newsApi, productApi, recruitApi } from '../api'
import type { Message } from '../api/types'

const { Title } = Typography

interface Stats {
  products?: number
  news?: number
  banners?: number
  messagesTodo?: number
  cases?: number
  recruits?: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({})
  const [recent, setRecent] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    void (async () => {
      const [products, news, banners, messagesTodo, cases, recruits, msgList] = await Promise.allSettled([
        productApi.list({ page_size: 1 }),
        newsApi.list({ page_size: 1 }),
        bannerApi.list(),
        messageApi.list({ status: 0, page_size: 1 }),
        caseApi.list({ page_size: 1 }),
        recruitApi.list({ page_size: 1 }),
        messageApi.list({ page_size: 5 }),
      ])
      if (!alive) return
      const num = (r: PromiseSettledResult<{ total: number }>, d = 0) => (r.status === 'fulfilled' ? r.value.total : d)
      setStats({
        products: num(products as never),
        news: num(news as never),
        banners: banners.status === 'fulfilled' ? banners.value.items.length : undefined,
        messagesTodo: num(messagesTodo as never),
        cases: num(cases as never),
        recruits: num(recruits as never),
      })
      if (msgList.status === 'fulfilled') setRecent(msgList.value.items)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  const cards = [
    { title: '产品总数', value: stats.products, icon: <AppstoreOutlined />, color: '#a87b4f', to: '/products' },
    { title: '新闻总数', value: stats.news, icon: <FileTextOutlined />, color: '#3a7c5a', to: '/news' },
    { title: '轮播图', value: stats.banners, icon: <PictureOutlined />, color: '#7c5a8a', to: '/banners' },
    { title: '待处理留言', value: stats.messagesTodo, icon: <MessageOutlined />, color: '#c0392b', to: '/messages' },
    { title: '案例数', value: stats.cases, icon: <ProjectOutlined />, color: '#2980b9', to: '/cases' },
    { title: '招聘职位', value: stats.recruits, icon: <TeamOutlined />, color: '#d68910', to: '/recruits' },
  ]

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        仪表盘
      </Title>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={16}>
            {cards.map((c) => (
              <Col xs={12} sm={8} lg={8} key={c.title} style={{ marginBottom: 16 }}>
                <Card hoverable onClick={() => navigate(c.to)}>
                  <Statistic
                    title={c.title}
                    value={c.value ?? '—'}
                    prefix={<span style={{ color: c.color }}>{c.icon}</span>}
                    valueStyle={{ color: c.color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <Card title="最近留言 / 询价">
            <Table
              rowKey="id"
              dataSource={recent}
              pagination={false}
              locale={{ emptyText: '暂无留言' }}
              columns={[
                { title: '姓名', dataIndex: 'name', width: 100 },
                {
                  title: '类型',
                  dataIndex: 'type',
                  width: 90,
                  render: (t: string) => <Tag color={t === 'inquiry' ? 'blue' : 'green'}>{t === 'inquiry' ? '询价' : '留言'}</Tag>,
                },
                { title: '内容', dataIndex: 'content', ellipsis: true },
                { title: '提交时间', dataIndex: 'created_at', width: 180, render: (v?: string) => v || '—' },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  )
}
