// ARCHITECT-2525 / FUTURE · rcore/replay — reconstruct the canonical project from the event log (plan §12, FCRS-09).
// Every canonical change is an event; replay(events) must reproduce the live state exactly (T-REPLAY). STUB (Phase 0).
import type { ArchitectProjectV2 } from "../domain/project";
import type { FutureEvent } from "./events";
import { notImplemented } from "../_notimpl";

export function replay(_events: FutureEvent[]): ArchitectProjectV2 {
  return notImplemented("replay", 1);
}

/** Apply one event forward onto a project (pure). */
export function applyEvent(_project: ArchitectProjectV2, _event: FutureEvent): ArchitectProjectV2 {
  return notImplemented("applyEvent", 1);
}
