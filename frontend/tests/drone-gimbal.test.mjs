// ONE GIMBAL · LINE OF SIGHT · POP-UP TARGETS · THE ROUND — the Pass 1 game gates (DRN-04, 05, 06).
//
// Four invariants, stated in the operator's terms and each defended here:
//  I-01  the turret and the aircraft carry the SAME gimbal — one record, one slew law, one readout
//  I-08  a completed capture or hit is NEVER lost — the record and the score move in one step
//  I-10  a target outside the arena or behind the camera is DROPPED, never clamped
//  DRN-05 a shot the world blocks is a miss WITH A REASON, never a silent no-op
import { buildArena } from '../lib/drone-2525/arena-model.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';
import {
  initGimbal, command, slew, onTarget, eyeOf, aimAt, inFrame, aimReadout, shortestTurn, normAz,
  turretMount, airframeMount, aimVector,
} from '../lib/drone-2525/gimbal.ts';
import { lineOfSight, transect, losReason, pointInPoly } from '../lib/drone-2525/los.ts';
import { buildSchedule, targetsAt, emptyTags, roundLengthMs, targetRole, isActionable } from '../lib/drone-2525/targets.ts';
import { initGame, capture, shoot, endRound, score, bundle, transcript } from '../lib/drone-2525/game.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const SPEC = DRONE_DOMAIN.gimbal;
const { model, doors, ground } = buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: 'test' });
const prisms = DRONE_DOMAIN.buildings.map((b) => ({
  id: b.id, footprint: b.footprint,
  baseU: ground(b.footprint[0][0], b.footprint[0][1]),
  topU: ground(b.footprint[0][0], b.footprint[0][1]) + b.heightM,
}));

// ── I-01 · ONE GIMBAL, TWO MOUNTS ─────────────────────────────────────────────────────────────────
const turret = turretMount(DRONE_DOMAIN.turrets[0]);
const air = airframeMount('vtol-01', 'AIRFRAME', [0, -210], 60);
ok(turret.kind === 'turret' && air.kind === 'airframe', 'the two mounts are distinguishable');
{
  // Same command, same elapsed time, same spec → the SAME angles, whatever it is bolted to.
  const a = slew(command(initGimbal({ ...turret, homeAz: 0, homeEl: 0 }), SPEC, 90, 20), SPEC, 1);
  const b = slew(command(initGimbal({ ...air, homeAz: 0, homeEl: 0 }), SPEC, 90, 20), SPEC, 1);
  ok(a.az === b.az && a.el === b.el, `a turret and an airframe slew identically (${a.az}/${a.el} vs ${b.az}/${b.el})`);
  ok(aimReadout(a, 100) === aimReadout(b, 100), 'and read out identically');
}
{
  const g = command(initGimbal(turret), SPEC, 0, 999);
  ok(g.cmdEl === SPEC.tiltMaxDeg, 'a tilt beyond the declared limit is refused down to the limit, not obeyed');
  const g2 = command(initGimbal(turret), SPEC, 0, -999);
  ok(g2.cmdEl === SPEC.tiltMinDeg, 'and the same at the bottom of travel');
}
ok(shortestTurn(350, 10) === 20, 'a turn across north is 20 degrees, not 340');
ok(shortestTurn(10, 350) === -20, 'and the same the other way');
ok(normAz(-90) === 270, 'azimuth is always reported 0..360');
{
  let g = command(initGimbal({ ...turret, homeAz: 0, homeEl: 0 }), SPEC, 180, 0);
  ok(!onTarget(g), 'a gimbal that has been commanded but not yet moved is NOT on target');
  for (let i = 0; i < 10; i++) g = slew(g, SPEC, 1);
  ok(onTarget(g), `after ${180 / SPEC.slewDegPerSec}s of slew at ${SPEC.slewDegPerSec}°/s it arrives`);
  ok(g.az === 180, 'and stops exactly on the command, never past it');
}
{
  const v = aimVector(0, 0), e = aimVector(90, 0), u = aimVector(0, 90);
  ok(Math.abs(v[1] - 1) < 1e-9, 'azimuth 0 points north');
  ok(Math.abs(e[0] - 1) < 1e-9, 'azimuth 90 points east');
  ok(Math.abs(u[2] - 1) < 1e-9, 'elevation 90 points up');
}

// ── the frame test ────────────────────────────────────────────────────────────────────────────────
const eye = eyeOf(turret, ground);
ok(eye[2] > 160, `the turret stands on its ground, not at sea level (${eye[2].toFixed(1)} m)`);
{
  const d = doors[0];
  const a = aimAt(eye, d.at);
  let g = command(initGimbal(turret), SPEC, a.az, a.el);
  for (let i = 0; i < 20; i++) g = slew(g, SPEC, 1);
  ok(inFrame(eye, g, SPEC, d.at).inFrame, 'a door the gimbal is aimed at is in frame');
  const off = command(g, SPEC, a.az + 90, a.el);
  ok(!inFrame(eye, { ...off, az: off.cmdAz, el: off.cmdEl }, SPEC, d.at).inFrame, 'and is out of frame 90° away');
}
{
  // I-10 — out of range is REFUSED, not clamped into range.
  const far = [eye[0], eye[1] + SPEC.rangeM + 500, eye[2]];
  const r = inFrame(eye, initGimbal(turret), SPEC, far);
  ok(r.tooFar && !r.inFrame, 'a point beyond the declared range is out of frame and says so');
  const near = [eye[0] + 0.5, eye[1], eye[2]];
  ok(inFrame(eye, initGimbal(turret), SPEC, near).tooNear, 'and a point inside the near limit likewise');
}

// ── DRN-05 · LINE OF SIGHT ────────────────────────────────────────────────────────────────────────
ok(pointInPoly([0, 0], [[-1, -1], [1, -1], [1, 1], [-1, 1]]), 'a point inside a square is inside it');
ok(!pointInPoly([2, 0], [[-1, -1], [1, -1], [1, 1], [-1, 1]]), 'and a point outside is not');
{
  const clear = lineOfSight(eye, [eye[0], eye[1] + 30, eye[2]], ground, [], {});
  ok(clear.clear, 'an empty stretch of lawn is clear');
  const capitol = prisms.find((p) => p.id === 'capitol');
  // Shoot from the south turret THROUGH the Capitol to a point on its far side.
  const beyond = [0, 260, eye[2]];
  const blocked = lineOfSight(eye, beyond, ground, prisms, {});
  ok(!blocked.clear, 'a line drawn through the Capitol is blocked');
  ok(blocked.block?.by === 'building' && blocked.block.id === 'capitol', `and names the Capitol as what blocked it (${JSON.stringify(blocked.block)})`);
  ok(/in the way/.test(losReason(blocked, (id) => DRONE_DOMAIN.buildings.find((b) => b.id === id)?.label ?? id)),
     'the reason reads as a sentence about the world, not a data structure');
  ok(capitol && blocked.block.atM > 0 && blocked.block.atM < blocked.rangeM, 'the block is reported at a real distance along the line');
}
{
  // A building never blocks its OWN door — the door is on that wall by construction.
  const d = doors.find((x) => x.buildingId === 'capitol');
  const r = lineOfSight(eye, d.at, ground, prisms, { ignore: 'capitol' });
  ok(r.clear || r.block?.id !== 'capitol', 'the Capitol does not block its own door');
}
{
  const t = transect(eye, [eye[0], eye[1] + 200, eye[2]], ground, 20);
  ok(t.length === 21 && t.every((s) => Number.isFinite(s.groundU) && Number.isFinite(s.rayU)),
     'the terrain transect is finite everywhere along the line');
}

// ── DRN-05 · POP-UP TARGETS, SEEDED ───────────────────────────────────────────────────────────────
const TSPEC = { seed: DRONE_DOMAIN.targets.seed, upMs: DRONE_DOMAIN.targets.upMs, downMs: DRONE_DOMAIN.targets.downMs, concurrent: DRONE_DOMAIN.targets.concurrent };
const s1 = buildSchedule(doors, TSPEC);
const s2 = buildSchedule(doors, TSPEC);
ok(JSON.stringify(s1) === JSON.stringify(s2), 'the same seed lays out the same round, twice');
ok(JSON.stringify(buildSchedule(doors, { ...TSPEC, seed: 1 })) !== JSON.stringify(s1), 'and a different seed lays out a different one');
ok(s1.length === doors.length, `every one of the ${doors.length} doors gets a turn`);
ok(new Set(s1.map((w) => w.doorId)).size === doors.length, 'and no door gets two');
ok(roundLengthMs(s1) > 0, 'the round has a declared length');
// A ROUND MUST BE WINNABLE BY CONSTRUCTION. Instrumenting a played round showed doors dropping while the
// gimbal was still swinging to them: the up-window was shorter than the worst swing that can reach it.
// This is the rule that prevents it, not a number someone liked.
{
  const worstSwingMs = (180 / SPEC.slewDegPerSec) * 1000;    // half a turn is the furthest a door can be
  const aimAllowanceMs = 6000;                                // see, decide, press — a person, not a script
  ok(TSPEC.upMs >= worstSwingMs + aimAllowanceMs,
     `a door stays up ${TSPEC.upMs / 1000}s, longer than the worst swing ${worstSwingMs / 1000}s plus ${aimAllowanceMs / 1000}s to aim`);
  ok(TSPEC.downMs > 0, 'and it does go down again — a target that never drops is not a target');
}
{
  const tags = emptyTags();
  const at0 = targetsAt(doors, s1, tags, 0);
  ok(at0.some((v) => v.phase === 'up'), 'something is up at the start of the round');
  ok(at0.filter((v) => v.phase === 'up').length <= TSPEC.concurrent, `no more than ${TSPEC.concurrent} are up at once`);
  const late = targetsAt(doors, s1, tags, roundLengthMs(s1) + 1);
  ok(late.every((v) => v.phase === 'missed'), 'after the round, an untouched door reads as missed');
  const tagged = targetsAt(doors, s1, { captured: new Set(), tagged: new Set([doors[0].id]) }, roundLengthMs(s1) + 1);
  ok(tagged.find((v) => v.door.id === doors[0].id).phase === 'tagged', 'a tagged door STAYS tagged after its window closes');
  ok(targetRole('tagged') === 'tagged' && targetRole('missed') === 'blocked', 'each phase has one colour role');
}

// ── I-08 · THE ROUND — a completed action is never lost ────────────────────────────────────────────
{
  const up = targetsAt(doors, s1, emptyTags(), 0).find((v) => v.phase === 'up');
  ok(Boolean(up), 'there is a target to act on');
  const clear = { clear: true, rangeM: 120, block: null, samples: 60 };
  const blocked = { clear: false, rangeM: 120, block: { by: 'building', id: 'capitol', atM: 40 }, samples: 60 };
  let g = initGame(0);

  // shoot before capture — refused, and SAID
  g = shoot(g, { tMs: 100, target: up, los: clear, onTarget: true, az: 0, el: 0 });
  ok(score(g).tagged === 0, 'a door cannot be tagged before it is captured');
  ok(g.events.at(-1).kind === 'miss' && /capture the door/.test(g.events.at(-1).why), 'and the refusal is a recorded miss with a reason');

  // capture through a building — refused, and SAID
  const before = g.events.length;
  g = capture(g, { tMs: 200, target: up, los: blocked, edges: 500, az: 0, el: 0 });
  ok(score(g).captured === 0, 'a capture through a building does not count');
  ok(g.events.length === before + 1 && /blocked/.test(g.events.at(-1).why), 'and it is recorded, never a silent no-op');

  // capture, then shoot — both counted, both recorded, in one step each
  g = capture(g, { tMs: 300, target: up, los: clear, edges: 512, az: 10, el: 5 });
  ok(score(g).captured === 1, 'a clear capture counts');
  ok(g.events.at(-1).kind === 'capture' && g.events.at(-1).edges === 512,
     'and the record carries the edge set size — a capture stores edges, not a photograph');
  g = shoot(g, { tMs: 400, target: { ...up, phase: 'captured' }, los: clear, onTarget: true, az: 10, el: 5 });
  ok(score(g).tagged === 1 && score(g).hits === 1, 'the shot lands');
  ok(g.events.at(-1).kind === 'hit', 'and the hit is on the record');

  // THE INVARIANT: for every scored action there is exactly one event, and the sequence never repeats.
  const scored = g.events.filter((e) => e.kind === 'capture' || e.kind === 'hit').length;
  ok(scored === score(g).captured + score(g).hits, 'the record and the score agree exactly — neither can move without the other');
  ok(new Set(g.events.map((e) => e.seq)).size === g.events.length, 'every event has its own sequence number');

  // shooting while still slewing is a miss with a reason, not a hit
  const other = targetsAt(doors, s1, g.tags, 0).find((v) => v.phase === 'up' && v.door.id !== up.door.id);
  if (other) {
    const h = shoot(g, { tMs: 500, target: other, los: clear, onTarget: false, az: 0, el: 0 });
    ok(/slewing/.test(h.events.at(-1).why), 'a shot taken mid-slew misses, and says why');
  } else pass++;

  // double-tag refused
  const twice = shoot(g, { tMs: 600, target: { ...up, phase: 'tagged' }, los: clear, onTarget: true, az: 10, el: 5 });
  ok(score(twice).tagged === 1, 'a door cannot be tagged twice');

  g = endRound(g, 700);
  ok(g.finished && g.events.at(-1).kind === 'end', 'the round closes on the record');
  ok(score(endRound(g, 800)).tagged === score(g).tagged, 'closing a closed round changes nothing');

  const b = bundle(g, { version: '00.00', revision: '0.001', modelHash: 'abc', seed: TSPEC.seed, mount: turret.id }, doors);
  ok(b.events.length === g.events.length && b.doors.length === doors.length, 'the replay bundle carries every event and every door');
  ok(b.seed === TSPEC.seed, 'and the seed, so the round can be laid out again exactly');
  ok(transcript(g).length === g.events.length, 'the transcript is one line per event — the score showing its working');
}

console.log(`\ndrone-gimbal: ${pass} passed, ${fail} failed · ${doors.length} doors · round ${(roundLengthMs(s1) / 1000).toFixed(0)}s`);
process.exit(fail ? 1 : 0);
