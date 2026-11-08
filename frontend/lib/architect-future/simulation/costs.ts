// ARCHITECT-2525 / FUTURE · simulation/costs — the four economic domains + the firewall (plan §19, FCRS-22..27).
// baselineEstimate sums the ten ASSUMED rows to a DERIVED 240,000 (T-COST). applyJurisdiction may change ONLY
// LocalSettlement (T-FIREWALL) — the branded Usd<Domain> types already make a cross-domain assignment a compile
// error, so a settlement value can never be laundered into a labour input (plan §40.7).
import type { BaselineBuildEstimate, ProjectEconomics, LocalSettlement } from "../domain/economics";
import { BASELINE_ROWS, BASELINE_TOTAL_USD, tagUsd } from "../domain/economics";
import { CLEAR_FT2 } from "../domain/geometry";
import { settlementForJurisdiction } from "../adapters/labor";

/**
 * The Baseline Build Estimate: the ten ASSUMED illustrative rows, summed to a DERIVED total. This is the ONE source of
 * the baseline (the V1→V2 transform calls it too), so the number is declared once. Not a quote, not a market benchmark.
 * per_net_ft2 keeps Math.round($240,000 ÷ 900) = $267 (integer), identical to the project's canonical economics.
 */
export function baselineEstimate(): BaselineBuildEstimate {
  const sections = BASELINE_ROWS.map((r) => ({ id: r.id, name: r.name, usd: tagUsd("baseline", r.usd), evidence: "ASSUMED" as const }));
  const sum = BASELINE_ROWS.reduce((s, r) => s + r.usd, 0);
  if (sum !== BASELINE_TOTAL_USD) throw new Error(`architect-future: baseline rows sum to ${sum}, expected ${BASELINE_TOTAL_USD}`);
  return {
    kind: "BaselineBuildEstimate",
    sections,
    total_usd: tagUsd("baseline", BASELINE_TOTAL_USD),
    total_evidence: "DERIVED",
    per_net_ft2_usd: Math.round(BASELINE_TOTAL_USD / CLEAR_FT2),
    per_net_ft2_evidence: "DERIVED",
  };
}

/** The Local Settlement for a jurisdiction (local currency authoritative). Thin re-export of the labour adapter. */
export function settlementFor(jurisdictionId: string, uEarned: number | null): LocalSettlement {
  return settlementForJurisdiction(jurisdictionId, uEarned);
}

/**
 * The economic firewall (FCRS-26): a jurisdiction change may move ONLY LocalSettlement. baseline, labor and recognition
 * are passed through BY REFERENCE untouched, so a caller can prove `next.baseline === prev.baseline` etc. (T-FIREWALL).
 */
export function applyJurisdiction(economics: ProjectEconomics, jurisdictionId: string): ProjectEconomics {
  return { ...economics, settlement: settlementForJurisdiction(jurisdictionId, economics.recognition.u_earned) };
}
