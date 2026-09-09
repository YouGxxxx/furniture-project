"""RBAC 业务逻辑：用户/角色/权限 的增删改查与授权。"""
from __future__ import annotations

from sqlalchemy import delete, func, select

from app.core.exceptions import BizError, ErrorCode
from app.core.security import hash_password
from app.db.seed_data import ROLE_PERMISSIONS  # 预设模板（与种子一致）
from app.db.session import AsyncSessionLocal
from app.models.rbac import Permission, Role, RolePermission, User


# ---------- 用户 ----------

async def list_users() -> list[User]:
    async with AsyncSessionLocal() as s:
        return list((await s.scalars(select(User).order_by(User.id))).all())


async def create_user(data) -> User:
    async with AsyncSessionLocal() as s:
        # 用户名唯一校验
        exists = await s.scalar(
            select(func.count()).select_from(User).where(User.username == data.username)
        )
        if exists:
            raise BizError(ErrorCode.VALIDATION_ERROR, "用户名已存在", 400)
        # 角色存在校验
        role = (await s.scalars(select(Role).where(Role.id == data.role_id))).first()
        if not role:
            raise BizError(ErrorCode.NOT_FOUND, "角色不存在", 400)
        user = User(
            username=data.username,
            password_hash=hash_password(data.password),
            real_name=data.real_name,
            email=data.email,
            phone=data.phone,
            role_id=data.role_id,
            status=data.status,
        )
        s.add(user)
        await s.commit()
        await s.refresh(user)
        return user


async def update_user(user_id: int, data) -> User:
    async with AsyncSessionLocal() as s:
        user = (await s.scalars(select(User).where(User.id == user_id))).first()
        if not user:
            raise BizError(ErrorCode.NOT_FOUND, "用户不存在", 404)
        # 超级管理员保护：不可停用 / 不可降权
        role = (await s.scalars(select(Role).where(Role.id == user.role_id))).first()
        if role and role.code == "super_admin":
            if (data.status is not None and data.status == 0) or (
                data.role_id is not None and data.role_id != user.role_id
            ):
                raise BizError(
                    ErrorCode.PERMISSION_DENIED, "超级管理员不可停用或降权", 403
                )
        if data.real_name is not None:
            user.real_name = data.real_name
        if data.email is not None:
            user.email = data.email
        if data.phone is not None:
            user.phone = data.phone
        if data.role_id is not None:
            user.role_id = data.role_id
        if data.status is not None:
            user.status = data.status
        if data.password:
            user.password_hash = hash_password(data.password)
        await s.commit()
        await s.refresh(user)
        return user


async def delete_user(user_id: int) -> None:
    """软删除：status=0（停用）。超级管理员不可删。"""
    async with AsyncSessionLocal() as s:
        user = (await s.scalars(select(User).where(User.id == user_id))).first()
        if not user:
            raise BizError(ErrorCode.NOT_FOUND, "用户不存在", 404)
        role = (await s.scalars(select(Role).where(Role.id == user.role_id))).first()
        if role and role.code == "super_admin":
            raise BizError(ErrorCode.PERMISSION_DENIED, "超级管理员不可删除", 403)
        user.status = 0
        await s.commit()


# ---------- 角色 ----------

async def list_roles() -> list[Role]:
    async with AsyncSessionLocal() as s:
        return list((await s.scalars(select(Role).order_by(Role.id))).all())


async def create_role(data) -> Role:
    async with AsyncSessionLocal() as s:
        exists = await s.scalar(
            select(func.count()).select_from(Role).where(Role.code == data.code)
        )
        if exists:
            raise BizError(ErrorCode.VALIDATION_ERROR, "角色编码已存在", 400)
        role = Role(name=data.name, code=data.code, description=data.description)
        s.add(role)
        await s.commit()
        await s.refresh(role)
        return role


async def update_role(role_id: int, data) -> Role:
    async with AsyncSessionLocal() as s:
        role = (await s.scalars(select(Role).where(Role.id == role_id))).first()
        if not role:
            raise BizError(ErrorCode.NOT_FOUND, "角色不存在", 404)
        if data.name is not None:
            role.name = data.name
        if data.description is not None:
            role.description = data.description
        await s.commit()
        await s.refresh(role)
        return role


async def delete_role(role_id: int) -> None:
    """删除角色（硬删，role_permissions 级联清理）；超级管理员不可删；有用户时拒绝。"""
    async with AsyncSessionLocal() as s:
        role = (await s.scalars(select(Role).where(Role.id == role_id))).first()
        if not role:
            raise BizError(ErrorCode.NOT_FOUND, "角色不存在", 404)
        if role.code == "super_admin":
            raise BizError(ErrorCode.PERMISSION_DENIED, "超级管理员角色不可删除", 403)
        user_cnt = await s.scalar(
            select(func.count()).select_from(User).where(User.role_id == role_id)
        )
        if user_cnt:
            raise BizError(ErrorCode.VALIDATION_ERROR, "该角色下仍有用户，无法删除", 400)
        await s.delete(role)
        await s.commit()


async def list_permissions() -> list[Permission]:
    async with AsyncSessionLocal() as s:
        return list((await s.scalars(select(Permission).order_by(Permission.id))).all())


async def assign_role_permissions(
    role_id: int, template: str | None, permissions: list[str] | None
) -> list[str]:
    """按预设模板名或显式权限码列表，授予角色整套权限（先清后写）。"""
    async with AsyncSessionLocal() as s:
        role = (await s.scalars(select(Role).where(Role.id == role_id))).first()
        if not role:
            raise BizError(ErrorCode.NOT_FOUND, "角色不存在", 404)
        # 解析目标权限码
        if template:
            if template not in ROLE_PERMISSIONS:
                raise BizError(ErrorCode.VALIDATION_ERROR, f"未知模板: {template}", 400)
            target_codes = ROLE_PERMISSIONS[template]
        elif permissions:
            target_codes = permissions
        else:
            raise BizError(
                ErrorCode.VALIDATION_ERROR, "template 与 permissions 至少填一个", 400
            )

        # 校验权限码均存在
        valid = set((await s.scalars(select(Permission.code))).all())
        invalid = [c for c in target_codes if c not in valid]
        if invalid:
            raise BizError(ErrorCode.VALIDATION_ERROR, f"无效权限码: {invalid}", 400)

        # 先清后写
        await s.execute(
            delete(RolePermission).where(RolePermission.role_id == role_id)
        )
        rows = (await s.execute(select(Permission.code, Permission.id))).all()
        code2id = {r.code: r.id for r in rows}
        for code in target_codes:
            s.add(RolePermission(role_id=role_id, permission_id=code2id[code]))
        await s.commit()
        return target_codes
