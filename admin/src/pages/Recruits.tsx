/**
 * 招聘管理：列表（可按社招/校招筛选）+ 新增/编辑 + 删除。
 */
import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Radio, Select, Space, Tag, Popconfirm, message as antdMessage, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { recruitApi } from '../api'
import type { Recruit } from '../api/types'

export default function Recruits() {
  const [data, setData] = useState<Recruit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Recruit | null>(null)
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try { const res = await recruitApi.list({ page, page_size: pageSize, category: filter }); setData(res.items); setTotal(res.total) } finally { setLoading(false) }
  }
  useEffect(() => { void fetchList() }, [page, pageSize, filter])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1, sort: 0, category: 'social' }); setOpen(true) }
  const openEdit = (row: Recruit) => { setEditing(row); form.resetFields(); form.setFieldsValue(row); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await recruitApi.update(editing.id, v)
      else await recruitApi.create(v)
      antdMessage.success('已保存'); setOpen(false); void fetchList()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await recruitApi.remove(id); antdMessage.success('已删除'); void fetchList() }

  return (
    <Card
      title="招聘管理"
      extra={
        <Select
          placeholder="全部"
          allowClear
          style={{ width: 140 }}
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1) }}
          options={[
            { value: 'social', label: '社会招聘' },
            { value: 'campus', label: '校园招聘' },
          ]}
        />
      }
    >
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增职位
      </Button>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: '类别', dataIndex: 'category', width: 100, render: (v: string) => <Tag color={v === 'campus' ? 'purple' : 'blue'}>{v === 'campus' ? '校招' : '社招'}</Tag> },
          { title: '职位', dataIndex: 'title' },
          { title: '联系方式', dataIndex: 'contact', ellipsis: true, render: (v?: string) => v || '—' },
          { title: '排序', dataIndex: 'sort', width: 70 },
          { title: '状态', dataIndex: 'status', width: 80, render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '上线' : '下线'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: Recruit) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除？" onConfirm={() => onDelete(row.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }}
      />
      <Modal title={editing ? `编辑职位 #${editing.id}` : '新增职位'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} width={640} destroyOnClose>
        <Form form={form} layout="vertical">
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="category" label="招聘类别" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Radio.Group>
                <Radio value="social">社会招聘</Radio>
                <Radio value="campus">校园招聘</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="contact" label="联系方式" style={{ flex: 1 }}><Input placeholder="邮箱/电话（可选）" /></Form.Item>
          </Space>
          <Form.Item name="title" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}><Input /></Form.Item>
          <Form.Item name="content" label="职位描述"><Input.TextArea rows={6} placeholder="职责、要求等（可选）" /></Form.Item>
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
