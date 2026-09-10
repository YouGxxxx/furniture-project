"""内容安全清洗：富文本 XSS 白名单 + 跳转链接协议白名单（TECH §8.3）。

【功能说明】
- clean_html：对新闻/企业资料富文本做 bleach 白名单清洗，剥离 script / on* 事件与危险协议。
- sanitize_link：Banner link_url 仅允许 http(s)://，禁 javascript:/data: 等。
"""
from __future__ import annotations

import re

import bleach

# 允许的标签与属性（对齐安全基线，兼顾图文排版）
_ALLOWED_TAGS = [
    "p", "br", "div", "span", "strong", "em", "u", "s",
    "ul", "ol", "li", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6", "hr",
    "a", "img", "table", "thead", "tbody", "tr", "td", "th",
]
_ALLOWED_ATTRS = {
    "a": ["href", "target", "rel"],
    "img": ["src", "alt", "width", "height", "style"],
    "*": ["class", "style"],
}
# 额外允许的 URL 协议（图片用 https/data，链接仅 http/https）
_ALLOWED_PROTOCOLS = ["http", "https"]


def clean_html(html: str | None) -> str | None:
    """清洗富文本 HTML；空值原样返回。"""
    if not html:
        return html
    return bleach.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        protocols=_ALLOWED_PROTOCOLS,
        strip=True,
    )


_LINK_RE = re.compile(r"^https?://", re.IGNORECASE)


def sanitize_link(url: str | None):
    """校验 Banner 跳转链接协议；非法返回 None（调用方据此抛错）。"""
    if not url:
        return url
    return url if _LINK_RE.match(url) else None
