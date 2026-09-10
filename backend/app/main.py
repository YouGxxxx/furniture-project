"""栖木家具官网 API 应用入口。

【功能说明】
- 加载配置、CORS、统一异常处理器；
- 注册业务路由（app/routers/*）：认证/权限、产品/新闻、轮播/企业资料/站点、
  留言询价、文件上传、案例/招聘、系统健康；
- 提供 /api/v1/health 健康检查（由 system 路由提供，含 DB 探活）。
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import (
    BizError,
    biz_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.services.upload_service import UPLOAD_DIR
from app.routers import about as about_router
from app.routers import auth as auth_router
from app.routers import banner as banner_router
from app.routers import cases as cases_router
from app.routers import message as message_router
from app.routers import news as news_router
from app.routers import products as product_router
from app.routers import rbac as rbac_router
from app.routers import recruit as recruit_router
from app.routers import system as system_router
from app.routers import upload as upload_router

app = FastAPI(title=settings.PROJECT_NAME)

# 上传文件静态服务：/media/<uuid>.<ext> 映射到 backend/uploads/ 目录
import os as _os

_os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=UPLOAD_DIR), name="media")

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

# 注册路由（顺序无关，各路由自带 /api/v1 前缀与独立 tag）
app.include_router(auth_router.router)
app.include_router(rbac_router.router)
app.include_router(product_router.router)
app.include_router(news_router.router)
app.include_router(banner_router.router)
app.include_router(about_router.router)
app.include_router(message_router.router)
app.include_router(upload_router.router)
app.include_router(cases_router.router)
app.include_router(recruit_router.router)
app.include_router(system_router.router)
