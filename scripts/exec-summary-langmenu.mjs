// exec-summary-langmenu.mjs — give the Executive Summary its own language globe.
//
// Operator: "I want Cuneiform for Executive Summary to show on that language drop
// down. Lets say we are on english and download 7Mb english file, under executive
// summary we see globe ... but if one is in french and downloads 7mb file, they see
// executive summary in settings and access globe."
//
// So the control belongs to the summary itself and ships in EVERY language's copy.
// The pattern is lifted wholesale from the living document's own globe
// (V2525_LANGS / v2525LangHref, SOI_VISION2525_LIVING_DOCUMENT.html) rather than
// reinvented — same registry, same localStorage key, same relative resolution so a
// folder of downloaded siblings works offline with no server.
//
// Run: node scripts/exec-summary-langmenu.mjs [--write]
import fs from 'fs';

const TPL   = 'docs/i18n/exec-summary.template.html';
const WRITE = process.argv.includes('--write');

// One source of truth, mirrored from the living document's registry.
const LANGS = [
  ['en','English','English'],['fr','Français','French'],['es','Español','Spanish'],['de','Deutsch','German'],
  ['it','Italiano','Italian'],['pt','Português','Portuguese'],['nl','Nederlands','Dutch'],['ru','Русский','Russian'],
  ['zh','中文','Chinese'],['ja','日本語','Japanese'],['ko','한국어','Korean'],['ar','العربية','Arabic'],
  ['hi','हिन्दी','Hindi'],['bn','বাংলা','Bengali'],['pa','ਪੰਜਾਬੀ','Punjabi'],['th','ไทย','Thai'],
  ['vi','Tiếng Việt','Vietnamese'],['id','Bahasa Indonesia','Indonesian'],['ms','Bahasa Melayu','Malay'],['tl','Filipino','Filipino'],
  ['tr','Türkçe','Turkish'],['pl','Polski','Polish'],['uk','Українська','Ukrainian'],['ro','Română','Romanian'],
  ['el','Ελληνικά','Greek'],['cs','Čeština','Czech'],['sv','Svenska','Swedish'],['da','Dansk','Danish'],
  ['fi','Suomi','Finnish'],['no','Norsk','Norwegian'],['he','עברית','Hebrew'],['sw','Kiswahili','Swahili'],['ne','नेपाली','Nepali'],
];

// Which per-language siblings actually exist on disk. Measured, not asserted — a
// menu that promises a file the reader cannot open is worse than one that says "soon".
const built = new Set(
  fs.readdirSync('frontend/public/whitepaper')
    .map(f => /^vision-2525-executive-summary(?:\.([a-z]{2}))?\.html$/.exec(f))
    .filter(Boolean)
    .map(m => m[1] || 'en')
);

// Sumerian sits 34th, directly beneath English, exactly where the operator placed it.
// It is deliberately NOT marked ready. The cuneiform edition supplied so far is
// English respelled syllable by syllable (ki-bi-li-za-ti-u-na = "civilization"), not
// Sumerian, and shipping that as Sumerian would misrepresent the language it means to
// honour. The slot exists; it fills when the EN.SAG.KI composition is real.
const SUX = { c:'sux', n:'𒅴𒂠', e:'Sumerian · cuneiform', note:'in preparation' };

const globe =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/></svg>';

const CSS = `
/* r276 · the Executive Summary's own language globe. Fixed to the corner so it is
   reachable from any page of the thirteen without scrolling back to the masthead. */
.langwrap{position:fixed;top:.9rem;right:.9rem;z-index:40}
.langwrap>button{display:flex;align-items:center;gap:.4rem;background:var(--raise);color:var(--ink);
  border:1px solid var(--line);border-radius:999px;padding:.5rem .8rem;cursor:pointer;font:inherit;
  font-size:.82rem;font-family:"IBM Plex Mono",monospace;letter-spacing:.06em}
.langwrap>button:hover{border-color:var(--accent);color:var(--accent)}
.langwrap>button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
#langMenu{position:absolute;top:calc(100% + .5rem);right:0;width:min(19rem,calc(100vw - 1.8rem));
  max-height:min(30rem,70vh);overflow-y:auto;background:var(--raise);border:1px solid var(--line);
  border-radius:14px;padding:.5rem;box-shadow:0 18px 40px rgba(0,0,0,.18)}
#langMenu h5{font-family:"IBM Plex Mono",monospace;font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;
  color:var(--faint);margin:.5rem .6rem .35rem;font-weight:500}
#langMenu button{display:flex;align-items:baseline;gap:.5rem;width:100%;text-align:left;background:none;border:0;
  color:var(--ink);font:inherit;font-size:.92rem;padding:.42rem .6rem;border-radius:8px;cursor:pointer}
#langMenu button:hover:not([disabled]){background:var(--paper);color:var(--accent)}
#langMenu button[disabled]{color:var(--faint);cursor:default}
#langMenu button[aria-current=true]{color:var(--accent);font-weight:600}
#langMenu .lc{font-family:"IBM Plex Mono",monospace;font-size:.72rem;letter-spacing:.1em;color:var(--faint);min-width:2.1rem}
#langMenu .le{color:var(--faint);font-size:.82rem}
#langMenu .soon{margin-left:auto;font-family:"IBM Plex Mono",monospace;font-size:.62rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--faint)}
#langMenu .sux-note{margin:.15rem .6rem .5rem;font-size:.76rem;line-height:1.45;color:var(--faint)}
@media print{.langwrap{display:none}}
`;

const CONTROL =
  '<div class="langwrap"><button id="bLang" aria-expanded="false" aria-haspopup="menu" ' +
  'title="Language — read this summary in another tongue" aria-label="Language">' +
  globe + '<span id="bLangCode">EN</span></button>' +
  '<div id="langMenu" role="menu" hidden></div></div>';

const JS = `
<script>
/* r276 · lifted from the living document's globe so the two can never diverge:
   the same registry, the same localStorage key, and href resolution relative to
   whatever directory this copy was opened from — a downloaded folder of siblings
   works offline with no server. */
(function(){
  var LANGS = ${JSON.stringify(LANGS.map(([c,n,e]) => ({c,n,e})))};
  var BUILT = ${JSON.stringify([...built].sort())};
  var SUX   = ${JSON.stringify(SUX)};
  var KEY   = "exel-active-locale";
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); };
  function cur(){
    var m = location.pathname.match(/vision-2525-executive-summary(?:\\.([a-z]{2,3}))?\\.html$/i);
    return (m && m[1]) ? m[1].toLowerCase() : "en";
  }
  function href(code){
    var dir = location.pathname.replace(/[^/]*$/, "");
    return dir + "vision-2525-executive-summary" + (code === "en" ? "" : "." + code) + ".html";
  }
  var btn = document.getElementById("bLang");
  var menu = document.getElementById("langMenu");
  var codeEl = document.getElementById("bLangCode");
  if (!btn || !menu) return;
  codeEl.textContent = cur().toUpperCase();
  function row(l, ready, note){
    return '<button role="menuitem" data-lang="' + l.c + '"' + (ready ? '' : ' disabled') +
      (l.c === cur() ? ' aria-current="true"' : '') + '>' +
      '<span class="lc">' + esc(l.c.toUpperCase()) + '</span>' + esc(l.n) +
      (l.e ? ' <span class="le">(' + esc(l.e) + ')</span>' : '') +
      (ready ? '' : '<span class="soon">' + esc(note || 'soon') + '</span>') + '</button>';
  }
  function render(){
    var en = LANGS[0], rest = LANGS.slice(1);
    menu.innerHTML = '<h5>Language</h5>' +
      row(en, BUILT.indexOf("en") >= 0) +
      row(SUX, false, SUX.note) +
      '<p class="sux-note">The Sumerian edition is being composed from the frozen English, sentence by sentence. It is not published until the cuneiform is Sumerian rather than English written in Sumerian signs.</p>' +
      rest.map(function(l){ return row(l, BUILT.indexOf(l.c) >= 0); }).join("");
  }
  function close(){ menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function(e){
    e.stopPropagation();
    if (!menu.hidden){ close(); return; }
    render(); menu.hidden = false; btn.setAttribute("aria-expanded", "true");
  });
  menu.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b || b.disabled) return;
    var code = b.getAttribute("data-lang"); if (!code) return;
    try { localStorage.setItem(KEY, code); } catch(_){ /* storage blocked — still navigate */ }
    if (code === cur()){ close(); return; }
    location.assign(href(code));
  });
  document.addEventListener("click", function(e){ if (!e.target.closest(".langwrap")) close(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });
})();
</script>
`;

let t = fs.readFileSync(TPL, 'utf8');
if (t.includes('id="bLang"')) { console.log('language globe already present — nothing to do'); process.exit(0); }

const once = (needle, replacement, what) => {
  const n = t.split(needle).length - 1;
  if (n !== 1) { console.error(`ANCHOR "${what}" matched ${n} times — refusing to write.`); process.exit(1); }
  t = t.replace(needle, replacement);
};
once('</style>', CSS + '</style>', 'stylesheet');
once('<body>\n<header class=mast>', '<body>\n' + CONTROL + '\n<header class=mast>', 'control');
once('\n</body></html>', '\n' + JS + '</body></html>', 'script');

console.log(`languages: ${LANGS.length} in registry, ${built.size} built (${[...built].sort().join(' ')})`);
console.log(`not yet built: ${LANGS.map(l => l[0]).filter(c => !built.has(c)).join(' ') || 'none'}`);
console.log(`Sumerian slot: present, pinned 34th beneath English, marked "${SUX.note}"`);
if (!WRITE) { console.log('\n(dry run — pass --write to apply)'); process.exit(0); }
fs.writeFileSync(TPL, t);
console.log(`\nwrote ${TPL} (+${(t.length / 1024).toFixed(1)} KB total)`);
