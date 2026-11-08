// ARCHITECT-2525 / FUTURE · simulation/costs — the four economic domains + the firewall (plan §19, FCRS-22..27).
// baselineEstimate sums the ten ASSUMED rows to a DERIVED 240,000 (T-COST). applyJurisdiction may change ONLY
// LocalSettlement (T-FIREWALL) — the branded types already make a cross-domain assignment a compile error. STUB (Phase 0).
import type { BaselineBuildEstimate, ProjectEconomics, LocalSettlement } from "../domain/economics";
import { notImplemented } from "../_notimpl";

export function baselineEstimate(): BaselineBuildEstimate {
  return notImplemented("baselineEstimate", 3);
}

/** Returns economics with ONLY settlement changed; baseline/labor/recognition are passed through untouched. */
export function applyJurisdiction(_economics: ProjectEconomics, _jurisdictionId: string): ProjectEconomics {
  return notImplemented("applyJurisdiction", 3);
}

export function settlementFor(_jurisdictionId: string, _uEarned: number | null): LocalSettlement {
  return notImplemented("settlementFor", 3);
}
