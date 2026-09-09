"""静态内容模型（决策②：后台可维护）：案例 / 招聘。"""
from __future__ import annotations

from sqlalchemy import (
    CheckConstraint,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Case(Base):
    """新案例展示。"""

    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(255))
    summary: Mapped[str | None] = mapped_column(String(300))
    content: Mapped[str | None] = mapped_column(Text)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("ix_cases_status_sort", "status", "sort"),
        CheckConstraint("status IN (0,1)", name="ck_cases_status"),
    )


class Recruit(Base):
    """招聘入口。

    category: social=社会招聘 / campus=校园招聘。
    """

    __tablename__ = "recruit"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(20), nullable=False)  # social / campus
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    contact: Mapped[str | None] = mapped_column(String(200))
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("ix_recruit_status_category_sort", "status", "category", "sort"),
        CheckConstraint("category IN ('social','campus')", name="ck_recruit_category"),
        CheckConstraint("status IN (0,1)", name="ck_recruit_status"),
    )
