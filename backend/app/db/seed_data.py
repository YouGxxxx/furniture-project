"""初始化种子数据（幂等：已存在则跳过）。

种子内容严格对齐 DB 设计文档第 7 章。仅首次启动写入；重复执行安全。
"""
from __future__ import annotations

from sqlalchemy import func, select

from app.core.config import settings
from app.core.security import hash_password
from app.models.content import AboutPage, Banner, SiteSetting
from app.models.message import Message
from app.models.news import News, NewsCategory
from app.models.product import Product, ProductCategory, ProductSeries
from app.models.rbac import Permission, Role, RolePermission, User
from app.models.static_content import Case, Recruit

# 角色种子
ROLES = [
    ("超级管理员", "super_admin", "拥有全部权限，负责用户/角色管理、系统配置"),
    ("内容编辑", "content_editor", "维护产品、新闻、轮播、企业资料、案例、招聘等内容"),
    ("客服/运营", "operator", "查看并处理前台留言/询价，查看仪表盘"),
]

# 权限种子（18 个）
PERMISSIONS = [
    ("仪表盘查看", "dashboard:view", "dashboard"),
    ("产品查看", "product:view", "product"),
    ("产品新增", "product:create", "product"),
    ("产品编辑", "product:edit", "product"),
    ("产品删除", "product:delete", "product"),
    ("新闻查看", "news:view", "news"),
    ("新闻新增", "news:create", "news"),
    ("新闻编辑", "news:edit", "news"),
    ("新闻删除", "news:delete", "news"),
    ("轮播图管理", "banner:manage", "banner"),
    ("企业资料管理", "about:manage", "about"),
    ("案例管理", "case:manage", "case"),
    ("招聘管理", "recruit:manage", "recruit"),
    ("留言查看", "message:view", "message"),
    ("留言处理", "message:handle", "message"),
    ("用户管理", "rbac:user:manage", "rbac"),
    ("角色与权限管理", "rbac:role:manage", "rbac"),
    ("文件管理", "upload:manage", "upload"),
]

# 角色-权限映射（预设模板）
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "super_admin": [p[1] for p in PERMISSIONS],  # 全量
    "content_editor": [
        "dashboard:view",
        "product:view", "product:create", "product:edit", "product:delete",
        "news:view", "news:create", "news:edit", "news:delete",
        "banner:manage", "about:manage", "case:manage", "recruit:manage",
    ],
    "operator": ["dashboard:view", "message:view", "message:handle"],
}

PRODUCT_CATEGORIES = [
    ("卧室", 1), ("客厅", 2), ("餐厅", 3), ("书房", 4), ("茶室", 5), ("办公", 6),
]

PRODUCT_SERIES = [
    ("胡桃禮", 1), ("如意春", 2), ("禧YUE", 3), ("柏悦", 4),
    ("蓝宝嘉", 5), ("办公家具", 6), ("软体", 7),
]

NEWS_CATEGORIES = [
    ("企业新闻", "news", 1), ("行业资讯", "news", 2),
]

SITE_SETTINGS = [
    ("company_name", '"栖木家具有限公司"'),
    ("phone", '"400-000-0000"'),
    ("email", '"contact@qimu.cn"'),
    ("address", '"广东省佛山市顺德区xxx"'),
    ("social", '{"weibo":"","wechat":"","douyin":""}'),
    ("beian", '"粤ICP备xxxxxxxx号"'),
]

ABOUT_PAGES = [
    ("history", "发展历程", ""),
    ("brand", "品牌介绍", ""),
    ("contact", "联系我们", "{}"),
    ("about", "关于栖木家具", ""),
]


async def _count(session, model) -> int:
    return (await session.scalar(select(func.count()).select_from(model))) or 0


async def _seed_simple(session, model, rows, cols):
    """通用幂等批量插入（rows 为元组，cols 为字段名列表）。"""
    if await _count(session, model) > 0:
        return
    objs = [model(**dict(zip(cols, r))) for r in rows]
    session.add_all(objs)
    await session.flush()


async def seed_roles(session) -> None:
    await _seed_simple(session, Role, ROLES, ["name", "code", "description"])


async def seed_permissions(session) -> None:
    await _seed_simple(session, Permission, PERMISSIONS, ["name", "code", "module"])


async def seed_role_permissions(session) -> None:
    if await _count(session, RolePermission) > 0:
        return
    role_ids = dict(
        (r.code, r.id) for r in (await session.scalars(select(Role))).all()
    )
    perm_ids = dict(
        (p.code, p.id) for p in (await session.scalars(select(Permission))).all()
    )
    objs = []
    for role_code, perms in ROLE_PERMISSIONS.items():
        rid = role_ids.get(role_code)
        if rid is None:
            continue
        for pcode in perms:
            pid = perm_ids.get(pcode)
            if pid is not None:
                objs.append(RolePermission(role_id=rid, permission_id=pid))
    session.add_all(objs)
    await session.flush()


async def seed_product_categories(session) -> None:
    await _seed_simple(session, ProductCategory, PRODUCT_CATEGORIES, ["name", "sort"])


async def seed_product_series(session) -> None:
    await _seed_simple(session, ProductSeries, PRODUCT_SERIES, ["name", "sort"])


async def seed_news_categories(session) -> None:
    await _seed_simple(
        session, NewsCategory, NEWS_CATEGORIES, ["name", "type", "sort"]
    )


async def seed_site_settings(session) -> None:
    await _seed_simple(session, SiteSetting, SITE_SETTINGS, ["key", "value"])


async def seed_about_pages(session) -> None:
    await _seed_simple(session, AboutPage, ABOUT_PAGES, ["key", "title", "content"])


async def seed_superadmin(session) -> None:
    existing = await session.scalar(
        select(User).where(User.username == settings.INIT_ADMIN_USER)
    )
    if existing is not None:
        return
    super_role = await session.scalar(
        select(Role).where(Role.code == "super_admin")
    )
    role_id = super_role.id if super_role else 1
    session.add(
        User(
            username=settings.INIT_ADMIN_USER,
            password_hash=hash_password(settings.INIT_ADMIN_PASSWORD),
            real_name="超级管理员",
            email=None,
            phone=None,
            role_id=role_id,
            status=1,
        )
    )
    await session.flush()


async def seed_all(session) -> None:
    """按依赖顺序写入全部种子。"""
    await seed_roles(session)
    await seed_permissions(session)
    await seed_role_permissions(session)
    await seed_product_categories(session)
    await seed_product_series(session)
    await seed_news_categories(session)
    await seed_site_settings(session)
    await seed_about_pages(session)
    await seed_superadmin(session)
    await session.commit()
