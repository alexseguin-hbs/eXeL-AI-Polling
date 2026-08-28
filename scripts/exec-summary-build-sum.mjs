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
/* Thor r1.025: sign values are emitted into HTML raw, so the table itself is an
   input — a poisoned value was a live injection reachable through a correction PR.
   Fail closed: every value must be pure cuneiform (the Sumero-Akkadian blocks). */
for (const [rd, v] of Object.entries(SIGN)) {
  if (!/^[\u{12000}-\u{1254F}]+$/u.test(v)) {
    console.error(`SIGNMAP POISONED — reading "${rd}" carries a non-cuneiform value; refusing.`);
    process.exit(1);
  }
}
const RELREC = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.release.json', 'utf8'));
const REL = RELREC.release, VER = RELREC.version;

const SHA = crypto.createHash('sha256').update(EN_RAW, 'utf8').digest('hex');
const FROZEN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sentences.json', 'utf8')).sha256;
if (SHA !== FROZEN) { console.error('CANONICAL SOURCE DRIFT — refusing.'); process.exit(1); }

const problems = [];
/* lint what exists FIRST, so token defects surface even while keys are missing */
const missing = [];
for (const k of Object.keys(EN)) {
  if (k === 'k00') continue;
  if (!Array.isArray(SUM[k]) || !SUM[k].length) missing.push(k);
}

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
      /* Thor r1.021: NEVER emit ⟦…⟧ content unescaped — the plain path lands in
         alt attributes and captions, an empirically proven injection point. */
      out.push(plain ? esc(lat) : '<span class="lat">' + esc(lat) + '</span>');
      continue;
    }
    const words = [];
    for (const chunk of seg.split(/(\s+|•|—|–|[;,:.!?])/)) {
      if (!chunk || /^\s+$/.test(chunk)) continue;
      if (chunk === '•' || /^(—|–|[;,:.!?])$/.test(chunk)) { words.push(plain ? chunk : '<span class="sep">' + chunk + '</span>'); continue; }
      /* Pangu r1.026: signs within one hyphenated word were concatenated with a zero
         gap, and adjacent wedges fused into what read as one denser sign. A narrow
         no-break space (U+202F) between them gives a stable in-word seam (~2.8px at
         390px vs the ~6px word gap) that never breaks a sign run across a line. */
      /* r1.027 · operator: "default like divinity guide with sumerian pronunciation
         above each character." Each reading's sign(s) become a <ruby> with the reading
         as the <rt> annotation above — the pinyin-over-hanzi pattern, always visible.
         The plain path (alt/caption) keeps reading-free glyphs, U+202F-separated. */
      const parts = [];
      for (const tok of chunk.split('-').filter(Boolean)) {
        if (!(tok in SIGN)) { problems.push(`unmapped reading "${tok}" in "${chunk}"`); parts.push({ g: '?', r: tok }); }
        else parts.push({ g: SIGN[tok], r: tok });
      }
      if (plain) words.push(parts.map(p => p.g).join(' '));
      else words.push('<span class="cw">' +
        parts.map(p => '<ruby>' + p.g + '<rt>' + esc(p.r) + '</rt></ruby>').join('') + '</span>');
    }
    out.push(words.join(' '));
  }
  /* Collapse ASCII whitespace only — NOT \s, which eats the U+202F in-word seams
     above (the naive /\s+/ silently rewrote every narrow space back to a plain one). */
  return out.join(' ').replace(/[ \t\n\r\f\v]+/g, ' ').trim();
}

/* Build per-key HTML: every sentence is a tappable span carrying its index into
   the study data. Plain keys (title, image alt, caption) carry no markup. */
const D = [];          // study data: [{r, t, e, g}] — r = page.paragraph.sentence
const PLAIN = new Set(['k00', 'k69', 'k70']);
/* operator: "section out work in smaller chunks page.paragraph.sentence number first —
   00.01.01 page 0 preamble paragraph 1 sentence 1 … 12.03.06". Every sentence carries
   an addressable reference so a reviewer can cite one chunk exactly. */
const P2 = n => String(n).padStart(2, '0');
function refFor(k, i) {
  const n = +k.slice(1);
  if (n >= 1 && n <= 4)   return `00.00.${P2(n)}`;                        // masthead + preamble head
  if (n >= 5 && n <= 16)  return `${P2(n - 4)}.00.01`;                    // section heads 01-12
  if (n >= 17 && n <= 19) return `00.${P2(n - 16)}.${P2(i + 1)}`;         // preamble paragraphs
  if (n >= 20 && n <= 55) return `${P2(Math.floor((n - 20) / 3) + 1)}.${P2(((n - 20) % 3) + 1)}.${P2(i + 1)}`;
  if (n >= 56 && n <= 65) return `13.01.${P2(n - 55)}`;                   // the litany, ten sentences
  if (n === 66) return '13.02.01';
  if (n === 67) return '13.03.01';
  if (n === 68) return '13.04.01';
  if (n === 69) return '13.05.01';
  if (n === 70) return '13.06.01';
  return `xx.xx.${P2(i + 1)}`;
}
const html = {};
for (const k of Object.keys(EN)) {
  if (k === 'k00') { html.k00 = 'Vision • 2525 — 𒅴𒂠 Executive Summary · Sumerian draft'; continue; }
  if (!Array.isArray(SUM[k])) continue; /* missing keys are reported by the completeness check, not a TypeError */
  if (PLAIN.has(k)) { html[k] = SUM[k].map(r => cune(r.t, true)).join(' '); continue; }
  html[k] = SUM[k].map(r => {
    const i = D.push({ r: refFor(k, SUM[k].indexOf(r)), t: r.t, e: r.e, g: r.g }) - 1;
    return `<span class="snt" data-i="${i}">${cune(r.t)}</span>`;
  }).join(' ');
}
if (problems.length || missing.length) {
  if (missing.length) console.error('SUM INCOMPLETE — missing: ' + missing.join(', '));
  if (problems.length) {
    console.error('SUM BUILD REFUSED — ' + problems.length + ' token problem(s):');
    for (const p of [...new Set(problems)].slice(0, 30)) console.error('  ' + p);
  }
  process.exit(1);
}

const SUMSHA = crypto.createHash('sha256')
  .update(fs.readFileSync('docs/i18n/exec-summary.sum.json'))
  .update(fs.readFileSync('docs/i18n/sum/signmap.json')).digest('hex').slice(0, 12);
let h = TPL;
h = h.replace('<meta name=exel-source-sha256', '<meta name=exel-sum-src content="' + SUMSHA + '"><meta name=exel-source-sha256');
for (const k of Object.keys(EN)) h = h.split('{{' + k + '}}').join(html[k]);
h = h.split('{{REL}}').join(REL).split('{{VER}}').join(VER).split('{{SHA}}').join(SHA)
     .split('{{DLHREF}}').join('download/vision-2525-executive-summary.sum.html');
h = h.replace('<html lang=en>', '<html lang=sux>');

/* r1.029 · the cuneiform face is EMBEDDED, not fetched. A ~25KB subset of Noto
   Sans Cuneiform (only the 118 signs this edition uses) is inlined as a data-URI
   @font-face, so the signs render offline, in the download twin, and on devices
   with no system cuneiform font — the Google Fonts pull for it is dropped. SIL OFL
   1.1: docs/i18n/sum/font/OFL-NOTICE.md. */
const FONT_B64 = fs.readFileSync('docs/i18n/sum/font/noto-sans-cuneiform.subset.woff2').toString('base64');
h = h.replace('</style>', `
/* ── SUM edition · cuneiform + study apparatus ─────────────────────────────── */
@font-face{font-family:"NotoCuneiSubset";src:url(data:font/woff2;base64,${FONT_B64}) format("woff2");font-display:swap;unicode-range:U+12000-1254F}
article p,.subt,h2,.kick,.pn,ul.seal li,.banner,.motto,.motto2,.sealcap{font-family:"NotoCuneiSubset","Noto Sans Cuneiform","Segoe UI Historic",Georgia,serif}
article p{font-size:clamp(21px,5.5vw,27px);line-height:2.9;letter-spacing:.02em}\n.snt{padding:2px 0;display:inline}\n/* r1.027 · ruby: the reading rides above each sign, pinyin-over-hanzi. */\n.cw{display:inline-block;margin:0 .16em}\narticle ruby{ruby-position:over;-webkit-ruby-position:before;margin:0 .02em}\narticle ruby rt{font:600 .40em/1.1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.02em;color:var(--accent);text-transform:none}\nul.seal li ruby rt,.banner ruby rt,.motto ruby rt{color:var(--accent)}
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
.stcard .st-id{grid-column:1 / -1;font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--accent);margin-bottom:.15rem}\n.stcard{display:grid;grid-template-columns:1fr 1fr;text-align:start;gap:0 1.1rem;margin:.7rem 0 1rem;padding:.85rem 1rem;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;background:var(--raise)}
.stcard .st-t{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.86rem;line-height:1.6;color:var(--accent);word-break:break-word}
.stcard .st-e{font-family:"Spectral",Georgia,serif;font-size:.95rem;line-height:1.6;color:var(--ink)}
.stcard .gh{margin-top:.5rem}\n.stcard .gg{font-family:\"Spectral\",Georgia,serif;font-style:italic;font-size:.85rem;color:var(--soft)}\n.stcard h5{margin:0 0 .3rem;font:600 9.5px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--soft)}
@media(max-width:560px){.stcard{grid-template-columns:1fr;gap:.7rem 0}}
</style>`);

/* the study toggle joins the control row, left of the globe */
h = h.replace('<button id="bLang"',
  '<button id="bStudy" aria-pressed="false" title="Study — tap a sentence for its gloss, English, and reference">study</button><button id="bLang"');

/* DRAFT banner under the masthead */
h = h.replace('</header>\n<div class=wrap>', `</header>
<div class="draftban"><span class="mono">Scholarly draft · review invited</span>
This is a composed Sumerian translation — meaning, not English spelled in signs. The
transliteration is the master and the cuneiform derives from a Unicode-verified sign
table; the method, sources (ETCSL · ePSD2 · CDLI), grammar conventions and flagged
coinages are stated in <a href="https://github.com/alexseguin-hbs/eXeL-AI-Polling/blob/main/docs/i18n/sum/SUM_METHOD.md">SUM_METHOD</a>.
The reading sits above every sign. Toggle <strong>study</strong> above, then select any sentence of the running text: its
transliteration and literal gloss appear on the left, the English master phrase on the
right. Corrections are wanted — send them as
<a href="https://github.com/alexseguin-hbs/eXeL-AI-Polling/issues">GitHub issues</a>,
quoting the English line.</div>\n<div class=wrap>`);

/* study data + behaviour */
h = h.replace('</body>', `<script>
(function(){
  var D = ${JSON.stringify(D).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')}; /* Thor r1.021: a closing script tag inside a record must not end this script (hence the u003c escape — and no literal tag in this comment either, which is exactly how r1.021 broke itself) */
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
    var before = s.getBoundingClientRect().top;
    clear();
    s.classList.add('sel');
    var d = D[+s.getAttribute('data-i')]; if (!d) return;
    var card = document.createElement('div');
    card.className = 'stcard';
    card.innerHTML = '<div class="st-id"></div><div class="st-t"><h5>Transliteration</h5><div class="tt"></div><h5 class="gh">Literal gloss</h5><div class="gg"></div></div><div class="st-e"><h5>English</h5></div>';
    card.querySelector('.st-id').textContent = d.r || '';
    card.querySelector('.tt').appendChild(document.createTextNode(d.t));
    card.querySelector('.gg').appendChild(document.createTextNode(d.g || ''));
    card.querySelector('.st-e').appendChild(document.createTextNode(d.e));
    var host = s.closest('p,h2,li,.banner,.motto,.motto2,header.ph') || s.parentElement;
    if (host.tagName === 'LI') host = host.parentElement; /* a div inside ul.seal is invalid HTML — the card follows the plate */
    host.insertAdjacentElement('afterend', card);
    var drift = s.getBoundingClientRect().top - before;
    if (drift) window.scrollBy(0, drift);
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
