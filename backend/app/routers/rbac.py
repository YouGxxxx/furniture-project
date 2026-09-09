"""RBAC 路由：/api/v1/admin/users | roles | permissions """
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.deps import CurrentUser, require_perm
from app.core.responses import success
from app.db.session import AsyncSessionLocal
from app.models.rbac import Permission, Role, RolePermission
from app.schemas.auth import UserOut
from app.schemas.convert import user_out_list
from app.schemas.rbac import (
    PermissionOut,
    RoleCreate,
    RoleOut,
    RolePermissionAssign,
    RoleUpdate,
    UserCreate,
    UserUpdate,
)
from app.services import rbac_service

router = APIRouter(prefix="/api/v1/admin", tags=["rbac"])


# ---------- 用户管理（rbac:user:manage） ----------

@router.get("/users")
async def get_users(_: CurrentUser = Depends(require_perm("rbac:user:manage"))):
    users = await rbac_service.list_users()
    async with AsyncSessionLocal() as s:
        roles = {r.id: r.name for r in (await s.scalars(select(Role))).all()}
    items = [user_out_list(u, roles.get(u.role_id, "")).model_dump() for u in users]
    return success({"items": items, "total": len(items)})


@router.post("/users")
async def create_user(
    body: UserCreate, _: CurrentUser = Depends(require_perm("rbac:user:manage"))
):
    user = await rbac_service.create_user(body)
    return success({"id": user.id})


@router.put("/users/{user_id}")
async def update_user(
    user_id: int, body: UserUpdate, _: CurrentUser = Depends(require_perm("rbac:user:manage"))
):
    await rbac_service.update_user(user_id, body)
    return success(None)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int, _: CurrentUser = Depends(require_perm("rbac:user:manage"))
):
    await rbac_service.delete_user(user_id)
    return success(None)


# ---------- 角色管理（rbac:role:manage） ----------

@router.get("/roles")
async def get_roles(_: CurrentUser = Depends(require_perm("rbac:role:manage"))):
    roles = await rbac_service.list_roles()
    async with AsyncSessionLocal() as s:
        rows = (
            await s.execute(
                select(RolePermission.role_id, Permission.code).join(
                    Permission, Permission.id == RolePermission.permission_id
                )
            )
        ).all()
    perm_map: dict[int, list[str]] = {}
    for role_id, code in rows:
        perm_map.setdefault(role_id, []).append(code)
    items = [
        RoleOut(
            id=r.id,
            name=r.name,
            code=r.code,
            description=r.description,
            permissions=perm_map.get(r.id, []),
        ).model_dump()
        for r in roles
    ]
    return success({"items": items, "total": len(items)})


@router.post("/roles")
async def create_role(
    body: RoleCreate, _: CurrentUser = Depends(require_perm("rbac:role:manage"))
):
    role = await rbac_service.create_role(body)
    return success({"id": role.id})


@router.put("/roles/{role_id}")
async def update_role(
    role_id: int, body: RoleUpdate, _: CurrentUser = Depends(require_perm("rbac:role:manage"))
):
    await rbac_service.update_role(role_id, body)
    return success(None)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int, _: CurrentUser = Depends(require_perm("rbac:role:manage"))
):
    await rbac_service.delete_role(role_id)
    return success(None)


# ---------- 权限基线（rbac:role:manage） ----------

@router.get("/permissions")
async def get_permissions(_: CurrentUser = Depends(require_perm("rbac:role:manage"))):
    perms = await rbac_service.list_permissions()
    items = [
        PermissionOut(id=p.id, name=p.name, code=p.code, module=p.module).model_dump()
        for p in perms
    ]
    return success({"items": items, "total": len(items)})


# ---------- 角色授权（预设模板） ----------

@router.post("/roles/{role_id}/permissions")
async def assign_permissions(
    role_id: int,
    body: RolePermissionAssign,
    _: CurrentUser = Depends(require_perm("rbac:role:manage")),
):
    codes = await rbac_service.assign_role_permissions(role_id, body.template, body.permissions)
    return success({"permissions": codes})
