"""初始化数据库：建表 + 种子数据。

执行方式（在 backend/ 目录，venv 激活后）：
    venv/Scripts/python -m app.db.init_db

- 依据 app.models 中所有表（Base.metadata）执行 create_all；
- SQLite 下自动开启外键约束（PRAGMA foreign_keys=ON）；
- 写入 DB 文档第 7 章种子（角色/权限/映射/分类/系列/新闻分类/站点/资料/超管）；
- 幂等：重复执行安全，已存在的数据跳过。
"""
from __future__ import annotations

import asyncio

from sqlalchemy import event

from app.core.config import settings
from app.db.base import Base, engine, utcnow
from app.db.seed_data import seed_all
from app.db.session import AsyncSessionLocal
from app.models import rbac, product, news, content, message, static_content  # noqa: F401 触发表注册


def _enable_sqlite_fk(dbapi_conn, _conn_record) -> None:
    """SQLite 默认关闭外键约束，需逐连接开启。"""
    if settings.DATABASE_URL.startswith("sqlite"):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()


async def init_db() -> None:
    # 注册 PRAGMA 监听（仅 SQLite 生效）
    if settings.DATABASE_URL.startswith("sqlite"):
        event.listen(engine.sync_engine, "connect", _enable_sqlite_fk)

    async with engine.begin() as conn:
        # create_all 不删除已存在表，安全可重复执行
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_all(session)

    # 输出摘要
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as session:
        tables = [
            ("角色", rbac.Role),
            ("权限", rbac.Permission),
            ("角色-权限映射", rbac.RolePermission),
            ("用户", rbac.User),
            ("产品分类", product.ProductCategory),
            ("产品系列", product.ProductSeries),
            ("产品", product.Product),
            ("新闻分类", news.NewsCategory),
            ("新闻", news.News),
            ("轮播图", content.Banner),
            ("企业资料", content.AboutPage),
            ("站点配置", content.SiteSetting),
            ("留言/询价", message.Message),
            ("案例", static_content.Case),
            ("招聘", static_content.Recruit),
        ]
        print("\n=== 栖木家具数据库初始化完成 ===")
        print(f"数据库: {settings.async_database_url}")
        print("表 / 记录数:")
        for label, model in tables:
            cnt = await session.scalar(select(func.count()).select_from(model))
            print(f"  - {label:10s} ({model.__tablename__:20s}): {cnt}")
        print("================================\n")


if __name__ == "__main__":
    asyncio.run(init_db())
