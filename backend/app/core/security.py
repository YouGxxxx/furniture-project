"""安全模块：密码哈希、JWT 签发/校验、登录限流。

【功能说明】
- 密码哈希用 bcrypt 直连（passlib 与 bcrypt5/Py3.13 不兼容，见 Phase1 记录，哈希格式仍为 $2b$）。
- JWT 用 python-jose（HS256）签发，有效期取自 settings.JWT_EXPIRE_SECONDS（7 天）。
- 登录限流用进程内字典：同一用户名连续失败 5 次 / 10 分钟锁定（TECH §5.3 决策④）。
- 说明：内存字典仅适配单实例；生产多实例需升级 Redis（TECH §11）。
"""
from __future__ import annotations

import threading
import time
from datetime import datetime, timezone, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import BizError, ErrorCode

# ---------- 1. 密码哈希 ----------

def hash_password(plain: str) -> str:
    """对明文密码进行 bcrypt 哈希，返回 $2b$... 字符串。"""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """校验明文与 bcrypt 哈希是否匹配；异常（如格式错误）时返回 False。"""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------- 2. JWT ----------

def create_access_token(user_id: int, role_code: str, permissions: list[str]) -> str:
    """签发 JWT。

    Args:
        user_id:    用户主键（写入 sub）。
        role_code:  角色编码（写入 role，便于 require_perm 短路判断）。
        permissions: 该用户权限码列表（写入 perms，避免每次请求查库）。
    Returns:
        签名后的 JWT 字符串。
    """
    expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_EXPIRE_SECONDS)
    payload = {
        "sub": str(user_id),
        "role": role_code,
        "perms": permissions,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """校验并解析 JWT；无效或过期抛出 BizError(10001, 401)。"""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise BizError(ErrorCode.CREDENTIAL_ERROR, "token 无效或已过期", 401)


# ---------- 3. 登录限流（进程内字典） ----------

_LOGIN_LOCK = threading.Lock()
_LOGIN_ATTEMPTS: dict[str, list[float]] = {}  # key=用户名 -> 失败时间戳列表

MAX_FAIL = 5        # 最大失败次数
LOCK_WINDOW = 600  # 锁定窗口（秒）= 10 分钟


def is_locked(key: str) -> bool:
    """判断该 key 当前是否处于锁定状态（同时清理窗口外的过期记录）。"""
    with _LOGIN_LOCK:
        fails = _LOGIN_ATTEMPTS.get(key, [])
        # 仅保留窗口内的失败记录
        fails = [t for t in fails if time.time() - t < LOCK_WINDOW]
        _LOGIN_ATTEMPTS[key] = fails
        return len(fails) >= MAX_FAIL


def record_failure(key: str) -> None:
    """记录一次登录失败（用于触发限流）。"""
    with _LOGIN_LOCK:
        _LOGIN_ATTEMPTS.setdefault(key, []).append(time.time())


def reset_failures(key: str) -> None:
    """登录成功后清除失败记录（解除限流计数）。"""
    with _LOGIN_LOCK:
        _LOGIN_ATTEMPTS.pop(key, None)
