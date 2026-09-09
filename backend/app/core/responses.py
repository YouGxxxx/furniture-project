"""统一响应信封工具。

【功能说明】
- 后端所有接口统一返回 {code, message, data} 结构（见 TECH 文档 §5.2 统一响应格式）。
- 成功响应由本模块 success() 构造；业务异常由 core/exceptions.py 的 BizError 统一转成信封。
- code=0 表示成功；非 0 为业务码（10001-10008，见 exceptions.ErrorCode）。
"""
from typing import Any


def success(data: Any = None) -> dict:
    """构造统一成功响应信封。

    Args:
        data: 业务数据，可为 None / 字典 / 列表 / 分页对象等。
    Returns:
        {"code": 0, "message": "ok", "data": data}
    """
    return {"code": 0, "message": "ok", "data": data}
