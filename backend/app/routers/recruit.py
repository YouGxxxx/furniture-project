"""招聘入口模块路由：公开读 + 后台 CRUD（about:manage，决策②）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_perm
from app.core.pagination import pagination_params
from app.core.responses import success
from app.schemas.recruit import RecruitCreate, RecruitOut, RecruitUpdate
from app.services import static_service

router = APIRouter(prefix="/api/v1", tags=["recruit"])


# ---------- 公开读 ----------

@router.get("/recruits")
async def list_recruits(
    category: str | None = None,
    params: dict = Depends(pagination_params),
):
    """公开：仅上线招聘；可按 social/campus 过滤。"""
    return success(await static_service.list_recruits(only_enabled=True, category=category, params=params))


@router.get("/recruits/{rid}", response_model=None)
async def get_recruit(rid: int):
    return success(await static_service.get_recruit(rid))


# ---------- 后台 CRUD（about:manage） ----------

@router.post("/admin/recruits")
async def create_recruit(body: RecruitCreate, _: CurrentUser = Depends(require_perm("recruit:manage"))):
    return success({"id": await static_service.create_recruit(body)})


@router.put("/admin/recruits/{rid}")
async def update_recruit(rid: int, body: RecruitUpdate, _: CurrentUser = Depends(require_perm("recruit:manage"))):
    await static_service.update_recruit(rid, body)
    return success(None)


@router.delete("/admin/recruits/{rid}")
async def delete_recruit(rid: int, _: CurrentUser = Depends(require_perm("recruit:manage"))):
    """软删除（status=0）。"""
    await static_service.delete_recruit(rid)
    return success(None)
