// EVERY STEP IN test:ci POINTS AT SOMETHING THAT EXISTS.
//
// Written because Deploy went red on three commits in a row for the dumbest possible reason: a test file was
// deleted (the forked cube partition, removed in favour of lib/sim-sections.ts) and its npm script was left
// wired into test:ci. `npm run test:ci` then died at MODULE_NOT_FOUND long before any real assertion, and the
// local "full chain" never saw it because that chain was a hand-picked list of gate names rather than test:ci
// itself. A chain that is not the chain CI runs is not a check.
//
// Pure file existence — no git, no browser — so it runs in BOTH test:ci and prebuild and costs nothing.
import fs from 'node:fs';
import path from 'node:path';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const FE = path.resolve(HERE, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(FE, 'package.json'), 'utf8'));
const scripts = pkg.scripts || {};

for (const chain of ['test:ci', 'prebuild']) {
  const body = scripts[chain];
  ok(typeof body === 'string' && body.length > 0, `${chain} exists`);
  if (!body) continue;

  // every `npm run <name>` names a script that is declared
  const named = [...body.matchAll(/npm run (?:-s )?([\w:.-]+)/g)].map((m) => m[1]);
  const undeclared = named.filter((n) => !scripts[n]);
  ok(undeclared.length === 0, `${chain}: every step names a declared script (undeclared: ${undeclared.join(', ') || 'none'})`);

  // every file a step runs is on disk — transitively, one level through the scripts it calls
  const files = new Set();
  const collect = (cmd) => { for (const f of cmd.match(/(?:\.\.\/)?(?:tests|scripts)\/[\w./-]+\.(?:mjs|mts|ts|js)/g) || []) files.add(f); };
  collect(body);
  for (const n of named) if (scripts[n]) collect(scripts[n]);
  const missing = [...files].filter((f) => !fs.existsSync(path.resolve(FE, f)));
  ok(missing.length === 0, `${chain}: every file it runs exists (missing: ${missing.join(', ') || 'none'})`);
  ok(files.size >= 5, `${chain}: the walk actually found files to check (${files.size}) — it may not pass by checking nothing`);
}

// A script declared but pointing at a deleted file is the exact shape that broke Deploy, even when it is not
// reachable from a chain today — tomorrow someone wires it in.
const orphans = Object.entries(scripts)
  .filter(([n]) => n.startsWith('test:'))
  .flatMap(([n, cmd]) => (cmd.match(/(?:\.\.\/)?(?:tests|scripts)\/[\w./-]+\.(?:mjs|mts|ts|js)/g) || [])
    .filter((f) => !fs.existsSync(path.resolve(FE, f))).map((f) => `${n} -> ${f}`));
ok(orphans.length === 0, `no test:* script points at a file that does not exist (${orphans.join(' · ') || 'none'})`);

console.log(`\nci-wiring: ${pass} passed, ${fail} failed · ${Object.keys(scripts).filter((n) => n.startsWith('test:')).length} test scripts audited`);
if (fail) process.exit(1);
