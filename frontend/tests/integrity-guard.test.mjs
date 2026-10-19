// integrity-guard — THE GUARD STILL BITES, AND ITS ONE EXEMPTION CANNOT WIDEN SILENTLY (r.218, 2026-10-19).
//
// scripts/integrity-guard.mjs runs in prebuild on every Cloudflare build. It had no test. The day it blocked every
// deploy on a committed helper whose source called the dynamic evaluator on a built string, riding inside the code
// record's diff text - the exemption that fixed
// it was written by hand - and a hand-written exemption to a security guard needs a gate of its own:
//   1. the repo as it stands passes the guard;
//   2. a bait .js planted under public/ (outside the exemption) is BLOCKED - the guard still bites;
//   3. a bait .json planted under public/ (outside the exemption) is BLOCKED - .json is still scanned;
//   4. a bait planted INSIDE public/r-core/code/ is ignored - that is the exemption, and it is the only one;
//   5. SKIP_PREFIXES is exactly ["public/r-core/code/"] - no one adds a second prefix without turning this red.
// Pure fs + one child process (the guard itself). No git, no browser.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FE = path.resolve(HERE, '..');
const GUARD = path.join(FE, 'scripts/integrity-guard.mjs');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const run = () => spawnSync(process.execPath, [GUARD], { cwd: FE, encoding: 'utf8' });
// The bait is assembled here so THIS file never carries the signature it plants - the guard scans tests/ too, and a
// test the guard flags would need its own exemption, which is exactly what this test forbids.
const BAIT_JS = ['ev', 'al'].join('') + '(atob("Zm9v"))\n';
const BAIT_JSON = '{"x":"' + ['ev', 'al'].join('') + '(atob(1))"}\n';
const withBait = (rel, body, fn) => {
  const p = path.join(FE, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body);
  try { return fn(run()); } finally { fs.rmSync(path.dirname(p), { recursive: true, force: true }); }
};

const clean = run();
ok(clean.status === 0, `the repo as it stands passes the guard (exit ${clean.status})`);

withBait('public/_bait_js/x.js', BAIT_JS, (r) => {
  ok(r.status === 1 && /_bait_js\/x\.js/.test(r.stdout + r.stderr), `a bait .js under public/ is BLOCKED (exit ${r.status})`);
});
withBait('public/_bait_json/y.json', BAIT_JSON, (r) => {
  ok(r.status === 1 && /_bait_json\/y\.json/.test(r.stdout + r.stderr), `a bait .json under public/ outside the exemption is BLOCKED (exit ${r.status})`);
});
withBait('public/r-core/code/_bait/z.json', BAIT_JSON, (r) => {
  ok(r.status === 0, `a bait inside public/r-core/code/ is ignored - the code record is diff text, proven by rcore-code-record (exit ${r.status})`);
});

const src = fs.readFileSync(GUARD, 'utf8');
const m = src.match(/const SKIP_PREFIXES = (\[[^\]]*\]);/);
ok(!!m && JSON.stringify(JSON.parse(m[1])) === JSON.stringify(['public/r-core/code/']), `SKIP_PREFIXES is exactly ["public/r-core/code/"] (got ${m ? m[1] : 'none'})`);
ok(/rel\.startsWith\(pre\)/.test(src), 'the exemption is applied by path prefix in scan(), not by file name');
ok(fs.existsSync(path.join(FE, 'tests/rcore-code-record.test.mjs')), 'the gate the exemption leans on exists (rcore-code-record)');

console.log(`\nintegrity-guard: ${pass} passed, ${fail} failed · the guard bites outside public/r-core/code/ and nowhere else is exempt`);
process.exit(fail ? 1 : 0);
