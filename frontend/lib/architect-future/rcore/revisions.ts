// ARCHITECT-2525 / FUTURE · rcore/revisions — commit a canonical change as a chained event (plan §12). STUB (Phase 0).
import type { ArchitectProjectV2 } from "../domain/project";
import type { FutureEvent, EventType } from "./events";
import type { ActorRef } from "../domain/actors";
import { notImplemented } from "../_notimpl";

export interface CommitResult {
  project: ArchitectProjectV2;
  event: FutureEvent;
}

/** Commit a canonical child state, emitting the matching event with a parent-hash chain. */
export function commit(
  _parent: ArchitectProjectV2,
  _child: ArchitectProjectV2,
  _type: EventType,
  _actor: ActorRef,
  _now: string,
): CommitResult {
  return notImplemented("commit", 1);
}
