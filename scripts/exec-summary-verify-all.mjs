// exec-summary-verify-all.mjs — one verdict over every translation on disk.
//
// Run after any batch of translations lands. For each docs/i18n/exec-summary.<xx>.json:
//   · 71 keys, in exactly the English key order, none empty
//   · verbatim terms survived untranslated (Vision • 2525, R-CORE, HI equation, ratios)
//   · the built page exists, carries the release stamp and the frozen source hash
// Exits non-zero if anything fails, so it can gate the commit.
import fs from 'fs';

const EN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8'));
const REL = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.release.json', 'utf8')).release;
const SHA12 = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sentences.json', 'utf8')).sha256.slice(0, 12);
const VERBATIM = ['Vision • 2525', 'R-CORE', 'HI earned = M × hours', '9,999', '360 → 33 → 11'];

const langs = fs.readdirSync('docs/i18n')
  .map(f => /^exec-summary\.([a-z]{2})\.json$/.exec(f)).filter(Boolean).map(m => m[1])
  .filter(l => l !== 'en').sort();

let bad = 0;
for (const l of langs) {
  const problems = [];
  let d;
  try { d = JSON.parse(fs.readFileSync(`docs/i18n/exec-summary.${l}.json`, 'utf8')); }
  catch (e) { console.log(`FAIL  ${l}  invalid JSON: ${e.message}`); bad++; continue; }
  if (Object.keys(d).length !== 71) problems.push(`${Object.keys(d).length} keys`);
  if (Object.keys(d).join() !== Object.keys(EN).join()) problems.push('key order drift');
  const empty = Object.entries(d).filter(([, v]) => !String(v).trim()).map(([k]) => k);
  if (empty.length) problems.push(`empty: ${empty.join(' ')}`);
  const blob = Object.values(d).join(' ');
  for (const t of VERBATIM) if (!blob.includes(t)) problems.push(`verbatim lost: ${t}`);
  const page = `frontend/public/whitepaper/vision-2525-executive-summary.${l}.html`;
  if (!fs.existsSync(page)) problems.push('page not built');
  else {
    const h = fs.readFileSync(page, 'utf8');
    if (!h.includes(`content="${REL}"`)) problems.push('release stamp missing');
    if (!h.includes(SHA12)) problems.push('source hash missing');
    if (/\{\{[A-Za-z0-9_]+\}\}/.test(h)) problems.push('unresolved token');
  }
  if (problems.length) { console.log(`FAIL  ${l}  ${problems.join(' · ')}`); bad++; }
  else console.log(`ok    ${l}`);
}
console.log(`\n${langs.length} language(s) checked, ${bad} failed` +
  (langs.length ? `` : ' — none on disk yet'));
process.exit(bad ? 1 : 0);
