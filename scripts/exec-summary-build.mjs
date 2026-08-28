// exec-summary-build.mjs <lang> — build a per-language Executive Summary from the
// English template + docs/i18n/exec-summary.<lang>.json (token -> translated text).
// A key missing from the language file falls back to English (never a blank/{{token}}).
// Writes frontend/public/whitepaper/vision-2525-executive-summary.<lang>.html
// Run: node scripts/exec-summary-build.mjs fr
import fs from 'fs';
const lang = process.argv[2];
if (!lang) { console.error('usage: exec-summary-build.mjs <lang>'); process.exit(1); }

const TPL = fs.readFileSync('docs/i18n/exec-summary.template.html', 'utf8');
const EN  = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8'));
const LP  = `docs/i18n/exec-summary.${lang}.json`;
if (!fs.existsSync(LP)) { console.error('missing', LP); process.exit(1); }
const L = JSON.parse(fs.readFileSync(LP, 'utf8'));

const RTL = new Set(['ar', 'he', 'ur', 'fa']);
let h = TPL;
let translated = 0, fallback = 0;
for (const key of Object.keys(EN)) {
  const val = (L[key] != null && String(L[key]).trim() !== '') ? L[key] : (fallback++, EN[key]);
  if (L[key] != null && String(L[key]).trim() !== '') translated++;
  h = h.split('{{' + key + '}}').join(val);
}
// <html lang=en> -> <html lang=xx [dir=rtl]>
h = h.replace('<html lang=en>', `<html lang=${lang}${RTL.has(lang) ? ' dir=rtl' : ''}>`);

const OUT = `frontend/public/whitepaper/vision-2525-executive-summary.${lang}.html`;
fs.writeFileSync(OUT, h);
// Guard: no unresolved tokens may remain.
const leftover = (h.match(/\{\{k\d\d\}\}/g) || []);
console.log(`${lang}: ${translated}/${Object.keys(EN).length} translated, ${fallback} EN-fallback -> ${OUT}`);
if (leftover.length) { console.error('UNRESOLVED TOKENS:', leftover.join(' ')); process.exit(1); }
