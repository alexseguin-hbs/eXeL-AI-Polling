// ARCHITECT-2525 / FUTURE · selectors/ratings — read the three rating records for display, never conflating them
// (plan §20, FCRS-29/30/31). A ReferenceClaim never renders as a qualification; a DesignTarget never renders as a
// qualification. The three stay three — the view only groups and counts, it invents nothing.
import type { ReferenceClaim, DesignTarget, ProjectQualification } from "../domain/ratings";

export interface RatingsView {
  references: ReferenceClaim[];
  targets: DesignTarget[];
  qualifications: ProjectQualification[];
  counts: { references: number; targets: number; qualifications: number };
}

export function ratingsView(
  references: ReferenceClaim[],
  targets: DesignTarget[],
  qualifications: ProjectQualification[],
): RatingsView {
  // defensive copies so the view can never mutate canonical arrays; the three lists are kept strictly separate.
  return {
    references: references.slice(),
    targets: targets.slice(),
    qualifications: qualifications.slice(),
    counts: { references: references.length, targets: targets.length, qualifications: qualifications.length },
  };
}

/**
 * Promote a ReferenceClaim into a DesignTarget (a human choice). It NEVER mutates the reference — it returns a NEW
 * DesignTarget that points back at the reference (FCRS-30). The author must be a human (enforced by the HumanActor type).
 */
export function targetFromReference(ref: ReferenceClaim, value: string, actor: DesignTarget["actor"], now: string): DesignTarget {
  return {
    target_id: `target-${ref.claim_id}-${now}`,
    label: ref.label,
    target_value: value,
    actor,
    created_at: now,
    from_reference_id: ref.claim_id,
  };
}
