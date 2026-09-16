// THE BEAM, THE SHIELD, AND THE TIME IT TAKES — the gate for Drone-2525's engagement rules.
//
// Three claims are being held here, and each one is a design decision that a later edition could quietly
// reverse:
//
//   1. RANGE IS THE THING THAT MATTERS. A hit-point model would make the beam a trigger. A fluence model
//      makes you close. If the dwell curve ever goes flat with range, the game has lost its shape.
//   2. YOU MUST HOLD IT. Flicking between targets must achieve nothing. If a broken beam kept its progress,
//      the Independence Day rule and the Battle House sensor would both be gone.
//   3. NOTHING IS DESTROYED IN THE AIR. A defeated aircraft is disabled and flown down under control. The
//      physical end of this programme is real machines over real floors with real people underneath, so
//      "there is no state called destroyed" is a safety property, not a stylistic one.
import {
  WAVELENGTH_NM, initDamage, lockFraction, spotRadiusM, transmission, irradianceWcm2,
  dwellToShieldDownS, dwellToDisableS, applyBeam, stepDescent, secondsToGround,
  beamStage, STAGE_ROLE, STAGE_WEIGHT, shieldRingFrac, engagementLine, downedCount,
  DESCENT_MS, TOUCHDOWN_AGL_M,
} from '../lib/drone-2525/laser.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';
import { SEMANTIC } from '../lib/wire-core/palette.ts';
import { VECTOR_LAW } from '../lib/wire-core/vector-law.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const near = (a, b, t) => Math.abs(a - b) <= t;

const B = DRONE_DOMAIN.beam;
const D = DRONE_DOMAIN.defences;
/**
 * Hold the beam for this long, in ticks of dt, and report where it got to.
 *
 * The tick count is an INTEGER, not an accumulating float. Written the obvious way — `for (t = 0; t <
 * seconds; t += dtS)` — 2.0 s at dt 0.2 runs ELEVEN ticks, because the accumulated t lands on
 * 1.9999999999999998 and passes the test one more time. That made a coarse tick deliver 10% more energy
 * than a fine one and it looked like a bug in the module. It was a bug in this helper.
 */
const hold = (s, seconds, { rangeM = 300, dtS = 0.05, onTarget = true } = {}) => {
  let st = s;
  const n = Math.round(seconds / dtS);
  for (let i = 0; i < n; i++) st = applyBeam(st, B, D, { rangeM, dtS, onTarget, tMs: i * dtS * 1000 });
  return st;
};

// ── THE EMITTER IS A DECLARED CLASS, NOT "A LASER" ──────────────────────────────────────────────
ok(WAVELENGTH_NM === 1064, 'the emitter is Nd:YAG class at 1064 nm, as the operator named');
ok(B.wavelengthNm === WAVELENGTH_NM, 'and the domain and the module agree on it');
ok(/BOUNDING ESTIMATE/i.test(B.note), 'the figures are marked as bounding estimates, on every run');
ok(/not a real weapon/i.test(B.note), 'and explicitly not a real weapon');

// ── 1 · RANGE IS THE THING THAT MATTERS ─────────────────────────────────────────────────────────
{
  ok(spotRadiusM(B, 0) === B.apertureRadiusM, 'at the aperture the spot is the aperture');
  ok(spotRadiusM(B, 1000) > spotRadiusM(B, 100), 'and it grows with range — this is why range matters at all');
  ok(transmission(B, 0) === 1, 'nothing is lost across no air');
  ok(transmission(B, 700) < 1 && transmission(B, 700) > 0.5, `and some is lost across 700 m (${transmission(B, 700).toFixed(3)})`);

  let prev = Infinity;
  for (const r of [50, 100, 200, 300, 400, 500, 600, 700]) {
    const e = irradianceWcm2(B, r);
    ok(e < prev, `irradiance falls with range (${r} m → ${e.toFixed(3)} W/cm²)`);
    prev = e;
  }
  const close = dwellToDisableS(B, D, 100), far = dwellToDisableS(B, D, 600);
  ok(far > close * 5, `a kill at 600 m costs ${(far / close).toFixed(0)}× the dwell of one at 100 m — you must close`);
  ok(close < 1.5, `and in close it is fast (${close.toFixed(2)} s), or nobody would ever close`);

  // Refused past the declared maximum, not merely weak. A weapon that trails off to nothing has no range.
  ok(irradianceWcm2(B, B.maxRangeM + 1) === 0, 'past the declared maximum the emitter does not fire at all');
  ok(dwellToDisableS(B, D, B.maxRangeM + 1) === Infinity, 'so the dwell there is not a big number, it is never');

  // The published table must be what the model computes. A doc that drifts from the code is worse than none.
  for (const t of B.dwellTable) {
    ok(near(irradianceWcm2(B, t.rangeM), t.irradianceWcm2, 0.002), `the published irradiance at ${t.rangeM} m is what the model gives`);
    ok(near(dwellToDisableS(B, D, t.rangeM), t.disableS, 0.02), `and so is the published disable time (${t.disableS} s)`);
    ok(near(dwellToShieldDownS(B, D, t.rangeM), t.shieldDownS, 0.02), `and the shield-down time (${t.shieldDownS} s)`);
  }
}

// ── 2 · THE SHIELD COMES DOWN FIRST, AND YOU MUST HOLD IT ───────────────────────────────────────
{
  const s0 = initDamage(D, 120);
  ok(s0.shield === D.shieldJcm2 && s0.hull === 0 && s0.condition === 'flying', 'an aircraft starts whole and flying');

  // Independence Day: nothing reaches the airframe while the shield holds.
  const early = hold(s0, dwellToShieldDownS(B, D, 300) * 0.5, { rangeM: 300 });
  ok(early.hull === 0, 'halfway through the shield, NOTHING has reached the airframe');
  ok(early.shield > 0 && early.shield < D.shieldJcm2, `and the shield has been spent down to ${early.shield.toFixed(2)} J/cm²`);
  ok(early.condition === 'flying', 'it is still flying');

  const downed = hold(s0, dwellToShieldDownS(B, D, 300) + 0.1, { rangeM: 300 });
  ok(downed.shield === 0, 'held long enough, the shield fails');
  ok(downed.condition === 'shieldDown', 'and it says so');
  ok(downed.hull > 0, 'and only THEN does heat begin to reach the airframe');

  const dead = hold(s0, dwellToDisableS(B, D, 300) + 0.2, { rangeM: 300 });
  ok(dead.condition === 'disabled', `held all the way through, it is disabled (${dwellToDisableS(B, D, 300).toFixed(2)} s at 300 m)`);
  ok(dead.disabledAtMs !== null, 'and the moment is recorded, so a round replays it');

  // A tick never spends more than it delivered — the overflow is computed, not approximated. The expected
  // figure includes the lock ramp, integrated across the tick exactly as the module does it.
  const oneBig = applyBeam(initDamage(D, 120), B, D, { rangeM: 100, dtS: 0.25, onTarget: true, tMs: 0 });
  const ramp = (lockFraction(B, 0) + lockFraction(B, 0.25)) / 2;
  const delivered = irradianceWcm2(B, 100) * 0.25 * ramp;
  ok(near((D.shieldJcm2 - oneBig.shield) + oneBig.hull, delivered, 1e-9),
     'energy is conserved across the shield boundary inside a single tick');

  // And the answer does not depend on how finely the caller ticks, or a slower machine would fight harder.
  const coarse = hold(initDamage(D, 120), 2.0, { rangeM: 300, dtS: 0.2 });
  const fine = hold(initDamage(D, 120), 2.0, { rangeM: 300, dtS: 0.01 });
  ok(near(coarse.shield, fine.shield, 0.02), `a coarse tick and a fine one agree (${coarse.shield.toFixed(3)} vs ${fine.shield.toFixed(3)})`);
}
{
  // THE HOLD. This is the rule that makes it a game rather than a trigger.
  const s0 = initDamage(D, 120);
  const halfWay = hold(s0, 1.0, { rangeM: 300 });
  ok(halfWay.dwellS > 0.9, 'a second of beam counts as a second of dwell');
  const brokenOff = applyBeam(halfWay, B, D, { rangeM: 300, dtS: 0.05, onTarget: false, tMs: 1100 });
  ok(brokenOff.dwellS === 0, 'the instant the beam comes off, the dwell is gone');

  // And the shield comes back — after a delay, so a flicker is not a tactic.
  const justOff = hold(brokenOff, D.shieldRegenDelayS * 0.5, { onTarget: false });
  ok(near(justOff.shield, brokenOff.shield, 1e-9), 'inside the regeneration delay nothing comes back yet');
  const rested = hold(brokenOff, D.shieldRegenDelayS + 2, { onTarget: false });
  ok(rested.shield > brokenOff.shield, `left alone, the shield recovers (${brokenOff.shield.toFixed(2)} → ${rested.shield.toFixed(2)})`);
  const longRest = hold(brokenOff, 60, { onTarget: false });
  ok(longRest.shield === D.shieldJcm2, 'and it recovers to full, never past it');
  ok(longRest.hull === 0, 'and the airframe cools all the way back down too');

  // The flicker test: the same total beam time, delivered in broken bursts, achieves materially less.
  // THE FLICKER TEST, and the reason the fine-track lock exists. The first edition of this module claimed
  // "you must hold the beam" and did not make it so: energy was energy, so the same total beam time
  // delivered in flicks did exactly as much damage as held. The gate caught the gap between the claim and
  // the code, and the lock is what closed it. Both runs below get the SAME 2.0 s of beam.
  let flick = initDamage(D, 120);
  for (let i = 0; i < 80; i++) flick = applyBeam(flick, B, D, { rangeM: 300, dtS: 0.05, onTarget: i % 2 === 0, tMs: i * 50 });
  const steady = hold(initDamage(D, 120), 2.0, { rangeM: 300 });
  const spent = (x) => (D.shieldJcm2 - x.shield) + x.hull;
  ok(spent(flick) < spent(steady) * 0.6,
     `two seconds of beam delivered in flicks lands ${(spent(flick) / spent(steady) * 100).toFixed(0)}% of what two held seconds do`);
  ok(lockFraction(B, 0.05) < 0.2, `a freshly acquired beam is barely delivering (${(lockFraction(B, 0.05) * 100).toFixed(0)}% at 50 ms)`);
  ok(lockFraction(B, B.lockS) === 1, `and is at full power once the director has settled (${B.lockS} s)`);
}

// ── 3 · NOTHING IS DESTROYED IN THE AIR ─────────────────────────────────────────────────────────
{
  const dead = hold(initDamage(D, 120), dwellToDisableS(B, D, 200) + 0.5, { rangeM: 200 });
  ok(dead.condition === 'disabled', 'a defeated aircraft is DISABLED');
  ok(dead.aglM === 120, 'and it is still in the air at the instant of defeat, not gone');

  // More beam on a disabled aircraft does nothing at all. There is no way to make a descent worse.
  const beaten = hold(dead, 30, { rangeM: 50 });
  ok(beaten.aglM === dead.aglM && beaten.hull === dead.hull,
     'thirty more seconds of beam at fifty metres changes nothing about an aircraft already coming down');

  let s = dead, ticks = 0;
  while (s.condition !== 'grounded' && ticks < 10000) { s = stepDescent(s, 0.05); ticks++; }
  ok(s.condition === 'grounded', 'it reaches the ground');
  ok(s.aglM <= TOUCHDOWN_AGL_M, `and it is on the ground when it says so (${s.aglM.toFixed(2)} m)`);
  const expected = (120 - TOUCHDOWN_AGL_M) / DESCENT_MS;
  ok(near(ticks * 0.05, expected, 0.2), `the way down takes the ${expected.toFixed(0)} s the declared rate says it should`);
  ok(DESCENT_MS < 3, `and it descends slowly (${DESCENT_MS} m/s) — the physical end of this is real machines over real floors`);
  ok(near(secondsToGround(dead), expected, 0.2), 'and a round can ask in advance how long it will need');
  ok(secondsToGround(s) === 0, 'a grounded aircraft needs no more time');

  // The word that must not exist.
  const conditions = new Set();
  let probe = initDamage(D, 90);
  for (let i = 0; i < 400; i++) { probe = applyBeam(probe, B, D, { rangeM: 150, dtS: 0.05, onTarget: true, tMs: i * 50 }); conditions.add(probe.condition); }
  for (let i = 0; i < 4000; i++) { probe = stepDescent(probe, 0.05); conditions.add(probe.condition); }
  ok(!conditions.has('destroyed'), 'no reachable state is called destroyed');
  ok([...conditions].every((c) => ['flying', 'shieldDown', 'disabled', 'descending', 'grounded'].includes(c)),
     `every state reached is one of the five declared (${[...conditions].join(', ')})`);
}

// ── THE LIGHTING, INSIDE THE VECTOR LAW ─────────────────────────────────────────────────────────
{
  const stages = ['idle', 'tracking', 'absorbing', 'shieldDown', 'burning', 'descending', 'grounded'];
  for (const st of stages) {
    ok(st in STAGE_ROLE, `${st} has a colour role`);
    ok(SEMANTIC[STAGE_ROLE[st]] !== undefined, `${st}'s role "${STAGE_ROLE[st]}" is one the palette actually defines`);
    ok(st in STAGE_WEIGHT && VECTOR_LAW.stroke[STAGE_WEIGHT[st]] !== undefined,
       `${st}'s weight "${STAGE_WEIGHT[st]}" is one the vector law declares`);
  }
  // The effect is colour and weight, because glow and gradient are forbidden on this surface.
  ok(STAGE_WEIGHT.shieldDown === 'bold' && STAGE_WEIGHT.tracking === 'hairline',
     'the beam visibly thickens as it bites — the pulse IS the effect, since bloom is against the law');
  ok(STAGE_ROLE.burning === 'ray' && STAGE_ROLE.descending === 'blocked',
     'red is reserved for the shot and infrared for what is already beaten, as U-WF-11 requires');

  const s0 = initDamage(D, 100);
  ok(beamStage(s0, false) === 'idle', 'no beam, no stage');
  ok(beamStage(s0, true) === 'tracking', 'the first instant of beam is tracking');
  ok(beamStage(hold(s0, 0.5, { rangeM: 300 }), true) === 'absorbing', 'while the shield is being spent it is absorbing');
  // Derived, not typed: the moment heat first reaches the airframe is whatever the model says it is.
  ok(beamStage(hold(s0, dwellToShieldDownS(B, D, 300) + 0.2, { rangeM: 300 }), true) === 'burning',
     'once heat reaches the airframe it is burning');
  ok(beamStage(hold(s0, 10, { rangeM: 200 }), true) === 'descending', 'a disabled aircraft reads as coming down, whatever the beam does');

  // The shield ring shrinks as the shield is spent, so forty-two of them are readable as SHAPES.
  ok(shieldRingFrac(s0, D) > shieldRingFrac(hold(s0, 1.0, { rangeM: 300 }), D), 'the shield ring shrinks as the shield is spent');
  ok(shieldRingFrac(hold(s0, dwellToShieldDownS(B, D, 300) + 0.2, { rangeM: 300 }), D) < 0.65, 'and is nearly gone when the shield is');
}

// ── WHAT A PERSON READS ─────────────────────────────────────────────────────────────────────────
{
  const s0 = initDamage(D, 100);
  ok(/shield 100%/.test(engagementLine(s0, B, D, 300)), 'a fresh target reads as a full shield');
  ok(/hold \d/.test(engagementLine(s0, B, D, 300)), 'and tells the player how long to hold, in seconds');
  ok(/out of reach/.test(engagementLine(s0, B, D, B.maxRangeM + 50)), 'out of range says so in words, not in a silence');
  const dead = hold(s0, 10, { rangeM: 150 });
  ok(/coming down/.test(engagementLine(dead, B, D, 150)), 'a beaten aircraft reads as coming down');
  ok(/down and safe/.test(engagementLine({ ...dead, condition: 'grounded' }, B, D, 150)), 'and a landed one as down and safe');
  for (const line of [engagementLine(s0, B, D, 300), engagementLine(dead, B, D, 150)]) {
    ok(!/J\/cm|W\/cm|fluence|irradiance/i.test(line), `no unit a player has to convert in their head: "${line}"`);
  }
  ok(downedCount([s0, dead, { ...dead, condition: 'grounded' }]) === 2, 'the side count knows who is out');
}

// ── DETERMINISM ─────────────────────────────────────────────────────────────────────────────────
{
  const a = hold(initDamage(D, 120), 3, { rangeM: 250 });
  const b = hold(initDamage(D, 120), 3, { rangeM: 250 });
  ok(a.shield === b.shield && a.hull === b.hull && a.condition === b.condition,
     'the same beam held for the same seconds at the same range always gives the same answer');
}

console.log(`\ndrone-laser: ${pass} passed, ${fail} failed · ${B.powerW} W at ${WAVELENGTH_NM} nm · disable ${dwellToDisableS(B, D, 100).toFixed(2)}s at 100 m, ${dwellToDisableS(B, D, 400).toFixed(2)}s at 400 m · down safe at ${DESCENT_MS} m/s`);
process.exit(fail ? 1 : 0);
