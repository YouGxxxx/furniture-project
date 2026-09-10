/**
 * 新闻管理：两个标签页 —— 新闻 / 分类。
 * 新闻：分页表格 + 新增/编辑(含封面/摘要/正文) + 删除；支持发布/草稿状态。
 */
import { useEffect, useState } from 'react'
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Space,
  Tag,
  Image,
  Popconfirm,
  message as antdMessage,
  Card,
  Tooltip,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { newsApi } from '../api'
import type { News, NewsCategory } from '../api/types'
import ImageUpload from '../components/ImageUpload'

function NewsTab() {
  const [data, setData] = useState<News[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<News | null>(null)
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await newsApi.list({ page, page_size: pageSize })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void fetchList() }, [page, pageSize])
  useEffect(() => { void newsApi.categories().then((r) => setCategories(r.items)) }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1 }); setOpen(true) }
  const openEdit = (row: News) => { setEditing(row); form.resetFields(); form.setFieldsValue(row); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await newsApi.update(editing.id, v)
      else await newsApi.create(v)
      antdMessage.success('已保存'); setOpen(false); void fetchList()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await newsApi.remove(id); antdMessage.success('已删除'); void fetchList() }

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增新闻
      </Button>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: '封面', dataIndex: 'cover_image', width: 80, render: (v?: string) => (v ? <Image src={v} width={56} height={56} style={{ objectFit: 'cover' }} /> : <span style={{ color: '#bbb' }}>无</span>) },
          { title: '标题', dataIndex: 'title' },
          { title: '分类', dataIndex: 'category_name', render: (v?: string) => v || '—' },
          { title: '作者', dataIndex: 'author', width: 100, render: (v?: string) => v || '—' },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: number) => <Tag color={s === 1 ? 'blue' : 'default'}>{s === 1 ? '已发布' : '草稿'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: News) => (
              <Space>
                <Tooltip title="编辑"><Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} /></Tooltip>
                <Popconfirm title="确认删除？" onConfirm={() => onDelete(row.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }}
      />
      <Modal title={editing ? `编辑新闻 #${editing.id}` : '新增新闻'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} width={720} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="新闻标题" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="category_id" label="分类" style={{ flex: 1 }}>
              <Select placeholder="选择分类" allowClear options={categories.map((c) => ({ value: c.id, label: c.name }))} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="author" label="作者" style={{ flex: 1 }}>
              <Input placeholder="如：栖木编辑部" />
            </Form.Item>
          </Space>
          <Form.Item name="cover_image" label="封面图"><ImageUpload /></Form.Item>
          <Form.Item name="summary" label="摘要"><Input.TextArea rows={2} placeholder="列表/分享展示的摘要（可选）" /></Form.Item>
          <Form.Item name="content" label="正文"><Input.TextArea rows={8} placeholder="支持 HTML 片段（系统会过滤危险标签）" /></Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group><Radio value={1}>发布</Radio><Radio value={0}>草稿</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function NewsCategoryTab() {
  const [data, setData] = useState<NewsCategory[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<NewsCategory | null>(null)
  const [form] = Form.useForm()

  const fetchList = async () => { const r = await newsApi.categories(); setData(r.items) }
  useEffect(() => { void fetchList() }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1, sort: 0 }); setOpen(true) }
  const openEdit = (row: NewsCategory) => { setEditing(row); form.resetFields(); form.setFieldsValue(row); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await newsApi.updateCategory(editing.id, v)
      else await newsApi.createCategory(v)
      antdMessage.success('已保存'); setOpen(false); void fetchList()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await newsApi.deleteCategory(id); antdMessage.success('已删除'); void fetchList() }

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增分类
      </Button>
      <Table
        rowKey="id"
        dataSource={data}
        pagination={false}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '类型', dataIndex: 'type', render: (v?: string) => v || '—' },
          { title: '排序', dataIndex: 'sort', width: 80 },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: NewsCategory) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除？" onConfirm={() => onDelete(row.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing ? '编辑分类' : '新增分类'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}><Input /></Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="type" label="类型" style={{ flex: 1 }}><Input placeholder="如：company/industry（可选）" /></Form.Item>
            <Form.Item name="sort" label="排序" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item name="status" label="状态">
            <Radio.Group><Radio value={1}>启用</Radio><Radio value={0}>停用</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default function News() {
  return (
    <div>
      <Card title="新闻管理" styles={{ body: { paddingTop: 16 } }}>
        <Tabs items={[{ key: 'news', label: '新闻', children: <NewsTab /> }, { key: 'cats', label: '分类', children: <NewsCategoryTab /> }]} />
      </Card>
    </div>
  )
}
