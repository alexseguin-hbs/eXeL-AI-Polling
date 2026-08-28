// exec-summary-verify-sum.mjs — the SUM edition's standing verify gate.
//
// Closes the gap three fleet cells independently found (Enlil-w2, Odin-w1, Krishna):
// the merge's checks ran once and died with the part files, the spine never passed
// them at all, and verify-all's two-letter glob structurally excludes 'sum' — so a
// scholar's correction, or a master re-freeze, could ship unverified. This gate is
// RE-RUNNABLE and covers all 70 keys, every time:
//   · every record is {e,t,g}, non-empty
//   · e-concatenation per key reproduces the CURRENT frozen master exactly
//     (catches stale Sumerian after a master re-freeze — the silent-failure point)
//   · every transliteration token outside ⟦…⟧ resolves in the sign table
//   · the built page exists, carries the current release + master-sha stamps,
//     has no unresolved {{tokens}}, and its download twin is byte-identical
// Exit non-zero on any failure. Run after ANY touch of exec-summary.sum.json,
// the sign table, the builder, or the master.
import fs from 'fs';
import crypto from 'crypto';

const EN_RAW = fs.readFileSync('docs/i18n/exec-summary.en.json', 'utf8');
const EN = JSON.parse(EN_RAW);
const SUM = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.sum.json', 'utf8'));
const SIGN = JSON.parse(fs.readFileSync('docs/i18n/sum/signmap.json', 'utf8'));
const REL = JSON.parse(fs.readFileSync('docs/i18n/exec-summary.release.json', 'utf8')).release;
const SHA12 = crypto.createHash('sha256').update(EN_RAW, 'utf8').digest('hex').slice(0, 12);

const problems = [];
let records = 0;

for (const k of Object.keys(EN)) {
  if (k === 'k00') continue;
  const arr = SUM[k];
  if (!Array.isArray(arr) || !arr.length) { problems.push(`${k}: missing/empty`); continue; }
  for (const [i, r] of arr.entries()) {
    records++;
    if (!r || typeof r.e !== 'string' || typeof r.t !== 'string' || typeof r.g !== 'string' ||
        !r.e.trim() || !r.t.trim() || !r.g.trim()) { problems.push(`${k}[${i}]: malformed record`); continue; }
    const stripped = r.t.replace(/⟦[^⟧]*⟧/g, ' ');
    for (const word of stripped.split(/[\s•—–;,:.!?]+/).filter(Boolean)) {
      for (const tok of word.split('-').filter(Boolean)) {
        if (!(tok in SIGN)) problems.push(`${k}[${i}]: reading "${tok}" not in signmap`);
      }
    }
  }
  const joined = arr.map(r => r.e).join(' ').replace(/\s+/g, ' ').trim();
  const master = String(EN[k]).replace(/\s+/g, ' ').trim();
  if (joined !== master) problems.push(`${k}: e-concatenation drifted from the CURRENT master (${joined.length} vs ${master.length} chars) — stale Sumerian after a re-freeze?`);
}

const SUMSHA = crypto.createHash('sha256')
  .update(fs.readFileSync('docs/i18n/exec-summary.sum.json'))
  .update(fs.readFileSync('docs/i18n/sum/signmap.json')).digest('hex').slice(0, 12);
const page = 'frontend/public/whitepaper/vision-2525-executive-summary.sum.html';
if (!fs.existsSync(page)) problems.push('page not built');
else {
  const h = fs.readFileSync(page, 'utf8');
  if (!h.includes(`content="${REL}"`)) problems.push(`release stamp ${REL} missing from page`);
  if (!h.includes(SHA12)) problems.push('master sha stamp missing from page');
  if (/\{\{[A-Za-z0-9_]+\}\}/.test(h)) problems.push('unresolved token in page');
  if (!h.includes('exel-sum-src content="' + SUMSHA + '"')) problems.push('page was built from DIFFERENT data than the current sum.json/signmap — rebuild (Odin: the stale-page-after-correction case)');
  const twin = 'frontend/public/whitepaper/download/vision-2525-executive-summary.sum.html';
  if (!fs.existsSync(twin)) problems.push('download twin missing');
  else if (fs.readFileSync(twin, 'utf8') !== h) problems.push('download twin not byte-identical');
}

if (problems.length) {
  console.error(`FAIL sum — ${problems.length} problem(s):`);
  for (const p of [...new Set(problems)].slice(0, 40)) console.error('  ' + p);
  process.exit(1);
}
console.log(`ok    sum — 70 keys, ${records} records, all tokens mapped, e-concat == current master, page stamped ${REL}, twin byte-identical`);
