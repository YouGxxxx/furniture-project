"""依赖注入：当前用户解析与 RBAC 权限校验。

【功能说明】
- get_current_user：解析 Bearer token -> 查库得到 CurrentUser（含角色与权限）。
- require_perm(perm)：依赖工厂，校验当前用户是否拥有某权限；super_admin 短路放行。
"""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.core.exceptions import BizError, ErrorCode
from app.core.security import decode_access_token
from app.db.session import AsyncSessionLocal
from app.models.rbac import Permission, Role, RolePermission, User

bearer = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    """请求上下文中的当前用户（与 ORM 解耦，便于权限判断）。"""

    id: int
    username: str
    real_name: str | None
    email: str | None
    role_id: int
    role_code: str
    role_name: str
    permissions: list[str]
    status: int


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> CurrentUser:
    """解析并校验当前登录用户。

    失败情形：
        - 未带 token            -> 10001 / 401
        - token 无效或过期       -> 由 decode_access_token 抛 10001 / 401
        - 用户不存在            -> 10001 / 401
        - 账号已停用(status=0)   -> 10007 / 403
    """
    if creds is None or not creds.credentials:
        raise BizError(ErrorCode.CREDENTIAL_ERROR, "未提供认证令牌", 401)

    payload = decode_access_token(creds.credentials)
    user_id = int(payload.get("sub"))

    async with AsyncSessionLocal() as session:
        user = (
            await session.scalars(select(User).where(User.id == user_id))
        ).first()
        if not user:
            raise BizError(ErrorCode.CREDENTIAL_ERROR, "用户不存在", 401)
        if user.status == 0:
            raise BizError(ErrorCode.ACCOUNT_DISABLED, "账号已停用", 403)

        role = (
            await session.scalars(select(Role).where(Role.id == user.role_id))
        ).first()
        role_code = role.code if role else ""
        role_name = role.name if role else ""

        # 通过 role_permissions 中间表取出该角色拥有的权限码
        perm_ids = (
            await session.scalars(
                select(RolePermission.permission_id).where(
                    RolePermission.role_id == user.role_id
                )
            )
        ).all()
        perms = (
            await session.scalars(
                select(Permission.code).where(Permission.id.in_(perm_ids))
            )
        ).all()

    return CurrentUser(
        id=user.id,
        username=user.username,
        real_name=user.real_name,
        email=user.email,
        role_id=user.role_id,
        role_code=role_code,
        role_name=role_name,
        permissions=list(perms),
        status=user.status,
    )


def require_perm(perm: str):
    """生成 RBAC 依赖：要求当前用户拥有 perm 权限。

    super_admin 角色短路放行（TECH §5.6）；其余角色缺失权限返回 10004 / 403。
    """

    async def checker(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current.role_code == "super_admin":
            return current
        if perm not in current.permissions:
            raise BizError(ErrorCode.PERMISSION_DENIED, "权限不足", 403)
        return current

    return checker
