"""企业资料 / 站点配置请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel, Field


class AboutUpdate(BaseModel):
    """更新某 key 的企业资料（富文本）。"""
    title: str | None = Field(None, max_length=120)
    content: str | None = None
    images: str | None = None  # JSON 数组字符串


class SiteSettingsUpdate(BaseModel):
    """批量更新站点配置：{key: value} 映射（value 为字符串）。"""
    settings: dict[str, str] = Field(..., min_length=1, description="key->value，value 为字符串")


class SiteSettingOut(BaseModel):
    key: str
    value: object | None = None  # 已 json.loads 解析后的值
