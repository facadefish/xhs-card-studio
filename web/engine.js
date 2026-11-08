/* 小红书图文工作室 — engine.js
 * 数据模型 / 版式模板库 / 配色 / 分页 / 导出（foreignObject→PNG→ZIP）/ 草稿与历史
 * 纯浏览器运行，无服务端逻辑。
 */
"use strict";

/* ==================== 页面样式（导出与预览共用，必须自包含） ==================== */
const PAGE_CSS = `
.page, .page * { box-sizing:border-box; }
.page {
  --fs-body:34px; --lh-body:1.85; --gap-block:28px;
  --bg:#fff; --ink:#262626; --muted:#8a8a8a; --accent:#ff2442;
  --line:#e8e8e8; --soft:#f7f7f7; --card:#fff;
  position:relative; overflow:hidden;
  background:var(--bg); color:var(--ink);
  font-family:var(--font-family,"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif);
  font-size:var(--fs-body);
}
.slot { position:absolute; }
.slot-title { font-weight:800; line-height:1.3; letter-spacing:.02em; overflow:hidden; }
.slot-title .t { outline:none; }
.deco-bar { width:100%; height:100%; background:var(--accent); border-radius:99px; }
.slot-deco.side { background:var(--accent); border-radius:99px; }
.slot-body { line-height:var(--lh-body); overflow:hidden; }
.slot-body > * { margin:0 0 var(--gap-block); }
.slot-body > *:last-child { margin-bottom:0; }
/* 渲染时每个块包一层 .blk，内部元素的边距要与量尺环境（直接子元素）一致 */
.slot-body > .blk { margin:0 0 var(--gap-block); }
.slot-body > .blk:last-child { margin-bottom:0; }
.slot-body .blk > * { margin:0 0 var(--gap-block); }
.slot-body .blk > *:last-child { margin-bottom:0; }
.slot-body h1 { font-size:1.8em; line-height:1.35; font-weight:700; }
.slot-body h2 { font-size:1.4em; line-height:1.4; font-weight:700; padding-left:.55em; border-left:.25em solid var(--accent); }
.slot-body h3 { font-size:1.15em; line-height:1.45; font-weight:700; }
.slot-body p, .slot-body li { font-size:inherit; line-height:inherit; }
.slot-body ul, .slot-body ol { padding-left:1.35em; }
.slot-body li { margin:0 0 .35em; }
.slot-body strong { color:var(--accent); font-weight:700; }
.slot-body em { font-style:normal; border-bottom:.09em solid var(--accent); }
.slot-body blockquote { background:var(--soft); border-left:.3em solid var(--accent); border-radius:0 .5em .5em 0; padding:.8em 1em; }
.slot-body pre { background:var(--soft); border-radius:.5em; padding:.9em 1em; font-family:Consolas,"Courier New",monospace; font-size:.8em; line-height:1.75; white-space:pre-wrap; word-break:break-all; }
.slot-body code { font-family:Consolas,"Courier New",monospace; background:var(--soft); padding:.06em .3em; border-radius:.25em; font-size:.85em; }
.slot-body pre code { background:none; padding:0; font-size:inherit; }
.slot-body table { width:100%; border-collapse:collapse; font-size:.85em; line-height:1.6; }
.slot-body th, .slot-body td { border:2px solid var(--line); padding:.5em .6em; text-align:left; }
.slot-body th { background:var(--soft); font-weight:700; }
.slot-body img { max-width:100%; border-radius:.5em; }
.slot-body hr { border:none; border-top:2px solid var(--line); }
.slot-body.quote-mode { text-align:center; font-weight:600; }
.slot-image { border-radius:24px; overflow:hidden; }
.slot-image img { width:100%; height:100%; object-fit:cover; display:block; }
.slot-image.empty { border:3px dashed var(--line); background:repeating-linear-gradient(45deg, transparent 0 14px, rgba(128,128,128,.07) 14px 28px); }
.slot-footer { color:var(--muted); font-size:26px; letter-spacing:.06em; display:flex; align-items:center; justify-content:space-between; overflow:hidden; }
/* 模板级装饰与静态标签（不响应点击，不进入锁定/冲突检测） */
.slot-deco, .slot-label { position:absolute; pointer-events:none; }
.slot-label { color:var(--muted); line-height:1.25; overflow:hidden; white-space:pre-wrap; }
.deco-rect { background:var(--accent); border-radius:12px; }
.deco-ring { border:8px solid var(--accent); border-radius:50%; }
.deco-disc { background:var(--accent); border-radius:50%; }
.deco-line { background:var(--line); border-radius:99px; }
.deco-frame { border:4px solid var(--ink); border-radius:32px; }
.deco-dots { background-image:radial-gradient(var(--accent) 5px, transparent 6px); background-size:36px 36px; }
.deco-tape { background:var(--accent); opacity:.4; border-radius:3px; }
.deco-perf { height:0 !important; border-top:5px dashed var(--muted); background:none; }
.deco-barcode { background:repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 10px, var(--ink) 10px 13px, transparent 13px 21px, var(--ink) 21px 28px, transparent 28px 33px); }
.deco-sprocket { background:#050505; border-top:2px solid #2a2a2a; border-bottom:2px solid #2a2a2a; }
.deco-sprocket::before { content:""; position:absolute; left:36px; right:36px; top:50%; height:40px; transform:translateY(-50%); border-radius:9px; background:repeating-linear-gradient(90deg, #e8e4d8 0 48px, transparent 48px 96px); }
/* 图片造型 */
.img-polaroid { background:#fff; padding:26px 26px 100px; box-shadow:0 16px 44px rgba(0,0,0,.16); border-radius:6px; }
.img-arch { border-radius:999px 999px 20px 20px; }
.img-circle { border-radius:50%; }
/* 通用标签/正文造型 */
.slot-label.chip { display:flex; align-items:center; justify-content:center; background:var(--accent); color:#fff; border-radius:99px; font-weight:700; }
.slot-label.ghost { opacity:.15; }
.slot-body.centered { text-align:center; }
`;

/* ==================== 配色（学参考：整组联动，自动保证对比） ==================== */
const PALETTES = [
  { id:"minimal", name:"白纸红",   bg:"#ffffff", ink:"#262626", muted:"#8a8a8a", accent:"#ff2442", line:"#e8e8e8", soft:"#f7f7f7", card:"#ffffff" },
  { id:"morandi", name:"鼠尾草",   bg:"#f4f1ea", ink:"#45403a", muted:"#9a938a", accent:"#8a9a87", line:"#ddd5c9", soft:"#ebe6db", card:"#fbf9f4" },
  { id:"dark",    name:"暗夜金",   bg:"#191a1c", ink:"#ececec", muted:"#8b8e94", accent:"#e0b56a", line:"#33353a", soft:"#222327", card:"#222327" },
  { id:"parchment",name:"羊皮纸",  bg:"#f6f1e7", ink:"#3a332a", muted:"#9c917e", accent:"#b5854d", line:"#e2d8c6", soft:"#efe8d9", card:"#fbf7ee" },
  { id:"terra",   name:"陶土",     bg:"#f5ebe4", ink:"#4a3630", muted:"#a59084", accent:"#c0674e", line:"#e6d3c8", soft:"#f0e2d8", card:"#faf1ea" },
  { id:"mist",    name:"雾灰蓝",   bg:"#eef1f4", ink:"#333a42", muted:"#8d97a1", accent:"#5f7d9c", line:"#d8dee4", soft:"#e4e9ee", card:"#f6f8fa" },
  { id:"pine",    name:"深松绿",   bg:"#1d2622", ink:"#e8efe9", muted:"#8fa398", accent:"#7fb08a", line:"#31413a", soft:"#242f2a", card:"#242f2a" },
  { id:"lilac",   name:"灰紫",     bg:"#f2eff4", ink:"#3d3742", muted:"#9a92a3", accent:"#8a6f9e", line:"#ddd6e2", soft:"#e9e4ec", card:"#f9f6fb" },
];
function luminance(hex) {
  const c = hex.replace("#", "");
  const f = (s) => { const v = parseInt(s, 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.slice(0, 2)) + 0.7152 * f(c.slice(2, 4)) + 0.0722 * f(c.slice(4, 6));
}
function paletteVars(doc) {
  const p = PALETTES.find(x => x.id === doc.palette) || PALETTES[0];
  const v = { "--bg": p.bg, "--ink": p.ink, "--muted": p.muted, "--accent": p.accent,
              "--line": p.line, "--soft": p.soft, "--card": p.card };
  if (doc.customBg) {
    v["--bg"] = doc.customBg;
    v["--ink"] = luminance(doc.customBg) > 0.35 ? "#262626" : "#f0f0f0";
    v["--muted"] = luminance(doc.customBg) > 0.35 ? "#8a8a8a" : "#9a9ba0";
    v["--line"] = luminance(doc.customBg) > 0.35 ? "#e2e2e2" : "#3a3b40";
    v["--soft"] = luminance(doc.customBg) > 0.35 ? "#f4f4f4" : "#24262a";
  }
  if (doc.customAccent) v["--accent"] = doc.customAccent;
  return v;
}

/* ==================== 版式模板库（20 套，定义在 templates.js，Box 基于 1242×1656） ==================== */
/* 旧库 id 迁移映射（旧草稿打开时落到新库的同类版式） */
const MIGRATE = { c1:"c5", c2:"c5", c3:"c6", c4:"c9", t1:"t7", t2:"t7", t3:"t17", t4:"t9", t5:"t9", t6:"t15", e1:"e3", e2:"e5" };
const tplOf = (id) => TPL.find(t => t.id === id) || TPL.find(t => t.id === MIGRATE[id]) || TPL.find(t => t.id === "t7") || TPL[0];
const ALL_CSS = PAGE_CSS + "\n" + EXTRA_CSS;
/* slot 类型：显式 t 优先，否则按 key 推断（image2/image3 也算图片位） */
function slotTypeOf(t, key) {
  const v = t.slots[key];
  if (v && v.t) return v.t;
  if (key.startsWith("image")) return "image";
  return key;
}
const LABEL_COLORS = { accent:"var(--accent)", muted:"var(--muted)", ink:"var(--ink)", line:"var(--line)" };
const resolveColor = c => LABEL_COLORS[c] || c;
function substLabel(text, doc, pageno, total) {
  return String(text)
    .replace(/\{n\}/g, pageno).replace(/\{total\}/g, total)
    .replace(/\{year\}/g, new Date().getFullYear())
    .replace(/\{author\}/g, doc.meta.author || "你的昵称")
    .replace(/\{title\}/g, doc.meta.title || "笔记标题");
}
let _uid = 1;
const uid = () => "u" + Date.now().toString(36) + (_uid++);

/* ==================== 数据模型 ==================== */
function newDoc() {
  return { v:2, palette:"minimal", customBg:null, customAccent:null,
    ratio:"3:4", font:"", fsBody:34, lhBody:1.85, gapBlock:28,
    meta:{ title:"", author:"" },
    pages:[ { id:uid(), templateId:"c5", overrides:{}, locks:[], title:"", images:{} } ],
    blocks:[], assign:{} };
}
function canvasSize(doc) {
  const [w, h] = doc.ratio.split(":").map(Number);
  return { W:1242, H:Math.round(1242 * h / w) };
}
function pageVars(doc) {
  return { ...paletteVars(doc),
    "--fs-body": doc.fsBody + "px", "--lh-body": String(doc.lhBody),
    "--gap-block": doc.gapBlock + "px",
    ...(doc.font ? { "--font-family": doc.font } : {}) };
}
function slotBox(page, key) {
  const t = tplOf(page.templateId);
  return (page.overrides && page.overrides[key]) || t.slots[key];
}

/* ==================== Markdown 导入 ==================== */
let _md = null;
function md() {
  if (!_md) _md = window.markdownit({ linkify:true, breaks:false }).enable(["table","strikethrough"]);
  return _md;
}
function mdToBlocks(text) {
  const host = document.createElement("div");
  host.innerHTML = md().render(text);
  return [...host.children].map(el => ({ id:uid(), html:el.outerHTML }));
}
function waitImages(root) {
  const imgs = [...root.querySelectorAll("img")];
  return Promise.all(imgs.map(i => i.complete ? 1 :
    new Promise(res => { i.onload = i.onerror = () => res(1); })));
}
async function inlineLocalImages(host) {
  for (const img of host.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (!src || /^(https?:|data:|#)/i.test(src)) continue;
    try {
      const r = await fetch(src);
      if (!r.ok) continue;
      const b = await r.blob();
      img.src = await new Promise(res => {
        const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b);
      });
    } catch { /* 保留原路径 */ }
  }
}
async function importMarkdown(doc, text) {
  const host = document.createElement("div");
  host.innerHTML = md().render(text);
  await inlineLocalImages(host);
  const blocks = [...host.children];
  let title = doc.meta.title;
  if (blocks[0] && blocks[0].tagName === "H1") {
    title = blocks[0].textContent.trim() || title;
    blocks.shift();
  }
  doc.meta.title = title;
  doc.blocks = blocks.map(el => ({ id:uid(), html:el.outerHTML }));
  // 封面标题写入第一页
  const cover = doc.pages.find(p => tplOf(p.templateId).kind === "cover") || doc.pages[0];
  if (cover) cover.title = title;
  await paginate(doc);
  return title;
}

/* ==================== 分页（量尺在真实浏览器内测量，同服务端时代逻辑） ==================== */
const _measure = document.createElement("div");
_measure.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden";
document.documentElement.appendChild(_measure);

function measureHeights(blocks, width, vars, tplCls = "", bodyCls = "") {
  _measure.style.width = width + "px";
  const inner = blocks.map(b => `<div class="blk">${b.html}</div>`).join("");
  _measure.innerHTML = `<div class="page ${tplCls}" style="${styleStr(vars)}"><div class="slot-body ${bodyCls}" style="width:${width}px">${inner}</div></div>`;
  const kids = _measure.querySelectorAll(".slot-body > .blk");
  return [...kids].map((el, i) => ({ bid: blocks[i].id,
    h: el.offsetHeight + parseFloat(getComputedStyle(el).marginBottom || 0) }));
}
/* 正文卡壳（bodyCls）的上下内边距：分页可用高度必须把它减掉，否则会溢出裁字 */
const _chromePadCache = {};
function bodyChromePad(t, vars) {
  const key = t.id + "|" + (t.bodyCls || "");
  if (_chromePadCache[key] != null) return _chromePadCache[key];
  _measure.innerHTML = `<div class="page tpl-${t.id}" style="${styleStr(vars)}"><div class="slot-body ${t.bodyCls || ""}" style="width:200px"></div></div>`;
  const cs = getComputedStyle(_measure.querySelector(".slot-body"));
  const pad = parseFloat(cs.paddingTop || 0) + parseFloat(cs.paddingBottom || 0);
  _chromePadCache[key] = pad;
  return pad;
}
async function paginate(doc) {
  await waitImages(_measure);
  const vars = pageVars(doc);
  const { H } = canvasSize(doc);
  let pool = [...doc.blocks];
  let contentSeen = false;
  for (const page of doc.pages) {
    const t = tplOf(page.templateId);
    doc.assign[page.id] = [];
    if (t.kind !== "content" || !t.slots.body) continue;
    contentSeen = true;
    const box = slotBox(page, "body");
    const avail = box.h - bodyChromePad(t, vars);
    const hs = measureHeights(pool, box.w, vars, "tpl-" + t.id, t.bodyCls || "");
    let used = 0, i = 0;
    for (; i < pool.length; i++) {
      const bh = hs[i] ? hs[i].h : 0;
      if (i > 0 && used + bh > avail) break;
      used += bh;
      doc.assign[page.id].push(pool[i].id);
    }
    // 标题不孤行：body 流内 h2/h3 恰好顶格在末尾时不单独处理（流式排版允许多种收尾）
    pool = pool.slice(i);
  }
  // 剩余内容自动补页
  while (pool.length) {
    const page = { id:uid(), templateId:"t7", overrides:{}, locks:[], title:"", images:{} };
    doc.pages.splice(doc.pages.length, 0, page); // 追加在末尾
    const box = slotBox(page, "body");
    const t = tplOf(page.templateId);
    const avail = box.h - bodyChromePad(t, vars);
    const hs = measureHeights(pool, box.w, vars, "tpl-" + t.id, t.bodyCls || "");
    let used = 0, i = 0;
    for (; i < pool.length; i++) {
      const bh = hs[i] ? hs[i].h : 0;
      if (i > 0 && used + bh > avail) break;
      used += bh;
    }
    doc.assign[page.id] = pool.slice(0, i).map(b => b.id);
    pool = pool.slice(i);
    void H; void contentSeen;
  }
  return doc;
}

function styleStr(vars) {
  return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");
}

/* ==================== 页面渲染（DOM 构建） ==================== */
function buildPageDOM(doc, page, opts = {}) {
  const { W, H } = canvasSize(doc);
  const t = tplOf(page.templateId);
  const el = document.createElement("div");
  el.className = "page tpl-" + t.id;
  el.dataset.pid = page.id;
  const vars = pageVars(doc);
  if (t.vars) Object.assign(vars, t.vars); // 固定气质模板（胶片/黑板/终端）覆盖配色变量
  el.style.cssText = `width:${W}px;height:${H}px;${styleStr(vars)}`;
  const pageno = doc.pages.indexOf(page) + 1;
  const blocksOf = (doc.assign[page.id] || [])
    .map(bid => doc.blocks.find(b => b.id === bid)).filter(Boolean);

  // 装饰（z:"back" 的压在内容下面）
  for (const d of (t.decos || []).filter(d => d.z === "back")) el.appendChild(buildDeco(d));

  for (const [key, slotDef] of Object.entries(t.slots)) {
    const box = slotBox(page, key);
    const type = slotTypeOf(t, key);
    const slot = document.createElement("div");
    slot.className = `slot slot-${type}` + (slotDef.cls ? " " + slotDef.cls : "");
    slot.dataset.slot = key;
    slot.style.cssText = `left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px`;
    if (slotDef.rot) slot.style.transform = `rotate(${slotDef.rot}deg)`;
    if (type === "title") {
      slot.innerHTML = `<div class="t" data-title>${escapeHtml(page.title || "")}</div>`;
      const tfs = page.overrides && page.overrides.titleFont;
      slot.style.fontSize = (tfs ? tfs + "px" : null) || slotDef.fs || (Math.min(box.h * 0.42, 96) + "px");
      if (slotDef.align) slot.style.textAlign = slotDef.align;
      if (slotDef.vm) slot.style.writingMode = "vertical-rl";
      if (slotDef.weight) slot.style.fontWeight = slotDef.weight;
      if (slotDef.ls) slot.style.letterSpacing = slotDef.ls;
      if (slotDef.ff) slot.style.fontFamily = slotDef.ff;
      if (slotDef.lh) slot.style.lineHeight = slotDef.lh;
      if (slotDef.color) slot.style.color = resolveColor(slotDef.color);
    } else if (type === "deco") {
      slot.innerHTML = `<div class="deco-bar"></div>`;
      if (t.id === "t6") slot.classList.add("side");
    } else if (type === "body") {
      slot.innerHTML = blocksOf.map(b => `<div class="blk" data-bid="${b.id}">${b.html}</div>`).join("");
      if (t.bodyCls) slot.classList.add(...t.bodyCls.split(" "));
      if (t.quote) slot.classList.add("quote-mode");
    } else if (type === "image") {
      const src = page.images && page.images[key];
      if (src) slot.innerHTML = `<img src="${src}" alt="">`;
      else { slot.classList.add("empty"); slot.innerHTML = `<div class="ph" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:28px">点击上传图片</div>`; }
    } else if (type === "footer") {
      slot.innerHTML = `<span>${escapeHtml(doc.meta.author || "")}</span><span>${pageno} / ${doc.pages.length}</span>`;
    }
    el.appendChild(slot);
  }

  for (const d of (t.decos || []).filter(d => d.z !== "back")) el.appendChild(buildDeco(d));
  for (const l of t.labels || []) el.appendChild(buildLabel(l, doc, pageno));
  if (opts.thumb) { /* 缩略图无需额外处理，外层缩放 */ }
  return el;
}
function buildDeco(d) {
  const el = document.createElement("div");
  el.className = "slot-deco deco-" + d.k + (d.cls ? " " + d.cls : "");
  el.style.cssText = `left:${d.box.x}px;top:${d.box.y}px;width:${d.box.w}px;height:${d.box.h}px`
    + (d.rot ? `;transform:rotate(${d.rot}deg)` : "");
  return el;
}
function buildLabel(l, doc, pageno) {
  const el = document.createElement("div");
  el.className = "slot-label" + (l.cls ? " " + l.cls : "");
  let css = `left:${l.box.x}px;top:${l.box.y}px;width:${l.box.w}px;height:${l.box.h}px;font-size:${l.fs || 28}px`;
  if (l.align) css += `;text-align:${l.align}`;
  if (l.color) css += `;color:${resolveColor(l.color)}`;
  if (l.weight) css += `;font-weight:${l.weight}`;
  if (l.ls) css += `;letter-spacing:${l.ls}`;
  if (l.ff) css += `;font-family:${l.ff}`;
  if (l.lh) css += `;line-height:${l.lh}`;
  if (l.vm) css += `;writing-mode:vertical-rl`;
  if (l.nowrap) css += `;white-space:nowrap`;
  if (l.rot) css += `;transform:rotate(${l.rot}deg)`;
  el.style.cssText = css;
  el.textContent = substLabel(l.text, doc, pageno, doc.pages.length);
  return el;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
}

/* ==================== 随机换版式（锁定 + 冲突检测，移植参考逻辑） ==================== */
const intersects = (a, b, g = 8) => a.x < b.x + b.w + g && a.x + a.w + g > b.x && a.y < b.y + b.h + g && a.y + a.h + g > b.y;
/* 纯探测：不修改 doc，返回 {templateId, overrides} 或 null */
function canChange(doc, page, tplId) {
  const t = tplOf(tplId);
  if (tplOf(page.templateId).kind !== t.kind) return null; // 只换同类（封面/正文/结尾）
  const old = { ...tplOf(page.templateId).slots, ...(page.overrides || {}) };
  const overrides = {};
  (page.locks || []).forEach(k => { if (old[k]) overrides[k] = { ...old[k] }; });
  const nb = { ...t.slots, ...overrides };
  const keys = Object.keys(t.slots).filter(k => k !== "footer" && k !== "deco");
  for (const lk of (page.locks || [])) {
    for (const k of keys) {
      if (k !== lk && nb[lk] && nb[k] && intersects(nb[lk], nb[k])) return null;
    }
  }
  return { templateId: tplId, overrides };
}
function changeTemplate(doc, page, tplId) {
  const c = canChange(doc, page, tplId);
  if (!c) return false;
  page.templateId = c.templateId;
  page.overrides = c.overrides;
  return true;
}
/* 纯探测：随机挑一个可换的模板 id，不改 doc */
function randomTemplate(doc, page, rand = Math.random) {
  const cur = tplOf(page.templateId);
  const pool = TPL.filter(t => t.family === cur.family && t.id !== cur.id);
  for (let tries = 0; tries < 20 && pool.length; tries++) {
    const t = pool[Math.floor(rand() * pool.length)];
    if (canChange(doc, page, t.id)) return t.id;
  }
  return null;
}

/* ==================== 导出：foreignObject → PNG → ZIP ==================== */
function pageExportHTML(doc, pageEl) {
  const clone = pageEl.cloneNode(true);
  clone.querySelectorAll("[contenteditable]").forEach(n => n.removeAttribute("contenteditable"));
  clone.querySelectorAll(".slot.selected,.blk.selected").forEach(n => n.classList.remove("selected"));
  clone.querySelectorAll(".slot-image.empty").forEach(n => n.remove());
  /* 必须走 XML 序列化：innerHTML 的 <img>/<br> 等 void 元素不带自闭合，
   * 直接字符串拼接进 foreignObject 会因 XML 解析失败 */
  const xdoc = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "div", null);
  const st = xdoc.createElement("style");
  st.textContent = ALL_CSS;
  xdoc.documentElement.appendChild(st);
  xdoc.documentElement.appendChild(xdoc.importNode(clone, true));
  return new XMLSerializer().serializeToString(xdoc.documentElement);
}
async function pageToPngBlob(doc, pageEl, scale = 2) {
  const { W, H } = canvasSize(doc);
  const xhtml = pageExportHTML(doc, pageEl);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%">${xhtml}</foreignObject></svg>`;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("SVG 栅格化失败")); img.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise(res => canvas.toBlob(res, "image/png"));
}
/* 最小 ZIP（stored 无压缩，CRC32） */
const _crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(u8) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = _crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function makeZip(entries) {
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  const u16 = v => new Uint8Array([v & 255, (v >> 8) & 255]);
  const u32 = v => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
  for (const e of entries) {
    const name = enc.encode(e.name), crc = crc32(e.data), size = e.data.length;
    const head = [u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(name.length), u16(0)];
    parts.push(...head, name, e.data);
    central.push({ name, crc, size, offset });
    offset += 30 + name.length + size;
  }
  const cdStart = offset;
  for (const c of central) {
    parts.push(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset));
    parts.push(c.name);
    offset += 46 + c.name.length;
  }
  parts.push(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(offset - cdStart), u32(cdStart), u16(0));
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
async function exportDoc(doc, pageEls, scale = 2) {
  await document.fonts.ready;
  const entries = [];
  for (let i = 0; i < pageEls.length; i++) {
    const blob = await pageToPngBlob(doc, pageEls[i], scale);
    entries.push({ name: `page-${String(i + 1).padStart(2, "0")}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
  }
  const zip = makeZip(entries);
  return new Blob([zip], { type: "application/zip" });
}

/* ==================== IndexedDB 草稿 + 历史 ==================== */
const idb = {
  open() { return new Promise((res, rej) => { const r = indexedDB.open("xhs-studio", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("draft"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async set(v) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction("draft", "readwrite"); tx.objectStore("draft").put(v, "doc"); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
  async get() { const db = await this.open(); return new Promise((res) => { const rq = db.transaction("draft").objectStore("draft").get("doc"); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); }); },
};

const History = {
  stack: [], idx: -1, cap: 40,
  push(doc) {
    this.stack = this.stack.slice(0, this.idx + 1);
    this.stack.push(JSON.stringify(doc));
    if (this.stack.length > this.cap) this.stack.shift();
    this.idx = this.stack.length - 1;
  },
  undo() { if (this.idx > 0) { this.idx--; return JSON.parse(this.stack[this.idx]); } return null; },
  redo() { if (this.idx < this.stack.length - 1) { this.idx++; return JSON.parse(this.stack[this.idx]); } return null; },
  reset(doc) { this.stack = [JSON.stringify(doc)]; this.idx = 0; },
};
