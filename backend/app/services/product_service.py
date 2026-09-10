"""产品域业务逻辑：产品 / 分类(适用空间) / 系列 的增删改查。

【删除语义】内容类资源 DELETE 一律软删除（status=0），不物理删、不触发外键 RESTRICT（TECH §4.3）。
【派生字段】applicable_space 由 category_id 对应分类名派生，仅作展示/检索冗余。
"""
from __future__ import annotations

from sqlalchemy import func, select

from app.core.clean import clean_html
from app.core.exceptions import BizError, ErrorCode
from app.core.pagination import paginated
from app.db.session import AsyncSessionLocal
from app.models.product import Product, ProductCategory, ProductSeries


# ---------- 产品分类（适用空间） ----------

async def list_categories() -> list[ProductCategory]:
    async with AsyncSessionLocal() as s:
        return list((await s.scalars(select(ProductCategory).order_by(ProductCategory.sort))).all())


async def get_category(cid: int) -> ProductCategory:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(ProductCategory).where(ProductCategory.id == cid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "分类不存在", 404)
        return obj


async def create_category(data) -> ProductCategory:
    async with AsyncSessionLocal() as s:
        obj = ProductCategory(name=data.name, parent_id=data.parent_id, sort=data.sort, status=data.status)
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj


async def update_category(cid: int, data) -> ProductCategory:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(ProductCategory).where(ProductCategory.id == cid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "分类不存在", 404)
        for f in ("name", "parent_id", "sort", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        await s.commit()
        await s.refresh(obj)
        return obj


async def delete_category(cid: int) -> None:
    """物理删除分类（受 RESTRICT 保护：其子产品须先迁移/软删）。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(ProductCategory).where(ProductCategory.id == cid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "分类不存在", 404)
        used = await s.scalar(
            select(func.count()).select_from(Product).where(Product.category_id == cid)
        )
        if used:
            raise BizError(ErrorCode.VALIDATION_ERROR, "该分类下仍有产品，无法删除", 400)
        await s.delete(obj)
        await s.commit()


# ---------- 产品系列 ----------

async def list_series() -> list[ProductSeries]:
    async with AsyncSessionLocal() as s:
        return list((await s.scalars(select(ProductSeries).order_by(ProductSeries.sort))).all())


async def create_series(data) -> ProductSeries:
    async with AsyncSessionLocal() as s:
        obj = ProductSeries(name=data.name, sort=data.sort, status=data.status)
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj


async def update_series(sid: int, data) -> ProductSeries:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(ProductSeries).where(ProductSeries.id == sid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "系列不存在", 404)
        for f in ("name", "sort", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        await s.commit()
        await s.refresh(obj)
        return obj


async def delete_series(sid: int) -> None:
    """物理删除系列（受 RESTRICT 保护）。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(ProductSeries).where(ProductSeries.id == sid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "系列不存在", 404)
        used = await s.scalar(
            select(func.count()).select_from(Product).where(Product.series_id == sid)
        )
        if used:
            raise BizError(ErrorCode.VALIDATION_ERROR, "该系列下仍有产品，无法删除", 400)
        await s.delete(obj)
        await s.commit()


# ---------- 产品 ----------

async def list_products(*, series_id=None, category_id=None, keyword=None,
                        only_enabled=True, params=None) -> dict:
    """公开读仅取上线(status=1)；后台管理传 only_enabled=False 看全部。"""
    async with AsyncSessionLocal() as s:
        conds = []
        if only_enabled:
            conds.append(Product.status == 1)
        if series_id:
            conds.append(Product.series_id == series_id)
        if category_id:
            conds.append(Product.category_id == category_id)
        if keyword:
            conds.append(Product.name.like(f"%{keyword}%"))

        total = await s.scalar(
            select(func.count()).select_from(Product).where(*conds)
        )
        rows = (
            await s.scalars(
                select(Product)
                .where(*conds)
                .order_by(Product.sort, Product.id.desc())
                .offset(params["offset"])
                .limit(params["limit"])
            )
        ).all()

        # 派生 series_name / category_name
        series_ids = {r.series_id for r in rows if r.series_id}
        cat_ids = {r.category_id for r in rows if r.category_id}
        series_map = {}
        cat_map = {}
        if series_ids:
            for x in (await s.scalars(select(ProductSeries).where(ProductSeries.id.in_(series_ids)))).all():
                series_map[x.id] = x.name
        if cat_ids:
            for x in (await s.scalars(select(ProductCategory).where(ProductCategory.id.in_(cat_ids)))).all():
                cat_map[x.id] = x.name

        items = [
            {
                "id": r.id, "name": r.name, "code": r.code,
                "series_id": r.series_id, "series_name": series_map.get(r.series_id),
                "category_id": r.category_id, "category_name": cat_map.get(r.category_id),
                "material": r.material, "size": r.size, "style": r.style,
                "applicable_space": r.applicable_space, "description": r.description,
                "cover_image": r.cover_image, "gallery": r.gallery,
                "sort": r.sort, "status": r.status,
            }
            for r in rows
        ]
        return paginated(items, total or 0, params)


async def get_product(pid: int) -> dict:
    async with AsyncSessionLocal() as s:
        r = (await s.scalars(select(Product).where(Product.id == pid))).first()
        if not r:
            raise BizError(ErrorCode.NOT_FOUND, "产品不存在", 404)
        series_name = cat_name = None
        if r.series_id:
            sr = (await s.scalars(select(ProductSeries).where(ProductSeries.id == r.series_id))).first()
            series_name = sr.name if sr else None
        if r.category_id:
            ct = (await s.scalars(select(ProductCategory).where(ProductCategory.id == r.category_id))).first()
            cat_name = ct.name if ct else None
        return {
            "id": r.id, "name": r.name, "code": r.code,
            "series_id": r.series_id, "series_name": series_name,
            "category_id": r.category_id, "category_name": cat_name,
            "material": r.material, "size": r.size, "style": r.style,
            "applicable_space": r.applicable_space, "description": r.description,
            "cover_image": r.cover_image, "gallery": r.gallery,
            "sort": r.sort, "status": r.status,
        }


async def create_product(data) -> int:
    async with AsyncSessionLocal() as s:
        # 外键存在性校验
        if data.series_id and not await s.scalar(select(ProductSeries.id).where(ProductSeries.id == data.series_id)):
            raise BizError(ErrorCode.NOT_FOUND, "系列不存在", 400)
        if data.category_id and not await s.scalar(select(ProductCategory.id).where(ProductCategory.id == data.category_id)):
            raise BizError(ErrorCode.NOT_FOUND, "分类不存在", 400)
        applicable = None
        if data.category_id:
            cat = (await s.scalars(select(ProductCategory).where(ProductCategory.id == data.category_id))).first()
            applicable = cat.name if cat else None
        obj = Product(
            name=data.name, code=data.code, series_id=data.series_id, category_id=data.category_id,
            material=data.material, size=data.size, style=data.style,
            applicable_space=applicable, description=clean_html(data.description),
            cover_image=data.cover_image, gallery=data.gallery, sort=data.sort, status=data.status,
        )
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj.id


async def update_product(pid: int, data) -> None:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Product).where(Product.id == pid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "产品不存在", 404)
        if data.category_id is not None:
            if data.category_id and not await s.scalar(select(ProductCategory.id).where(ProductCategory.id == data.category_id)):
                raise BizError(ErrorCode.NOT_FOUND, "分类不存在", 400)
            cat = (await s.scalars(select(ProductCategory).where(ProductCategory.id == data.category_id))).first()
            obj.applicable_space = cat.name if cat else None
        for f in ("name", "code", "series_id", "material", "size", "style", "cover_image", "gallery", "sort", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        if data.description is not None:
            obj.description = clean_html(data.description)
        await s.commit()


async def delete_product(pid: int) -> None:
    """软删除：status=0 下线。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Product).where(Product.id == pid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "产品不存在", 404)
        obj.status = 0
        await s.commit()


async def batch_status(ids: list[int], status: int) -> None:
    async with AsyncSessionLocal() as s:
        rows = (await s.scalars(select(Product).where(Product.id.in_(ids)))).all()
        for r in rows:
            r.status = status
        await s.commit()


async def batch_sort(orders: list[dict]) -> None:
    async with AsyncSessionLocal() as s:
        for o in orders:
            pid = o.get("id")
            sort = o.get("sort")
            if pid is None or sort is None:
                continue
            obj = (await s.scalars(select(Product).where(Product.id == pid))).first()
            if obj:
                obj.sort = sort
        await s.commit()
