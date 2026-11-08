// ARCHITECT-2525 / FUTURE · simulation/materials — take-off branches by construction method (plan §18, FCRS-21).
// FRAME lists studs/plates; PRINT must NOT list "2×6 studs @16 o.c." (T-MATERIAL). STUB (Phase 0); Phase 3 implements.
import type { ArchitectProjectV2 } from "../domain/project";
import type { TakeoffLine } from "../domain/construction";
import { notImplemented } from "../_notimpl";

export function materialTakeoff(_project: ArchitectProjectV2): TakeoffLine[] {
  return notImplemented("materialTakeoff", 3);
}
