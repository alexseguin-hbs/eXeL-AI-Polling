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
const need = ['POD session', 'Create Doc', 'Sign Doc', 'Drone-2525',
  // R-CORE Stage 2 (operator 2026-09-25) — one append-only ledger per surface that carries the R-CORE badge.
  'Security-2525', 'Settings', 'Easter-Egg', 'Architect-2525', 'Celestial-2525', 'Financial-2525'];
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
  // Real content verification (was a tautology — `e.rev <= L.entries.length` is always true under the
  // monotonicity asserted above, so it verified NOTHING and could not catch a gutted or rewritten entry;
  // fleet 2026-09-26, Odin/MoT). Replay HEAD as: every entry well-formed (int rev ≥ 1, non-empty date,
  // known kind, non-empty body, no duplicate rev) and the reconstruction covers all n entries.
  let contentOk = true, replayN = 0; const seenRev = new Set();
  for (const e of L.entries) {
    const wellFormed = Number.isInteger(e.rev) && e.rev >= 1 && typeof e.date === 'string' && e.date.trim()
      && KINDS.has(e.kind) && typeof e.text === 'string' && e.text.trim().length > 0 && !seenRev.has(e.rev);
    if (!wellFormed) contentOk = false; else { seenRev.add(e.rev); replayN++; }
  }
  ok(contentOk && replayN === L.entries.length,
    `${L.section}: replay(HEAD) reconstructs all ${L.entries.length} entries, each a well-formed non-empty record (${replayN}/${L.entries.length})`);
}
for (const n of need) ok(sections.includes(n), `the ${n} ledger is present`);
// r.196 (fleet 2026-10-12, Thoth/Aset/Athena/Sofia): a Drone-2525 release row cites the commit that CARRIES the revision it names — from
// rev 74 on (rev 73 corrects the older rows, which cited the parent commit, on the record). And the ledger's bytes are its canonical
// serialisation, so an append is one hunk.
{ const dp = path.join(DIR, 'drone-2525.ledger.json'); const raw = fs.readFileSync(dp, 'utf8'); const L = JSON.parse(raw);
  ok(raw === JSON.stringify(L, null, 2) + '\n', 'Drone-2525: the ledger is canonically serialised (2-space JSON + newline) — an append is one hunk');
  for (const e of L.entries.filter((x) => x.kind === 'release' && x.rev >= 74)) {
    const m = /deck r\.(\d{3})\b/i.exec(e.text || ''); /* the row's own revision: "… deck r.NNN served …" */ let has = false;
    try { has = !!m && new RegExp(`revision:'0\\.${m[1]}'`).test(execSync(`git -C ${ROOT} show ${e.commit}:frontend/public/drone-2525/play.html`, { encoding: 'utf8', maxBuffer: 1 << 26 })); } catch {}
    ok(has, `Drone-2525 rev ${e.rev}: commit ${e.commit} carries the r.${m && m[1]} it names (play.html declares revision 0.${m && m[1]})`);
  } }
console.log(`traceability: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
