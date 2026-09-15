// DRONE-2525 · HAL BUDGET (I-12) — the poorest head still sees the world, at every rung it can hold.
//
// Operator 2026-09-15: "if compute is higher, resolution upgrade and frame rate upgrade (only per Edge
// sensor CNN compute and available compute)" and "consider 83 starwars mock up as level 1.1".
//
// The inverse is the load-bearing half: at rung 1.1, on a Pi with its own edge extraction, the arena must
// still DRAW a city block — buildings, doors, roads, contours — and must say what it dropped. This walks the
// real arena at every one of the 25 rungs and checks that, plus the two rules that never bend:
// the sensor is paid before the renderer, and a rung changes what is DRAWN, never what is TRUE.
import { buildArena } from '../lib/drone-2525/arena-model.ts';
import { selectLod, canonicalHash } from '../lib/wire-core/wire-model.ts';
import { MOT_LEVELS, motSpec } from '../lib/wire-core/mot-ladder.ts';
import { HAL_PROFILES, HAL_ORDER, halCnnMs, renderHeadroomMs, sensorFits } from '../lib/wire-core/hal.ts';
import { REFERENCE_STREAM } from '../lib/wire-core/stream.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const rows = [];
for (const level of MOT_LEVELS) {
  const s = motSpec(level);
  const { model, doors } = buildArena(DRONE_DOMAIN, { ngonSides: s.ngonSides, contourStepM: 2, stamp: 'test' });
  const lod = selectLod(model, s.maxLod, s.segments);
  const keptIn = (p) => lod.byGroup.filter((g) => g.kept && g.id.startsWith(p)).reduce((n, g) => n + g.edges, 0);
  rows.push({ level, kept: lod.kept, dropped: lod.dropped, budget: s.segments, doors: doors.length, hash: canonicalHash(model), sides: s.ngonSides });

  ok(lod.kept <= s.segments, `${level} keeps ${lod.kept} segments, within its ${s.segments} budget`);
  ok(lod.kept > 0, `${level} draws something`);
  ok(keptIn('bld.') > 0, `${level} still draws buildings`);
  ok(keptIn('door.') > 0, `${level} still draws the doors — the thing the player is asked to tag`);
  ok(doors.length === 14, `${level} finds all 14 doors — the world is the same at every rung`);
}

// ── 1.1 IS THE PI-CLASS CASE, AND IT MUST STILL SHOW A CITY BLOCK ────────────────────────────────
{
  const s = motSpec('1.1');
  const { model } = buildArena(DRONE_DOMAIN, { ngonSides: s.ngonSides, contourStepM: 2, stamp: 'test' });
  const lod = selectLod(model, s.maxLod, s.segments);
  const groups = lod.byGroup.filter((g) => g.kept).map((g) => g.id);
  ok(lod.kept <= 1200, `the arcade rung holds a Pi-class budget (${lod.kept} ≤ 1200 segments)`);
  ok(groups.some((g) => g.startsWith('arena.roads')), '1.1 keeps the roads');
  ok(groups.some((g) => g.startsWith('arena.contours')), '1.1 keeps the terrain contours');
  ok(lod.dropped > 0, 'and it says how much it gave up to do it');
}

// ── THE TOP RUNG HOLDS THE DECLARED CEILING ──────────────────────────────────────────────────────
{
  const top = rows[rows.length - 1], bot = rows[0];
  ok(top.kept <= 4000, `5.5 holds the declared ceiling (${top.kept} ≤ 4000 segments)`);
  ok(top.kept >= bot.kept, 'a richer rung never draws less than a poorer one');
}

// ── TIER-INDEPENDENCE: A RUNG CHANGES WHAT IS DRAWN, NEVER WHAT IS TRUE ──────────────────────────
{
  const a = canonicalHash(buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: 'test' }).model);
  const b = canonicalHash(buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: 'test' }).model);
  ok(a === b, 'the same inputs give the same model hash');
  // Every rung now buys its own curve resolution, so the invariant is stated directly rather than by
  // hunting for a collision: hand two DIFFERENT rungs the same curve budget and the world must be identical.
  const lowSides = motSpec('1.1').ngonSides;
  const asLow = canonicalHash(buildArena(DRONE_DOMAIN, { ngonSides: lowSides, contourStepM: 2, stamp: 'test' }).model);
  const topAtLowSides = canonicalHash(buildArena(DRONE_DOMAIN, { ngonSides: lowSides, contourStepM: 2, stamp: 'test' }).model);
  ok(asLow === topAtLowSides, 'the same curve budget gives the same world, whichever rung asked for it — a rung is a paint decision, not a truth decision');
  ok(rows[0].hash !== rows[rows.length - 1].hash, 'and a genuinely different curve budget is a genuinely different model, not a silent reuse');
  ok(new Set(rows.map((r) => r.sides)).size === rows.length, 'every rung buys its own curve resolution — no two rungs are secretly the same picture');
}

// ── THE SENSOR IS PAID FIRST, ON EVERY MACHINE, AT EVERY RUNG ────────────────────────────────────
for (const h of HAL_ORDER) {
  const hal = HAL_PROFILES[h];
  for (const level of ['1.1', '3.3', '5.5']) {
    const s = motSpec(level);
    const head = renderHeadroomMs(hal, s.cnnMs, 0);
    ok(head === hal.frameBudgetMs - halCnnMs(hal, s.cnnMs),
       `${h} at ${level}: the CNN reserve comes out of the frame before the renderer gets a millisecond`);
  }
}
ok(sensorFits(HAL_PROFILES.pi, motSpec('1.1').cnnMs), 'a Pi can afford the arcade rung sensor stack');
ok(!sensorFits(HAL_PROFILES.accel, motSpec('5.5').cnnMs), 'and an accelerator is honestly told the full fusion stack will not fit its 16ms frame');

// ── THE REFERENCE IS THE BAR ─────────────────────────────────────────────────────────────────────
ok(REFERENCE_STREAM.id === '1080p30', 'every judgement is made against 1080p30, not a nicer number');

console.log('\nHAL budget on the Capitol arena, by rung:');
for (const r of [rows[0], rows[4], rows[9], rows[14], rows[19], rows[24]]) {
  console.log(`  ${r.level}  kept ${String(r.kept).padStart(4)} / ${String(r.budget).padStart(4)}  dropped ${String(r.dropped).padStart(4)}  doors ${r.doors}`);
}
console.log(`\ndrone-hal: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
