"""ORM 对象 -> 响应模型 的转换工具。"""
from __future__ import annotations

from app.core.deps import CurrentUser
from app.models.rbac import Role, User
from app.schemas.auth import RoleMin, UserOut


def user_out_from_orm(user: User, role: Role, perms: list[str]) -> UserOut:
    """由 User ORM + Role + 权限码构造登录态 UserOut（含 role 与 permissions）。"""
    return UserOut(
        id=user.id,
        username=user.username,
        real_name=user.real_name,
        email=user.email,
        role=RoleMin(id=role.id, code=role.code, name=role.name),
        permissions=perms,
    )


def user_out_from_current(c: CurrentUser) -> UserOut:
    """由请求上下文 CurrentUser 构造 /auth/me 的 UserOut。"""
    return UserOut(
        id=c.id,
        username=c.username,
        real_name=c.real_name,
        email=c.email,
        role=RoleMin(id=c.role_id, code=c.role_code, name=c.role_name),
        permissions=c.permissions,
    )


def user_out_list(user: User, role_name: str) -> UserOut:
    """用户列表项（不含权限，含角色名与状态）。"""
    return UserOut(
        id=user.id,
        username=user.username,
        real_name=user.real_name,
        email=user.email,
        role_id=user.role_id,
        role_name=role_name,
        status=user.status,
    )
