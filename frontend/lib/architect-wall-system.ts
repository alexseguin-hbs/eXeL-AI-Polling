/**
 * ARCHITECT-2525 · ICON WALL-SYSTEM STANDARD (operator 2026-11-02, ICON reference deck + MIT CSHub whitepaper).
 * =================================================================================================
 * ICON's construction-cost nomenclature calls the whole wall assembly the "Wall System" — framing is just ONE
 * component inside it. This module is the ONE source for that standard, so every surface reads the same numbers:
 *   • the Wall System $/sq-ft composition (ICON's "Typical Wall System": Framing $21 · Dry Wall $3 · Sheathing $1 ·
 *     Moisture Barrier $3 · Siding $5 · Trim $2 = $35/sq ft — the national-average finished wall),
 *   • ICON's own finished wall system at $34/sq ft (2024), BELOW the $35/sq-ft national average,
 *   • the ICON Wall System ratings (R-22 · 250 MPH wind · 2+ hour fire · termite/mold/flood).
 *
 * "Wall System vs Framing": the WALL SYSTEM is the $35/sq-ft assembly; FRAMING is the $21/sq-ft structural line
 * within it (the stud skeleton). The cost ELEMENT / build phase is now "Wall System"; "framing" survives only for
 * the structural member take-off, the load-bearing check, and the room-designer stud palette.
 *
 * PROVENANCE: ICON published figures (operator's ICON reference deck, 2026-11-02). The low-carbon concrete ("Carbon X")
 * carbon basis is the MIT Concrete Sustainability Hub × ICON whitepaper "Reducing carbon emissions in the built
 * environment: A case study in 3D printed homes" (Lolli, AzariJafari, Monkman, Mehlomakulu, Kirchain). Figures are
 * ASSUMED/ESTIMATE where the deck does not state a precise value; no price is invented beyond the deck.
 *
 * Pure data + pure helpers, no React → replayable, gate-checked (tests/architect-wall-system.test.mjs).
 */

/** One priced layer of the wall system, $/sq ft of WALL (ICON "Typical Wall System"). `isFraming` marks the one
 *  line that is the structural FRAMING component (so a surface can show "framing is $21 of the $35 wall system"). */
export interface WallLayer { layer: string; usdPerSqFt: number; isFraming?: boolean; }

export const WALL_SYSTEM_LAYERS: WallLayer[] = [
  { layer: "Framing", usdPerSqFt: 21, isFraming: true },
  { layer: "Dry Wall", usdPerSqFt: 3 },
  { layer: "Sheathing", usdPerSqFt: 1 },
  { layer: "Moisture Barrier", usdPerSqFt: 3 },
  { layer: "Siding", usdPerSqFt: 5 },
  { layer: "Trim", usdPerSqFt: 2 },
];

/** The typical finished wall system = the national average ($35/sq ft), the SUM of the layers. */
export const NATIONAL_AVG_WALL_USD_PER_SQFT = 35;
/** ICON's finished wall system, 2024 — $34/sq ft, BELOW the national average (the deck's trajectory $315→…→$34). */
export const ICON_WALL_USD_PER_SQFT = 34;

/** ICON Wall System ratings (operator 2026-11-02: R-22 · 250 MPH wind · 2+ hour fire · termite/mold/flood). The
 *  wind/fire figures use the operator's latest ratings slide (250 MPH, 2+ hours) over the earlier 200+ MPH / 2 hr. */
export const ICON_WALL_SPECS: string[] = [
  "R-22",
  "2+ Hour Fire Rating",
  "250 MPH Wind Rating",
  "Termite Proof",
  "Mold Resistant",
  "Flood Resilient",
];

/** The one headline rating figures, for surfaces that show them numerically. */
export const ICON_WALL_FIRE_HOURS = 2;        // "2+ hours"
export const ICON_WALL_WIND_MPH = 250;        // "250 MPH"
export const ICON_WALL_R_VALUE = 22;          // "R-22"

/** ICON PHOENIX — the next-gen printer / D24 robot (operator 2026-11-02). The 27′ build height is what unlocks
 *  MULTI-STORY (two-story) printed homes; one operator runs multiple systems, it moves around the site, it is a true
 *  robot. Figures from the ICON deck (ESTIMATE where not stated). This is why the 3D-Print method can go two stories. */
export interface PrinterSpec {
  name: string; model: string;
  footprintFt2: number;   // 24,000 sq ft reach
  buildHeightFt: number;  // 27′ — the multi-story enabler
  maxFloors: number;      // 2 (two-story)
  setupHours: number;     // 3-hour setup
  wallUsdPerSqFt: number; // $25/sq ft printed walls (multi-story) — printing collapses labour, below the $34 ICON / $35 avg
  specs: string[];        // the full spec list
  benefits: string[];     // Lower Cost · Two Story · Full Shell
}
export const ICON_PHOENIX: PrinterSpec = {
  name: "Phoenix", model: "D24",
  footprintFt2: 24000, buildHeightFt: 27, maxFloors: 2, setupHours: 3,
  wallUsdPerSqFt: 25,
  specs: ["24,000 sq ft", "27′ build height", "3 Hour setup", "Single Operator for multiple systems", "Onsite Mobility", "True Robot"],
  benefits: ["Lower Cost", "Two Story", "Full Shell"],
};
/** The max storeys a 3D-Print (Phoenix) build can reach — the multi-story capability (2). Stick/hex stay single-story here. */
export function phoenixMaxFloors(): number { return ICON_PHOENIX.maxFloors; }
/** Phoenix printed walls, $/sq ft (operator 2026-11-02: "phoenix multi story is 25/sq ft") — the cheapest wall tier:
 *  $25 printed vs $34 ICON finished vs $35 national average (printing collapses the site labour). */
export const PHOENIX_WALL_USD_PER_SQFT = ICON_PHOENIX.wallUsdPerSqFt;   // one source — derive, don't re-literal

/** Σ of the layers = the typical/national-average $/sq ft (35). */
export function wallSystemTypicalPerSqFt(): number {
  return WALL_SYSTEM_LAYERS.reduce((a, l) => a + l.usdPerSqFt, 0);
}
/** The framing share of the wall system ($/sq ft) — the "framing vs wall system" number (21 of 35). */
export function framingSharePerSqFt(): number {
  return WALL_SYSTEM_LAYERS.find((l) => l.isFraming)?.usdPerSqFt ?? 0;
}
/** ICON's saving vs the national average ($/sq ft) — 35 − 34 = 1 (and the full trajectory from $315). */
export function iconWallSavingPerSqFt(): number {
  return NATIONAL_AVG_WALL_USD_PER_SQFT - ICON_WALL_USD_PER_SQFT;
}
