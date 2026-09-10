"""新闻域请求/响应模型：新闻 / 新闻分类。"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class NewsCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    type: str | None = Field(None, max_length=20)
    sort: int = 0
    status: int = Field(1, description="1 启用 / 0 停用")


class NewsCategoryUpdate(BaseModel):
    name: str | None = None
    type: str | None = Field(None, max_length=20)
    sort: int | None = None
    status: int | None = None


class NewsCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    type: str | None = None
    sort: int
    status: int


class NewsCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category_id: int | None = None
    cover_image: str | None = Field(None, max_length=255)
    summary: str | None = Field(None, max_length=300)
    content: str | None = None
    author: str | None = Field(None, max_length=50)
    status: int = Field(1, description="1 发布 / 0 草稿")


class NewsUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    category_id: int | None = None
    cover_image: str | None = Field(None, max_length=255)
    summary: str | None = Field(None, max_length=300)
    content: str | None = None
    author: str | None = Field(None, max_length=50)
    status: int | None = None


class NewsOut(BaseModel):
    """新闻对外对象（含分类名；views 预留默认 0，前台不展示）。"""
    id: int
    title: str
    category_id: int | None = None
    category_name: str | None = None
    cover_image: str | None = None
    summary: str | None = None
    content: str | None = None
    author: str | None = None
    status: int
    published_at: str | None = None
    views: int = 0
