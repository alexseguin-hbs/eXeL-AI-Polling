// ARCHITECT-2525 · Eco-Sphere REFERENCE geometry (operator 2026-11-03).
// =================================================================================================================
// DERIVE, NEVER TYPE. A regular hexagon's every metric follows from ONE datum, so each block takes its single seed
// (an area, or a side length) and COMPUTES the rest — no figure is hand-copied. Two SEPARATE geometries:
//
//   • FLOOR — seven equal regular hexagon ROOMS tiling the 900 ft² floor (operator: "update dimensions of 900 sq ft
//     hex for each room per eXeL AI"). Seed = 900 ft² ÷ 7.
//   • ROOF / DOME PANEL — the small hexagon PANELS on the 40-ft hex-dominant dome (operator + the A01 infographic,
//     panel 04 "HEX GEOMETRY · NOMINAL / DERIVED"). Seed = the panel side 2'-0 3/8" (0.619 m); the dome from its 40-ft
//     diameter.
//
// These are REFERENCE / 1st-pass engineering concept / VALIDATION-REQUIRED. They move NO cost (Eco-Sphere stays
// $231,500) and change NO canonical geometry — the floor-derived ~34 ft dome in lib/architect-build-instructions.ts
// is left untouched (firewalled). This module is pure maths: it imports nothing from the cost/canonical engine.

const SQRT3 = Math.sqrt(3);
const M_PER_FT = 0.3048;
export const ftToM = (ft: number) => ft * M_PER_FT;
export const mToFt = (m: number) => m / M_PER_FT;

/** Every metric of a regular hexagon from its side length `s` (same unit in → same unit out). */
export function hexFromSide(s: number) {
  return {
    side: s,
    area: (3 * SQRT3 / 2) * s * s, // (3√3/2)·s²
    flatToFlat: SQRT3 * s,         // √3·s  (across the parallel flats)
    pointToPoint: 2 * s,           // 2·s   (across opposite corners)
  };
}
/** The same hexagon, seeded by its AREA instead of its side. */
export function hexFromArea(area: number) {
  return hexFromSide(Math.sqrt((2 * area) / (3 * SQRT3)));
}

// ── FLOOR ────────────────────────────────────────────────────────────────────────────────────────────────────
export const ECO_FLOOR_TOTAL_FT2 = 900; // the canonical Eco-Sphere floor (unchanged)
export const ECO_FLOOR_ROOMS = 7;        // seven equal hexagon rooms

/** The seven-hex floor, every value in FEET, derived from 900 ÷ 7. The overall footprint of the honeycomb of seven
 *  (a centre + six) is 5·side wide × 3·flatToFlat tall — which reproduces the operator's stated ~35.17 ft × 36.55 ft. */
export function ecoFloor() {
  const perHexFt2 = ECO_FLOOR_TOTAL_FT2 / ECO_FLOOR_ROOMS; // 128.57 ft²
  const h = hexFromArea(perHexFt2);
  return {
    rooms: ECO_FLOOR_ROOMS,
    totalFt2: ECO_FLOOR_TOTAL_FT2,
    perHexFt2,                      // 128.57
    sideFt: h.side,                 // 7.03
    flatToFlatFt: h.flatToFlat,     // 12.18
    pointToPointFt: h.pointToPoint, // 14.07
    overallWidthFt: 5 * h.side,              // 35.17 — honeycomb of seven, derived
    overallDepthFt: 3 * h.flatToFlat,        // 36.55
    note: "excludes wall thickness", // operator's own basis note
  };
}

// ── ROOF / DOME PANEL (separate from the floor hex) ──────────────────────────────────────────────────────────
export const ECO_DOME_DIAMETER_FT = 40;          // operator + A01 "Dome diameter 40'-0"
export const ECO_DOME_TARGET_ANGLE_DEG = 10.09;  // A01 "Target angular increment 10.09°" (controls the tessellation)
export const ECO_PANEL_SIDE_M = 0.619;           // A01 panel side 2'-0 3/8" ≈ 0.619 m (the seed)

/** The hex-dominant dome panel + its 40-ft dome, derived from the panel side (metric) and the dome diameter (feet).
 *  The final panel count is TESSELLATION-DEPENDENT (set by the geodesic frequency, not by this block) — stated, not
 *  invented. Values carried in BOTH metres and feet to match the A01's nominal/derived table. */
export function ecoRoofPanel() {
  const hM = hexFromSide(ECO_PANEL_SIDE_M); // metric hex from the 0.619 m side
  const radiusFt = ECO_DOME_DIAMETER_FT / 2;
  const radiusM = ftToM(radiusFt);
  return {
    panel: {
      sideM: hM.side,                         // 0.619
      flatToFlatM: hM.flatToFlat,             // 1.073
      pointToPointM: hM.pointToPoint,         // 1.238
      areaM2: hM.area,                        // 0.995
      sideFt: mToFt(hM.side),                 // 2.03  (2'-0 3/8")
      flatToFlatFt: mToFt(hM.flatToFlat),     // 3.52  (3'-6 3/16")
      pointToPointFt: mToFt(hM.pointToPoint), // 4.06  (4'-0 3/4")
      areaFt2: mToFt(mToFt(hM.area)),         // 10.72  (m² → ft²)
    },
    dome: {
      diameterFt: ECO_DOME_DIAMETER_FT,       // 40
      radiusFt,                               // 20
      radiusM,                                // 6.096
      targetAngleDeg: ECO_DOME_TARGET_ANGLE_DEG, // 10.09
      hemisphereFt2: 2 * Math.PI * radiusFt * radiusFt, // 2513 — half-sphere surface, derived
    },
    panelCount: "tessellation-dependent", // the A01's own answer — never a fabricated number
  };
}

/** Short human labels for the two REFERENCE blocks in the Eco-Sphere See-details (voice-safe; no machine words). */
export function ecoFloorLabel() {
  const f = ecoFloor();
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return `Seven hexagon rooms · ${r2(f.perHexFt2)} ft² each · ${r2(f.flatToFlatFt)} ft across the flats · ${r2(f.sideFt)} ft a side · ${r2(f.pointToPointFt)} ft point to point · about ${r2(f.overallWidthFt)} ft × ${r2(f.overallDepthFt)} ft overall · ${f.totalFt2} ft² in all (${f.note})`;
}
export function ecoRoofLabel() {
  const r = ecoRoofPanel();
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return `40-ft hex-panel dome · each panel about ${r2(r.panel.flatToFlatFt)} ft across the flats (${r2(r.panel.areaFt2)} ft²) · the half-dome is about ${Math.round(r.dome.hemisphereFt2).toLocaleString()} ft² · the exact number of panels depends on how they tile across the dome`;
}
