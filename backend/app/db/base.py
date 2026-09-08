"""SQLAlchemy 异步引擎与声明基类。

Phase 1 的 ORM 模型（app/models/*）均继承 Base。
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。"""


_connect_args: dict = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite 异步下需允许跨线程（FastAPI 线程池），避免 "check_same_thread" 报错
    _connect_args = {"check_same_thread": False}

engine: AsyncEngine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    connect_args=_connect_args,
)
