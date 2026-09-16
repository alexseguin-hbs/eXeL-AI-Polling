// TWO SEATS, TWO EYES, ONE GEOMETRY — operator deck r.050 CONTRACT.seat, adopted 2026-09-16 as canonical:
// pilot canopy +0.18 L / +0.12 up, targeteer belly −0.15 L / −0.04, turret separation 0, "same map on
// turret, VTOL, Manta, Ark, MASS droid — one mount, two seats."
//
// The claim being gated: the two people are not in the same place; the distance between them is a
// FRACTION OF THE AIRCRAFT'S OWN NOSE-TO-TAIL LENGTH (never the span, never a typed constant); it is the
// SAME geometry in every flight mode and it is the deck's, not one of ours; and a turret, which genuinely
// has one head, is given exactly zero. The first edition asserted that rotors and wing DIFFER — that
// assertion is rewritten here, not deleted: the parallax claim changed, the discipline did not.
import { seatEye, seatSeparationM, seatEyeLine, SEAT_OFFSETS, TURRET_SEPARATION_M } from '../lib/drone-2525/seat-view.ts';
import { SEAT_GEOMETRY } from '../lib/2525-core/controls.ts';
import { turretMount, airframeMount } from '../lib/drone-2525/gimbal.ts';
import { AIRFRAME_EXTENT, GLYPH_UNIT_M } from '../lib/drone-2525/airframe-glyph.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ground = () => 163;
const air = (heading = 0) => airframeMount('vtol-01', 'VTOL', [0, 0], 60, heading, -12);

// ── THE GEOMETRY IS THE DECK'S ──────────────────────────────────────────────────────────────────
ok(SEAT_OFFSETS.pilot.fwd === 0.18 && SEAT_OFFSETS.pilot.up === 0.12, 'pilot: canopy +0.18 L, +0.12 up — r.050 CONTRACT.seat');
ok(SEAT_OFFSETS.targeteer.fwd === -0.15 && SEAT_OFFSETS.targeteer.up === -0.04, 'targeteer: belly −0.15 L, −0.04 — AFT of centre, as the deck says');
ok(SEAT_OFFSETS.pilot.fwd === SEAT_GEOMETRY.pilot.f && SEAT_OFFSETS.targeteer.up === SEAT_GEOMETRY.targeteer.u, 'the fractions are read from the schema in controls.ts, not retyped here');
ok(TURRET_SEPARATION_M === 0 && SEAT_GEOMETRY.turretSep === 0, 'turret separation is zero by contract');

// ── THE TWO SEATS ARE NOT IN THE SAME PLACE ─────────────────────────────────────────────────────
for (const mode of ['quad', 'wing', 'transition']) {
  const m = air();
  const p = seatEye(m, 'pilot', mode, ground);
  const t = seatEye(m, 'targeteer', mode, ground);
  ok(p.some((v, i) => v !== t[i]), `${mode}: the pilot and the targeteer look from different points`);
  ok(p[2] > t[2], `${mode}: the pilot is above the sensor — a canopy over a slung gimbal`);
  ok(p[1] > t[1], `${mode}: and further forward, facing north`);
  const sep = seatSeparationM(m, mode, ground);
  ok(sep > 0.05 * GLYPH_UNIT_M, `${mode}: they are ${(sep * 100).toFixed(1)} cm apart — a real separation on an aircraft this size`);
  ok(sep < GLYPH_UNIT_M, `${mode}: and never further apart than the aircraft is long, nose to tail`);
}

// ── ONE GEOMETRY IN EVERY MODE ──────────────────────────────────────────────────────────────────
{
  const m = air();
  const q = seatSeparationM(m, 'quad', ground), w = seatSeparationM(m, 'wing', ground), tr = seatSeparationM(m, 'transition', ground);
  ok(q === w && w === tr, `rotors, wing and transition give ONE separation (${(q * 100).toFixed(1)} cm) — the deck's one-geometry rule`);
  const expected = Math.hypot(0.18 - -0.15, 0.12 - -0.04) * GLYPH_UNIT_M;
  ok(Math.abs(q - expected) < 1e-9, `and it is hypot(0.33, 0.16) × ${GLYPH_UNIT_M} m = ${(expected * 100).toFixed(1)} cm`);
  ok(Math.abs(q - 0.285) < 0.002, 'which reads 28.5 cm on the 0.7777 m foil — the figure the ledger records');
  for (const seat of ['pilot', 'targeteer']) {
    const a = seatEye(m, seat, 'quad', ground), b = seatEye(m, seat, 'wing', ground);
    ok(a.every((v, i) => v === b[i]), `${seat}'s eye does not jump at the transition`);
  }
}

// ── THE SEPARATION COMES FROM THE AIRCRAFT'S SIZE, ALONG THE FUSELAGE ───────────────────────────
{
  ok(GLYPH_UNIT_M === AIRFRAME_EXTENT.noseToTailM, 'the fraction is taken along the fuselage, never across the wing');
  ok(!('lengthM' in AIRFRAME_EXTENT), 'the ambiguous name is gone, so this cannot silently go back to the span');
  ok(GLYPH_UNIT_M < AIRFRAME_EXTENT.spanM, 'which matters here precisely because this aircraft is wider than it is long');
  const ratio = seatSeparationM(air(), 'wing', ground) / GLYPH_UNIT_M;
  ok(Math.abs(ratio - Math.hypot(0.33, 0.16)) < 1e-9, 'so a Manta or a droid of another length gets its own parallax for free — the ratio is the invariant');
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
  const aft = seatEye(air(0), 'targeteer', 'wing', ground);
  ok(aft[1] < 0, 'facing north, the targeteer sits SOUTH of the mount — aft, as the deck places them');
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
  ok(Math.abs(high[2] - low[2] - 400) < 1e-9, 'the eye rises with the ground under it, exactly');
}

// ── AND THE ROUND ACTUALLY USES IT ──────────────────────────────────────────────────────────────
// Two eyes that nothing renders from are a library, not a feature. Comments are stripped first: prose may
// explain what the law forbids; only CODE is judged by it.
{
  const { readFileSync } = await import('node:fs');
  const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const round = strip(readFileSync(new URL('../components/drone-2525/round.tsx', import.meta.url), 'utf8'));
  const overlay = strip(readFileSync(new URL('../components/drone-2525/round-overlay.tsx', import.meta.url), 'utf8'));
  ok(/from "@\/lib\/drone-2525\/seat-view"/.test(round), 'the round imports the seat geometry rather than re-deriving it');
  ok(/seatEye\(mount, "targeteer"/.test(round), "the sensor eye is the TARGETEER's — that is where the gimbal is bolted");
  ok(/seatEye\(mount, mySeatOr/.test(round), 'and this screen draws from the seat the person is actually in');
  ok(/const eye = sensorEye/.test(round), 'framing, the sight line and the range all read the sensor eye');
  ok(/myEye=\{myEye\}/.test(round), 'and the overlay is handed both eyes, not one');
  ok(/myEye: Vec3/.test(overlay), 'the overlay declares the second eye');
  ok(/const me = p\(myEye\), sen = p\(eye\)/.test(overlay), 'and draws the parallax between them, so a pilot can see it');
  ok(/apart > 1\.5/.test(overlay), 'while a turret, whose two eyes coincide, is given no mark it has not earned');
  ok(/data-drone-seat-eye/.test(round), 'the HUD names which eye this is and how far the other seat is');
  const sv = readFileSync(new URL('../lib/drone-2525/seat-view.ts', import.meta.url), 'utf8');
  ok(!/quad:\s*\{/.test(strip(sv)) && !/wing:\s*\{/.test(strip(sv)), 'no second geometry survives in the source — one for every vehicle');
}

console.log(`\nseat-view: ${pass} passed, ${fail} failed · ${(seatSeparationM(air(), 'quad', ground) * 100).toFixed(1)} cm between the eyes in every mode · on a ${GLYPH_UNIT_M} m fuselage · turret 0`);
process.exit(fail ? 1 : 0);
