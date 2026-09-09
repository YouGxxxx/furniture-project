"""Pydantic 请求/响应模型包（schemas）。

【功能说明】按模块划分：auth（认证）、rbac（用户/角色/权限）、convert（ORM->响应转换）。
所有写请求均在此定义 Pydantic 模型，由 FastAPI 自动完成参数校验（422）。
"""
