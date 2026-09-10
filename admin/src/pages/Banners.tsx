/**
 * 轮播图管理：列表 + 新增/编辑（含图片上传、链接、时间窗、状态）+ 删除。
 */
import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Radio, Space, Tag, Image, Popconfirm, message as antdMessage, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { bannerApi } from '../api'
import type { Banner } from '../api/types'
import ImageUpload from '../components/ImageUpload'

export default function Banners() {
  const [data, setData] = useState<Banner[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form] = Form.useForm()

  const fetchList = async () => { const r = await bannerApi.list(); setData(r.items) }
  useEffect(() => { void fetchList() }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1, sort: 0 }); setOpen(true) }
  const openEdit = (row: Banner) => { setEditing(row); form.resetFields(); form.setFieldsValue(row); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await bannerApi.update(editing.id, v)
      else await bannerApi.create(v)
      antdMessage.success('已保存'); setOpen(false); void fetchList()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await bannerApi.remove(id); antdMessage.success('已删除'); void fetchList() }

  return (
    <Card title="轮播图管理">
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增轮播图
      </Button>
      <Table
        rowKey="id"
        dataSource={data}
        pagination={false}
        columns={[
          { title: '图片', dataIndex: 'image_url', width: 120, render: (v: string) => <Image src={v} width={100} height={56} style={{ objectFit: 'cover' }} /> },
          { title: '标题', dataIndex: 'title', render: (v?: string) => v || '—' },
          { title: '链接', dataIndex: 'link_url', render: (v?: string) => v || '—' },
          { title: '排序', dataIndex: 'sort', width: 70 },
          { title: '状态', dataIndex: 'status', width: 80, render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: Banner) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除？" onConfirm={() => onDelete(row.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing ? `编辑轮播图 #${editing.id}` : '新增轮播图'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} width={640} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题"><Input placeholder="轮播文案标题（可选）" /></Form.Item>
          <Form.Item name="image_url" label="轮播图片" rules={[{ required: true, message: '请上传或填写图片地址' }]}>
            <ImageUpload />
          </Form.Item>
          <Form.Item name="link_url" label="跳转链接" rules={[{ pattern: /^(https?:\/\/.+|\/.*)$/, message: '需为 http(s):// 或站内路径 / 开头' }]}>
            <Input placeholder="产品页填 /product/3，外链填 https://...（可选）" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="start_time" label="生效起（ISO，可选）" style={{ flex: 1 }}><Input placeholder="2026-01-01T00:00:00" /></Form.Item>
            <Form.Item name="end_time" label="生效止（ISO，可选）" style={{ flex: 1 }}><Input placeholder="2026-12-31T23:59:59" /></Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="sort" label="排序" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Radio.Group><Radio value={1}>启用</Radio><Radio value={0}>停用</Radio></Radio.Group>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}
