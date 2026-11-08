// ARCHITECT-2525 / FUTURE · domain/economics — four INDEPENDENT economic domains (plan §19, FCRS-23..27).
// BaselineBuildEstimate · ProjectLaborCost · GlobalRecognition · LocalSettlement. A generic "Project Cost" is
// prohibited. The firewall is architectural: branded types make a settlement value UNassignable to a labour input,
// so jurisdiction can only ever move LocalSettlement (T-FIREWALL, FCRS-26).

import type { EvidenceState } from "./evidence";

/** Branding: each domain's money is a distinct nominal type; one cannot be passed where another is expected. */
declare const DOMAIN: unique symbol;
export type Usd<Domain extends string> = number & { readonly [DOMAIN]: Domain };
export function tagUsd<D extends string>(_domain: D, n: number): Usd<D> { return n as Usd<D>; }

/** The ten evidenced illustrative baseline rows (plan §19). Rows ASSUMED; the total DERIVED. First row = "Site Work". */
export interface BaselineSection {
  id: string;
  name: string;
  usd: Usd<"baseline">;
  evidence: "ASSUMED";
}
export interface BaselineBuildEstimate {
  kind: "BaselineBuildEstimate";
  sections: BaselineSection[];
  total_usd: Usd<"baseline">;     // DERIVED = Σ sections
  total_evidence: "DERIVED";
  per_net_ft2_usd: number;        // $240,000 ÷ 900 ≈ $267
  per_net_ft2_evidence: "DERIVED"; // DERIVED from an ASSUMED baseline — not a market benchmark (every number carries evidence)
}

/** Distinct domain: labour cost in USD. Only a labour value is a Usd<"labor">. */
export interface ProjectLaborCost {
  kind: "ProjectLaborCost";
  labor_usd: Usd<"labor"> | null;
  // The labour adapter (adapters/labor.ts) narrows to its own LaborEvidenceState (QUOTED | STORED | US_RESEARCH |
  // HI_NORMALIZED | NOT_CALCULATED); surfaced here as the general EvidenceState only where the two overlap
  // (QUOTED / NOT_CALCULATED). Never carries a fabricated state.
  evidence: EvidenceState;
}

/** Distinct domain: global recognition (웃), jurisdiction-independent (plan §19, FCRS-24). */
export interface GlobalRecognition {
  kind: "GlobalRecognition";
  u_earned: number | null;
  evidence: EvidenceState;
}

/** Distinct domain: LOCAL settlement, the ONLY thing a jurisdiction change may move (plan §19, FCRS-25/26). */
export interface LocalSettlement {
  kind: "LocalSettlement";
  jurisdiction_id: string;
  native_currency: string;
  settlement_native: Usd<"settlement"> | null;
  evidence: EvidenceState;
}

export interface ProjectEconomics {
  baseline: BaselineBuildEstimate;
  labor: ProjectLaborCost;
  recognition: GlobalRecognition;
  settlement: LocalSettlement;
}

/** The ten locked baseline rows (plan §19) — re-declared in Future, never imported from the banned estimate module. */
export const BASELINE_ROWS: ReadonlyArray<{ id: string; name: string; usd: number }> = [
  { id: "site", name: "Site Work", usd: 23_000 },
  { id: "foundation", name: "Foundation", usd: 33_000 },
  { id: "wall_system", name: "Wall System", usd: 48_000 },
  { id: "roof", name: "Roof", usd: 17_000 },
  { id: "plumbing", name: "Plumbing", usd: 21_000 },
  { id: "electrical", name: "Electrical", usd: 18_000 },
  { id: "hvac", name: "HVAC", usd: 16_000 },
  { id: "drywall", name: "Drywall", usd: 14_000 },
  { id: "interior_finish", name: "Interior Finish", usd: 40_000 },
  { id: "landscaping", name: "Landscaping", usd: 10_000 },
] as const;
export const BASELINE_TOTAL_USD = 240_000;
