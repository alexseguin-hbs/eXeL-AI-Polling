// Builds the SoI-2525 · Global-Feedback + Growth-Model feedback deck (deployed-image cards + Approve/Change/N-A verdicts).
// Reference format: docs/feedback/Innovation_Feedback_2026.07.26_images.html. Run: node docs/feedback/build_soi2525_footer_feedback_2026.07.28.mjs
import fs from "node:fs";
import path from "node:path";

const SHOTS = "/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/shots";
const OUT = path.join(process.cwd(), "docs/feedback/SoI2525_Feedback_2026.07.28_images.html");
const SHA = "948055f";
const DATE = "2026.07.28";

const img = (name) => "data:image/png;base64," + fs.readFileSync(`${SHOTS}/${name}.png`).toString("base64");

const CARDS = [
  {
    n: 1, t: "Global Feedback — Snip · Upload · auto page-capture", id: "IN-01 · #324",
    shot: "05-feedback-open",
    desc: "Anyone can give feedback anywhere in the tool: the trigger sits in the global footer on every route. The panel now offers a built-in <b>Snip</b> (screen-capture one frame → PNG; falls back to Upload where the browser blocks it) beside <b>Upload</b>. On submit the system auto-captures the page context (path, title, viewport, timestamp) so you never type where you are. Capture is always user-gestured — nothing is grabbed silently.",
  },
  {
    n: 2, t: "SECURITY-2525 on the footer line, tool-wide", id: "IN-02 · #324",
    shot: "04-innovation-footer",
    desc: "SECURITY-2525 now lives on the same global footer line as Feedback and the eXeL AI badge — present on <b>every</b> route, not just the homepage. The homepage's old duplicate in-flow pill was removed so there is one canonical entry point.",
  },
  {
    n: 3, t: "Growth Model — one Scope selector + drill-down stacked bar", id: "H34/H35",
    shot: "06-admin-tier",
    desc: "One standard <b>Scope</b> selector drives the whole view (Company → BU → SBU → Alpha). The stacked bar reads $M on the Y-axis, a growth line from the base-year bar top, and the <b>Rev / Mgn</b> toggle plus <b>Hierarchy · Pillar · Risk · Funded</b> split modes. Dropdown reads Step 1 − 2 + 3 · Incremental.",
  },
  {
    n: 4, t: "Per-BU CAGR banner — target vs actual", id: "H39",
    shot: "06-admin-tier",
    desc: "The scrollable CAGR banner shows each BU's <b>target</b> vs <b>actual</b> growth: DS tgt 77%, MS tgt 33%, AP tgt 44% — seeded in the clean tier tables and reconciled against the rolled-up actual so management sees the gap at a glance.",
  },
  {
    n: 5, t: "Strategic-Pillar split in Admin colors", id: "H36",
    shot: "07-pillar-split",
    desc: "The <b>Pillar</b> mode re-stacks the bars by strategic pillar, each segment colored to match the Admin → Strategic-Pillars picker (P1–P4). Multi-select lets a reviewer isolate one or more pillars. Derived from loadPillars() so it scales to N pillars, not a hardcoded four.",
  },
  {
    n: 6, t: "Funded above / Unfunded below rollup", id: "H41b",
    shot: "08-funded-split",
    desc: "The <b>Funded</b> mode splits the portfolio: funded rollup stacks above the zero line, unfunded (left-on-the-table) below and faded — grouped by the same BU/SBU/Alpha level and colors, using real project-level revenue so the split is honest, not cosmetic.",
  },
];

const ASM = [
  ["Aset", "Consistency", "A", "One footer source (providers.tsx) carries Feedback · SECURITY-2525 · eXeL AI on every route — no per-page drift."],
  ["Asar", "Synthesis", "A", "Feedback now self-describes: path, title, viewport, timestamp travel with every note so the loop closes without the user narrating context."],
  ["Athena", "Flow", "A", "Snip and Upload sit side-by-side; the primary Submit stays on the right — one glance, no relearning."],
  ["Christo", "User flow", "A", "Capture is always a click away in the footer; nothing floats over content anymore."],
  ["Enki", "Edge cases", "A−", "getDisplayMedia absent/denied → graceful fallback to the file picker; a cancelled snip is a no-op, never an error toast."],
  ["Enlil", "Build", "A", "Additive only — no schema change; feedback_text carries the context string. Filtered tsc 0 · 568 tests · build ✓."],
  ["Krishna", "Integration", "A", "SECURITY-2525 reuses the existing /main/Security-2525 route; the Growth Model reads the same scopeSeed helpers as the tier tables."],
  ["Odin", "Future-proof", "A", "Page-context capture is a pure string builder — new fields append without a backend migration."],
  ["Pangu", "Innovation", "B+", "Built-in Snip removes the OS-tool round-trip; region-crop UI is the natural next step."],
  ["Sofia", "Multi-perspective", "A", "Feedback works for every persona anywhere; capture and context are the same for user and moderator."],
  ["Thoth", "Data/analytics", "A−", "Every submission now lands with structured provenance — path/title/viewport/time — ready to bucket by screen."],
  ["Thor", "Risk/removal", "A", "Screen capture is strictly user-gestured; the duplicate homepage pill was removed only after the footer carried it globally."],
];

const cardHtml = (c) => `
  <div class="card">
    <div class="head"><div class="num">${c.n}</div><div class="t">${c.t}</div><div class="sha">${c.id} · ${SHA}</div></div>
    <div class="shot"><img alt="${c.t}" src="${img(c.shot)}"></div>
    <div class="desc">${c.desc}</div>
    <div class="fb">
      <div class="verdicts">
        <label class="v-ap"><input type="radio" name="v${c.n}" value="approve"> ✓ Approve</label>
        <label class="v-ch"><input type="radio" name="v${c.n}" value="change"> ✎ Change</label>
        <label class="v-na"><input type="radio" name="v${c.n}" value="na"> — N/A</label>
      </div>
      <textarea placeholder="Comments on #${c.n} — ${c.t}…"></textarea>
    </div>
  </div>`;

const asmHtml = (a) => `
  <div class="asm"><span class="grade">${a[2]}</span><h3>${a[0]}</h3><div class="role">${a[1]}</div><p>${a[3]}</p></div>`;

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>eXeL-AI · SoI-2525 · Global Feedback + Growth Model · Feedback · ${DATE}</title>
<style>
:root{--bg:#070b12;--panel:#0a0f16;--panel2:#0d141d;--line:#1e293b;--line2:#164e63;--ink:#cbd5e1;--dim:#7c8aa0;--cyan:#22d3ee;--amber:#eab308;--green:#34d399;--orange:#fbbf24;--violet:#c084fc;--rose:#fb7185;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.55;padding-bottom:150px}
h1,h2,h3{font-family:'Cascadia Code','Consolas',ui-monospace,monospace;font-weight:700}
.wrap{max-width:1180px;margin:0 auto;padding:22px 18px}
header.top{border-bottom:1px solid var(--line2);background:linear-gradient(180deg,#0a1420,#070b12);padding:26px 18px 20px}
header.top h1{color:var(--cyan);font-size:23px;letter-spacing:2px}
header.top .sub{color:var(--amber);margin-top:6px;font-size:14px}
header.top .meta{color:var(--dim);margin-top:8px;font-size:12px;font-family:'Consolas',monospace}
section{margin-top:30px}
h2{color:var(--cyan);font-size:16px;letter-spacing:2px;border-left:4px solid var(--cyan);padding-left:12px;margin-bottom:6px;text-transform:uppercase}
.lead{color:var(--dim);font-size:13px;margin:0 0 14px 16px}
.grid{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:820px){.grid{grid-template-columns:1fr 1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.card .head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
.num{flex:none;width:30px;height:30px;border-radius:8px;background:#052a33;color:var(--cyan);display:flex;align-items:center;justify-content:center;font-family:'Consolas',monospace;font-weight:700}
.card .head .t{font-size:14px;color:#e2e8f0;font-weight:600}
.sha{margin-left:auto;font-family:'Consolas',monospace;font-size:10px;color:var(--dim);background:#0d141d;border:1px solid var(--line);border-radius:4px;padding:2px 6px;white-space:nowrap}
.shot{background:#000;border-bottom:1px solid var(--line)}
.shot img{display:block;width:100%;height:auto}
.desc{padding:10px 14px;font-size:12.5px;color:var(--ink)}
.desc b{color:#e2e8f0}
.fb{padding:10px 14px 14px;border-top:1px solid var(--line)}
.verdicts{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.verdicts label{color:var(--ink);font-family:'Consolas',monospace;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px}
input[type=radio]{accent-color:var(--amber)} .v-ap{color:var(--green)} .v-ch{color:var(--amber)} .v-na{color:var(--dim)}
textarea{width:100%;min-height:52px;background:#0d0b06;color:#e2e8f0;border:1px solid #3f3512;border-left:2px solid var(--amber);border-radius:6px;padding:8px;font-size:12.5px;resize:vertical;font-family:inherit}
.asm-grid{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:820px){.asm-grid{grid-template-columns:1fr 1fr}}
.asm{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--cyan);border-radius:8px;padding:12px 14px}
.asm h3{font-size:13px;color:var(--cyan)} .asm .role{color:var(--amber);font-size:10.5px;font-family:'Consolas',monospace;text-transform:uppercase;letter-spacing:1px;margin:2px 0 6px} .asm p{font-size:12.5px} .asm .grade{float:right;font-family:'Consolas',monospace;font-size:12px;border:1px solid var(--line2);border-radius:4px;padding:1px 7px;color:var(--green)}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:12px}
/* mobile: tables scroll inside their own box; the page never scrolls sideways.
   Long unbroken tokens (filenames, hashes) wrap instead of pushing the layout. */
.xscroll{overflow-x:auto;max-width:100%}
body{overflow-wrap:anywhere}
.mot{border-left:3px solid var(--amber);background:linear-gradient(180deg,#12100a,#0a0f16)} .mot h3{color:var(--amber);font-size:14px;margin-bottom:6px} .mot p{font-size:12.5px}
.gate{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
.gate .pill{font-family:'Consolas',monospace;font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid var(--line2);color:var(--green);background:#04211f}
</style></head><body>
<header class="top">
  <div class="wrap" style="padding:0">
    <h1>eXeL-AI · SoI-2525 — GLOBAL FEEDBACK + GROWTH MODEL</h1>
    <div class="sub">Feedback deck · deployed screenshots · Approve / Change / N-A per feature</div>
    <div class="meta">SHA ${SHA} · ${DATE} · route /innovation (or /main/SoI-2525) · admin 369963 · gate: filtered tsc 0 · innovation-time 568/568 · next build ✓</div>
  </div>
</header>
<div class="wrap">

  <section>
    <h2>Shipped this pass — review each</h2>
    <p class="lead">Task #324 (global feedback + SECURITY-2525 footer) plus the H34–H43 Growth-Model P&amp;L, rendered live from the deployed build. Mark a verdict and comment on each.</p>
    <div class="grid">
      ${CARDS.map(cardHtml).join("")}
    </div>
  </section>

  <section>
    <h2>12 Ascended Masters — SSSES review</h2>
    <p class="lead">Each lens graded the shipped work. Honest grades; failures folded into next-session process.</p>
    <div class="asm-grid">
      ${ASM.map(asmHtml).join("")}
    </div>
  </section>

  <section>
    <h2>MoT synthesis</h2>
    <div class="panel mot">
      <h3>Master of Thought</h3>
      <p>Feedback is now a first-class, always-available loop: one footer trigger on every route, a built-in Snip beside Upload, and structured page-context riding every submission — the user reports <i>what</i>, the system records <i>where and when</i>. SECURITY-2525 joins Feedback and eXeL AI on that same global line, so the three governance touchpoints are consistent tool-wide. Underneath, the Growth Model is one coherent drill-down P&amp;L on a single Scope selector, seeded from clean tier tables, with Pillar / Risk / Funded governance lenses and a target-vs-actual CAGR banner. Additive throughout; locked determinism tests stayed green.</p>
      <div class="gate">
        <span class="pill">filtered tsc — 0 errors</span>
        <span class="pill">innovation-time — 568/568</span>
        <span class="pill">next build — ✓</span>
        <span class="pill">pushed — main + branch</span>
      </div>
    </div>
  </section>

</div>
</body></html>`;

fs.writeFileSync(OUT, html);
console.log("WROTE", OUT, Math.round(fs.statSync(OUT).size / 1024) + "KB");
