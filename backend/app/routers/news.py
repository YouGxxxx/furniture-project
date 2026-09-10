"""新闻模块路由：公开读（新闻/分类） + 后台 CRUD（news:create/edit/delete）。"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_perm
from app.core.pagination import pagination_params
from app.core.responses import success
from app.schemas.news import (
    NewsCategoryCreate,
    NewsCategoryOut,
    NewsCategoryUpdate,
    NewsCreate,
    NewsOut,
    NewsUpdate,
)
from app.services import news_service

router = APIRouter(prefix="/api/v1", tags=["news"])


@router.get("/news")
async def list_news(
    category_id: int | None = None,
    keyword: str | None = None,
    params: dict = Depends(pagination_params),
):
    data = await news_service.list_news(
        category_id=category_id, keyword=keyword, only_published=True, params=params
    )
    return success(data)


@router.get("/news/{nid}", response_model=None)
async def get_news(nid: int):
    return success(await news_service.get_news(nid))


@router.get("/news-categories")
async def list_news_categories():
    items = [NewsCategoryOut.model_validate(c).model_dump() for c in await news_service.list_categories()]
    return success({"items": items, "total": len(items)})


@router.post("/admin/news")
async def create_news(body: NewsCreate, _: CurrentUser = Depends(require_perm("news:create"))):
    return success({"id": await news_service.create_news(body)})


@router.put("/admin/news/{nid}")
async def update_news(nid: int, body: NewsUpdate, _: CurrentUser = Depends(require_perm("news:edit"))):
    await news_service.update_news(nid, body)
    return success(None)


@router.delete("/admin/news/{nid}")
async def delete_news(nid: int, _: CurrentUser = Depends(require_perm("news:delete"))):
    await news_service.delete_news(nid)
    return success(None)


@router.post("/admin/news-categories")
async def create_news_category(body: NewsCategoryCreate, _: CurrentUser = Depends(require_perm("news:create"))):
    return success({"id": (await news_service.create_category(body)).id})


@router.put("/admin/news-categories/{cid}")
async def update_news_category(cid: int, body: NewsCategoryUpdate, _: CurrentUser = Depends(require_perm("news:edit"))):
    await news_service.update_category(cid, body)
    return success(None)


@router.delete("/admin/news-categories/{cid}")
async def delete_news_category(cid: int, _: CurrentUser = Depends(require_perm("news:delete"))):
    await news_service.delete_category(cid)
    return success(None)
