"""系统路由：健康检查（Phase 2G）。含 DB 探活（SELECT 1）。"""
from __future__ import annotations

from fastapi import APIRouter

from app.core.responses import success
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

router = APIRouter(prefix="/api/v1", tags=["system"])


@router.get("/health")
async def health():
    """健康检查：返回 ok 并探活数据库连通性。

    统一信封：{code:0, message:"ok", data:{db:"ok"|"error"}}
    若数据库不可达，db 标记为 error，但 HTTP 仍返回 200，便于网关按 code 判断。
    """
    db_status = "ok"
    try:
        async with AsyncSessionLocal() as s:
            await s.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
    return success({"status": "ok", "db": db_status})
