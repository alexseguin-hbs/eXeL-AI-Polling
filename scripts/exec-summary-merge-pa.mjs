// exec-summary-merge-pa.mjs — join the two Punjabi halves into one language file.
//
// Punjabi is translated by two agents because one agent exceeds its output limit
// on the full 71 keys. Part 1 covers k00–k35 (and writes the shared glossary the
// second half translates against); part 2 covers k36–k70. This merge refuses on
// any gap, overlap, or ordering drift, so a half-finished Punjabi can never ship.
import fs from 'fs';

const EN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8'));
const p1 = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.pa.part1.json', 'utf8'));
const p2 = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.pa.part2.json', 'utf8'));

const problems = [];
const k1 = Object.keys(p1), k2 = Object.keys(p2);
if (k1[0] !== 'k00' || k1[k1.length - 1] !== 'k35' || k1.length !== 36)
  problems.push(`part1 range ${k1[0]}–${k1[k1.length - 1]} (${k1.length})`);
if (k2[0] !== 'k36' || k2[k2.length - 1] !== 'k70' || k2.length !== 35)
  problems.push(`part2 range ${k2[0]}–${k2[k2.length - 1]} (${k2.length})`);
const overlap = k1.filter(k => k in p2);
if (overlap.length) problems.push(`overlap: ${overlap.join(' ')}`);

const merged = {};
for (const k of Object.keys(EN)) {
  const v = k in p1 ? p1[k] : p2[k];
  if (v === undefined || !String(v).trim()) problems.push(`${k} missing/empty`);
  merged[k] = v;
}
if (problems.length) { console.error('REFUSING TO MERGE:\n  ' + problems.join('\n  ')); process.exit(1); }

fs.writeFileSync('docs/i18n/exec-summary.pa.json',
  JSON.stringify(merged, null, 2) + '\n');
fs.unlinkSync('docs/i18n/exec-summary.pa.part1.json');
fs.unlinkSync('docs/i18n/exec-summary.pa.part2.json');
console.log('merged 36 + 35 -> docs/i18n/exec-summary.pa.json (71 keys, part files removed)');
