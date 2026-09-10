/**
 * 产品管理：三个标签页 —— 产品 / 分类(适用空间) / 系列。
 * 产品：分页表格 + 新增/编辑(含封面/画廊上传) + 批量上下线 + 删除。
 */
import { useEffect, useMemo, useState } from 'react'
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
import { productApi } from '../api'
import type { Product, ProductCategory, ProductSeries } from '../api/types'
import ImageUpload from '../components/ImageUpload'

// ---------------- 产品标签页 ----------------
function ProductTab() {
  const [data, setData] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [series, setSeries] = useState<ProductSeries[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await productApi.list({ page, page_size: pageSize })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchList()
  }, [page, pageSize])

  useEffect(() => {
    void productApi.series().then((r) => setSeries(r.items))
    void productApi.categories().then((r) => setCategories(r.items))
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 1, sort: 0 })
    setOpen(true)
  }
  const openEdit = (row: Product) => {
    setEditing(row)
    form.resetFields()
    form.setFieldsValue({
      ...row,
      gallery: row.gallery ? (JSON.parse(row.gallery) as string[]).join('\n') : '',
    })
    setOpen(true)
  }

  const onSubmit = async () => {
    const v = await form.validateFields()
    const payload: Record<string, unknown> = { ...v }
    if (v.gallery) {
      payload.gallery = JSON.stringify(String(v.gallery).split('\n').map((s: string) => s.trim()).filter(Boolean))
    }
    try {
      if (editing) {
        await productApi.update(editing.id, payload)
        antdMessage.success('已更新')
      } else {
        await productApi.create(payload)
        antdMessage.success('已创建')
      }
      setOpen(false)
      void fetchList()
    } catch (e) {
      antdMessage.error((e as { message?: string }).message || '操作失败')
    }
  }

  const onDelete = async (id: number) => {
    try {
      await productApi.remove(id)
      antdMessage.success('已删除')
      void fetchList()
    } catch (e) {
      antdMessage.error((e as { message?: string }).message || '删除失败')
    }
  }

  const batchStatus = async (status: number) => {
    if (selected.length === 0) {
      antdMessage.warning('请先勾选产品')
      return
    }
    try {
      await productApi.batchStatus(selected, status)
      antdMessage.success('批量操作成功')
      setSelected([])
      void fetchList()
    } catch (e) {
      antdMessage.error((e as { message?: string }).message || '操作失败')
    }
  }

  const columns = [
    {
      title: '封面',
      dataIndex: 'cover_image',
      width: 80,
      render: (v?: string) => (v ? <Image src={v} width={56} height={56} style={{ objectFit: 'cover' }} /> : <span style={{ color: '#bbb' }}>无</span>),
    },
    { title: '名称', dataIndex: 'name' },
    { title: '系列', dataIndex: 'series_name', render: (v?: string) => v || '—' },
    { title: '适用空间', dataIndex: 'category_name', render: (v?: string) => v || '—' },
    { title: '货号', dataIndex: 'code', render: (v?: string) => v || '—' },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '上线' : '下线'}</Tag>,
    },
    {
      title: '操作',
      width: 140,
      render: (_: unknown, row: Product) => (
        <Space>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          </Tooltip>
          <Popconfirm title="确认删除该商品？" onConfirm={() => onDelete(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增产品
        </Button>
        <Button onClick={() => batchStatus(1)}>批量上线</Button>
        <Button onClick={() => batchStatus(0)}>批量下线</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as number[]) }}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }}
      />
      <Modal
        title={editing ? `编辑产品 #${editing.id}` : '新增产品'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="产品名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：胡桃木双人床" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="series_id" label="所属系列" rules={[{ required: true, message: '请选择系列' }]} style={{ flex: 1 }}>
              <Select
                placeholder="选择系列"
                options={series.map((s) => ({ value: s.id, label: s.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item name="category_id" label="适用空间" rules={[{ required: true, message: '请选择空间' }]} style={{ flex: 1 }}>
              <Select
                placeholder="选择适用空间"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="code" label="货号" style={{ flex: 1 }}>
              <Input placeholder="如 HM-001（可选）" />
            </Form.Item>
            <Form.Item name="material" label="材质" style={{ flex: 1 }}>
              <Input placeholder="如 黑胡桃木" />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="size" label="尺寸" style={{ flex: 1 }}>
              <Input placeholder="如 2000×1800mm" />
            </Form.Item>
            <Form.Item name="style" label="风格" style={{ flex: 1 }}>
              <Input placeholder="如 新中式" />
            </Form.Item>
          </Space>
          <Form.Item name="cover_image" label="封面图">
            <ImageUpload />
          </Form.Item>
          <Form.Item name="gallery" label="画廊图（每行一个图片 URL）">
            <Input.TextArea rows={3} placeholder="https://.../a.jpg&#10;https://.../b.jpg" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="sort" label="排序" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Radio.Group>
                <Radio value={1}>上线</Radio>
                <Radio value={0}>下线</Radio>
              </Radio.Group>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

// ---------------- 分类标签页 ----------------
function CategoryTab() {
  const [data, setData] = useState<ProductCategory[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | null>(null)
  const [form] = Form.useForm()

  const fetchList = async () => {
    const r = await productApi.categories()
    setData(r.items)
  }
  useEffect(() => { void fetchList() }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1, sort: 0 }); setOpen(true) }
  const openEdit = (row: ProductCategory) => { setEditing(row); form.resetFields(); form.setFieldsValue(row); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await productApi.updateCategory(editing.id, v)
      else await productApi.createCategory(v)
      antdMessage.success('已保存')
      setOpen(false); void fetchList()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await productApi.deleteCategory(id); antdMessage.success('已删除'); void fetchList() }

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增适用空间
      </Button>
      <Table
        rowKey="id"
        dataSource={data}
        pagination={false}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '排序', dataIndex: 'sort', width: 80 },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: ProductCategory) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除？" onConfirm={() => onDelete(row.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing ? '编辑适用空间' : '新增适用空间'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：卧室" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="sort" label="排序" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Radio.Group><Radio value={1}>启用</Radio><Radio value={0}>停用</Radio></Radio.Group>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

// ---------------- 系列标签页 ----------------
function SeriesTab() {
  const [data, setData] = useState<ProductSeries[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProductSeries | null>(null)
  const [form] = Form.useForm()

  const fetchList = async () => { const r = await productApi.series(); setData(r.items) }
  useEffect(() => { void fetchList() }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1, sort: 0 }); setOpen(true) }
  const openEdit = (row: ProductSeries) => { setEditing(row); form.resetFields(); form.setFieldsValue(row); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await productApi.updateSeries(editing.id, v)
      else await productApi.createSeries(v)
      antdMessage.success('已保存'); setOpen(false); void fetchList()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await productApi.deleteSeries(id); antdMessage.success('已删除'); void fetchList() }

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增系列
      </Button>
      <Table
        rowKey="id"
        dataSource={data}
        pagination={false}
        columns={[
          { title: '系列名称', dataIndex: 'name' },
          { title: '排序', dataIndex: 'sort', width: 80 },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: number) => <Tag color={s === 1 ? 'green' : 'default'}>{s === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: ProductSeries) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除？" onConfirm={() => onDelete(row.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing ? '编辑系列' : '新增系列'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="系列名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：栖居系列" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="sort" label="排序" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Radio.Group><Radio value={1}>启用</Radio><Radio value={0}>停用</Radio></Radio.Group>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default function Products() {
  const items = useMemo(
    () => [
      { key: 'products', label: '产品', children: <ProductTab /> },
      { key: 'categories', label: '适用空间', children: <CategoryTab /> },
      { key: 'series', label: '系列', children: <SeriesTab /> },
    ],
    [],
  )
  return (
    <div>
      <Card title="产品管理" styles={{ body: { paddingTop: 16 } }}>
        <Tabs items={items} />
      </Card>
    </div>
  )
}
