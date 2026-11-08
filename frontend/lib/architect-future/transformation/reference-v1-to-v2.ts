// ARCHITECT-2525 / FUTURE · transformation/reference-v1-to-v2 — the explicit V1→V2 reference transformation (plan §11).
// Pure, deterministic, no hidden random/time, never mutates V1. Same V1 + same profile → same V2 + same hash.
// STUB (Phase 0): Phase 1 implements it. Behavioural test T-TRANSFORM loads this and fails here until then.
import type { ArchitectProjectV2 } from "../domain/project";
import type { ActorRef } from "../domain/actors";
import type { ProjectTransformedFromV1Event } from "../rcore/events";
import { notImplemented } from "../_notimpl";

export interface TransformResult {
  project: ArchitectProjectV2;
  event: ProjectTransformedFromV1Event;
}

/** `v1` is the immutable legacy seed (read-only input); `profileId` is REFERENCE_3X3_12_10_1. */
export function transformV1toV2(_v1: unknown, _profileId: string, _actor: ActorRef, _now: string): TransformResult {
  return notImplemented("transformV1toV2", 1);
}
