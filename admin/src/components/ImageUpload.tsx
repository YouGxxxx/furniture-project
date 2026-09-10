/**
 * 图片上传控件（受控）：选择文件后直传 /admin/upload，拿到 /media/... URL 回填。
 * 用于产品封面、轮播图、案例封面等图片字段。默认仅允许常见图片格式。
 */
import { useState } from 'react'
import { Upload, Button, Image, message as antdMessage } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { uploadApi } from '../api'

interface Props {
  value?: string
  onChange?: (url: string | undefined) => void
  /** 上传中禁用状态透传给父表单 */
  disabled?: boolean
}

export default function ImageUpload({ value, onChange, disabled }: Props) {
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file: File) => {
    const isImg = file.type.startsWith('image/')
    if (!isImg) {
      antdMessage.error('仅支持上传图片文件')
      return Upload.LIST_IGNORE
    }
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      antdMessage.error('图片大小不能超过 5MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {value ? (
        <Image src={value} alt="封面预览" width={96} height={96} style={{ objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 6,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: 12,
          }}
        >
          无图片
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Upload
          showUploadList={false}
          beforeUpload={beforeUpload}
          customRequest={(options) => {
            void (async () => {
              setLoading(true)
              try {
                const res = await uploadApi.upload(options.file as File)
                onChange?.(res.url)
                options.onSuccess?.({})
                antdMessage.success('上传成功')
              } catch (e) {
                options.onError?.(e as never)
                antdMessage.error('上传失败，请重试')
              } finally {
                setLoading(false)
              }
            })()
          }}
          disabled={disabled || loading}
        >
          <Button icon={<UploadOutlined />} loading={loading} disabled={disabled}>
            选择并上传
          </Button>
        </Upload>
        {value && (
          <Button danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => onChange?.(undefined)}>
            移除
          </Button>
        )}
      </div>
    </div>
  )
}
