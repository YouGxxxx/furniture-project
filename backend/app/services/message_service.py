"""留言 / 询价业务逻辑。

【安全】phone 入库即 AES-256-GCM 加密（crypto.encrypt_phone）；列表一律脱敏 138****8888（mask_phone）。
【隐私】提交须 privacy_agreed=true，否则 10006（在接口层校验）。
【处理】后台标记 status=1 + 回复，记录 handler_id 与 handled_at。
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select

from app.core.crypto import decrypt_phone, encrypt_phone, mask_phone
from app.core.exceptions import BizError, ErrorCode
from app.core.pagination import paginated
from app.db.session import AsyncSessionLocal
from app.models.message import Message


def _iso(dt) -> str | None:
    return dt.isoformat() if dt else None


async def create_message(data) -> int:
    """公开提交：校验隐私同意 -> 加密手机号 -> 落库。返回新 id。

    product_id 为可选关联，未提供或为空不阻断；此处不做强校验（留言可独立于产品提交）。
    """
    if not data.privacy_agreed:
        raise BizError(ErrorCode.PRIVACY_NOT_AGREED, "请先勾选同意隐私政策", 400)
    async with AsyncSessionLocal() as s:
        obj = Message(
            name=data.name,
            phone=encrypt_phone(data.phone),
            email=data.email,
            type=data.type,
            product_id=data.product_id,
            content=data.content,
            status=0,
        )
        s.add(obj)
        await s.commit()
        await s.refresh(obj)
        return obj.id


async def list_messages(params: dict, *, status=None, type=None) -> dict:
    """后台列表：phone 脱敏展示。支持按状态/类型筛选。"""
    async with AsyncSessionLocal() as s:
        conds = []
        if status is not None:
            conds.append(Message.status == status)
        if type:
            conds.append(Message.type == type)
        total = await s.scalar(select(func.count()).select_from(Message).where(*conds))
        rows = (
            await s.scalars(
                select(Message)
                .where(*conds)
                .order_by(Message.created_at.desc())
                .offset(params["offset"])
                .limit(params["limit"])
            )
        ).all()
        items = [
            {
                "id": r.id, "name": r.name, "phone_masked": mask_phone(r.phone),
                "email": r.email, "type": r.type, "product_id": r.product_id,
                "content": r.content, "status": r.status, "reply": r.reply,
                "created_at": _iso(r.created_at),
            }
            for r in rows
        ]
        return paginated(items, total or 0, params)


async def get_message_detail(mid: int) -> dict:
    """授权详情：返回解密后的明文手机号（仅限 message:view 角色）。"""
    async with AsyncSessionLocal() as s:
        r = (await s.scalars(select(Message).where(Message.id == mid))).first()
        if not r:
            raise BizError(ErrorCode.NOT_FOUND, "留言不存在", 404)
        return {
            "id": r.id, "name": r.name, "phone": decrypt_phone(r.phone),
            "email": r.email, "type": r.type, "product_id": r.product_id,
            "content": r.content, "status": r.status, "reply": r.reply,
            "handler_id": r.handler_id,
            "created_at": _iso(r.created_at), "handled_at": _iso(r.handled_at),
        }


async def handle_message(mid: int, data) -> None:
    """标记处理/回复：更新 status/reply/handler_id/handled_at。"""
    async with AsyncSessionLocal() as s:
        r = (await s.scalars(select(Message).where(Message.id == mid))).first()
        if not r:
            raise BizError(ErrorCode.NOT_FOUND, "留言不存在", 404)
        if data.status is not None:
            r.status = data.status
        if data.reply is not None:
            r.reply = data.reply
        if data.handler_id is not None:
            r.handler_id = data.handler_id
        if r.status == 1:
            r.handled_at = datetime.now(timezone.utc)
        await s.commit()
