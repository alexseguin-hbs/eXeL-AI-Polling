// exec-summary-build.mjs <lang> — build a per-language Executive Summary from the
// English template + docs/i18n/exec-summary.<lang>.json (token -> translated text).
// A key missing from the language file falls back to English (never a blank/{{token}}).
// Writes frontend/public/whitepaper/vision-2525-executive-summary.<lang>.html
// Run: node scripts/exec-summary-build.mjs fr
import fs from 'fs';
import crypto from 'crypto';
import { annotate, chrome } from './exec-summary-reading.mjs';
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

   r1.002 · CORRECTED SOURCE. This first read the LIVING DOCUMENT's release counter,
   so the summary printed v.19 r1.006 — a number that moves whenever the DOCUMENT
   changes and tells a reader nothing about the text in front of them. Derived rather
   than typed was right; derived from the right thing was not. The summary versions
   ITSELF now, from its own append-only release record: r1.001 was the first edition,
   r1.002 is the operator's final approved text. */
const RELREC = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.release.json', 'utf8'));
const REL = RELREC.release;
const VER = RELREC.version;
if (!/^r\d+\.\d{3}$/.test(REL)) { console.error('release record holds a malformed release:', REL); process.exit(1); }
if (RELREC.editions[RELREC.editions.length - 1].r !== REL) {
  console.error('release record disagrees with itself: release is', REL, 'but the last edition is', RELREC.editions[RELREC.editions.length - 1].r);
  process.exit(1);
}

/* The hash a reader can check against the text they are holding. Computed from the
   bytes actually being built, then asserted against the recorded freeze — if those
   two ever disagree, the canonical source moved without the freeze being renewed,
   which is the one thing the freeze exists to catch. */
const SHA = crypto.createHash('sha256').update(EN_RAW, 'utf8').digest('hex');
const FROZEN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sentences.json', 'utf8')).sha256;
const EDITION_SHA = (RELREC.editions.find(e => e.r === REL) || {}).sha256;
if (EDITION_SHA && EDITION_SHA !== SHA) {
  console.error('RELEASE RECORD DRIFT — edition ' + REL + ' names a different source than the one being built.');
  console.error('  building ' + SHA);
  console.error('  edition  ' + EDITION_SHA);
  process.exit(1);
}
if (SHA !== FROZEN) {
  console.error('CANONICAL SOURCE DRIFT — exec-summary.en.json no longer hashes to the recorded freeze.');
  console.error('  built  ' + SHA);
  console.error('  frozen ' + FROZEN);
  console.error('Re-run scripts/exec-summary-freeze.mjs --write to re-freeze, or restore the source.');
  process.exit(1);
}

const RTL = new Set(['ar', 'he', 'ur', 'fa']);
let h = TPL;
let translated = 0, fallback = 0;
/* k00 is the <title> (browser tab) and k70 the seal image's alt — plain-text slots
   where reading markup cannot live, so a pronunciation reader skips them. */
const PLAIN = new Set(['k00', 'k70']);
for (const key of Object.keys(EN)) {
  const val = (L[key] != null && String(L[key]).trim() !== '') ? L[key] : (fallback++, EN[key]);
  if (L[key] != null && String(L[key]).trim() !== '') translated++;
  /* For a reading language (e.g. zh → pinyin) wrap the readable script in <ruby>;
     a no-op for every other language, so their pages build byte-identical. */
  h = h.split('{{' + key + '}}').join(annotate(lang, key, val, PLAIN));
}
/* REL and SHA are deliberately NOT kNN keys — they never enter a translation file,
   so they cannot drift per language and no translator is ever asked to render them. */
h = h.split('{{REL}}').join(REL).split('{{VER}}').join(VER).split('{{SHA}}').join(SHA).split('{{DLHREF}}').join('download/' + (lang === 'en' ? 'vision-2525-executive-summary.html' : `vision-2525-executive-summary.${lang}.html`));

// <html lang=en> -> <html lang=xx [dir=rtl]>
h = h.replace('<html lang=en>', `<html lang=${lang}${RTL.has(lang) ? ' dir=rtl' : ''}>`);

/* Reading chrome (pinyin toggle for zh, and any future reader) — no-op otherwise. */
h = chrome(h, lang);

/* en is the base page, not a sibling — writing it directly removes the rename
   step every caller used to need (and once forgot). */
const BASE = lang === 'en'
  ? 'vision-2525-executive-summary.html'
  : `vision-2525-executive-summary.${lang}.html`;
const OUT = `frontend/public/whitepaper/${BASE}`;
fs.writeFileSync(OUT, h);
/* exec r1.007 · the download twin. Same bytes at /whitepaper/download/<same name>,
   which _headers serves with Content-Disposition: attachment — the one mechanism
   every browser honours (the HTML download attribute is unreliable on iOS Safari,
   which is where the operator reads). Byte-identical by construction: one string,
   two writes. */
fs.mkdirSync('frontend/public/whitepaper/download', { recursive: true });
fs.writeFileSync(`frontend/public/whitepaper/download/${BASE}`, h);
/* Guard: no unresolved token may remain — ANY token, not just kNN. The old pattern
   matched only /\{\{k\d\d\}\}/, so a stray {{REL}} would have shipped in silence. */
const leftover = (h.match(/\{\{[A-Za-z0-9_]+\}\}/g) || []);
console.log(`${lang}: ${translated}/${Object.keys(EN).length} translated, ${fallback} EN-fallback, ${REL} -> ${OUT}`);
if (leftover.length) { console.error('UNRESOLVED TOKENS:', leftover.join(' ')); process.exit(1); }
