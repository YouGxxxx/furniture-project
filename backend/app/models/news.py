"""新闻域模型：新闻分类 / 新闻。"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class NewsCategory(Base):
    """新闻分类（企业新闻 / 行业资讯）。

    type 预留扩展：news=新闻分类 / case=案例分类。
    """

    __tablename__ = "news_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str | None] = mapped_column(String(20))
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("ix_nc_status", "status"),
        CheckConstraint("status IN (0,1)", name="ck_nc_status"),
    )


class News(Base):
    __tablename__ = "news"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("news_categories.id", ondelete="RESTRICT"), nullable=True
    )
    cover_image: Mapped[str | None] = mapped_column(String(255))
    summary: Mapped[str | None] = mapped_column(String(300))
    content: Mapped[str | None] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0 草稿 / 1 发布
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    __table_args__ = (
        Index("ix_news_cat_status_pub", "category_id", "status", "published_at"),
        CheckConstraint("status IN (0,1)", name="ck_news_status"),
    )
