// FORTY-TWO AIRCRAFT, 21 v 21 — operator 2026-09-15: "optimize to 42 total (21 aircraft vs 21 aircraft)".
//
// Three claims are checked here, and the middle one is the reason the module is written the way it is:
//   1. it is genuinely 21 against 21, and a side is a fact about the index rather than a field to get wrong
//   2. A TICK ALLOCATES NOTHING — measured, not asserted in a comment
//   3. ONE BUDGET, TWO CONSUMERS — the swarm takes its share and the world gets the rest, at every rung
import {
  initSwarm, stepSwarm, downAircraft, aliveCount, planSwarmDraw, swarmLine,
  sideOf, idOf, SIDES, PER_SIDE, SWARM_N, CLOSE_M, BAND_NEAR_M, BAND_MID_M,
} from '../lib/drone-2525/swarm.ts';
import { GLYPH_COST, GLYPHS, AIRFRAME_EXTENT } from '../lib/drone-2525/airframe-glyph.ts';
import { MOT_LEVELS, motSpec } from '../lib/wire-core/mot-ladder.ts';
import { selectLod } from '../lib/wire-core/wire-model.ts';
import { worldAt, forgetWorlds, worldsHeld } from '../lib/drone-2525/world.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ── 21 AGAINST 21 ───────────────────────────────────────────────────────────────────────────────
ok(PER_SIDE === 21 && SWARM_N === 42, `twenty-one a side, forty-two in the air (${PER_SIDE} / ${SWARM_N})`);
ok(SIDES.join() === 'friendly,hostile', 'the two sides use the vocabulary the security surface already uses');
const s0 = initSwarm();
ok(s0.n === 42, 'the swarm holds forty-two');
ok(aliveCount(s0, 'friendly') === 21 && aliveCount(s0, 'hostile') === 21, 'twenty-one each, flying');
ok(sideOf(0) === 'friendly' && sideOf(20) === 'friendly' && sideOf(21) === 'hostile' && sideOf(41) === 'hostile',
   'a side is a fact about the index, not a field that can disagree with itself');
ok(new Set(Array.from({ length: 42 }, (_, i) => idOf(i))).size === 42, 'every aircraft has its own name');
ok(idOf(0) === 'B01' && idOf(21) === 'R01', `the names say which side (${idOf(0)} and ${idOf(21)})`);
ok([...s0.e, ...s0.nCoord, ...s0.aglM].every(Number.isFinite), 'every one of them starts somewhere real');
ok(s0.aglM.every((a) => a > 20), 'and in the air rather than on the grass — the first frame is an engagement');
{
  const north = Array.from({ length: 21 }, (_, i) => s0.nCoord[i]);
  const south = Array.from({ length: 21 }, (_, i) => s0.nCoord[i + 21]);
  ok(Math.max(...north) < Math.min(...south), 'the two sides start apart, facing each other across the lawn');
  ok(new Set(Array.from(s0.aglM).map((a) => Math.round(a / 20))).size > 1, 'and stacked, not all in one plane');
}

// ── A TICK ALLOCATES NOTHING ────────────────────────────────────────────────────────────────────
{
  const s = initSwarm();
  const cols = [s.e, s.nCoord, s.aglM, s.ve, s.vn, s.vu, s.headingDeg, s.alive];
  ok(cols.every((c) => c instanceof Float64Array), 'the state is columns, not forty-two objects');
  for (let i = 0; i < 50; i++) stepSwarm(s, 0.1);
  ok(cols.every((c, i) => c === [s.e, s.nCoord, s.aglM, s.ve, s.vn, s.vu, s.headingDeg, s.alive][i]),
     'fifty ticks and not one column was replaced — the tick writes in place');

  // Measured, not claimed. A tick that allocated per aircraft would show here.
  if (typeof global.gc === 'function') global.gc();
  const before = process.memoryUsage().heapUsed;
  const warm = initSwarm();
  for (let i = 0; i < 2000; i++) stepSwarm(warm, 0.05);
  const grew = process.memoryUsage().heapUsed - before;
  ok(grew < 2_000_000, `two thousand ticks grew the heap by ${(grew / 1024).toFixed(0)} KB, not megabytes`);
}

// ── DETERMINISTIC: THE SAME SEED FLIES THE SAME ENGAGEMENT ──────────────────────────────────────
{
  const run = (seed) => {
    const s = initSwarm(seed);
    for (let i = 0; i < 300; i++) stepSwarm(s, 0.05);
    return Array.from(s.e).concat(Array.from(s.nCoord), Array.from(s.headingDeg)).map((n) => Math.round(n * 1000)).join(',');
  };
  ok(run(20260915) === run(20260915), 'the same seed flies the same engagement, twice');
  ok(run(20260915) !== run(7), 'and a different seed a different one');
}

// ── THEY ACTUALLY ENGAGE ────────────────────────────────────────────────────────────────────────
{
  const s = initSwarm();
  const gapAt = () => {
    let best = Infinity;
    for (let i = 0; i < PER_SIDE; i++) for (let j = PER_SIDE; j < s.n; j++) {
      if (!s.alive[i] || !s.alive[j]) continue;
      best = Math.min(best, Math.hypot(s.e[j] - s.e[i], s.nCoord[j] - s.nCoord[i]));
    }
    return best;
  };
  const start = gapAt();
  for (let i = 0; i < 400; i++) stepSwarm(s, 0.05);
  const after = gapAt();
  ok(after < start, `the two sides close on each other (${start.toFixed(0)} m to ${after.toFixed(0)} m)`);
  ok(after > 0, 'and do not occupy the same point');
}
{
  const s = initSwarm();
  downAircraft(s, 3);
  ok(aliveCount(s, 'friendly') === 20, 'an aircraft can be taken out of the fight');
  ok(s.n === 42, 'without being deleted — a replay still has its whole story');
  stepSwarm(s, 0.1);
  ok(s.alive[3] === 0, 'and it stays out');
  for (let i = PER_SIDE; i < s.n; i++) downAircraft(s, i);
  ok(aliveCount(s, 'hostile') === 0, 'a side can be cleared');
  stepSwarm(s, 0.1);
  ok(Array.from(s.e).every(Number.isFinite), 'and the survivors keep flying with nobody to chase');
}

// ── THE SILHOUETTE IS TAKEN FROM THE REAL AIRFRAME ──────────────────────────────────────────────
ok(GLYPH_COST.far === 4 && GLYPH_COST.mid === 12 && GLYPH_COST.near === 24, 'three sizes: 4, 12 and 24 segments');
ok(GLYPHS.far.length === 4 && GLYPHS.near.length === 24, 'and the tables match the costs declared');
ok(AIRFRAME_EXTENT.lengthM > 20 && AIRFRAME_EXTENT.spanM > 5, `proportioned from the real airframe (${AIRFRAME_EXTENT.lengthM} m long)`);
for (const [b, segs] of Object.entries(GLYPHS)) {
  ok(segs.every((sg) => sg.length === 2 && sg[0].length === 3 && sg[1].length === 3), `${b} is a list of segments in three dimensions`);
  ok(segs.every((sg) => [...sg[0], ...sg[1]].every(Number.isFinite)), `${b} has no holes in it`);
  ok(segs.some((sg) => sg[0][0] > 0.4 || sg[1][0] > 0.4), `${b} has a nose`);
}
ok(GLYPH_COST.far * 42 === 168, 'forty-two at the smallest size is 168 segments — inside the 280 of rung 1.1');

// ── ONE BUDGET, TWO CONSUMERS, AT EVERY RUNG ────────────────────────────────────────────────────
console.log('\n  rung  budget  world  swarm  drawn  dropped');
let everyRungDrawsAircraft = true;
for (const l of MOT_LEVELS) {
  const spec = motSpec(l);
  const w = worldAt(DRONE_DOMAIN, spec.ngonSides, 'swarm-test');
  const s = initSwarm();
  // The swarm takes its share FIRST: in an engagement the aircraft are the world.
  const share = Math.min(spec.segments, GLYPH_COST.far * 42);
  const plan = planSwarmDraw(s, 0, -260, share);
  const left = Math.max(0, spec.segments - plan.cost);
  const lod = selectLod(w.model, spec.maxLod, left);
  ok(plan.cost <= share, `${l}: the swarm stays inside the share it was given (${plan.cost} ≤ ${share})`);
  ok(plan.cost + lod.kept <= spec.segments, `${l}: swarm plus world is inside the rung's budget (${plan.cost + lod.kept} ≤ ${spec.segments})`);
  if (plan.drawn === 0) everyRungDrawsAircraft = false;
  if (['1.1', '1.5', '2.3', '3.3', '5.5'].includes(l)) {
    console.log(`  ${l}   ${String(spec.segments).padStart(5)}  ${String(lod.kept).padStart(5)}  ${String(plan.cost).padStart(5)}  ${String(plan.drawn).padStart(5)}  ${String(plan.dropped).padStart(7)}`);
  }
}
ok(everyRungDrawsAircraft, 'EVERY rung draws aircraft — at the poorest the world thins out, the engagement does not');
{
  // The pass mark the operator set: rung 2.3, all 42 in the air, and a world still worth looking at.
  const spec = motSpec('2.3');
  const s = initSwarm();
  const plan = planSwarmDraw(s, 0, -260, spec.segments - 649);
  ok(plan.drawn === 42, `at rung 2.3 all forty-two are drawn (${plan.drawn})`);
  ok(plan.dropped === 0, 'and none is too far to draw');
  const w = worldAt(DRONE_DOMAIN, spec.ngonSides, 'swarm-test');
  const lod = selectLod(w.model, spec.maxLod, spec.segments - plan.cost);
  ok(lod.kept > 300, `and the Capitol block still gets ${lod.kept} segments`);
}
{
  // Nearest first: when the budget runs out it is the far ones that go.
  const s = initSwarm();
  const tight = planSwarmDraw(s, 0, -260, 40);
  ok(tight.drawn > 0 && tight.dropped > 0, `a tight budget draws some and drops some (${tight.drawn} drawn, ${tight.dropped} dropped)`);
  ok(tight.cost <= 40, 'and never overspends');
  ok(tight.band.every((b) => b === 'far'), 'and when it is tight NOBODY gets detail — presence before polish');
  // The rule the first draft got backwards: an aircraft never disappears while another still has detail.
  const share = GLYPH_COST.far * 42;
  const exact = planSwarmDraw(s, 0, -260, share);
  ok(exact.drawn === 42 && exact.dropped === 0, `a share of exactly 42 small glyphs draws all 42 (${exact.drawn})`);
  ok(exact.band.every((b) => b === 'far'), 'all at the smallest size, because that is all it could afford');
  const near = planSwarmDraw(s, 0, -260, 10_000);
  ok(near.band.some((b) => b === 'near'), 'with room, something close gets the detailed silhouette');
  ok(near.band.filter((b) => b === 'far').length < 42, 'and not everything is a dot');
  ok(/v /.test(swarmLine(s, near)) && /seg/.test(swarmLine(s, near)), `the line says the score and the cost: "${swarmLine(s, near)}"`);
  ok(/too far to draw/.test(swarmLine(s, tight)), 'and says out loud when it could not draw them all');
}

// ── ONE WORLD, SHARED ───────────────────────────────────────────────────────────────────────────
{
  forgetWorlds();
  const a = worldAt(DRONE_DOMAIN, 13, 'one');
  const b = worldAt(DRONE_DOMAIN, 13, 'two');
  ok(a === b, 'two consumers asking for the same world get the SAME object, not two that agree');
  ok(worldsHeld() === 1, 'and only one is held');
  const c = worldAt(DRONE_DOMAIN, 8, 'one');
  ok(c !== a && worldsHeld() === 2, 'a genuinely different curve budget is a genuinely different world');
}

console.log(`\ndrone-swarm: ${pass} passed, ${fail} failed · ${SWARM_N} aircraft · glyphs ${GLYPH_COST.far}/${GLYPH_COST.mid}/${GLYPH_COST.near} seg`);
process.exit(fail ? 1 : 0);
