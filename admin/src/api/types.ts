/**
 * 后台使用到的后端实体类型（与 backend/app/schemas/* 对齐）。
 * 仅类型声明，不引入运行时代码，配合 verbatimModuleSyntax 用 import type 引用。
 */

/** 分页包裹：后端返回 { items, total, page, page_size } */
export interface Paged<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/** 登录态用户（含角色与权限码） */
export interface RoleMin {
  id: number
  code: string
  name: string
}

export interface User {
  id: number
  username: string
  real_name?: string | null
  email?: string | null
  role?: RoleMin | null
  role_id?: number | null
  role_name?: string | null
  status?: number | null
  permissions: string[]
}

export interface TokenResult {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

/** 产品分类（适用空间） */
export interface ProductCategory {
  id: number
  name: string
  parent_id?: number | null
  sort: number
  status: number
}

/** 产品系列 */
export interface ProductSeries {
  id: number
  name: string
  sort: number
  status: number
}

/** 产品 */
export interface Product {
  id: number
  name: string
  code?: string | null
  series_id?: number | null
  series_name?: string | null
  category_id?: number | null
  category_name?: string | null
  material?: string | null
  size?: string | null
  style?: string | null
  applicable_space?: string | null
  description?: string | null
  cover_image?: string | null
  gallery?: string | null
  sort: number
  status: number
}

/** 新闻分类 */
export interface NewsCategory {
  id: number
  name: string
  type?: string | null
  sort: number
  status: number
}

/** 新闻 */
export interface News {
  id: number
  title: string
  category_id?: number | null
  category_name?: string | null
  cover_image?: string | null
  summary?: string | null
  content?: string | null
  author?: string | null
  status: number
  published_at?: string | null
  views: number
}

/** 轮播图 */
export interface Banner {
  id: number
  title?: string | null
  image_url: string
  link_url?: string | null
  sort: number
  status: number
  start_time?: string | null
  end_time?: string | null
}

/** 企业资料页 */
export interface AboutPage {
  content?: string | null
  title?: string | null
  images?: string | null
}

/** 站点配置：key -> 值（后端已 json.loads，可能字符串/对象/数组） */
export type SiteSettings = Record<string, unknown>

/** 案例 */
export interface Case {
  id: number
  title: string
  cover_image?: string | null
  summary?: string | null
  content?: string | null
  sort: number
  status: number
}

/** 招聘 */
export interface Recruit {
  id: number
  category: string
  title: string
  content?: string | null
  contact?: string | null
  sort: number
  status: number
}

/** 留言/询价列表项：phone 已脱敏 */
export interface Message {
  id: number
  name: string
  phone_masked: string
  email?: string | null
  type: string
  product_id?: number | null
  content: string
  status: number
  reply?: string | null
  created_at?: string | null
}

/** 留言/询价详情：含解密明文手机号 */
export interface MessageDetail {
  id: number
  name: string
  phone: string
  email?: string | null
  type: string
  product_id?: number | null
  content: string
  status: number
  reply?: string | null
  handler_id?: number | null
  created_at?: string | null
  handled_at?: string | null
}

/** 角色（含权限码列表） */
export interface Role {
  id: number
  name: string
  code: string
  description?: string | null
  permissions: string[]
}

/** 权限基线 */
export interface Permission {
  id: number
  name?: string | null
  code: string
  module?: string | null
}
