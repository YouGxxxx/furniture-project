"""认证相关请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """登录请求体。"""

    username: str = Field(..., min_length=1, description="登录名")
    password: str = Field(..., min_length=1, description="明文密码（HTTPS 传输）")


class RoleMin(BaseModel):
    """用户所属角色的精简信息。"""

    id: int
    code: str
    name: str


class UserOut(BaseModel):
    """对外用户对象（含角色与权限，不含密码/手机号明文）。

    注：登录态(role/permissions)与列表态(role_id/role_name/status)字段按需填，均为可选。
    """

    id: int
    username: str
    real_name: str | None = None
    email: str | None = None
    role: RoleMin | None = None
    role_id: int | None = None
    role_name: str | None = None
    status: int | None = None
    permissions: list[str] = []


class TokenResponse(BaseModel):
    """登录成功返回：token + 当前用户。"""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
