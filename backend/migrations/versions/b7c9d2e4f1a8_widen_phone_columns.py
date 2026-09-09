"""widen phone columns for AES-256-GCM ciphertext

Revision ID: b7c9d2e4f1a8
Revises: 63eee2fbb8ad
Create Date: 2026-09-09 16:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c9d2e4f1a8'
down_revision: Union[str, None] = '63eee2fbb8ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """将 users.phone 与 messages.phone 由 String(20) 扩为 String(255)。

    AES-256-GCM 密文约 52+ 字符，String(20) 装不下。
    SQLite 不支持 ALTER COLUMN 直接改类型，必须用 batch 重建表。
    """
    # users.phone：原可为空（Mapped[str | None]）
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('phone',
            type_=sa.String(length=255),
            existing_type=sa.String(length=20),
            existing_nullable=True)

    # messages.phone：原非空（Mapped[str]，nullable=False）
    with op.batch_alter_table('messages') as batch_op:
        batch_op.alter_column('phone',
            type_=sa.String(length=255),
            existing_type=sa.String(length=20),
            existing_nullable=False)


def downgrade() -> None:
    """回滚：将两列缩回 String(20)。

    注意：若已写入超过 20 字符的密文，回滚会截断/失败，属预期保护。
    """
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('phone',
            type_=sa.String(length=20),
            existing_type=sa.String(length=255),
            existing_nullable=True)

    with op.batch_alter_table('messages') as batch_op:
        batch_op.alter_column('phone',
            type_=sa.String(length=20),
            existing_type=sa.String(length=255),
            existing_nullable=False)
