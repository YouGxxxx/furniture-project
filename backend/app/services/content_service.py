"""内容域业务逻辑：轮播图(Banner) / 企业资料(about) / 站点配置(site_settings)。

【site_settings 解析约定】种子值均为 JSON 编码（字符串带引号、social 为对象），故：
- 读取时统一 json.loads(value) 还原（含 social 对象）。
- 写入时统一 json.dumps(value) 存储。无需对 social 特判，约定自洽。
【Banner 时间窗】公开读仅返回 status=1 且当前时间落在 [start_time, end_time] 内（未设置端不限制）的条目。
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import func, select

from app.core.clean import clean_html, sanitize_link
from app.core.exceptions import BizError, ErrorCode
from app.db.session import AsyncSessionLocal
from app.models.content import AboutPage, Banner, SiteSetting


def _parse_dt(v: str | None):
    """解析 ISO 时间；带时区则转 UTC 去时区后比较（存储为 UTC naive）。"""
    if not v:
        return None
    dt = datetime.fromisoformat(v)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


# ---------- Banner ----------

async def list_banners() -> list[dict]:
    """公开：启用且命中时间窗，按 sort 升序。"""
    now = datetime.utcnow()
    async with AsyncSessionLocal() as s:
        rows = (await s.scalars(select(Banner).where(Banner.status == 1).order_by(Banner.sort))).all()
        items = []
        for b in rows:
            if b.start_time and now < b.start_time:
                continue
            if b.end_time and now > b.end_time:
                continue
            items.append({
                "id": b.id, "title": b.title, "image_url": b.image_url,
                "link_url": b.link_url, "sort": b.sort, "status": b.status,
                "start_time": b.start_time.isoformat() if b.start_time else None,
                "end_time": b.end_time.isoformat() if b.end_time else None,
            })
        return items


async def create_banner(data) -> int:
    link = sanitize_link(data.link_url, allow_internal=True)
    if data.link_url and link is None:
        raise BizError(ErrorCode.VALIDATION_ERROR, "跳转链接仅允许 http(s):// 或站内路径 /", 400)
    async with AsyncSessionLocal() as s:
        obj = Banner(
            title=data.title, image_url=data.image_url, link_url=link, sort=data.sort,
            status=data.status, start_time=_parse_dt(data.start_time), end_time=_parse_dt(data.end_time),
        )
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj.id


async def update_banner(bid: int, data) -> None:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Banner).where(Banner.id == bid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "轮播图不存在", 404)
        if data.link_url is not None:
            link = sanitize_link(data.link_url, allow_internal=True)
            if data.link_url and link is None:
                raise BizError(ErrorCode.VALIDATION_ERROR, "跳转链接仅允许 http(s):// 或站内路径 /", 400)
            obj.link_url = link
        for f in ("title", "image_url", "sort", "status"):
            v = getattr(data, f)
            if v is not None:
                setattr(obj, f, v)
        if data.start_time is not None:
            obj.start_time = _parse_dt(data.start_time)
        if data.end_time is not None:
            obj.end_time = _parse_dt(data.end_time)
        await s.commit()


async def delete_banner(bid: int) -> None:
    """软删除：status=0。"""
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(Banner).where(Banner.id == bid))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "轮播图不存在", 404)
        obj.status = 0
        await s.commit()


# ---------- 企业资料 about ----------

async def get_about(key: str) -> dict:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(AboutPage).where(AboutPage.key == key))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "资料不存在", 404)
        return {"key": obj.key, "title": obj.title, "content": obj.content, "images": obj.images}


async def update_about(key: str, data) -> None:
    async with AsyncSessionLocal() as s:
        obj = (await s.scalars(select(AboutPage).where(AboutPage.key == key))).first()
        if not obj:
            raise BizError(ErrorCode.NOT_FOUND, "资料不存在", 404)
        if data.title is not None:
            obj.title = data.title
        if data.content is not None:
            obj.content = clean_html(data.content)
        if data.images is not None:
            obj.images = data.images
        await s.commit()


# ---------- 站点配置 site_settings ----------

async def get_site_settings() -> dict:
    """公开：返回解析后的配置（每个 value 经 json.loads）。"""
    async with AsyncSessionLocal() as s:
        rows = (await s.scalars(select(SiteSetting))).all()
        result = {}
        for r in rows:
            try:
                result[r.key] = json.loads(r.value) if r.value is not None else None
            except (json.JSONDecodeError, TypeError):
                result[r.key] = r.value
        return result


async def update_site_settings(settings: dict[str, str]) -> None:
    """批量更新：upsert，value 统一 json.dumps 存储。"""
    async with AsyncSessionLocal() as s:
        existing = {r.key: r for r in (await s.scalars(select(SiteSetting))).all()}
        for k, v in settings.items():
            stored = json.dumps(v, ensure_ascii=False)
            if k in existing:
                existing[k].value = stored
            else:
                s.add(SiteSetting(key=k, value=stored))
        await s.commit()
