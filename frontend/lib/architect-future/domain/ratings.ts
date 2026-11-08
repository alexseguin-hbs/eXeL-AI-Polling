// ARCHITECT-2525 / FUTURE · domain/ratings — three SEPARATE records (plan §20, FCRS-29/30/31/32).
// ReferenceClaim (external evidence) · DesignTarget (a human-chosen goal) · ProjectQualification (evidence + an
// authenticated human). Never one mutable status that drifts from reference to qualified. A heuristic score can
// never produce PASS/QUALIFIED (the invalid state below fails TypeScript).

import type { AuthenticatedHumanActor, HumanActor } from "./actors";

export interface ReferenceClaim {
  claim_id: string;
  label: string;
  /** a reference stays a reference; an unverifiable source is UNVERIFIED (plan §20). */
  evidence: "REFERENCE" | "UNVERIFIED";
  /** where it came from and when it was RECEIVED (received date ≠ source date, plan §20). */
  source: string;
  received_date?: string;
}

export interface DesignTarget {
  target_id: string;
  label: string;
  target_value: string;
  /** a design target is a human choice (never SYSTEM/AI); it never mutates the ReferenceClaim it came from. */
  actor: HumanActor;
  created_at: string;
  from_reference_id?: string;
}

/**
 * A ProjectQualification REQUIRES project-specific evidence and an authenticated human (FCRS-31/32).
 * The required fields make `{...; qualification_evidence: undefined}` a TypeScript error, so a score can't fake it.
 */
export interface ProjectQualification {
  qualification_id: string;
  label: string;
  qualified_value: string;
  qualification_evidence: string;        // required, non-optional — project-specific evidence
  qualified_by: AuthenticatedHumanActor; // required — an authenticated human, never SYSTEM/AI
  qualified_at: string;
}
