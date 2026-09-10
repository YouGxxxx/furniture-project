/**
 * 后台登录页：账号/密码 -> POST /auth/login，成功后跳转首页（或来源页）。
 */
import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message as antdMessage } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const user = await login(values.username, values.password)
      antdMessage.success(`欢迎回来，${user.real_name || user.username}`)
      navigate(from, { replace: true })
    } catch (e) {
      const err = e as { message?: string }
      antdMessage.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#7c5a3a 0%,#a87b4f 100%)',
      }}
    >
      <Card style={{ width: 360, boxShadow: '0 8px 30px rgba(0,0,0,.15)' }} bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            栖木家具 · 后台
          </Title>
          <Text type="secondary">企业内容管理控制台</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入登录账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="登录账号" size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
