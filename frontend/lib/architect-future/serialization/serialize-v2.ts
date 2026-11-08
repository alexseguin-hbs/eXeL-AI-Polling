// ARCHITECT-2525 / FUTURE · serialization/serialize-v2 — the canonical V2 serializer (plan §10).
// Deterministic canonical string of the whole canonical project (sorted keys). View state is excluded because
// ArchitectProjectV2 holds none (camera/selection live in React state, never here).
import type { ArchitectProjectV2 } from "../domain/project";
import { canonicalStringify } from "./canonical-json";

export function serializeV2(project: ArchitectProjectV2): string {
  return canonicalStringify(project);
}
