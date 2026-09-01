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
const D = [];          // study data: [{r, t, e, g}] — r = page.paragraph..sentence
/* k00 is the <title> (browser tab) and k70 is the seal image's alt attribute —
   both must stay reading-free plain glyphs (ruby markup cannot live in either). */
const PLAIN = new Set(['k00', 'k70']);
/* r1.030 · operator: "is there transliteration mode throughout?" The seal caption
   (k69, the author line under the eagle) was plain — the one visible phrase with no
   reading above its signs. It renders ruby now like everything else, but WITHOUT the
   tappable .snt wrapper, because it sits inside the author link and a study-card tap
   there would fight the navigation. Readings above; no card. */
const RUBY_ONLY = new Set(['k69']);
/* operator: "section out work in smaller chunks page.paragraph.sentence number first —
   page 0 preamble paragraph 1 sentence 1 … section 12 paragraph 3 sentence 6". Every
   sentence carries an addressable reference so a reviewer can cite one chunk exactly.

   r1.037 · renumbered to the house A.B..C grammar (operator: "00 is page for preamble ·
   .01 to .03 is paragraph 1-3 · ..01 is sentence one of ##.##..01 paragraph"). The
   separator now reads PAGE.PARAGRAPH..SENTENCE — one dot down to the paragraph, TWO
   dots down to the sentence — the same notation Vision • 2525 uses everywhere else
   (celestial A.B..C, the Base-3600 tokenomics figures). So 00.01..01 is the Preamble,
   paragraph 1, sentence 1; 12.03..06 is section 12, paragraph 3, sentence 6. The three
   fields and their meanings are unchanged; only the grammar that joins them moved. */
/* r1.039 · PARAGRAPHS ARE 1-3, ALWAYS (operator: "ensure paragraphs are 1-3 only,
   there is no zero paragraph"). Two things used to break that rule and both are gone:

   · Paragraph 00 held the HEADINGS — the masthead and the twelve section titles. A
     heading is not a paragraph, but it is not homeless either: it OPENS the paragraph
     it heads, so it is now sentence 01 of paragraph 1. A section title is 'NN.01..01'
     and that section's first prose sentence follows at 'NN.01..02'. Page 00 opens with
     four heading lines (wordmark, subtitle, "Preamble", the preamble's own title), so
     its prose begins at '00.01..05'.
   · The close ran to paragraph 04. Its two mottos are one closing plate, so they share
     paragraph 3 — 13.03..01 and 13.03..02 — with the author line and seal after them.

   Every reference is therefore page.PARAGRAPH(1-3)..sentence, and no two collide. */
const P2 = n => String(n).padStart(2, '0');
const HEAD00 = 4;   // page 00's heading lines, which open its first paragraph
function refFor(k, i) {
  const n = +k.slice(1);
  if (n >= 1 && n <= 4)   return `00.01..${P2(n)}`;                        // masthead + preamble head
  if (n >= 5 && n <= 16)  return `${P2(n - 4)}.01..01`;                    // section titles 01-12
  if (n >= 17 && n <= 19) {                                               // preamble paragraphs 1-3
    const para = n - 16;
    return `00.${P2(para)}..${P2(i + 1 + (para === 1 ? HEAD00 : 0))}`;
  }
  if (n >= 20 && n <= 55) {                                               // section paragraphs 1-3
    const sec  = Math.floor((n - 20) / 3) + 1;
    const para = ((n - 20) % 3) + 1;
    return `${P2(sec)}.${P2(para)}..${P2(i + 1 + (para === 1 ? 1 : 0))}`;  // para 1 follows its title
  }
  if (n >= 56 && n <= 65) return `13.01..${P2(n - 55)}`;                   // the litany, ten sentences
  if (n === 66) return '13.02..01';                                       // the banner
  if (n === 67) return '13.03..01';                                       // motto
  if (n === 68) return '13.03..02';                                       // motto
  if (n === 69) return '13.03..03';                                       // author line
  if (n === 70) return '13.03..04';                                       // seal
  return `xx.01..${P2(i + 1)}`;
}
const html = {};
for (const k of Object.keys(EN)) {
  if (k === 'k00') { html.k00 = 'Vision • 2525 — 𒅴𒂠 Executive Summary · Sumerian draft'; continue; }
  if (!Array.isArray(SUM[k])) continue; /* missing keys are reported by the completeness check, not a TypeError */
  if (PLAIN.has(k)) { html[k] = SUM[k].map(r => cune(r.t, true)).join(' '); continue; }
  if (RUBY_ONLY.has(k)) { html[k] = SUM[k].map(r => cune(r.t)).join(' '); continue; }
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
.stcard .st-id{grid-column:1 / -1;font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--accent);margin-bottom:.15rem}\n.stcard{position:relative;display:grid;grid-template-columns:1fr 1fr;text-align:start;gap:0 1.1rem;margin:.7rem 0 1rem;padding:.85rem 2.4rem .85rem 1rem;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;background:var(--raise)}\n.stcard .stx{position:absolute;top:.4rem;right:.5rem;width:1.9rem;height:1.9rem;display:flex;align-items:center;justify-content:center;font:400 20px/1 ui-sans-serif,system-ui,sans-serif;background:none;border:0;border-radius:8px;color:var(--soft);cursor:pointer}\n.stcard .stx:hover{background:var(--paper);color:var(--accent)}
.stcard .st-t{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.86rem;line-height:1.6;color:var(--accent);word-break:break-word}
.stcard .st-e{font-family:"Spectral",Georgia,serif;font-size:.95rem;line-height:1.6;color:var(--ink)}
.stfb{grid-column:1/-1;margin-top:.5rem;border-top:1px solid var(--line);padding-top:.6rem}
.stfb .fbopen,.fbform button{font:600 11px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border:1px solid var(--line);background:var(--raise);color:var(--accent);border-radius:8px;padding:7px 12px}
.stfb .fbopen:hover,.fbform button:hover{border-color:var(--accent)}
.fbform{grid-column:1/-1;display:flex;flex-direction:column;gap:.5rem;margin-top:.55rem;font-family:"Spectral",Georgia,serif}
.fbform label{font:600 9.5px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}
.fbform textarea,.fbform input{font:14px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:.55rem;width:100%;box-sizing:border-box}
.fbform textarea{min-height:3.2rem;resize:vertical}
.fbrow{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.fbform .send{background:var(--accent-bg);color:var(--accent);border-color:var(--accent)}
.fbmsg{font:13.5px/1.5 "Spectral",Georgia,serif;color:var(--soft)}
.fbmsg a{color:var(--accent)}
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
  /* r1.031 · per-sentence feedback — the human annotation loop. A reader in study
     mode suggests a corrected transliteration; it POSTs to the Supabase-backed
     Pages Function, keyed to the sentence's page.paragraph..sentence reference. If
     the backend is unreachable (a downloaded offline copy), it falls back to a
     prefilled GitHub issue so the correction is never lost. */
  var PAGE_SHA = ${JSON.stringify(SHA.slice(0, 12))};
  var FB_ENDPOINT = '/api/sum-feedback';
  var GH_ISSUE = 'https://github.com/alexseguin-hbs/eXeL-AI-Polling/issues/new';
  function esc(x){ return String(x).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function openFeedback(card, d){
    var fb = card.querySelector('.stfb');
    fb.innerHTML =
      '<form class="fbform">' +
        '<label>Corrected transliteration (' + esc(d.r) + ')</label>' +
        '<textarea class="sug" spellcheck="false"></textarea>' +
        '<label>Note &middot; source (optional)</label>' +
        '<input class="note" type="text" placeholder="e.g. ePSD2 reading, ETCSL parallel, case-chain fix">' +
        '<div class="fbrow"><button type="submit" class="send">Send correction</button>' +
        '<button type="button" class="cancel">Cancel</button>' +
        '<span class="fbmsg"></span></div>' +
      '</form>';
    var form = fb.querySelector('form');
    form.querySelector('.sug').value = d.t;
    form.querySelector('.cancel').addEventListener('click', function(){
      fb.innerHTML = '<button type="button" class="fbopen">&#9998; Suggest a correction</button>';
      fb.querySelector('.fbopen').addEventListener('click', function(){ openFeedback(card, d); });
    });
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var msg = form.querySelector('.fbmsg');
      var suggested = form.querySelector('.sug').value.trim();
      var note = form.querySelector('.note').value.trim();
      if (!suggested){ msg.textContent = 'Enter a corrected transliteration first.'; return; }
      msg.textContent = 'Sending…';
      var payload = { ref:d.r, lang:'sum', current_t:d.t, suggested_t:suggested, note:note, sentence_e:d.e, page_sha:PAGE_SHA };
      fetch(FB_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
        .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function(){ fb.innerHTML = '<span class="fbmsg">Thank you — your correction for <b>' + esc(d.r) + '</b> is recorded for review.</span>'; })
        .catch(function(){
          var title = encodeURIComponent('SUM correction ' + d.r);
          var bodyq = encodeURIComponent('Reference: ' + d.r + '\\nEnglish: ' + d.e + '\\nCurrent: ' + d.t + '\\nSuggested: ' + suggested + (note ? '\\nNote: ' + note : ''));
          msg.innerHTML = 'Offline — <a href="' + GH_ISSUE + '?title=' + title + '&body=' + bodyq + '" target="_blank" rel="noopener">open a GitHub issue</a> to record it.';
        });
    });
  }
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
    /* r1.033 · operator: "add x in upper right or click highlight to deselect."
       Tapping the already-selected sentence (or the card's X) closes the card and
       clears the highlight. */
    if (e.target.closest('.stx')) { clear(); return; }
    var s = e.target.closest('.snt'); if (!s) return;
    if (s.classList.contains('sel')) { clear(); return; }
    var before = s.getBoundingClientRect().top;
    clear();
    s.classList.add('sel');
    var d = D[+s.getAttribute('data-i')]; if (!d) return;
    var card = document.createElement('div');
    card.className = 'stcard';
    card.innerHTML = '<button type="button" class="stx" aria-label="Close">&times;</button><div class="st-id"></div><div class="st-t"><h5>Transliteration</h5><div class="tt"></div><h5 class="gh">Literal gloss</h5><div class="gg"></div></div><div class="st-e"><h5>English</h5></div><div class="stfb"><button type="button" class="fbopen">&#9998; Suggest a correction</button></div>';
    card.querySelector('.st-id').textContent = d.r || '';
    card.querySelector('.tt').appendChild(document.createTextNode(d.t));
    card.querySelector('.gg').appendChild(document.createTextNode(d.g || ''));
    card.querySelector('.st-e').appendChild(document.createTextNode(d.e));
    card.querySelector('.fbopen').addEventListener('click', function(){ openFeedback(card, d); });
    /* r1.032 · operator: the card must sit UNDER the selected sentence, not after its
       whole paragraph — a paragraph holds several sentences, so host-after dropped the
       card 2-3 sentences below the one picked. Insert right after the span itself; a
       block card created via the DOM renders on its own line directly beneath the
       highlighted sentence, inside whatever holds it (p, li, h2, motto). */
    s.insertAdjacentElement('afterend', card);
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
