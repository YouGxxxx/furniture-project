import { useState } from 'react'
import { getProducts, postMessage, type Product } from '../api'
import { useAsync } from '../hooks'
import { useToast } from '../components/Toast'
import { MailIcon, MapIcon, PhoneIcon } from '../components/icons'

export default function Contact() {
  const toast = useToast()
  const products = useAsync<{ items: Product[]; total: number }>(
    () => getProducts({ page: 1, page_size: 50 }),
    [],
  )

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'message' as 'message' | 'inquiry',
    product_id: '' as string,
    content: '',
    privacy: false,
  })
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.privacy) {
      toast.show('请先勾选同意隐私政策')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      toast.show('请输入有效的手机号')
      return
    }
    setSubmitting(true)
    try {
      await postMessage({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        type: form.type,
        product_id: form.product_id ? Number(form.product_id) : undefined,
        content: form.content,
        privacy_agreed: true,
      })
      toast.show('提交成功！我们将尽快与您联系。')
      setForm({ name: '', phone: '', email: '', type: 'message', product_id: '', content: '', privacy: false })
    } catch (err) {
      toast.show(err instanceof Error ? err.message : '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="wrap">
        <div className="sec-head">
          <div className="eyebrow">CONTACT</div>
          <h2>联系我们</h2>
          <p>留下您的留言或询价需求，我们将及时与您联系。</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <div className="row">
              <MapIcon />
              <div>
                <div className="k">公司地址</div>
                <div className="v">广东省佛山市禅城区家居大道 88 号</div>
              </div>
            </div>
            <div className="row">
              <PhoneIcon />
              <div>
                <div className="k">联系电话</div>
                <div className="v">400-888-0000</div>
              </div>
            </div>
            <div className="row">
              <MailIcon />
              <div>
                <div className="k">电子邮箱</div>
                <div className="v">service@hemuhome.com</div>
              </div>
            </div>
            <div className="row">
              <MapIcon />
              <div>
                <div className="k">社交账号</div>
                <div className="v">微信 / 微博：栖木家具</div>
              </div>
            </div>
            <div className="map-box">
              <MapIcon width={40} height={40} />
              地图嵌入位（来自站点配置）
            </div>
          </div>

          <div className="form-card">
            <h3>留言 / 询价</h3>
            <div className="hint">提交即视为同意我们按《隐私政策》收集并处理您的信息（姓名、电话为必填，邮箱选填）。</div>
            <form onSubmit={onSubmit}>
              <div className="form-row two">
                <div className="form-row">
                  <label>
                    姓名 <span className="req">*</span>
                  </label>
                  <input
                    required
                    placeholder="您的称呼"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>
                    电话 <span className="req">*</span>
                  </label>
                  <input
                    required
                    placeholder="联系电话"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <label>邮箱（选填）</label>
                <input
                  type="email"
                  placeholder="可选"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
              <div className="form-row two">
                <div className="form-row">
                  <label>类型</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value as 'message' | 'inquiry')}>
                    <option value="message">留言</option>
                    <option value="inquiry">询价</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>关联产品（选填）</label>
                  <select value={form.product_id} onChange={(e) => set('product_id', e.target.value)}>
                    <option value="">不关联</option>
                    {(products.data?.items || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label>
                  内容 <span className="req">*</span>
                </label>
                <textarea
                  required
                  placeholder="请描述您的需求…"
                  value={form.content}
                  onChange={(e) => set('content', e.target.value)}
                />
              </div>
              <label className="privacy">
                <input
                  type="checkbox"
                  checked={form.privacy}
                  onChange={(e) => set('privacy', e.target.checked)}
                />
                <span>我已阅读并同意《隐私政策》，知悉个人信息将按最小必要原则处理。</span>
              </label>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                {submitting ? '提交中…' : '提交留言 / 询价'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
