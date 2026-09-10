/**
 * 后台 API 函数集合。每个函数对应一个后端接口，统一经 ok() 解包信封。
 * 接口路径与 backend/app/routers/* 严格对齐（前缀 /api/v1 已在 client 配置）。
 */
import type { AxiosProgressEvent } from 'axios'
import { api, ok } from './client'
import type {
  Banner,
  Case,
  Message,
  MessageDetail,
  News,
  NewsCategory,
  Paged,
  Permission,
  Product,
  ProductCategory,
  ProductSeries,
  Recruit,
  Role,
  SiteSettings,
  TokenResult,
  User,
} from './types'

// ---------- 认证 ----------
export const authApi = {
  login: (username: string, password: string) =>
    ok<TokenResult>(api.post('/auth/login', { username, password })),
  logout: () => ok<null>(api.post('/auth/logout')),
  me: () => ok<User>(api.get('/auth/me')),
}

// ---------- 产品 ----------
export const productApi = {
  list: (params: { page?: number; page_size?: number; series_id?: number; category_id?: number; keyword?: string }) =>
    ok<Paged<Product>>(api.get('/products', { params })),
  get: (id: number) => ok<Product>(api.get(`/products/${id}`)),
  create: (body: Record<string, unknown>) => ok<{ id: number }>(api.post('/admin/products', body)),
  update: (id: number, body: Record<string, unknown>) => ok<null>(api.put(`/admin/products/${id}`, body)),
  remove: (id: number) => ok<null>(api.delete(`/admin/products/${id}`)),
  batchStatus: (ids: number[], status: number) =>
    ok<null>(api.post('/admin/products/batch-status', { ids, status })),
  categories: () => ok<{ items: ProductCategory[]; total: number }>(api.get('/product-categories')),
  createCategory: (body: Record<string, unknown>) =>
    ok<{ id: number }>(api.post('/admin/product-categories', body)),
  updateCategory: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/product-categories/${id}`, body)),
  deleteCategory: (id: number) => ok<null>(api.delete(`/admin/product-categories/${id}`)),
  series: () => ok<{ items: ProductSeries[]; total: number }>(api.get('/product-series')),
  createSeries: (body: Record<string, unknown>) =>
    ok<{ id: number }>(api.post('/admin/product-series', body)),
  updateSeries: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/product-series/${id}`, body)),
  deleteSeries: (id: number) => ok<null>(api.delete(`/admin/product-series/${id}`)),
}

// ---------- 新闻 ----------
export const newsApi = {
  list: (params: { page?: number; page_size?: number; category_id?: number; keyword?: string }) =>
    ok<Paged<News>>(api.get('/news', { params })),
  get: (id: number) => ok<News>(api.get(`/news/${id}`)),
  create: (body: Record<string, unknown>) => ok<{ id: number }>(api.post('/admin/news', body)),
  update: (id: number, body: Record<string, unknown>) => ok<null>(api.put(`/admin/news/${id}`, body)),
  remove: (id: number) => ok<null>(api.delete(`/admin/news/${id}`)),
  categories: () => ok<{ items: NewsCategory[]; total: number }>(api.get('/news-categories')),
  createCategory: (body: Record<string, unknown>) =>
    ok<{ id: number }>(api.post('/admin/news-categories', body)),
  updateCategory: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/news-categories/${id}`, body)),
  deleteCategory: (id: number) => ok<null>(api.delete(`/admin/news-categories/${id}`)),
}

// ---------- 轮播 ----------
export const bannerApi = {
  list: () => ok<{ items: Banner[]; total: number }>(api.get('/banners')),
  create: (body: Record<string, unknown>) => ok<{ id: number }>(api.post('/admin/banners', body)),
  update: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/banners/${id}`, body)),
  remove: (id: number) => ok<null>(api.delete(`/admin/banners/${id}`)),
}

// ---------- 企业资料 / 站点配置 ----------
export const aboutApi = {
  get: (key: string) => ok<{ key: string; content?: string; title?: string; images?: string }>(api.get(`/about/${key}`)),
  update: (key: string, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/about/${key}`, body)),
  siteSettings: () => ok<SiteSettings>(api.get('/site-settings')),
  updateSiteSettings: (settings: Record<string, string>) =>
    ok<null>(api.put('/admin/site-settings', { settings })),
}

// ---------- 案例 ----------
export const caseApi = {
  list: (params: { page?: number; page_size?: number }) =>
    ok<Paged<Case>>(api.get('/cases', { params })),
  create: (body: Record<string, unknown>) => ok<{ id: number }>(api.post('/admin/cases', body)),
  update: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/cases/${id}`, body)),
  remove: (id: number) => ok<null>(api.delete(`/admin/cases/${id}`)),
}

// ---------- 招聘 ----------
export const recruitApi = {
  list: (params: { page?: number; page_size?: number; category?: string }) =>
    ok<Paged<Recruit>>(api.get('/recruits', { params })),
  create: (body: Record<string, unknown>) => ok<{ id: number }>(api.post('/admin/recruits', body)),
  update: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/recruits/${id}`, body)),
  remove: (id: number) => ok<null>(api.delete(`/admin/recruits/${id}`)),
}

// ---------- 留言/询价 ----------
export const messageApi = {
  list: (params: { page?: number; page_size?: number; status?: number; type?: string }) =>
    ok<Paged<Message>>(api.get('/admin/messages', { params })),
  get: (id: number) => ok<MessageDetail>(api.get(`/admin/messages/${id}`)),
  handle: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/messages/${id}`, body)),
}

// ---------- 上传 ----------
export const uploadApi = {
  upload: (file: File, onProgress?: (p: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return ok<{ url: string }>(
      api.post('/admin/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
      }),
    )
  },
  remove: (url: string) => ok<null>(api.delete('/admin/files', { data: { url } })),
}

// ---------- 系统：用户/角色/权限 ----------
export const rbacApi = {
  users: () => ok<{ items: User[]; total: number }>(api.get('/admin/users')),
  createUser: (body: Record<string, unknown>) => ok<{ id: number }>(api.post('/admin/users', body)),
  updateUser: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/users/${id}`, body)),
  deleteUser: (id: number) => ok<null>(api.delete(`/admin/users/${id}`)),
  roles: () => ok<{ items: Role[]; total: number }>(api.get('/admin/roles')),
  createRole: (body: Record<string, unknown>) => ok<{ id: number }>(api.post('/admin/roles', body)),
  updateRole: (id: number, body: Record<string, unknown>) =>
    ok<null>(api.put(`/admin/roles/${id}`, body)),
  deleteRole: (id: number) => ok<null>(api.delete(`/admin/roles/${id}`)),
  permissions: () => ok<{ items: Permission[]; total: number }>(api.get('/admin/permissions')),
  assignRole: (id: number, body: Record<string, unknown>) =>
    ok<{ permissions: string[] }>(api.post(`/admin/roles/${id}/permissions`, body)),
}
