# 栖木家具官网

企业家居品牌官网项目，参考 [蓝鸟家居 lanniao.cn](https://www.lanniao.cn)。采用 **前端展示站 + 后台管理 + 后端 API** 三端分离架构。

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端展示（frontend/） | Vite + React 18 + TypeScript + TailwindCSS（HashRouter 单页应用） |
| 后台管理（admin/） | Vite + React 18 + TypeScript + Ant Design 5 + Zustand + React Query |
| 后端 API（backend/） | FastAPI + SQLAlchemy 2.0(异步) + Alembic + Pydantic v2 |
| 数据库 | 开发期 SQLite，生产可平滑切换 PostgreSQL（通过 `DATABASE_URL` 注入） |

## 目录结构

```
frontend/   官网前台（产品/新闻/案例/招聘/关于我们/联系我们）
admin/      后台管理（内容/互动/系统，RBAC 权限控制）
backend/    FastAPI 服务（认证 RBAC / 产品新闻 / 轮播资料 / 留言 / 上传 / 案例招聘 / 健康）
docs/       需求与方案文档
prototype/  设计原型参考
```

## 快速开始

### 1. 后端（FastAPI）

```bash
cd backend
python -m venv venv && source venv/Scripts/activate     # Windows：venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                    # 按需修改 JWT_SECRET / 数据库 等
alembic upgrade head                                    # 建表（Alembic 迁移为建表唯一来源）
python -m app.db.init_db                                # 写入种子数据（角色/权限/管理员/示例内容）
uvicorn app.main:app --reload --port 8000
```

- API 根路径前缀：`/api/v1`
- 健康检查：`GET /api/v1/health`（含数据库探活）
- 默认管理员账号见 `.env` 的 `INIT_ADMIN_USER` / `INIT_ADMIN_PASSWORD`
- 上传文件通过 `/media/<uuid>` 静态访问，由 `main.py` 挂载 `StaticFiles`

### 2. 前端展示（frontend/）

```bash
cd frontend
npm install
npm run dev          # 开发 (http://localhost:5173)，已配置代理 /api -> :8000
npm run build        # 产物输出 dist/
```

### 3. 后台管理（admin/）

```bash
cd admin
npm install
npm run dev          # 开发 (http://localhost:5174)
npm run build        # 产物输出 dist/
```

后台通过 `.env` 的 `VITE_API_BASE` 指向后端（默认 `http://localhost:8000/api/v1`），后端 CORS 已允许 5173/5174。

## 关键约定

- **统一响应信封**：所有接口返回 `{ code, message, data }`，`code===0` 为成功；业务错误码见 `backend/app/core/exceptions.py`。
- **认证**：登录获 JWT（7 天有效，无 refresh），请求头 `Authorization: Bearer <token>`；登录失败 5 次/10 分钟触发限流（429 / 10002）。
- **权限(RBAC)**：`super_admin` 拥有全部权限；其余角色按 `permissions` 列表校验。后台菜单按当前用户权限动态过滤。
- **数据安全**：`users.phone` / `messages.phone` 以 AES-256-GCM 密文存储，列表脱敏 `138****8888`，仅授权角色可见明文。
- **内容软删除**：内容类资源以 `status` 翻转（1↔0）软删，不物理删除。
- **XSS 防护**：富文本经 `bleach` 白名单清洗（保留 `strong/em` 等语义标签，移除事件处理器与危险标签）。

## 说明

- 案例 / 招聘为本期后台可维护的静态配置型内容（归属 `case:manage` / `recruit:manage` 权限）。
- 关于我们 / 企业资料页（about/brand/history/contact）与站点配置为后台可编辑内容。
