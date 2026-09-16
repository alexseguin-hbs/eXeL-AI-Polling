// ONE AIRCRAFT, TWO SIZES — and everything that follows from a size, following it.
//
// Operator 2026-09-16: "all aircrafts will have mini version with ability to size up and scale perfectly
// larger size 11.111 by 7.777", and "1.111 m x .777 is for lofty goal of demos at Capital of texas in
// Austin texas first in video game, sim, and eventually Drone-2525 and Mission Planning in Security-2525
// will merge."
//
// ── WHAT "SCALE PERFECTLY" ACTUALLY MEANS ────────────────────────────────────────────────────────
// The two sizes are geometrically similar to 0.009 % — see SIMILARITY_DEPARTURE below, which records why
// (an exact tenth of 11.111 is 1.1111, and the operator declared 1.111) and how little it is (0.1 mm on the
// mini's span). Every tolerance in the gate is set to match that, rather than claiming an exactness the
// declared digits do not have.
//
// The part that is easy to get wrong is everything that is NOT a length. An area goes as L², a volume and
// therefore a mass goes as L³, and a stall speed goes as the square root of the wing loading, which is
// mass over area — so it goes as √L. That is the square-cube law, it is not optional, and ignoring it is
// how you end up with an eleven-metre aircraft that stalls at the speed of a hand-launched drone.
//
//    length   ×10.0009      span, nose-to-tail, depth, seat separation, the glyph's own unit
//    area     ×100.018      planform, and so lift and drag at a given speed
//    mass     ×1000.27      a solid body of the same shape and the same stuff
//    speed    ×3.1624       stall and cruise, because wing loading went up by ten
//    energy   ×1000.27      the battery has to grow with the mass it lifts
//
// Nothing below is typed twice. Every figure is derived from the two declared spans and the exponent the
// quantity actually has, so a third scale would need one line and no arithmetic by hand.
//
// Pure: no clock, no DOM. The GEOMETRY does not change with scale — it is one model, one hash, one set of
// exports — only the metres it is read in.
import { DRONE_DOMAIN } from "./domain.gen";

export type ScaleId = "mini" | "full";
export const SCALE_IDS: ScaleId[] = ["mini", "full"];

/** How a quantity behaves under geometric similarity. The exponent IS the physics. */
export const EXPONENT = { length: 1, area: 2, volume: 3, mass: 3, speed: 0.5, energy: 3 } as const;
export type Quantity = keyof typeof EXPONENT;

const G = DRONE_DOMAIN.airframe.geometry;

export interface FoilScale {
  id: ScaleId;
  label: string;
  spanM: number;
  noseToTailM: number;
  depthM: number;
  /** Planform, m². Derived from the declared one by L², never re-integrated. */
  planformM2: number;
  massKg: number;
  /** Battery, Wh. Grows with the mass it has to lift. */
  capacityWh: number;
  /** Where this size is for, in one phrase. */
  use: string;
}

/**
 * THE TWO DECLARED SIZES ARE SIMILAR TO 0.009 %, NOT EXACTLY.
 *
 *     span    11.111 / 1.111  = 10.0009000
 *     length   7.777 / 0.7777 = 10.0000000
 *
 * An exact tenth of the full would be 1.1111 m, and the operator declared 1.111 — one fewer digit, which
 * is the repeating-digit signature rather than an error. The departure is 0.1 mm on the mini's span and
 * 0.9 mm on the full's: below anything that could be built, measured or seen. It is recorded here, and
 * asserted in the gate at a tolerance that matches it, because "scale perfectly" is the claim and a claim
 * should be exactly as strong as the thing it describes.
 */
export const SIMILARITY_DEPARTURE = (11.111 / 1.111) / (7.777 / 0.7777) - 1;   // 9.0e-5

/** Ratio of any scale's span to the declared mini. The single number everything else is built from. */
export const lengthRatio = (spanM: number): number => spanM / G.spanM;

/** Scale a quantity of a given kind from the mini figure to a span. */
export const scaleQuantity = (miniValue: number, quantity: Quantity, spanM: number): number =>
  miniValue * Math.pow(lengthRatio(spanM), EXPONENT[quantity]);

function build(id: ScaleId, spanM: number, noseToTailM: number, label: string, use: string): FoilScale {
  // Each axis follows its OWN declared ratio, and depth follows the geometric mean of the two — the same
  // rule the operator's FOIL manifest gives and the same one airframe.geometry uses. Deriving depth from
  // the span alone would quietly bake the 0.009 % departure into a third axis.
  const kSpan = spanM / G.spanM, kLen = noseToTailM / G.noseToTailM;
  const kDepth = Math.sqrt(kSpan * kLen);
  // Area and mass are two-dimensional and three-dimensional in the SAME body, so they take the mean ratio.
  const kMean = Math.sqrt(kSpan * kLen);
  return {
    id, label, spanM, noseToTailM,
    depthM: round4(G.depthM * kDepth),
    planformM2: round4(G.planformM2 * kSpan * kLen),          // an area is one length by another
    massKg: round4(Number(DRONE_DOMAIN.airframe.massKg) * Math.pow(kMean, 3)),
    capacityWh: round4(Number(DRONE_DOMAIN.battery.capacityWh) * Math.pow(kMean, 3)),
    use,
  };
}
const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/**
 * The two the operator declared. MINI is what the app flies and what a laser-tag floor could hold; FULL is
 * the size the Capitol demo and the Security-2525 merge are aimed at. Both come out of one drawing.
 */
export const FOIL_SCALES: Record<ScaleId, FoilScale> = {
  mini: build("mini", G.spanM, G.noseToTailM, `${G.spanM} × ${G.noseToTailM} m`,
    "the game, the sim, and a floor a laser-tag match could actually be played on"),
  full: build("full", G.fullScaleM.span, G.fullScaleM.noseToTail, `${G.fullScaleM.span} × ${G.fullScaleM.noseToTail} m`,
    "the Capitol demo, and where Drone-2525 and Security-2525 Mission Planning meet"),
};

export const scaleOf = (id: ScaleId): FoilScale => FOIL_SCALES[id];
/** The one the app flies unless somebody says otherwise. Smallest first, per the operator's own order. */
export const DEFAULT_SCALE: ScaleId = "mini";

/** The exact factor between the two declared sizes. Ten, to within a rounding of the operator's digits. */
export const MINI_TO_FULL = FOIL_SCALES.full.spanM / FOIL_SCALES.mini.spanM;

/**
 * Stall speed at a scale, m/s. Not scaled by a rule of thumb — recomputed from the scaled mass and the
 * scaled area through the same formula flight.ts uses, so the two can never disagree. It comes out as √L
 * of the mini figure, which is the square-cube law appearing rather than being asserted.
 */
export function stallAt(s: FoilScale): number {
  const a = DRONE_DOMAIN.airframe;
  return Math.sqrt((2 * s.massKg * 9.81) / (Number(a.rhoKgM3) * s.planformM2 * Number(a.CLmax)));
}

/** Wing loading, N/m². The number that explains why the big one has to fly faster. */
export const wingLoadingNm2 = (s: FoilScale): number => (s.massKg * 9.81) / s.planformM2;

/** One line a person reads when they switch size. No exponent, no jargon. */
export const scaleLine = (s: FoilScale): string =>
  `${s.label} · ${s.massKg < 50 ? `${s.massKg.toFixed(1)} kg` : `${(s.massKg / 1000).toFixed(2)} t`}`
  + ` · stalls at ${stallAt(s).toFixed(0)} m/s · ${s.use}`;

/**
 * WHAT DOES NOT CHANGE. Said as code rather than as a comment, because it is the whole claim: switching
 * size must not make it a different aircraft. The shape, the proportions and the rules are scale-free.
 */
export const INVARIANT_UNDER_SCALE = [
  "the wireframe itself — one model, one canonical hash, one set of exports",
  "every proportion: nose-to-tail over span, depth over span, planform over the span-by-length box",
  "the seat offsets, which are fractions of the fuselage rather than metres",
  "the laser rules, which are fluence per square centimetre and so are about materials, not size",
  "the authority ladder, which is about people",
  "the eleven-point-one per cent, which is about a field",
] as const;
