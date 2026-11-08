import argparse
import sys
from pathlib import Path

from .render import _THEMES, render


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="md2xhs", description="Markdown → 小红书图文卡片 / 长图"
    )
    ap.add_argument("input", type=Path, help="Markdown 文件路径")
    ap.add_argument("--mode", choices=["cards", "long"], default="cards",
                    help="cards=3:4 多图卡片（默认，自动分页）；long=整张大长图")
    ap.add_argument("--theme", default="minimal",
                    help=f"主题名（themes/ 下的 .css 文件名），默认 minimal")
    ap.add_argument("--out", type=Path, default=Path("output"), help="输出目录")
    ap.add_argument("--no-cover", action="store_true", help="不生成封面页")
    ap.add_argument("--author", default=None, help="封面署名")
    args = ap.parse_args(argv)

    if not args.input.is_file():
        ap.error(f"找不到文件：{args.input}")
    if not (_THEMES / f"{args.theme}.css").is_file():
        ap.error(f"找不到主题：{args.theme}（可用：{available_themes()}）")

    files = render(
        args.input,
        mode=args.mode,
        theme=args.theme,
        out_dir=args.out,
        cover=not args.no_cover,
        author=args.author,
    )
    for f in files:
        print(f)
    return 0


def available_themes() -> str:
    return "、".join(sorted(p.stem for p in _THEMES.glob("*.css")))


if __name__ == "__main__":
    sys.exit(main())
