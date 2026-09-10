/**
 * 留言 / 询价管理：列表（按状态/类型筛选）+ 详情抽屉（解密手机号）+ 处理/回复。
 * 列表 phone 已脱敏；详情接口返回明文（仅 message:view 角色可见）。
 */
import { useEffect, useState } from 'react'
import { Table, Button, Drawer, Form, Input, Radio, Select, Tag, Space, Descriptions, message as antdMessage, Card } from 'antd'
import { messageApi } from '../api'
import type { Message, MessageDetail } from '../api/types'
import { useAuth } from '../store/auth'

export default function Messages() {
  const [data, setData] = useState<Message[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [type, setType] = useState<string | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<MessageDetail | null>(null)
  const [form] = Form.useForm()
  const user = useAuth((s) => s.user)

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await messageApi.list({ page, page_size: pageSize, status, type })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void fetchList() }, [page, pageSize, status, type])

  const openDetail = async (id: number) => {
    try {
      const d = await messageApi.get(id)
      setDetail(d)
      setOpen(true)
      form.resetFields()
      form.setFieldsValue({ status: d.status, reply: d.reply ?? '' })
    } catch (e) {
      antdMessage.error((e as { message?: string }).message || '获取详情失败')
    }
  }

  const onSubmit = async () => {
    if (!detail) return
    const v = await form.validateFields()
    try {
      await messageApi.handle(detail.id, { ...v, handler_id: user?.id })
      antdMessage.success('处理已保存')
      setOpen(false)
      void fetchList()
    } catch (e) {
      antdMessage.error((e as { message?: string }).message || '操作失败')
    }
  }

  return (
    <Card title="留言 / 询价">
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="全部状态"
          allowClear
          style={{ width: 140 }}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          options={[
            { value: 0, label: '未处理' },
            { value: 1, label: '已处理' },
          ]}
        />
        <Select
          placeholder="全部类型"
          allowClear
          style={{ width: 140 }}
          value={type}
          onChange={(v) => { setType(v); setPage(1) }}
          options={[
            { value: 'message', label: '留言' },
            { value: 'inquiry', label: '询价' },
          ]}
        />
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          { title: '姓名', dataIndex: 'name', width: 100 },
          { title: '手机', dataIndex: 'phone_masked', width: 140 },
          {
            title: '类型',
            dataIndex: 'type',
            width: 90,
            render: (t: string) => <Tag color={t === 'inquiry' ? 'blue' : 'green'}>{t === 'inquiry' ? '询价' : '留言'}</Tag>,
          },
          { title: '内容', dataIndex: 'content', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (s: number) => <Tag color={s === 1 ? 'green' : 'orange'}>{s === 1 ? '已处理' : '未处理'}</Tag>,
          },
          { title: '提交时间', dataIndex: 'created_at', width: 170, render: (v?: string) => v || '—' },
          { title: '操作', width: 90, render: (_: unknown, row: Message) => <Button size="small" onClick={() => openDetail(row.id)}>查看</Button> },
        ]}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }}
      />
      <Drawer title={detail ? `留言详情 #${detail.id}` : '详情'} open={open} width={520} onClose={() => setOpen(false)}>
        {detail && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="姓名">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detail.phone}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detail.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="类型">{detail.type === 'inquiry' ? '询价' : '留言'}</Descriptions.Item>
              <Descriptions.Item label="内容">{detail.content}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{detail.created_at || '—'}</Descriptions.Item>
            </Descriptions>
            <Form form={form} layout="vertical">
              <Form.Item name="status" label="处理状态">
                <Radio.Group>
                  <Radio value={0}>未处理</Radio>
                  <Radio value={1}>已处理</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="reply" label="回复内容"><Input.TextArea rows={5} placeholder="回复用户的内容（可选）" /></Form.Item>
              <Button type="primary" onClick={onSubmit}>保存处理</Button>
            </Form>
          </>
        )}
      </Drawer>
    </Card>
  )
}
