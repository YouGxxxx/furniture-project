"""招聘入口请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel, Field


class RecruitCreate(BaseModel):
    category: str = Field(..., pattern=r"^(social|campus)$", description="社会招聘/校园招聘")
    title: str = Field(..., min_length=1, max_length=120)
    content: str | None = None
    contact: str | None = Field(None, max_length=200)
    sort: int = 0
    status: int = Field(1, description="1 上线 / 0 下线")


class RecruitUpdate(BaseModel):
    category: str | None = Field(None, pattern=r"^(social|campus)$")
    title: str | None = Field(None, max_length=120)
    content: str | None = None
    contact: str | None = Field(None, max_length=200)
    sort: int | None = None
    status: int | None = None


class RecruitOut(BaseModel):
    id: int
    category: str
    title: str
    content: str | None = None
    contact: str | None = None
    sort: int
    status: int
