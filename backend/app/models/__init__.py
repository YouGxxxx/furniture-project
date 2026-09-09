"""ORM 模型聚合导入。

导入本模块即把所有表注册到 Base.metadata，供 create_all / Alembic 使用。
"""
from app.models.rbac import Role, Permission, RolePermission, User
from app.models.product import ProductCategory, ProductSeries, Product
from app.models.news import NewsCategory, News
from app.models.content import Banner, AboutPage, SiteSetting
from app.models.message import Message
from app.models.static_content import Case, Recruit

__all__ = [
    "Role", "Permission", "RolePermission", "User",
    "ProductCategory", "ProductSeries", "Product",
    "NewsCategory", "News",
    "Banner", "AboutPage", "SiteSetting",
    "Message",
    "Case", "Recruit",
]
