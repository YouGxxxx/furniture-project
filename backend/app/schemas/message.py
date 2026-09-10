"""留言 / 询价请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel, Field, constr


class MessageCreate(BaseModel):
    """前台公开提交：留言 / 询价。phone 经 pattern 校验，privacy_agreed 必为 true。"""
    name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., pattern=r"^1[3-9]\d{9}$", description="中国大陆手机号")
    email: str | None = Field(None, max_length=120)
    type: str = Field(..., pattern=r"^(message|inquiry)$", description="留言/询价")
    product_id: int | None = None
    content: str = Field(..., min_length=1, max_length=1000)
    privacy_agreed: bool = Field(..., description="隐私同意，须为 true（否则 10006）")


class MessageHandle(BaseModel):
    """后台处理/回复：标记已处理 + 回复内容。"""
    status: int | None = Field(None, description="1 已处理 / 0 未处理")
    reply: str | None = Field(None, max_length=2000, description="回复内容")
    handler_id: int | None = None


class MessageOut(BaseModel):
    """列表项：phone 已脱敏为 138****8888。"""
    id: int
    name: str
    phone_masked: str
    email: str | None = None
    type: str
    product_id: int | None = None
    content: str
    status: int
    reply: str | None = None
    created_at: str | None = None


class MessageDetailOut(BaseModel):
    """详情：授权角色可见解密后的明文手机号（仅后台 message:view）。"""
    id: int
    name: str
    phone: str  # 解密明文
    email: str | None = None
    type: str
    product_id: int | None = None
    content: str
    status: int
    reply: str | None = None
    handler_id: int | None = None
    created_at: str | None = None
    handled_at: str | None = None
