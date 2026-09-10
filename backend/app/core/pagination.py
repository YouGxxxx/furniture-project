"""分页参数依赖与响应构造（统一 {items,total,page,page_size} 结构，TECH §5.4）。"""
from __future__ import annotations

from typing import Any

from fastapi import Query


def pagination_params(
    page: int = Query(1, ge=1, description="页码，从 1 起"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数，上限 100"),
):
    """FastAPI 查询依赖：解析分页参数并返回 offset/limit。"""
    size = min(page_size, 100)
    return {"page": page, "page_size": size, "offset": (page - 1) * size, "limit": size}


def paginated(items: list[Any], total: int, params: dict) -> dict:
    """构造统一分页响应 data 字段。"""
    return {
        "items": items,
        "total": total,
        "page": params["page"],
        "page_size": params["page_size"],
    }
