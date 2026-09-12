// gen-pod-rates.mjs — regenerate the REGION_RATES array in lib/pod-rates.ts from the operator's table plus the rows he
// approved. The record is DATA, transcribed once from files he can check; nothing in the array is typed by hand.
//
//   sources (in order, never edited here):
//     docs/asks/2026-09-10_minimum_wage_rate_table.psv          — the operator's 114 rows (8 columns)
//     docs/asks/2026-09-11_minimum_wage_rate_table_approved.psv — rows he approved under Rule B (8 columns + provenance)
//
//   node scripts/gen-pod-rates.mjs
import fs from 'fs';
import path from 'path';
const ROOT = path.resolve(process.cwd(), '..');
const SOURCES = [
  ['operator-2026-09-10', path.join(ROOT, 'docs/asks/2026-09-10_minimum_wage_rate_table.psv')],
  ['approved-2026-09-11', path.join(ROOT, 'docs/asks/2026-09-11_minimum_wage_rate_table_approved.psv')],
];
const TARGET = path.join(process.cwd(), 'lib/pod-rates.ts');
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const lines = []; const counts = {};
for (const [tag, file] of SOURCES) {
  if (!fs.existsSync(file)) { counts[tag] = 0; continue; }
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => l.split('|'));
  const body = rows[0][0] === 'Language' ? rows.slice(1) : rows;            // the approved file carries a header
  counts[tag] = body.length;
  for (const r of body) {
    const [lang, cc, name, cur, rate, pub, nosingle, notes] = r;
    if (!/^[A-Z]{2}$/.test(cc) || !/^[A-Z]{3}$/.test(cur) || !(rate === 'NULL' || Number(rate) > 0) || !['Yes', 'No'].includes(pub) || !['Yes', 'No'].includes(nosingle)) {
      console.error(`REFUSED — malformed row in ${tag}: ${r.join('|').slice(0, 90)}`); process.exit(1);
    }
    lines.push(`  { lang: "${esc(lang)}", cc: "${cc}", name: "${esc(name)}", currency: "${cur}", rate: ${rate === 'NULL' ? 'null' : rate}, published: ${pub === 'Yes'}, noSingleRate: ${nosingle === 'Yes'}, note: "${esc(notes)}"${tag === 'approved-2026-09-11' ? ', approved: "2026-09-11"' : ''} },`);
  }
}
let src = fs.readFileSync(TARGET, 'utf8');
const start = src.indexOf('export const REGION_RATES: RegionRate[] = [');
const end = src.indexOf('\n]', start) + 2;
if (start < 0 || end < 2) { console.error('REGION_RATES block not found'); process.exit(1); }
src = src.slice(0, start) + 'export const REGION_RATES: RegionRate[] = [\n' + lines.join('\n') + '\n]' + src.slice(end);
fs.writeFileSync(TARGET, src);
console.log(`REGION_RATES regenerated: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' + ')} = ${lines.length} rows`);
