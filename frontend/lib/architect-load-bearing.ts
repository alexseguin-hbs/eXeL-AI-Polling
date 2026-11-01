/**
 * ARCHITECT-2525 · LOAD-BEARING CALCS for the structural / framing elements (operator 2026-11-01: "load bearing calcs
 * must also be done in structural/framing elements").
 * ============================================================================================================
 * A SCREENING structural check for the stud wall framing: gravity load down a stud line (roof dead + roof live/snow +
 * wall self-weight, plus any upper-storey floor live) vs the allowable axial capacity of a 2×4 / 2×6 stud at 16" o.c.,
 * giving a demand/capacity ratio (D/C) and a pass/flag; plus the header size required over an opening span. Every load and
 * capacity names its public source (ASCE 7-22 · IRC 2021 · NDS 2018). This is a planning screen, NOT a stamped
 * engineering analysis — a licensed engineer and the local AHJ own the final design.
 *
 * Pure + deterministic (no Date/random) → replayable and gate-checked (tests/architect-load-bearing.test.mjs).
 */
import { type SimModel } from "./architect-sim-options";
import { formGeometry } from "./architect-build-instructions";

export type StudGaugeId = "2x4" | "2x6";

/** Design loads (psf) — public minimums. Snow is site-specific; the IRC roof live-load minimum governs when snow is low. */
export const LOADS = {
  roofDeadPsf: 15,   // shingles + sheathing + light-frame trusses (typical) — ASCE 7-22 C3.1 / builder refs
  roofLivePsf: 20,   // IRC 2021 R301.6 minimum roof live load (governs over low Austin snow ~5 psf)
  wallDeadPsf: 8,    // framed exterior wall: studs + sheathing + drywall + siding
  floorLivePsf: 40,  // IRC 2021 Table R301.5 residential floor live (only when an upper storey sits on the wall)
  source: "ASCE 7-22 · IRC 2021 R301",
} as const;

/** Allowable axial capacity per stud (lb) for an 8-ft SPF No.2 stud at 16" o.c., column stability (Cp) included —
 *  a conservative screening value; the real capacity is a licensed-engineer NDS calc for the species/grade/height. */
export const STUD_CAPACITY: Record<StudGaugeId, { lb: number; actualIn: string }> = {
  "2x4": { lb: 1500, actualIn: "1.5×3.5" },
  "2x6": { lb: 2900, actualIn: "1.5×5.5" },
};
export const STUD_SOURCE = "NDS 2018 · SPF No.2 · 8′ stud · allowable axial (Cp incl.)";
export const STUD_SPACING_FT = 16 / 12; // 16" on-centre

export interface LoadBearing {
  gauge: StudGaugeId;
  storeys: number;
  tribWidthFt: number;   // stud spacing (tributary width of one stud)
  tribRoofFt: number;    // half the roof span (load splits to two bearing walls)
  roofLoadLb: number;    // (roof DL + roof LL) × trib area
  wallLoadLb: number;    // wall self-weight above the stud
  floorLoadLb: number;   // upper-storey floor live (0 for single storey)
  demandLb: number;      // total axial demand on one stud
  capacityLb: number;    // allowable per the gauge
  dcr: number;           // demand ÷ capacity (≤ 1.0 passes)
  pass: boolean;
  marginPct: number;     // how much spare capacity (100 × (1 − D/C))
  source: string;
}

/** Gravity load-bearing screen for the exterior stud wall at a gauge. storeys = total floors bearing on the wall. */
export function loadBearing(m: SimModel, gauge: StudGaugeId = "2x6", storeys = 1): LoadBearing {
  const g = formGeometry(m);
  const trib = STUD_SPACING_FT;
  const tribRoof = g.sideFt / 2;                               // roof spans side-to-side, splits to two walls
  const roofLoad = (LOADS.roofDeadPsf + LOADS.roofLivePsf) * trib * tribRoof;
  const wallLoad = LOADS.wallDeadPsf * g.wallHt * trib * storeys;
  const floorLoad = storeys > 1 ? LOADS.floorLivePsf * trib * (g.sideFt / 2) * (storeys - 1) : 0;
  const demand = Math.round(roofLoad + wallLoad + floorLoad);
  const cap = STUD_CAPACITY[gauge].lb;
  const dcr = Math.round((demand / cap) * 1000) / 1000;
  return {
    gauge, storeys, tribWidthFt: Math.round(trib * 100) / 100, tribRoofFt: Math.round(tribRoof * 10) / 10,
    roofLoadLb: Math.round(roofLoad), wallLoadLb: Math.round(wallLoad), floorLoadLb: Math.round(floorLoad),
    demandLb: demand, capacityLb: cap, dcr, pass: dcr <= 1.0, marginPct: Math.round((1 - dcr) * 100),
    source: `${LOADS.source} · ${STUD_SOURCE}`,
  };
}

export interface HeaderSpec { spanFt: number; header: string; source: string; }
/** Required header over an opening span — IRC 2021 R602.7 prescriptive bands (SPF No.2, one storey, light roof). A screen:
 *  real header sizing depends on the building width, snow and storeys above. */
export function headerFor(spanFt: number): HeaderSpec {
  const s = "IRC 2021 R602.7 (prescriptive)";
  if (spanFt <= 4) return { spanFt, header: "(2) 2×6", source: s };
  if (spanFt <= 6) return { spanFt, header: "(2) 2×8", source: s };
  if (spanFt <= 8) return { spanFt, header: "(2) 2×10", source: s };
  if (spanFt <= 10) return { spanFt, header: "(2) 2×12", source: s };
  return { spanFt, header: "engineered beam (LVL / steel)", source: s };
}

export interface FramingLoadReport {
  bearing2x4: LoadBearing;
  bearing2x6: LoadBearing;
  recommended: StudGaugeId;        // the lighter gauge that still passes with margin (else 2×6)
  widestOpeningFt: number;
  header: HeaderSpec;
}
/** The framing phase's structural summary for a design — both gauges checked + the header for the widest opening. */
export function framingLoadReport(m: SimModel, storeys = 1): FramingLoadReport {
  const b4 = loadBearing(m, "2x4", storeys);
  const b6 = loadBearing(m, "2x6", storeys);
  // widest opening: a door is 3 ft, a picture window up to 6 ft — use 6 ft as the design screen for a living space.
  const widest = 6;
  return {
    bearing2x4: b4, bearing2x6: b6,
    recommended: b4.pass && b4.marginPct >= 25 ? "2x4" : "2x6",   // prefer 2×4 only with real spare capacity
    widestOpeningFt: widest, header: headerFor(widest),
  };
}
