"""案例展示模块路由：公开读 + 后台 CRUD（about:manage，决策②）。

【权限说明】本期案例/招聘归入内容编辑范畴，权限沿用 about:manage（content_editor 可维护）。
如后续需独立管控，新增 case:manage/recruit:manage 并放入预设模板即可，此处接口不变。
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_perm
from app.core.pagination import pagination_params
from app.core.responses import success
from app.schemas.cases import CaseCreate, CaseOut, CaseUpdate
from app.services import static_service

router = APIRouter(prefix="/api/v1", tags=["cases"])


# ---------- 公开读 ----------

@router.get("/cases")
async def list_cases(params: dict = Depends(pagination_params)):
    """公开：仅上线案例，分页返回。"""
    return success(await static_service.list_cases(only_enabled=True, params=params))


@router.get("/cases/{cid}", response_model=None)
async def get_case(cid: int):
    return success(await static_service.get_case(cid))


# ---------- 后台 CRUD（about:manage） ----------

@router.post("/admin/cases")
async def create_case(body: CaseCreate, _: CurrentUser = Depends(require_perm("case:manage"))):
    return success({"id": await static_service.create_case(body)})


@router.put("/admin/cases/{cid}")
async def update_case(cid: int, body: CaseUpdate, _: CurrentUser = Depends(require_perm("case:manage"))):
    await static_service.update_case(cid, body)
    return success(None)


@router.delete("/admin/cases/{cid}")
async def delete_case(cid: int, _: CurrentUser = Depends(require_perm("case:manage"))):
    """软删除（status=0）。"""
    await static_service.delete_case(cid)
    return success(None)
