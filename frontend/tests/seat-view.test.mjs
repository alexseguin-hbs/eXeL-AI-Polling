// TWO SEATS, TWO EYES — operator 2026-09-15: "make sure view from HI gimbal laser cockpit for HI pilot are
// different per dimensions of aircraft or quad."
//
// The claim being gated: the two people are not in the same place, the distance between them comes from the
// AIRCRAFT'S OWN MEASURED SIZE rather than from a constant somebody picked, and it is different on the
// rotors than it is on the wing. And a turret, which genuinely has one head, is not given a parallax it
// does not have.
//
// CORRECTED 2026-09-16. The first edition scaled by `AIRFRAME_EXTENT.lengthM`, which was the SPAN under a
// wrong name, so the crew parallax was measured across the wing. It now scales by GLYPH_UNIT_M, the
// nose-to-tail length. The old floor here — `lengthM > 20`, "that length is read from the real airframe" —
// asserted only that the aircraft was BIG, and would have failed the moment it was declared at its true
// 1.111 m foil. A proportion is what an invariant should be; a size floor is what hid the bug.
import { seatEye, seatSeparationM, seatEyeLine, SEAT_OFFSETS } from '../lib/drone-2525/seat-view.ts';
import { turretMount, airframeMount } from '../lib/drone-2525/gimbal.ts';
import { AIRFRAME_EXTENT, GLYPH_UNIT_M } from '../lib/drone-2525/airframe-glyph.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ground = () => 163;
const air = (heading = 0) => airframeMount('vtol-01', 'VTOL', [0, 0], 60, heading, -12);

// ── THE TWO SEATS ARE NOT IN THE SAME PLACE ─────────────────────────────────────────────────────
for (const mode of ['quad', 'wing']) {
  const m = air();
  const p = seatEye(m, 'pilot', mode, ground);
  const t = seatEye(m, 'targeteer', mode, ground);
  ok(p.some((v, i) => v !== t[i]), `${mode}: the pilot and the targeteer look from different points`);
  ok(p[2] > t[2], `${mode}: the pilot is above the sensor — a canopy over a slung gimbal`);
  ok(p[1] > t[1], `${mode}: and further forward, facing north`);
  const sep = seatSeparationM(m, mode, ground);
  ok(sep > 0.05 * GLYPH_UNIT_M, `${mode}: they are ${(sep * 100).toFixed(0)} cm apart — a real separation on an aircraft this size`);
  ok(sep < GLYPH_UNIT_M, `${mode}: and never further apart than the aircraft is long, nose to tail`);
}

// ── THE SEPARATION COMES FROM THE AIRCRAFT'S SIZE ───────────────────────────────────────────────
{
  const m = air();
  const sep = seatSeparationM(m, 'wing', ground);
  const fwd = SEAT_OFFSETS.wing.pilot.fwd - SEAT_OFFSETS.wing.targeteer.fwd;
  const up = SEAT_OFFSETS.wing.pilot.up - SEAT_OFFSETS.wing.targeteer.up;
  const expected = Math.hypot(fwd, up) * GLYPH_UNIT_M;
  ok(Math.abs(sep - expected) < 0.001, `the separation is a fraction of the airframe's NOSE-TO-TAIL length (${(sep * 100).toFixed(1)} cm of ${GLYPH_UNIT_M} m)`);
  ok(GLYPH_UNIT_M === AIRFRAME_EXTENT.noseToTailM, 'and the fraction is taken along the fuselage, never across the wing');
  ok(!('lengthM' in AIRFRAME_EXTENT), 'the ambiguous name is gone, so this cannot silently go back to the span');
  ok(GLYPH_UNIT_M < AIRFRAME_EXTENT.spanM, 'which matters here precisely because this aircraft is wider than it is long');
}

// ── IT IS DIFFERENT ON THE ROTORS THAN ON THE WING ──────────────────────────────────────────────
{
  const m = air();
  const q = seatSeparationM(m, 'quad', ground);
  const w = seatSeparationM(m, 'wing', ground);
  ok(Math.abs(q - w) > 0.1 * GLYPH_UNIT_M, `the rotors and the wing give different separations (${(q * 100).toFixed(0)} cm against ${(w * 100).toFixed(0)} cm)`);
  ok(w > q, 'and the wing is the wider of the two — the nose is out in front and the sensor drops to clear the wing root');
  const qp = seatEye(m, 'pilot', 'quad', ground), wp = seatEye(m, 'pilot', 'wing', ground);
  ok(qp[1] !== wp[1], 'the pilot sits further forward once it is flying');
  const qt = seatEye(m, 'targeteer', 'quad', ground), wt = seatEye(m, 'targeteer', 'wing', ground);
  ok(wt[2] < qt[2], 'and the sensor hangs lower');
}
{
  // A transition reads as the mode it is leaving rather than snapping at the last instant.
  const m = air();
  ok(seatSeparationM(m, 'transition', ground) === seatSeparationM(m, 'quad', ground),
     'a transition is not a third geometry — it reads as the rotors until the wing has it');
}

// ── THE AIRFRAME'S HEADING CARRIES THE SEATS WITH IT ────────────────────────────────────────────
{
  const north = seatEye(air(0), 'pilot', 'wing', ground);
  const east = seatEye(air(90), 'pilot', 'wing', ground);
  ok(Math.abs(north[1]) > Math.abs(north[0]), 'facing north, the pilot is offset north');
  ok(Math.abs(east[0]) > Math.abs(east[1]), 'facing east, the pilot is offset east');
  ok(Math.abs(north[2] - east[2]) < 0.01, 'and the height does not depend on which way it is pointing');
  const sepN = seatSeparationM(air(0), 'wing', ground), sepE = seatSeparationM(air(137), 'wing', ground);
  ok(Math.abs(sepN - sepE) < 0.01, 'the two people stay the same distance apart whichever way it faces');
}

// ── A TURRET HAS ONE HEAD, AND IS NOT GIVEN A PARALLAX IT DOES NOT HAVE ─────────────────────────
{
  const t = turretMount(DRONE_DOMAIN.turrets[0]);
  const p = seatEye(t, 'pilot', 'quad', ground);
  const g = seatEye(t, 'targeteer', 'wing', ground);
  ok(p.every((v, i) => v === g[i]), 'both seats on a turret look from exactly the same point');
  ok(seatSeparationM(t, 'quad', ground) === 0, 'and the separation is zero, not a small invented number');
  ok(/one head, one mount/.test(seatEyeLine('pilot', t, 'quad', ground)), 'and the line says so rather than quoting a distance');
}

// ── THE LINE A PERSON READS ─────────────────────────────────────────────────────────────────────
{
  const m = air();
  ok(/canopy/.test(seatEyeLine('pilot', m, 'wing', ground)), 'the pilot is told they are in the canopy');
  ok(/sensor/.test(seatEyeLine('targeteer', m, 'wing', ground)), 'and the targeteer that they are on the sensor');
  ok(/m from the other seat/.test(seatEyeLine('pilot', m, 'wing', ground)), 'each is told how far away the other one is');
}

// ── THE EYE STILL STANDS ON ITS GROUND ──────────────────────────────────────────────────────────
{
  const m = air();
  const high = seatEye(m, 'pilot', 'quad', () => 500);
  const low = seatEye(m, 'pilot', 'quad', () => 100);
  ok(high[2] - low[2] === 400, 'the eye rises with the ground under it, exactly');
}

// ── AND THE ROUND ACTUALLY USES IT ──────────────────────────────────────────────────────────────
// Two eyes that nothing renders from are a library, not a feature. This is the assertion that would
// catch a future edition quietly collapsing back to one camera for both people.
//
// Prose may explain what the law forbids; only CODE is judged by it — comments are stripped first.
{
  const { readFileSync } = await import('node:fs');
  const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const round = strip(readFileSync(new URL('../components/drone-2525/round.tsx', import.meta.url), 'utf8'));
  const overlay = strip(readFileSync(new URL('../components/drone-2525/round-overlay.tsx', import.meta.url), 'utf8'));

  ok(/from "@\/lib\/drone-2525\/seat-view"/.test(round), 'the round imports the seat geometry rather than re-deriving it');
  ok(/seatEye\(mount, "targeteer"/.test(round), 'the sensor eye is the TARGETEER\'s — that is where the gimbal is bolted');
  ok(/seatEye\(mount, mySeatOr/.test(round), 'and this screen draws from the seat the person is actually in');
  ok(/const eye = sensorEye/.test(round), 'framing, the sight line and the range all read the sensor eye');
  ok(/myEye=\{myEye\}/.test(round), 'and the overlay is handed both eyes, not one');
  ok(/myEye: Vec3/.test(overlay), 'the overlay declares the second eye');
  ok(/const me = p\(myEye\), sen = p\(eye\)/.test(overlay), 'and draws the parallax between them, so a pilot can see it');
  ok(/apart > 1\.5/.test(overlay), 'while a turret, whose two eyes coincide, is given no mark it has not earned');
  ok(/data-drone-seat-eye/.test(round), 'the HUD names which eye this is and how far the other seat is');
}

console.log(`\nseat-view: ${pass} passed, ${fail} failed · quad ${(seatSeparationM(air(), 'quad', ground) * 100).toFixed(0)} cm · wing ${(seatSeparationM(air(), 'wing', ground) * 100).toFixed(0)} cm apart · on a ${GLYPH_UNIT_M} m fuselage`);
process.exit(fail ? 1 : 0);
