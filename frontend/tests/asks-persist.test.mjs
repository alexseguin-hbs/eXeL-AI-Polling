// asks-persist — PERSIST FIRST leaves a checkable stamp (fleet 2026-09-26, MoT: "the '+ .sha256' half lapsed
// on the 4 newest asks"). Every operator ask in the work window (dated on/after the cutoff) must carry a
// docs/asks/<name>.md.sha256 sidecar whose hash matches the .md; AND any sidecar that exists (any date) must
// match its .md (tamper-evidence). Historical asks before the cutoff are not retro-required — the rule is
// forward-looking, enforcing the discipline from the window this gate was added in.
// Run: node tests/asks-persist.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(process.cwd(), '..');
const DIR = path.join(ROOT, 'docs/asks');
const CUTOFF = '2026-09-24'; // the start of the 48h window this gate was introduced for; new asks stamp from here on.

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const sha256 = (p) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const dateOf = (name) => (name.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || '';

const files = fs.readdirSync(DIR);
const mds = files.filter((f) => f.endsWith('.md'));
ok(mds.length > 0, `docs/asks holds ask .md files (got ${mds.length})`);

let windowChecked = 0, sidecarsChecked = 0;
for (const md of mds) {
  const sidecar = md + '.sha256';
  const hasSidecar = files.includes(sidecar);
  const d = dateOf(md);
  const inWindow = d && d >= CUTOFF;

  if (inWindow) {
    windowChecked++;
    ok(hasSidecar, `window ask ${md} (${d}) carries its .sha256 sidecar (PERSIST FIRST stamp)`);
  }
  // Whether in-window or not: if a sidecar exists, it must match the .md (tamper-evidence).
  if (hasSidecar) {
    sidecarsChecked++;
    const recorded = fs.readFileSync(path.join(DIR, sidecar), 'utf8').trim().split(/\s+/)[0];
    ok(/^[0-9a-f]{64}$/.test(recorded), `${sidecar} holds a 64-hex sha256`);
    ok(recorded === sha256(path.join(DIR, md)), `${sidecar} matches the current ${md} (no silent drift)`);
  }
}
ok(windowChecked >= 1, `at least one in-window (>= ${CUTOFF}) ask was checked (got ${windowChecked})`);

console.log(`\nasks-persist: ${pass} passed, ${fail} failed · ${windowChecked} window asks require a stamp, ${sidecarsChecked} sidecars verified`);
process.exit(fail ? 1 : 0);
