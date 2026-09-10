"""文件上传路由：POST /admin/upload 上传；DELETE /admin/files 删已传文件。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.deps import CurrentUser, require_perm
from app.core.responses import success
from app.schemas.upload import FileDeleteIn, UploadOut
from app.services import upload_service

router = APIRouter(prefix="/api/v1", tags=["upload"])


@router.post("/admin/upload", response_model=None)
async def upload_file(
    file: UploadFile = File(...),
    _: CurrentUser = Depends(require_perm("upload:manage")),
):
    url = await upload_service.save_upload(file)
    return success(UploadOut(url=url).model_dump())


@router.delete("/admin/files")
async def delete_file(body: FileDeleteIn, _: CurrentUser = Depends(require_perm("upload:manage"))):
    upload_service.delete_file(body.url)
    return success(None)
