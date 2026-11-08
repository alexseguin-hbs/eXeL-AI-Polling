// ARCHITECT-2525 / FUTURE · adapters/legacy-v1 — the ONLY reader of the immutable V1 seed (plan §5/§6).
// Reads seeds/tiny-home-v1.ts (a donor candidate, READ-ONLY) through this adapter; never mutates it. STUB (Phase 0).
import { notImplemented } from "../_notimpl";

/** Returns the V1 seed's semantic program (bay identity, name, function, wet/dry) — NOT its 10-ft coordinates. */
export function readV1Program(): unknown {
  return notImplemented("readV1Program", 1);
}
