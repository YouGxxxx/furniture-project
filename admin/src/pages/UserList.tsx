/**
 * 用户管理（rbac:user:manage）：列表 + 新增/编辑（账号/密码/角色/状态）+ 删除。
 */
import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Radio, Space, Tag, Popconfirm, message as antdMessage, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { rbacApi } from '../api'
import type { Role, User } from '../api/types'

export default function UserList() {
  const [data, setData] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form] = Form.useForm()

  const fetchUsers = async () => { const r = await rbacApi.users(); setData(r.items) }
  const fetchRoles = async () => { const r = await rbacApi.roles(); setRoles(r.items) }
  useEffect(() => { void fetchUsers(); void fetchRoles() }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 1 }); setOpen(true) }
  const openEdit = (row: User) => {
    setEditing(row)
    form.resetFields()
    form.setFieldsValue({ real_name: row.real_name, email: row.email, role_id: row.role_id, status: row.status })
    setOpen(true)
  }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await rbacApi.updateUser(editing.id, v)
      else await rbacApi.createUser(v)
      antdMessage.success('已保存'); setOpen(false); void fetchUsers()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }
  const onDelete = async (id: number) => { await rbacApi.deleteUser(id); antdMessage.success('已删除'); void fetchUsers() }

  return (
    <Card title="用户管理">
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增用户
      </Button>
      <Table
        rowKey="id"
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          { title: '账号', dataIndex: 'username' },
          { title: '姓名', dataIndex: 'real_name', render: (v?: string) => v || '—' },
          { title: '邮箱', dataIndex: 'email', render: (v?: string) => v || '—' },
          { title: '角色', dataIndex: 'role_name', render: (v?: string) => v || '—' },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            width: 140,
            render: (_: unknown, row: User) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除该用户？" onConfirm={() => onDelete(row.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing ? `编辑用户 #${editing.id}` : '新增用户'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入账号（≥2 字符）' }, { min: 2, max: 50 }]}>
            <Input disabled={!!editing} placeholder="登录名（创建后不可改）" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing ? '重置密码（留空不修改）' : '初始密码'}
            rules={editing ? [{ min: 6, max: 128 }] : [{ required: true, message: '请输入初始密码（≥6 位）' }, { min: 6, max: 128 }]}
          >
            <Input.Password placeholder={editing ? '留空则不修改' : '≥6 位'} />
          </Form.Item>
          <Form.Item name="real_name" label="姓名"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="role_id" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="选择角色" options={roles.map((r) => ({ value: r.id, label: `${r.name}（${r.code}）` }))} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group><Radio value={1}>启用</Radio><Radio value={0}>停用</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
