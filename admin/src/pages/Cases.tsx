/**
 * 案例管理：列表 + 新增/编辑（标题/封面/摘要/正文/排序/状态）+ 删除。
 */
import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Radio, Space, Tag, Image, Popconfirm, message as antdMessage, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { caseApi } from '../api'
import type { Case } from '../api/types'
import ImageUpload from '../components/ImageUpload'

export default function Cases() {
  const [data, setData] = useState<Case[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Case | null>(null)
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try { const res = await caseApi.list({ page, page_size: pageSize }); setData(res.items); setTotal(res.total) } finally { setLoading(false) }
  }
  useEffect(() => { void fetchList() }, [page, pageSize])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1, sort: 0 }); setOpen(true) }
  const openEdit = (row: Case) => { setEditing(row); form.resetFields(); form.setFieldsValue(row); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await caseApi.update(editing.id, v)
      else await caseApi.create(v)
      antdMessage.success('已保存'); setOpen(false); void fetchList()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await caseApi.remove(id); antdMessage.success('已删除'); void fetchList() }

  return (
    <Card title="案例管理">
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增案例
      </Button>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: '封面', dataIndex: 'cover_image', width: 96, render: (v?: string) => (v ? <Image src={v} width={80} height={56} style={{ objectFit: 'cover' }} /> : <span style={{ color: '#bbb' }}>无</span>) },
          { title: '标题', dataIndex: 'title' },
          { title: '摘要', dataIndex: 'summary', ellipsis: true, render: (v?: string) => v || '—' },
          { title: '排序', dataIndex: 'sort', width: 70 },
          { title: '状态', dataIndex: 'status', width: 80, render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '上线' : '下线'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: Case) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除？" onConfirm={() => onDelete(row.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }}
      />
      <Modal title={editing ? `编辑案例 #${editing.id}` : '新增案例'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} width={640} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input /></Form.Item>
          <Form.Item name="cover_image" label="封面图"><ImageUpload /></Form.Item>
          <Form.Item name="summary" label="摘要"><Input.TextArea rows={2} placeholder="列表卡片展示的摘要（可选）" /></Form.Item>
          <Form.Item name="content" label="正文"><Input.TextArea rows={6} placeholder="案例详情（可选）" /></Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="sort" label="排序" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Radio.Group><Radio value={1}>上线</Radio><Radio value={0}>下线</Radio></Radio.Group>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}
