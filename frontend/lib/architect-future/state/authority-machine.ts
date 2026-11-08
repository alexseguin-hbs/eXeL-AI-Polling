// ARCHITECT-2525 / FUTURE · state/authority-machine — Submit ≠ Review ≠ Approve (plan §13, FCRS-01/33).
// approve/qualify REQUIRE an authenticated human, enforced HERE (reducer), not only in a UI helper. STUB (Phase 0).
import type { ArchitectProjectV2 } from "../domain/project";
import type { ActorRef } from "../domain/actors";
import { notImplemented } from "../_notimpl";

export interface AuthorityResult {
  project: ArchitectProjectV2;
  accepted: boolean;
  rejected_reason?: string;
}

export function submit(_project: ArchitectProjectV2, _actor: ActorRef): AuthorityResult {
  return notImplemented("submit", 4);
}
export function review(_project: ArchitectProjectV2, _actor: ActorRef): AuthorityResult {
  return notImplemented("review", 4);
}
/** Rejects unless the actor is an AuthenticatedHumanActor (T-ACTOR-AUTH). */
export function approve(_project: ArchitectProjectV2, _actor: ActorRef): AuthorityResult {
  return notImplemented("approve", 4);
}
