// exec-summary-merge-sum.mjs — fold the three body part files into the SUM master.
//
// The spine (k01–k16, k56–k70) was hand-composed and lives in
// docs/i18n/exec-summary.sum.json already. The body arrives as three agent
// part files (k17–k29, k30–k42, k43–k55). This merge refuses on any gap,
// overlap, malformed record, English-concatenation drift, or transliteration
// token outside the sign map — so a half-done or undisciplined body can never
// reach the builder. Part files are deleted on success.
import fs from 'fs';

const MASTER = 'docs/i18n/exec-summary.sum.json';
const EN = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8'));
const SIGN = JSON.parse(fs.readFileSync('docs/i18n/sum/signmap.json', 'utf8'));
const sum = JSON.parse(fs.readFileSync(MASTER, 'utf8'));

const parts = [1, 2, 3].map(n => `docs/i18n/sum/exec-summary.sum.part${n}.json`);
const ranges = [[17, 29], [30, 42], [43, 55]];
const problems = [];

const tokensOk = (t, where) => {
  const stripped = t.replace(/⟦[^⟧]*⟧/g, ' ');
  for (const word of stripped.split(/[\s•]+/).filter(Boolean)) {
    for (const tok of word.split('-').filter(Boolean)) {
      if (!(tok in SIGN)) problems.push(`${where}: reading "${tok}" not in signmap (word "${word}")`);
    }
  }
};

for (let p = 0; p < 3; p++) {
  if (!fs.existsSync(parts[p])) { problems.push(`missing ${parts[p]}`); continue; }
  let d;
  try { d = JSON.parse(fs.readFileSync(parts[p], 'utf8')); }
  catch (e) { problems.push(`${parts[p]}: invalid JSON — ${e.message}`); continue; }
  const want = [];
  for (let i = ranges[p][0]; i <= ranges[p][1]; i++) want.push('k' + i);
  for (const k of want) {
    const arr = d[k];
    if (!Array.isArray(arr) || !arr.length) { problems.push(`${parts[p]}: ${k} missing/empty`); continue; }
    for (const [i, r] of arr.entries()) {
      if (!r || typeof r.e !== 'string' || typeof r.t !== 'string' || typeof r.g !== 'string' ||
          !r.e.trim() || !r.t.trim() || !r.g.trim()) { problems.push(`${k}[${i}]: malformed record`); continue; }
      tokensOk(r.t, `${k}[${i}]`);
    }
    const joined = arr.map(r => r.e).join(' ').replace(/\s+/g, ' ').trim();
    const master = String(EN[k]).replace(/\s+/g, ' ').trim();
    if (joined !== master) problems.push(`${k}: English sentences do not reproduce the master (${joined.length} vs ${master.length} chars)`);
  }
  const extra = Object.keys(d).filter(k => !want.includes(k));
  if (extra.length) problems.push(`${parts[p]}: unexpected keys ${extra.join(' ')}`);
  Object.assign(sum, Object.fromEntries(want.filter(k => d[k]).map(k => [k, d[k]])));
}

if (problems.length) {
  console.error(`REFUSING TO MERGE — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 40)) console.error('  ' + p);
  process.exit(1);
}

/* order keys k01..k70 for a stable file */
const ordered = {};
if (sum._method) ordered._method = sum._method;
for (let i = 1; i <= 70; i++) if (sum['k' + i.toString().padStart(2, '0')]) {
  const k = 'k' + i.toString().padStart(2, '0'); ordered[k] = sum[k];
}
fs.writeFileSync(MASTER, JSON.stringify(ordered, null, 2) + '\n');
for (const p of parts) fs.unlinkSync(p);
const total = Object.keys(ordered).filter(k => k !== '_method').length;
const sentences = Object.values(ordered).filter(Array.isArray).reduce((n, a) => n + a.length, 0);
console.log(`merged — ${total} keys, ${sentences} sentence records, part files removed`);
