"""应用配置（基于 pydantic-settings 读取 .env）。

所有配置项以 .env.example 为单一来源，环境变量优先于默认值。
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # 应用
    PROJECT_NAME: str = "栖木家具官网 API"
    API_V1_PREFIX: str = "/api/v1"

    # 数据库
    DATABASE_URL: str = "sqlite:///./app.db"

    # JWT 鉴权
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_SECONDS: int = 604800  # 7 天

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    # 文件上传
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 2
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,webp"

    # 手机号加密
    PHONE_ENCRYPT_KEY: str = ""

    # 初始超管
    INIT_ADMIN_USER: str = "admin"
    INIT_ADMIN_PASSWORD: str = "change-me-in-production"

    @property
    def async_database_url(self) -> str:
        """返回 SQLAlchemy 异步驱动可用的数据库 URL。

        SQLite 自动转为 aiosqlite 驱动；PostgreSQL 使用 asyncpg。
        """
        url = self.DATABASE_URL
        if url.startswith("sqlite://") and "+aiosqlite" not in url:
            return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return url

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [e.strip().lower() for e in self.ALLOWED_EXTENSIONS.split(",") if e.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
