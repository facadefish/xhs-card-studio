/* 小红书图文工作室 — app.js：UI 绑定与交互 */
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* 注入页面样式（预览/测量/导出共用，含模板专属样式） */
const styleEl = document.createElement("style");
styleEl.textContent = ALL_CSS;
document.head.appendChild(styleEl);

let doc = newDoc();
let selectedPid = doc.pages[0].id;
let selectedSlot = null;   // {pageId, key}
let zoom = 0.5;
let saveTimer = null;

/* ---------- 状态栏/草稿 ---------- */
function status(msg, dirty) {
  const el = $("#status");
  el.textContent = msg;
  el.className = dirty ? "dirty" : "";
}
function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await idb.set(JSON.parse(JSON.stringify(doc))); $("#savestate").textContent = "草稿已自动保存 " + new Date().toLocaleTimeString(); }
    catch (e) { $("#savestate").textContent = "草稿保存失败：" + e.message; }
  }, 400);
}
async function mutate(fn, msg) {
  await fn();
  await paginate(doc);
  History.push(doc); /* 存变更后的状态，undo 即回到上一快照 */
  renderAll();
  if (msg) status(msg);
  saveDraft();
}

/* ---------- 渲染 ---------- */
function renderAll() {
  renderFilm();
  renderEditor();
  renderSide();
}
function renderFilm() {
  const film = $("#film");
  film.innerHTML = "";
  doc.pages.forEach((p, i) => {
    const t = tplOf(p.templateId);
    const d = document.createElement("div");
    d.className = "thumb" + (p.id === selectedPid ? " sel" : "");
    const inner = buildPageDOM(doc, p);
    inner.style.pointerEvents = "none";
    const sc = 126 / canvasSize(doc).W;
    inner.style.transformOrigin = "0 0";
    inner.style.transform = `scale(${sc})`;
    d.appendChild(inner);
    d.appendChild(Object.assign(document.createElement("div"), { className: "tag", textContent: `${i + 1}·${t.name}` }));
    d.onclick = () => { selectedPid = p.id; selectedSlot = null; renderAll(); };
    film.appendChild(d);
    d.style.height = (canvasSize(doc).H * sc) + "px";
  });
  const add = document.createElement("button");
  add.className = "add"; add.textContent = "＋ 添加封面/正文页";
  add.onclick = () => mutate(() => {
    const kinds = doc.pages.map(p => tplOf(p.templateId).kind);
    const tpl = kinds.includes("cover") ? "t7" : "c5";
    doc.pages.push({ id: uid(), templateId: tpl, overrides: {}, locks: [], title: "", images: {} });
    selectedPid = doc.pages[doc.pages.length - 1].id;
  }, "已加页");
  film.appendChild(add);
}
function renderEditor() {
  const holder = $("#holder");
  holder.innerHTML = "";
  const page = doc.pages.find(p => p.id === selectedPid) || doc.pages[0];
  selectedPid = page.id;
  const el = buildPageDOM(doc, page);
  el.addEventListener("dblclick", onDblClick);
  el.addEventListener("click", onPageClick);
  holder.appendChild(el);
  fitZoom();
  if (selectedSlot && selectedSlot.pageId === page.id) markSelected(selectedSlot.key);
}
function fitZoom() {
  const wrap = $("#stage-wrap");
  const { W, H } = canvasSize(doc);
  zoom = Math.min((wrap.clientWidth - 48) / W, (wrap.clientHeight - 48) / H, 1);
  const holder = $("#holder");
  holder.style.transform = `scale(${zoom})`;
  holder.style.width = W + "px";
  holder.style.height = H + "px";
  wrap.style.padding = "24px";
  holder.parentElement.style.alignItems = "flex-start";
  holder.parentElement.style.justifyContent = "flex-start";
}
/* 模板缩略图用的样本 doc：固定三段示例内容，跟随当前配色/字体 */
let _pvCacheKey = "", _pvCache = null;
function previewDoc() {
  const key = [doc.palette, doc.customBg, doc.customAccent, doc.font].join("|");
  if (_pvCache && _pvCacheKey === key) return _pvCache;
  _pvCacheKey = key;
  _pvCache = { v:2, palette:doc.palette, customBg:doc.customBg, customAccent:doc.customAccent,
    ratio:"3:4", font:doc.font, fsBody:34, lhBody:1.85, gapBlock:28,
    meta:{ title:"笔记标题示例", author:"作者名" },
    pages:[], assign:{},
    blocks:[
      { id:"pb1", html:"<h2>小节标题</h2>" },
      { id:"pb2", html:"<p>这里是正文示例，展示这套版式的<strong>重点</strong>与留白气质。</p>" },
      { id:"pb3", html:"<p>第二条内容，保持相同文字方便横向对比。</p>" },
    ] };
  return _pvCache;
}
function buildPreview(t) {
  const d = previewDoc();
  const page = { id:"pv-" + t.id, templateId:t.id, overrides:{}, locks:[],
    title: t.slots.title ? d.meta.title : "", images:{} };
  d.pages = [page];
  d.assign[page.id] = t.slots.body ? d.blocks.map(b => b.id) : [];
  return buildPageDOM(d, page);
}
function renderSide() {
  // 模板库（真实缩略图预览）
  const page = doc.pages.find(p => p.id === selectedPid);
  const cur = tplOf(page.templateId);
  const box = $("#tplbox");
  box.innerHTML = "";
  for (const fam of ["封面", "正文", "结尾"]) {
    const h = document.createElement("div");
    h.style.cssText = "color:var(--muted);font-size:11px;margin:6px 0 4px";
    h.textContent = fam;
    box.appendChild(h);
    const grid = document.createElement("div");
    grid.className = "tpl-grid";
    TPL.filter(t => t.family === fam).forEach(t => {
      const w = document.createElement("div");
      w.className = "tpl-thumb" + (t.id === page.templateId ? " cur" : "");
      if (cur.kind !== t.kind) w.classList.add("dim");
      const inner = buildPreview(t);
      const sc = 105 / canvasSize(doc).W;
      inner.style.transformOrigin = "0 0";
      inner.style.transform = `scale(${sc})`;
      inner.style.pointerEvents = "none";
      const frame = document.createElement("div");
      frame.className = "pv";
      frame.style.height = Math.round(canvasSize(doc).H * sc) + "px";
      frame.appendChild(inner);
      w.appendChild(frame);
      w.appendChild(Object.assign(document.createElement("div"), { className: "nm", textContent: t.name }));
      w.onclick = () => {
        if (!canChange(doc, page, t.id)) return status("该模板与锁定区块冲突", true);
        mutate(() => changeTemplate(doc, page, t.id), `已应用「${t.name}」`);
      };
      grid.appendChild(w);
    });
    box.appendChild(grid);
  }
  void cur;
  // 样式控件回显
  $("#s-palette").value = doc.palette;
  $("#s-ratio").value = doc.ratio;
  $("#s-font").value = doc.font;
  $("#r-fs").value = doc.fsBody; $("#v-fs").textContent = doc.fsBody + "px";
  $("#r-lh").value = doc.lhBody; $("#v-lh").textContent = doc.lhBody;
  $("#r-gap").value = doc.gapBlock; $("#v-gap").textContent = doc.gapBlock + "px";
  $("#i-title").value = doc.meta.title;
  $("#i-author").value = doc.meta.author;
  $("#c-custombg").checked = !!doc.customBg;
  if (doc.customBg) $("#i-bg").value = doc.customBg;
  $("#c-customaccent").checked = !!doc.customAccent;
  if (doc.customAccent) $("#i-accent").value = doc.customAccent;
  renderInspector();
}
function renderInspector() {
  const insp = $("#inspector");
  const page = doc.pages.find(p => p.id === selectedPid);
  if (!selectedSlot || selectedSlot.pageId !== page.id) { insp.classList.add("hidden"); return; }
  insp.classList.remove("hidden");
  const key = selectedSlot.key;
  const tpl = tplOf(page.templateId);
  const type = slotTypeOf(tpl, key);
  $("#insp-name").textContent = { title:"标题", body:"正文", footer:"页脚", deco:"装饰" }[type]
    || (type === "image" ? `图片（${key}）` : key);
  $("#insp-lock").checked = (page.locks || []).includes(key);
  const isTitle = type === "title", isImg = type === "image";
  $("#insp-size-row").style.display = isTitle ? "" : "none";
  $("#insp-img").classList.toggle("hidden", !isImg);
  $("#insp-imgdel").classList.toggle("hidden", !isImg);
  if (isTitle) {
    const box = slotBox(page, "title");
    const def = tpl.slots.title && tpl.slots.title.fs ? parseFloat(tpl.slots.title.fs) : Math.min(box.h * 0.42, 96);
    $("#insp-size").value = Math.round((page.overrides && page.overrides.titleFont) || def);
  }
}

/* ---------- 选中 / 拖动 / 缩放 ---------- */
function markSelected(key) {
  $$("#holder .slot.selected").forEach(n => { n.classList.remove("selected"); n.querySelector(".rsz")?.remove(); });
  const slot = $(`#holder .slot[data-slot="${key}"]`);
  if (!slot) return;
  slot.classList.add("selected");
  slot.appendChild(Object.assign(document.createElement("div"), { className: "rsz" }));
  slot.querySelector(".rsz").addEventListener("pointerdown", onResizeStart);
  slot.addEventListener("pointerdown", onDragStart);
}
function onPageClick(e) {
  const page = doc.pages.find(p => p.id === selectedPid);
  const slotEl = e.target.closest(".slot");
  if (!slotEl) { selectedSlot = null; renderInspector(); markSelected("__none"); return; }
  const key = slotEl.dataset.slot;
  const type = slotTypeOf(tplOf(page.templateId), key);
  if (type === "image" && slotEl.classList.contains("empty")) { uploadSlotImage(page, key); return; }
  selectedSlot = { pageId: page.id, key };
  renderInspector();
  markSelected(key);
}
function onDragStart(e) {
  if (e.target.classList.contains("rsz")) return;
  const slotEl = e.currentTarget;
  const key = slotEl.dataset.slot;
  const page = doc.pages.find(p => p.id === selectedPid);
  if ((page.locks || []).includes(key)) return;
  if (e.target.closest("[contenteditable='true']")) return;
  e.preventDefault();
  slotEl.setPointerCapture(e.pointerId);
  const startX = e.clientX, startY = e.clientY;
  const { W, H } = canvasSize(doc);
  const init = { ...slotBox(page, key) };
  const move = ev => {
    const dx = Math.round((ev.clientX - startX) / zoom / 8) * 8;
    const dy = Math.round((ev.clientY - startY) / zoom / 8) * 8;
    const nb = { ...init, x: Math.max(0, Math.min(W - init.w, init.x + dx)), y: Math.max(0, Math.min(H - init.h, init.y + dy)) };
    slotEl.style.left = nb.x + "px"; slotEl.style.top = nb.y + "px";
    slotEl._nb = nb;
  };
  const up = () => {
    slotEl.removeEventListener("pointermove", move);
    slotEl.removeEventListener("pointerup", up);
    if (slotEl._nb) {
      const nb = slotEl._nb; delete slotEl._nb;
      page.overrides = page.overrides || {};
      page.overrides[key] = nb;
      if (key === "body") mutate(() => {}); else { History.push(doc); saveDraft(); renderFilm(); }
    }
  };
  slotEl.addEventListener("pointermove", move);
  slotEl.addEventListener("pointerup", up);
}
function onResizeStart(e) {
  e.stopPropagation(); e.preventDefault();
  const slotEl = e.currentTarget.parentElement;
  const key = slotEl.dataset.slot;
  const page = doc.pages.find(p => p.id === selectedPid);
  slotEl.setPointerCapture(e.pointerId);
  const startX = e.clientX, startY = e.clientY;
  const { W, H } = canvasSize(doc);
  const init = { ...slotBox(page, key) };
  const minW = key === "title" ? 200 : 120, minH = key === "title" ? 60 : 80;
  const move = ev => {
    const dw = Math.round((ev.clientX - startX) / zoom / 8) * 8;
    const dh = Math.round((ev.clientY - startY) / zoom / 8) * 8;
    const nb = { ...init, w: Math.max(minW, Math.min(W - init.x, init.w + dw)),
                         h: Math.max(minH, Math.min(H - init.y, init.h + dh)) };
    slotEl.style.width = nb.w + "px"; slotEl.style.height = nb.h + "px";
    slotEl._nb = nb;
  };
  const up = () => {
    slotEl.removeEventListener("pointermove", move);
    slotEl.removeEventListener("pointerup", up);
    if (slotEl._nb) {
      const nb = slotEl._nb; delete slotEl._nb;
      page.overrides = page.overrides || {};
      page.overrides[key] = nb;
      mutate(() => {});
    }
  };
  slotEl.addEventListener("pointermove", move);
  slotEl.addEventListener("pointerup", up);
}

/* ---------- 文字编辑 ---------- */
function onDblClick(e) {
  const t = e.target.closest(".blk .t, .slot-title .t, .blk, .slot-body");
  const titleT = e.target.closest(".slot-title .t");
  const blk = e.target.closest(".blk");
  if (titleT) { editText(titleT, html => {
    const page = doc.pages.find(p => p.id === selectedPid);
    page.title = html.replace(/<[^>]+>/g, "").trim() || doc.meta.title;
    mutate(() => {}, "标题已更新");
  }); return; }
  if (blk && t) { editText(blk, html => {
    const b = doc.blocks.find(x => x.id === blk.dataset.bid);
    if (b) { b.html = html; mutate(() => {}, "内容已更新"); }
  }); }
}
function editText(el, commit) {
  el.contentEditable = "true";
  el.focus();
  const sel = window.getSelection();
  sel.selectAllChildren(el); sel.collapseToEnd();
  const done = () => { el.contentEditable = "false"; el.removeEventListener("blur", done); commit(el.innerHTML); };
  el.addEventListener("blur", done);
  el.addEventListener("keydown", ev => {
    if (ev.key === "Escape") { el.removeEventListener("blur", done); el.contentEditable = "false"; }
    ev.stopPropagation();
  });
}

/* ---------- 图片 ---------- */
function uploadSlotImage(page, key) {
  const f = $("#f-slotimg");
  f.onchange = () => {
    const file = f.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => mutate(() => { page.images = page.images || {}; page.images[key] = rd.result; }, "图片已上传");
    rd.readAsDataURL(file);
    f.value = "";
  };
  f.click();
}

/* ---------- 工具栏与面板绑定 ---------- */
function bindUI() {
  $("#b-import").onclick = () => $("#f-import").click();
  $("#f-import").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const text = await f.text();
    mutate(async () => { await importMarkdown(doc, text); selectedPid = doc.pages[0].id; selectedSlot = null; }, `已导入 ${f.name}`);
    e.target.value = "";
  };
  $("#i-title").oninput = e => mutate(() => { doc.meta.title = e.target.value;
    doc.pages.filter(p => tplOf(p.templateId).kind === "cover").forEach(p => { if (!p.title) p.title = doc.meta.title; });
  });
  $("#i-author").oninput = e => mutate(() => { doc.meta.author = e.target.value; });
  $("#b-undo").onclick = doUndo;
  $("#b-redo").onclick = doRedo;
  $("#b-random").onclick = doRandom;
  $("#b-export").onclick = doExport;
  $("#b-addpage").onclick = () => mutate(() => {
    const i = doc.pages.findIndex(p => p.id === selectedPid);
    const page = { id: uid(), templateId: "t7", overrides: {}, locks: [], title: "", images: {} };
    doc.pages.splice(i + 1, 0, page); selectedPid = page.id;
  }, "已加正文页");
  $("#b-addend").onclick = () => mutate(() => {
    const i = doc.pages.findIndex(p => p.id === selectedPid);
    const page = { id: uid(), templateId: "e3", overrides: {}, locks: [], title: "感谢观看", images: {} };
    doc.pages.splice(i + 1, 0, page); selectedPid = page.id;
  }, "已加结尾页");
  $("#b-delpage").onclick = () => mutate(() => {
    if (doc.pages.length <= 1) return;
    const i = doc.pages.findIndex(p => p.id === selectedPid);
    doc.pages.splice(i, 1);
    selectedPid = doc.pages[Math.max(0, i - 1)].id;
  }, "已删页");
  $("#s-palette").onchange = e => mutate(() => { doc.palette = e.target.value; doc.customBg = null; });
  $("#c-custombg").onchange = e => mutate(() => { doc.customBg = e.target.checked ? $("#i-bg").value : null; });
  $("#i-bg").oninput = e => { if ($("#c-custombg").checked) mutate(() => { doc.customBg = e.target.value; }); };
  $("#c-customaccent").onchange = e => mutate(() => { doc.customAccent = e.target.checked ? $("#i-accent").value : null; });
  $("#i-accent").oninput = e => { if ($("#c-customaccent").checked) mutate(() => { doc.customAccent = e.target.value; }); };
  $("#s-ratio").onchange = e => mutate(() => { doc.ratio = e.target.value; }, "画布比例已切换");
  $("#s-font").onchange = e => mutate(() => { doc.font = e.target.value; });
  $("#r-fs").oninput = e => mutate(() => { doc.fsBody = +e.target.value; });
  $("#r-lh").oninput = e => mutate(() => { doc.lhBody = +e.target.value; });
  $("#r-gap").oninput = e => mutate(() => { doc.gapBlock = +e.target.value; });
  $("#insp-lock").onchange = e => {
    const page = doc.pages.find(p => p.id === selectedPid);
    mutate(() => {
      page.locks = page.locks || [];
      const i = page.locks.indexOf(selectedSlot.key);
      if (e.target.checked && i < 0) page.locks.push(selectedSlot.key);
      if (!e.target.checked && i >= 0) page.locks.splice(i, 1);
    });
  };
  $("#insp-size").onchange = e => {
    const page = doc.pages.find(p => p.id === selectedPid);
    mutate(() => {
      page.overrides = page.overrides || {};
      const b = slotBox(page, "title");
      page.overrides.titleFont = +e.target.value;
      void b;
    });
  };
  $("#insp-img").onclick = () => { const page = doc.pages.find(p => p.id === selectedPid); uploadSlotImage(page, selectedSlot.key); };
  $("#insp-imgdel").onclick = () => { const page = doc.pages.find(p => p.id === selectedPid);
    mutate(() => { delete page.images[selectedSlot.key]; }, "图片已移除"); };
  window.addEventListener("resize", fitZoom);
  document.addEventListener("keydown", e => {
    const editing = e.target.closest && e.target.closest("[contenteditable='true'],input,select,textarea");
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); doUndo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); doRedo(); }
    else if (e.key === " " && !editing) { e.preventDefault(); doRandom(); }
  });
}
function restore(d, msg) {
  if (!d) return;
  doc = d;
  paginate(doc).then(() => { renderAll(); saveDraft(); });
  status(msg);
}
function doUndo() { restore(History.undo(), "已撤销"); }
function doRedo() { restore(History.redo(), "已重做"); }
function doRandom() {
  const page = doc.pages.find(p => p.id === selectedPid);
  const id = randomTemplate(doc, page);
  if (id) mutate(() => changeTemplate(doc, page, id), `已切换为「${tplOf(id).name}」`);
  else status("没有可用模板（试试解锁区块）", true);
}
async function doExport() {
  try {
    status("导出中…");
    const scale = +$("#s-scale").value;
    const els = doc.pages.map(p => buildPageDOM(doc, p));
    const blob = await exportDoc(doc, els, scale);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `xhs-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status(`已导出 ${doc.pages.length} 张 PNG（${scale}x）`);
  } catch (e) { status("导出失败：" + e.message, true); }
}

/* ---------- 启动 ---------- */
async function boot() {
  bindUI();
  const draft = await idb.get();
  if (draft && draft.v === 2 && Array.isArray(draft.pages)) {
    doc = draft;
    status("已恢复上次草稿");
  } else {
    const sample = `# 我的小红书笔记

这是用 **Markdown** 写的示例内容，双击卡片上的文字即可直接修改。

## 为什么用工作室排版

- 20 套图文排版模板，一键切换
- 配色整组联动，自动保证对比度
- 拖动、缩放、锁定，全部所见即所得

## 支持语法

> 引用块、代码块、表格都支持

| 功能 | 状态 |
| --- | --- |
| Markdown 导入 | ✅ |
| 模板排版 | ✅ |
| ZIP 导出 | ✅ |

导入你自己的 .md 文件开始创作吧！`;
    importMarkdown(doc, sample);
    History.reset(doc);
    status("已载入示例（导入文章开始创作）");
  }
  selectedPid = doc.pages[0].id;
  await paginate(doc);
  renderAll();
  saveDraft();
}
boot();
