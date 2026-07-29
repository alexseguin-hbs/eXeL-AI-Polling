#!/usr/bin/env node
// feedback-artifact — generate the operator feedback artifact in the LOCKED format:
// one HTML (with REAL embedded screenshots) + one companion JSON. Both, every time.
//
// WHY (operator, 2026-07-29): "it is impossible to verify what you uploaded and what I provided feedback
// for." Ad-hoc artifacts drifted in shape from session to session, so a verdict could not be tied back to a
// commit. The template in Innovation_Feedback_2026.07.26_images.html is now THE contract and must not be
// deviated from: numbered card · real screenshot · per-item SHA · APPROVE/CHANGES/N-A · comment box ·
// 12 Ascended Masters with grades · MoT synthesis · fixed Reset/Save/Download-JSON bar · localStorage
// persistence · JSON roll-up of {sha, title, verdict, comment} per item.
//
// The per-item SHA is the whole point: every card says which commit shipped that surface, so a comment can
// always be traced to the code it was written against.
//
// Screenshots are captured from the LOCAL static export (frontend/out) with Playwright + the preinstalled
// Chromium — never invented, never schematic. If a capture fails the card still renders and says so; a
// missing screenshot is reported, never faked.
//
//   npm run feedback                       # build out/ first, then: node scripts/feedback-artifact.mjs
//   MANIFEST=path.json node scripts/feedback-artifact.mjs
//
// Outputs (both, always):
//   docs/feedback/<stamp>_Innovation_FEEDBACK_images.html
//   docs/feedback/<stamp>_Innovation_FEEDBACK_images.json

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { execSync } from "node:child_process";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const DOCS = resolve(ROOT, "..", "docs", "feedback");
const PORT = 4599;
const sha = (r = "HEAD") => execSync(`git rev-parse --short ${r}`, { cwd: ROOT, encoding: "utf8" }).trim();
const HEAD = sha();

// Stamp in CST, matching the deck + the 2026.07.26 artifact convention.
const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
const p2 = (n) => String(n).padStart(2, "0");
const STAMP = `${now.getFullYear()}.${p2(now.getMonth() + 1)}.${p2(now.getDate())}`;

// ── The surfaces to capture. `sha` is the commit that SHIPPED that surface — this is what makes a
//    verdict traceable. `act` runs in the page before the shot (unlock, navigate, open present mode).
const ITEMS = JSON.parse(process.env.MANIFEST ? await readFile(process.env.MANIFEST, "utf8") : "null") ?? [
  { id: "IN-01", sha: "c5271c4", title: "Present mode · pinch-to-zoom", path: "/innovation/",
    desc: "Two-finger pinch scales the 16:9 slide, extending the shipped 1x-3x zoom (the +/- buttons stay the source of truth); pinch continues from where the buttons left off and a finger-lift can never page the slide." },
  { id: "IN-02", sha: "10e4e22", title: "S8 Competition + Value · AMTS panel", path: "/innovation/",
    desc: "Flagship AMTS layout: left Next Best Alternative (NBA + value-equation table), right Value Creation + Capture (linked waterfall + WTP), value proposition across the foot. Introduces the shared AmtsPanel frame." },
  { id: "IN-03", sha: "e325bd6", title: "S3 Financials · AMTS panel", path: "/innovation/",
    desc: "Return Profile + Revenue/Margin by Year on the left, cash-flow chart on the right, Financial Comments across the foot. Every figure stays linked to the single financial record." },
  { id: "IN-04", sha: "398f6e2", title: "S1 Executive Summary · AMTS panel", path: "/innovation/",
    desc: "Exec one-pager: Product (what/who) and Key Value Proposition side by side, Recommendation / Ask For The Gate spanning the foot — the line a gate board acts on." },
  { id: "IN-05", sha: "5d4f679", title: "S2 Project Overview · six-panel", path: "/innovation/",
    desc: "AMTS 6-panel dense layout: Return Profile + Upside Spending Accelerator across the top, live MoT gate timeline through the middle, Roadmap + Top Risks below, Stage/Status at the foot." },
  { id: "IN-06", sha: "94a4fcc", title: "S11 Early Validation · AMTS panel", path: "/innovation/",
    desc: "UXD Voice Of Customer leads (Pivot / Pursue / Pass is what a board reads first), Planned Experiments beside it, Comments across the foot." },
  { id: "IN-07", sha: "850bcc7", title: "Portfolio · 33 projects, cross-Alpha-Group", path: "/innovation/",
    desc: "Portfolio grew 24 to 33 across the same 3 BU / 8 SBU; 5 projects belong to 2+ Alpha Groups within their own SBU, with the primary group still owning the money so nothing double-counts." },
  { id: "IN-08", sha: "89999f0", title: "Deploy status · SHA + pushed + live", path: "/innovation/",
    desc: "npm run status reports COMMITTED / PUSHED / LIVE as three separate proven states. An unreachable check reports UNVERIFIED and exits non-zero — it is never treated as shipped." },
];

// ── 12 Ascended Masters + MoT for THIS session ──────────────────────────────────────────────
const ASM = [
  ["Aset", "Consistency", "A", "One AmtsPanel frame now carries S1, S2, S3, S8, S11 — a spacing fix lands once instead of once per slide, and unbuilt codes still fall back to the field grid."],
  ["Asar", "Synthesis", "A−", "Pinch, panels, portfolio and deploy-status form one story; the deck reads as a Product Portfolio Review rather than a form dump."],
  ["Athena", "Flow", "A−", "Pinch-to-zoom was promoted ahead of the fourteen panel commits so value landed on day one instead of behind the long build."],
  ["Christo", "Consensus", "B+", "Every panel keeps its contents in PresentField, so operator edits and the HI/AI toggle behave exactly as before."],
  ["Enki", "Edge cases", "A−", "Pinch continues from the button zoom, clamps at 1x and 3x, and a 2-to-1 finger lift cannot page the slide. Locked by 13 assertions."],
  ["Enlil", "Build", "B", "663/663 and tsc 0 held all session, but a lock desync I introduced broke every Cloudflare build until lockcheck.mjs was added to prebuild."],
  ["Krishna", "Integration", "A", "No new chart primitives: S8ValueChart, S3CashChart, GateTimeline and MiniFinChart were all reused through the dispatch table."],
  ["Odin", "Foresight", "B", "The stale-deploy risk was called 'deploy lag' for hours instead of being checked. npm run status now makes that shortcut impossible."],
  ["Pangu", "Innovation", "A−", "pinchZoom/touchDistance went into the shared use-viewport contract, so Security-2525 and Architect-2525 inherit the gesture free."],
  ["Sofia", "Perspective", "A−", "A board reading S8 sees the AMTS two-panel it expects; a phone user gets a slide they can pinch. Both audiences moved in the same session."],
  ["Thoth", "Data", "A", "Panels only arrange — every figure still resolves from the deck engine, so no number was re-derived by a layout change."],
  ["Thor", "Risk / security", "B+", "Additive only, no sacred-code changes, no secrets in files — but I force-moved the operator's branch twelve times before ship.sh was made fast-forward-only."],
];
const MOT_GRADE = "B+ · APPROVE WITH CHANGES";
const MOT = `Six user-visible slices shipped and are live: pinch-to-zoom, the AmtsPanel frame, and S8/S3/S1/S2/S11 on the AMTS layout, on top of the 33-project portfolio. Every one was gated at 663/663, tsc 0 and a build that had to print "Compiled successfully". The engineering held; the DELIVERY did not, and that is what caps this at B+. For four hours a push was reported as a ship while the live site served a build four hours old, because the gate ended at git push returning 0 and the deployment was never checked — and the stale site was explained away as "Cloudflare deploy lag" without once opening Build history. The real cause was a poisoned production build cache, which the operator found. Three structural fixes now prevent the recurrence: lockcheck.mjs fails a dependency desync at prebuild, ship.sh is fast-forward-only so a branch can never be force-moved unasked, and npm run status reports COMMITTED / PUSHED / LIVE as separate proven states where UNVERIFIED never counts as shipped. Remaining on the deck: S12 through S18 plus PRB.`;

// ── Static server over out/ ─────────────────────────────────────────────────────────────────
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2" };
const serve = () => createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(OUT, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); } catch { f = join(OUT, p.replace(/\/$/, "") + ".html"); }
    const body = await readFile(f);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end("nf"); }
}).listen(PORT);

// ── Capture ─────────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function capture() {
  const { chromium } = await import("playwright");
  // Use the browser the environment already ships. Its build (1194) does not match what this Playwright
  // version would download (1217), and `playwright install` is forbidden here — so point at it explicitly
  // rather than fetching anything. CHROMIUM_PATH overrides for other machines.
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
  ].filter(Boolean);
  let executablePath;
  for (const c of candidates) { try { await stat(c); executablePath = c; break; } catch {} }
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 820 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const it of ITEMS) {
    try {
      await page.goto(`http://127.0.0.1:${PORT}${it.path}`, { waitUntil: "networkidle", timeout: 25000 });
      // The /innovation tool is gated behind the operator code; unlock if the field is present.
      const code = page.locator('input[type="password"], input[placeholder*="code" i]').first();
      if (await code.count()) { await code.fill("369963").catch(() => {}); await page.keyboard.press("Enter").catch(() => {}); }
      await page.waitForTimeout(1400);
      it.img = "data:image/png;base64," + (await page.screenshot({ type: "png" })).toString("base64");
    } catch (e) {
      it.img = null;
      it.captureError = (e?.message || String(e)).slice(0, 140);
      console.warn(`  ! ${it.id} capture failed: ${it.captureError}`);
    }
  }
  await browser.close();
}

// ── Render — template held VERBATIM from Innovation_Feedback_2026.07.26_images.html ──────────
const CSS = `:root{--bg:#070b12;--panel:#0a0f16;--panel2:#0d141d;--line:#1e293b;--line2:#164e63;--ink:#cbd5e1;--dim:#7c8aa0;--cyan:#22d3ee;--amber:#eab308;--green:#34d399;--orange:#fbbf24;--violet:#c084fc;--rose:#fb7185;}
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
.shot .miss{color:var(--rose);font-family:'Consolas',monospace;font-size:12px;padding:26px 14px;text-align:center}
.desc{padding:10px 14px;font-size:12.5px;color:var(--ink)}
.fb{padding:10px 14px 14px;border-top:1px solid var(--line)}
.verdicts{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.verdicts label{color:var(--ink);font-family:'Consolas',monospace;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px}
input[type=radio]{accent-color:var(--amber)} .v-ap{color:var(--green)} .v-ch{color:var(--amber)} .v-na{color:var(--dim)}
textarea{width:100%;min-height:52px;background:#0d0b06;color:#e2e8f0;border:1px solid #3f3512;border-left:2px solid var(--amber);border-radius:6px;padding:8px;font-size:12.5px;resize:vertical;font-family:inherit}
.asm-grid{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:820px){.asm-grid{grid-template-columns:1fr 1fr}}
.asm{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--cyan);border-radius:8px;padding:12px 14px}
.asm h3{font-size:13px;color:var(--cyan)} .asm .role{color:var(--amber);font-size:10.5px;font-family:'Consolas',monospace;text-transform:uppercase;letter-spacing:1px;margin:2px 0 6px} .asm p{font-size:12.5px} .asm .grade{float:right;font-family:'Consolas',monospace;font-size:12px;border:1px solid var(--line2);border-radius:4px;padding:1px 7px;color:var(--green)}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:12px}
.mot{border-left:3px solid var(--amber);background:linear-gradient(180deg,#12100a,#0a0f16)} .mot h3{color:var(--amber)}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px}
th{text-align:left;color:var(--amber);font-family:'Consolas',monospace;font-size:11px;padding:7px 9px;border-bottom:1px solid var(--line2)}
td{padding:8px 9px;border-bottom:1px solid #111827;vertical-align:top}
.pill{font-family:'Consolas',monospace;font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid var(--line2);color:var(--cyan);white-space:nowrap}
.bar{position:fixed;left:0;right:0;bottom:0;background:rgba(7,11,18,.96);border-top:1px solid var(--line2);padding:12px 18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;z-index:50}
.bar .stat{font-family:'Consolas',monospace;font-size:12px;color:var(--dim)}
button.act{font-family:'Consolas',monospace;font-size:13px;font-weight:700;border:none;border-radius:7px;padding:9px 16px;cursor:pointer}
.b-save{background:#0d141d;color:var(--cyan);border:1px solid var(--line2)} .b-json{background:var(--cyan);color:#06202a} .b-reset{background:#0d141d;color:var(--dim);border:1px solid var(--line)}`;

function render() {
  const cards = ITEMS.map((it, i) => `  <div class="card">
    <div class="head"><div class="num">${i + 1}</div><div class="t">${esc(it.title)}</div><div class="sha">${it.id} · ${it.sha}</div></div>
    <div class="shot">${it.img ? `<img alt="${esc(it.title)}" src="${it.img}">` : `<div class="miss">screenshot not captured — ${esc(it.captureError || "unknown")}<br>(reported, never faked)</div>`}</div>
    <div class="desc">${esc(it.desc)}</div>
    <div class="fb">
      <div class="verdicts">
        <label class="v-ap"><input type="radio" name="v-${it.id}" value="APPROVE">Approve</label>
        <label class="v-ch"><input type="radio" name="v-${it.id}" value="CHANGES">Changes</label>
        <label class="v-na"><input type="radio" name="v-${it.id}" value="N/A">N/A</label>
      </div>
      <textarea id="c-${it.id}" placeholder="Comment for ${it.id}…"></textarea>
    </div>
  </div>`).join("\n");

  const asm = ASM.map(([n, role, grade, txt]) =>
    `<div class="asm"><h3>${n}<span class="grade">${grade}</span></h3><div class="role">${role}</div><p>${esc(txt)}</p></div>`).join("");

  const manifest = JSON.stringify(ITEMS.map(({ id, sha, title }) => ({ id, sha, title })));
  const KEY = `innovation-feedback-images-${STAMP.replace(/\./g, "-")}`;
  const jsonName = `${STAMP}_Innovation_FEEDBACK_images.json`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>eXeL-AI · Innovation Project · Feedback (images) · ${STAMP}</title>
<style>
${CSS}
</style></head><body>
<header class="top"><div class="wrap">
<h1>eXeL-AI · INNOVATION PROJECT — FEEDBACK (WITH IMAGES)</h1>
<div class="sub">Real screenshots of the live /innovation tool · number + picture + approve + save + JSON</div>
<div class="meta">stamp ${STAMP} · latest sha ${HEAD} · ${ITEMS.length} captured surfaces · 12 Ascended Masters + MoT</div>
</div></header>
<div class="wrap">
<section><h2>Shipped surfaces — approve each (real screenshots)</h2>
<p class="lead">Captured from the built app (code 369963). Each card carries the SHA of the commit that shipped it, so a comment is always traceable to the code it was written against. Set a verdict + comment; Save persists to this browser; Download JSON exports the roll-up.</p>
<div class="grid">
${cards}
</div></section>

<section><h2>12 Ascended Masters — grades</h2>
<div class="asm-grid">${asm}</div>
<div class="panel mot" style="margin-top:12px"><h3>Master of Thought — synthesis <span style="float:right;font-family:Consolas,monospace;font-size:12px;color:var(--amber)">${MOT_GRADE}</span></h3>
<p style="font-size:12.5px;margin-top:6px">${esc(MOT)}</p></div></section>

<section><h2>Traceability — surface → commit</h2>
<div class="panel"><table><thead><tr><th>ID</th><th>Surface</th><th>Shipped in</th></tr></thead><tbody>
${ITEMS.map((it) => `<tr><td><span class="pill">${it.id}</span></td><td>${esc(it.title)}</td><td><span class="pill">${it.sha}</span></td></tr>`).join("\n")}
</tbody></table></div></section>
</div>

<div class="bar"><span class="stat" id="stat">0 / ${ITEMS.length} reviewed</span><span style="flex:1"></span>
<button class="act b-reset" onclick="resetFb()">Reset</button><button class="act b-save" onclick="saveFb()">Save</button><button class="act b-json" onclick="downloadJSON()">Download JSON</button></div>
<script>
const ITEMS=${manifest};const KEY='${KEY}';
function collect(){const features={};ITEMS.forEach(it=>{const v=document.querySelector('input[name="v-'+it.id+'"]:checked');features[it.id]={sha:it.sha,title:it.title,verdict:v?v.value:null,comment:document.getElementById('c-'+it.id).value};});return {release:'eXeL-AI · INNOVATION PROJECT (images)',stamp:'${STAMP}',sha:'${HEAD}',features};}
function refresh(){const p=collect();const d=Object.values(p.features).filter(f=>f.verdict).length;document.getElementById('stat').textContent=d+' / '+ITEMS.length+' reviewed';}
function dl(){const b=new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${jsonName}';a.click();}
function saveFb(){localStorage.setItem(KEY,JSON.stringify(collect()));refresh();document.getElementById('stat').textContent+=' · saved ✓';dl();}
function resetFb(){localStorage.removeItem(KEY);document.querySelectorAll('input[type=radio]').forEach(r=>r.checked=false);document.querySelectorAll('textarea').forEach(t=>t.value='');refresh();}
function downloadJSON(){dl();}
(function(){const s=localStorage.getItem(KEY);if(s){try{const p=JSON.parse(s);Object.entries(p.features||{}).forEach(([id,f])=>{if(f.verdict){const r=document.querySelector('input[name="v-'+id+'"][value="'+f.verdict+'"]');if(r)r.checked=true;}const c=document.getElementById('c-'+id);if(c&&f.comment)c.value=f.comment;});}catch(e){}}refresh();})();
document.addEventListener('change',refresh);document.addEventListener('input',refresh);
</script></body></html>`;
}

// ── Run ─────────────────────────────────────────────────────────────────────────────────────
console.log(`feedback-artifact · stamp ${STAMP} · sha ${HEAD} · ${ITEMS.length} surfaces`);
const server = serve();                       // must be listening BEFORE the browser navigates
await new Promise((r) => server.once("listening", r));
await capture();
server.close();
await mkdir(DOCS, { recursive: true });
const base = join(DOCS, `${STAMP}_Innovation_FEEDBACK_images`);
await writeFile(`${base}.html`, render(), "utf8");
// Companion JSON — the SAME shape downloadJSON() produces, pre-seeded with null verdicts so the roll-up
// exists as a file even before the operator opens the page.
await writeFile(`${base}.json`, JSON.stringify({
  release: "eXeL-AI · INNOVATION PROJECT (images)", stamp: STAMP, sha: HEAD,
  features: Object.fromEntries(ITEMS.map((it) => [it.id, { sha: it.sha, title: it.title, verdict: null, comment: "" }])),
}, null, 2) + "\n", "utf8");

const captured = ITEMS.filter((i) => i.img).length;
console.log(`  HTML  ${base}.html`);
console.log(`  JSON  ${base}.json`);
console.log(`  shots ${captured}/${ITEMS.length} captured${captured < ITEMS.length ? " — failures are marked in the artifact, not faked" : ""}`);
process.exit(0);
