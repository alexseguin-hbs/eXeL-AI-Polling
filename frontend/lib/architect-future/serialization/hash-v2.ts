// ARCHITECT-2525 / FUTURE · serialization/hash-v2 — canonical V2 identity (plan §10, FCRS-07/08).
// Canonical geometry/assets change the hash; view state does not. STUB (Phase 0); Phase 1 wraps the donor
// canonicalHash (serialize.ts:85) + wire-core/sha256 — NOT a second hand-written SHA-256. T-HASH loads this.
import type { ArchitectProjectV2 } from "../domain/project";
import { notImplemented } from "../_notimpl";

export function hashV2(_project: ArchitectProjectV2): string {
  return notImplemented("hashV2", 1);
}
