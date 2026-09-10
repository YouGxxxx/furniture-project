"""案例展示请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    cover_image: str | None = Field(None, max_length=255)
    summary: str | None = Field(None, max_length=300)
    content: str | None = None
    sort: int = 0
    status: int = Field(1, description="1 上线 / 0 下线")


class CaseUpdate(BaseModel):
    title: str | None = Field(None, max_length=120)
    cover_image: str | None = Field(None, max_length=255)
    summary: str | None = Field(None, max_length=300)
    content: str | None = None
    sort: int | None = None
    status: int | None = None


class CaseOut(BaseModel):
    id: int
    title: str
    cover_image: str | None = None
    summary: str | None = None
    content: str | None = None
    sort: int
    status: int
