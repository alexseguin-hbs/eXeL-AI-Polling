// exec-summary-reading.mjs — build-time pronunciation readings for the standalone
// Executive Summary editions, the Divinity Guide's pinyin-over-hanzi pattern rendered
// as STATIC <ruby> (no client library) with a toggle in the page chrome.
//
// Operator: "use Pin Ying [pinyin] icon and reader from divinity guides to add when
// clicked on Chinese similar to Divinity Guide. Then check if other asian symbolic
// languages like Japan and Korean have an equivalent. If so, add this capability."
//
// Chinese (zh) → pinyin via pinyin-pro is IMPLEMENTED. The module is shaped so a
// reader for another language slots into READERS + one branch in annotate(); the
// assessment for Japanese/Korean is recorded in docs/i18n/READING_ASSESSMENT.md.
//
// Two calls from exec-summary-build.mjs, both no-ops for a language without a reader,
// so every non-reader edition builds byte-identical to before:
//   annotate(lang, key, value, PLAIN)  — wrap the readable script inside one value
//   chrome(html, lang)                 — inject the toggle button + CSS + script
import { createRequire } from 'module';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Which editions get a reading, and how the control reads. Add a row to extend.
export const READERS = {
  zh: { kind: 'pinyin',   glyph: '拼', label: 'Pinyin',
        tip: 'Pinyin — pronunciation above each character',
        // Latin letters with tone marks: a mono face keeps the diacritics even.
        rtFont: '600 .52em/1.1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace' },
  ja: { kind: 'furigana', glyph: 'ふ', label: 'Furigana',
        tip: 'Furigana — readings above the kanji',
        // Kana need a Japanese face, never a Latin mono one.
        rtFont: '500 .5em/1.15 "Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",Meiryo,sans-serif' },
};

// Han characters we annotate: CJK Unified (+ Ext A) and the compatibility block.
// All BMP, so Array.from() indexing aligns 1:1 with pinyin-pro's per-character array.
const CJK_RUN = /[㐀-䶿一-鿿豈-﫿]+/g;

let _pinyin = null;
function getPinyin() {
  if (_pinyin) return _pinyin;
  // pinyin-pro lives in the frontend workspace; resolve it from there.
  const require = createRequire(path.resolve('frontend') + '/package.json');
  _pinyin = require('pinyin-pro').pinyin;
  return _pinyin;
}

// Wrap every Han character in a run as <ruby>字<rt>reading</rt></ruby>. Only text
// OUTSIDE tags is touched — tags and HTML entities pass through untouched, so an
// embedded <em>/<strong>/<a> or &#8217; inside a translated string survives intact.
// Readings are computed per contiguous Han run so pinyin-pro's word segmentation
// picks the correct polyphone reading in context; a pure-Han run yields exactly one
// reading per character.
function annotatePinyin(value) {
  const pinyin = getPinyin();
  return String(value).split(/(<[^>]+>)/).map(seg => {
    if (seg.startsWith('<')) return seg;                       // a tag — leave it
    return seg.replace(CJK_RUN, run => {
      const rd = pinyin(run, { type: 'array', toneType: 'symbol' });
      return Array.from(run).map((ch, i) =>
        '<ruby>' + ch + '<rt>' + (rd[i] || '') + '</rt></ruby>').join('');
    });
  }).join('');
}

/* Japanese readings are PRE-GENERATED and committed (see exec-summary-furigana.mjs):
   a kanji's reading depends on the word it sits in, so it takes a dictionary rather
   than a per-character rule, and the result deserves review before it ships. The
   build only reads that committed file — and refuses it if it does not describe the
   Japanese text currently on disk, so a re-translation can never quietly ship the old
   readings over new words. */
let _furi = null;
function furiganaFor(key, value) {
  if (!_furi) {
    const CACHE = 'docs/i18n/exec-summary.ja.furigana.json';
    const SRC   = 'docs/i18n/exec-summary.ja.json';
    if (!fs.existsSync(CACHE)) {
      throw new Error(`furigana: ${CACHE} is missing — run: node scripts/exec-summary-furigana.mjs --write`);
    }
    const c   = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    const sha = crypto.createHash('sha256').update(fs.readFileSync(SRC, 'utf8'), 'utf8').digest('hex');
    if (c._source_sha256 !== sha) {
      throw new Error('furigana: the readings were generated from a different Japanese text.\n' +
        `  ja.json  ${sha.slice(0, 12)}\n  readings ${String(c._source_sha256).slice(0, 12)}\n` +
        '  Re-run: node scripts/exec-summary-furigana.mjs --write');
    }
    _furi = c.keys || {};
  }
  return _furi[key] != null ? _furi[key] : value;
}

// Annotate one token's value for a language, unless the token is a plain-text slot
// (a <title> or an alt="" attribute, where ruby markup cannot live).
export function annotate(lang, key, value, PLAIN) {
  const r = READERS[lang];
  if (!r) return value;
  if (PLAIN && PLAIN.has(key)) return value;
  if (r.kind === 'pinyin')   return annotatePinyin(value);
  if (r.kind === 'furigana') return furiganaFor(key, value);
  return value;
}

// The reading chrome: a toggle button beside the globe, the ruby CSS, and the tiny
// persist-and-toggle script. Reading is OFF by default (as the Divinity Guide is) and
// the choice is remembered per reader. Returns the html unchanged for a non-reader.
export function chrome(html, lang) {
  const r = READERS[lang];
  if (!r) return html;

  const CSS = `
/* r1.036 · reading (${lang}) — the Divinity Guide's pinyin-over-hanzi, as a toggle.
   Off by default; the ${r.glyph} control reveals the reading above every character. */
article ruby{ruby-position:over;-webkit-ruby-position:before}
article ruby rt{font:${r.rtFont};
  letter-spacing:.01em;color:var(--accent);text-transform:none;-webkit-user-select:none;user-select:none}
body:not(.showread) article ruby rt{display:none}
body.showread article p,body.showread article li,body.showread article .subt{line-height:2.5}
#bRead{display:inline-flex;align-items:center;justify-content:center;min-height:31px;box-sizing:border-box;
  font-size:15px;font-weight:700;padding:2px 9px;border:1px solid var(--line);background:var(--raise);
  color:var(--ink);border-radius:3px;cursor:pointer;line-height:1.4;margin-inline-end:6px}
#bRead[aria-pressed=true]{background:var(--accent-bg);color:var(--accent);border-color:var(--accent)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) #bRead{border-radius:9px}}
:root[data-theme=dark] #bRead{border-radius:9px}
`;
  const BTN = '<button id="bRead" aria-pressed="false" title="' + r.tip +
    '" aria-label="' + r.tip + '">' + r.glyph + '</button>';
  const JS = `
<script>
/* r1.036 · reading toggle — reveal ${r.label} above each character, remember the choice. */
(function(){
  var KEY = "exel-exec-read", b = document.getElementById("bRead");
  if (!b) return;
  function set(on){ document.body.classList.toggle("showread", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }
  var on = false; try { on = localStorage.getItem(KEY) === "1"; } catch(_){}
  set(on);
  b.addEventListener("click", function(){
    var n = !document.body.classList.contains("showread");
    set(n);
    try { localStorage.setItem(KEY, n ? "1" : "0"); } catch(_){}
  });
})();
</script>
`;
  let h = html;
  if (h.indexOf('</style>') === -1 || h.indexOf('<button id="bLang"') === -1 || h.indexOf('</body>') === -1) {
    throw new Error('reading chrome: an anchor is missing from the template — refusing to inject a broken control');
  }
  h = h.replace('</style>', CSS + '</style>');
  h = h.replace('<button id="bLang"', BTN + '<button id="bLang"');
  h = h.replace('</body>', JS + '</body>');
  return h;
}
