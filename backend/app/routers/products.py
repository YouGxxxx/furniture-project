"""产品模块路由：公开读（产品/分类/系列） + 后台 CRUD（product:manage）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_perm
from app.core.pagination import pagination_params
from app.core.responses import success
from app.schemas.product import (
    BatchSortIn,
    BatchStatusIn,
    ProductCategoryCreate,
    ProductCategoryOut,
    ProductCategoryUpdate,
    ProductCreate,
    ProductOut,
    ProductSeriesCreate,
    ProductSeriesOut,
    ProductSeriesUpdate,
    ProductUpdate,
)
from app.services import product_service

router = APIRouter(prefix="/api/v1", tags=["products"])


# ---------- 公开读 ----------

@router.get("/products")
async def list_products(
    series_id: int | None = None,
    category_id: int | None = None,
    keyword: str | None = None,
    params: dict = Depends(pagination_params),
):
    data = await product_service.list_products(
        series_id=series_id, category_id=category_id, keyword=keyword,
        only_enabled=True, params=params,
    )
    return success(data)


@router.get("/products/{pid}", response_model=None)
async def get_product(pid: int):
    return success(await product_service.get_product(pid))


@router.get("/product-categories")
async def list_categories():
    items = [ProductCategoryOut.model_validate(c).model_dump() for c in await product_service.list_categories()]
    return success({"items": items, "total": len(items)})


@router.get("/product-series")
async def list_series():
    items = [ProductSeriesOut.model_validate(s).model_dump() for s in await product_service.list_series()]
    return success({"items": items, "total": len(items)})


# ---------- 后台 CRUD（product:manage） ----------

@router.post("/admin/products")
async def create_product(body: ProductCreate, _: CurrentUser = Depends(require_perm("product:manage"))):
    return success({"id": await product_service.create_product(body)})


@router.put("/admin/products/{pid}")
async def update_product(pid: int, body: ProductUpdate, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.update_product(pid, body)
    return success(None)


@router.delete("/admin/products/{pid}")
async def delete_product(pid: int, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.delete_product(pid)
    return success(None)


@router.post("/admin/products/batch-status")
async def batch_status(body: BatchStatusIn, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.batch_status(body.ids, body.status)
    return success(None)


@router.post("/admin/products/batch-sort")
async def batch_sort(body: BatchSortIn, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.batch_sort(body.orders)
    return success(None)


# 分类（适用空间）

@router.post("/admin/product-categories")
async def create_category(body: ProductCategoryCreate, _: CurrentUser = Depends(require_perm("product:manage"))):
    return success({"id": (await product_service.create_category(body)).id})


@router.put("/admin/product-categories/{cid}")
async def update_category(cid: int, body: ProductCategoryUpdate, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.update_category(cid, body)
    return success(None)


@router.delete("/admin/product-categories/{cid}")
async def delete_category(cid: int, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.delete_category(cid)
    return success(None)


# 系列

@router.post("/admin/product-series")
async def create_series(body: ProductSeriesCreate, _: CurrentUser = Depends(require_perm("product:manage"))):
    return success({"id": (await product_service.create_series(body)).id})


@router.put("/admin/product-series/{sid}")
async def update_series(sid: int, body: ProductSeriesUpdate, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.update_series(sid, body)
    return success(None)


@router.delete("/admin/product-series/{sid}")
async def delete_series(sid: int, _: CurrentUser = Depends(require_perm("product:manage"))):
    await product_service.delete_series(sid)
    return success(None)
