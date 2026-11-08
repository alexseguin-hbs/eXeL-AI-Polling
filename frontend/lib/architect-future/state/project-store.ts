// ARCHITECT-2525 / FUTURE · state/project-store — persist a VALIDATED event log, not a derived snapshot (plan §10/§12).
// Loading replays the log and verifies the head hash, so a tampered or stale store is rejected rather than trusted.
import type { ArchitectProjectV2 } from "../domain/project";
import type { FutureEvent } from "../rcore/events";
import { replay } from "../rcore/replay";
import { hashV2 } from "../serialization/hash-v2";

export const STORE_KEY = "architect-future-v2";

export interface StoredProject {
  events: FutureEvent[];
  head_hash: string;
}

export function serializeStore(events: FutureEvent[], headHash: string): string {
  const store: StoredProject = { events, head_hash: headHash };
  return JSON.stringify(store);
}

/** Returns the replayed project when the stored head hash matches; null on empty/invalid/tampered input. */
export function loadProject(raw: string | null): ArchitectProjectV2 | null {
  if (!raw) return null;
  let store: StoredProject;
  try { store = JSON.parse(raw) as StoredProject; } catch { return null; }
  if (!store || !Array.isArray(store.events) || store.events.length === 0) return null;
  let project: ArchitectProjectV2;
  try { project = replay(store.events); } catch { return null; }
  if (hashV2(project) !== store.head_hash) return null; // tampered or stale
  return project;
}
