"""企业资料 / 站点配置路由：公开读 + 后台更新（about:manage）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_perm
from app.core.responses import success
from app.schemas.about import AboutUpdate, SiteSettingsUpdate
from app.services import content_service

router = APIRouter(prefix="/api/v1", tags=["about"])


@router.get("/about/{key}")
async def get_about(key: str):
    return success(await content_service.get_about(key))


@router.get("/site-settings")
async def get_site_settings():
    return success(await content_service.get_site_settings())


@router.put("/admin/about/{key}")
async def update_about(key: str, body: AboutUpdate, _: CurrentUser = Depends(require_perm("about:manage"))):
    await content_service.update_about(key, body)
    return success(None)


@router.put("/admin/site-settings")
async def update_site_settings(body: SiteSettingsUpdate, _: CurrentUser = Depends(require_perm("about:manage"))):
    await content_service.update_site_settings(body.settings)
    return success(None)
