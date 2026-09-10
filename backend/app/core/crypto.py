"""手机号 AES-256-GCM 加密 / 解密 / 脱敏工具。

【功能说明】
- 加密算法：AES-256-GCM（AEAD，认证加密，含完整性校验）。
- 密钥来源：settings.PHONE_ENCRYPT_KEY。
  - 支持三种写法：64 位 hex（=32 字节，本仓库 .env 采用）、base64、或普通字符串（按 UTF-8 取/补 32 字节）。
- 密文单列存储格式：base64( iv(12字节) || ciphertext || tag(16字节) )，无 IV 列。
- 列表一律脱敏为 138****8888；仅后台授权角色在查看/处理时才解密明文（见 message_service）。
- 严禁用 Base64 等可逆编码冒充加密（TECH §8.3）。
"""
from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings


def _derive_key() -> bytes:
    """从配置派生 32 字节密钥，兼容 hex / base64 / 普通字符串。

    - 64 位十六进制 -> 32 字节（本仓库 .env 采用）。
    - 否则尝试 base64（须恰好 32 字节）。
    - 否则按 UTF-8 编码并补齐/截断到 32 字节。
    - 未配置时回退开发占位密钥（仅本地开发，禁止上生产）。
    """
    raw = (settings.PHONE_ENCRYPT_KEY or "").strip()
    if not raw:
        return b"dev-only-insecure-phone-key-0000000000"[:32]
    # hex：64 字符且全为十六进制
    if len(raw) == 64 and all(c in "0123456789abcdefABCDEF" for c in raw):
        return bytes.fromhex(raw)
    try:
        k = base64.b64decode(raw, validate=True)
        if len(k) == 32:
            return k
    except Exception:
        pass
    k = raw.encode("utf-8")
    return (k + b"\0" * 32)[:32]


_KEY = _derive_key()


def encrypt_phone(plain: str) -> str:
    """对明文手机号加密，返回 base64 密文串（含随机 IV）。"""
    iv = os.urandom(12)
    aes = AESGCM(_KEY)
    ct = aes.encrypt(iv, plain.encode("utf-8"), None)
    return base64.b64encode(iv + ct).decode("ascii")


def decrypt_phone(cipher_b64: str) -> str:
    """解密密文串为明文手机号；失败抛异常由调用方处理。"""
    data = base64.b64decode(cipher_b64)
    iv, ct = data[:12], data[12:]
    aes = AESGCM(_KEY)
    return aes.decrypt(iv, ct, None).decode("utf-8")


def mask_phone(cipher_b64: str) -> str:
    """列表展示用：解密后脱敏为 138****8888，绝不暴露明文。

    解密失败（密钥轮换/损坏）时返回安全占位，避免泄露异常。
    """
    try:
        plain = decrypt_phone(cipher_b64)
    except Exception:
        return "138****8888"
    if len(plain) < 7:
        if len(plain) <= 1:
            return "****"
        return plain[0] + "****" + plain[-1]
    return plain[:3] + "****" + plain[-4:]
