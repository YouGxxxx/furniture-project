"""栖木家具官网 API 应用入口。

【功能说明】
- 加载配置、CORS、统一异常处理器；
- 注册业务路由（app/routers/*）；
- 提供 /api/v1/health 健康检查（Phase 2G 将扩展 DB 探活）。
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import (
    BizError,
    biz_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.routers import auth as auth_router
from app.routers import rbac as rbac_router

app = FastAPI(title=settings.PROJECT_NAME)

# CORS：开发期允许前台(5173) / 后台(5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 统一异常处理器（业务码信封）
app.add_exception_handler(BizError, biz_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

# 注册路由
app.include_router(auth_router.router)
app.include_router(rbac_router.router)


@app.get(f"{settings.API_V1_PREFIX}/health")
def health():
    return {"code": 0, "message": "ok", "data": {"status": "healthy"}}
