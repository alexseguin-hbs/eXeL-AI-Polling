/**
 * ARCHITECT-2525 · BUILDING CODES / APPROVALS — curated static standards dataset (Vision 2525).
 * =============================================================================================
 * Pure, BUNDLED-STATIC (no runtime fetch — Vision-2525 determinism rule). Headline requirements were
 * researched from public code sources at authoring time and baked in with citations. This is a planning
 * aid to anchor approvals — NOT a permit or a stamped code analysis. Always verify with the local AHJ.
 * Sources (public): ICC IBC 2024 + IRC 2021 (codes.iccsafe.org) · IRC Appendix Q "Tiny Houses" · Texas
 * TDLR/TWIA/TCEQ OSSF · US DOE/EPA ENERGY STAR + IECC 2021 · USGBC LEED for Homes.
 *
 * officialUrl: the publisher's own free read-only page for the code (operator 2026-11-02: "place download of
 * 2024 IBC in the building-code section"). The I-Codes are ICC-copyrighted — we do NOT host or bundle the PDF;
 * we link ICC Digital Codes, where anyone can READ the code free (Basic view) and purchase the full PDF. An
 * honest source link, not a bundled file.
 */
export type StandardScope = "usa" | "texas" | "tiny" | "sustainable";
export interface BuildingStandard {
  id: string; name: string; scope: StandardScope; authority: string; citation: string;
  requirements: string[];
  officialUrl?: string;   // the publisher's own free read-only page (ICC Digital Codes) — link, never a bundled PDF
}

export const STANDARDS: BuildingStandard[] = [
  {
    // operator 2026-11-02: "Place download of 2024 International Building Code (IBC) in … building code section."
    // The IBC governs commercial, multi-family and larger/taller buildings (the IRC covers 1–2-family dwellings).
    id: "usa-ibc-2024", name: "USA · IBC 2024", scope: "usa", authority: "ICC / local AHJ",
    citation: "ICC International Building Code 2024 (codes.iccsafe.org)",
    officialUrl: "https://codes.iccsafe.org/content/IBC2024V2.0",
    requirements: [
      "Scope: commercial, multi-family (Group R), assembly, and buildings beyond the IRC's 1–2-family limit (§101)",
      "Use-and-occupancy classification + allowable height/area by construction type (Ch. 3, 5, 6)",
      "Fire-resistance ratings, fire/smoke-protected assemblies, sprinklers (Ch. 7, 9)",
      "Means of egress: occupant load, exit count + width, travel distance (Ch. 10)",
      "Accessibility to ICC A117.1 (Ch. 11)",
      "Structural: NEW 2024 tornado loads + updated wind/seismic/snow (Ch. 16, ASCE 7-22)",
    ],
  },
  {
    id: "usa-irc-2021", name: "USA · IRC 2021", scope: "usa", authority: "ICC / local AHJ",
    citation: "ICC International Residential Code 2021",
    requirements: [
      "Habitable rooms: ceiling height ≥ 7'-0\" (R305)",
      "Emergency egress: openable area ≥ 5.7 sf, sill ≤ 44\" (R310)",
      "Smoke + CO alarms in each bedroom, outside sleeping areas, every level (R314/R315)",
      "Stairs: max 7¾\" rise, min 10\" run; guards ≥ 36\"; handrails 34–38\" (R311/R312)",
      "GFCI + AFCI branch-circuit protection (E3902/E3901)",
      "Envelope R-values per IECC climate zone (N1102)",
    ],
  },
  {
    id: "texas-irc", name: "Texas · IRC + state amendments", scope: "texas", authority: "TDLR · TWIA · local AHJ",
    citation: "Texas adopts IRC; TDLR IPTA · TWIA windstorm · TCEQ OSSF",
    requirements: [
      "No statewide residential code enforcement outside incorporated municipalities",
      "Coastal windstorm (TWIA/WPI-8): design wind 115–140 mph, tie-down + inspection",
      "Energy: 2015 IECC (state-adopted baseline)",
      "Rural on-site sewage (TCEQ OSSF) permit where no municipal sewer",
      "Foundation for expansive clay soils (post-tension slab common)",
    ],
  },
  {
    id: "tiny-appendix-q", name: "Tiny Home USA · IRC Appendix Q", scope: "tiny", authority: "ICC AHJ (adoption varies)",
    citation: "IRC Appendix Q — Tiny Houses (≤400 sf)",
    requirements: [
      "Dwelling ≤ 400 sf (excluding lofts)",
      "Ceiling height ≥ 6'-8\" (6'-4\" at bath/kitchen) (AQ104.1)",
      "Loft: min 35 sf, ≥ 5' in one horizontal dimension (AQ104.2)",
      "Loft access: stair, ladder, or alternating-tread device (AQ105)",
      "Emergency escape + rescue opening from sleeping loft (AQ104.4)",
    ],
  },
  {
    id: "sustainable", name: "Sustainable · ENERGY STAR / IECC / LEED", scope: "sustainable", authority: "US EPA · DOE · USGBC",
    citation: "ENERGY STAR Single-Family New Homes · IECC 2021 · LEED for Homes",
    requirements: [
      "ENERGY STAR: envelope + HVAC ≥ ~10% better than code, third-party verified",
      "Air-tightness: blower-door ≤ 3 ACH50 (IECC 2021 climate-dependent)",
      "Insulation to IECC 2021 zone (attic R-49/60, walls R-20+5)",
      "Solar-ready conduit + roof zone; heat-pump / high-SEER HVAC",
      "Water: ≤ 1.28 gpf toilets, ≤ 1.5 gpm faucets (WaterSense)",
    ],
  },
];

export const STANDARD_BY_ID: Record<string, BuildingStandard> = Object.fromEntries(STANDARDS.map((s) => [s.id, s]));
export function requirementsFor(ids: string[]): BuildingStandard[] {
  return ids.map((id) => STANDARD_BY_ID[id]).filter(Boolean);
}
export const CODES_DISCLAIMER = "Planning aid only — headline requirements, not a permit or stamped code analysis. Verify with your local jurisdiction (AHJ).";
