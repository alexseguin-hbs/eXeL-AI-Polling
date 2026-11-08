// ARCHITECT-2525 / FUTURE · domain/construction — construction method is canonical (plan §18, FCRS-20/21).
// Changing it changes the project and emits a canonical event; the material take-off branches by method
// (FRAME shows studs/plates; PRINT must NOT keep showing "2×6 studs @16 o.c.").

export const CONSTRUCTION_METHODS = ["UNDECIDED", "FRAME", "PRINT", "OTHER"] as const;
export type ConstructionMethod = (typeof CONSTRUCTION_METHODS)[number];

export interface ConstructionScenario {
  method: ConstructionMethod;
}

import type { EvidenceState } from "./evidence";

/** One take-off line, always tagged with method, source and evidence (plan §18). */
export interface TakeoffLine {
  item: string;
  qty: number;
  unit: string;
  method: ConstructionMethod;
  calculation: string;
  evidence: EvidenceState;
}
