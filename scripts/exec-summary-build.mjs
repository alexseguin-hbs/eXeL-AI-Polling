// exec-summary-build.mjs <lang> — build a per-language Executive Summary from the
// English template + docs/i18n/exec-summary.<lang>.json (token -> translated text).
// A key missing from the language file falls back to English (never a blank/{{token}}).
// Writes frontend/public/whitepaper/vision-2525-executive-summary.<lang>.html
// Run: node scripts/exec-summary-build.mjs fr
import fs from 'fs';
import crypto from 'crypto';
const lang = process.argv[2];
if (!lang) { console.error('usage: exec-summary-build.mjs <lang>'); process.exit(1); }

const TPL = fs.readFileSync('docs/i18n/exec-summary.template.html', 'utf8');
const EN_RAW = fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8');
const EN  = JSON.parse(EN_RAW);
const LP  = `docs/i18n/exec-summary.${lang}.json`;
if (!fs.existsSync(LP)) { console.error('missing', LP); process.exit(1); }
const L = JSON.parse(fs.readFileSync(LP, 'utf8'));

/* ── r279 · the summary states which release it is ────────────────────────────
   Operator: "everything from here on out with executive summary starts on Version
   19 and gets added to revision 1.001 and higher. 273 = 1.001."

   The label is DERIVED, never typed. It is read from the living document's own
   machine stamp and formatted by the same rule relLabel() uses there, so a summary
   page cannot claim a release the document is not on. A typed number is precisely
   how "Release 277" survived thirty-two releases without anyone noticing. */
const R1_ORIGIN = 273;
const relLabel = n => n >= R1_ORIGIN
  ? 'r1.' + String(n - R1_ORIGIN + 1).padStart(3, '0')
  : 'r0.' + String(n).padStart(3, '0');

const DOC = fs.readFileSync('docs/SOI_VISION2525_LIVING_DOCUMENT.html', 'utf8');
const relMatch = DOC.match(/<span id="dlrel2">(\d+)<\/span>/);
if (!relMatch) { console.error('cannot read the release stamp (#dlrel2) from the living document'); process.exit(1); }
const REL = relLabel(parseInt(relMatch[1], 10));

/* The hash a reader can check against the text they are holding. Computed from the
   bytes actually being built, then asserted against the recorded freeze — if those
   two ever disagree, the canonical source moved without the freeze being renewed,
   which is the one thing the freeze exists to catch. */
const SHA = crypto.createHash('sha256').update(EN_RAW, 'utf8').digest('hex');
const FROZEN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sentences.json', 'utf8')).sha256;
if (SHA !== FROZEN) {
  console.error('CANONICAL SOURCE DRIFT — exec-summary.en.json no longer hashes to the recorded freeze.');
  console.error('  built  ' + SHA);
  console.error('  frozen ' + FROZEN);
  console.error('Re-run scripts/exec-summary-canonicalize.mjs to re-freeze, or restore the source.');
  process.exit(1);
}

const RTL = new Set(['ar', 'he', 'ur', 'fa']);
let h = TPL;
let translated = 0, fallback = 0;
for (const key of Object.keys(EN)) {
  const val = (L[key] != null && String(L[key]).trim() !== '') ? L[key] : (fallback++, EN[key]);
  if (L[key] != null && String(L[key]).trim() !== '') translated++;
  h = h.split('{{' + key + '}}').join(val);
}
/* REL and SHA are deliberately NOT kNN keys — they never enter a translation file,
   so they cannot drift per language and no translator is ever asked to render them. */
h = h.split('{{REL}}').join(REL).split('{{SHA}}').join(SHA);

// <html lang=en> -> <html lang=xx [dir=rtl]>
h = h.replace('<html lang=en>', `<html lang=${lang}${RTL.has(lang) ? ' dir=rtl' : ''}>`);

const OUT = `frontend/public/whitepaper/vision-2525-executive-summary.${lang}.html`;
fs.writeFileSync(OUT, h);
/* Guard: no unresolved token may remain — ANY token, not just kNN. The old pattern
   matched only /\{\{k\d\d\}\}/, so a stray {{REL}} would have shipped in silence. */
const leftover = (h.match(/\{\{[A-Za-z0-9_]+\}\}/g) || []);
console.log(`${lang}: ${translated}/${Object.keys(EN).length} translated, ${fallback} EN-fallback, ${REL} -> ${OUT}`);
if (leftover.length) { console.error('UNRESOLVED TOKENS:', leftover.join(' ')); process.exit(1); }
