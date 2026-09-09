"""轮播图与企业资料 / 站点配置模型。"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class Banner(Base):
    """首页轮播图。"""

    __tablename__ = "banners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str | None] = mapped_column(String(120))
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    link_url: Mapped[str | None] = mapped_column(String(255))  # 限 http(s)://
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    start_time: Mapped[datetime | None] = mapped_column(DateTime)
    end_time: Mapped[datetime | None] = mapped_column(DateTime)

    __table_args__ = (
        Index("ix_banners_status_sort", "status", "sort"),
        CheckConstraint("status IN (0,1)", name="ck_banners_status"),
    )


class AboutPage(Base):
    """企业资料（EAV 键值型，key 唯一）。

    key: history(发展历程) / brand(品牌介绍) / contact(联系我们) / about(关于栖木家具)
    """

    __tablename__ = "about_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    title: Mapped[str | None] = mapped_column(String(120))
    content: Mapped[str | None] = mapped_column(Text)
    images: Mapped[str | None] = mapped_column(Text)  # JSON 数组
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )


class SiteSetting(Base):
    """站点配置（EAV 键值型，key 唯一）。

    key: company_name / phone / email / address / social / beian
    """

    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    value: Mapped[str | None] = mapped_column(Text)
