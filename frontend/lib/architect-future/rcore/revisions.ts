// ARCHITECT-2525 / FUTURE · rcore/revisions — commit a canonical change as a chained event (plan §12).
// Pure: computes the parent hash, stamps the event with the parent-hash chain, and returns the child with its
// revision id bumped. The caller owns the monotonic `sequence` (e.g. events.length + 1) and the event payload.
import type { ArchitectProjectV2 } from "../domain/project";
import type { FutureEvent, EventType } from "./events";
import type { ActorRef } from "../domain/actors";
import { hashV2 } from "../serialization/hash-v2";

export interface CommitResult {
  project: ArchitectProjectV2;
  event: FutureEvent;
}

export function commit(
  parent: ArchitectProjectV2,
  child: ArchitectProjectV2,
  type: EventType,
  actor: ActorRef,
  now: string,
  sequence: number,
  payload: Record<string, unknown> = {},
): CommitResult {
  const parent_hash = hashV2(parent);
  const event: FutureEvent = {
    event_id: `evt-${sequence}-${type.toLowerCase()}`,
    sequence,
    event_type: type,
    actor,
    occurred_at: now,
    parent_hash,
    payload,
  };
  return { project: { ...child, revision_id: "r" + sequence }, event };
}
