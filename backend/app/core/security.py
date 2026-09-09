"""密码哈希与校验（bcrypt）。

说明：passlib 1.7.4 与 bcrypt 4.1+ 在 Python 3.13 上存在兼容性问题
（passlib 无法识别新版 bcrypt 的 __about__ 且触发 wrap-bug 检测的 72 字节限制），
故此处直接使用 bcrypt 库。哈希格式仍为 `$2b$...`，与 DB 设计文档 §7.9 一致。
"""
from __future__ import annotations

import bcrypt


def hash_password(plain: str) -> str:
    """对明文密码进行 bcrypt 哈希，返回 `$2b$...` 字符串。"""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """校验明文与 bcrypt 哈希是否匹配。"""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False
