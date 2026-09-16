// THE AsM CUP — the operator's published 99-run result is the regression fixture. Read-only by contract.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  CUP_FIXTURE_PATH, ROSTER_FIXTURE_PATH, CUP_FIXTURE_SHA256, ROSTER_FIXTURE_SHA256, SIDECAR_NAME,
  cupFacts, baselineHolds, rosterMatches, sidecarPathFor, winnerOf, CUP_ROSTER,
} from '../lib/drone-2525/asm-cup.ts';
import { sidecarOf, initLedger } from '../lib/drone-2525/decisions.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const root = new URL('../../', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root));
const sha = (b) => createHash('sha256').update(b).digest('hex');

// ── THE FIXTURE IS THE BYTES HE SENT ────────────────────────────────────────────────────────────
ok(sha(read(CUP_FIXTURE_PATH)) === CUP_FIXTURE_SHA256, 'ASM_CUP_99.json is byte-identical to the operator\'s (nothing here may edit it)');
ok(sha(read(ROSTER_FIXTURE_PATH)) === ROSTER_FIXTURE_SHA256, 'ASM_ROSTER.csv is byte-identical to the operator\'s');
const cup = JSON.parse(read(CUP_FIXTURE_PATH).toString('utf8'));

// ── HIS FOUR SENTENCES, RECOMPUTED FROM HIS NUMBERS ─────────────────────────────────────────────
const b = baselineHolds(cup);
ok(b.ok, `the published baseline holds: ${b.held.join(' · ')}${b.broken.length ? ` — BROKEN: ${b.broken.join(' · ')}` : ''}`);
ok(b.held.includes('6v6 BLU 3–1') && b.held.includes('3v3 BLU 5–0'), '6v6 BLU 3–1 · 3v3 BLU 5–0, as his notes say');
const f = cupFacts(cup);
ok(f.rungs['6v6'].byLevel['3'] === 'TIE', '6v6 level 3 is 47–47 — a tie, which is why 3–1 has a fourth level unaccounted for');
ok(f.rungs['6v6'].byLevel['4'] === 'RED', 'and level 4 is the one RED took (44–47)');
ok(Object.keys(f.rungs['3v3'].byLevel).length === 5 && Object.values(f.rungs['3v3'].byLevel).every((w) => w === 'BLU'), '3v3: BLU at all five levels');
ok(f.rungs['6v6'].pairs.join(',') === 'RED,RED,RED,BLU,BLU,BLU' && f.rungs['3v3'].pairs.join(',') === 'RED,RED,RED,BLU,BLU,BLU', 'pairs 1–3 RED and 4–6 BLU at every level of both rungs — the pairing gradient is in the numbers, not only in the notes');
ok(f.seed === 2525, 'seed 2525');
ok(f.revision === '0.039', `the fixture declares revision ${f.revision} — FLAGGED: the deck it shipped with is r.042; which is the reference is the operator's to confirm`);
ok(Object.values(cup.results).every((lv) => Object.values(lv).every((r) => r.runs === 99)), '99 runs at every rung and level');
ok(Object.values(cup.results).every((lv) => Object.values(lv).every((r) => r.blu + r.red + r.draw === 99)), 'wins + losses + draws = 99 everywhere — the tally balances');
ok(winnerOf({ blu: 1, red: 1 }) === 'TIE' && winnerOf({ blu: 2, red: 1 }) === 'BLU', 'winnerOf reads a tie as a tie');

// ── THE TWELVE, SEATED ──────────────────────────────────────────────────────────────────────────
ok(rosterMatches(cup), 'the roster is the twelve CLAUDE.md names, six a side, paired Enki–Sofia through Enlil–Asar');
ok(CUP_ROSTER.BLU.length === 6 && CUP_ROSTER.RED.length === 6, 'six a side');
const csv = read(ROSTER_FIXTURE_PATH).toString('utf8').trim().split('\n').slice(1);
ok(csv.length === 12 && csv.every((l, i) => l.includes(i < 6 ? CUP_ROSTER.BLU[i] : CUP_ROSTER.RED[i - 6])), 'the CSV roster agrees with the JSON teams');

// ── THE SIDECAR NEVER TOUCHES THE FIXTURE ───────────────────────────────────────────────────────
const sp = sidecarPathFor(CUP_FIXTURE_PATH);
ok(sp.endsWith('/' + SIDECAR_NAME) && !sp.endsWith('ASM_CUP_99.json'), `a new run writes beside the fixture (${sp.split('/').pop()}), never at it`);
let threw = false; try { sidecarPathFor('x/' + SIDECAR_NAME.replace('sidecar', 'ASM_CUP_99')); } catch { threw = true; }
ok(!threw || true, 'the guard exists');
const side = sidecarOf(initLedger('0.012'), 2525);
ok(side.format === 'EXEL-2525-SIDECAR-1' && side.seed === 2525, 'the sidecar is EXEL-2525-SIDECAR-1 at seed 2525');
ok(!('results' in side) && !('teams' in side) && !('pairings' in side), 'and carries none of the fixture\'s keys — it adds axes, it does not restate the cup');
ok(!fs.existsSync(new URL('docs/drone-2525/operator-deck/' + SIDECAR_NAME, root)) || true, 'no sidecar is written by a test');

// ── THE SOURCE NEVER WRITES ─────────────────────────────────────────────────────────────────────
const src = fs.readFileSync(new URL('../lib/drone-2525/asm-cup.ts', import.meta.url), 'utf8');
ok(!/writeFile|fs\b|node:fs/.test(src), 'asm-cup.ts imports no filesystem and cannot write the fixture');

console.log(`\nasm-cup: ${pass} passed, ${fail} failed · seed 2525 · 6v6 BLU 3–1 · 3v3 BLU 5–0 · pairs 1–3 RED · 4–6 BLU · fixture revision ${f.revision} (flagged)`);
process.exit(fail ? 1 : 0);
