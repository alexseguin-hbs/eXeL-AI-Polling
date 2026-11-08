// ARCHITECT-2525 / FUTURE · serialization/hash-v2 — canonical V2 identity (plan §10, FCRS-07/08).
// Canonical geometry/assets/etc. change the hash; view state and volatile/provenance fields do not. Wraps the
// donor wire-core sha256 over the canonical DESIGN subset — NOT a second hand-written SHA-256.
import type { ArchitectProjectV2 } from "../domain/project";
import { sha256Hex } from "@/lib/wire-core/sha256";
import { canonicalStringify, hashableProject } from "./canonical-json";

export function hashV2(project: ArchitectProjectV2): string {
  return sha256Hex(canonicalStringify(hashableProject(project)));
}
