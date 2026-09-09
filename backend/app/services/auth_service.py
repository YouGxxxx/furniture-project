"""认证业务逻辑。"""
from __future__ import annotations

from sqlalchemy import select

from app.core.exceptions import BizError, ErrorCode
from app.core.security import (
    create_access_token,
    is_locked,
    record_failure,
    reset_failures,
    verify_password,
)
from app.db.base import utcnow
from app.db.session import AsyncSessionLocal
from app.models.rbac import Permission, Role, RolePermission, User


async def login(username: str, password: str) -> dict:
    """登录核心逻辑（含限流 + 密码校验 + 签发 token）。

    Returns: {"user": User, "role": Role, "perms": list, "token": str}
    Raises:
        BizError(10002, 429): 账号锁定
        BizError(10001, 401): 用户名或密码错误
        BizError(10007, 403): 账号已停用
    """
    key = f"login:{username}"
    if is_locked(key):
        raise BizError(ErrorCode.ACCOUNT_LOCKED, "账号已锁定，请 10 分钟后再试", 429)

    async with AsyncSessionLocal() as session:
        user = (
            await session.scalars(select(User).where(User.username == username))
        ).first()
        if not user or not verify_password(password, user.password_hash):
            record_failure(key)  # 记录失败（累计达到阈值即触发限流）
            # 第 5 次失败即触发锁定：记录后再次判断阈值
            if is_locked(key):
                raise BizError(
                    ErrorCode.ACCOUNT_LOCKED, "账号已锁定，请 10 分钟后再试", 429
                )
            raise BizError(ErrorCode.CREDENTIAL_ERROR, "用户名或密码错误", 401)

        if user.status == 0:
            raise BizError(ErrorCode.ACCOUNT_DISABLED, "账号已停用", 403)

        # 组装角色与权限
        role = (
            await session.scalars(select(Role).where(Role.id == user.role_id))
        ).first()
        role_code = role.code if role else ""
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

        # 登录成功：清失败计数 + 更新最后登录时间
        reset_failures(key)
        user.last_login_at = utcnow()
        await session.commit()

    return {
        "user": user,
        "role": role,
        "perms": list(perms),
        "token": create_access_token(user.id, role_code, list(perms)),
    }
