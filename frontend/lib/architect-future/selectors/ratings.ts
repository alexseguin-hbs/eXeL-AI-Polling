// ARCHITECT-2525 / FUTURE · selectors/ratings — read the three rating records for display, never conflating them
// (plan §20, FCRS-29/30). A ReferenceClaim never renders as a qualification. STUB (Phase 0); Phase 4 implements.
import type { ReferenceClaim, DesignTarget, ProjectQualification } from "../domain/ratings";
import { notImplemented } from "../_notimpl";

export interface RatingsView {
  references: ReferenceClaim[];
  targets: DesignTarget[];
  qualifications: ProjectQualification[];
}

export function ratingsView(
  _references: ReferenceClaim[],
  _targets: DesignTarget[],
  _qualifications: ProjectQualification[],
): RatingsView {
  return notImplemented("ratingsView", 4);
}
