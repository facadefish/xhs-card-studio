/* 小红书图文工作室 — templates.js
 * 版式模板库：20 套图文排版（Box 基于 1242×1656 @3:4）
 * 每套模板参考真实设计卡复刻（见 references/ 与 REFERENCES.md）
 *
 * slot 两种写法：
 *   B(x,y,w,h)              —— 纯盒子，类型按 key 推断（title/body/image 系/footer）
 *   S(x,y,w,h,type,opts)    —— 显式类型；opts: cls/fs/align/vm/weight/ls/ff/lh/color/rot
 * decos:  {box, k, cls, rot, z}   装饰形（pointer-events:none，z:"back" 压底）
 * labels: {box, text, fs, align, color, weight, ls, ff, vm, rot, lh, cls}
 *         文本支持占位符 {n} 页码 {total} 总页数 {author} 署名 {title} 标题
 * vars:   覆盖页面 CSS 变量（固定气质的暗色模板用）
 * bodyCls:正文槽卡壳类名；css: 模板专属样式（以 .tpl-<id> 作用域）
 */
"use strict";
const B = (x, y, w, h) => ({ x, y, w, h });
const S = (x, y, w, h, t, o = {}) => ({ x, y, w, h, t, ...o });
const SERIF = "Georgia,'Times New Roman','Songti SC',SimSun,serif";
const HAND = "KaiTi,'STKaiti',cursive";
const MONO = "Consolas,'Courier New',monospace";

const TPL = [
  /* ==================== 封面（6） ==================== */
  { id:"c5", name:"杂志刊头", family:"封面", kind:"cover",
    slots:{
      image: B(84,258,1074,720),
      title: S(84,1006,1074,270,"title",{ fs:"118px" }),
      footer: B(84,1560,1074,56) },
    decos:[
      { box:B(84,210,1074,6), k:"line", cls:"inkline" },
      { box:B(84,1300,190,16), k:"rect" },
      { box:B(920,1440,238,90), k:"barcode" } ],
    labels:[
      { box:B(84,84,940,120), text:"XHS WEEKLY", fs:84, weight:900, ls:"0.12em", color:"ink", ff:SERIF, nowrap:true },
      { box:B(898,110,260,60), text:"VOL.{n}", fs:44, align:"right", color:"muted" },
      { box:B(84,1360,760,56), text:"COVER STORY · {author}", fs:32, color:"muted" } ],
    css:`.tpl-c5 .deco-line{background:var(--ink)}` },

  { id:"c6", name:"拍立得", family:"封面", kind:"cover",
    slots:{
      image:  S(120,150,820,700,"image",{ cls:"img-polaroid", rot:-2.5 }),
      image2: S(710,640,420,430,"image",{ cls:"img-polaroid", rot:4 }),
      title:  S(120,1140,1002,250,"title",{ fs:"96px", align:"center" }),
      footer: B(84,1560,1074,56) },
    decos:[
      { box:B(96,112,200,66), k:"tape", rot:-9 },
      { box:B(920,610,190,60), k:"tape", rot:11 } ],
    labels:[
      { box:B(84,84,220,56), text:"● REC", fs:38, color:"accent", weight:700 },
      { box:B(120,1410,1002,56), text:"快门按下的瞬间 · {author}", fs:32, align:"center", color:"muted" } ] },

  { id:"c7", name:"大字海报", family:"封面", kind:"cover",
    slots:{
      title: S(64,130,1114,800,"title",{ fs:"178px", lh:"1.06", weight:900 }),
      footer: B(64,1560,1114,56) },
    decos:[
      { box:B(920,560,260,260), k:"ring" },
      { box:B(64,990,230,18), k:"rect" } ],
    labels:[
      { box:B(1128,470,80,560), text:"特辑", fs:44, color:"accent", vm:true, ls:"0.35em" },
      { box:B(64,1050,900,64), text:"READ MORE · 继续下滑", fs:36, color:"muted" } ] },

  { id:"c8", name:"票根", family:"封面", kind:"cover",
    slots:{
      title: S(150,430,942,280,"title",{ fs:"104px", align:"center" }),
      footer: B(84,1560,1074,56) },
    decos:[
      { box:B(110,200,1022,1160), k:"frame" },
      { box:B(311,340,620,4), k:"line", cls:"inkline" },
      { box:B(170,880,902,4), k:"perf" },
      { box:B(341,1140,560,110), k:"barcode" } ],
    labels:[
      { box:B(371,252,500,60), text:"ADMIT ONE", fs:46, ls:"0.4em", align:"center", color:"muted" },
      { box:B(371,752,500,52), text:"XHS TICKET · NO.{n}", fs:30, align:"center", color:"muted" },
      { box:B(190,950,300,120), text:"DATE\n2026.11.07", fs:34, lh:"1.5", color:"ink", ff:MONO },
      { box:B(521,950,300,120), text:"SEAT\nA-{n}", fs:34, lh:"1.5", align:"center", color:"ink", ff:MONO },
      { box:B(852,950,220,120), text:"PRICE\nFREE", fs:34, lh:"1.5", align:"right", color:"ink", ff:MONO } ],
    css:`.tpl-c8 .deco-line{background:var(--ink)}` },

  { id:"c9", name:"胶片", family:"封面", kind:"cover",
    vars:{ "--bg":"#161616","--ink":"#f2f0ea","--muted":"#9a968c","--accent":"#d8b45a",
           "--line":"#3a3a3a","--soft":"#222222","--card":"#222222" },
    slots:{
      image: B(90,268,1062,600),
      title: S(90,1020,1062,260,"title",{ fs:"100px" }),
      footer: B(90,1420,1062,56) },
    decos:[
      { box:B(0,46,1242,104), k:"sprocket" },
      { box:B(0,1506,1242,104), k:"sprocket" } ],
    labels:[
      { box:B(90,930,400,60), text:"SCENE {n}", fs:44, color:"accent", ls:"0.2em", ff:MONO },
      { box:B(90,1330,1062,56), text:"A FILM BY {author}", fs:32, color:"muted", ls:"0.25em" } ] },

  { id:"c10", name:"拱窗", family:"封面", kind:"cover",
    slots:{
      image: S(271,230,700,900,"image",{ cls:"img-arch" }),
      title: S(171,1230,900,230,"title",{ fs:"96px", align:"center" }) },
    decos:[
      { box:B(211,240,820,820), k:"ring", z:"back" },
      { box:B(521,1490,200,4), k:"line" } ],
    labels:[
      { box:B(321,120,600,56), text:"TRAVEL NOTES", fs:36, align:"center", ls:"0.35em", color:"muted" },
      { box:B(471,1520,300,52), text:"{author}", fs:32, align:"center", color:"muted" } ] },

  /* ==================== 正文（11） ==================== */
  { id:"t7", name:"手账纸", family:"正文", kind:"content", bodyCls:"paper",
    slots:{ body:B(120,240,1002,1140), footer:B(84,1560,1074,56) },
    decos:[
      { box:B(420,196,180,62), k:"tape", rot:-6 },
      { box:B(690,196,180,62), k:"tape", rot:5 } ],
    labels:[
      { box:B(120,120,500,60), text:"MEMO · {n}", fs:42, weight:800, ls:"0.1em", color:"ink" },
      { box:B(1124,600,76,300), text:"手 帐", fs:42, color:"accent", vm:true } ],
    css:`.tpl-t7 .slot-body{background:#fff;padding:64px 72px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.08);
      background-image:repeating-linear-gradient(transparent 0 60px, var(--line) 60px 62px);
      background-origin:content-box;}` },

  { id:"t8", name:"杂志双栏", family:"正文", kind:"content", bodyCls:"mag2",
    slots:{ body:B(84,250,1074,1150), footer:B(84,1560,1074,56) },
    decos:[ { box:B(84,190,1074,5), k:"line", cls:"inkline" } ],
    labels:[
      { box:B(84,104,700,56), text:"FEATURE · 特写", fs:36, ls:"0.25em", weight:700, color:"ink" },
      { box:B(1000,104,158,56), text:"P.{n}", fs:36, align:"right", color:"muted" } ],
    css:`.tpl-t8 .deco-line{background:var(--ink)}
      .tpl-t8 .slot-body{column-count:2;column-gap:56px;column-rule:2px solid var(--line)}
      .tpl-t8 .slot-body .blk{break-inside:avoid}
      .tpl-t8 .slot-body h2{border:none;padding-left:0;font-size:1.25em}
      .tpl-t8 .slot-body .blk:first-child>p:first-child::first-letter{
        font-size:3.1em;float:left;line-height:.88;padding:.06em .14em 0 0;color:var(--accent);font-weight:800}` },

  { id:"t9", name:"便当格", family:"正文", kind:"content", bodyCls:"bentocard",
    slots:{
      body: B(84,140,1074,780),
      image: B(84,950,520,470),
      image2: B(638,950,520,470),
      footer: B(84,1560,1074,56) },
    labels:[ { box:B(160,184,160,64), text:"TIPS", fs:32, cls:"chip" } ],
    css:`.tpl-t9 .slot-body{background:var(--card);border-radius:36px;padding:150px 76px 56px;
      box-shadow:0 14px 40px rgba(0,0,0,.06);border:2px solid var(--line)}
      .tpl-t9 .slot-image{border-radius:28px}` },

  { id:"t10", name:"聊天记录", family:"正文", kind:"content", bodyCls:"chat",
    slots:{ body:B(84,270,1074,1140), footer:B(84,1560,1074,56) },
    decos:[ { box:B(84,236,1074,3), k:"line" } ],
    labels:[
      { box:B(84,96,200,50), text:"9:41", fs:30, color:"muted" },
      { box:B(84,150,500,60), text:"聊天记录", fs:42, weight:800, color:"ink" } ],
    css:`.tpl-t10 .slot-body .blk>*{display:inline-block;max-width:88%;background:var(--card);
        border:2px solid var(--line);border-radius:6px 30px 30px 30px;padding:.6em 1.1em;
        box-shadow:0 4px 14px rgba(0,0,0,.05)}
      .tpl-t10 .slot-body .blk>h2{display:block;background:none;border:none;padding:0;
        box-shadow:none;text-align:center;font-size:.8em;color:var(--muted);font-weight:500}
      .tpl-t10 .slot-body .blk>blockquote{display:inline-block;border-left:none}` },

  { id:"t11", name:"便利贴", family:"正文", kind:"content", bodyCls:"sticky",
    slots:{ body:B(96,210,1050,1190), footer:B(84,1560,1074,56) },
    decos:[
      { box:B(150,150,180,62), k:"tape", rot:-7 },
      { box:B(920,140,180,62), k:"tape", rot:8 } ],
    labels:[ { box:B(96,110,600,56), text:"STICKY NOTES", fs:38, ls:"0.2em", color:"muted" } ],
    css:`.tpl-t11 .slot-body{font-family:${HAND};font-size:1.02em}
      .tpl-t11 .slot-body .blk>*{background:#fff7ae;padding:.85em 1.15em;border-radius:4px;
        box-shadow:0 8px 18px rgba(0,0,0,.12);transform:rotate(-1.2deg)}
      .tpl-t11 .slot-body .blk:nth-child(3n+2)>*{background:#ffd6e0;transform:rotate(1.4deg)}
      .tpl-t11 .slot-body .blk:nth-child(3n)>*{background:#d4ecff;transform:rotate(-.6deg)}
      .tpl-t11 .slot-body h2{border-left:none;padding-left:0}` },

  { id:"t12", name:"黑板报", family:"正文", kind:"content", bodyCls:"chalk",
    vars:{ "--bg":"#22392f","--ink":"#f2ecd8","--muted":"#b9c4b4","--accent":"#f0d060",
           "--line":"rgba(242,236,216,.28)","--soft":"rgba(255,255,255,.06)","--card":"rgba(255,255,255,.04)" },
    slots:{ body:B(120,220,1002,1180), footer:B(120,1560,1002,56) },
    decos:[
      { box:B(1020,170,130,16), k:"bar", rot:-14 },
      { box:B(150,1470,90,14), k:"bar", rot:6 } ],
    labels:[ { box:B(120,110,600,56), text:"BOARD NOTES", fs:38, ls:"0.3em", color:"ink" } ],
    css:`.tpl-t12 .slot-body{border:4px dashed rgba(242,236,216,.5);border-radius:18px;
        padding:60px 64px;font-family:${HAND}}
      .tpl-t12 .slot-body h2{border-left:none;border-bottom:3px dashed var(--accent);
        padding:0 0 .25em;display:inline-block}
      .tpl-t12 .slot-body blockquote{background:rgba(255,255,255,.05)}` },

  { id:"t13", name:"终端", family:"正文", kind:"content", bodyCls:"term",
    vars:{ "--bg":"#16161e","--ink":"#d6f4d6","--muted":"#7a8a7a","--accent":"#6fdc73",
           "--line":"#2c2c38","--soft":"#1e1e28","--card":"#1e1e28" },
    slots:{ body:B(84,194,1074,1210), footer:B(84,1560,1074,56) },
    decos:[
      { box:B(84,110,1074,84), k:"rect", cls:"winbar" },
      { box:B(124,138,28,28), k:"disc", cls:"r" },
      { box:B(168,138,28,28), k:"disc", cls:"y" },
      { box:B(212,138,28,28), k:"disc", cls:"g" } ],
    labels:[ { box:B(280,128,600,56), text:"~/xhs-notes — zsh", fs:34, color:"muted", ff:MONO } ],
    css:`.tpl-t13 .deco-rect.winbar{background:#2c2c38;border-radius:20px 20px 0 0}
      .tpl-t13 .deco-disc.r{background:#ff5f56}
      .tpl-t13 .deco-disc.y{background:#ffbd2e}
      .tpl-t13 .deco-disc.g{background:#27c93f}
      .tpl-t13 .slot-body{background:#1e1e28;padding:52px 60px;border-radius:0 0 20px 20px;
        font-family:${MONO};font-size:.9em}
      .tpl-t13 .slot-body h2{border:none;padding:0;color:var(--accent)}
      .tpl-t13 .slot-body h2::before{content:"$ ";color:var(--muted)}
      .tpl-t13 .slot-body strong{color:#ffd866}
      .tpl-t13 .slot-body pre{background:#14141c}` },

  { id:"t14", name:"信纸", family:"正文", kind:"content", bodyCls:"letter",
    slots:{
      body: B(110,180,1022,1240),
      image2: B(950,96,200,240),
      footer: B(84,1560,1074,56) },
    labels:[
      { box:B(200,232,320,64), text:"致 读者：", fs:46, color:"ink", ff:HAND },
      { box:B(1010,1080,76,260), text:"此致 敬礼", fs:40, color:"ink", ff:HAND, vm:true } ],
    css:`.tpl-t14 .slot-body{background:#fbf6ea;padding:120px 90px 70px;border-radius:4px;
        box-shadow:0 10px 30px rgba(0,0,0,.08);font-family:${HAND};
        background-image:linear-gradient(90deg,transparent 76px,rgba(200,60,60,.45) 76px,rgba(200,60,60,.45) 79px,transparent 79px),
          repeating-linear-gradient(transparent 0 60px,rgba(90,120,180,.28) 60px 62px);
        background-origin:content-box}
      .tpl-t14 .slot-body h2{border-left:none;padding-left:0}
      .tpl-t14 .slot-image{border-radius:6px;border:8px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.18);
        transform:rotate(3deg)}
      .tpl-t14 .slot-image.empty{border:3px dashed rgba(200,60,60,.55);background:rgba(255,255,255,.75)}` },

  { id:"t15", name:"时间轴", family:"正文", kind:"content", bodyCls:"tl",
    slots:{ body:B(160,230,982,1170), footer:B(84,1560,1074,56) },
    decos:[ { box:B(196,230,5,1170), k:"line" } ],
    labels:[
      { box:B(84,104,500,56), text:"TIMELINE", fs:38, ls:"0.3em", weight:700, color:"ink" },
      { box:B(958,104,200,56), text:"{n} / {total}", fs:34, align:"right", color:"muted" } ],
    css:`.tpl-t15 .slot-body{padding-left:140px}
      .tpl-t15 .slot-body .blk{position:relative}
      .tpl-t15 .slot-body .blk::before{content:"";position:absolute;left:-115px;top:.5em;
        width:26px;height:26px;border-radius:50%;background:var(--bg);border:6px solid var(--accent)}
      .tpl-t15 .slot-body h2{border:none;padding-left:0}` },

  { id:"t16", name:"打卡清单", family:"正文", kind:"content", bodyCls:"check",
    slots:{ body:B(110,240,1022,1160), footer:B(84,1560,1074,56) },
    decos:[ { box:B(880,110,180,62), k:"tape", rot:6 } ],
    labels:[ { box:B(110,120,220,70), text:"TO-DO", fs:38, cls:"chip" } ],
    css:`.tpl-t16 .slot-body .blk{position:relative;padding-left:64px}
      .tpl-t16 .slot-body .blk:has(>h2){padding-left:0}
      .tpl-t16 .slot-body .blk::before{content:"";position:absolute;left:0;top:.5em;width:38px;height:38px;
        border:4px solid var(--accent);border-radius:10px;background:var(--card)}
      .tpl-t16 .slot-body .blk:nth-child(2n)::before{background:var(--accent);box-shadow:inset 0 0 0 6px var(--card)}
      .tpl-t16 .slot-body .blk:has(>h2)::before{display:none}
      .tpl-t16 .slot-body .blk>*{background:var(--card);border:2px solid var(--line);border-radius:18px;
        padding:.7em 1.1em;box-shadow:0 6px 16px rgba(0,0,0,.05)}
      .tpl-t16 .slot-body .blk>h2{border:none;padding-left:0;background:none;box-shadow:none}` },

  { id:"t17", name:"金句卡", family:"正文", kind:"content", quote:true,
    slots:{ body:B(140,560,962,560), footer:B(84,1560,1074,56) },
    decos:[ { box:B(521,1180,200,5), k:"line", cls:"accentline" } ],
    labels:[
      { box:B(70,240,320,320), text:"“", fs:320, color:"accent", ff:SERIF, cls:"ghost" },
      { box:B(850,1080,320,320), text:"”", fs:320, color:"accent", ff:SERIF, cls:"ghost" },
      { box:B(471,1220,300,56), text:"{author}", fs:34, align:"center", color:"muted" } ],
    css:`.tpl-t17 .deco-line{background:var(--accent)}
      .tpl-t17 .slot-body{font-size:1.3em;line-height:1.75}
      .tpl-t17 .slot-body h2{border:none;padding-left:0}
      .tpl-t17 .slot-body ul{list-style:none;padding-left:0}` },

  /* ==================== 结尾（3） ==================== */
  { id:"e3", name:"印章落款", family:"结尾", kind:"end", bodyCls:"centered",
    slots:{
      title: S(240,770,762,180,"title",{ fs:"92px", align:"center" }),
      body: B(341,990,560,180),
      footer: B(84,1560,1074,56) },
    decos:[
      { box:B(451,300,340,340), k:"ring", cls:"seal", rot:-6 },
      { box:B(487,336,268,268), k:"ring", cls:"seal", rot:-6 } ],
    labels:[
      { box:B(561,360,120,220), text:"讀", fs:110, color:"accent", ff:HAND, align:"center", rot:-6 } ],
    css:`.tpl-e3 .deco-ring.seal{border-width:10px;border-color:var(--accent);opacity:.85}
      .tpl-e3 .slot-body{color:var(--muted);font-size:.85em}` },

  { id:"e4", name:"关注引导", family:"结尾", kind:"end", bodyCls:"centered",
    slots:{
      image: S(471,250,300,300,"image",{ cls:"img-circle" }),
      body: B(296,930,650,200),
      footer: B(84,1560,1074,56) },
    decos:[
      { box:B(421,740,400,110), k:"rect", cls:"pill" },
      { box:B(84,120,300,300), k:"dots", cls:"soft" },
      { box:B(878,1180,280,280), k:"dots", cls:"soft" } ],
    labels:[
      { box:B(321,600,600,90), text:"{author}", fs:62, align:"center", weight:800, color:"ink" },
      { box:B(421,750,400,90), text:"+ 关注", fs:48, align:"center", color:"#fff", weight:700 } ],
    css:`.tpl-e4 .deco-rect.pill{border-radius:99px}
      .tpl-e4 .deco-dots.soft{opacity:.35}
      .tpl-e4 .slot-body{color:var(--muted);font-size:.9em}` },

  { id:"e5", name:"谢幕", family:"结尾", kind:"end", bodyCls:"credits",
    slots:{
      title: S(190,660,862,180,"title",{ fs:"104px", align:"center" }),
      body: B(371,900,500,220) },
    decos:[
      { box:B(471,320,300,3), k:"line" },
      { box:B(471,1370,300,3), k:"line" } ],
    labels:[
      { box:B(421,230,400,60), text:"THE END", fs:46, ls:"0.5em", align:"center", color:"muted" },
      { box:B(371,1400,500,52), text:"© {year} · {author}", fs:30, align:"center", color:"muted" } ],
    css:`.tpl-e5 .slot-body{text-align:center;font-size:.8em;color:var(--muted)}` },
];

const EXTRA_CSS = TPL.map(t => t.css || "").filter(Boolean).join("\n");
