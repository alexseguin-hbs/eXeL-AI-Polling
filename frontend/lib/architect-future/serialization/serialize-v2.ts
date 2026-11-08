// ARCHITECT-2525 / FUTURE · serialization/serialize-v2 — the canonical V2 serializer (plan §10).
// Includes canonical state, EXCLUDES view state. STUB (Phase 0); Phase 1 implements via an adapter over the donor
// canonical serializer. Behavioural tests load this and fail here until then.
import type { ArchitectProjectV2 } from "../domain/project";
import { notImplemented } from "../_notimpl";

/** Deterministic canonical string of the project's canonical fields only (no camera/selection/etc.). */
export function serializeV2(_project: ArchitectProjectV2): string {
  return notImplemented("serializeV2", 1);
}
