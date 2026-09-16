// ONE AIRCRAFT, ONE DESCRIPTION — the gate for invariants I-14 and I-15 (2026-09-16).
//
// Before this file existed, "the aircraft" was described twice and the two descriptions were of different
// machines. The domain record said 5 kg on 0.9 m² of wing — a hand-launched drone of roughly 2 m span. The
// drawing said 38.6 m. Neither ever read the other: `airframe` carries no linear dimension, and flight.ts
// never imports the extent. The round flew a small drone while the screen drew something airliner-sized,
// and nothing could notice, because noticing would have required the two records to touch.
//
// Worse, the three dimensions were under each other's names. The drawing's own header says "X span, Y
// depth, Z vertical nose-up axis"; the carried model declared forward:"x"; the glyph builder believed the
// model. So `lengthM 38.579` was the SPAN, `heightM 26.2` was the nose-to-tail, and the crew parallax in
// seat-view.ts was being measured across the wing.
//
// Both are the same failure: a number whose meaning lived in a comment. This gate puts the meaning in an
// assertion. It re-derives every figure from the drawing itself and fails on any drift.
import { readFileSync } from 'node:fs';
import { AIRFRAME_EXTENT, GLYPH_UNIT_M, GLYPH_COST } from '../lib/drone-2525/airframe-glyph.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';
import { stallSpeedMs, quadTerminalMs } from '../lib/drone-2525/flight.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const A = DRONE_DOMAIN.airframe;
const G = A.geometry;
const wire = JSON.parse(readFileSync(new URL('../../docs/security-2525/xbat-wireframe/xbat.wire.json', import.meta.url), 'utf8'));
const obj = readFileSync(new URL('../../docs/security-2525/xbat-wireframe/xbat_3rdpass_wireframe.obj', import.meta.url), 'utf8');
const V = wire.vertices;

// ── I-15 · THE AXIS A DIMENSION IS NAMED AFTER IS THE AXIS IT WAS MEASURED ON ───────────────────
{
  // The drawing's own header is the authority. Not the carried model, not a comment, not this test.
  const header = obj.split('\n').slice(0, 4).join(' ');
  ok(/X\s+span/i.test(header), `the drawing's header names X as the span — "${header.trim().slice(0, 60)}…"`);
  ok(/Y\s+depth/i.test(header), 'and Y as the depth');
  ok(/Z\s+vertical nose-up/i.test(header), 'and Z as the vertical nose-up axis');
  ok(G.sourceAxes.span === 'x' && G.sourceAxes.depth === 'y' && G.sourceAxes.noseToTail === 'z',
     `the domain declares the same mapping (span ${G.sourceAxes.span}, depth ${G.sourceAxes.depth}, nose-to-tail ${G.sourceAxes.noseToTail})`);
  ok(wire.frame.axes?.span === 'x' && wire.frame.axes?.noseToTail === 'z',
     'and the carried model declares it too, as a map rather than a single "forward" a tailsitter cannot honestly have');
  ok(wire.frame.forward !== 'x', 'the wrong declaration that caused all of this is gone');
}

// ── THE DECLARED SOURCE EXTENT IS WHAT THE DRAWING ACTUALLY MEASURES ────────────────────────────
const AX = { x: 0, y: 1, z: 2 };
const measured = (name) => {
  const i = AX[G.sourceAxes[name]];
  let lo = Infinity, hi = -Infinity;
  for (const v of V) { if (v[i] < lo) lo = v[i]; if (v[i] > hi) hi = v[i]; }
  return hi - lo;
};
{
  for (const k of ['span', 'depth', 'noseToTail']) {
    ok(near(measured(k), G.sourceExtentM[k], 1e-3),
       `the drawing measures ${k} ${measured(k).toFixed(4)} m and the domain declares ${G.sourceExtentM[k]}`);
  }
  ok(measured('span') > measured('noseToTail'),
     `and it is WIDER THAN IT IS LONG (${measured('span').toFixed(1)} m across, ${measured('noseToTail').toFixed(1)} m nose to tail) — which is why calling the span "length" drew a dart`);
}

// ── I-14 · THE AIRCRAFT ON SCREEN AND THE AIRCRAFT IN THE PHYSICS ARE THE SAME AIRCRAFT ─────────
{
  ok(AIRFRAME_EXTENT.spanM === G.spanM && AIRFRAME_EXTENT.noseToTailM === G.noseToTailM && AIRFRAME_EXTENT.depthM === G.depthM,
     'the extent the renderer scales by is the one the domain declares');
  ok(GLYPH_UNIT_M === AIRFRAME_EXTENT.noseToTailM, 'and the glyph is normalised to the fuselage, not the wing');

  // The wing is DERIVED from the drawing, by the method the domain records. Recomputed here from the
  // vertices, so a hand-edit to wingAreaM2 fails rather than quietly re-opening the gap.
  const byStation = new Map();
  for (const v of V) {
    const z = Math.round(v[AX[G.sourceAxes.noseToTail]] * 1e6) / 1e6;
    const h = Math.abs(v[AX[G.sourceAxes.span]]);
    if (!(byStation.get(z) >= h)) byStation.set(z, h);
  }
  const st = [...byStation.entries()].sort((a, b) => a[0] - b[0]);
  let srcArea = 0;
  for (let i = 1; i < st.length; i++) srcArea += ((2 * st[i - 1][1] + 2 * st[i][1]) / 2) * (st[i][0] - st[i - 1][0]);
  const foilArea = srcArea * (G.spanM / measured('span')) * (G.noseToTailM / measured('noseToTail'));

  ok(near(G.planformM2, foilArea, 1e-3), `the declared planform ${G.planformM2} m² is what the drawing integrates to (${foilArea.toFixed(4)})`);
  ok(A.wingAreaM2 === G.planformM2, `and the PHYSICS uses that same number (${A.wingAreaM2} m²), not one typed beside it`);
  ok(A.wingAreaM2 < 0.5 * G.spanM * G.noseToTailM * 1.01,
     'a planform cannot exceed a delta of the same span and length by more than rounding');
  ok(A.wingAreaM2 > 0.4 * (0.5 * G.spanM * G.noseToTailM),
     'nor be a sliver — this aircraft is a broad delta and the number should say so');

  // The failure this gate exists for: 0.9 m² on an aircraft with 0.309 m² of wing.
  ok(A.wingAreaM2 < 0.9, `the 0.9 m² that shipped for months is refused (${(0.9 / A.wingAreaM2).toFixed(1)}× the real area)`);
}

// ── THE FOIL IS PROPORTIONAL, AND ITS DEPARTURES ARE DECLARED ──────────────────────────────────
{
  ok(near(G.noseToTailM / G.spanM, 0.7, 1e-3), `the foil is 0.70 long per unit span (${(G.noseToTailM / G.spanM).toFixed(5)}) — the operator's declared ratio`);
  ok(near(G.spanM / G.fullScaleM.span, G.noseToTailM / G.fullScaleM.noseToTail, 1e-4),
     'and it is an exact scale of the full 11.111 × 7.777, not a rounding of it');

  // The manifest's own rule for depth, checked rather than trusted.
  const sS = G.spanM / measured('span'), sL = G.noseToTailM / measured('noseToTail');
  ok(near(G.depthM, measured('depth') * Math.sqrt(sS * sL), 5e-4),
     `depth ${G.depthM} m follows the geometric mean of the span and length scales, as the FOIL manifest specifies`);

  // Honest about the one place the foil is NOT the drawing: it stretches the fuselage ~3%.
  const stretch = (G.noseToTailM / G.spanM) / (measured('noseToTail') / measured('span')) * 100 - 100;
  ok(stretch > 0.5, `and the ${stretch.toFixed(2)}% fuselage stretch is real, not a rounding`);
  ok(/stretch/i.test(G.scaleNote), 'so the domain says so in words, rather than leaving it for someone to discover');
}

// ── A CHANGE OF SCALE MUST NOT MAKE THE AIRCRAFT UNFLYABLE ──────────────────────────────────────
{
  const stall = stallSpeedMs(A);
  ok(quadTerminalMs(A) > stall, `the rotors still out-run the stall at this scale (${quadTerminalMs(A).toFixed(1)} over ${stall.toFixed(1)} m/s)`);
  ok(A.cruiseMs > stall, `and cruise ${A.cruiseMs} m/s holds the wing`);
  ok(stall < A.VneMs, 'and the stall is below never-exceed, which is not guaranteed by arithmetic');
}

// ── THE SILHOUETTE COSTS WHAT THE LOWEST RUNG CAN AFFORD ───────────────────────────────────────
{
  ok(GLYPH_COST.dot === 1, 'the smallest mark is one segment');
  ok(GLYPH_COST.dot * 42 < 280 * 0.45,
     `so forty-two of them (${GLYPH_COST.dot * 42}) fit inside rung 1.1's real share (${Math.floor(280 * 0.45)}) — the Raspberry-Pi floor`);
  // Why one segment is the truth and not a compromise, at this scale.
  const pxAt = (r) => (G.spanM * 620) / r;
  ok(pxAt(700) < 1, `at 700 m a ${G.spanM} m aircraft is ${pxAt(700).toFixed(2)} px across — a delta would be four segments inside one pixel`);
  ok(pxAt(40) > 10, `and at 40 m it is ${pxAt(40).toFixed(0)} px, where the planform is worth drawing`);
}

console.log(`\nairframe-truth: ${pass} passed, ${fail} failed · foil ${G.spanM} × ${G.noseToTailM} m · wing ${A.wingAreaM2} m² derived from the drawing · stall ${stallSpeedMs(A).toFixed(1)} m/s`);
process.exit(fail ? 1 : 0);
