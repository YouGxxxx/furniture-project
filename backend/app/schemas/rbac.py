"""RBAC（用户/角色/权限）请求/响应模型。"""
from __future__ import annotations

from pydantic import BaseModel, Field


# ---------- 用户 ----------

class UserCreate(BaseModel):
    """新增用户请求体。"""

    username: str = Field(..., min_length=2, max_length=50, description="登录名（唯一）")
    password: str = Field(..., min_length=6, max_length=128, description="初始密码（≥6 位）")
    real_name: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=120)
    phone: str | None = Field(None, max_length=20)
    role_id: int = Field(..., description="角色 id")
    status: int = Field(1, description="1 启用 / 0 停用")


class UserUpdate(BaseModel):
    """编辑用户请求体（全部可选）。"""

    real_name: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=120)
    phone: str | None = Field(None, max_length=20)
    role_id: int | None = None
    status: int | None = Field(None, description="1 启用 / 0 停用（软删）")
    password: str | None = Field(None, min_length=6, max_length=128, description="留空则不修改密码")


class RoleCreate(BaseModel):
    """新增角色请求体。"""

    name: str = Field(..., min_length=1, max_length=50)
    code: str = Field(..., min_length=1, max_length=50, description="角色编码（唯一，如 editor）")
    description: str | None = Field(None, max_length=200)


class RoleUpdate(BaseModel):
    """编辑角色请求体（可选）。"""

    name: str | None = None
    description: str | None = None


class RoleOut(BaseModel):
    """角色对外对象（含权限码列表）。"""

    id: int
    name: str
    code: str
    description: str | None = None
    permissions: list[str] = []


class PermissionOut(BaseModel):
    """权限对外对象。"""

    id: int
    name: str | None = None
    code: str
    module: str | None = None


class RolePermissionAssign(BaseModel):
    """角色授权：提交模板名（如 super_admin/content_editor/operator）或显式权限码列表。"""

    template: str | None = Field(None, description="预设模板名")
    permissions: list[str] | None = Field(None, description="显式权限码列表")
