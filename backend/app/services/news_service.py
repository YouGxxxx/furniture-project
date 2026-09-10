"""新闻域业务逻辑：新闻 / 新闻分类 的增删改查。

【删除语义】软删除（status=0）；新闻 status 含义：1 发布 / 0 草稿（TECH §4.2.3）。
【发布时间】发布(status=1)且无 published_at 时自动填充当前 UTC 时间。
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select

from app.core.clean import clean_html
from app.core.exceptions import BizError, ErrorCode
from app.core.pagination import paginated
from app.db.base import utcnow
from app.db.session import AsyncSessionLocal
from app.models.news import News, NewsCategory


# ---------- 新闻分类 ----------

async def list_categories() -> list[NewsCategory]:
    async with AsyncSessionLocal() as s:
        return list((await s.scalars(select(NewsCategory).order_by(NewsCategory.sort))).all())


async def create_category(data) -> NewsCategory:
    async with AsyncSessionLocal() as s:
        obj = NewsCategory(name=data.name, type=data.type, sort=data.sort, status=data.status)
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj


async def update_category(cid: int, data) -> NewsCategory:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(NewsCategory).where(NewsCategory.id == cid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "新闻分类不存在", 404)
        for f in ("name", "type", "sort", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        await s.commit()
        await s.refresh(obj)
        return obj


async def delete_category(cid: int) -> None:
    """物理删除新闻分类（RESTRICT：其子新闻须先迁移/软删）。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(NewsCategory).where(NewsCategory.id == cid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "新闻分类不存在", 404)
        used = await s.scalar(select(func.count()).select_from(News).where(News.category_id == cid))
        if used:
            raise BizError(ErrorCode.VALIDATION_ERROR, "该分类下仍有新闻，无法删除", 400)
        await s.delete(obj)
        await s.commit()


# ---------- 新闻 ----------

def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


async def list_news(*, category_id=None, keyword=None, only_published=True, params=None) -> dict:
    """公开读仅取已发布(status=1)且按 published_at 倒序；后台 only_published=False。"""
    async with AsyncSessionLocal() as s:
        conds = []
        if only_published:
            conds.append(News.status == 1)
        if category_id:
            conds.append(News.category_id == category_id)
        if keyword:
            conds.append(News.title.like(f"%{keyword}%"))

        total = await s.scalar(select(func.count()).select_from(News).where(*conds))
        rows = (
            await s.scalars(
                select(News)
                .where(*conds)
                .order_by(News.published_at.desc(), News.id.desc())
                .offset(params["offset"])
                .limit(params["limit"])
            )
        ).all()

        cat_ids = {r.category_id for r in rows if r.category_id}
        cat_map = {}
        if cat_ids:
            for x in (await s.scalars(select(NewsCategory).where(NewsCategory.id.in_(cat_ids)))).all():
                cat_map[x.id] = x.name

        items = [
            {
                "id": r.id, "title": r.title, "category_id": r.category_id,
                "category_name": cat_map.get(r.category_id), "cover_image": r.cover_image,
                "summary": r.summary, "content": r.content, "author": r.author,
                "status": r.status, "published_at": _iso(r.published_at), "views": r.views,
            }
            for r in rows
        ]
        return paginated(items, total or 0, params)


async def get_news(nid: int) -> dict:
    async with AsyncSessionLocal() as s:
        r = (await s.scalars(select(News).where(News.id == nid))).first()
        if not r:
            raise BizError(ErrorCode.NOT_FOUND, "新闻不存在", 404)
        cat_name = None
        if r.category_id:
            ct = (await s.scalars(select(NewsCategory).where(NewsCategory.id == r.category_id))).first()
            cat_name = ct.name if ct else None
        return {
            "id": r.id, "title": r.title, "category_id": r.category_id, "category_name": cat_name,
            "cover_image": r.cover_image, "summary": r.summary, "content": r.content,
            "author": r.author, "status": r.status, "published_at": _iso(r.published_at), "views": r.views,
        }


async def create_news(data) -> int:
    async with AsyncSessionLocal() as s:
        if data.category_id and not await s.scalar(select(NewsCategory.id).where(NewsCategory.id == data.category_id)):
            raise BizError(ErrorCode.NOT_FOUND, "新闻分类不存在", 400)
        published_at = None
        if data.status == 1:
            published_at = datetime.now(timezone.utc)
        obj = News(
            title=data.title, category_id=data.category_id, cover_image=data.cover_image,
            summary=data.summary, content=clean_html(data.content), author=data.author,
            status=data.status, published_at=published_at,
        )
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj.id


async def update_news(nid: int, data) -> None:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(News).where(News.id == nid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "新闻不存在", 404)
        if data.category_id is not None:
            if data.category_id and not await s.scalar(select(NewsCategory.id).where(NewsCategory.id == data.category_id)):
                raise BizError(ErrorCode.NOT_FOUND, "新闻分类不存在", 400)
        if data.status is not None and data.status == 1 and obj.published_at is None:
            obj.published_at = datetime.now(timezone.utc)
        for f in ("title", "category_id", "cover_image", "summary", "author", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        if data.content is not None:
            obj.content = clean_html(data.content)
        await s.commit()


async def delete_news(nid: int) -> None:
    """软删除：status=0（转草稿/下线）。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(News).where(News.id == nid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "新闻不存在", 404)
        obj.status = 0
        await s.commit()
