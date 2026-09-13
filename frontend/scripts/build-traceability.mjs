// build-traceability.mjs — per-section Vision 2525 traceability (operator 2026-09-13: "Vision-2525 traceability for each
// section … POD session, Create Doc, Sign Doc … version control with revisions and comparisons … so you dont do stupid
// ship"). Mirrors the living-document contract (docs/VISION2525_DOCUMENT_SPEC.md): an append-only ledger per section,
// rev monotonic, a new edition APPENDS. replay(rev) = every entry with e.rev <= rev; compare(a,b) = the entries between.
//   node scripts/build-traceability.mjs                      → validate all + write docs/traceability/index.html
//   node scripts/build-traceability.mjs --replay <sec> <rev> → print the section as of a revision
//   node scripts/build-traceability.mjs --compare <sec> <a> <b> → print what changed between two revisions
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const ROOT = path.resolve(process.cwd(), '..');
const DIR = path.join(ROOT, 'docs/traceability');
const KINDS = new Set(['ask', 'decision', 'release']);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.ledger.json'));
const commitExists = (sha) => { try { execSync(`git -C ${ROOT} cat-file -e ${sha}^{commit}`, { stdio: 'ignore' }); return true; } catch { return false; } };
const load = () => files.map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) }));
export function validate(ledgers) {
  const errs = [];
  for (const L of ledgers) {
    if (!L.section || !L.route) errs.push(`${L.file}: missing section/route`);
    let prev = 0;
    for (const e of L.entries) {
      if (!(e.rev === prev + 1)) errs.push(`${L.file}: rev ${e.rev} not monotonic (expected ${prev + 1})`);
      prev = e.rev;
      if (!KINDS.has(e.kind)) errs.push(`${L.file} rev ${e.rev}: kind "${e.kind}" not in ask|decision|release`);
      if (!String(e.text || '').trim()) errs.push(`${L.file} rev ${e.rev}: empty text`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || '')) errs.push(`${L.file} rev ${e.rev}: bad date`);
      if (e.kind === 'release') { if (!e.commit) errs.push(`${L.file} rev ${e.rev}: release cites no commit`); else if (!commitExists(e.commit)) errs.push(`${L.file} rev ${e.rev}: commit ${e.commit} does not exist`); }
    }
  }
  return errs;
}
export const replay = (L, rev) => L.entries.filter((e) => e.rev <= rev);
export const compare = (L, a, b) => L.entries.filter((e) => e.rev > Math.min(a, b) && e.rev <= Math.max(a, b));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function html(ledgers) {
  const data = JSON.stringify(ledgers.map(({ section, route, note, entries }) => ({ section, route, note, entries })));
  const sections = ledgers.map((L, i) => `<button class="tab${i === 0 ? ' on' : ''}" data-i="${i}">${esc(L.section)}</button>`).join('');
  return `<title>Vision 2525 Traceability</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{color-scheme:dark;--bg:#0a1518;--surface:#101e22;--ink:#e2ecec;--muted:#8fa3a6;--line:#22363a;--accent:#22d3ee;--ask:#f0b429;--decision:#a78bfa;--release:#34d399;--mono:'IBM Plex Mono',monospace;--body:'IBM Plex Sans',system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 var(--body);padding:0 16px;padding-block:24px 64px}
.wrap{max-width:900px;margin:0 auto}h1{font:600 26px/1.15 var(--body);margin:0 0 4px}.lede{color:var(--muted);max-width:70ch;margin:0 0 20px}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.tab{background:var(--surface);color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:8px 14px;font:500 13px var(--body);cursor:pointer}.tab.on{color:var(--bg);background:var(--accent);border-color:var(--accent)}
.controls{display:flex;flex-wrap:wrap;gap:14px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:16px}
.controls label{font:500 12px var(--mono);color:var(--muted);display:flex;gap:6px;align-items:center}select{background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:6px 8px;font:14px var(--mono)}
.route{font:12px var(--mono);color:var(--muted)}
ol.timeline{list-style:none;margin:0;padding:0}
li.entry{display:grid;grid-template-columns:52px 96px 1fr;gap:12px;align-items:start;border-top:1px solid var(--line);padding:12px 0}
.rev{font:600 13px var(--mono);color:var(--accent)}.kind{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;border-radius:4px;padding:2px 6px;text-align:center;height:fit-content}
.kind.ask{color:var(--ask);border:1px solid var(--ask)}.kind.decision{color:var(--decision);border:1px solid var(--decision)}.kind.release{color:var(--release);border:1px solid var(--release)}
.txt{margin:0}.date{font:11px var(--mono);color:var(--muted)}.commit{font:11px var(--mono);color:var(--release)}
.entry.added{background:rgba(52,211,153,.08)}.entry.dim{opacity:.35}
.count{font:12px var(--mono);color:var(--muted);margin:10px 0}
</style>
<div class="wrap">
<h1>Vision • 2525 — Section Traceability</h1>
<p class="lede">One append-only ledger per section: every operator ask, decision, and release, with the commit that shipped it. Pick a revision to replay the section as of that point, or compare two revisions to see exactly what changed. A new edition appends; nothing is edited or deleted — so the history can be trusted.</p>
<div class="tabs">${sections}</div>
<div class="controls">
  <span class="route" id="route"></span>
  <label>Replay as of <select id="asof"></select></label>
  <label>Compare <select id="cmpa"></select> → <select id="cmpb"></select></label>
  <label><input type="checkbox" id="cmpon"> compare mode</label>
</div>
<p class="count" id="count"></p>
<ol class="timeline" id="tl"></ol>
</div>
<script>
const L = ${data};
let si = 0;
const $ = (id) => document.getElementById(id);
function opts(sel, revs, sel0){ sel.innerHTML = revs.map((r) => '<option value="'+r+'"'+(r===sel0?' selected':'')+'>'+r+'</option>').join(''); }
function render(){
  const s = L[si]; const revs = s.entries.map((e)=>e.rev); const max = Math.max(...revs);
  $('route').textContent = s.route;
  if ($('asof').dataset.s !== String(si)){ opts($('asof'), revs, max); opts($('cmpa'), revs, 1); opts($('cmpb'), revs, max); $('asof').dataset.s = String(si); }
  const cmp = $('cmpon').checked;
  let show, added = new Set();
  if (cmp){ const a=+$('cmpa').value, b=+$('cmpb').value; show = s.entries.filter((e)=>e.rev<=Math.max(a,b)); s.entries.filter((e)=>e.rev>Math.min(a,b)&&e.rev<=Math.max(a,b)).forEach((e)=>added.add(e.rev)); $('count').textContent = (added.size)+' change(s) between rev '+Math.min(a,b)+' and rev '+Math.max(a,b); }
  else { const v=+$('asof').value; show = s.entries.filter((e)=>e.rev<=v); $('count').textContent = show.length+' of '+s.entries.length+' entries as of rev '+v; }
  $('tl').innerHTML = show.map((e)=>'<li class="entry'+(cmp?(added.has(e.rev)?' added':' dim'):'')+'"><span class="rev">r'+e.rev+'</span><span class="kind '+e.kind+'">'+e.kind+'</span><div><p class="txt">'+e.text.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</p><span class="date">'+e.date+'</span>'+(e.commit?' · <span class="commit">'+e.commit+'</span>':'')+'</div></li>').join('');
}
document.querySelectorAll('.tab').forEach((t)=>t.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach((x)=>x.classList.remove('on'));t.classList.add('on');si=+t.dataset.i;render();}));
['asof','cmpa','cmpb','cmpon'].forEach((id)=>$(id).addEventListener('change',render));
render();
</script>`;
}
const ledgers = load();
const arg = process.argv[2];
if (arg === '--replay') { const [, , , sec, rev] = process.argv; const L1 = ledgers.find((l) => l.section.toLowerCase().includes(sec.toLowerCase())); console.log(replay(L1, +rev).map((e) => `r${e.rev} ${e.kind}\t${e.text}`).join('\n')); }
else if (arg === '--compare') { const [, , , sec, a, b] = process.argv; const L1 = ledgers.find((l) => l.section.toLowerCase().includes(sec.toLowerCase())); console.log(`${L1.section}: rev ${a} → ${b}`); console.log(compare(L1, +a, +b).map((e) => `+ r${e.rev} ${e.kind}\t${e.text}`).join('\n')); }
else {
  const errs = validate(ledgers);
  if (errs.length) { console.error('REFUSED —\n  ' + errs.join('\n  ')); process.exit(1); }
  fs.writeFileSync(path.join(DIR, 'index.html'), html(ledgers));
  console.log(`traceability OK: ${ledgers.map((l) => `${l.section} (${l.entries.length})`).join(' · ')} → docs/traceability/index.html`);
}
