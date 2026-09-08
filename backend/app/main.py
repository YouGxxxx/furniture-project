"""栖木家具官网 API 应用入口。

Phase 0.2 骨架：加载配置、CORS、健康检查。
后续 Phase 1/2 将挂载数据库初始化与业务路由（app/routers/*）。
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{settings.API_V1_PREFIX}/health")
def health():
    return {"code": 0, "message": "ok", "data": {"status": "healthy"}}
