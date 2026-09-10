import { api } from './client'

/** 后端统一分页结构 */
export interface Paged<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface Product {
  id: number
  name: string
  code?: string
  series_id?: number
  series_name?: string
  category_id?: number
  category_name?: string
  material?: string
  size?: string
  style?: string
  applicable_space?: string
  description?: string
  cover_image?: string
  gallery?: string
  sort: number
  status: number
}

export interface NewsItem {
  id: number
  title: string
  category_id?: number
  category_name?: string
  cover_image?: string
  summary?: string
  content?: string
  author?: string
  status: number
  published_at?: string
  views: number
}

export interface Banner {
  id: number
  title?: string
  image_url: string
  link_url?: string
  sort: number
  status: number
  start_time?: string
  end_time?: string
}

export interface About {
  key: string
  title: string
  content: string
  images?: string
}

export type SiteSettings = Record<string, unknown>

export interface CaseItem {
  id: number
  title: string
  cover_image?: string
  summary?: string
  content?: string
  sort: number
  status: number
}

export interface Recruit {
  id: number
  category: string
  title: string
  content?: string
  contact?: string
  sort: number
  status: number
}

export interface NameId {
  id: number
  name: string
}

export interface MessagePayload {
  name: string
  phone: string
  email?: string
  type: 'message' | 'inquiry'
  product_id?: number
  content: string
  privacy_agreed: boolean
}

/** 轮播图（启用 + 时间窗） */
export async function getBanners(): Promise<Banner[]> {
  const data = (await api.get('/banners')) as { items: Banner[]; total: number }
  return data.items
}

/** 产品列表（公开，仅上线） */
export async function getProducts(params: {
  series_id?: number
  category_id?: number
  keyword?: string
  page?: number
  page_size?: number
}): Promise<Paged<Product>> {
  return (await api.get('/products', { params })) as Paged<Product>
}

export async function getProduct(id: number): Promise<Product> {
  return (await api.get(`/products/${id}`)) as Product
}

export async function getCategories(): Promise<NameId[]> {
  const data = (await api.get('/product-categories')) as { items: NameId[]; total: number }
  return data.items
}

export async function getSeries(): Promise<NameId[]> {
  const data = (await api.get('/product-series')) as { items: NameId[]; total: number }
  return data.items
}

/** 新闻列表（公开，仅发布） */
export async function getNews(params: {
  category_id?: number
  keyword?: string
  page?: number
  page_size?: number
}): Promise<Paged<NewsItem>> {
  return (await api.get('/news', { params })) as Paged<NewsItem>
}

export async function getNewsDetail(id: number): Promise<NewsItem> {
  return (await api.get(`/news/${id}`)) as NewsItem
}

export async function getAbout(key: string): Promise<About> {
  return (await api.get(`/about/${key}`)) as About
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return (await api.get('/site-settings')) as SiteSettings
}

export async function getCases(params: {
  page?: number
  page_size?: number
}): Promise<Paged<CaseItem>> {
  return (await api.get('/cases', { params })) as Paged<CaseItem>
}

export async function getCase(id: number): Promise<CaseItem> {
  return (await api.get(`/cases/${id}`)) as CaseItem
}

export async function getRecruits(params: {
  category?: string
  page?: number
  page_size?: number
}): Promise<Paged<Recruit>> {
  return (await api.get('/recruits', { params })) as Paged<Recruit>
}

/** 前台公开提交留言 / 询价 */
export async function postMessage(payload: MessagePayload): Promise<{ id: number }> {
  return (await api.post('/messages', payload)) as { id: number }
}
