# 栖木家具官网 · 项目开发实施方案

> 版本：v1.0
> 编写日期：2026-09-08
> 文档状态：待确认（用户回复「已确认，执行下一步」后进入执行）
> 关联文档：`PRD_企业家居网站.md`（v1.2）、`UIUX_企业家居网站.md`（v1.1）、`TECH_开发技术文档.md`（v1.1）、`DB_数据库设计文档.md`（v1.0）
> 原型参考：`prototype/prototype-frontend-index.html`、`prototype/prototype-backend-index.html`

---

## 0. 方案总览

### 0.1 已确认的决策基线（4 项，本方案据此制定）

| # | 决策项 | 结论 |
|---|---|---|
| 1 | 开发期数据库 | **SQLite**（单文件 `app.db`）；`psycopg2-binary` 仅作生产切换 PostgreSQL 的预留依赖，开发期不连 Postgres |
| 2 | 后端依赖管理 | **venv + pip + requirements.txt**（按需求 #5，非 poetry） |
| 3 | 新案例展示 / 招聘入口 | **后台可维护**（cases/recruit 表 + 后台 CRUD，沿用 TECH 决策②与 DB 文档） |
| 4 | 前端脚手架 | **Vite + React 18 + TypeScript + pnpm**；前台 `frontend/` 与后台 `admin/` 为两个独立应用 |

### 0.2 技术栈总表（源自 TECH §1.2，已锁定）

| 层 | 技术 |
|---|---|
| 后端 | Python 3.11 + FastAPI + SQLAlchemy 2.0（异步会话）+ Alembic |
| 数据库 | 开发 SQLite 3 / 生产 PostgreSQL 14+（经 `DATABASE_URL` 切换） |
| 前台 UI | React 18 + TypeScript + Tailwind CSS（Vite 构建） |
| 后台 UI | React 18 + TypeScript + Ant Design（Vite 构建） |
| 鉴权 | JWT（python-jose，access token 7 天，无 refresh） |
| 状态/请求 | Zustand（UI 态）+ React Query（服务端数据）+ axios |
| 加密/清洗 | passlib[bcrypt]（密码）、cryptography AES-256-GCM（手机号）、bleach（富文本 XSS） |

### 0.3 仓库布局（monorepo）

项目根目录 = `dev_master/`，三端并列；`docs/` 与 `prototype/` 保留作为需求/设计基线。

```
dev_master/
├─ backend/            # 后端 FastAPI
│  ├─ venv/           # 虚拟环境（需求#5 创建）
│  ├─ requirements.txt
│  ├─ uploads/        # 本地图片存储（静态映射 /media）
│  └─ app/
│     ├─ main.py
│     ├─ core/  db/  models/  schemas/  repositories/  services/  routers/
│     └─ migrations/
├─ frontend/          # 前台官网（React + Tailwind）
├─ admin/             # 后台管理系统（React + Ant Design）
├─ docs/              # 需求/设计/技术/数据库文档（已确认基线）
└─ prototype/         # 高保真原型（页面效果参考）
```

> 说明：所有功能/接口/字段以四份文档为**单一事实来源**，本方案不重复定义，仅规划执行路径。

---

## 1. 项目初始化（Phase 0：脚手架）

### 1.1 第 1 步：创建后端虚拟环境（需求 #5 强制首步）

> 以下为执行阶段（用户确认后）将实际运行的命令。路径基于 Windows Git Bash；Linux/Mac 用 `source backend/venv/bin/activate`、路径替换为正斜杠即可。

**① 在项目根目录下创建 `backend/` 文件夹**
```bash
cd dev_master
mkdir -p backend
```

**② 使用 Python 3.10+ 创建虚拟环境 `venv/`**
```bash
# 推荐 Python 3.11.1（系统：C:/Program Files/Python311/python.exe）
"C:/Program Files/Python311/python.exe" -m venv backend/venv
# 若使用环境托管版 3.13.12，替换为对应路径亦可
```

**③ 激活虚拟环境**
```bash
# Git Bash
source backend/venv/Scripts/activate
# 或 PowerShell / CMD：backend\venv\Scripts\activate
```

**④ 安装核心依赖（需求 #5 指定清单）+ 文档必需补充依赖**
```bash
python -m pip install --upgrade pip

# —— 需求 #5 核心依赖 ——
pip install fastapi uvicorn sqlalchemy alembic \
  "python-jose[cryptography]" "passlib[bcrypt]" \
  python-multipart psycopg2-binary

# —— 文档要求、需求#5 未列的补充依赖 ——
pip install pydantic-settings bleach aiosqlite cryptography
# pydantic-settings: settings/config 读环境变量
# bleach: 富文本 XSS 清洗（TECH §8.3）
# aiosqlite: 异步 SQLAlchemy 2.0 + SQLite 驱动
# cryptography: 手机号 AES-256-GCM（python-jose 已带，显式声明更清晰）

# —— 开发/测试依赖（可选）——
pip install pytest httpx
```

**⑤ 生成 `requirements.txt` 文件**
```bash
pip freeze > backend/requirements.txt
```
> 建议随后人工剔除无关包、固定关键版本；生产部署用此文件 `pip install -r requirements.txt`。

**⑥ 验证环境是否可用（启动最小 FastAPI 实例测试）**
```bash
# 创建最小验证文件 backend/app/main.py
```
```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI(title="栖木家具官网 API")

@app.get("/api/v1/health")
def health():
    return {"code": 0, "message": "ok", "data": {"status": "healthy"}}
```
```bash
cd backend
uvicorn app.main:app --reload --port 8000
# 另开终端验证
curl http://127.0.0.1:8000/api/v1/health
# 期望返回：{"code":0,"message":"ok","data":{"status":"healthy"}}
# 同时浏览器访问 http://127.0.0.1:8000/docs 可见自动生成的 OpenAPI 文档
```
> 验证标准：接口返回统一信封 `{code,message,data}`、`/docs` 可打开、无报错即环境就绪。

### 1.2 前端项目初始化（`frontend/` 与 `admin/`）

> 前置：【手动操作】安装 Node.js ≥18 与 pnpm ≥8（见 §6）。

```bash
# 前台官网
pnpm create vite frontend --template react-ts
cd frontend
pnpm add -D tailwindcss postcss autoprefixer && pnpm dlx tailwindcss init -p
pnpm add axios @tanstack/react-query zustand react-router-dom
# 将 UIUX §2 设计令牌注入 tailwind.config.ts（主色 #7D5A3C、暖米底 #FAF7F2 等）

# 后台管理系统
cd ..
pnpm create vite admin --template react-ts
cd admin
pnpm add antd axios @tanstack/react-query zustand react-router-dom
# 配置主题色 #1677FF、暗色侧栏 #0F1B2D（UIUX §2.1.2）

# 两个应用均建立 .env：VITE_API_BASE=http://localhost:8000/api/v1
```

### 1.3 版本控制与 Git 初始化 【手动操作】

详见 §6 清单第 2 项。要点：仓库建在 GitHub；分支策略 `main`（生产）/ `dev`（集成）/ `feature/*`（需求）；根目录 `.gitignore` 忽略 `backend/venv/`、`backend/uploads/`、`*.db`、`.env`、`node_modules/`、`dist/`。

### 1.4 配置与目录骨架

- 后端：`backend/.env.example`（含 `DATABASE_URL=sqlite:///./app.db`、`JWT_SECRET`、`JWT_EXPIRE_SECONDS=604800`、`CORS_ORIGINS`、`UPLOAD_DIR`、`MAX_UPLOAD_MB=2`、`ALLOWED_EXTENSIONS`、`PHONE_ENCRYPT_KEY`、`INIT_ADMIN_USER`、`INIT_ADMIN_PASSWORD`），并执行 `app/` 分层目录骨架（core/db/models/schemas/repositories/services/routers）。
- 前端：按 TECH §2.1 / §2.2 建立 `pages/`、`components/`、`api/`、`store/`、`types/`、`styles/` 等目录。

---

## 2. 开发阶段划分（Phase 1–5，按模块拆分）

> 标注【手动操作】的步骤由用户执行；其余由开发（本代理）在确认后执行。

### Phase 1 — 数据层：建表 + 种子 + 迁移配置（后端）
- **目标**：落地 DB 文档定义的 15 张表 + 初始化种子 + Alembic 就绪。
- **范围（模块）**：
  - `app/db/`：`Base`/`engine`/`session`、`init_db.py`（读 `INIT_ADMIN_*` 创建超管、角色/权限/映射/分类/系列/新闻分类/站点配置/about_pages 种子，已存在跳过）。
  - `app/models/`：user、role、permission、product（含 categories/series）、news、content（about_pages/site_settings/banners）、message、static（cases/recruit）。
  - `alembic.ini` + `migrations/`（配置就绪，支持 `DATABASE_URL` 切 PostgreSQL）。
- **交付物**：可一键建表并初始化的脚本；开发库 `app.db`；初始超管账号。
- **依赖**：Phase 0（venv + 依赖）。
- **验收标准**：
  - 运行初始化后 DB 含 15 张表；`roles` 3 条、`permissions` 18 条、`role_permissions` 映射正确（super_admin 全量、content_editor 产品/新闻/资料/案例/招聘域、operator 仅仪表盘+留言）。
  - 分类 6 条（卧室/客厅/餐厅/书房/茶室/办公）、系列 7 条、新闻分类 2 条、站点配置 6 条（含 `beian` 备案号）、about_pages 4 条（history/brand/contact/about）。
  - 超管账号可由后续 Phase 2 登录接口正常鉴权。

### Phase 2 — 后端核心 API（按模块拆分，后端）
- **目标**：实现 TECH §5 全部 `/api/v1` 接口，统一响应信封 + 鉴权 + RBAC + 异常处理。
- **模块拆分与交付物**：
  - **2A 认证与 RBAC**：`/auth/login|logout|me`；JWT 签发（7 天）；bcrypt 校验；登录限流（内存字典，5 次/10 分钟锁定→429/10002）；`get_current_user` + `require_perm`；`super_admin` 短路放行；用户/角色/权限 CRUD（软删=状态翻转；角色权限按**预设模板**授予，无逐权限勾选 UI）。
  - **2B 产品与新闻**：产品 CRUD + 分类/系列管理（软删语义、批量上下线/排序）；新闻 CRUD（富文本经 bleach XSS 清洗、`news.views` 预留默认 0）；公开读接口。
  - **2C 轮播图 / 企业资料 / 站点**：banners CRUD（时间窗、启停、排序）；about_pages（含「关于栖木家具」富文本）；site_settings 批量更新（含备案号）。
  - **2D 留言 / 询价**：`POST /messages` 提交（手机号 AES-256-GCM 加密、隐私同意校验 `10006`）；后台列表（**手机号脱敏 138****8888**、仅授权角色可见明文）、标记处理/回复。
  - **2E 文件上传**：`POST /admin/upload`（jpg/png/webp ≤2MB、UUID 重命名、落 `uploads/` 并映射 `/media`）；`DELETE /admin/files`（校验 URL 在 `UPLOAD_DIR` 内防穿越，`upload:manage`）。
  - **2F 静态内容（cases / recruit）**：公开读 + 后台 CRUD（**已确认后台可维护**；权限 `case:manage`/`recruit:manage`）。
  - **2G 系统**：`GET /health` 健康检查（含 DB `SELECT 1` 探活）。
  - 横切：`core/exceptions.py` 统一异常→`{code,message}`；错误码枚举（0/10001–10008）；分页 `{items,total,page,page_size}`；CORS（dev 含 `localhost:5173,5174`）；Banner `link_url` 限 `http(s)://`。
- **依赖**：Phase 1。
- **验收标准**：对照 TECH §5.6 权限矩阵逐接口验证——公开读无需 token；写/后台接口 401（缺失/过期）、403（越权）、422（校验）、429（登录限流）正确；富文本 XSS 清洗生效；手机号加密存储且列表脱敏；登录失败 5 次/10 分钟锁定；`/docs` OpenAPI 完整。

### Phase 3 — 前台官网（`frontend/`，前端）
- **目标**：React + Tailwind 响应式企业官网，对齐 UIUX §3 与前台原型。
- **范围（页面/模块）**：
  - 设计系统：Tailwind 注入 UIUX §2 前台令牌（主色 `#7D5A3C`、衬线标题、暖米底、24×24 线性 SVG 图标、断点 1024/768）。
  - 全局框架：固定毛玻璃导航（5 主导航 + 二级）、页脚（深胡桃底 + 备案）。
  - 首页六区：Hero 轮播 / 品牌实力 / 产品系列入口 / 新闻动态 / 招商·招聘入口（读 API）。
  - 产品中心（`/products`）：系列 + 适用空间 chips 筛选、关键词搜索、每页 6 条、详情模态（材质/尺寸/风格/空间、**无价格**）、留言快捷入口。
  - 新闻（企业新闻/行业资讯 Tabs + 详情）、关于我们（关于栖木家具/发展历程/品牌介绍/联系我们含留言表单，PIPL 隐私同意前置）。
  - 案例展示、招聘入口（**读 cases/recruit API**，已确认后台可维护）。
- **依赖**：Phase 0 + 设计系统；数据先用 MSW/本地 Mock 并行，Phase 2 完成后切真实 API。
- **验收标准**：UIUX §8 走查清单全过——首屏 <2s、响应式断点正确、键盘可达/focus 环、图标无 emoji、双端令牌不混用；产品可按系列/空间筛选并查看详情（无价格）；留言提交后后台可查；关于栖木家具展示真实内容。

### Phase 4 — 后台管理系统（`admin/`，前端）
- **目标**：React + Ant Design 运营后台，对齐 UIUX §4 与后台原型。
- **范围（模块）**：
  - 登录与鉴权：JWT 登录、失败 5 次/10 分钟锁定提示、未登录跳登录、退出清会话。
  - 布局壳：Sider（暗色 `#0F1B2D`）+ Header + Content；菜单按 `can(role,perm)` 过滤；无权限占位卡。
  - 仪表盘：4 统计卡 + 近 6 月发布趋势柱状图 + 待办提醒（脱敏）。
  - 内容管理：产品（列表/分类/系列 Tabs）、新闻、轮播图/Banner、企业资料（发展历程/品牌/联系/关于栖木家具）、案例、招聘——CRUD + 富文本 + 图片上传。
  - 互动管理：留言/询价（筛选 + 表格手机号脱敏 + 详情抽屉 + 标记处理/回复）。
  - 系统管理：用户管理（增改/停用/重置密码）、角色与权限（预设模板，无逐权限勾选；超管不可删/降权）。
- **依赖**：Phase 0 + Phase 2 接口（可先搭壳 + Mock，接口就绪后联调）。
- **验收标准**：UIUX §8.5/§8.6 全过——三类角色按预设权限登录并操作；越权接口 403；产品/新闻/Banner/企业资料/案例/招聘 CRUD 即时反映前台；留言可处理标记、手机号脱敏（PIPL）；登录失败锁定；图片上传可用（jpg/png/webp ≤2MB）。

### Phase 5 — 联调、测试、内容初始化与上线（三端）
- **目标**：三端贯通、质量门禁通过、真实内容填充、可部署。
- **范围**：
  - 联调：对照 TECH §9.3 checklist 逐接口联调（响应信封、分页、401/403/422、XSS、加密脱敏、限流）。
  - 测试：后端 pytest（鉴权/软删/加密脱敏/上传校验/统一信封）；前端 vitest + Testing Library 冒烟；契约测试（响应结构齐备）。
  - 内容初始化：【手动操作】业务方提供真实企业资料/产品/新闻素材，在后台录入。
  - 部署：Docker Compose 或传统 Nginx；环境变量注入；`/health` 探针；SQLite 备份或切 PostgreSQL。
- **依赖**：Phase 2/3/4 完成。
- **验收标准**：PRD §9.2 Definition of Done 全量通过；生产环境变量就位；健康检查通过；隐私政策 + 告知同意落地（PIPL 合规前置）。

---

## 3. 阶段执行顺序与依赖关系

```
Phase 0 初始化
   ├─► Phase 1 数据层 ──► Phase 2 后端核心 API ──┐
   │                  (并行)                      ├──► Phase 5 联调/测试/上线
   ├─► Phase 3 前台官网 (可 Mock 并行) ───────────┤
   │                                             │
   └─► Phase 4 后台系统 (壳可并行, 接口就绪后联调) ┘
```

| 阶段 | 执行方 | 紧前依赖 | 可并行项 |
|---|---|---|---|
| Phase 0 | 开发 | — | — |
| Phase 1 | 开发（后端） | Phase 0 | 可与 Phase 3 前端骨架并行 |
| Phase 2 | 开发（后端） | Phase 1 | 与 Phase 3 / Phase 4 页面并行 |
| Phase 3 | 开发（前端） | Phase 0 | 与 Phase 1/2 并行（先 Mock） |
| Phase 4 | 开发（前端） | Phase 0 + Phase 2 接口 | 与 Phase 2/3 并行（先壳后联调） |
| Phase 5 | 开发 + 【手动操作】 | Phase 2/3/4 | — |

---

## 4. 前后端并行开发策略（源自 TECH §9.1）

1. **契约先行**：TECH §5 API 契约 + DB §4 数据模型已锁定为基线，FastAPI 自动产出 OpenAPI（`/docs`）即契约源。
2. **前端 Mock 并行**：`frontend/` 与 `admin/` 用 MSW 或本地 mock 数据按契约并行开发页面，不阻塞后端进度。
3. **后端实现**：按 Phase 2 分层（Router→Service→Repository）完成业务逻辑、校验、鉴权。
4. **联调收口**：Phase 5 以 OpenAPI 为基线逐接口联调，前后端对照 TECH §9.3 checklist。
5. **时间线建议**：Phase 0（1–2 天）→ Phase 1（2–3 天）∥ Phase 3 骨架 → Phase 2（后端核心，与 Phase 3/4 页面并行）→ Phase 4 → Phase 5（联调上线）。

---

## 5. 验收标准汇总

### 5.1 总验收（PRD §9.2 Definition of Done）
- **前台**：5 主导航 + 二级全部可访问；产品可按系列/空间筛选并查看详情（含材质/尺寸/风格/空间，无价格）；新闻列表与详情可用；留言表单提交后后台可查；案例/招聘按约定呈现；关于栖木家具真实内容且后台可维护。
- **后台**：三类角色按预设权限登录并操作；产品/新闻/Banner/企业资料/案例/招聘 CRUD 即时反映前台；留言可处理标记；越权接口 403。
- **质量**：统一响应与错误码落地；图片上传可用；手机号脱敏与 PIPL 合规满足；移动端响应式通过。

### 5.2 分阶段验收（详见各 Phase「验收标准」）
- Phase 1：15 表 + 种子 + 超管可鉴权。
- Phase 2：TECH §5.6 矩阵逐接口通过；401/403/422/429 正确；XSS/链接白名单生效；加密脱敏生效；登录限流生效。
- Phase 3：UIUX §8 前台走查全过；首屏 <2s；无价格展示；留言可入库。
- Phase 4：UIUX §8.5/§8.6 后台走查全过；RBAC 预设生效；脱敏生效。
- Phase 5：PRD §9.2 全量通过；部署健康检查通过；PIPL 隐私政策落地。

---

## 6. 【手动操作】清单与详细指引

> 以下需用户亲自执行（涉及外部账号、密钥、环境安装或业务资源），我无法代为操作。

### ① 安装 Node.js 与 pnpm 【手动操作】
- 安装 Node.js ≥18（推荐 20 LTS）：https://nodejs.org/
- 安装 pnpm ≥8（二选一）：
  ```bash
  npm install -g pnpm        # 方式一
  corepack enable && corepack prepare pnpm@8 --activate   # 方式二（Node 自带）
  ```
- 验证：`node -v` / `pnpm -v`。

### ② 创建 GitHub 仓库并初始化 Git 【手动操作】
- 在 GitHub 新建仓库（建议 `qimu-website`），**不要**勾选自动生成 README/.gitignore（我们已有）。
- 本地：
  ```bash
  cd dev_master
  git init
  git branch -M main
  git remote add origin <你的仓库URL>
  # 补充 .gitignore 后提交首个基线
  ```
- 分支策略：`main`（生产可发布）/ `dev`（集成）/ `feature/*`（需求 PR 合入 dev）。禁止直推 main。
- 建议：GitHub 仓库 Settings → Branches 为 `main` 开启分支保护。

### ③ 生成并配置生产密钥环境变量 【手动操作】
- 以下值用于 `backend/.env`（**切勿提交 `.env`**，仅提交 `.env.example`）：
  - `JWT_SECRET`：强随机串（如 `openssl rand -hex 32`）。
  - `PHONE_ENCRYPT_KEY`：32 字节 base64（AES-256-GCM 密钥），如 `openssl rand -base64 32`。
  - `INIT_ADMIN_PASSWORD`：强随机串（首次部署后务必在后台修改）。
  - `DATABASE_URL`：开发 `sqlite:///./app.db`；生产切 PostgreSQL 时填 `postgresql+asyncpg://user:pass@host/db`。
- 生产环境强烈建议用密钥管理服务（KMS）托管上述密钥。

### ④ 部署环境准备（上线阶段）【手动操作】
- 选择 Docker Compose 或传统 Nginx + gunicorn/uvicorn（PRD §8 无强容器化要求，按运维能力定）。
- 准备服务器/域名；若面向公网需完成 **ICP 备案**与公安备案（站点配置 `beian` 字段对应）。

### ⑤ 业务素材收集（内容初始化阶段）【手动操作】
- 需业务方提供：真实企业介绍（关于栖木家具）、产品图与规格、新闻稿、联系方式、案例/招聘文案。
- 由用户在后台逐项录入（Phase 5 内容初始化）。

---

## 7. 风险与已知待办

- **文档已自洽项（无需再决策）**：DB 文档附录 ①②③（`case:manage`/`recruit:manage`/`upload:manage` 权限）已按确认项落种子；手机号加密、软删除语义、登录限流均已固化。
- **PRD §0 与 TECH/DB 的示例冲突**：PRD §0 将案例/招聘列为「静态、后台不维护」，但 TECH 决策② + DB 已升级为后台 CRUD。**本方案按已确认的决策③采用后台可维护**，以 DB 库表为准。
- **SQLite 上限**（PRD §9.3）：高频写入/高并发场景建议切 PostgreSQL，已通过 `DATABASE_URL` + Alembic 配置预留。
- **PIPL 合规**：上线前隐私政策与告知同意必须落地，否则存在合规风险（PRD §8.1）。
- **多实例扩展**：本期单实例无状态 JWT 可行；多实例需引入 Redis 共享限流（生产建议，见 TECH §11）。

---

## 8. 下一步

本方案为**纯实施规划，不含任何代码**。待你确认后，按 **Phase 0 → 1 → 2 → 3/4（并行）→ 5** 顺序推进。

**请回复「已确认，执行下一步」，我将从 Phase 0 第 1 步（创建后端虚拟环境）开始实际执行。**
