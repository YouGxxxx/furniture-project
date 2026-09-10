"""轮播图路由：公开读（启用+时间窗） + 后台 CRUD（banner:manage）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_perm
from app.core.responses import success
from app.schemas.banner import BannerCreate, BannerOut, BannerUpdate
from app.services import content_service

router = APIRouter(prefix="/api/v1", tags=["banner"])


@router.get("/banners")
async def list_banners():
    items = [BannerOut.model_validate(b).model_dump() for b in await content_service.list_banners()]
    return success({"items": items, "total": len(items)})


@router.post("/admin/banners")
async def create_banner(body: BannerCreate, _: CurrentUser = Depends(require_perm("banner:manage"))):
    return success({"id": await content_service.create_banner(body)})


@router.put("/admin/banners/{bid}")
async def update_banner(bid: int, body: BannerUpdate, _: CurrentUser = Depends(require_perm("banner:manage"))):
    await content_service.update_banner(bid, body)
    return success(None)


@router.delete("/admin/banners/{bid}")
async def delete_banner(bid: int, _: CurrentUser = Depends(require_perm("banner:manage"))):
    await content_service.delete_banner(bid)
    return success(None)
