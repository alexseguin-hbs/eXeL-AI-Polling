// ARCHITECT-2525 / FUTURE · adapters/labor — wraps the audited donor architect-labor.ts (plan §19, FCRS-23).
// Its local EvidenceState is aliased LaborEvidenceState and never merged with Future evidence. STUB (Phase 0).
import type { ProjectLaborCost } from "../domain/economics";
import { notImplemented } from "../_notimpl";

/** Labour's own evidence vocabulary, kept separate from the general one (plan §19). */
export type LaborEvidenceState =
  | "QUOTED" | "PREVAILING" | "STORED" | "HI_NORMALIZED" | "US_RESEARCH" | "NOT_CALCULATED";

export function projectLabor(_hours: number | null): ProjectLaborCost {
  return notImplemented("projectLabor", 3);
}
