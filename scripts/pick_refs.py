"""固化参考图：按 PICKS 把 references/raw/<id>/<n> 复制为 references/<id>.<ext>，
并从 manifest.tsv 取来源 URL 生成 references/REFERENCES.md"""
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "references" / "raw"
MANIFEST = ROOT / "references" / "manifest.tsv"

# id -> (挑中序号, 模板名, 一句话说明)
PICKS = {
    "c5": (1, "杂志刊头", "DEPARTAMENTO 大字刊头封面：刊名巨字+条形码+期号信息"),
    "c6": (2, "拍立得", "灰底白框拍立得相纸，微倾角，底部留白写字区"),
    "c7": (3, "大字海报", "MORE to design than VINTAGE & GRUNGE：多色大字混排海报"),
    "c8": (5, "票根", "Platform 9¾ 车票：花纹边框+大标题+小字条款"),
    "c9": (5, "胶片", "35mm 胶片条：黑底+齿孔+多帧横排"),
    "c10": (3, "拱窗", "三联彩色玻璃尖拱窗，竖向拱形构图"),
    "t7": (5, "手账纸", "memories 手账页：斜贴照片+贴纸+手绘大字"),
    "t8": (6, "杂志双栏", "ANY WAY TO A BEACH：大图+双栏正文+色块标注"),
    "t9": (2, "便当格", "CHINA'S ECONOMY：多卡片网格信息图"),
    "t10": (3, "聊天记录", "手机短信界面：左右气泡对话"),
    "t11": (5, "便利贴", "九宫格便利贴：单张贴纸质感+手绘表情"),
    "t12": (6, "黑板报", "黑板粉笔字 THANK YOU：手绘字+粉笔画"),
    "t13": (2, "终端", "老式电脑绿色字符终端屏"),
    "t14": (4, "信纸", "1943 年手写信件：横线纸+手写体"),
    "t15": (2, "时间轴", "甘特图式时间轴信息图：节点沿时间分布"),
    "t16": (2, "打卡清单", "手写勾选清单：复选框+手写条目"),
    "t17": (2, "金句卡", "CHAOS IS A FRIEND OF MINE：大引号+手撕纹理金句"),
    "e3": (4, "印章落款", "火漆章盖印：信封+蜡封印鉴"),
    "e4": (2, "关注引导", "社媒图标横排：白底彩色图标矩阵"),
    "e5": (1, "谢幕", "电影演职员表：黑底白字名单"),
}

def main():
    # manifest 里同一 id 可能多组（补抓覆盖），取最后一组
    by_id = {}
    for line in MANIFEST.read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) >= 3:
            by_id.setdefault(parts[0], []).append(parts)
    rows = []
    for tid, (n, name, desc) in PICKS.items():
        entries = by_id.get(tid, [])
        files = sorted(p for p in (RAW / tid).iterdir() if p.suffix in (".jpg", ".png", ".webp"))
        picked = RAW / tid / f"{n}{files[n-1].suffix if n <= len(files) else '.jpg'}"
        if not picked.exists():
            print(tid, "缺文件", picked)
            continue
        dst = ROOT / "references" / f"{tid}{picked.suffix}"
        shutil.copy2(picked, dst)
        url = entries[n - 1][2] if n - 1 < len(entries) else "(manifest 缺失)"
        landing = entries[n - 1][3] if len(entries[n - 1]) > 3 else ""
        rows.append((tid, name, f"{tid}/{n}{picked.suffix}", desc, landing or url))
        print(tid, "->", dst.name)
    md = ["# 20 套模板参考图清单",
          "",
          "每套模板一张固化的参考图（`references/<id>.<ext>`），候选原图在 `raw/<id>/`。",
          "复刻迭代时对照此表目检。",
          "",
          "| id | 模板 | 候选 | 参考要点 | 来源 |",
          "|----|------|------|----------|------|"]
    for tid, name, cand, desc, url in rows:
        md.append(f"| {tid} | {name} | {cand} | {desc} | [link]({url}) |")
    (ROOT / "references" / "REFERENCES.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print("REFERENCES.md 已生成")

if __name__ == "__main__":
    main()
