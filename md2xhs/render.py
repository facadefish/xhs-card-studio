"""Markdown → 小红书图文卡片/长图。

MD 经 markdown-it-py 转 HTML，注入 base.html 模板，
由模板内 JS 完成测量与分页，再用 Playwright（系统 Edge）逐页截图。
分页必须发生在浏览器内：Python 侧无法可靠估算文字排版高度。

CLI 用 render()；工作台（web.py）用 Renderer.paginate / Renderer.screenshot_stage。
"""

from __future__ import annotations

import base64
import json
import mimetypes
import re
from datetime import date
from pathlib import Path

from markdown_it import MarkdownIt
from playwright.sync_api import sync_playwright

PAGE_W = 1242
PAGE_H = 1656

_TEMPLATES = Path(__file__).parent / "templates"
_THEMES = _TEMPLATES / "themes"

_IMG_SRC = re.compile(r'(<img\b[^>]*?\bsrc=")([^"]+)(")')


def md_to_html(md_text: str, base_dir: Path) -> str:
    """MD → HTML 片段；本地图片转 data URI 内嵌
    （工作台预览 iframe 和服务端 about:blank 渲染都禁止 file:// 子资源）。
    """
    html = MarkdownIt("gfm-like").render(md_text)

    def repl(m: re.Match) -> str:
        src = m.group(2)
        if re.match(r"^(https?://|data:|#)", src):
            return m.group(0)
        p = (base_dir / src).resolve()
        if not p.is_file() or p.stat().st_size > 8 * 1024 * 1024:
            return m.group(0)
        mime = mimetypes.guess_type(p.name)[0] or "image/png"
        b64 = base64.b64encode(p.read_bytes()).decode("ascii")
        return f'{m.group(1)}data:{mime};base64,{b64}{m.group(3)}'

    return _IMG_SRC.sub(repl, html)


def build_html(cfg: dict, theme: str) -> str:
    """cfg 序列化为 JSON 注入 base.html；layout.css 与主题 CSS 内联。"""
    template = (_TEMPLATES / "base.html").read_text(encoding="utf-8")
    return (
        template
        .replace("__THEME_NAME__", theme)
        .replace("__LAYOUT_CSS__", (_TEMPLATES / "layout.css").read_text(encoding="utf-8"))
        .replace("__THEME_CSS__", (_THEMES / f"{theme}.css").read_text(encoding="utf-8"))
        .replace("__CFG_JSON__", json.dumps(cfg, ensure_ascii=False))
    )


class Renderer:
    """复用的无头浏览器会话。非线程安全，调用方负责串行化。"""

    def __init__(self) -> None:
        self._pw = sync_playwright().start()
        try:
            self._browser = self._pw.chromium.launch(channel="msedge")
        except Exception:
            self._browser = self._pw.chromium.launch()  # 兜底：自带 chromium
        self._page = self._browser.new_page(
            viewport={"width": PAGE_W, "height": PAGE_H}, device_scale_factor=1
        )

    def close(self) -> None:
        self._browser.close()
        self._pw.stop()

    def _load(self, html: str) -> None:
        # 每次用新页面：set_content 是 document.write，全局词法作用域
        # （const CFG 等）会跨加载残留，复用同一页会抛重复声明
        if not self._page.is_closed():
            self._page.close()
        self._page = self._browser.new_page(
            viewport={"width": PAGE_W, "height": PAGE_H}, device_scale_factor=1
        )
        self._page.set_content(html)
        self._page.wait_for_function("document.title === 'ready'")

    def paginate(self, cfg: dict, theme: str) -> str:
        """返回分页后的 #stage innerHTML（字符串，可再注入/序列化）。"""
        self._load(build_html(cfg, theme))
        return self._page.evaluate("document.getElementById('stage').innerHTML")

    def _shoot(self, out_dir: Path, prefix: str) -> list[Path]:
        out_dir.mkdir(parents=True, exist_ok=True)
        cards = self._page.locator("#stage .page")
        total = cards.count()
        width = len(str(total))
        files: list[Path] = []
        for i in range(total):
            f = out_dir / f"{prefix}-{i + 1:0{width}d}.png"
            cards.nth(i).screenshot(path=str(f))
            files.append(f)
        return files

    def screenshot_pages(self, cfg: dict, theme: str, out_dir: Path, prefix: str) -> list[Path]:
        """完整渲染（含分页）并逐页截图。CLI 用。"""
        self._load(build_html(cfg, theme))
        return self._shoot(out_dir, prefix)

    def screenshot_stage(self, stage_html: str, theme: str, out_dir: Path, prefix: str) -> list[Path]:
        """对给定的 stageHtml（raw 模式，不再分页）逐页截图。工作台导出用。"""
        self._load(build_html({"mode": "raw", "stageHtml": stage_html}, theme))
        return self._shoot(out_dir, prefix)


def render(
    md_path: Path,
    mode: str = "cards",
    theme: str = "minimal",
    out_dir: Path = Path("output"),
    cover: bool = True,
    author: str | None = None,
    params: dict | None = None,
) -> list[Path]:
    md_path = md_path.resolve()
    out_dir = out_dir.resolve()
    cfg = {
        "mode": mode,
        "cover": cover,
        "title": md_path.stem,
        "author": author or "",
        "date": date.today().isoformat(),
        "params": params,
        "contentHtml": md_to_html(md_path.read_text(encoding="utf-8"), md_path.parent),
    }
    r = Renderer()
    try:
        return r.screenshot_pages(cfg, theme, out_dir, md_path.stem)
    finally:
        r.close()
