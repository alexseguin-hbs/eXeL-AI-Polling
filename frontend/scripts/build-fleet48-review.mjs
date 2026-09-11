// build-fleet48-review.mjs — the 48-agent fleet's review of the Innovation POD showcase, as the house artefacts.
//
// Operator (2026-09-11): 12 AsM × (2 independent + 1 Voting & Summarizer) + 12 MoT coordinators; "AsM comment in 111
// words per AsM". Input: the fleet's JSON (packs[] + mot). Output: the markdown assessment in the house style
// (docs/assessments/2026-09-10_sign_doc_final_ssses_spiral.md) and the HTML feedback artefact with the REAL screenshots
// (docs/feedback/build_asm_review_2026.07.26.mjs contract). Word counts are COUNTED here and emission is REFUSED on any
// AsM that is not 111 or a MoT that is not 3 × 111 — the same gate the 2026.07.26 builder enforces.
//
//   node scripts/build-fleet48-review.mjs <fleet.json>
import fs from 'fs';
import path from 'path';
const IN = process.argv[2]; if (!IN) { console.error('usage: build-fleet48-review.mjs <fleet.json>'); process.exit(2); }
const fleet = JSON.parse(fs.readFileSync(IN, 'utf8'));
const ROOT = path.resolve(process.cwd(), '..');
const RUN = path.join(ROOT, 'docs/assessments/pod-live-run-2026-09-11');
const MD_OUT = path.join(ROOT, 'docs/assessments/2026-09-11_pod_fleet48_forward_backward.md');
const HTML_OUT = path.join(ROOT, 'docs/feedback/POD_Showcase_Fleet48_2026.09.11.html');
const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── THE GATE: 12 × 111, MoT 3 × 111. Refuse, never fudge. ──────────────────────────────────────────────────────────
const bad = [];
if (!Array.isArray(fleet.packs) || fleet.packs.length !== 12) bad.push(`expected 12 AsM packages, got ${fleet.packs?.length}`);
for (const p of fleet.packs || []) { const n = wc(p.pkg?.comment111); if (n !== 111) bad.push(`${p.name}: ${n} words, not 111`); }
const paras = String(fleet.mot || '').trim().split(/\n\s*\n/);
if (paras.length !== 3 || !paras.every((x) => wc(x) === 111)) bad.push(`MoT synthesis: ${paras.map(wc).join('+')} words, not 111+111+111`);
if (bad.length) { console.error('REFUSED — the 111/333 contract is not met:'); for (const b of bad) console.error('  ·', b); process.exit(1); }

const order = ['Aset', 'Asar', 'Athena', 'Christo', 'Enki', 'Enlil', 'Krishna', 'Odin', 'Pangu', 'Sofia', 'Thoth', 'Thor'];
const packs = order.map((n) => fleet.packs.find((p) => p.name === n)).filter(Boolean);
const grades = packs.map((p) => p.pkg.grade);
const notWorking = packs.filter((p) => /NOT WORKING/.test(p.pkg.verdict));
const sha = (() => { try { return fs.readFileSync(path.join(ROOT, '.git/refs/heads/claude/debug-wsl-issues-yYdPP'), 'utf8').trim().slice(0, 7); } catch { return 'HEAD'; } })();
const log = fs.existsSync(path.join(RUN, 'log.txt')) ? fs.readFileSync(path.join(RUN, 'log.txt'), 'utf8').split('\n') : [];

// ── MARKDOWN — the house style ─────────────────────────────────────────────────────────────────────────────────────
const md = `# Innovation POD — the showcase, reviewed forward and backward by the 48-agent fleet

**Commit ${sha} · three real phones · ${log.length} steps, ${log.filter((l) => /FAIL/.test(l)).length} failures · https://exel-ai-polling.explore-096.workers.dev/soi-session**

## 1 · The headline

The pod was asked to showcase two claims — **input in time** and **local minimum wage authorizing value** — and to mint M
as a plan accepted by the trio before the clock. Twelve Ascended Masters each fielded two independent specialists and one
Voting & Summarizer; twelve Master of Thought coordinators asked of each package the protocol's one question — *class or
instance?* Every comment below is exactly 111 words and cites the code or the run log; the synthesis is exactly 333.

Grades: **${grades.join(' · ')}**. NOT WORKING: ${notWorking.length ? notWorking.map((p) => p.name).join(', ') : 'none'}.

## 2 · The evidence the fleet read

- \`docs/assessments/pod-live-run-2026-09-11/log.txt\` — ${log.length} timestamped steps on three Chromium phones over the local Realtime relay, the app's own supabase-js client and the sacred broadcast hook unmodified; screenshots \`1-compose-plan\` … \`8-closed-receipt\` per phone.
- \`docs/assessments/2026-09-11_pod_time_volunteer_vs_paid.md\` — time documented from the shipped clock and mint: two segments, a capped claim, three currencies, ♡ vs 웃 with no minute in both columns.
- The code: \`frontend/app/soi-session/page.tsx\` and \`frontend/lib/pod-*.ts\`; the gate \`frontend/tests/pod-invariant.test.mjs\` (310).

## 3 · SPIRAL — forward 1 → 10, backward 10 → 1, in every lens

${packs.map((p) => `**${p.name}** (${p.pod}) — *forward:* ${p.A?.forward ?? '—'}  \n*backward:* ${p.B?.backward ?? '—'}`).join('\n\n')}

# 4 · The twelve, on the shipped journey — 111 words each

| Master | Grade | Verdict | State | Next |
|---|:--:|---|---|---|
${packs.map((p) => `| **${p.name}** | ${p.pkg.grade} | ${p.pkg.verdict} | ${p.pkg.state ?? '—'} | ${p.pkg.next} |`).join('\n')}

${packs.map((p) => `### ${p.name} · fleet pod ${p.pod} · ${p.pkg.grade}\n*${p.lens}*\n\n${p.pkg.comment111}\n\n*Vote:* ${p.pkg.vote}  \n*MoT coordinator — ${p.coord?.classOrInstance ?? '—'}:* ${p.coord?.note ?? '—'}`).join('\n\n')}

# 5 · Master of Thought — synthesis (333 words)

${fleet.mot.trim()}

## 6 · Mandatory next-session process

${packs.map((p, i) => `${i + 1}. **${p.name}:** ${p.pkg.next}`).join('\n')}

## 7 · Residual gaps that are the operator's

- **D1** — the Tier-2 selection rule (35 jurisdictions), open since r57; the pod shows the register's recommended default as an unsettled proposal.
- **D2** — the Global Agreed Standard value (13 jurisdictions), open since r57; same.
- **Cambodia** is in both existing rate tables and absent from the operator's 103 (merged in from hi_rates.py, flagged).
- **Mexico** — 1.43 USD vs 39.380 MXN implies 27.5 MXN/USD; both figures kept, neither edited.
- **Backend mint** still \`hours × 4.807\` with no M and no locality — out of scope by the earlier pod-only ruling.
- **The pod join code** — silent same-code data loss, no error path for a bad code, an 8-char poll code accepted — reported, open.
`;
fs.writeFileSync(MD_OUT, md);

// ── HTML — the feedback artefact with the REAL screenshots ─────────────────────────────────────────────────────────
const gradeColor = (g) => /^A/.test(g) ? '#34d399' : /^B/.test(g) ? '#38bdf8' : /^C/.test(g) ? '#fbbf24' : '#fb7185';
const phases = [['1-compose-plan', 'Compose — the task and its plan (2 h × 3 = 6 웃), the pod default place'], ['2-invite', 'Invite — QR, code, ● live'],
  ['3-agreed-elected', 'Agreed — each elected their own locality and approved the plan'], ['4-active-ready', 'Active — three ready, the clock button not yet running'],
  ['5-active-two-segments', 'Active — Start · Stop · Add time: two segments, replicated to every phone'], ['6-record-three-outcomes', 'Record — one outcome from each of the three'],
  ['7-audit-witness', 'Audit — claims capped to the clock, cross-witnessed, M locked'], ['8-closed-receipt', 'Closed — plan → actual, each at their own floor, D9, stamped']];
const img = (f) => { const p = path.join(RUN, f); return fs.existsSync(p) ? `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}` : null; };
const cards = phases.map(([k, title], i) => {
  const shots = ['lead', 'ana', 'bo'].map((w) => ({ w, src: img(`${k}-${w}.jpg`) }));
  return `<section class="card"><h3>F${i + 1} · ${esc(title)}</h3><div class="shots">${shots.map((s) => s.src ? `<figure><img src="${s.src}" alt="${esc(k)} ${s.w}"><figcaption>${s.w}</figcaption></figure>` : `<figure class="missing">screenshot not captured for ${s.w} — reported, never faked</figure>`).join('')}</div>
  <div class="verdict"><label><input type="radio" name="v${i}" value="approve"> APPROVE</label> <label><input type="radio" name="v${i}" value="changes"> CHANGES</label> <label><input type="radio" name="v${i}" value="na"> N/A</label></div>
  <textarea placeholder="operator comment" data-k="c${i}"></textarea></section>`;
}).join('\n');
const asmHtml = packs.map((p) => `<div class="asm"><h3>${esc(p.name)} <span class="pod">${esc(p.pod)}</span><span class="grade" style="background:${gradeColor(p.pkg.grade)}">${esc(p.pkg.grade)}</span></h3><div class="role">${esc(p.lens)}</div><p>${esc(p.pkg.comment111)}</p><div class="meta"><b>${esc(p.pkg.verdict)}</b> · MoT: ${esc(p.coord?.classOrInstance ?? '—')} — ${esc(p.coord?.note ?? '')}</div></div>`).join('');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>POD Showcase — 48-agent fleet review · 2026.09.11</title>
<style>:root{color-scheme:dark}body{margin:0;padding:16px;background:#0b0f14;color:#e6edf3;font:14px/1.5 system-ui,sans-serif}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 8px;color:#7dd3fc}.sub{color:#8b949e;font-size:12px}.card{border:1px solid #223;border-radius:10px;padding:12px;margin:12px 0}.card h3{margin:0 0 8px;font-size:14px}.shots{display:flex;gap:8px;overflow-x:auto}figure{margin:0;flex:0 0 auto;width:220px}figure img{width:220px;border:1px solid #223;border-radius:6px}figcaption{text-align:center;color:#8b949e;font-size:11px}.missing{color:#fb7185;font-size:12px;width:220px}.verdict label{margin-right:12px;font-size:12px}textarea{width:100%;min-height:48px;margin-top:6px;background:#0f1520;color:#e6edf3;border:1px solid #223;border-radius:6px;padding:6px}.asm{border:1px solid #223;border-radius:10px;padding:12px;margin:10px 0}.asm h3{margin:0;font-size:14px}.pod{color:#8b949e;font-weight:400;margin-left:6px}.grade{float:right;color:#000;border-radius:6px;padding:0 8px;font-weight:700}.role{color:#8b949e;font-size:12px;margin:2px 0 6px}.meta{color:#8b949e;font-size:12px}.mot{border:1px solid #7dd3fc55;border-radius:10px;padding:12px;margin:12px 0;background:#0f1a24}.mot p{margin:0 0 10px}.glyph{color:#7dd3fc;letter-spacing:.3em}.bar{position:sticky;bottom:0;background:#0b0f14ee;padding:8px 0;border-top:1px solid #223}button{background:#7dd3fc;color:#000;border:0;border-radius:6px;padding:6px 12px;font-weight:600;margin-right:8px}</style></head>
<body><div class="glyph">◬ · ♡ · 웃</div><h1>Innovation POD — the showcase, reviewed by the 48-agent fleet</h1>
<div class="sub">Commit ${esc(sha)} · three real phones · ${log.length} steps, ${log.filter((l) => /FAIL/.test(l)).length} failures · 12 AsM × 3 + 12 MoT coordinators · every AsM comment exactly 111 words · MoT 333 · grades ${esc(grades.join(' · '))}</div>
<h2>The two claims, on screen</h2><p>1 · <b>Input in time</b> — one button starts, stops and adds time; the span is the sum of segments; every press reaches every phone; a claim never exceeds the clock; a minute is ♡ or 웃, never both.<br>2 · <b>Local minimum wage authorizes value</b> — 웃 = M × T, currency-free; the plan (hours × M) accepted by all three before Start; each contributor elects their own floor and settles in their own currency at the greater of vintage and current (D9); no floor is invented.</p>
${cards}
<h2>12 Ascended Masters — 111 words each</h2>${asmHtml}
<h2>Master of Thought — synthesis (333)</h2><div class="mot">${paras.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
<div class="bar"><button onclick="save()">Save</button><button onclick="dl()">Download JSON</button><button onclick="localStorage.removeItem('fleet48');location.reload()">Reset</button></div>
<script>const K='fleet48';function state(){const o={};document.querySelectorAll('input[type=radio]:checked').forEach(r=>o[r.name]=r.value);document.querySelectorAll('textarea').forEach(t=>o[t.dataset.k]=t.value);return o}function save(){localStorage.setItem(K,JSON.stringify(state()))}function dl(){const b=new Blob([JSON.stringify({sha:'${esc(sha)}',...state()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='fleet48-feedback.json';a.click()}try{const s=JSON.parse(localStorage.getItem(K)||'{}');for(const [k,v] of Object.entries(s)){const r=document.querySelector('input[name='+k+'][value='+v+']');if(r)r.checked=true;const t=document.querySelector('textarea[data-k='+k+']');if(t)t.value=v}}catch{}</script>
<div class="sub" style="margin-top:16px">CLAUDE.md rules 4 &amp; 5 · docs/ASM_REVIEW_PROTOCOL.md · 111/333 counted by scripts/build-fleet48-review.mjs, emission refused on any miscount.</div></body></html>`;
fs.writeFileSync(HTML_OUT, html);
console.log(`written ${MD_OUT}\nwritten ${HTML_OUT} (${(html.length / 1048576).toFixed(1)} MB) · grades ${grades.join(' ')} · NOT WORKING ${notWorking.length}`);
