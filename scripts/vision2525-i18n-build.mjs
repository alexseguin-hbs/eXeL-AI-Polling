// Vision 2525 — per-language build (v19). Deterministic, engine-preserving.
//
// Produces SOI_VISION2525_v.18_<lang>.html from:
//   - the English source doc (the canonical engine + ledger)
//   - docs/i18n/vision2525.<lang>.json  { blockId: translatedHtml }
//
// MECHANISM: a fixed per-language map I18N_MAP is injected right after replay() is
// defined, and replay is re-wrapped to overlay I18N_MAP[id] onto each winner's html.
// It is a FIXED map (no live MT), so "same v, same order -> same bytes" still holds
// per language, and every EN block id that has no translation falls back to English
// (never blank). English is built by pass-through (no injection) and MUST reproduce
// the source byte-for-byte — the build's own safety proof.
//
// Run:  node scripts/vision2525-i18n-build.mjs <lang>
//   (resolves nothing external; pure string transform. lang=en => identity check.)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = '/home/user/eXeL-AI-Polling';
const SRC = `${ROOT}/docs/SOI_VISION2525_LIVING_DOCUMENT.html`;
const lang = (process.argv[2] || '').trim();
if (!lang) { console.error('usage: vision2525-i18n-build.mjs <lang>'); process.exit(2); }

const src = readFileSync(SRC, 'utf8');

// The injection anchor: the last three lines of replay() (unique — REPLAY_CACHE.set
// appears only here). We insert the overlay immediately after, before init() renders.
const ANCHOR = '  if (!fresh) REPLAY_CACHE.set(key, out);\n  return out;\n}';
if (src.split(ANCHOR).length !== 2) {
  console.error('FATAL: replay anchor not found exactly once — engine changed; update the anchor.');
  process.exit(1);
}

if (lang === 'en') {
  // Identity: English is the canonical file. Building "en" must equal the source.
  const out = `${ROOT}/docs/i18n/build/SOI_VISION2525_v.18_en.html`;
  writeFileSync(out, src);
  console.log(`en identity build: ${src.length} bytes (must equal source)`);
  process.exit(0);
}

const mapPath = `${ROOT}/docs/i18n/vision2525.${lang}.json`;
if (!existsSync(mapPath)) { console.error(`no translation map: ${mapPath}`); process.exit(1); }
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const en = JSON.parse(readFileSync(`${ROOT}/docs/i18n/vision2525.en.json`, 'utf8'));

// coverage: how many EN ids are translated vs fall back
const enIds = Object.keys(en);
const have = enIds.filter((id) => typeof map[id] === 'string' && map[id].length);
const fallback = enIds.filter((id) => !have.includes(id));

// Safe JSON-in-<script>: JSON is not a subset of JS. U+2028/U+2029 are legal in JSON
// strings but are line terminators in a JS string literal, and a literal "</script>"
// (or any "<") in a translation would end the inline script. Escape all three so the
// injected map can never break the page. The browser decodes < back to "<" at parse
// time, so innerHTML still renders real tags. Deterministic (pure string transform).
const safeJson = (o) => JSON.stringify(o)
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');
const overlay =
  ANCHOR + '\n' +
  '/* v19 i18n overlay (' + lang + ') — fixed per-language map over the English winners.\n' +
  '   Deterministic: no clock, no MT; missing id -> English fallback. */\n' +
  'const I18N_MAP = ' + safeJson(map) + ';\n' +
  '(function(){ var __raw = replay; replay = function(v, order, fresh){\n' +
  '  return __raw(v, order, fresh).map(function(e){\n' +
  '    return (I18N_MAP[e.id] != null) ? Object.assign({}, e, { html: I18N_MAP[e.id] }) : e;\n' +
  '  }); }; })();';

// Replacement FUNCTION, not string: a string replacement interprets $&, $`, $', $$
// as patterns, and a translated block containing "$&" (e.g. "100 000&nbsp;$&nbsp;/mois")
// would splice the matched anchor into the map and break the inline JS. A function
// replacement is inserted verbatim.
let out = src.replace(ANCHOR, () => overlay);

// Chrome overlay (masthead, deck labels, settings headings) from an ANCHORED per-language map.
// docs/i18n/chrome/<lang>.json = [ [anchorString, translatedString], ... ] — each anchor is a
// distinctive English chrome substring (with enough surrounding markup to be unique) and is
// replaced by its translation. Applied as exact, unique string replacements so a chrome phrase
// that also appears in body prose is never touched (anchors carry their own tags/ids).
const chromePath = `${ROOT}/docs/i18n/chrome/${lang}.json`;
let chromeApplied = 0, chromeMissed = 0;
if (existsSync(chromePath)) {
  const pairs = JSON.parse(readFileSync(chromePath, 'utf8'));
  for (const [anchor, translated] of pairs) {
    if (out.split(anchor).length === 2) { out = out.replace(anchor, () => translated); chromeApplied++; }
    else chromeMissed++;
  }
}

// <html lang> (and dir for RTL) so screen readers, browsers, and hyphenation know the language.
const rtl = (lang === 'ar' || lang === 'he');
out = out.replace('<html', '<html lang="' + lang + '"' + (rtl ? ' dir="rtl"' : ''));

// A language page must DOWNLOAD ITSELF (operator 2026-08-20: the download includes only
// the selected language, and any of the 33 downloads). Repoint the download anchors from
// the English attachment to this language's own reading copy — same-origin `download`
// attribute forces the save, and the saved name is language-stamped.
if (lang !== 'en') {
  const enAnchor = 'whitepaper/SOI_VISION2525_v.18_LIVING_DOCUMENT.html" download="SOI_VISION2525_v.18_LIVING_DOCUMENT.html"';
  const langAnchor = `whitepaper/vision-2525.${lang}.html" download="SOI_VISION2525_v.18_${lang}.html"`;
  const n = out.split(enAnchor).length - 1;
  out = out.split(enAnchor).join(langAnchor);
  console.log(`  download anchors repointed to ${lang}: ${n}`);
}

const dest = `${ROOT}/docs/i18n/build/SOI_VISION2525_v.18_${lang}.html`;
writeFileSync(dest, out);
console.log(`built ${lang}: ${out.length} bytes | translated ${have.length}/${enIds.length} blocks | fallback ${fallback.length} | chrome ${chromeApplied} applied${chromeMissed ? ', ' + chromeMissed + ' anchors missed' : ''}`);
if (fallback.length) console.log('  EN-fallback ids:', fallback.slice(0, 12).join(', ') + (fallback.length > 12 ? ' …' : ''));
