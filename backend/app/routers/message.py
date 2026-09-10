"""留言 / 询价路由：公开提交 + 后台列表/详情(解密)/处理。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, require_perm
from app.core.pagination import pagination_params
from app.core.responses import success
from app.schemas.message import MessageCreate, MessageDetailOut, MessageHandle, MessageOut
from app.services import message_service

router = APIRouter(prefix="/api/v1", tags=["message"])


@router.post("/messages")
async def create_message(body: MessageCreate):
    """前台公开提交（隐私同意校验在 service 内：未勾选抛 10006）。"""
    return success({"id": await message_service.create_message(body)})


@router.get("/admin/messages")
async def list_messages(
    status: int | None = Query(None, description="0 未处理 / 1 已处理"),
    type: str | None = Query(None, pattern="^(message|inquiry)$"),
    params: dict = Depends(pagination_params),
    _: CurrentUser = Depends(require_perm("message:view")),
):
    data = await message_service.list_messages(params, status=status, type=type)
    return success(data)


@router.get("/admin/messages/{mid}", response_model=None)
async def get_message_detail(mid: int, _: CurrentUser = Depends(require_perm("message:view"))):
    detail = await message_service.get_message_detail(mid)
    return success(MessageDetailOut(**detail).model_dump())


@router.put("/admin/messages/{mid}")
async def handle_message(mid: int, body: MessageHandle, _: CurrentUser = Depends(require_perm("message:handle"))):
    await message_service.handle_message(mid, body)
    return success(None)
