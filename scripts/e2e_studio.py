"""工作室端到端验证：导入→编辑→换模板→随机→导出→草稿恢复。

前置：服务已在 127.0.0.1:8321 运行（MD2XHS_NO_BROWSER=1 uv run python web/serve.py）。
"""

import io
import json
import time
import zipfile
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8321/"
OUT = Path("output/e2e-studio")
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1680, "height": 950})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE)
    page.wait_for_function("typeof doc !== 'undefined' && doc.pages.length > 0")
    time.sleep(0.5)

    # 1. 示例载入：封面 + 自动分页的正文页
    n = page.evaluate("doc.pages.length")
    kinds = page.evaluate("doc.pages.map(p => tplOf(p.templateId).kind)")
    print(f"[1] 初始 {n} 页 {kinds}")
    assert "cover" in kinds and "content" in kinds
    assert page.evaluate("doc.blocks.length") > 3

    # 2. 导入真实 md（含表格/代码/引用）
    md_text = Path("sample.md").read_text(encoding="utf-8")
    page.evaluate("async (t) => { await importMarkdown(doc, t); renderAll(); }", md_text)
    n2 = page.evaluate("doc.pages.length")
    title = page.evaluate("doc.meta.title")
    print(f"[2] 导入 sample.md → {n2} 页，标题「{title}」")
    assert "Markdown" in title and n2 >= 3

    # 3. 卡片文字直改（先选中第一个正文页）
    page.evaluate("""async () => {
      selectedPid = doc.pages.find(p => tplOf(p.templateId).kind === 'content').id;
      selectedSlot = null; renderAll();
      const blk = document.querySelector('#holder .blk');
      blk.innerHTML = blk.innerHTML + '【直改】';
      const b = doc.blocks.find(x => x.id === blk.dataset.bid);
      b.html = blk.innerHTML; await paginate(doc); renderAll();
    }""")
    assert page.evaluate("document.querySelector('#holder').innerHTML.includes('【直改】')")
    print("[3] 文字直改成功")

    # 4. 通过模板画廊真实点击切换模板（走 mutate，历史记录完整）
    page.evaluate("""() => {
      selectedPid = doc.pages.find(p => tplOf(p.templateId).kind === 'content').id;
      selectedSlot = null; renderAll();
    }""")
    print("    step4 sel:", page.evaluate("() => selectedPid + ' / ' + doc.pages.map(p=>p.id+':'+p.templateId).join(', ')"))
    page.click("#tplbox .tpl-thumb:has-text('便当格')")
    time.sleep(0.5)
    tpl = page.evaluate("() => doc.pages.find(p=>p.id===selectedPid).templateId")
    assert tpl == "t9", f"模板切换失败: tpl={tpl}"
    print("[4] 模板切换 t9 生效")

    # 5. 锁定后随机换版式：锁定 image（t4 的图区），切换时位置应保留
    page.evaluate("""() => {
      const p = doc.pages.find(x => x.id === selectedPid);
      p.locks = ['footer'];
    }""")
    old_ft_box = page.evaluate("() => ({...slotBox(doc.pages.find(p=>p.id===selectedPid), 'footer')})")
    before = page.evaluate("() => doc.pages.find(p=>p.id===selectedPid).templateId")
    print("    step5 sel:", page.evaluate("() => selectedPid"), "before:", before)
    page.keyboard.press(" ")
    time.sleep(0.4)
    after = page.evaluate("() => doc.pages.find(p=>p.id===selectedPid).templateId")
    print(f"[5] 随机排版（锁定 footer）：{before} -> {after}")
    assert after != before, "随机未换模板"
    kept = page.evaluate("() => doc.pages.find(p=>p.id===selectedPid).overrides.footer")
    assert kept and kept["x"] == old_ft_box["x"] and kept["y"] == old_ft_box["y"], f"锁定页脚位置未保留: {kept}"
    print("    锁定位置保留校验通过")

    # 6. 撤销/重做
    page.evaluate("doUndo()")
    tpl_undo = page.evaluate("() => doc.pages.find(p=>p.id===selectedPid).templateId")
    page.evaluate("doRedo()")
    tpl_redo = page.evaluate("() => doc.pages.find(p=>p.id===selectedPid).templateId")
    assert tpl_undo == before and tpl_redo == after
    print(f"[6] 撤销/重做生效 ({after} <-> {before})")

    # 7. 导出 ZIP（真实下载事件）
    with page.expect_download(timeout=60000) as dl:
        page.click("#b-export")
    path = dl.value.path()
    z = zipfile.ZipFile(path)
    names = [i.filename for i in z.infolist() if i.filename.endswith(".png")]
    assert len(names) == page.evaluate("doc.pages.length")
    png = z.read(names[0])
    assert png[:8] == b"\x89PNG\r\n\x1a\n" and len(png) > 50000
    print(f"[7] 导出 ZIP 成功：{len(names)} 张 PNG，首张 {len(png)//1024}KB")

    # 8. 草稿恢复：刷新后页数/标题保持
    saved_n = page.evaluate("doc.pages.length")
    page.reload()
    page.wait_for_function("typeof doc !== 'undefined' && doc.pages.length > 0")
    time.sleep(0.5)
    assert page.evaluate("doc.pages.length") == saved_n
    assert "Markdown" in page.evaluate("doc.meta.title")
    print("[8] 刷新后草稿自动恢复")

    page.screenshot(path=str(OUT / "studio.png"))
    print("[9] 截图已存 output/e2e-studio/studio.png")

    if errors:
        print("!! 浏览器报错：")
        for e in errors[:8]: print("  ", e[:200])
        raise SystemExit(1)
    print("全部通过")
    browser.close()
