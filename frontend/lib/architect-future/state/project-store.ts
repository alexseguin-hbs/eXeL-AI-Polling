// ARCHITECT-2525 / FUTURE · state/project-store — load/save the project as a validated event log, not a snapshot
// (plan §10/§12). Loading replays and verifies the hash. STUB (Phase 0); Phase 1/2 implement.
import type { ArchitectProjectV2 } from "../domain/project";
import type { FutureEvent } from "../rcore/events";
import { notImplemented } from "../_notimpl";

export const STORE_KEY = "architect-future-v2";

export interface StoredProject {
  events: FutureEvent[];
  head_hash: string;
}

export function loadProject(_raw: string | null): ArchitectProjectV2 | null {
  return notImplemented("loadProject", 2);
}
export function serializeStore(_events: FutureEvent[], _headHash: string): string {
  return notImplemented("serializeStore", 2);
}
