// ARCHITECT-2525 / FUTURE · selectors/economics — read economics for display, labelled per domain (plan §19). STUB (Phase 0).
import type { ProjectEconomics } from "../domain/economics";
import { notImplemented } from "../_notimpl";

export interface EconomicsView {
  baselineLabel: string;   // "Baseline Build Estimate" — never a bare "Project Cost"
  baselineUsd: number | null;
  laborLabel: string;
  recognitionLabel: string;
  settlementLabel: string;
}

export function economicsView(_economics: ProjectEconomics): EconomicsView {
  return notImplemented("economicsView", 3);
}
