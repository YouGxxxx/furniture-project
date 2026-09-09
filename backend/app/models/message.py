"""互动模型：留言 / 询价。"""
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


class Message(Base):
    """前台留言 / 询价。

    phone 为 AES-256-GCM 密文；列表脱敏 138****8888，仅授权角色可见明文。
    """

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)  # AES-256-GCM 密文
    email: Mapped[str | None] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # message / inquiry
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0 未处理 / 1 已处理
    reply: Mapped[str | None] = mapped_column(Text)
    handler_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    handled_at: Mapped[datetime | None] = mapped_column(DateTime)

    __table_args__ = (
        Index("ix_messages_status_type_created", "status", "type", "created_at"),
        CheckConstraint("type IN ('message','inquiry')", name="ck_messages_type"),
        CheckConstraint("status IN (0,1)", name="ck_messages_status"),
    )
