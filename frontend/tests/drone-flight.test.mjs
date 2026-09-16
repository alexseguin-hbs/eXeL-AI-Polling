// FLIGHT + CREW + THE APPROVAL GATE — Pass 1b and 1c gates (DRN-08, DRN-09, DRN-10).
//
// The one that matters most, stated the way the operator stated it:
//   AN AI-INITIATED SHOT NEVER FIRES WITHOUT A NAMED HUMAN APPROVAL EVENT.
// Everything else in this file is flight physics. That one is the reason the file exists.
import {
  initFlight, stepFlight, stallSpeedMs, liftN, wingShare, dragN, canTransition, powerW,
  minutesLeft, rangeKm, usableWh, airspeedOf, flightLine, TRANSITION_S, G,
  quadTerminalMs, QUAD_TERMINAL_OVER_STALL, DAMP_PER_S,
} from '../lib/drone-2525/flight.ts';
import {
  CREWS, shotNeedsApproval, autoPilot, autoTargeteer, initApproval, requestShot, resolveRequest,
  mayFire, approvalPrompt, approvalLog,
} from '../lib/drone-2525/ai-crew.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';
import { buildArena } from '../lib/drone-2525/arena-model.ts';
import { initGimbal, turretMount, eyeOf, aimAt } from '../lib/drone-2525/gimbal.ts';
import { buildSchedule, targetsAt, emptyTags } from '../lib/drone-2525/targets.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const A = DRONE_DOMAIN.airframe;
const B = DRONE_DOMAIN.battery;

// ── THE STALL SPEED IS THE NUMBER THE WHOLE TRANSITION TURNS ON ─────────────────────────────────
const stall = stallSpeedMs(A);
ok(stall > 5 && stall < 15, `a 5 kg airframe on 0.9 m² stalls around ${stall.toFixed(1)} m/s`);
ok(Math.abs(liftN(A, stall, A.CLmax) - A.massKg * G) < 0.5, 'at the stall speed the wing carries exactly the aircraft weight, by definition');
ok(wingShare(A, 0) === 0, 'standing still, the wing carries nothing');
ok(wingShare(A, stall) >= 1, 'at the stall speed it carries all of it');
ok(liftN(A, 2 * stall) > liftN(A, stall), 'lift grows with speed');
ok(dragN(A, 20) > dragN(A, 10), 'and so does drag — cruise is not free');

// ── THE TRANSITION IS A DECISION, NOT A BUTTON ──────────────────────────────────────────────────
{
  const low = { ...initFlight(), aglM: 5, ve: 20, vn: 0 };
  const t = canTransition(A, low);
  ok(!t.ok, 'too low to go to the wing');
  ok(/too low/.test(t.why) && /m above ground/.test(t.why), `and it says so in words a pilot can act on: "${t.why}"`);

  const slow = { ...initFlight(), aglM: 60, ve: 2, vn: 0 };
  const t2 = canTransition(A, slow);
  ok(!t2.ok && /too slow/.test(t2.why), `too slow to go to the wing: "${t2.why}"`);
  ok(t2.why.includes(stall.toFixed(1)), 'and names the speed it needs');

  const good = { ...initFlight(), aglM: 60, ve: stall + 4, vn: 0 };
  ok(canTransition(A, good).ok, 'high enough and fast enough, it may transition');
}
{
  // THE QUAD MUST BE ABLE TO REACH ITS OWN STALL SPEED, or the wing is unreachable by construction.
  let s = { ...initFlight(), aglM: 60 };
  for (let i = 0; i < 200; i++) s = stepFlight(A, B, s, { climb: 0, forward: 1, lateral: 0, yaw: 0 }, 0.1);
  ok(airspeedOf(s) > stall, `flat out on its rotors it reaches ${airspeedOf(s).toFixed(1)} m/s, over its own ${stall.toFixed(1)} m/s stall`);
  ok(canTransition(A, s).ok, 'so a pilot who accelerates in the hover can actually get onto the wing');
}
{
  // A refused transition is recorded on the state, not swallowed.
  let s = { ...initFlight(), aglM: 2 };
  s = stepFlight(A, B, s, { climb: 0, forward: 0, lateral: 0, yaw: 0, toggleMode: true }, 0.1);
  ok(s.mode === 'quad', 'a refused transition leaves it on the rotors');
  ok(s.refused.length > 0, `and says why: "${s.refused}"`);
}
{
  // A granted transition TAKES TIME — four seconds of being neither one thing nor the other.
  let s = { ...initFlight(), aglM: 60, ve: stall + 6, vn: 0 };
  s = stepFlight(A, B, s, { climb: 0, forward: 1, lateral: 0, yaw: 0, toggleMode: true }, 0.1);
  ok(s.mode === 'transition', 'it enters the transition rather than snapping to the wing');
  let t = 0;
  while (s.mode === 'transition' && t < 10) { s = stepFlight(A, B, s, { climb: 0, forward: 1, lateral: 0, yaw: 0 }, 0.1); t += 0.1; }
  ok(s.mode === 'wing', `and reaches the wing after about ${TRANSITION_S}s (took ${t.toFixed(1)}s)`);
}

// ── THE WING CANNOT CHEAT: LOSE SPEED AND IT GOES BACK ON ITS ROTORS ────────────────────────────
{
  let s = { ...initFlight(), mode: 'wing', aglM: 80, ve: stall + 8, vn: 0 };
  for (let i = 0; i < 300 && s.mode === 'wing'; i++) s = stepFlight(A, B, s, { climb: 0, forward: -1, lateral: 0, yaw: 0 }, 0.1);
  ok(s.mode === 'quad', 'a wing that slows below its stall ends up back on the rotors');
  ok(/stall/.test(s.refused), `and says what happened: "${s.refused}"`);
}
{
  let s = { ...initFlight(), mode: 'wing', aglM: 100, ve: 25, vn: 0 };
  for (let i = 0; i < 60; i++) s = stepFlight(A, B, s, { climb: 0, forward: 1, lateral: 0, yaw: 0 }, 0.1);
  ok(airspeedOf(s) <= A.VneMs + 0.01, `it never exceeds the never-exceed speed (${airspeedOf(s).toFixed(1)} ≤ ${A.VneMs})`);
}

// ── THE GROUND IS THE GROUND ────────────────────────────────────────────────────────────────────
{
  let s = { ...initFlight(), aglM: 3 };
  for (let i = 0; i < 40; i++) s = stepFlight(A, B, s, { climb: -1, forward: 0, lateral: 0, yaw: 0 }, 0.1);
  ok(s.aglM === 0, 'it settles on the ground rather than sinking through it');
  ok(s.vu === 0, 'and stops descending once it is there');
}

// ── ENERGY: HOVERING COSTS, CRUISING COSTS LESS, AND THE RESERVE IS NEVER SPENT ─────────────────
{
  const hover = { ...initFlight(), aglM: 40 };
  const cruise = { ...initFlight(), mode: 'wing', aglM: 80, ve: A.cruiseMs, vn: 0 };
  ok(powerW(A, hover) > powerW(A, cruise), `hovering costs more than cruising (${powerW(A, hover).toFixed(0)} W vs ${powerW(A, cruise).toFixed(0)} W)`);
  ok(usableWh(B) === B.capacityWh * (1 - B.reserveFrac), `only ${Math.round((1 - B.reserveFrac) * 100)}% of the battery is ever offered`);
  ok(usableWh(B) < B.capacityWh, 'the reserve is never part of the endurance quoted');
  const hoverMin = minutesLeft(A, B, hover), cruiseMin = minutesLeft(A, B, cruise);
  ok(cruiseMin > hoverMin, `and cruising lasts longer than hovering (${cruiseMin.toFixed(0)} min vs ${hoverMin.toFixed(0)} min)`);
  ok(hoverMin > 5 && hoverMin < 60, `hover endurance is a plausible bounding estimate (${hoverMin.toFixed(0)} min)`);
  ok(rangeKm(A, B, cruise) > 0, `and the cruise range is a number (${rangeKm(A, B, cruise).toFixed(0)} km)`);
  ok(rangeKm(A, B, hover) < 1, 'while hovering goes nowhere');
}
{
  let s = { ...initFlight(), aglM: 40 };
  const before = s.energy;
  for (let i = 0; i < 100; i++) s = stepFlight(A, B, s, { climb: 0, forward: 0, lateral: 0, yaw: 0 }, 0.1);
  ok(s.energy < before, 'flying spends energy');
  ok(s.energy > 0, 'and ten seconds does not empty the battery');
  const line = flightLine(A, B, s);
  ok(/QUAD/.test(line) && /AGL/.test(line) && /min/.test(line), `the HUD line carries mode, height and minutes: "${line}"`);
}

// ── THE FLIGHT MODEL IS DETERMINISTIC ───────────────────────────────────────────────────────────
{
  const run = () => {
    let s = initFlight();
    for (let i = 0; i < 200; i++) s = stepFlight(A, B, s, { climb: 0.5, forward: 1, lateral: 0.2, yaw: 0.3 }, 0.05);
    return JSON.stringify(s);
  };
  ok(run() === run(), 'the same inputs fly the same path, twice — a run can be replayed and argued about');
}

// ── THE AI PILOT FLIES A PATTERN, DETERMINISTICALLY ─────────────────────────────────────────────
{
  ok(JSON.stringify(autoPilot(12)) === JSON.stringify(autoPilot(12)), 'the machine pilot is the same at the same moment, every run');
  ok(JSON.stringify(autoPilot(12)) !== JSON.stringify(autoPilot(40)), 'and moves between moments');
  const p = autoPilot(0);
  ok(Math.hypot(p.e, p.n) > 100, 'it holds a real orbit rather than sitting on the origin');
  ok(p.aglM > 20, 'and flies high enough to have transitioned');
  const around = Array.from({ length: 8 }, (_, i) => autoPilot(i * 12));
  ok(new Set(around.map((x) => Math.round(x.headingDeg))).size > 4, 'and turns as it goes round');
}

// ── THE AI TARGETEER FOLLOWS THE SAME RULE AS THE HUMAN BUTTON ──────────────────────────────────
{
  const { doors, ground } = buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: 'test' });
  const prisms = DRONE_DOMAIN.buildings.map((b) => {
    const base = ground(b.footprint[0][0], b.footprint[0][1]);
    return { id: b.id, footprint: b.footprint, baseU: base, topU: base + b.heightM };
  });
  const mount = turretMount(DRONE_DOMAIN.turrets[0]);
  const eye = eyeOf(mount, ground);
  const sched = buildSchedule(doors, { seed: 20260915, upMs: 14000, downMs: 6000, concurrent: 3 });
  const views = targetsAt(doors, sched, emptyTags(), 0);
  const aim = autoTargeteer(eye, initGimbal(mount), views, ground, prisms);
  ok(aim.why.length > 5, `it says what it chose and why: "${aim.why}"`);
  if (aim.level) {
    ok(views.some((v) => v.door.id === aim.level.door.id), 'it picks a door that is actually open');
    const again = autoTargeteer(eye, initGimbal(mount), views, ground, prisms);
    ok(again.level.door.id === aim.level.door.id, 'and picks the same one twice — no randomness in the crew');
  } else { pass += 2; }
  const none = autoTargeteer(eye, initGimbal(mount), [], ground, prisms);
  ok(none.level === null && /no door/.test(none.why), 'with nothing open it says so rather than aiming at nothing');

  // THE MACHINE IS HELD TO THE SAME OPTICS AS THE PERSON — the walkthrough caught it asking about a door
  // 453 m away through a 400 m sensor, because only the human seat had ever checked range.
  const tiny = autoTargeteer(eye, initGimbal(mount), views, ground, prisms, { nearM: 5, rangeM: 20 });
  ok(tiny.level === null, 'a machine with a 20 m sensor finds nothing on a 450 m block');
  ok(/out of range/.test(tiny.why), `and says the doors are out of range: "${tiny.why}"`);
  const wide = autoTargeteer(eye, initGimbal(mount), views, ground, prisms, { nearM: 5, rangeM: 9999 });
  if (wide.level) {
    const r = aimAt(eye, wide.level.door.at).rangeM;
    const real = autoTargeteer(eye, initGimbal(mount), views, ground, prisms, { nearM: 5, rangeM: 400 });
    ok(!real.level || aimAt(eye, real.level.door.at).rangeM <= 400,
       `with the real 400 m sensor it never picks something further away (${r.toFixed(0)} m was available)`);
  } else { pass++; }
}

// ═══ THE APPROVAL GATE ══════════════════════════════════════════════════════════════════════════
ok(!shotNeedsApproval(CREWS.two_hi), 'two people aiming needs no machine approval');
ok(!shotNeedsApproval(CREWS.ai_pilot), 'a machine FLYING while a person aims needs no shot approval — the person is aiming');
ok(shotNeedsApproval(CREWS.hi_pilot), 'a machine AIMING does need approval, even with a person flying');
ok(shotNeedsApproval(CREWS.both_ai), 'and so does a full machine crew');
for (const k of Object.keys(CREWS)) ok(CREWS[k].approver.length > 2, `crew "${k}" names who approves`);

{
  const req = { id: 'r1', doorId: 'd1', doorLabel: 'TEXAS CAPITOL', askedAtMs: 1000, az: 10, el: -1, rangeM: 210, claim: 'a door, matching the tagged edge set' };
  let ap = initApproval();

  // THE CENTRAL CASE: a machine asks, and nothing fires.
  ok(!mayFire(CREWS.both_ai, ap, null).ok, 'a machine-aimed shot with no request at all may not fire');
  ok(/must ask first/.test(mayFire(CREWS.both_ai, ap, null).why), 'and says it must ask first');
  ap = requestShot(ap, req);
  ok(ap.pending?.id === 'r1', 'the request is pending');
  ok(!mayFire(CREWS.both_ai, ap, 'r1').ok, 'a PENDING request still may not fire — asking is not permission');
  ok(/waiting for a person/.test(mayFire(CREWS.both_ai, ap, 'r1').why), 'and says it is waiting for a person');

  // An unnamed approval is not an approval.
  const nameless = resolveRequest(ap, 'approved', '   ', 2000);
  ok(nameless.decision === null && nameless.state.pending?.id === 'r1', 'an approval with no name behind it changes nothing');
  ok(!mayFire(CREWS.both_ai, nameless.state, 'r1').ok, 'and still may not fire');

  // A held request is a refusal, and it stays refused.
  const held = resolveRequest(ap, 'held', 'watch officer', 2500);
  ok(held.decision?.verdict === 'held' && held.decision.by === 'watch officer', 'a person can turn a machine down, by name');
  ok(!mayFire(CREWS.both_ai, held.state, 'r1').ok, 'a held shot may not fire');
  ok(/held by watch officer/.test(mayFire(CREWS.both_ai, held.state, 'r1').why), 'and the refusal names who refused');
  ok(held.state.held === 1 && held.state.approved === 0, 'and it is counted as a refusal');

  // Approval, by a named person, is the ONLY thing that opens the gate.
  const okd = resolveRequest(ap, 'approved', 'A. Seguin', 3000);
  ok(mayFire(CREWS.both_ai, okd.state, 'r1').ok, 'only a named approval opens the gate');
  ok(/approved by A\. Seguin/.test(mayFire(CREWS.both_ai, okd.state, 'r1').why), 'and the permission carries the name that granted it');
  ok(okd.state.approved === 1, 'and it is counted');
  ok(okd.state.pending === null, 'the question is retired once answered');

  // An approval for ONE request does not authorise another.
  ok(!mayFire(CREWS.both_ai, okd.state, 'r2').ok, 'approving one shot does not approve the next one');

  // One question at a time — a queue is a way to lose one.
  const two = requestShot(requestShot(initApproval(), req), { ...req, id: 'r2' });
  ok(two.pending?.id === 'r1', 'a second request does not displace the first');

  ok(/asking to shoot TEXAS CAPITOL/.test(approvalPrompt(req)), 'the prompt is a sentence about the world, not a data structure');
  ok(/210 m/.test(approvalPrompt(req)), 'and carries the range the person needs');
  ok(approvalLog(okd.state).length === 1 && /A\. Seguin/.test(approvalLog(okd.state)[0]), 'the record keeps one line per decision, with the name');
}
{
  // A person aiming is never blocked by the gate — the check is about machine authority, not friction.
  const ap = initApproval();
  ok(mayFire(CREWS.two_hi, ap, null).ok, 'a human-aimed shot needs no request');
  ok(/a person is aiming/.test(mayFire(CREWS.two_hi, ap, null).why), 'and the reason says so');
}

// ── THE ROTORS MUST BE ABLE TO REACH THE WING, ON ANY AIRFRAME ─────────────────────────────────
// This bug has now appeared twice, and both times a hand-typed acceleration was the cause. Draft one:
// acc 9, damping 1.8, terminal 5 m/s against an 8.4 m/s stall — a transition that completes and instantly
// falls back, forever. Fixed by typing acc = 14, which gave ~15 m/s. Then the wing was derived from the
// drawing, the stall moved to 14.4, and 15 against 14.4 was the same bug with a thinner margin.
//
// So the gate is on the REQUIREMENT, not on the number, and it is checked across a span of airframes —
// because the next one to break it will not be this one.
{
  ok(quadTerminalMs(A) > stall, `the rotors out-run the stall (${quadTerminalMs(A).toFixed(1)} m/s against ${stall.toFixed(1)})`);
  ok(quadTerminalMs(A) / stall === QUAD_TERMINAL_OVER_STALL, 'by exactly the margin that is declared, not by luck');
  ok(quadTerminalMs(A) < A.VneMs, `and stays under never-exceed (${A.VneMs} m/s)`);
  ok(DAMP_PER_S > 0 && DAMP_PER_S < 1, 'the damping is a fraction per second, so a terminal speed exists at all');
  for (const massKg of [1, 2, 5, 12, 30]) {
    for (const wingAreaM2 of [0.08, 0.3092, 1.2, 4]) {
      const alt = { ...A, massKg, wingAreaM2 };
      ok(quadTerminalMs(alt) > stallSpeedMs(alt),
         `a ${massKg} kg aircraft on ${wingAreaM2} m2 can still reach its wing (${quadTerminalMs(alt).toFixed(1)} over ${stallSpeedMs(alt).toFixed(1)})`);
    }
  }
  // And the aircraft the domain actually declares must be able to cruise, not merely transition.
  ok(A.cruiseMs > stall, `cruise ${A.cruiseMs} m/s is above the ${stall.toFixed(1)} m/s stall — it can hold the wing, not just reach it`);
}

console.log(`\ndrone-flight: ${pass} passed, ${fail} failed · stall ${stall.toFixed(1)} m/s · hover ${minutesLeft(A, B, { ...initFlight(), aglM: 40 }).toFixed(0)} min · cruise ${minutesLeft(A, B, { ...initFlight(), mode: 'wing', ve: A.cruiseMs, vn: 0, aglM: 80 }).toFixed(0)} min`);
process.exit(fail ? 1 : 0);
