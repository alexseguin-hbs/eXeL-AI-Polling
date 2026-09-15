// THE MoT LADDER — 5 edge-compute bands × 5 resolution steps = 25 rungs, 1.1 through 5.5.
//
// Operator 2026-09-15: "drone-2525 will have 5 levels for resolution and 5 levels for edge compute …
// consider 83 starwars mock up as level 1.1 for everything related to R-Core and the future of self
// calibrating robotics. Technically FPS should be faster with 1.1 settings."
//
// THE CORRECTION THIS MODULE MAKES. The previous four-tier table said a richer tier runs at a HIGHER frame
// rate (low 15 fps, ultra 60 fps). That is backwards, and it was backwards because one word — "tier" — was
// doing two jobs. They are now separated and never mixed again:
//
//   DEMAND      what is asked for: how many strokes, how round a curve, which sensors, how much CNN.
//               This module. More demand costs more, so a higher rung asks for FEWER frames per second.
//   CAPABILITY  what the machine can actually deliver: the HAL profile's frame budget (lib/wire-core/hal.ts)
//               and the measured frame rate.
//
// Rung 1.1 is the 1983 vector arcade: one sensor, a sparse grid, few strokes, and the fastest picture the
// machine can make. Rung 5.5 is the dense mesh with all five sensors fused and the CNN paid first.
// Calibration (lib/wire-core/calibrate.ts) is the only thing allowed to reconcile the two.
//
// Pure: no clock, no DOM, no Math.random. A rung is a function of its label and nothing else.
import type { Lod } from "./wire-model";

export const BANDS = 5;
export const STEPS = 5;

/** EO is never shed — a unit that cannot see is not degraded, it is blind. The rest shed from the top. */
export const SENSOR_LADDER = ["EO", "IR", "ACOUSTIC", "MAG", "CHEM"] as const;
export type SensorModule = (typeof SENSOR_LADDER)[number];

export const BAND_NAMES = ["VECTOR", "FIELD", "BLOCK", "DENSE", "FULL"] as const;
export type BandName = (typeof BAND_NAMES)[number];

/** A rung label, "<band>.<step>", both 1..5. Two digits, never letters — the DRN id law applied to levels. */
export type MotLevel = `${1 | 2 | 3 | 4 | 5}.${1 | 2 | 3 | 4 | 5}`;

export const MOT_LEVELS: MotLevel[] = Array.from({ length: BANDS * STEPS }, (_, i) => {
  const band = Math.floor(i / STEPS) + 1, step = (i % STEPS) + 1;
  return `${band}.${step}` as MotLevel;
});
export const MOT_MIN: MotLevel = "1.1";
export const MOT_MAX: MotLevel = "5.5";

export interface MotParts { band: number; step: number; rung: number }
/** Refuses rather than guesses: a label outside the ladder is a bug to fix, not a value to clamp. */
export function parseMot(level: string): MotParts {
  const m = /^([1-5])\.([1-5])$/.exec(String(level).trim());
  if (!m) throw new Error(`mot: "${level}" is not a rung of the ladder (1.1 … 5.5)`);
  const band = Number(m[1]), step = Number(m[2]);
  return { band, step, rung: (band - 1) * STEPS + step };
}
export const motIndex = (level: MotLevel): number => parseMot(level).rung - 1;
export const isMot = (v: string): v is MotLevel => /^[1-5]\.[1-5]$/.test(String(v).trim());

export interface MotSpec {
  level: MotLevel;
  band: number;            // 1..5 — the edge-compute class
  step: number;            // 1..5 — the resolution step inside that class
  rung: number;            // 1..25 — position on the whole ladder
  bandName: BandName;
  /** Everything below is DEMAND. None of it is a measurement. */
  segments: number;        // stroke budget
  demandFps: number;       // the cadence this rung asks for — falls as demand rises
  ngonSides: number;       // how round a curve is allowed to be
  dpr: number;             // device-pixel-ratio the rung asks for
  maxLod: Lod;             // which detail groups may draw
  bloom: boolean;
  gridM: number;           // ground-grid spacing, metres — sparse at 1.1, dense at 5.5
  cnnMs: number;           // what the sensor stack costs per frame at this rung
  edgeBudget: number;      // max extracted edges a capture may store
  sensors: SensorModule[]; // multi-sensor fusion: one more module per band
  telemetryHz: number;     // how often the round samples itself
}

const clampLod = (n: number): Lod => (n <= 0 ? 0 : n === 1 ? 1 : 2);

/** The rung, derived. Every number is a formula of (band, step) so the whole ladder is one decision. */
export function motSpec(level: MotLevel): MotSpec {
  const { band, step, rung } = parseMot(level);
  return {
    level, band, step, rung,
    bandName: BAND_NAMES[band - 1],
    segments: Math.min(4000, 280 + (rung - 1) * 155),
    // 96 fps asked for at 1.1 down to 19 at 5.5: the arcade rung is the fast one, by construction.
    demandFps: Math.max(12, Math.round(96 - (rung - 1) * 3.2)),
    // TWO AXES, AND EACH ONE HAS TO DO ITS JOB. The first draft let the band set curve resolution and the
    // step set nothing, so "5 levels for resolution" was a label on a control that did not exist.
    //   · ngonSides ramps smoothly across the whole ladder, so every rung is a real change in roundness
    //   · dpr is driven by the STEP alone — that is the resolution axis, 1.0 through 2.0 inside every band
    ngonSides: 6 + Math.round(((rung - 1) * (32 - 6)) / (BANDS * STEPS - 1)),
    dpr: 1 + (step - 1) * 0.25,
    maxLod: clampLod(band === 1 ? 1 : 2),
    bloom: band >= 5,
    gridM: band <= 1 ? 80 : band >= 5 ? 12 : 40,
    cnnMs: band === 1 ? 2 + step : band >= 5 ? 30 + step * 4 : 8 + band * 4,
    edgeBudget: 16 + rung * 6,
    sensors: SENSOR_LADDER.slice(0, band) as SensorModule[],
    telemetryHz: band <= 1 ? 10 : band >= 5 ? 3 : 6,
  };
}

/** Move along the ladder, refusing to step off either end. */
export function motStep(level: MotLevel, delta: number): MotLevel {
  const i = motIndex(level) + delta;
  return MOT_LEVELS[Math.max(0, Math.min(MOT_LEVELS.length - 1, i))];
}
export const motAtMost = (level: MotLevel, cap: MotLevel): MotLevel =>
  motIndex(level) > motIndex(cap) ? cap : level;
export const motCompare = (a: MotLevel, b: MotLevel): number => motIndex(a) - motIndex(b);

/** One line for a HUD: the rung, its band, and what it is asking for. Never silent (U-WF-09). */
export const motLabel = (s: MotSpec): string =>
  `MoT ${s.level} ${s.bandName} · ${s.segments} seg · ${s.sensors.join("·")} · cnn ${s.cnnMs}ms`;
