"""产品域请求/响应模型：产品 / 分类(适用空间) / 系列。"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


# ---------- 产品分类（适用空间） ----------

class ProductCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    parent_id: int | None = None
    sort: int = 0
    status: int = Field(1, description="1 启用 / 0 停用")


class ProductCategoryUpdate(BaseModel):
    name: str | None = None
    parent_id: int | None = None
    sort: int | None = None
    status: int | None = None


class ProductCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    parent_id: int | None = None
    sort: int
    status: int


# ---------- 产品系列 ----------

class ProductSeriesCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    sort: int = 0
    status: int = Field(1, description="1 启用 / 0 停用")


class ProductSeriesUpdate(BaseModel):
    name: str | None = None
    sort: int | None = None
    status: int | None = None


class ProductSeriesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    sort: int
    status: int


# ---------- 产品 ----------

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    series_id: int = Field(..., description="所属系列 id")
    category_id: int = Field(..., description="适用空间(分类) id")
    code: str | None = Field(None, max_length=50)
    material: str | None = Field(None, max_length=50)
    size: str | None = Field(None, max_length=100)
    style: str | None = Field(None, max_length=50)
    description: str | None = None
    cover_image: str | None = Field(None, max_length=255)
    gallery: str | None = None  # JSON 数组字符串
    sort: int = 0
    status: int = Field(1, description="1 上线 / 0 下线")


class ProductUpdate(BaseModel):
    name: str | None = Field(None, max_length=120)
    series_id: int | None = None
    category_id: int | None = None
    code: str | None = Field(None, max_length=50)
    material: str | None = Field(None, max_length=50)
    size: str | None = Field(None, max_length=100)
    style: str | None = Field(None, max_length=50)
    description: str | None = None
    cover_image: str | None = Field(None, max_length=255)
    gallery: str | None = None
    sort: int | None = None
    status: int | None = None


class ProductOut(BaseModel):
    """产品对外对象（含派生字段 series_name / category_name / applicable_space）。"""
    id: int
    name: str
    code: str | None = None
    series_id: int | None = None
    series_name: str | None = None
    category_id: int | None = None
    category_name: str | None = None
    material: str | None = None
    size: str | None = None
    style: str | None = None
    applicable_space: str | None = None
    description: str | None = None
    cover_image: str | None = None
    gallery: str | None = None
    sort: int
    status: int


class BatchStatusIn(BaseModel):
    """批量上下线：{ids:[], status}。"""
    ids: list[int] = Field(..., min_length=1)
    status: int = Field(..., description="1 上线 / 0 下线")


class BatchSortIn(BaseModel):
    """批量排序：[{id, sort}]。"""
    orders: list[dict] = Field(..., min_length=1)
