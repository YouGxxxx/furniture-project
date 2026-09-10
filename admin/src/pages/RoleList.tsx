/**
 * 角色与权限管理（rbac:role:manage）：列表（含权限码）+ 新增/编辑角色 + 授权（多选权限）+ 删除。
 */
import { useEffect, useMemo, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Tag, Popconfirm, message as antdMessage, Card, Typography } from 'antd'
import { PlusOutlined, SafetyOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { rbacApi } from '../api'
import type { Permission, Role } from '../api/types'

const { Text } = Typography

export default function RoleList() {
  const [roles, setRoles] = useState<Role[]>([])
  const [perms, setPerms] = useState<Permission[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [authRole, setAuthRole] = useState<Role | null>(null)
  const [authValue, setAuthValue] = useState<string[]>([])
  const [authOpen, setAuthOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchRoles = async () => { const r = await rbacApi.roles(); setRoles(r.items) }
  const fetchPerms = async () => { const r = await rbacApi.permissions(); setPerms(r.items) }
  useEffect(() => { void fetchRoles(); void fetchPerms() }, [])

  const groupedPerms = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const p of perms) {
      const m = p.module || '其他'
      if (!map.has(m)) map.set(m, [])
      map.get(m)!.push(p)
    }
    return Array.from(map.entries()).map(([mod, list]) => {
      const options = list.map((p) => ({
        value: p.code,
        label: `${p.name ?? ''}（${p.code}）`,
      }))
      return { label: mod, title: mod, options }
    })
  }, [perms])

  const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true) }
  const openEdit = (row: Role) => { setEditing(row); form.resetFields(); form.setFieldsValue({ name: row.name, description: row.description }); setOpen(true) }
  const onSubmit = async () => {
    const v = await form.validateFields()
    try {
      if (editing) await rbacApi.updateRole(editing.id, v)
      else await rbacApi.createRole(v)
      antdMessage.success('已保存'); setOpen(false); void fetchRoles()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '操作失败') }
  }

  const openAuth = (row: Role) => { setAuthRole(row); setAuthValue(row.permissions); setAuthOpen(true) }
  const onAuthSave = async () => {
    if (!authRole) return
    try {
      await rbacApi.assignRole(authRole.id, { permissions: authValue })
      antdMessage.success('授权已更新'); setAuthOpen(false); void fetchRoles()
    } catch (e) { antdMessage.error((e as { message?: string }).message || '授权失败') }
  }

  const onDelete = async (id: number) => { await rbacApi.deleteRole(id); antdMessage.success('已删除'); void fetchRoles() }

  return (
    <Card title="角色与权限">
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openCreate}>
        新增角色
      </Button>
      <Table
        rowKey="id"
        dataSource={roles}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          { title: '角色名', dataIndex: 'name' },
          { title: '编码', dataIndex: 'code', render: (v: string) => <Tag>{v}</Tag> },
          { title: '描述', dataIndex: 'description', render: (v?: string) => v || '—' },
          {
            title: '权限',
            dataIndex: 'permissions',
            render: (list: string[]) =>
              list.length ? (
                <Space size={[4, 4]} wrap>
                  {list.slice(0, 6).map((c) => (
                    <Tag key={c} color="blue">{c}</Tag>
                  ))}
                  {list.length > 6 && <Text type="secondary">+{list.length - 6}</Text>}
                </Space>
              ) : (
                <Text type="secondary">无</Text>
              ),
          },
          {
            title: '操作',
            width: 200,
            render: (_: unknown, row: Role) => (
              <Space>
                <Button size="small" icon={<SafetyOutlined />} onClick={() => openAuth(row)}>授权</Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                <Popconfirm title="确认删除该角色？" onConfirm={() => onDelete(row.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal title={editing ? `编辑角色 #${editing.id}` : '新增角色'} open={open} onOk={onSubmit} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}><Input /></Form.Item>
          <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入编码（如 editor）' }]}>
            <Input disabled={!!editing} placeholder="唯一编码，如 content_editor" />
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`授权：${authRole?.name ?? ''}`} open={authOpen} onOk={onAuthSave} onCancel={() => setAuthOpen(false)} width={640} destroyOnClose>
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="选择权限（可按模块分组）"
          value={authValue}
          onChange={setAuthValue}
          options={groupedPerms}
          optionFilterProp="label"
        />
      </Modal>
    </Card>
  )
}
