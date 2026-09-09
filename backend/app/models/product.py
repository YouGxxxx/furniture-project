"""产品域模型：分类(适用空间) / 系列 / 产品。"""
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


class ProductCategory(Base):
    """产品分类 / 适用空间（自关联树，本期仅一层）。"""

    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True
    )
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("ix_pc_status", "status"),
        Index("ix_pc_parent_id", "parent_id"),
        CheckConstraint("status IN (0,1)", name="ck_pc_status"),
    )


class ProductSeries(Base):
    """产品系列（胡桃禮 / 如意春 / 禧YUE ...）。"""

    __tablename__ = "product_series"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("ix_ps_status", "status"),
        CheckConstraint("status IN (0,1)", name="ck_ps_status"),
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50))
    series_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_series.id", ondelete="RESTRICT"), nullable=True
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_categories.id", ondelete="RESTRICT"), nullable=True
    )
    material: Mapped[str | None] = mapped_column(String(50))
    size: Mapped[str | None] = mapped_column(String(100))
    style: Mapped[str | None] = mapped_column(String(50))
    applicable_space: Mapped[str | None] = mapped_column(String(50))  # 派生冗余
    description: Mapped[str | None] = mapped_column(Text)
    cover_image: Mapped[str | None] = mapped_column(String(255))
    gallery: Mapped[str | None] = mapped_column(Text)  # JSON 数组
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    __table_args__ = (
        Index("ix_products_series_category_status", "series_id", "category_id", "status"),
        Index("ix_products_sort", "sort"),
        CheckConstraint("status IN (0,1)", name="ck_products_status"),
    )
