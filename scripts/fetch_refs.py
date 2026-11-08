"""Openverse 参考图抓取：每个模板 id 最多 6 张候选，来源记入 references/manifest.tsv"""
import json
import pathlib
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "references" / "raw"
MANIFEST = ROOT / "references" / "manifest.tsv"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36"}

QUERIES = {
    "c5": "magazine cover design layout",
    "c6": "polaroid frame",
    "c7": "typography poster design",
    "c8": "ticket design print",
    "c9": "film strip poster",
    "c10": "arch window architecture poster",
    "t7": "scrapbook journal layout",
    "t8": "magazine spread layout",
    "t9": "bento box grid design",
    "t10": "chat messages conversation design",
    "t11": "sticky notes wall",
    "t12": "chalkboard lettering poster",
    "t13": "computer terminal screen",
    "t14": "letter stationery paper design",
    "t15": "timeline infographic design",
    "t16": "checklist planner design",
    "t17": "quote typography poster",
    "e3": "wax seal stamp design",
    "e4": "follow us social media poster",
    "e5": "movie end credits",
}


def get(url, dest=None, timeout=25):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    if dest:
        dest.write_bytes(data)
        return dest.stat().st_size
    return data


def main():
    import sys

    overrides = dict(a.split("=", 1) for a in sys.argv[1:] if "=" in a)
    queries = overrides or QUERIES
    lines = []
    for tid, q in queries.items():
        d = RAW / tid
        if d.exists():
            for f in d.iterdir():
                f.unlink()
        d.mkdir(parents=True, exist_ok=True)
        api = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
            {"q": q, "page_size": 20, "license_type": "all", "filter_dead": "false"}
        )
        try:
            payload = json.loads(get(api))
        except Exception as e:
            print(tid, "API 失败:", e)
            continue
        n = 0
        for r in payload.get("results", []):
            if n >= 6:
                break
            url = r.get("url") or ""
            w = r.get("width") or 0
            if w and w < 500:
                continue
            ext = ".jpg"
            for cand in (".png", ".webp", ".jpeg", ".jpg"):
                if url.lower().split("?")[0].endswith(cand):
                    ext = ".jpg" if cand == ".jpeg" else cand
                    break
            out = d / f"{n + 1}{ext}"
            try:
                sz = get(url, out, timeout=15)
            except Exception:
                if out.exists():
                    out.unlink()
                continue
            if sz < 8000:
                out.unlink()
                continue
            lines.append(f"{tid}\t{q}\t{url}\t{r.get('foreign_landing_url', '')}")
            n += 1
        print(tid, "->", n, "张")
        time.sleep(3)
    with MANIFEST.open("a" if overrides else "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + ("\n" if lines else ""))


if __name__ == "__main__":
    main()
