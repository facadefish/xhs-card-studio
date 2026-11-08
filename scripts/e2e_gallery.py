"""渲染全部模板并逐张截图 → output/tpl-compare/<id>.png，供与 references/ 目检对比"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = "file:///" + (ROOT / "web" / "gallery.html").as_posix()
OUT = ROOT / "output" / "tpl-compare"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=2)
        page.goto(URL)
        page.wait_for_function("window.__ready === true", timeout=15000)
        shots = page.query_selector_all(".shot")
        print(f"共 {len(shots)} 套模板")
        for shot in shots:
            tid = shot.get_attribute("data-tid")
            inner = shot.query_selector(".page")
            inner.screenshot(path=str(OUT / f"{tid}.png"))
            print(f"  {tid}.png")
        browser.close()
    print("done")


if __name__ == "__main__":
    main()
