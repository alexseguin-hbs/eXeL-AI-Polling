// DRONE-2525 · HAL BUDGET (I-12) — the poorest head still sees the world.
// Operator 2026-09-15: "if compute is higher, resolution upgrade and frame rate upgrade (only per Edge sensor
// CNN compute and available compute)". The inverse is the load-bearing half: on a Pi with a CNN eating the
// frame, the arena must still DRAW — buildings, doors, roads, contours — and must say what it dropped.
import { buildArena } from '../lib/drone-2525/arena-model.ts';
import { selectLod, canonicalHash } from '../lib/wire-core/wire-model.ts';
import { TIERS, TIER_ORDER, SENSOR_PROFILES, renderBudgetMs, tierFeasible } from '../lib/wire-core/fidelity.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const pi = SENSOR_PROFILES['pi-baseline'];
const rows = [];

for (const tier of TIER_ORDER) {
  const spec = TIERS[tier];
  const { model, doors } = buildArena(DRONE_DOMAIN, { ngonSides: spec.ngonSides, contourStepM: 2, stamp: 'test' });
  const lod = selectLod(model, spec.maxLod, spec.segments);
  rows.push({ tier, kept: lod.kept, dropped: lod.dropped, budget: spec.segments, doors: doors.length, hash: canonicalHash(model) });

  ok(lod.kept <= spec.segments, `${tier} keeps ${lod.kept} segments, within its ${spec.segments} budget`);
  ok(lod.kept > 0, `${tier} draws something`);
  // What survives is what a person needs to act: the built world and the way in.
  const keptIn = (p) => lod.byGroup.filter((g) => g.kept && g.id.startsWith(p)).reduce((n, g) => n + g.edges, 0);
  ok(keptIn('bld.') > 0, `${tier} still draws buildings`);
  ok(keptIn('door.') > 0, `${tier} still draws the doors — the thing the player is asked to tag`);
}

// 1 — the Pi-class tier holds: LOW fits the 1,200-segment budget AND keeps the roads and contours that make
//     a block readable as a place rather than a scatter of boxes.
const low = rows.find((r) => r.tier === 'low');
ok(low.kept <= 1200, `LOW holds a Pi-class budget (${low.kept} ≤ 1200 segments)`);
const lowArena = buildArena(DRONE_DOMAIN, { ngonSides: TIERS.low.ngonSides, contourStepM: 2, stamp: 'test' });
const lowLod = selectLod(lowArena.model, TIERS.low.maxLod, TIERS.low.segments);
const groups = lowLod.byGroup.filter((g) => g.kept).map((g) => g.id);
ok(groups.some((g) => g.startsWith('arena.roads')), 'LOW keeps the roads');
ok(groups.some((g) => g.startsWith('arena.contours')), 'LOW keeps the terrain contours');

// 2 — MAX holds the declared ceiling (I-12: ≤4,000 segments at full fidelity)
const ultra = rows.find((r) => r.tier === 'ultra');
ok(ultra.kept <= 4000, `ULTRA holds the declared ceiling (${ultra.kept} ≤ 4000 segments)`);
ok(ultra.kept >= low.kept, 'a richer tier never draws less than a poorer one');

// 3 — THE TIER-INDEPENDENCE INVARIANT: a tier changes what is DRAWN, never what is TRUE.
//     Same curve budget ⇒ same model ⇒ same hash, whatever the tier decided to paint.
const a = canonicalHash(buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: 'test' }).model);
const b = canonicalHash(buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: 'test' }).model);
ok(a === b, 'the same inputs give the same model hash');
ok(rows.filter((r) => TIERS[r.tier].ngonSides === 13).every((r) => r.hash === a), 'tiers sharing a curve budget share a hash — the tier is a paint decision, not a truth decision');

// 4 — the sensor is never starved to make the picture prettier
for (const tier of TIER_ORDER) {
  ok(renderBudgetMs(tier, pi) === 1000 / TIERS[tier].fps - pi.cnnReserveMs, `${tier} subtracts the CNN reserve before the renderer gets a millisecond`);
}
ok(tierFeasible('low', pi), 'a Pi with an 18 ms edge extractor can still afford LOW');
ok(!tierFeasible('ultra', pi), 'and it is honestly told it cannot afford ULTRA');

console.log('\nHAL budget on the Capitol arena:');
for (const r of rows) console.log(`  ${r.tier.padEnd(6)} kept ${String(r.kept).padStart(4)} / ${String(r.budget).padStart(4)}  dropped ${String(r.dropped).padStart(4)}  doors ${r.doors}`);
console.log(`\ndrone-hal: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
