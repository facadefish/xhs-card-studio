# 小红书图文助手

小红书图文笔记工作台：Markdown/txt 导入 → 模板化卡片设计 → 导出 PNG（ZIP）。
形态对标 GRID/FORM 式本地设计工具：双击 `启动工作台.bat` → 浏览器打开
`http://127.0.0.1:8321` → 打开即可编辑，全部逻辑在浏览器内，离线可用。

## 用法

```bash
启动工作台.bat        # 主入口：静态托管 web/ + 自动开浏览器（关窗口即停止）
python web/serve.py   # 无 uv 时的等价入口（仅需 Python 3.11+，零第三方依赖）
uv run md2xhs <文件.md> # 旧 CLI（Playwright 截图路线），保留给对话里快速转换
```

发行打包（v0.0.1 起）：`launcher.py` 是 PyInstaller 打包入口（冻结时从
sys._MEIPASS 读内置 web/）。构建命令：
`uv run --with pyinstaller python -m PyInstaller --onefile --noconfirm --clean --add-data "web;web" --name "小红书图文助手" --distpath dist launcher.py`。
产物 zip 结构见 README「快速开始 · 方式一」。

## 架构（改动前必读）

- **web/ 是纯前端单页应用，无构建步骤**（原生 JS，不用 npm）。
  唯一第三方依赖是 `web/vendor/markdown-it.min.js`（vendored，离线可用）。
- `web/serve.py` — 纯静态托管 + 开浏览器，端口 8321-8330 自动挑选。
  **没有任何渲染逻辑**；渲染、分页、导出全在浏览器里。
- `web/templates.js` — **模板库（20 套：封面 6 / 正文 11 / 结尾 3）**，
  每套是声明式定义：
  - `slots`：1242×1656 逻辑坐标 Box。`S(x,y,w,h,type,opts)` 显式类型
    （title/body/image/image2/footer…，key 前缀推断类型），opts 支持
    cls/fs/align/vm/weight/ls/ff/lh/color/rot。
  - `decos`：纯装饰元素（rect/ring/disc/line/frame/dots/tape/perf/barcode/
    sprocket），`z:"back"` 压底。
  - `labels`：固定文案标签，占位符 {n}/{total}/{author}/{title}/{year}。
  - `bodyCls`：正文卡壳（paper/mag2/bentocard/chat/sticky/chalk/term/
    letter/tl/check/centered/credits）。
  - `css`：模板级样式（自动加 `.tpl-<id>` 作用域，汇总进 EXTRA_CSS）。
  - `vars`：模板级 CSS 变量覆盖（暗色模板用，如 c9/t12/t13）。
  - `quote:true`：金句卡（t17），正文首段当大字金句排。
- `web/engine.js` — 核心：
  - `PAGE_CSS`：页面/槽位基础样式；`ALL_CSS = PAGE_CSS + EXTRA_CSS`（模板
    级 css 汇总），注入、量尺、导出三方共用同一份。
  - `PALETTES`：8 套配色（自定义背景时按亮度自动反推文字色）。
  - `MIGRATE`：旧存档模板 id 映射（c1-c4/t1-t6/e1/e2 → 新库）。
  - `bodyChromePad()`：探测 bodyCls 卡壳的垂直 padding，分页可用高度要
    扣除它（否则溢出裁字）。
  - `canChange` 锁定冲突探测（纯函数），`changeTemplate` 才落改。
  - `paginate`（async）：量尺在真实 DOM 里逐页测量贪心填充；量尺和渲染都
    用 `.blk` 包块，两侧边距规则必须保持一致（否则分页不准、底部裁字）。
  - 导出：`foreignObject` → canvas → PNG → 自带 mini-ZIP（stored+CRC32）。
    **必须走 XMLSerializer**（createDocument 用 XHTML 命名空间），直接字符串
    拼接 innerHTML 会因 `<img>` 未自闭合而 XML 解析失败；根元素命名空间为空
    则整页不渲染（导出全透明）。
- `web/app.js` — UI 绑定。`mutate(fn)` 是统一变更入口：await fn → paginate →
  **History.push（存变更后的快照）** → renderAll → saveDraft。撤销/重做
  直接恢复快照，不再过 mutate（否则重做指针被污染）。模板画廊是真实缩略图
  预览（`buildPreview()`，按 palette+customBg+customAccent+font 缓存）。
- 草稿：IndexedDB 自动保存（400ms 防抖）；历史 40 步。
- `doc` 结构：{palette, ratio, font, fsBody, lhBody, gapBlock, meta, pages[],
  blocks[], assign{}}。pages[i] = {id, templateId, overrides, locks, title, images}。
  正文流是全局 blocks 数组，paginate 把它分配到各页 body 槽（溢出自动补页，
  补页用 t7）。

## 20 套模板清单

- 封面：c5 杂志刊头 / c6 拍立得 / c7 大字海报 / c8 票根 / c9 胶片（暗色）/ c10 拱窗
- 正文：t7 手账纸 / t8 杂志双栏 / t9 便当格 / t10 聊天记录 / t11 便利贴 /
  t12 黑板报（暗色）/ t13 终端（暗色）/ t14 信纸 / t15 时间轴 / t16 打卡清单 / t17 金句卡
- 结尾：e3 印章落款 / e4 关注引导 / e5 谢幕

每套都有网上找来的参考图（`references/<id>.<ext>`，候选在 `references/raw/<id>/`，
来源记录 `references/manifest.tsv`，清单 `references/REFERENCES.md`），
复刻后对照参考图迭代。加新模板 = templates.js 里加一条 + 抓参考图 + 截图对比。

## 参考图与对比工具

- `scripts/fetch_refs.py` — Openverse API 抓候选图（匿名可用；站酷/花瓣/
  Bing/百度图片对 curl 全部反爬降级，勿走回头路）。限速 3s/查询。
- `scripts/make_sheets.py` — 候选图拼 contact sheet 到 `references/sheets/`，
  目检挑图（pillow 用 `uv run --with pillow` 临时带，不进项目依赖）。
- `scripts/pick_refs.py` — 把挑定的那张从 `references/raw/<id>/` 固化成
  `references/<id>.<ext>`，并记录来源到 `references/manifest.tsv`。
- `web/gallery.html` — 同一样本内容渲染全部 20 套，`.shot[data-tid]`，
  `window.__ready` 就绪标记。
- `scripts/e2e_gallery.py` — Playwright 逐套截图到 `output/tpl-compare/<id>.png`。

## 修改时的硬约束

- 分页测量环境与渲染环境的 DOM 结构、CSS 必须同源（同一份 ALL_CSS、同样
  的 .blk 包裹），改了 .blk 结构量尺和渲染要一起改。
- `.blk::before` 等伪元素装饰若放在负 left，会被 `.slot-body{overflow:hidden}`
  裁掉——要把 body box 外扩 + padding 让装饰落在盒内（t15 时间轴就是这么修的）。
- 覆盖 `.blk>*` 的规则注意优先级（`.tpl-x .slot-body .blk>h2` 才打得过
  `.tpl-x .slot-body .blk>*`）。
- 内容页 title 槽默认空（page.title 为空则不渲染文字，编辑器用 :empty::before
  显示提示，伪元素不进导出）。
- 测试入口：`uv run python scripts/e2e_studio.py`（需先起 serve.py），
  覆盖导入/直改/模板/随机+锁定/撤销重做/导出 ZIP/草稿恢复。
- Playwright 用 `channel="msedge"`（本机无 chromium）；evaluate 字符串若含
  `=>` 一律包成 `() => ...`；`tplOf(页对象)` 是误用（页对象有 .id 属性会落
  兜底）——要传 templateId。
- Windows 控制台 GBK：python 输出中文管道时 `| iconv -f GBK -t UTF-8`。
- Git Bash 的 bash 5.2 默认开 `patsub_replacement`：`${var//pat/&}` 里的
  `&` 会被替换成匹配文本本身，替换 `&` 必须写 `\&`。
- JS 块注释里写 `image*/footer` 的 `*/` 会提前终结注释（踩过）。

## CLI 路线（保留）

`md2xhs/`（render.py、base.html、themes/）= 旧 CLI 截图路线，保留给对话里
快速转换。Python 两段式工作台（web.py/workbench.html）已删除。
