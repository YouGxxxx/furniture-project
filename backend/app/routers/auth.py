"""认证路由：/api/v1/auth/* """
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import settings
from app.core.deps import CurrentUser, get_current_user
from app.core.responses import success
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.schemas.convert import user_out_from_current, user_out_from_orm
from app.services import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login")
async def login(body: LoginRequest):
    """登录：成功返回 token 与当前用户。"""
    result = await auth_service.login(body.username, body.password)
    user_out = user_out_from_orm(result["user"], result["role"], result["perms"])
    return success(
        TokenResponse(
            access_token=result["token"],
            expires_in=settings.JWT_EXPIRE_SECONDS,
            user=user_out,
        ).model_dump()
    )


@router.post("/logout")
async def logout(current: CurrentUser = Depends(get_current_user)):
    """登出：服务端无状态，仅返回确认（客户端清除 token）。"""
    return success(None)


@router.get("/me")
async def me(current: CurrentUser = Depends(get_current_user)):
    """获取当前登录用户信息。"""
    return success(user_out_from_current(current).model_dump())
