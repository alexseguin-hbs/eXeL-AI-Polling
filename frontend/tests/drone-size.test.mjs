// THE 300-LINE RULE, MEASURED (CLAUDE.md: "<300 LOC per function"; the 48-agent fleet found round.tsx at 772
// lines with the rule asserted only in a comment). This gate makes the number real: each listed file has a
// CEILING it may not exceed, and the ceiling RATCHETS DOWN only — a file may shrink, never grow past its
// recorded size. round.tsx is over the rule today; the ceiling holds the line at its current size and every
// P1/P3 extraction (intro, edge deck, ledger panel, room) must lower it toward 300. A commit that adds to a
// capped file without extracting fails here, in the same commit — which is the whole point.
import fs from 'node:fs';
let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('FAIL:',m); } };
// path : max lines (ratchet DOWN only; lower it as you split, never raise it)
const CEIL = {
  'components/drone-2525/round.tsx': 772,          // over the 300 rule — must ratchet down (P1 extractions)
  'components/drone-2525/control-deck.tsx': 200,
  'components/drone-2525/arena-view.tsx': 240,
  'components/drone-2525/command-ux1.tsx': 160,
};
for (const [f,max] of Object.entries(CEIL)) {
  const n = fs.readFileSync(f,'utf8').replace(/\n$/,'').split('\n').length;
  ok(n <= max, `${f} is ${n} lines, ceiling ${max} — ratchet down, never grow (split, do not pad)`);
}
// A soft note (not a failure) when a file is far over the 300 rule, so the debt stays visible.
for (const [f,max] of Object.entries(CEIL)) {
  const n = fs.readFileSync(f,'utf8').replace(/\n$/,'').split('\n').length;
  if (n > 300) console.log(`  NOTE: ${f} ${n} lines > 300 rule — extraction owed`);
}
console.log(`\ndrone-size: ${pass} passed, ${fail} failed · ceilings ratchet down toward the 300-line rule`);
process.exit(fail?1:0);
