/**
 * 企业资料 + 站点配置管理（about:manage）。
 * 企业资料：history/brand/contact/about 四个页面，各含标题/正文/图集（图集每行一个 URL）。
 * 站点配置：company_name/phone/email/address/social/beian；
 *   后端约定 value 统一 json.dumps 存储、json.loads 读取，
 *   故对象型(social)在表单中以 JSON 文本编辑，标量型直接编辑文本。
 */
import { useEffect, useState } from 'react'
import { Tabs, Card, Form, Input, Button, message as antdMessage, Spin } from 'antd'
import { aboutApi } from '../api'

const ABOUT_KEYS = [
  { key: 'about', label: '关于栖木' },
  { key: 'brand', label: '品牌介绍' },
  { key: 'history', label: '发展历程' },
  { key: 'contact', label: '联系我们' },
]

interface AboutItem {
  title?: string
  content?: string
  images?: string
}

interface AboutForm {
  title?: string
  content?: string
  images?: string
}

function AboutPages() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [formAbout] = Form.useForm<AboutForm>()
  const [formBrand] = Form.useForm<AboutForm>()
  const [formHistory] = Form.useForm<AboutForm>()
  const [formContact] = Form.useForm<AboutForm>()
  const forms: Record<string, ReturnType<typeof Form.useForm<AboutForm>>[0]> = {
    about: formAbout,
    brand: formBrand,
    history: formHistory,
    contact: formContact,
  }

  useEffect(() => {
    void (async () => {
      const result: Record<string, AboutItem> = {}
      for (const { key } of ABOUT_KEYS) {
        try {
          result[key] = await aboutApi.get(key)
        } catch {
          result[key] = {}
        }
      }
      // 回填各表单
      ABOUT_KEYS.forEach(({ key }) => {
        const it = result[key] || {}
        forms[key].setFieldsValue({
          title: it.title ?? '',
          content: it.content ?? '',
          images: it.images ? (JSON.parse(it.images) as string[]).join('\n') : '',
        })
      })
      setLoading(false)
    })()
  }, [])

  const onSave = async (key: string) => {
    const v = await forms[key].validateFields()
    const payload: Record<string, unknown> = { title: v.title, content: v.content }
    if (v.images) {
      payload.images = JSON.stringify(String(v.images).split('\n').map((s: string) => s.trim()).filter(Boolean))
    }
    setSaving(key)
    try {
      await aboutApi.update(key, payload)
      antdMessage.success(`「${key}」已保存`)
    } catch (e) {
      antdMessage.error((e as { message?: string }).message || '保存失败')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>

  return (
    <Tabs
      items={ABOUT_KEYS.map(({ key, label }) => ({
        key,
        label,
        children: (
          <Form form={forms[key]} layout="vertical">
            <Form.Item name="title" label="标题"><Input placeholder="页面标题" /></Form.Item>
            <Form.Item name="content" label="正文"><Input.TextArea rows={10} placeholder="支持 HTML 片段（系统会过滤危险标签）" /></Form.Item>
            <Form.Item name="images" label="图集（每行一个图片 URL）"><Input.TextArea rows={3} placeholder="https://.../a.jpg" /></Form.Item>
            <Button type="primary" loading={saving === key} onClick={() => onSave(key)}>保存</Button>
          </Form>
        ),
      }))}
    />
  )
}

function SiteSettings() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const data = await aboutApi.siteSettings()
        const editable: Record<string, string> = {}
        for (const [k, val] of Object.entries(data)) {
          if (val !== null && typeof val === 'object') editable[k] = JSON.stringify(val, null, 2)
          else editable[k] = String(val ?? '')
        }
        form.setFieldsValue(editable)
      } finally {
        setLoading(false)
      }
    })()
  }, [form])

  const onSave = async () => {
    const v = await form.validateFields()
    // social 需为合法 JSON
    if (v.social) {
      try {
        JSON.parse(v.social)
      } catch {
        antdMessage.error('social 字段必须是合法 JSON')
        return
      }
    }
    setSaving(true)
    try {
      await aboutApi.updateSiteSettings(v as Record<string, string>)
      antdMessage.success('站点配置已保存')
    } catch (e) {
      antdMessage.error((e as { message?: string }).message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>

  return (
    <Form form={form} layout="vertical">
      <Form.Item name="company_name" label="公司名称"><Input /></Form.Item>
      <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
      <Form.Item name="email" label="邮箱"><Input /></Form.Item>
      <Form.Item name="address" label="地址"><Input /></Form.Item>
      <Form.Item name="beian" label="备案号"><Input /></Form.Item>
      <Form.Item name="social" label="社交媒体（JSON：{weibo, wechat, douyin}）">
        <Input.TextArea rows={4} placeholder='{"weibo":"","wechat":"","douyin":""}' />
      </Form.Item>
      <Button type="primary" loading={saving} onClick={onSave}>保存配置</Button>
    </Form>
  )
}

export default function About() {
  return (
    <Card title="企业资料与站点配置">
      <Tabs
        items={[
          { key: 'pages', label: '企业资料', children: <AboutPages /> },
          { key: 'settings', label: '站点配置', children: <SiteSettings /> },
        ]}
      />
    </Card>
  )
}
