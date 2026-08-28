// exec-summary-build-sum.mjs — build the Sumerian (SUM) Executive Summary.
//
// SCHOLARLY DRAFT edition. Never recreates what is already executed: the page is
// generated FROM docs/i18n/exec-summary.template.html — the same chrome, masthead,
// theme script, globe and download row every other edition uses — with each {{kNN}}
// substituted by CUNEIFORM rendered from the transliteration master
// (docs/i18n/exec-summary.sum.json) through the Unicode-name-verified sign table
// (docs/i18n/sum/signmap.json). Fails closed on: missing keys, missing sentences,
// any reading outside the sign table, master-hash drift.
//
// The study apparatus (operator): a toggle; selecting a sentence highlights it and
// shows its TRANSLITERATION on the left and the ENGLISH master phrase on the right —
// the Divinity Guide's pattern — so a reviewer can fault any line against its source.
// Writes frontend/public/whitepaper/vision-2525-executive-summary.sum.html + the
// byte-identical download twin.
import fs from 'fs';
import crypto from 'crypto';

const TPL = fs.readFileSync('docs/i18n/exec-summary.template.html', 'utf8');
const EN_RAW = fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8');
const EN = JSON.parse(EN_RAW);
const SUM = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sum.json', 'utf8'));
const SIGN = JSON.parse(fs.readFileSync('docs/i18n/sum/signmap.json', 'utf8'));
const RELREC = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.release.json', 'utf8'));
const REL = RELREC.release, VER = RELREC.version;

const SHA = crypto.createHash('sha256').update(EN_RAW, 'utf8').digest('hex');
const FROZEN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sentences.json', 'utf8')).sha256;
if (SHA !== FROZEN) { console.error('CANONICAL SOURCE DRIFT — refusing.'); process.exit(1); }

const problems = [];
for (const k of Object.keys(EN)) {
  if (k === 'k00') continue;
  if (!Array.isArray(SUM[k]) || !SUM[k].length) problems.push(`${k} missing from SUM master`);
}
if (problems.length) { console.error('SUM INCOMPLETE — ' + problems.join(', ')); process.exit(1); }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* transliteration -> cuneiform. ⟦…⟧ passes through in Latin; • is a separator;
   words are hyphen-joined readings, each of which MUST be in the sign table. */
function cune(t, plain) {
  const out = [];
  const segs = String(t).split(/(⟦[^⟧]*⟧)/);
  for (const seg of segs) {
    if (!seg) continue;
    if (seg.startsWith('⟦')) {
      const lat = seg.slice(1, -1);
      out.push(plain ? lat : '<span class="lat">' + esc(lat) + '</span>');
      continue;
    }
    const words = [];
    for (const chunk of seg.split(/(\s+|•)/)) {
      if (!chunk || /^\s+$/.test(chunk)) continue;
      if (chunk === '•') { words.push(plain ? '•' : '<span class="sep">•</span>'); continue; }
      let signs = '';
      for (const tok of chunk.split('-').filter(Boolean)) {
        if (!(tok in SIGN)) { problems.push(`unmapped reading "${tok}" in "${chunk}"`); signs += '?'; }
        else signs += SIGN[tok];
      }
      words.push(signs);
    }
    out.push(words.join(' '));
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

/* Build per-key HTML: every sentence is a tappable span carrying its index into
   the study data. Plain keys (title, image alt, caption) carry no markup. */
const D = [];          // study data: [{t, e}]
const PLAIN = new Set(['k00', 'k69', 'k70']);
const html = {};
for (const k of Object.keys(EN)) {
  if (k === 'k00') { html.k00 = 'Vision • 2525 — 𒅴𒂠 Executive Summary · Sumerian draft'; continue; }
  if (PLAIN.has(k)) { html[k] = SUM[k].map(r => cune(r.t, true)).join(' '); continue; }
  html[k] = SUM[k].map(r => {
    const i = D.push({ t: r.t, e: r.e }) - 1;
    return `<span class="snt" data-i="${i}">${cune(r.t)}</span>`;
  }).join(' ');
}
if (problems.length) {
  console.error('SUM BUILD REFUSED — ' + problems.length + ' problem(s):');
  for (const p of [...new Set(problems)].slice(0, 30)) console.error('  ' + p);
  process.exit(1);
}

let h = TPL;
for (const k of Object.keys(EN)) h = h.split('{{' + k + '}}').join(html[k]);
h = h.split('{{REL}}').join(REL).split('{{VER}}').join(VER).split('{{SHA}}').join(SHA)
     .split('{{DLHREF}}').join('download/vision-2525-executive-summary.sum.html');
h = h.replace('<html lang=en>', '<html lang=sux>');

/* the cuneiform face + study styles ride on the shared stylesheet */
h = h.replace('family=Spectral', 'family=Noto+Sans+Cuneiform&family=Spectral');
h = h.replace('</style>', `
/* ── SUM edition · cuneiform + study apparatus ─────────────────────────────── */
article p,.subt,h2,.kick,.pn,ul.seal li,.banner,.motto,.motto2,.sealcap{font-family:"Noto Sans Cuneiform","Segoe UI Historic",Georgia,serif}
article p{font-size:23px;line-height:2.05;letter-spacing:.02em}
ul.seal li{font-size:21px;line-height:2}
.lat{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.62em;letter-spacing:.04em;color:var(--accent);vertical-align:.14em}
.sep{color:var(--accent)}
.draftban{max-width:42rem;margin:1.2rem auto 0;padding:.8rem 1.4rem;border:1px solid var(--accent);border-left:4px solid var(--accent);border-radius:10px;background:var(--accent-bg);font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:.85rem;line-height:1.55;color:var(--ink)}
.draftban .mono{font-family:ui-monospace,monospace;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:.25rem}
#bStudy{display:inline-flex;align-items:center;justify-content:center;min-height:31px;box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:5px 10px;border:1px solid var(--line);background:var(--raise);color:var(--ink);border-radius:3px;cursor:pointer;line-height:1.4}
#bStudy:hover{border-color:var(--accent);color:var(--accent)}
#bStudy[aria-pressed=true]{background:var(--accent-bg);color:var(--accent);border-color:var(--accent)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) #bStudy{border-radius:9px}}
:root[data-theme=dark] #bStudy{border-radius:9px}
body.study .snt{cursor:pointer;border-radius:6px}
body.study .snt:hover{background:var(--accent-bg)}
.snt.sel{background:var(--accent-bg);box-shadow:0 0 0 1px var(--accent);border-radius:6px}
.stcard{display:grid;grid-template-columns:1fr 1fr;gap:0 1.1rem;margin:.7rem 0 1rem;padding:.85rem 1rem;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;background:var(--raise)}
.stcard .st-t{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.86rem;line-height:1.6;color:var(--accent);word-break:break-word}
.stcard .st-e{font-family:"Spectral",Georgia,serif;font-size:.95rem;line-height:1.6;color:var(--ink)}
.stcard h5{margin:0 0 .3rem;font:600 9.5px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--soft)}
@media(max-width:560px){.stcard{grid-template-columns:1fr;gap:.7rem 0}}
</style>`);

/* the study toggle joins the control row, left of the globe */
h = h.replace('<button id="bLang"',
  '<button id="bStudy" aria-pressed="false" title="Study mode — select a sentence to see its transliteration and the English phrase">translit</button><button id="bLang"');

/* DRAFT banner under the masthead */
h = h.replace('</header>', `</header>
<div class="draftban"><span class="mono">Scholarly draft · review invited</span>
This is a composed Sumerian translation — meaning, not English spelled in signs. The
transliteration is the master and the cuneiform derives from a Unicode-verified sign
table; the method, sources (ETCSL · ePSD2 · CDLI), grammar conventions and flagged
coinages are stated in <a href="https://github.com/alexseguin-hbs/eXeL-AI-Polling/blob/main/docs/i18n/sum/SUM_METHOD.md">SUM_METHOD</a>.
Toggle <strong>translit</strong> above, then select any sentence: its transliteration
appears on the left and the English master phrase on the right. Corrections are wanted.</div>`);

/* this page's own row in the globe: SUM, live, current */
h = h.replace('var SUX   = {"c":"sux","n":"𒅴𒂠","e":"Sumerian · cuneiform","note":"in preparation"};',
              'var SUX   = {"c":"sum","n":"𒅴𒂠","e":"Sumerian · cuneiform","note":"draft"};');
h = h.replace('row(SUX, false, SUX.note)', 'row(SUX, true)');

/* study data + behaviour */
h = h.replace('</body>', `<script>
(function(){
  var D = ${JSON.stringify(D)};
  var btn = document.getElementById('bStudy');
  if (!btn) return;
  var on = false;
  btn.addEventListener('click', function(){
    on = !on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.classList.toggle('study', on);
    if (!on) clear();
  });
  function clear(){
    var c = document.querySelector('.stcard'); if (c) c.remove();
    var s = document.querySelector('.snt.sel'); if (s) s.classList.remove('sel');
  }
  document.addEventListener('click', function(e){
    if (!on) return;
    var s = e.target.closest('.snt'); if (!s) return;
    clear();
    s.classList.add('sel');
    var d = D[+s.getAttribute('data-i')]; if (!d) return;
    var card = document.createElement('div');
    card.className = 'stcard';
    card.innerHTML = '<div class="st-t"><h5>Transliteration</h5></div><div class="st-e"><h5>English</h5></div>';
    card.querySelector('.st-t').appendChild(document.createTextNode(d.t));
    card.querySelector('.st-e').appendChild(document.createTextNode(d.e));
    var host = s.closest('p,h2,li,.banner,.motto,.motto2') || s.parentElement;
    host.insertAdjacentElement('afterend', card);
  });
})();
</script></body>`);

const leftover = h.match(/\{\{[A-Za-z0-9_]+\}\}/g) || [];
if (leftover.length) { console.error('UNRESOLVED TOKENS:', leftover.join(' ')); process.exit(1); }

const OUT = 'frontend/public/whitepaper/vision-2525-executive-summary.sum.html';
fs.writeFileSync(OUT, h);
fs.mkdirSync('frontend/public/whitepaper/download', { recursive: true });
fs.writeFileSync('frontend/public/whitepaper/download/vision-2525-executive-summary.sum.html', h);
console.log(`sum: ${D.length} study sentences, ${REL} -> ${OUT} (+ download twin)`);
