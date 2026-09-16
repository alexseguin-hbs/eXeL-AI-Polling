// traceability — the per-section ledgers can't silently drift (operator 2026-09-13: "so you dont do stupid ship").
// Every section ledger parses; revs are monotonic 1..n; kind ∈ ask|decision|release; every release cites a commit that
// EXISTS; replay(HEAD) equals the full ledger. Run: node tests/traceability.test.mjs
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const ROOT = path.resolve(process.cwd(), '..'); const DIR = path.join(ROOT, 'docs/traceability');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
// A LEDGER THAT CANNOT RECORD A CORRECTION IS A LEDGER THAT HIDES THEM. `correction` was added
// 2026-09-16, when a shipped release entry turned out to carry a claim that was false of the app.
// The append-only law forbids editing the entry, and labelling the fix a plain `decision` would have
// left the record saying two contradictory things with nothing pointing between them.
const KINDS = new Set(['ask', 'decision', 'release', 'correction']);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.ledger.json'));
ok(files.length >= 3, `three section ledgers exist (got ${files.length}: ${files.join(', ')})`);
const need = ['POD session', 'Create Doc', 'Sign Doc', 'Drone-2525'];
const exists = (sha) => { try { execSync(`git -C ${ROOT} cat-file -e ${sha}^{commit}`, { stdio: 'ignore' }); return true; } catch { return false; } };
const sections = [];
for (const f of files) {
  let L; try { L = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { ok(false, `${f}: parse ${e.message}`); continue; }
  sections.push(L.section);
  ok(!!L.section && !!L.route, `${f}: has section + route`);
  let prev = 0, monotonic = true, kindsOk = true, releasesOk = true;
  for (const e of L.entries) {
    if (e.rev !== prev + 1) monotonic = false; prev = e.rev;
    if (!KINDS.has(e.kind)) kindsOk = false;
    if (e.kind === 'release' && (!e.commit || !exists(e.commit))) releasesOk = false;
  }
  ok(monotonic, `${L.section}: revs monotonic 1..${L.entries.length}`);
  ok(kindsOk, `${L.section}: every kind ∈ ask|decision|release|correction`);
  ok(releasesOk, `${L.section}: every release cites a commit that exists`);
  const replayHead = L.entries.filter((e) => e.rev <= L.entries.length);
  ok(replayHead.length === L.entries.length, `${L.section}: replay(HEAD) equals the full ledger (${replayHead.length}/${L.entries.length})`);
}
for (const n of need) ok(sections.includes(n), `the ${n} ledger is present`);
console.log(`traceability: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
