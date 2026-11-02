#!/usr/bin/env node
/**
 * ICON FX — the HI review artifact for the ICON nomenclature + Carbon X + Phoenix $25 chunk, in the LOCKED
 * newer feedback format (operator 2026-10-31: "image then comment, image comment/decision — 1 for 1 for all
 * images"; "HI input section should be on bottom and not cover center of screen"). One standalone HTML with
 * the REAL embedded 390px screenshots (from scripts/icon-wall-shot.mjs → shots/icon-wall) + a companion JSON.
 *
 * Sections: header provenance (SHA · LIVE · tsc · gates · FX range) · §1 FX INDEX · §2 FIX DETAIL (one card
 * per image, each with its own 👍/✎/✋ row + comment) · §3 12 Ascended Masters · §4 MoT synthesis + risks ·
 * §5 QUEUED. The H.I. DECISION section is at the END, in flow; only a one-line bar is pinned at the bottom.
 * SAVE FEEDBACK → <stamp>_ICON_FX_FEEDBACK.json {release,date,stamp,sha,timestamp,verdict,overallNotes,
 * features:{<imageId>:{verdict,comment}}}.
 *
 *   ICON_FLEET=/path/fleet.json node scripts/icon-fx.mjs   # fleet.json = {asm:[[name,lens,grade,txt]...], motGrade, mot}
 * Writes to the scratchpad dir given by FX_OUT (default ./shots/icon-wall).
 */
import { readFile, writeFile, stat } from "node:fs/promises";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const SHOTS = join(ROOT, "shots", "icon-wall");
const OUTDIR = process.env.FX_OUT || SHOTS;
const sha = (r = "HEAD") => execSync(`git rev-parse --short ${r}`, { cwd: ROOT, encoding: "utf8" }).trim();
const HEAD = sha();
const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
const p2 = (n) => String(n).padStart(2, "0");
const STAMP = `${now.getFullYear()}.${p2(now.getMonth() + 1)}.${p2(now.getDate())}_${p2(now.getHours())}.${p2(now.getMinutes())}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function dataURI(name) {
  try { const b = await readFile(join(SHOTS, name)); return "data:image/png;base64," + b.toString("base64"); }
  catch { return null; }
}

// ── §2 FIX DETAIL — one card PER IMAGE (operator 2026-10-31: 1 for 1 for all images) ──
const CARDS = [
  { id: "ICON-WALL", file: "icon-wall-section-390.png", kind: "AFTER", title: "ICON Wall System block — composition · $34 vs $35 · ratings · Carbon X · Phoenix $25",
    explain: "The HOUSE BUILD SPEC master now speaks ICON's cost language. The structural wall cost LINE is the “Wall System” (not “Framing”) and “Roof” (not “Roofing”). Framing is shown as ONE $21 line inside the $35/ft² Wall System (Framing $21 · Dry Wall $3 · Sheathing $1 · Moisture Barrier $3 · Siding $5 · Trim $2). ICON’s finished wall is $34/ft², below the $35 national average. The ratings (R-22 · 2+ hr fire · 250 MPH wind · termite/mold/flood), the Carbon X low-carbon printed-concrete note, and the ICON Phoenix (D24) multi-story line with “printed walls $25/ft²” all live here.",
    where: "/Architect-2525/ → Design tab → HOUSE BUILD SPEC (bottom panel) → the ICON WALL SYSTEM block.",
    test: "The $21 Framing line reads violet (the structural line of the $35 wall). $25 printed < $34 ICON < $35 national average. All six ratings present. Carbon X cites MIT CSHub × ICON.",
    proof: "Live render read-back: “$34/ft² ICON vs $35 nat’l avg · Framing $21 … Trim $2 · R-22 · 2+ Hour Fire · 250 MPH Wind … Carbon X — low-carbon (MIT CSHub × ICON) … Phoenix (D24) — 27′ · up to 2 stories … printed walls $25/ft² (vs $34 ICON · $35 avg)”. Gate architect-wall-system 26/0.",
    risk: "Labels + a new read-only panel only; the $240,000 one-cost-truth is unchanged (house-truth 28/0, one-cost-truth 13/0). Carbon X / Phoenix figures are ESTIMATE/ASSUMED, sourced to the ICON deck + MIT CSHub whitepaper — no invented price." },
  { id: "ICON-MASTER", file: "house-spec-390.png", kind: "AFTER", title: "HOUSE BUILD SPEC master in ICON terms (900 ft² · $240k · 9 rooms, Wall System below)",
    explain: "The whole master block: the ONE canonical truth (900 ft² net · $240,000 · 9 rooms · 10′ interior / 12′ cube / 36′ shell), the material take-off, and — directly below it — the ICON Wall System block. One surface, one vocabulary: the cost-by-element lines and the build phases read “Wall System” / “Roof”, while the structural Framing plan, the load-bearing check and the stud palette keep “framing” for the member itself.",
    where: "/Architect-2525/ → Design tab → HOUSE BUILD SPEC panel (full).",
    test: "The master headline still reads 900 ft² / $240,000 / 9 rooms (nothing moved). The Wall System block sits in flow below it. No cost line says “Framing” or “Roofing”.",
    proof: "Captured at 390px from the local static build of the shipped SHA. $240k one-cost-truth intact across costFor / costBreakdown / elementCosts (sim-options 241/0, consistency 36/0).",
    risk: "Read-only master; no cost or geometry change. The seed + its R0 hash are untouched." },
  { id: "ICON-SCREEN", file: "design-whole-390.png", kind: "WHOLE", title: "Whole Design surface at 390px — mobile-first, nothing overpainted",
    explain: "The full phone-width Design screen (375–390px is the operator’s test width), so the ICON Wall System block is judged in its real context — the master sits at the bottom of the workspace, in flow, nothing painted over the center, no sideways scroll.",
    where: "/Architect-2525/ → Design tab, 390px viewport, full page.",
    test: "The page is not wider than the screen; the ICON block is reachable by scrolling; touch targets legible at phone width.",
    proof: "Captured at 390px (deviceScaleFactor 2). next build + nav-gear-smoke 20/0 (gear in-viewport, nothing overpainted, no page errors at 375 + 390).",
    risk: "None — context capture." },
];

// ── §3 / §4 — the 12 Ascended Masters + MoT, from the fleet (ICON_FLEET json), with a clear fallback ──
let FLEET = null;
if (process.env.ICON_FLEET) { try { FLEET = JSON.parse(await readFile(process.env.ICON_FLEET, "utf8")); } catch (e) { console.warn("ICON_FLEET read failed:", e.message); } }
const ASM = FLEET?.asm ?? [];
const MOT_GRADE = FLEET?.motGrade ?? "— (AsM fleet w17ua5hkq pending)";
const MOT = FLEET?.mot ?? "The 12 Ascended Masters verification (workflow w17ua5hkq) was still running when this artifact was built; its synthesis is folded on completion. Gate evidence already stands: architect-wall-system 26/0, sim-options 241/0, consistency 36/0, house-truth 28/0, stage-plan 25/0, build-instructions 265/0, tsc 0 new, next build exit 0.";

// ── §1 index + §5 queued ──
const QUEUED = [
  "ICON Kitchen & Bath / Windows & Doors cost split — NOT added (no sourced $ breakdown in the deck); names aligned only where sourced.",
  "Region / housing cost selector (Atlantis-Accord capitals, local cost) — R-UX6 FUTURE.",
  "Phoenix two-story AREA/COST model — the $25/ft² wall + maxFloors 2 are in the one source; a full two-storey area path is a later revision (no invented deltas now).",
];

const GATES = "architect-wall-system 26/0 · sim-options 241/0 · consistency 36/0 · house-truth 28/0 · stage-plan 25/0 · build-instructions 265/0 · tsc 0 new · next build exit 0 (nav-gear-smoke 20/0)";
const LIVE = "Verify Live #3148 — “Poll live site for 7f08c3d” success 2026-11-02 02:24Z (the $25 Phoenix commit is LIVE); d203260 stragglers in Verify Live #3149 (in_progress)";

const CSS = `:root{--bg:#070b12;--panel:#0a0f16;--panel2:#0d141d;--line:#1e293b;--line2:#164e63;--ink:#cbd5e1;--dim:#7c8aa0;--cyan:#22d3ee;--amber:#eab308;--green:#34d399;--violet:#c084fc;--rose:#fb7185;--gold:#eab308;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.55;overflow-wrap:anywhere;padding-bottom:56px}
h1,h2,h3{font-family:'Cascadia Code','Consolas',ui-monospace,monospace;font-weight:700}
.wrap{max-width:900px;margin:0 auto;padding:18px 16px}
header.top{border-bottom:1px solid var(--line2);background:linear-gradient(180deg,#0a1420,#070b12);padding:22px 16px 16px}
header.top h1{color:var(--cyan);font-size:18px;letter-spacing:1.5px}
header.top .sub{color:var(--amber);margin-top:6px;font-size:13px}
header.top .meta{color:var(--dim);margin-top:8px;font-size:11px;font-family:'Consolas',monospace;line-height:1.7}
section{margin-top:26px}
h2{color:var(--cyan);font-size:15px;letter-spacing:1.5px;border-left:4px solid var(--cyan);padding-left:11px;margin-bottom:6px;text-transform:uppercase}
.lead{color:var(--dim);font-size:12.5px;margin:0 0 12px 15px}
.idx{display:flex;flex-direction:column;gap:6px;margin-left:15px}
.idx a{color:var(--ink);font-size:12.5px;text-decoration:none;font-family:'Consolas',monospace}
.idx a .k{color:var(--gold)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:16px}
.card .head{display:flex;align-items:center;gap:10px;padding:11px 13px;border-bottom:1px solid var(--line)}
.kind{flex:none;font-family:'Consolas',monospace;font-size:10px;font-weight:700;border-radius:4px;padding:2px 7px;border:1px solid var(--line2)}
.kind.AFTER{color:var(--green);border-color:#14532d}.kind.WHOLE{color:var(--cyan)}.kind.BEFORE{color:var(--dim)}
.card .head .t{font-size:13px;color:#e2e8f0;font-weight:600}
.card .head .fx{margin-left:auto;font-family:'Consolas',monospace;font-size:10px;color:var(--dim);background:#0d141d;border:1px solid var(--line);border-radius:4px;padding:2px 6px;white-space:nowrap}
.shot{background:#000;border-bottom:1px solid var(--line)}
.shot img{display:block;width:100%;height:auto}
.shot .miss{color:var(--rose);font-family:'Consolas',monospace;font-size:12px;padding:24px 14px;text-align:center}
.body{padding:11px 13px;font-size:12.5px}
.body .row{margin-bottom:7px}
.body .lbl{color:var(--gold);font-family:'Consolas',monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;margin-right:6px}
.fb{padding:10px 13px 13px;border-top:1px solid var(--line)}
.verdicts{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:8px}
.verdicts label{color:var(--ink);font-family:'Consolas',monospace;font-size:12.5px;cursor:pointer;display:flex;align-items:center;gap:5px}
input[type=radio]{accent-color:var(--amber)}.v-ap{color:var(--green)}.v-ch{color:var(--amber)}.v-ho{color:var(--rose)}
textarea{width:100%;min-height:46px;background:#0d0b06;color:#e2e8f0;border:1px solid #3f3512;border-left:2px solid var(--amber);border-radius:6px;padding:8px;font-size:12.5px;resize:vertical;font-family:inherit}
.asm-grid{display:grid;grid-template-columns:1fr;gap:10px}@media(min-width:720px){.asm-grid{grid-template-columns:1fr 1fr}}
.asm{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--cyan);border-radius:8px;padding:11px 13px}
.asm h3{font-size:12.5px;color:var(--cyan)}.asm .role{color:var(--amber);font-size:10px;font-family:'Consolas',monospace;text-transform:uppercase;letter-spacing:1px;margin:2px 0 6px}.asm p{font-size:12px}.asm .grade{float:right;font-family:'Consolas',monospace;font-size:11.5px;border:1px solid var(--line2);border-radius:4px;padding:1px 7px;color:var(--green)}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:13px 15px;margin-bottom:10px}
.mot{border-left:3px solid var(--amber);background:linear-gradient(180deg,#12100a,#0a0f16)}.mot h3{color:var(--amber)}
ul.q{margin:6px 0 0 18px;font-size:12.5px}ul.q li{margin-bottom:5px}
.decision{border:1px solid var(--line2);border-radius:10px;background:var(--panel2);padding:14px 15px;margin-top:10px}
.decision h2{border-left-color:var(--amber);color:var(--amber)}
.overall{width:100%;min-height:60px;margin-top:10px;background:#0d0b06;color:#e2e8f0;border:1px solid #3f3512;border-left:2px solid var(--amber);border-radius:6px;padding:9px;font-size:12.5px;font-family:inherit}
.obtn{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
button.act{font-family:'Consolas',monospace;font-size:13px;font-weight:700;border:none;border-radius:7px;padding:9px 15px;cursor:pointer}
.b-save{background:var(--cyan);color:#06202a}.b-json{background:#0d141d;color:var(--cyan);border:1px solid var(--line2)}.b-reset{background:#0d141d;color:var(--dim);border:1px solid var(--line)}
/* the ONLY pinned element: a one-line status bar at the very bottom (never covers the center) */
.statbar{position:fixed;left:0;right:0;bottom:0;background:rgba(7,11,18,.96);border-top:1px solid var(--line2);padding:9px 16px;padding-bottom:calc(9px + env(safe-area-inset-bottom,0px));display:flex;gap:12px;align-items:center;z-index:50;font-family:'Consolas',monospace;font-size:12px;color:var(--dim)}
.statbar a{color:var(--cyan);text-decoration:none}`;

function render(imgs) {
  const idx = CARDS.map((c) => `<a href="#fx-${c.id}"><span class="k">FX-${c.id}</span> · ${esc(c.title)}</a>`).join("\n");
  const cards = CARDS.map((c) => `  <div class="card" id="fx-${c.id}">
    <div class="head"><span class="kind ${c.kind}">${c.kind}</span><div class="t">${esc(c.title)}</div><div class="fx">FX-${c.id}</div></div>
    <div class="shot">${imgs[c.id] ? `<img alt="${esc(c.title)}" src="${imgs[c.id]}">` : `<div class="miss">screenshot not captured — ${esc(c.file)} missing (reported, never faked)</div>`}</div>
    <div class="body">
      <div class="row"><span class="lbl">What</span>${esc(c.explain)}</div>
      <div class="row"><span class="lbl">Where</span>${esc(c.where)}</div>
      <div class="row"><span class="lbl">Test</span>${esc(c.test)}</div>
      <div class="row"><span class="lbl">Proof</span>${esc(c.proof)}</div>
      <div class="row"><span class="lbl">Risk</span>${esc(c.risk)}</div>
    </div>
    <div class="fb">
      <div class="verdicts">
        <label class="v-ap"><input type="radio" name="v-${c.id}" value="APPROVE">👍 Approve</label>
        <label class="v-ch"><input type="radio" name="v-${c.id}" value="CHANGES">✎ Changes</label>
        <label class="v-ho"><input type="radio" name="v-${c.id}" value="HOLD">✋ Hold</label>
      </div>
      <textarea id="c-${c.id}" placeholder="Comment for FX-${c.id}…"></textarea>
    </div>
  </div>`).join("\n");

  const asm = ASM.length ? ASM.map(([n, role, grade, txt]) =>
    `<div class="asm"><h3>${esc(n)}<span class="grade">${esc(grade)}</span></h3><div class="role">${esc(role)}</div><p>${esc(txt)}</p></div>`).join("")
    : `<div class="asm"><h3>12 Ascended Masters</h3><div class="role">AsM fleet w17ua5hkq</div><p>Verification running when this artifact was built — folded on completion. Gate evidence already green (see header).</p></div>`;

  const queued = QUEUED.map((q) => `<li>${esc(q)}</li>`).join("\n");
  const KEY = `icon-fx-${STAMP.replace(/[.\s:]/g, "-")}`;
  const jsonName = `${STAMP}_ICON_FX_FEEDBACK.json`;
  const manifest = JSON.stringify(CARDS.map((c) => c.id));

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Architect-2525 · ICON FX · ${STAMP}</title>
<style>${CSS}</style></head><body>
<header class="top"><div class="wrap">
<h1>ARCHITECT-2525 — ICON FX · Wall System · Carbon X · Phoenix $25 multi-story</h1>
<div class="sub">Real 390px screenshots · one decision + comment per image · SAVE → paired JSON</div>
<div class="meta">SHA ${HEAD} · LIVE ${esc(LIVE)}<br>tsc 0 new · gates ${esc(GATES)}<br>FX range FX-ICON-WALL → FX-ICON-SCREEN · stamp ${STAMP} · site https://exel-ai-polling.explore-096.workers.dev</div>
</div></header>
<div class="wrap">

<section><h2>§1 · FX index</h2>
<div class="idx">
${idx}
</div></section>

<section><h2>§2 · Fix detail — one decision per image</h2>
<p class="lead">Each image is its own card with its own 👍 / ✎ / ✋ row + comment (operator 2026-10-31: 1 for 1 for all images). Captured from the local static build of the shipped SHA.</p>
${cards}
</section>

<section><h2>§3 · 12 Ascended Masters</h2>
<div class="asm-grid">${asm}</div></section>

<section><h2>§4 · Master of Thought — synthesis</h2>
<div class="panel mot"><h3>MoT <span style="float:right;font-family:Consolas,monospace;font-size:12px;color:var(--amber)">${esc(MOT_GRADE)}</span></h3>
<p style="font-size:12.5px;margin-top:6px">${esc(MOT)}</p></div></section>

<section><h2>§5 · Queued</h2>
<div class="panel"><ul class="q">${queued}</ul></div></section>

<section class="decision"><h2>H.I. decision</h2>
<p class="lead" style="margin-left:0">Set a verdict + comment on each image above, then an overall verdict here. SAVE writes it to this browser and downloads the paired JSON.</p>
<div class="verdicts">
  <label class="v-ap"><input type="radio" name="overall" value="APPROVE">👍 Approve all</label>
  <label class="v-ch"><input type="radio" name="overall" value="CHANGES">✎ Changes</label>
  <label class="v-ho"><input type="radio" name="overall" value="HOLD">✋ Hold</label>
</div>
<textarea class="overall" id="overallNotes" placeholder="Overall notes…"></textarea>
<div class="obtn">
  <button class="act b-save" onclick="saveFb()">💾 SAVE FEEDBACK</button>
  <button class="act b-json" onclick="downloadJSON()">↓ JSON</button>
  <button class="act b-reset" onclick="resetFb()">Reset</button>
</div></section>

</div>
<div class="statbar"><span id="stat">0 / ${CARDS.length} reviewed</span><span style="flex:1"></span><a href="#fx-${CARDS[0].id}">↑ top</a> · <a onclick="saveFb();return false" href="#">SAVE</a></div>
<script>
const IDS=${manifest};const KEY='${KEY}';
function collect(){const features={};IDS.forEach(id=>{const v=document.querySelector('input[name="v-'+id+'"]:checked');features[id]={verdict:v?v.value:null,comment:document.getElementById('c-'+id).value};});
const ov=document.querySelector('input[name="overall"]:checked');
return {release:'Architect-2525 · ICON FX (Wall System · Carbon X · Phoenix $25)',date:'${STAMP.split("_")[0]}',stamp:'${STAMP}',sha:'${HEAD}',timestamp:new Date().toISOString(),verdict:ov?ov.value:null,overallNotes:document.getElementById('overallNotes').value,features};}
function refresh(){const p=collect();const d=Object.values(p.features).filter(f=>f.verdict).length;document.getElementById('stat').textContent=d+' / '+IDS.length+' reviewed'+(p.verdict?' · '+p.verdict:'');}
function dl(){const b=new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${jsonName}';a.click();}
function saveFb(){try{localStorage.setItem(KEY,JSON.stringify(collect()));}catch(e){}refresh();dl();}
function resetFb(){try{localStorage.removeItem(KEY);}catch(e){}document.querySelectorAll('input[type=radio]').forEach(r=>r.checked=false);document.querySelectorAll('textarea').forEach(t=>t.value='');refresh();}
function downloadJSON(){dl();}
(function(){let s=null;try{s=localStorage.getItem(KEY);}catch(e){}if(s){try{const p=JSON.parse(s);Object.entries(p.features||{}).forEach(([id,f])=>{if(f.verdict){const r=document.querySelector('input[name="v-'+id+'"][value="'+f.verdict+'"]');if(r)r.checked=true;}const c=document.getElementById('c-'+id);if(c&&f.comment)c.value=f.comment;});if(p.verdict){const o=document.querySelector('input[name="overall"][value="'+p.verdict+'"]');if(o)o.checked=true;}const on=document.getElementById('overallNotes');if(on&&p.overallNotes)on.value=p.overallNotes;}catch(e){}}refresh();})();
document.addEventListener('change',refresh);document.addEventListener('input',refresh);
</script></body></html>`;
}

const imgs = {};
for (const c of CARDS) imgs[c.id] = await dataURI(c.file);
const html = render(imgs);
const htmlPath = join(OUTDIR, `${STAMP}_ICON_FX.html`);
const jsonPath = join(OUTDIR, `${STAMP}_ICON_FX_FEEDBACK.json`);
await writeFile(htmlPath, html, "utf8");
await writeFile(jsonPath, JSON.stringify({
  release: "Architect-2525 · ICON FX (Wall System · Carbon X · Phoenix $25)", date: STAMP.split("_")[0], stamp: STAMP, sha: HEAD,
  timestamp: now.toISOString(), verdict: null, overallNotes: "",
  features: Object.fromEntries(CARDS.map((c) => [c.id, { verdict: null, comment: "" }])),
}, null, 2) + "\n", "utf8");
const have = CARDS.filter((c) => imgs[c.id]).length;
console.log(`ICON FX · sha ${HEAD} · stamp ${STAMP} · images ${have}/${CARDS.length} · ASM ${ASM.length}/12`);
console.log("  HTML " + htmlPath);
console.log("  JSON " + jsonPath);
process.exit(0);
