"""文件上传请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel


class UploadOut(BaseModel):
    """上传成功返回可访问 URL（经 /media 静态映射）。"""
    url: str


class FileDeleteIn(BaseModel):
    """删除已传文件：传入完整 /media/... URL。"""
    url: str
