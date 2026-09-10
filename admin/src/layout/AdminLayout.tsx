/**
 * 后台主框架：左侧可折叠菜单（按权限过滤）+ 顶部用户信息/登出 + 内容区（Outlet）。
 */
import { type ReactNode, useMemo, useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Spin, Typography } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  TeamOutlined,
  MessageOutlined,
  UserOutlined,
  SafetyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

const { Sider, Header, Content } = Layout
const { Text } = Typography

interface MenuDef {
  key: string
  label: string
  icon: ReactNode
  perm?: string
  children?: MenuDef[]
}

/** 全部菜单定义；perm 缺失表示登录即可见（此处均带权限）。 */
const MENU_DEFS: MenuDef[] = [
  { key: '/', label: '仪表盘', icon: <DashboardOutlined />, perm: 'dashboard:view' },
  {
    key: 'content',
    label: '内容管理',
    icon: <AppstoreOutlined />,
    children: [
      { key: '/products', label: '产品管理', icon: <AppstoreOutlined />, perm: 'product:view' },
      { key: '/news', label: '新闻管理', icon: <FileTextOutlined />, perm: 'news:view' },
      { key: '/banners', label: '轮播图', icon: <PictureOutlined />, perm: 'banner:manage' },
      { key: '/about', label: '企业资料', icon: <InfoCircleOutlined />, perm: 'about:manage' },
      { key: '/cases', label: '案例管理', icon: <ProjectOutlined />, perm: 'case:manage' },
      { key: '/recruits', label: '招聘管理', icon: <TeamOutlined />, perm: 'recruit:manage' },
    ],
  },
  { key: '/messages', label: '留言/询价', icon: <MessageOutlined />, perm: 'message:view' },
  {
    key: 'system',
    label: '系统管理',
    icon: <SafetyOutlined />,
    children: [
      { key: '/system/users', label: '用户管理', icon: <UserOutlined />, perm: 'rbac:user:manage' },
      { key: '/system/roles', label: '角色与权限', icon: <SafetyOutlined />, perm: 'rbac:role:manage' },
    ],
  },
]

/** 递归过滤出当前用户有权访问的菜单，并展开包含当前路径的分组。 */
function filterMenu(defs: MenuDef[], hasPerm: (p: string) => boolean): MenuDef[] {
  return defs
    .filter((d) => !d.perm || hasPerm(d.perm))
    .map((d) => (d.children ? { ...d, children: filterMenu(d.children, hasPerm) } : d))
    .filter((d) => !d.children || d.children.length > 0)
}

function toAntItems(defs: MenuDef[]): { key: string; icon: ReactNode; label: string; children?: { key: string; icon: ReactNode; label: string }[] }[] {
  return defs.map((d) => ({
    key: d.key,
    icon: d.icon,
    label: d.label,
    children: d.children ? toAntItems(d.children) : undefined,
  }))
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const hasPerm = useAuth((s) => s.hasPerm)
  const logout = useAuth((s) => s.logout)

  const visible = useMemo(() => filterMenu(MENU_DEFS, hasPerm), [hasPerm])
  const items = useMemo(() => toAntItems(visible), [visible])

  // 计算默认展开的分组（根据当前路径）
  const openKeys = useMemo(() => {
    const groups = visible.filter((d) => d.children)
    return groups.filter((g) => g.children!.some((c) => c.key === location.pathname)).map((g) => g.key)
  }, [visible, location.pathname])

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const menu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') void onLogout()
    },
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} trigger={null} theme="dark">
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 16,
            letterSpacing: 1,
          }}
        >
          {collapsed ? '栖木' : '栖木家具 · 后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={openKeys}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <span style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <Dropdown menu={menu} placement="bottomRight">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>
                <Text strong>{user.real_name || user.username}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {user.role?.name}
                </Text>
              </span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 'calc(100vh - 112px)' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
