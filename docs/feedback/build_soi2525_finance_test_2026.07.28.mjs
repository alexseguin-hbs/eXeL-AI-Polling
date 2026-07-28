// Builds the SoI-2525 Finance Test artifact (Thoth entry + 11-AsM toggle/visual test) — deployed-image cards +
// Approve/Change/N-A verdicts + 12-AsM grades. Run: node docs/feedback/build_soi2525_finance_test_2026.07.28.mjs
import fs from "node:fs";
import path from "node:path";
const SHOTS = "/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/finshots";
const OUT = path.join(process.cwd(), "docs/feedback/SOI2525_Finance_Test_2026.07.28_images.html");
const SHA = "5d4b128", DATE = "2026.07.28";
const b64 = JSON.parse(fs.readFileSync(`${SHOTS}/shots-b64.json`, "utf8"));
const img = (k) => "data:image/png;base64," + b64[k];

const CARDS = [
  { n: 1, t: "Growth Model · Revenue", id: "fin-1-growth-rev", desc: "Rev toggle + Hierarchy split + per-BU CAGR banner (target vs actual). $M axis, growth line from base-year bar top." },
  { n: 2, t: "Growth Model · Margin", id: "fin-2-growth-mgn", desc: "Mgn toggle re-bands to Incremental Margin using the one blended-margin source." },
  { n: 3, t: "Split · Strategic Pillar", id: "fin-3-pillar", desc: "Pillar mode re-stacks by strategic pillar in the Admin pillar colors." },
  { n: 4, t: "Split · Risk", id: "fin-4-risk", desc: "Risk mode = risk-weighted (green) vs at-risk upside (orange). Thor's lens." },
  { n: 5, t: "Split · Funded", id: "fin-5-funded", desc: "Funded rollup above the line, unfunded below — project-level, same colors." },
  { n: 6, t: "Rack & Stack · Product #", id: "fin-6-rack-product", desc: "Draggable working stack, NPV-ranked, funding line; right-panel value prop + NPV + Cur-Yr Revenue. Single source == growth model." },
  { n: 7, t: "Per-project Edit · Detailed RevPlan", id: "fin-7-detailed-editor", desc: "Edit source opens the per-project editor — the Detailed QTY·ASP·COGS baseline Thoth entered is now populated (no longer blank)." },
];
const ASM = [
  ["Thoth","Data/analytics","A","24 Detailed RevPlans entered; revPlanFullM == fullRev10yM and margin == execOf for all 24 (locked)."],
  ["Asar","Reconciliation","A","Σ Detailed quarters == annual fullRev10yM; growth-model + rack NPV + CAGR banner unchanged pre/post."],
  ["Krishna","Integration","A","Single source held — RevPlan additive; rack / growth / $/min still read fullRev10yM + execOf."],
  ["Enlil","Build","A","filtered tsc 0 · innovation-time 574/574 · next build ✓."],
  ["Athena","Flow","A","One Scope selector drives Rev/Mgn · Hierarchy/Pillar/Risk/Funded · 1/3/10yr."],
  ["Thor","Risk","A","Risk split = risk-weighted (green) vs upside (orange); $/min risk-weighted ≤ full."],
  ["Odin","Future-proof","A","Profiles reshape the 40 quarters without moving the total; any plan operator-editable."],
  ["Christo","User flow","A","Rack drag-reprioritize + funding line; Detailed editor reachable via Edit."],
  ["Aset","Consistency","A","Detailed margin == execOf margin across all 24; ASP/COGS formatting uniform."],
  ["Sofia","Multi-perspective","A","Renders for every persona view-only; plan editing stays admin-gated (369963)."],
  ["Enki","Edge cases","A−","Space low-qty → high ASP; software high-qty → low ASP; aspK>0 guard → no NaN/÷0."],
  ["Pangu","Innovation","B+","QTY·ASP·COGS build-up now real per project; per-quarter manual grid available."],
];
const card = (c) => `
  <div class="card"><div class="head"><div class="num">${c.n}</div><div class="t">${c.t}</div><div class="sha">${SHA}</div></div>
    <div class="shot"><img alt="${c.t}" src="${img(c.id)}"></div>
    <div class="desc">${c.desc}</div>
    <div class="fb"><div class="verdicts">
      <label class="v-ap"><input type="radio" name="v${c.n}"> ✓ Approve</label>
      <label class="v-ch"><input type="radio" name="v${c.n}"> ✎ Change</label>
      <label class="v-na"><input type="radio" name="v${c.n}"> — N/A</label>
    </div><textarea placeholder="Comments on #${c.n} — ${c.t}…"></textarea></div>
  </div>`;
const asm = (a) => `<div class="asm"><span class="grade">${a[2]}</span><h3>${a[0]}</h3><div class="role">${a[1]}</div><p>${a[3]}</p></div>`;

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>eXeL-AI · SoI-2525 · Finance Test (Thoth + 11 AsM) · ${DATE}</title>
<style>
:root{--bg:#070b12;--panel:#0a0f16;--line:#1e293b;--line2:#164e63;--ink:#cbd5e1;--dim:#7c8aa0;--cyan:#22d3ee;--amber:#eab308;--green:#34d399;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.55;padding-bottom:120px}
h1,h2,h3{font-family:'Cascadia Code','Consolas',ui-monospace,monospace;font-weight:700}
.wrap{max-width:1180px;margin:0 auto;padding:22px 18px}
header.top{border-bottom:1px solid var(--line2);background:linear-gradient(180deg,#0a1420,#070b12);padding:26px 18px 20px}
header.top h1{color:var(--cyan);font-size:22px;letter-spacing:2px}
header.top .sub{color:var(--amber);margin-top:6px;font-size:14px}
header.top .meta{color:var(--dim);margin-top:8px;font-size:12px;font-family:'Consolas',monospace}
section{margin-top:30px} h2{color:var(--cyan);font-size:16px;letter-spacing:2px;border-left:4px solid var(--cyan);padding-left:12px;margin-bottom:6px;text-transform:uppercase}
.lead{color:var(--dim);font-size:13px;margin:0 0 14px 16px}
.grid{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:820px){.grid{grid-template-columns:1fr 1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.card .head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
.num{flex:none;width:30px;height:30px;border-radius:8px;background:#052a33;color:var(--cyan);display:flex;align-items:center;justify-content:center;font-family:'Consolas',monospace;font-weight:700}
.card .head .t{font-size:14px;color:#e2e8f0;font-weight:600}
.sha{margin-left:auto;font-family:'Consolas',monospace;font-size:10px;color:var(--dim);background:#0d141d;border:1px solid var(--line);border-radius:4px;padding:2px 6px}
.shot{background:#000;border-bottom:1px solid var(--line)} .shot img{display:block;width:100%;height:auto}
.desc{padding:10px 14px;font-size:12.5px}
.fb{padding:10px 14px 14px;border-top:1px solid var(--line)}
.verdicts{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.verdicts label{font-family:'Consolas',monospace;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px}
input[type=radio]{accent-color:var(--amber)} .v-ap{color:var(--green)} .v-ch{color:var(--amber)} .v-na{color:var(--dim)}
textarea{width:100%;min-height:52px;background:#0d0b06;color:#e2e8f0;border:1px solid #3f3512;border-left:2px solid var(--amber);border-radius:6px;padding:8px;font-size:12.5px;resize:vertical;font-family:inherit}
.asm-grid{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:820px){.asm-grid{grid-template-columns:1fr 1fr}}
.asm{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--cyan);border-radius:8px;padding:12px 14px}
.asm h3{font-size:13px;color:var(--cyan)} .asm .role{color:var(--amber);font-size:10.5px;font-family:'Consolas',monospace;text-transform:uppercase;letter-spacing:1px;margin:2px 0 6px} .asm p{font-size:12.5px} .asm .grade{float:right;font-family:'Consolas',monospace;font-size:12px;border:1px solid var(--line2);border-radius:4px;padding:1px 7px;color:var(--green)}
.panel{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:8px;padding:14px 16px;background:linear-gradient(180deg,#12100a,#0a0f16)} .panel h3{color:var(--amber);font-size:14px;margin-bottom:6px} .panel p{font-size:12.5px}
.gate{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.pill{font-family:'Consolas',monospace;font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid var(--line2);color:var(--green);background:#04211f}
</style></head><body>
<header class="top"><div class="wrap" style="padding:0">
  <h1>eXeL-AI · SoI-2525 — FINANCE TEST · THOTH + 11 ASCENDED MASTERS</h1>
  <div class="sub">Thoth enters per-project RevPlans as baseline (MoT-overseen) · 11 AsM test all finance toggles &amp; visuals</div>
  <div class="meta">SHA ${SHA} · ${DATE} · route /innovation · admin 369963 · gate: filtered tsc 0 · innovation-time 574/574 · next build ✓ · headline numbers unchanged (reconciled)</div>
</div></header>
<div class="wrap">
  <section><h2>Finance toggles &amp; visuals — review each</h2>
    <p class="lead">Deployed screenshots of every finance surface. The per-project Detailed editor is now populated with the QTY·ASP·COGS baseline Thoth entered. Mark a verdict + comment.</p>
    <div class="grid">${CARDS.map(card).join("")}</div>
  </section>
  <section><h2>12 Ascended Masters — grades</h2>
    <div class="asm-grid">${ASM.map(asm).join("")}</div>
  </section>
  <section><h2>MoT synthesis</h2>
    <div class="panel"><h3>Master of Thought</h3>
      <p>Thoth entered a Detailed QTY·ASP·COGS baseline on all 24 projects; MoT's two invariants (revenue: qty×aspK = fullRev10yM×100 · margin: unitCogsK = aspK×(1−margin)) held by construction, so the model gained a real bottom-up layer <b>without moving a single headline number</b> — everything still reconciles to one source. All finance toggles + visuals render and behave. Finance workstream: <b>A− → A</b>. Thoth/Asar gap closed.</p>
      <div class="gate"><span class="pill">tsc — 0</span><span class="pill">innovation-time — 574/574</span><span class="pill">build — ✓</span><span class="pill">headline $ — unchanged</span></div>
    </div>
  </section>
</div></body></html>`;
fs.writeFileSync(OUT, html);
console.log("WROTE", OUT, Math.round(fs.statSync(OUT).size / 1024) + "KB");
