# 栖木家具官网 · 数据库设计文档

> 版本：v1.0
> 编写日期：2026-09-08
> 文档状态：设计基线（供建表、ORM 建模、种子数据、前后端联调使用）
> 关联文档：`docs/PRD_企业家居网站.md`（v1.2）、`docs/TECH_开发技术文档.md`（v1.0）、`docs/UIUX_企业家居网站.md`（v1.1）
> 品牌说明：全文、版权、备案信息统一使用品牌名「**栖木家具**」。

| 修订记录 | 日期 | 修订人 | 说明 |
|---|---|---|---|
| v1.0 | 2026-09-08 | 技术 | 基于 PRD v1.2 + TECH v1.0 沉淀数据库设计基线，含 15 张表数据字典、关系、索引、建表 SQL、初始化数据 |

---

## 文档约定

- 表结构以 **TECH 开发技术文档 §4.2 数据字典为准**（字段含长度/默认值/加密标注），PRD §6 作为复核来源，差异已在对应表内标注。
- 全文使用「栖木家具」品牌名，与 TECH §0 一致。
- 布尔值以 `INTEGER 0/1` 存储；时间统一 **UTC** 存储（`created_at`/`updated_at`/`published_at` 等）；图片以 URL 字符串存储于对应字段。
- 软删除策略：内容类资源以 `status` 字段标记上下线/启停，**不物理删除**；仅 `role_permissions`（角色权限映射）允许物理删除（CASCADE）。详见第 4 章。

---

## 第1章 文档概述

### 1.1 文档目的与适用范围

本文档是栖木家具官网（**前台展示官网 + 后台内容管理系统**）的**数据库层单一事实来源（Single Source of Truth）**，定义：

- 全部数据表的字段结构、约束、范式依据；
- 表间外键关系与级联策略；
- 索引设计与查询优化场景；
- 可直接执行的建表 SQL（SQLite 兼容 + PostgreSQL 注意事项）；
- 初始化种子数据（角色、权限、基础分类、默认超管）。

**适用范围**：本期交付全部功能模块（产品、新闻、轮播、企业资料、留言/询价、用户角色 RBAC、案例/招聘静态内容）。原型/招聘静态页面本期已升级为「后端配置表 + 后台 CRUD」（TECH 决策②），故 `cases` / `recruit` 纳入本期库表。

**不适用**：后续迭代模块（电商交易、C 端用户体系、多语言、简历投递等）不在本文档范围内，见 PRD 第 11 章。

### 1.2 数据库选型

| 环境 | 数据库 | 说明 |
|---|---|---|
| 开发 | **SQLite 3** | 单文件（`app.db`）、零部署，契合开发期快速验证；随 Python 自带 |
| 生产（推荐） | **PostgreSQL 14+** | 满足生产并发与可靠性，经 `DATABASE_URL` 平滑切换（决策③） |

- 切换机制：`core/config.py` 读 `DATABASE_URL`，开发 `sqlite:///./app.db`，生产 `postgresql+asyncpg://user:pass@host/db`；Alembic 迁移脚本已配置就绪（本期不强制落地迁移脚本，见 TECH §11#4）。
- ORM：SQLAlchemy 2.0（类型注解式模型 + 异步会话），统一建模并支持多数据库后端。
- 类型差异（详见第 6 章建表 SQL 内标注）：
  - 自增主键：SQLite `INTEGER PRIMARY KEY AUTOINCREMENT`；PostgreSQL `SERIAL` 或 `GENERATED ALWAYS AS IDENTITY`。
  - 时间：SQLite `DATETIME`（文本 `YYYY-MM-DD HH:MM:SS`，`CURRENT_TIMESTAMP` 为 UTC）；PostgreSQL 建议 `TIMESTAMPTZ`（带时区）。
  - 外键：`SQLite` 需 `PRAGMA foreign_keys = ON` 方生效；PostgreSQL 默认启用，级联策略直接写在 DDL。

### 1.3 命名规范

| 类别 | 规则 | 示例 |
|---|---|---|
| 表名 | `snake_case`；实体类用复数（`products`/`users`），关联/配置类按语义（`role_permissions`/`site_settings`/`about_pages`） | `product_categories`、`messages` |
| 字段名 | `snake_case`；含义清晰、避免缩写 | `cover_image`、`created_at` |
| 主键 | 统一 `id`，无业务含义 | `id` |
| 外键 | `<关联表名单数>_id`（即 `<referenced_table>_id`） | `role_id` → `roles.id`、`category_id` → `product_categories.id` |
| 唯一索引 | `uq_<table>_<column>` | `uq_users_username` |
| 普通/联合索引 | `ix_<table>_<col1>_<col2>` | `ix_products_series_category_status` |
| 布尔/状态 | `INTEGER 0/1`，字段名 `status` / `is_*` | `status`（1 启用 / 0 停用） |
| 时间 | `*_at`（时间点）/ `*_time`（时间窗） | `published_at`、`start_time` |

---

## 第2章 ER图（实体关系图）

### 2.1 整体 ER 图

直接复用开发技术文档生成的完整 ER 图（覆盖全部 15 张表及外键关系，含 PK 主键、FK 外键、FK* 自关联可空标注）。**不重绘**。

> 路径说明：按实际文件引用 `docs/diagrams/er.svg`（指令中所写 `docs/er-diagram.svg` 与实际文件名不一致，以实际文件为准）。

![栖木家具官网整体ER图](diagrams/er.svg)

**图例**：
- `PK`：主键；`FK`：外键（指向被引用表）；`FK*`：自关联外键（可空）。
- 实线：强关联（RESTRICT / CASCADE）；虚线：SET NULL 弱关联。

### 2.2 模块局部 ER 图

本期**不单独生成**模块局部 ER 图——`docs/diagrams/er.svg` 已完整覆盖全部 15 张表及表间关系，足够支撑开发联调，避免图与表漂移（TECH §11#10）。如后续拆表或新增模块导致整体图可读性下降，可再调用 diagram-builder 技能补充 RBAC / 产品域 / 内容互动域局部图。

---

## 第3章 数据字典（核心内容）

> 字段表列：字段名 / 数据类型 / 长度 / 可空 / 默认值 / 主键·外键 / 索引建议 / 字段说明。
> 数据类型以 SQLAlchemy 2.0 表示为准（`String`→`VARCHAR`、`Integer`→`INTEGER`、`Text`→`TEXT`、`DateTime`→`DATETIME`）；SQLite 下长度仅作文档约束，实际由应用层校验。

### 3.1 账户与权限（RBAC）

#### 3.1.1 users（用户）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 用户主键 |
| username | VARCHAR | 50 | 否 | - | - | `uq_users_username` | 登录名，唯一 |
| password_hash | VARCHAR | 128 | 否 | - | - | - | bcrypt 哈希（passlib[bcrypt]，格式 `$2b$...`） |
| real_name | VARCHAR | 50 | 是 | - | - | - | 真实姓名 |
| email | VARCHAR | 120 | 是 | - | - | - | 邮箱 |
| phone | VARCHAR | 20 | 是 | - | - | - | **手机号，AES-256-GCM 加密存储**（密钥 `PHONE_ENCRYPT_KEY`）；列表脱敏 `138****8888`，仅授权角色可见（见【待确认】①） |
| role_id | INTEGER | - | 否 | - | FK→roles.id | `ix_users_role_id` | 所属角色 |
| status | INTEGER | - | 否 | 1 | - | - | 1 启用 / 0 停用（停用即软删，超管不可停用） |
| last_login_at | DATETIME | - | 是 | - | - | - | 最近登录时间（UTC） |
| created_at | DATETIME | - | 否 | now() | - | - | 创建时间（UTC） |

**3NF 依据**：所有非主属性完全依赖主键 `id`，无部分依赖、无传递依赖（`role_id` 仅存角色引用，角色名经 `roles` 关联取得，不冗余存储）。满足第三范式。

#### 3.1.2 roles（角色）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 角色主键 |
| name | VARCHAR | 50 | 否 | - | - | - | 角色名（如 超级管理员） |
| code | VARCHAR | 50 | 否 | - | - | `uq_roles_code` | 角色编码（super_admin / content_editor / operator），唯一，权限判定按 code |
| description | VARCHAR | 200 | 是 | - | - | - | 角色描述 |
| created_at | DATETIME | - | 否 | now() | - | - | 创建时间（UTC） |

**3NF 依据**：非主属性完全依赖 `id`；`code` 与 `name` 同为角色属性，无传递依赖。满足 3NF。

#### 3.1.3 permissions（权限）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 权限主键 |
| name | VARCHAR | 50 | 是 | - | - | - | 权限名（如 产品新增） |
| code | VARCHAR | 50 | 否 | - | - | `uq_permissions_code` | 权限编码（如 product:edit），唯一，RBAC 高频判定 |
| module | VARCHAR | 50 | 是 | - | - | - | 所属模块（product / news / rbac ...） |

**3NF 依据**：非主属性完全依赖 `id`；`code` 唯一确定权限，无冗余。满足 3NF。

#### 3.1.4 role_permissions（角色-权限）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 映射主键 |
| role_id | INTEGER | - | 否 | - | FK→roles.id（CASCADE） | `ix_rp_permission_id` | 角色 ID |
| permission_id | INTEGER | - | 否 | - | FK→permissions.id（CASCADE） | 含于联合唯一 | 权限 ID |

**联合唯一约束**：`(role_id, permission_id)` → `uq_role_permissions_rp`。
**3NF 依据**：典型多对多关联表，主键为 `id`（代理键），业务唯一键 `(role_id, permission_id)` 防重复映射；两外键均完全依赖主键。满足 3NF。

### 3.2 产品

#### 3.2.1 product_categories（产品分类 / 适用空间）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 分类主键 |
| name | VARCHAR | 50 | 否 | - | - | - | 分类名（卧室/客厅/餐厅/书房/茶室/办公） |
| parent_id | INTEGER | - | 是 | - | FK→product_categories.id（SET NULL，自关联） | `ix_pc_parent_id` | 父级分类（本期可空，预留多级） |
| sort | INTEGER | - | 否 | 0 | - | - | 排序权重 |
| status | INTEGER | - | 否 | 1 | - | `ix_pc_status` | 1 启用 / 0 停用 |

**3NF 依据**：自关联树以 `parent_id` 表达层级（仅存父引用，不冗余父名）；非主属性依赖 `id`。满足 3NF。

#### 3.2.2 product_series（产品系列）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 系列主键 |
| name | VARCHAR | 50 | 否 | - | - | - | 系列名（胡桃禮/如意春/禧YUE/柏悦/蓝宝嘉/办公家具/软体） |
| sort | INTEGER | - | 否 | 0 | - | - | 排序权重 |
| status | INTEGER | - | 否 | 1 | - | `ix_ps_status` | 1 启用 / 0 停用 |

**3NF 依据**：非主属性依赖 `id`，无冗余。满足 3NF。

#### 3.2.3 products（产品）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 产品主键 |
| name | VARCHAR | 120 | 否 | - | - | - | 产品名称 |
| code | VARCHAR | 50 | 是 | - | - | - | 产品编号（如 HL-001） |
| series_id | INTEGER | - | 是 | - | FK→product_series.id（RESTRICT） | 含于联合索引 | 所属系列 |
| category_id | INTEGER | - | 是 | - | FK→product_categories.id（RESTRICT） | 含于联合索引 | 适用空间（分类） |
| material | VARCHAR | 50 | 是 | - | - | - | 材质（如 北美黑胡桃） |
| size | VARCHAR | 100 | 是 | - | - | - | 尺寸（如 1600×900×750mm） |
| style | VARCHAR | 50 | 是 | - | - | - | 风格（如 新中式） |
| applicable_space | VARCHAR | 50 | 是 | - | - | - | **冗余字段**，由 `category_id` 派生，仅展示/检索用 |
| description | TEXT | - | 是 | - | - | - | 图文详情（富文本/HTML，服务端 XSS 清洗） |
| cover_image | VARCHAR | 255 | 是 | - | - | - | 封面图 URL |
| gallery | TEXT | - | 是 | - | - | - | 多图 URL（JSON 数组） |
| sort | INTEGER | - | 否 | 0 | - | `ix_products_sort` | 排序权重 |
| status | INTEGER | - | 否 | 1 | - | 含于联合索引 | 1 上线 / 0 下线 |
| created_at | DATETIME | - | 否 | now() | - | - | 创建时间（UTC） |
| updated_at | DATETIME | - | 否 | now() | - | - | 更新时间（UTC，应用层维护） |

**索引建议（联合）**：`ix_products_series_category_status (series_id, category_id, status)` —— 产品列表按「系列 + 适用空间 + 状态」组合筛选高频。
**3NF 依据**：除 `applicable_space` 外，所有非主属性完全依赖 `id`，无传递依赖（系列名/分类名经外键关联取得）。
**反范式设计说明**：`applicable_space` 为**有意冗余**——由 `category_id` 派生的展示/检索字段。理由：前台产品卡片与筛选需高频展示「适用空间」文案，冗余存储可避免每次 JOIN 分类表；一致性约束为「所有写操作以 `category_id` 为准，禁止单独维护 `applicable_space`」，详见第 4 章。

### 3.3 新闻

#### 3.3.1 news_categories（新闻分类）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 分类主键 |
| name | VARCHAR | 50 | 否 | - | - | - | 分类名（企业新闻/行业资讯） |
| type | VARCHAR | 20 | 是 | - | - | - | **分类类型**：`news`=新闻分类 / `case`=案例分类，预留扩展（见【待确认】②） |
| sort | INTEGER | - | 否 | 0 | - | - | 排序权重 |
| status | INTEGER | - | 否 | 1 | - | `ix_nc_status` | 1 启用 / 0 停用 |

**3NF 依据**：非主属性依赖 `id`；`type` 为分类自身属性，无传递依赖。满足 3NF。

#### 3.3.2 news（新闻）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 新闻主键 |
| title | VARCHAR | 200 | 否 | - | - | - | 标题 |
| category_id | INTEGER | - | 是 | - | FK→news_categories.id（RESTRICT） | 含于联合索引 | 所属分类 |
| cover_image | VARCHAR | 255 | 是 | - | - | - | 封面图 URL |
| summary | VARCHAR | 300 | 是 | - | - | - | 摘要 |
| content | TEXT | - | 是 | - | - | - | 正文（富文本，XSS 清洗） |
| author | VARCHAR | 50 | 是 | - | - | - | 作者 |
| status | INTEGER | - | 否 | 0 | - | 含于联合索引 | 1 发布 / 0 草稿 |
| published_at | DATETIME | - | 是 | - | - | 含于联合索引 | 发布时间（UTC） |
| views | INTEGER | - | 否 | 0 | - | - | 阅读量（预留字段，默认 0，接口返回、前台不展示，见 TECH 决策⑦） |
| created_at | DATETIME | - | 否 | now() | - | - | 创建时间（UTC） |
| updated_at | DATETIME | - | 否 | now() | - | - | 更新时间（UTC） |

**索引建议（联合）**：`ix_news_cat_status_pub (category_id, status, published_at)` —— 新闻列表按「分类 + 状态 + 发布时间倒序」高频查询。
**3NF 依据**：非主属性完全依赖 `id`；分类名经外键关联，不冗余。满足 3NF。

### 3.4 轮播图与企业资料

#### 3.4.1 banners（轮播图）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 轮播主键 |
| title | VARCHAR | 120 | 是 | - | - | - | 标题 |
| image_url | VARCHAR | 255 | 否 | - | - | - | 图片 URL |
| link_url | VARCHAR | 255 | 是 | - | - | - | 跳转链接（限 `http(s)://`，协议白名单） |
| sort | INTEGER | - | 否 | 0 | - | 含于联合索引 | 排序权重 |
| status | INTEGER | - | 否 | 1 | - | 含于联合索引 | 1 启用 / 0 停用 |
| start_time | DATETIME | - | 是 | - | - | - | 展示开始（可选时间窗） |
| end_time | DATETIME | - | 是 | - | - | - | 展示结束（可选时间窗） |

**索引建议（联合）**：`ix_banners_status_sort (status, sort)` —— 首页取「启用 + 排序」轮播。
**3NF 依据**：非主属性依赖 `id`，无冗余。满足 3NF。

#### 3.4.2 about_pages（企业资料 / 关于我们）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 资料主键 |
| key | VARCHAR | 50 | 否 | - | - | `uq_about_pages_key` | 唯一键：`history`/`brand`/`contact`/`about`（关于栖木家具） |
| title | VARCHAR | 120 | 是 | - | - | - | 标题 |
| content | TEXT | - | 是 | - | - | - | 内容（富文本；`contact` 用结构化 JSON） |
| images | TEXT | - | 是 | - | - | - | 配图 JSON（可选） |
| updated_at | DATETIME | - | 否 | now() | - | - | 更新时间（UTC） |

> `key` 取值：`history`（发展历程）、`brand`（品牌介绍）、`contact`（联系我们）、`about`（关于栖木家具，v1.2 起纳入维护）。
**3NF 依据（反范式）**：本表为 **EAV 键值型配置**，`key` 唯一确定一条资料，`content`/`images` 为该资料的属性集合。牺牲部分范式（同一 `about_pages` 行内聚合了多属性）换取企业资料灵活扩展，仅存少量系统级资料，可接受。详见第 4 章反范式说明。

#### 3.4.3 site_settings（站点配置）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 配置主键 |
| key | VARCHAR | 50 | 否 | - | - | `uq_site_settings_key` | 唯一键：`company_name`/`phone`/`email`/`address`/`social`/`beian`（备案号） |
| value | TEXT | - | 是 | - | - | - | 值（JSON 可存复杂结构，如 social 含多平台账号） |

> `key` 取值说明：`company_name`（公司名）、`phone`（电话）、`email`（邮箱）、`address`（地址）、`social`（社交账号 JSON）、`beian`（备案号，见 TECH §0 site_settings 备案号字段）。
**3NF 依据（反范式）**：同为 **EAV 键值型配置**，`key` 唯一确定配置项，`value` 聚合存储；以范式换取站点配置灵活扩展（新增配置项无需改表），仅存极少量全局配置。可接受。

### 3.5 互动

#### 3.5.1 messages（留言 / 询价）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 留言主键 |
| name | VARCHAR | 50 | 否 | - | - | - | 姓名 |
| phone | VARCHAR | 20 | 否 | - | - | - | **手机号，AES-256-GCM 加密存储**；列表脱敏 `138****8888`，仅授权角色可见 |
| email | VARCHAR | 120 | 是 | - | - | - | 邮箱（选填） |
| type | VARCHAR | 20 | 否 | - | - | 含于联合索引 | `message`=留言 / `inquiry`=询价 |
| product_id | INTEGER | - | 是 | - | FK→products.id（SET NULL） | `ix_messages_product_id` | 关联产品（选填，产品删则置空） |
| content | TEXT | - | 否 | - | - | - | 留言内容 |
| status | INTEGER | - | 否 | 0 | - | 含于联合索引 | 0 未处理 / 1 已处理 |
| reply | TEXT | - | 是 | - | - | - | 回复内容 |
| handler_id | INTEGER | - | 是 | - | FK→users.id（SET NULL） | `ix_messages_handler_id` | 处理人（用户删则置空） |
| created_at | DATETIME | - | 否 | now() | - | 含于联合索引 | 提交时间（UTC） |
| handled_at | DATETIME | - | 是 | - | - | - | 处理时间（UTC） |

**索引建议（联合）**：`ix_messages_status_type_created (status, type, created_at)` —— 后台按「状态 + 类型 + 时间」筛选排序高频。
**CHECK 约束**：`type IN ('message','inquiry')`、`status IN (0,1)`。
**3NF 依据**：非主属性完全依赖 `id`；产品名/处理人姓名经外键关联取得，不冗余。满足 3NF。

### 3.6 静态内容（决策②新增，后台可维护）

#### 3.6.1 cases（新案例展示）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 案例主键 |
| title | VARCHAR | 120 | 否 | - | - | - | 标题 |
| cover_image | VARCHAR | 255 | 是 | - | - | - | 封面图 URL |
| summary | VARCHAR | 300 | 是 | - | - | - | 简介 |
| content | TEXT | - | 是 | - | - | - | 图文详情 |
| sort | INTEGER | - | 否 | 0 | - | 含于联合索引 | 排序权重 |
| status | INTEGER | - | 否 | 1 | - | 含于联合索引 | 1 启用 / 0 停用 |

**索引建议（联合）**：`ix_cases_status_sort (status, sort)` —— 前台取「启用 + 排序」案例列表（注：cases 表无 `category` 字段，故索引不含 category；recruit 含 category，见下）。
**3NF 依据**：非主属性依赖 `id`，无冗余。满足 3NF。

#### 3.6.2 recruit（招聘入口）

| 字段名 | 数据类型 | 长度 | 可空 | 默认值 | 主键·外键 | 索引建议 | 字段说明 |
|---|---|---|---|---|---|---|---|
| id | INTEGER | - | 否 | 自增 | PK | - | 招聘主键 |
| category | VARCHAR | 20 | 否 | - | - | 含于联合索引 | `social`=社会招聘 / `campus`=校园招聘 |
| title | VARCHAR | 120 | 否 | - | - | - | 标题 |
| content | TEXT | - | 是 | - | - | - | 正文（岗位方向/我们提供等） |
| contact | VARCHAR | 200 | 是 | - | - | - | 联系方式 |
| sort | INTEGER | - | 否 | 0 | - | 含于联合索引 | 排序权重 |
| status | INTEGER | - | 否 | 1 | - | 含于联合索引 | 1 启用 / 0 停用 |

**索引建议（联合）**：`ix_recruit_status_category_sort (status, category, sort)` —— 前台按「状态 + 类别（社招/校招）+ 排序」筛选。
**CHECK 约束**：`category IN ('social','campus')`、`status IN (0,1)`。
**3NF 依据**：非主属性完全依赖 `id`；`category` 为本表自身枚举属性，无传递依赖。满足 3NF。

### 3.7 反范式设计汇总

| 表 / 字段 | 类型 | 反范式理由 |
|---|---|---|
| `products.applicable_space` | 派生冗余 | 由 `category_id` 派生的展示/检索字段，避免高频 JOIN 分类表；以 `category_id` 为唯一数据来源，写操作禁止单独维护 |
| `about_pages`（EAV） | 键值聚合 | 企业资料条目少且结构各异，键值型配置换取灵活扩展，免改表 |
| `site_settings`（EAV） | 键值聚合 | 全局站点配置项少、变化频繁，键值型配置换取灵活扩展，免改表 |

> 其余 12 张表均满足第三范式（3NF）：非主属性完全函数依赖主键，且不存在传递依赖（名称类属性一律经外键关联取得，不冗余存储）。

---

## 第4章 表关系说明

### 4.1 核心关联文字描述

- **用户 ↔ 角色**：`users.role_id` → `roles.id`。每个用户归属一个角色；角色被删前须先解绑/停用其用户（RESTRICT），避免用户悬空。
- **角色 ↔ 权限**：`role_permissions` 为 `roles` 与 `permissions` 的多对多桥表。`role_id`→`roles.id`、`permission_id`→`permissions.id`；删角色/权限时映射同步清除（CASCADE）。
- **产品 ↔ 系列 / 分类**：`products.series_id`→`product_series.id`、`products.category_id`→`product_categories.id`。删系列/分类前须先处理其下产品（RESTRICT），保护产品归属。
- **新闻 ↔ 分类**：`news.category_id`→`news_categories.id`。删新闻分类前须先迁移/软删其下新闻（RESTRICT）。
- **留言 ↔ 产品 / 处理人**：`messages.product_id`→`products.id`（产品删除保留留言，置空 SET NULL）；`messages.handler_id`→`users.id`（处理人删除则置空 SET NULL）。
- **分类自关联**：`product_categories.parent_id`→`product_categories.id`（本期可空；父级删除子级置顶，SET NULL）。

### 4.2 外键约束与级联策略

| 关系 | 外键字段 | 级联策略 | 说明 |
|---|---|---|---|
| users.role_id → roles.id | role_id | **RESTRICT** | 删角色前须先解绑/停用用户，防用户悬空 |
| role_permissions.role_id → roles.id | role_id | **CASCADE** | 删角色同步清权限映射 |
| role_permissions.permission_id → permissions.id | permission_id | **CASCADE** | 删权限同步清映射 |
| products.series_id → product_series.id | series_id | **RESTRICT** | 删系列前须先处理其产品 |
| products.category_id → product_categories.id | category_id | **RESTRICT** | 删分类前须先处理其产品 |
| news.category_id → news_categories.id | category_id | **RESTRICT** | 删新闻分类前须先迁移/软删其新闻 |
| messages.product_id → products.id | product_id | **SET NULL** | 产品删除保留留言线索 |
| messages.handler_id → users.id | handler_id | **SET NULL** | 处理人删除则处理记录保留、置空 |
| product_categories.parent_id → product_categories.id | parent_id | **SET NULL** | 自关联，父级删除子级置顶 |

### 4.3 软删除统一约定（重要）

- **内容类资源**（产品 / 新闻 / Banner / 案例 / 招聘 / 用户 / 角色 / 企业资料）的 `DELETE` 接口均为**软删除**（翻转 `status` 字段，1↔0），**不物理删除**，因此不会触发上表 RESTRICT 约束，保障可恢复与审计。
- 仅当后台对**分类 / 系列 / 新闻分类**执行**物理删除**时，RESTRICT 才生效；删除前须先将其子资源（产品、新闻）迁移至其他分类/系列或先行软删。
- `role_permissions` 允许物理删除（CASCADE），因其为纯映射、无业务实体意义。
- 用户/角色删除一律为「停用」（`status=0`）；**超级管理员角色不可删、不可降权**（TECH §5.5.7）。

---

## 第5章 索引设计

| 表 | 索引名 | 字段 | 类型 | 创建原因（查询优化场景） |
|---|---|---|---|---|
| users | uq_users_username | username | 唯一 | 登录查询与唯一约束（高频，必须） |
| users | ix_users_role_id | role_id | 普通 | 按角色筛选/统计用户 |
| roles | uq_roles_code | code | 唯一 | RBAC 权限判定按 code 查找（高频） |
| permissions | uq_permissions_code | code | 唯一 | RBAC 判定高频（按 code 取权限） |
| role_permissions | uq_role_permissions_rp | (role_id, permission_id) | 联合唯一 | 防重复映射 + 按角色/权限反查 |
| role_permissions | ix_rp_permission_id | permission_id | 普通 | 按权限反查拥有该权限的角色 |
| product_categories | ix_pc_status | status | 普通 | 前台只取启用分类 |
| product_categories | ix_pc_parent_id | parent_id | 普通 | 自关联树查询（本期可空，预留） |
| product_series | ix_ps_status | status | 普通 | 前台只取启用系列 |
| products | ix_products_series_category_status | (series_id, category_id, status) | 联合 | 产品列表「系列+空间+状态」组合筛选高频 |
| products | ix_products_sort | sort | 普通 | 排序展示 |
| news | ix_news_cat_status_pub | (category_id, status, published_at) | 联合 | 新闻列表「分类+状态+发布时间倒序」高频 |
| banners | ix_banners_status_sort | (status, sort) | 联合 | 首页轮播取「启用+排序」 |
| messages | ix_messages_status_type_created | (status, type, created_at) | 联合 | 后台「状态+类型+时间」筛选排序 |
| messages | ix_messages_product_id | product_id | 普通 | 关联产品查询 |
| messages | ix_messages_handler_id | handler_id | 普通 | 按处理人查询 |
| about_pages | uq_about_pages_key | key | 唯一 | 按 key 取企业资料 |
| site_settings | uq_site_settings_key | key | 唯一 | 按 key 取站点配置 |
| cases | ix_cases_status_sort | (status, sort) | 联合 | 案例列表「启用+排序」筛选 |
| recruit | ix_recruit_status_category_sort | (status, category, sort) | 联合 | 招聘「状态+类别+排序」筛选 |

### 5.1 索引设计补充

- **模糊搜索（LIKE）**：`products.name` / `news.title` 的 `LIKE '%关键词%'` 在 **SQLite 下不走 B-tree 索引**（仅前缀 `LIKE '关键词%'` 可用索引）。开发期 `LIKE` 全表扫描即可，不做全文索引。
- **PostgreSQL 生产建议**：对名称/标题建 `pg_trgm` GIN 三元组索引加速模糊检索（如 `CREATE INDEX ix_products_name_trgm ON products USING gin (name gin_trgm_ops)`）。
- **PII 合规提示**：`messages.phone`、`users.phone` 属个人信息（PIPL，PRD §8.1），**禁止对明文建索引**；因存储为 AES-256-GCM 密文，索引无意义且泄露风险高，故上表未对 phone 建索引。脱敏展示在应用层完成。

---

## 第6章 建表 SQL 脚本

> 以下为 **SQLite** 语法（可直接执行）。每个 `CREATE TABLE` 后附 **PostgreSQL 差异注释**。
> 执行顺序遵循依赖：先建被引用主表，再建引用表（外键所指表须先存在）。
> SQLite 执行前务必 `PRAGMA foreign_keys = ON;`（默认关闭）。

```sql
-- ============ 账户与权限 ============

-- roles（被 users / role_permissions 引用，先建）
CREATE TABLE roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(50)  NOT NULL,
    code        VARCHAR(50)  NOT NULL,
    description VARCHAR(200),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (code)
);
-- PG: id SERIAL PRIMARY KEY; created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- permissions（被 role_permissions 引用，先建）
CREATE TABLE permissions (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   VARCHAR(50),
    code   VARCHAR(50) NOT NULL,
    module VARCHAR(50),
    UNIQUE (code)
);
-- PG: id SERIAL PRIMARY KEY

-- users（引用 roles）
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    real_name     VARCHAR(50),
    email         VARCHAR(120),
    phone         VARCHAR(20),                 -- AES-256-GCM 密文
    role_id       INTEGER       NOT NULL,
    status        INTEGER       NOT NULL DEFAULT 1 CHECK (status IN (0,1)),
    last_login_at DATETIME,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (username),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);
-- PG: id SERIAL PRIMARY KEY; created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
CREATE INDEX ix_users_role_id ON users(role_id);

-- role_permissions（多对多桥表）
CREATE TABLE role_permissions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id       INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    UNIQUE (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
-- PG: id SERIAL PRIMARY KEY
CREATE INDEX ix_rp_permission_id ON role_permissions(permission_id);

-- ============ 产品 ============

-- product_categories（被 products 引用；自关联）
CREATE TABLE product_categories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      VARCHAR(50) NOT NULL,
    parent_id INTEGER,
    sort      INTEGER     NOT NULL DEFAULT 0,
    status    INTEGER     NOT NULL DEFAULT 1 CHECK (status IN (0,1)),
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL
);
-- PG: id SERIAL PRIMARY KEY
CREATE INDEX ix_pc_status     ON product_categories(status);
CREATE INDEX ix_pc_parent_id  ON product_categories(parent_id);

-- product_series（被 products 引用）
CREATE TABLE product_series (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   VARCHAR(50) NOT NULL,
    sort   INTEGER     NOT NULL DEFAULT 0,
    status INTEGER     NOT NULL DEFAULT 1 CHECK (status IN (0,1))
);
-- PG: id SERIAL PRIMARY KEY
CREATE INDEX ix_ps_status ON product_series(status);

-- products（引用 series / category）
CREATE TABLE products (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            VARCHAR(120) NOT NULL,
    code            VARCHAR(50),
    series_id       INTEGER,
    category_id     INTEGER,
    material        VARCHAR(50),
    size            VARCHAR(100),
    style           VARCHAR(50),
    applicable_space VARCHAR(50),               -- 反范式冗余，派生自 category_id
    description     TEXT,
    cover_image     VARCHAR(255),
    gallery         TEXT,
    sort            INTEGER      NOT NULL DEFAULT 0,
    status          INTEGER      NOT NULL DEFAULT 1 CHECK (status IN (0,1)),
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id)   REFERENCES product_series(id)     ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT
);
-- PG: created_at/updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
CREATE INDEX ix_products_series_category_status ON products(series_id, category_id, status);
CREATE INDEX ix_products_sort ON products(sort);

-- ============ 新闻 ============

CREATE TABLE news_categories (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   VARCHAR(50) NOT NULL,
    type   VARCHAR(20),                         -- news=新闻分类 / case=案例分类，预留
    sort   INTEGER     NOT NULL DEFAULT 0,
    status INTEGER     NOT NULL DEFAULT 1 CHECK (status IN (0,1))
);
-- PG: id SERIAL PRIMARY KEY
CREATE INDEX ix_nc_status ON news_categories(status);

CREATE TABLE news (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        VARCHAR(200) NOT NULL,
    category_id  INTEGER,
    cover_image  VARCHAR(255),
    summary      VARCHAR(300),
    content      TEXT,
    author       VARCHAR(50),
    status       INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0,1)),
    published_at DATETIME,
    views        INTEGER NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE RESTRICT
);
-- PG: created_at/updated_at/published_at TIMESTAMPTZ
CREATE INDEX ix_news_cat_status_pub ON news(category_id, status, published_at);

-- ============ 轮播图与企业资料 ============

CREATE TABLE banners (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      VARCHAR(120),
    image_url  VARCHAR(255) NOT NULL,
    link_url   VARCHAR(255),
    sort       INTEGER      NOT NULL DEFAULT 0,
    status     INTEGER      NOT NULL DEFAULT 1 CHECK (status IN (0,1)),
    start_time DATETIME,
    end_time   DATETIME
);
CREATE INDEX ix_banners_status_sort ON banners(status, sort);

CREATE TABLE about_pages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    key        VARCHAR(50) NOT NULL,
    title      VARCHAR(120),
    content    TEXT,
    images     TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (key)
);
-- PG: updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

CREATE TABLE site_settings (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    key   VARCHAR(50) NOT NULL,
    value TEXT,
    UNIQUE (key)
);
-- PG: id SERIAL PRIMARY KEY

-- ============ 互动 ============

CREATE TABLE messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(50)  NOT NULL,
    phone       VARCHAR(20)  NOT NULL,          -- AES-256-GCM 密文
    email       VARCHAR(120),
    type        VARCHAR(20)  NOT NULL CHECK (type IN ('message','inquiry')),
    product_id  INTEGER,
    content     TEXT         NOT NULL,
    status      INTEGER      NOT NULL DEFAULT 0 CHECK (status IN (0,1)),
    reply       TEXT,
    handler_id  INTEGER,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    handled_at  DATETIME,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (handler_id) REFERENCES users(id)   ON DELETE SET NULL
);
CREATE INDEX ix_messages_status_type_created ON messages(status, type, created_at);
CREATE INDEX ix_messages_product_id ON messages(product_id);
CREATE INDEX ix_messages_handler_id ON messages(handler_id);

-- ============ 静态内容（决策②） ============

CREATE TABLE cases (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       VARCHAR(120) NOT NULL,
    cover_image VARCHAR(255),
    summary     VARCHAR(300),
    content     TEXT,
    sort        INTEGER NOT NULL DEFAULT 0,
    status      INTEGER NOT NULL DEFAULT 1 CHECK (status IN (0,1))
);
CREATE INDEX ix_cases_status_sort ON cases(status, sort);

CREATE TABLE recruit (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    category VARCHAR(20)  NOT NULL CHECK (category IN ('social','campus')),
    title    VARCHAR(120) NOT NULL,
    content  TEXT,
    contact  VARCHAR(200),
    sort     INTEGER      NOT NULL DEFAULT 0,
    status   INTEGER      NOT NULL DEFAULT 1 CHECK (status IN (0,1))
);
CREATE INDEX ix_recruit_status_category_sort ON recruit(status, category, sort);
```

### 6.1 SQLite / PostgreSQL 兼容要点汇总

| 项 | SQLite | PostgreSQL |
|---|---|---|
| 自增主键 | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL` 或 `GENERATED ALWAYS AS IDENTITY` |
| 时间默认 | `CURRENT_TIMESTAMP`（UTC 文本） | `NOW()` / `CURRENT_TIMESTAMP`（`TIMESTAMPTZ`） |
| 外键生效 | 需 `PRAGMA foreign_keys = ON` | 默认启用，DDL 直接带 `ON DELETE` |
| CHECK | 原生支持 | 原生支持（建议同名约束便于迁移） |
| 联合唯一 | `UNIQUE (a,b)` | `UNIQUE (a,b)`（或 `CREATE UNIQUE INDEX`） |
| 字符串长度 | 仅文档约束，运行时不截断 | `VARCHAR(n)` 实际约束长度 |

---

## 第7章 初始化数据

> 种子数据用于系统首次启动（`db/init_db.py` 读取环境 + 内置种子）。以下 SQL 可直接执行（SQLite / PostgreSQL 通用，自增主键由数据库分配，故关联用子查询按 `code` 解析）。

### 7.1 角色种子（3 个）

```sql
INSERT INTO roles (name, code, description) VALUES
('超级管理员', 'super_admin', '拥有全部权限，负责用户/角色管理、系统配置'),
('内容编辑',   'content_editor', '维护产品、新闻、轮播、企业资料、案例、招聘等内容'),
('客服/运营',  'operator', '查看并处理前台留言/询价，查看仪表盘');
```

### 7.2 权限种子（18 个）

权限编码对齐 PRD §2.3 矩阵，并按确认项新增 `case:manage` / `recruit:manage`（与 `about:manage` 平级），另含 TECH §5.5.8/§5.6 引用的 `upload:manage`（【待确认】③）。

```sql
INSERT INTO permissions (name, code, module) VALUES
('仪表盘查看',     'dashboard:view',        'dashboard'),
('产品查看',       'product:view',          'product'),
('产品新增',       'product:create',        'product'),
('产品编辑',       'product:edit',          'product'),
('产品删除',       'product:delete',        'product'),
('新闻查看',       'news:view',             'news'),
('新闻新增',       'news:create',           'news'),
('新闻编辑',       'news:edit',             'news'),
('新闻删除',       'news:delete',           'news'),
('轮播图管理',     'banner:manage',         'banner'),
('企业资料管理',   'about:manage',          'about'),
('案例管理',       'case:manage',           'case'),        -- 确认项①：与 about:manage 平级
('招聘管理',       'recruit:manage',        'recruit'),      -- 确认项①：与 about:manage 平级
('留言查看',       'message:view',          'message'),
('留言处理',       'message:handle',        'message'),
('用户管理',       'rbac:user:manage',      'rbac'),
('角色与权限管理', 'rbac:role:manage',      'rbac'),
('文件管理',       'upload:manage',         'upload');       -- 【待确认】③：TECH 接口矩阵引用，PRD 矩阵未列
```

### 7.3 角色-权限映射（预设模板）

> `super_admin` 在 `require_perm` 中**短路放行全部权限**（TECH §5.6），此处仍全量授予以便权限基线清晰；内容编辑按产品/新闻/资料/案例/招聘域授予；客服/运营仅留言与仪表盘。

```sql
-- 超级管理员：全部权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'super_admin';

-- 内容编辑：产品/新闻/Banner/企业资料/案例/招聘 + 仪表盘
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'content_editor'
  AND p.code IN (
    'dashboard:view',
    'product:view','product:create','product:edit','product:delete',
    'news:view','news:create','news:edit','news:delete',
    'banner:manage','about:manage','case:manage','recruit:manage'
  );

-- 客服/运营：仪表盘 + 留言查看/处理
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'operator'
  AND p.code IN ('dashboard:view','message:view','message:handle');
```

### 7.4 产品分类种子（适用空间）

```sql
INSERT INTO product_categories (name, sort, status) VALUES
('卧室', 1, 1), ('客厅', 2, 1), ('餐厅', 3, 1),
('书房', 4, 1), ('茶室', 5, 1), ('办公', 6, 1);
```

### 7.5 产品系列种子

```sql
INSERT INTO product_series (name, sort, status) VALUES
('胡桃禮', 1, 1), ('如意春', 2, 1), ('禧YUE', 3, 1),
('柏悦', 4, 1), ('蓝宝嘉', 5, 1), ('办公家具', 6, 1), ('软体', 7, 1);
```

### 7.6 新闻分类种子

```sql
INSERT INTO news_categories (name, type, sort, status) VALUES
('企业新闻', 'news', 1, 1),
('行业资讯', 'news', 2, 1);
```

### 7.7 站点配置种子

```sql
INSERT INTO site_settings (key, value) VALUES
('company_name', '"栖木家具有限公司"'),
('phone',        '"400-000-0000"'),
('email',        '"contact@qimu.cn"'),
('address',      '"广东省佛山市顺德区xxx"'),
('social',       '{"weibo":"","wechat":"","douyin":""}'),
('beian',        '"粤ICP备xxxxxxxx号"');   -- 备案号（TECH §0 site_settings 备案号字段）
```

### 7.8 企业资料种子（about_pages）

```sql
INSERT INTO about_pages (key, title, content) VALUES
('history', '发展历程',   ''),
('brand',   '品牌介绍',   ''),
('contact', '联系我们',   '{}'),   -- contact 用结构化 JSON
('about',   '关于栖木家具', '');   -- v1.2 起纳入维护
```

> 内容由业务方在后台填充（关于栖木家具页须填充真实企业介绍，PRD §4.5）。

### 7.9 默认管理员账号

```sql
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, status, created_at)
VALUES (
  'admin',
  '$2b$12$<由 INIT_ADMIN_PASSWORD 经 bcrypt 哈希生成的密文>',  -- 见下方哈希说明
  '超级管理员',
  NULL,
  NULL,        -- 初始超管可不填手机；若填则须 AES-256-GCM 加密后存储
  1,           -- role_id=1 → super_admin
  1,           -- 启用
  CURRENT_TIMESTAMP
);
```

**密码哈希方式说明**：
- 算法：**bcrypt**（passlib[bcrypt]），自适应成本因子（默认 `rounds=12`），抵御彩虹表与暴力破解。
- 密文格式：`$2b$12$<salt><hash>`（60 字符，存于 `password_hash`，长度 128 足够）。
- 生成时机：由 `db/init_db.py` 读取环境变量 `INIT_ADMIN_USER` / `INIT_ADMIN_PASSWORD`，调用 `pwd_context.hash()` 生成并落库；账号已存在则跳过（TECH §2.3 init_db）。
- 登录校验：明文密码经 HTTPS 传输，服务端 `pwd_context.verify(明文, password_hash)` 比对；用户被停用（`status=0`）时鉴权依赖额外拒绝。
- **生产要求**：`INIT_ADMIN_PASSWORD` 须为强随机串，首次部署后务必修改（TECH §10.3）。
- 上例中的 `<...密文>` 为占位，真实值由初始化流程动态生成，不应手写固定哈希。

### 7.10 初始化顺序建议

1. 建表（第 6 章，按依赖顺序）→ 2. 角色（§7.1）→ 3. 权限（§7.2）→ 4. 角色权限映射（§7.3）→ 5. 分类/系列/新闻分类（§7.4–7.6）→ 6. 站点配置/企业资料（§7.7–7.8）→ 7. 默认超管（§7.9，密码由 init_db 动态哈希）。

---

## 附录：待确认事项（撰写时标注）

| 编号 | 位置 | 事项 | 当前处理 |
|---|---|---|---|
| ① | 3.1.1 / 7.9（users.phone） | `users.phone` 加密存储（AES-256-GCM）与 PRD §6.1 未提及加密的差异 | 已按确认项「加密存储、数据库层存密文」处理；应用层对 `users.phone` 同样加密+脱敏 |
| ② | 3.3.1（news_categories.type） | `type` 字段用途 | 已确认：分类类型 `news`=新闻分类 / `case`=案例分类，预留扩展 |
| ③ | 7.2（upload:manage） | `upload:manage` 权限 PRD 矩阵未列、TECH 接口矩阵引用 | 暂保留为权限种子【待确认】，待产品确认是否纳入权限基线（不影响本期开发） |

> 以上【待确认】项均不阻塞本期开发基线；确认后回填权限矩阵与 RBAC 预设模板即可。
