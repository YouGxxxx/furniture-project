"""轮播图请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel, Field


class BannerCreate(BaseModel):
    title: str | None = Field(None, max_length=120)
    image_url: str = Field(..., max_length=255)
    link_url: str | None = Field(None, max_length=255, description="限 http(s)://")
    sort: int = 0
    status: int = Field(1, description="1 启用 / 0 停用")
    start_time: str | None = None  # ISO 字符串，由 service 解析
    end_time: str | None = None


class BannerUpdate(BaseModel):
    title: str | None = Field(None, max_length=120)
    image_url: str | None = Field(None, max_length=255)
    link_url: str | None = Field(None, max_length=255)
    sort: int | None = None
    status: int | None = None
    start_time: str | None = None
    end_time: str | None = None


class BannerOut(BaseModel):
    id: int
    title: str | None = None
    image_url: str
    link_url: str | None = None
    sort: int
    status: int
    start_time: str | None = None
    end_time: str | None = None
