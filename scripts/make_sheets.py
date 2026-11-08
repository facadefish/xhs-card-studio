"""把 references/raw/<id>/ 下的候选图拼成一张横向 contact sheet，便于目检挑选"""
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "references" / "raw"
OUT = ROOT / "references" / "sheets"
THUMB_H = 520

def main():
    only = sys.argv[1:] or None
    OUT.mkdir(parents=True, exist_ok=True)
    for d in sorted(RAW.iterdir()):
        if only and d.name not in only:
            continue
        files = sorted(p for p in d.iterdir() if p.suffix in (".jpg", ".png", ".webp"))
        if not files:
            continue
        thumbs = []
        for f in files:
            im = Image.open(f).convert("RGB")
            w = int(im.width * THUMB_H / im.height)
            thumbs.append((f.stem, im.resize((w, THUMB_H))))
        pad = 16
        label_h = 40
        W = sum(t.width for _, t in thumbs) + pad * (len(thumbs) + 1)
        H = THUMB_H + label_h + pad * 2
        sheet = Image.new("RGB", (W, H), "#333333")
        x = pad
        from PIL import ImageDraw
        dr = ImageDraw.Draw(sheet)
        for stem, t in thumbs:
            sheet.paste(t, (x, pad + label_h))
            dr.text((x + 4, pad + 8), f"{d.name}/{stem}", fill="#ffffff")
            x += t.width + pad
        sheet.save(OUT / f"{d.name}.jpg", quality=88)
        print(d.name, "->", len(files), "张")

if __name__ == "__main__":
    main()
