"""文件上传业务逻辑（TECH §8.1）。

【存储】本地 backend/uploads/，经 /media 静态映射对外提供；文件名 UUID 重命名防覆盖与路径穿越。
【限制】格式 jpg/png/webp，单文件 ≤ MAX_UPLOAD_MB（默认 2MB）；不符抛 10005。
【删除】DELETE /admin/files?url= 校验 URL 落在 UPLOAD_DIR 内（防穿越）后删物理文件，无独立文件表。
"""
from __future__ import annotations

import os
import uuid

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import BizError, ErrorCode

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BACKEND_DIR, settings.UPLOAD_DIR)
MEDIA_PREFIX = "/media"


def _ensure_dir() -> None:
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _check_file(file: UploadFile) -> tuple[str, bytes]:
    """校验扩展名与大小，返回 (扩展名, 文件字节)。不合规抛 10005。"""
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in settings.allowed_extensions_list:
        raise BizError(
            ErrorCode.FILE_ERROR,
            f"不支持的文件格式，仅允许：{settings.allowed_extensions_list}",
            400,
        )
    content = file.file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise BizError(ErrorCode.FILE_ERROR, f"文件超过大小上限 {settings.MAX_UPLOAD_MB}MB", 400)
    return ext, content


async def save_upload(file: UploadFile) -> str:
    """保存上传文件，返回可访问 URL（/media/...）。"""
    ext, content = _check_file(file)
    _ensure_dir()
    new_name = f"{uuid.uuid4().hex}.{ext}"
    abs_path = os.path.join(UPLOAD_DIR, new_name)
    with open(abs_path, "wb") as f:
        f.write(content)
    return f"{MEDIA_PREFIX}/{new_name}"


def delete_file(url: str) -> None:
    """按 /media/... URL 删除物理文件；防路径穿越（须落在 UPLOAD_DIR 内）。"""
    if not url or not url.startswith(MEDIA_PREFIX + "/"):
        raise BizError(ErrorCode.FILE_ERROR, "非法的文件 URL", 400)
    rel = url[len(MEDIA_PREFIX) + 1:].lstrip("/")
    abs_path = os.path.normpath(os.path.join(UPLOAD_DIR, rel))
    base = os.path.normpath(UPLOAD_DIR)
    # 防穿越：解析后必须仍在 UPLOAD_DIR 内
    if not (abs_path == base or abs_path.startswith(base + os.sep)):
        raise BizError(ErrorCode.FILE_ERROR, "非法文件路径（禁止越权访问）", 400)
    if not os.path.isfile(abs_path):
        raise BizError(ErrorCode.NOT_FOUND, "文件不存在", 404)
    os.remove(abs_path)
