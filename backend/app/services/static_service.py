"""静态内容业务逻辑：案例(cases) / 招聘(recruit)，后台可维护（决策②）。

【删除语义】软删除（status=0），与内容类资源一致。
【权限】TECH §5.6/§11 待决策项：本期映射到 about:manage（content_editor 可维护）；
如后续需独立管控，新增 case:manage/recruit:manage 并纳入预设模板即可，此处接口不变。
"""
from __future__ import annotations

from sqlalchemy import func, select

from app.core.exceptions import BizError, ErrorCode
from app.core.pagination import paginated
from app.db.session import AsyncSessionLocal
from app.models.static_content import Case, Recruit


# ---------- 案例 cases ----------

async def list_cases(*, only_enabled=True, params=None) -> dict:
    async with AsyncSessionLocal() as s:
        conds = [Case.status == 1] if only_enabled else []
        total = await s.scalar(select(func.count()).select_from(Case).where(*conds))
        rows = (
            await s.scalars(
                select(Case).where(*conds).order_by(Case.sort, Case.id.desc())
                .offset(params["offset"]).limit(params["limit"])
            )
        ).all()
        items = [
            {"id": r.id, "title": r.title, "cover_image": r.cover_image,
             "summary": r.summary, "content": r.content, "sort": r.sort, "status": r.status}
            for r in rows
        ]
        return paginated(items, total or 0, params)


async def get_case(cid: int) -> dict:
    async with AsyncSessionLocal() as s:
        r = (await s.scalars(select(Case).where(Case.id == cid))).first()
        if not r:
            raise BizError(ErrorCode.NOT_FOUND, "案例不存在", 404)
        return {"id": r.id, "title": r.title, "cover_image": r.cover_image,
                "summary": r.summary, "content": r.content, "sort": r.sort, "status": r.status}


async def create_case(data) -> int:
    async with AsyncSessionLocal() as s:
        obj = Case(title=data.title, cover_image=data.cover_image, summary=data.summary,
                   content=data.content, sort=data.sort, status=data.status)
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj.id


async def update_case(cid: int, data) -> None:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Case).where(Case.id == cid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "案例不存在", 404)
        for f in ("title", "cover_image", "summary", "content", "sort", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        await s.commit()


async def delete_case(cid: int) -> None:
    """软删除：status=0。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Case).where(Case.id == cid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "案例不存在", 404)
        obj.status = 0
        await s.commit()


# ---------- 招聘 recruit ----------

async def list_recruits(*, only_enabled=True, category=None, params=None) -> dict:
    async with AsyncSessionLocal() as s:
        conds = [Recruit.status == 1] if only_enabled else []
        if category:
            conds.append(Recruit.category == category)
        total = await s.scalar(select(func.count()).select_from(Recruit).where(*conds))
        rows = (
            await s.scalars(
                select(Recruit).where(*conds).order_by(Recruit.sort, Recruit.id.desc())
                .offset(params["offset"]).limit(params["limit"])
            )
        ).all()
        items = [
            {"id": r.id, "category": r.category, "title": r.title, "content": r.content,
             "contact": r.contact, "sort": r.sort, "status": r.status}
            for r in rows
        ]
        return paginated(items, total or 0, params)


async def get_recruit(rid: int) -> dict:
    async with AsyncSessionLocal() as s:
        r = (await s.scalars(select(Recruit).where(Recruit.id == rid))).first()
        if not r:
            raise BizError(ErrorCode.NOT_FOUND, "招聘不存在", 404)
        return {"id": r.id, "category": r.category, "title": r.title, "content": r.content,
                "contact": r.contact, "sort": r.sort, "status": r.status}


async def create_recruit(data) -> int:
    async with AsyncSessionLocal() as s:
        obj = Recruit(category=data.category, title=data.title, content=data.content,
                      contact=data.contact, sort=data.sort, status=data.status)
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj.id


async def update_recruit(rid: int, data) -> None:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Recruit).where(Recruit.id == rid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "招聘不存在", 404)
        for f in ("category", "title", "content", "contact", "sort", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        await s.commit()


async def delete_recruit(rid: int) -> None:
    """软删除：status=0。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Recruit).where(Recruit.id == rid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "招聘不存在", 404)
        obj.status = 0
        await s.commit()
