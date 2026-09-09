"""统一异常与业务错误码。

【功能说明】
- 所有业务错误通过 BizError 抛出，由 main.py 注册的处理器转成统一信封 {code,message,data}。
- 错误码对齐 TECH 文档 §5.2 错误码枚举（10001-10008）。
- HTTP 状态码与业务码双轨：HTTP 层管传输态（401/403/422/429），业务码管业务结果。
"""
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ErrorCode:
    """业务错误码常量（与 TECH §5.2 一致）。"""

    SUCCESS = 0
    CREDENTIAL_ERROR = 10001   # 用户名或密码错误 / token 无效或过期
    ACCOUNT_LOCKED = 10002     # 登录连续失败超限被锁定
    NOT_FOUND = 10003          # 资源不存在
    PERMISSION_DENIED = 10004  # 权限不足（RBAC 拒绝）
    FILE_ERROR = 10005         # 文件类型/大小不符
    PRIVACY_NOT_AGREED = 10006 # 隐私同意未勾选
    ACCOUNT_DISABLED = 10007   # 账号已停用
    VALIDATION_ERROR = 10008   # 参数校验失败


class BizError(Exception):
    """业务异常：携带业务码、提示信息与 HTTP 状态码。

    使用示例：
        raise BizError(ErrorCode.PERMISSION_DENIED, "权限不足", 403)
    """

    def __init__(self, code: int = ErrorCode.VALIDATION_ERROR, message: str = "业务异常", http_status: int = 400):
        self.code = code                 # 业务码（10001-10008 等）
        self.message = message           # 给前端的提示文案
        self.http_status = http_status   # 对应 HTTP 状态码
        super().__init__(message)


def biz_exception_handler(request: Request, exc: BizError) -> JSONResponse:
    """BizError -> 统一信封响应。"""
    return JSONResponse(
        status_code=exc.http_status,
        content={"code": exc.code, "message": exc.message, "data": None},
    )


def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Pydantic 校验失败（422）-> 统一信封（业务码 10008）。"""
    return JSONResponse(
        status_code=422,
        content={"code": ErrorCode.VALIDATION_ERROR, "message": "参数校验失败", "data": exc.errors()},
    )


# HTTP 状态码 -> (业务码, 提示) 的兜底映射（用于非 BizError 的 HTTP 异常）
_HTTP_TO_BIZ = {
    401: (ErrorCode.CREDENTIAL_ERROR, "未认证"),
    403: (ErrorCode.PERMISSION_DENIED, "无权限"),
    404: (ErrorCode.NOT_FOUND, "资源不存在"),
}


def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Starlette HTTPException -> 统一信封（兜底包装）。"""
    code, msg = _HTTP_TO_BIZ.get(exc.status_code, (exc.status_code, str(exc.detail)))
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": code, "message": msg, "data": None},
    )
