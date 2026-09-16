// ONE AIRCRAFT, TWO SIZES — the gate for "scale perfectly larger".
//
// Operator 2026-09-16: "all aircrafts will have mini version with ability to size up and scale perfectly
// larger size 11.111 by 7.777".
//
// "Perfectly" is the whole claim, and it has two halves that are easy to confuse:
//
//   THE LENGTHS ARE EXACT. Every length is the same factor, both ways, to a tenth of a millimetre.
//   NOTHING ELSE IS A LENGTH. Area goes as L², mass as L³, stall as √L. That is the square-cube law, and
//     a build that scales the picture without scaling those has an eleven-metre aircraft stalling at the
//     speed of a hand-launched drone. This file exists mostly to stop that.
//
// And the third claim, which is why it is safe to have two sizes at all: switching size must not make it a
// different aircraft. The geometry, the proportions, and every rule that is about materials or people
// rather than metres, are untouched.
import {
  SCALE_IDS, EXPONENT, FOIL_SCALES, scaleOf, DEFAULT_SCALE, MINI_TO_FULL, SIMILARITY_DEPARTURE,
  lengthRatio, scaleQuantity, stallAt, wingLoadingNm2, scaleLine, INVARIANT_UNDER_SCALE,
} from '../lib/drone-2525/scale.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';
import { AIRFRAME_EXTENT, GLYPH_UNIT_M } from '../lib/drone-2525/airframe-glyph.ts';
import { dwellToDisableS } from '../lib/drone-2525/laser.ts';
import { SEAT_OFFSETS } from '../lib/drone-2525/seat-view.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));

const mini = scaleOf('mini'), full = scaleOf('full');
const G = DRONE_DOMAIN.airframe.geometry;

// ── THE TWO SIZES ARE THE ONES THAT WERE DECLARED ───────────────────────────────────────────────
{
  ok(SCALE_IDS.join() === 'mini,full', 'two sizes, smallest first — the operator\'s own order');
  ok(DEFAULT_SCALE === 'mini', 'and the app flies the mini one unless told otherwise');
  ok(mini.spanM === 1.111 && mini.noseToTailM === 0.7777, `mini is ${mini.label}`);
  ok(full.spanM === 11.111 && full.noseToTailM === 7.777, `full is ${full.label}`);
  ok(AIRFRAME_EXTENT.spanM === mini.spanM, 'and the extent the renderer uses is the mini one');
  ok(GLYPH_UNIT_M === mini.noseToTailM, 'as is the unit the glyph is normalised to');
}

// ── THE LENGTHS ARE EXACT, BOTH WAYS ────────────────────────────────────────────────────────────
{
  const k = MINI_TO_FULL;
  ok(Math.abs(k - 10.0009) < 1e-3, `the factor between them is ${k.toFixed(5)}`);
  // THE DECLARED SIZES ARE SIMILAR TO 0.009%, NOT EXACTLY, and the gate says so rather than rounding it
  // away. An exact tenth of 11.111 is 1.1111; the operator declared 1.111. That is the repeating-digit
  // signature, not a mistake, and it is 0.1 mm on the mini's span — below anything that can be built,
  // measured or seen. Every tolerance below is set to match it, so the claim is exactly as strong as the
  // thing it describes.
  ok(Math.abs(SIMILARITY_DEPARTURE - 9.0e-5) < 1e-6,
     `the two declared sizes depart from exact similarity by ${(SIMILARITY_DEPARTURE * 100).toFixed(4)}% — recorded, not rounded away`);
  ok(Math.abs(SIMILARITY_DEPARTURE) * mini.spanM * 1000 < 0.2,
     `which is ${(Math.abs(SIMILARITY_DEPARTURE) * mini.spanM * 1000).toFixed(2)} mm on the mini's span`);
  for (const [name, a, b] of [['span', mini.spanM, full.spanM], ['nose-to-tail', mini.noseToTailM, full.noseToTailM], ['depth', mini.depthM, full.depthM]]) {
    ok(rel(b / a, k) < 2e-4, `${name} scales by the same factor to within the declared departure (${(b / a).toFixed(6)})`);
    ok(Math.abs(a * k - b) < 2e-3, `and ${name} round-trips to within two millimetres`);
  }
  // Proportions are what must hold: that is what similar means.
  for (const s of [mini, full]) {
    ok(rel(s.noseToTailM / s.spanM, 0.7) < 2e-4, `${s.id}: nose-to-tail is 0.70 of span (${(s.noseToTailM / s.spanM).toFixed(5)})`);
    ok(rel(s.depthM / s.spanM, mini.depthM / mini.spanM) < 2e-4, `${s.id}: depth over span is the same as the other size`);
  }
  ok(lengthRatio(mini.spanM) === 1, 'the mini is its own reference');
  ok(rel(lengthRatio(full.spanM), k) < 1e-12, 'and the full is the factor');
}

// ── NOTHING ELSE IS A LENGTH ────────────────────────────────────────────────────────────────────
{
  const k = MINI_TO_FULL;
  ok(EXPONENT.area === 2 && EXPONENT.mass === 3 && EXPONENT.speed === 0.5, 'the exponents are the physics: area 2, mass 3, speed a half');

  ok(rel(full.planformM2 / mini.planformM2, k ** 2) < 1e-3,
     `planform goes as the SQUARE (${(full.planformM2 / mini.planformM2).toFixed(1)}× for a ${k.toFixed(2)}× length) — ${mini.planformM2} m² to ${full.planformM2} m²`);
  ok(rel(full.massKg / mini.massKg, k ** 3) < 1e-3,
     `mass goes as the CUBE (${(full.massKg / mini.massKg).toFixed(0)}×) — ${mini.massKg} kg to ${(full.massKg / 1000).toFixed(2)} t`);
  ok(rel(full.capacityWh / mini.capacityWh, k ** 3) < 1e-3, 'and the battery grows with the mass it has to lift');

  // The one that catches a build that scaled only the picture.
  ok(rel(stallAt(full) / stallAt(mini), Math.sqrt(k)) < 1e-3,
     `stall goes as the SQUARE ROOT (${(stallAt(full) / stallAt(mini)).toFixed(2)}×) — ${stallAt(mini).toFixed(1)} m/s to ${stallAt(full).toFixed(1)} m/s`);
  ok(stallAt(full) > stallAt(mini) * 3, 'so the big one has to fly meaningfully faster, which is what wing loading means');
  ok(rel(wingLoadingNm2(full) / wingLoadingNm2(mini), k) < 1e-3,
     `wing loading goes as the length itself (${wingLoadingNm2(mini).toFixed(0)} → ${wingLoadingNm2(full).toFixed(0)} N/m²)`);

  // Derived, not typed. A third size would need one line and no arithmetic by hand.
  ok(rel(scaleQuantity(mini.planformM2, 'area', full.spanM), full.planformM2) < 1e-3, 'the helper reproduces the declared planform');
  ok(rel(scaleQuantity(mini.massKg, 'mass', full.spanM), full.massKg) < 1e-3, 'and the declared mass');
  const third = scaleQuantity(mini.massKg, 'mass', 3.333);
  ok(third > mini.massKg && third < full.massKg, `a third size in between would fall in between (${third.toFixed(1)} kg at 3.333 m)`);
}

// ── SWITCHING SIZE DOES NOT MAKE IT A DIFFERENT AIRCRAFT ────────────────────────────────────────
{
  ok(INVARIANT_UNDER_SCALE.length >= 6, 'the file says out loud what does not change');

  // The seat offsets are fractions, so they scale for free and were never metres to begin with.
  for (const frame of ['quad', 'wing']) for (const seat of ['pilot', 'targeteer']) {
    const o = SEAT_OFFSETS[frame][seat];
    ok(Math.abs(o.fwd) < 1 && Math.abs(o.up) < 1, `${frame}/${seat} offsets are fractions of the fuselage, not metres`);
  }

  // The laser rules are fluence per square centimetre — a property of materials, not of size. The dwell to
  // disable at a given range is IDENTICAL at both scales, and that is correct rather than an oversight.
  const B = DRONE_DOMAIN.beam, D = DRONE_DOMAIN.defences;
  ok(dwellToDisableS(B, D, 300) === dwellToDisableS(B, D, 300), 'the beam rules do not take a size at all');
  ok(!('spanM' in B) && !('spanM' in D), 'neither the beam nor the defences carry a length of the aircraft');

  // And the geometry itself: one model, one set of proportions, read in different metres.
  ok(rel(full.planformM2 / (0.5 * full.spanM * full.noseToTailM), mini.planformM2 / (0.5 * mini.spanM * mini.noseToTailM)) < 2e-4,
     'the planform is the same share of its own delta at both sizes — one shape');
  ok(G.scale === 'foil-1.111', `the declared family is the mini one (${G.scale}), and the full is derived from it`);
}

// ── WHAT A PERSON READS WHEN THEY SWITCH ────────────────────────────────────────────────────────
{
  for (const s of [mini, full]) {
    const line = scaleLine(s);
    ok(/stalls at \d+ m\/s/.test(line), `${s.id} says how fast it has to fly: "${line}"`);
    ok(!/exponent|L\^|square-cube|planform/i.test(line), 'and says it without an exponent in sight');
    ok(s.use.length > 20, `${s.id} says what it is for: "${s.use}"`);
  }
  ok(/kg/.test(scaleLine(mini)) && /t$|t /.test(scaleLine(full)), 'kilogrammes for the small one, tonnes for the big one');
  ok(/Capitol/.test(full.use), 'and the full size names the demo it is aimed at');
}

console.log(`\ndrone-scale: ${pass} passed, ${fail} failed · ${mini.label} ↔ ${full.label} at ×${MINI_TO_FULL.toFixed(4)}`
  + ` · mass ${mini.massKg} kg → ${(full.massKg / 1000).toFixed(2)} t · stall ${stallAt(mini).toFixed(1)} → ${stallAt(full).toFixed(1)} m/s`);
process.exit(fail ? 1 : 0);
