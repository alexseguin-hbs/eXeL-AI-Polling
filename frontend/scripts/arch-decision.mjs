#!/usr/bin/env node
/**
 * arch-decision — build an OFFICIAL HI DECISION artifact in the locked HTML-options format (CLAUDE.md:
 * "OFFICIAL HI DECISIONS ARE PRESENTED AS HTML OPTIONS, NEVER CHAT PROSE"). #070b12 ground, cyan heads,
 * gold labels; one card per option with a PICK control + comment; the MoT recommendation marked; the open
 * questions + the invariant stated; a sticky SAVE FEEDBACK bar → paired JSON
 *   {release,date,stamp,sha,timestamp,decision,options:{<id>:{pick,comment}},notes}.
 * Served via file (SendUserFile) so the Blob download works. Default three real, distinct options.
 *
 *   DECISION=/path/data.json FX_OUT=/path node scripts/arch-decision.mjs
 * data.json: { title, subtitle, context:[..lines..], options:[{id,name,oneLiner,sections:[{label,body}],pros:[],cons:[],effort,risk,recommended?}], recommendation, why, openQuestions:[], invariant, provenance:[..lines..] }
 */
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUTDIR = process.env.FX_OUT || join(ROOT, "shots");
const DATA = process.env.DECISION;
if (!DATA) { console.error("set DECISION=/path/data.json"); process.exit(1); }
const d = JSON.parse(await readFile(DATA, "utf8"));
const HEAD = execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
const p2 = (n) => String(n).padStart(2, "0");
const STAMP = `${now.getFullYear()}.${p2(now.getMonth() + 1)}.${p2(now.getDate())}_${p2(now.getHours())}.${p2(now.getMinutes())}`;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (d.slug || "DECISION").replace(/[^A-Za-z0-9_-]/g, "");

const CSS = `:root{--bg:#070b12;--panel:#0a0f16;--panel2:#0d141d;--line:#1e293b;--line2:#164e63;--ink:#cbd5e1;--dim:#7c8aa0;--cyan:#22d3ee;--gold:#eab308;--green:#34d399;--rose:#fb7185;--violet:#c084fc;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.55;overflow-wrap:anywhere;padding-bottom:56px}
h1,h2,h3{font-family:'Cascadia Code','Consolas',ui-monospace,monospace;font-weight:700}
.wrap{max-width:920px;margin:0 auto;padding:18px 16px}
header.top{border-bottom:1px solid var(--line2);background:linear-gradient(180deg,#0a1420,#070b12);padding:22px 16px 16px}
header.top h1{color:var(--cyan);font-size:18px;letter-spacing:1.2px}
header.top .sub{color:var(--gold);margin-top:6px;font-size:13px}
header.top .meta{color:var(--dim);margin-top:8px;font-size:11px;font-family:'Consolas',monospace;line-height:1.7}
section{margin-top:24px}
h2{color:var(--cyan);font-size:15px;letter-spacing:1.2px;border-left:4px solid var(--cyan);padding-left:11px;margin-bottom:8px;text-transform:uppercase}
.ctx{color:var(--dim);font-size:12.5px;margin-left:15px;display:flex;flex-direction:column;gap:4px}
.rec{background:linear-gradient(180deg,#12100a,#0a0f16);border:1px solid var(--line2);border-left:3px solid var(--gold);border-radius:8px;padding:12px 14px;margin:10px 0}
.rec h3{color:var(--gold);font-size:13px} .rec p{font-size:12.5px;margin-top:5px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:16px}
.card.recd{border-color:var(--gold);box-shadow:0 0 0 1px rgba(234,179,8,.25)}
.card .head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.oid{flex:none;width:28px;height:28px;border-radius:8px;background:#052a33;color:var(--cyan);display:flex;align-items:center;justify-content:center;font-family:'Consolas',monospace;font-weight:700}
.card .head .t{font-size:14px;color:#e2e8f0;font-weight:700}
.badge{margin-left:auto;font-family:'Consolas',monospace;font-size:10px;border:1px solid var(--line2);border-radius:4px;padding:2px 7px;color:var(--gold);white-space:nowrap}
.one{padding:10px 14px 0;font-size:12.5px;color:var(--ink)}
.sec{padding:8px 14px 0;font-size:12px}
.sec .lbl{color:var(--gold);font-family:'Consolas',monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;margin-right:6px}
.pc{display:flex;gap:16px;padding:8px 14px 0;flex-wrap:wrap}
.pc ul{list-style:none;flex:1;min-width:200px} .pc li{font-size:12px;padding:2px 0 2px 16px;position:relative}
.pc .pros li::before{content:"+";position:absolute;left:0;color:var(--green)} .pc .cons li::before{content:"−";position:absolute;left:0;color:var(--rose)}
.meta2{padding:8px 14px 0;font-size:11px;color:var(--dim);font-family:'Consolas',monospace}
.pick{padding:12px 14px 14px;border-top:1px solid var(--line);margin-top:10px}
.pick .row{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.pick label{color:var(--ink);font-family:'Consolas',monospace;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px}
input[type=radio]{accent-color:var(--gold);width:16px;height:16px}
textarea{width:100%;min-height:46px;background:#0d0b06;color:#e2e8f0;border:1px solid #3f3512;border-left:2px solid var(--gold);border-radius:6px;padding:8px;font-size:12.5px;resize:vertical;font-family:inherit}
ul.q{margin:6px 0 0 18px;font-size:12.5px} ul.q li{margin-bottom:5px}
.inv{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--violet);border-radius:8px;padding:12px 14px;font-size:12.5px}
.inv h3{color:var(--violet);font-size:12.5px;margin-bottom:5px}
.statbar{position:fixed;left:0;right:0;bottom:0;background:rgba(7,11,18,.96);border-top:1px solid var(--line2);padding:9px 16px;padding-bottom:calc(9px + env(safe-area-inset-bottom,0px));display:flex;gap:12px;align-items:center;z-index:50;font-family:'Consolas',monospace;font-size:12px;color:var(--dim)}
button.act{font-family:'Consolas',monospace;font-size:13px;font-weight:700;border:none;border-radius:7px;padding:9px 15px;cursor:pointer}
.b-save{background:var(--gold);color:#201a04}.b-json{background:#0d141d;color:var(--cyan);border:1px solid var(--line2)}
.obtn{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}`;

const optCard = (o) => `  <div class="card${o.recommended ? " recd" : ""}" id="opt-${o.id}">
    <div class="head"><span class="oid">${esc(o.id)}</span><div class="t">${esc(o.name)}</div>${o.recommended ? `<span class="badge">★ MoT pick</span>` : o.effort ? `<span class="badge">effort ${esc(o.effort)}</span>` : ""}</div>
    <div class="one">${esc(o.oneLiner)}</div>
    ${(o.sections || []).map((s) => `<div class="sec"><span class="lbl">${esc(s.label)}</span>${esc(s.body)}</div>`).join("\n")}
    <div class="pc">
      ${o.pros?.length ? `<ul class="pros">${o.pros.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${o.cons?.length ? `<ul class="cons">${o.cons.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    </div>
    ${o.effort || o.risk ? `<div class="meta2">${o.effort ? `effort ${esc(o.effort)} · ` : ""}${o.risk ? `risk: ${esc(o.risk)}` : ""}</div>` : ""}
    <div class="pick">
      <div class="row"><label><input type="radio" name="decision" value="${esc(o.id)}"> Pick Option ${esc(o.id)}</label></div>
      <textarea id="c-${esc(o.id)}" placeholder="Comment on Option ${esc(o.id)}…"></textarea>
    </div>
  </div>`;

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(d.title || "HI Decision")}</title>
<style>${CSS}</style></head><body>
<header class="top"><div class="wrap">
<h1>${esc(d.title || "HI DECISION")}</h1>
${d.subtitle ? `<div class="sub">${esc(d.subtitle)}</div>` : ""}
<div class="meta">SHA ${HEAD} · stamp ${STAMP}${(d.provenance || []).map((l) => `<br>${esc(l)}`).join("")}</div>
</div></header>
<div class="wrap">
${d.context?.length ? `<section><h2>Context</h2><div class="ctx">${d.context.map((c) => `<div>${esc(c)}</div>`).join("")}</div></section>` : ""}
${d.recommendation ? `<div class="rec"><h3>★ MoT recommendation — ${esc(d.recommendation)}</h3>${d.why ? `<p>${esc(d.why)}</p>` : ""}</div>` : ""}
<section><h2>Options — pick one, comment on each</h2>
${(d.options || []).map(optCard).join("\n")}
</section>
${d.openQuestions?.length ? `<section><h2>Open questions (yours to answer)</h2><ul class="q">${d.openQuestions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></section>` : ""}
${d.invariant ? `<section><div class="inv"><h3>The invariant (holds whichever you pick)</h3>${esc(d.invariant)}</div></section>` : ""}
<section><h2>Your decision</h2>
<textarea id="notes" placeholder="Overall notes / a different direction…" style="min-height:60px"></textarea>
<div class="obtn"><button class="act b-save" onclick="save()">💾 SAVE FEEDBACK</button><button class="act b-json" onclick="save()">↓ JSON</button></div>
</section>
</div>
<div class="statbar"><span id="stat">no pick yet</span><span style="flex:1"></span><a href="#" onclick="save();return false" style="color:var(--gold)">SAVE</a></div>
<script>
const IDS=${JSON.stringify((d.options || []).map((o) => o.id))};const KEY='archdec-${STAMP.replace(/[.\s:]/g, "-")}';
function collect(){const dec=document.querySelector('input[name="decision"]:checked');const options={};IDS.forEach(id=>{const c=document.getElementById('c-'+id);options[id]={pick:dec?dec.value===id:false,comment:c?c.value:''};});
return {release:${JSON.stringify(d.title || "HI Decision")},date:'${STAMP.split("_")[0]}',stamp:'${STAMP}',sha:'${HEAD}',timestamp:new Date().toISOString(),decision:dec?dec.value:null,options,notes:document.getElementById('notes').value};}
function refresh(){const p=collect();document.getElementById('stat').textContent=p.decision?('pick: Option '+p.decision):'no pick yet';}
function save(){const p=collect();try{localStorage.setItem(KEY,JSON.stringify(p));}catch(e){}refresh();const b=new Blob([JSON.stringify(p,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${STAMP}_${slug}_DECISION.json';a.click();}
(function(){let s=null;try{s=localStorage.getItem(KEY);}catch(e){}if(s){try{const p=JSON.parse(s);if(p.decision){const r=document.querySelector('input[name="decision"][value="'+p.decision+'"]');if(r)r.checked=true;}Object.entries(p.options||{}).forEach(([id,o])=>{const c=document.getElementById('c-'+id);if(c&&o.comment)c.value=o.comment;});const n=document.getElementById('notes');if(n&&p.notes)n.value=p.notes;}catch(e){}}refresh();})();
document.addEventListener('change',refresh);
</script></body></html>`;

const base = join(OUTDIR, `${STAMP}_${slug}`);
await writeFile(`${base}.html`, html, "utf8");
await writeFile(`${base}_DECISION.json`, JSON.stringify({
  release: d.title || "HI Decision", date: STAMP.split("_")[0], stamp: STAMP, sha: HEAD, timestamp: now.toISOString(),
  decision: null, options: Object.fromEntries((d.options || []).map((o) => [o.id, { pick: false, comment: "" }])), notes: "",
}, null, 2) + "\n", "utf8");
console.log(`arch-decision · sha ${HEAD} · ${(d.options || []).length} options`);
console.log("  HTML " + `${base}.html`);
console.log("  JSON " + `${base}_DECISION.json`);
