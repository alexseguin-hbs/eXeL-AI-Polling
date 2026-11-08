// ARCHITECT-2525 / FUTURE · adapters/legacy-v1 — the ONLY reader of the immutable V1 seed (plan §5/§6).
// Reads seeds/tiny-home-v1.ts (a donor candidate, READ-ONLY; it imports only canonical/units + types, nothing banned),
// returns its SEMANTIC program (bay identity, name, function, wet/dry) — NEVER its 10-ft coordinates — plus the
// deterministic source hash H0. Future regenerates all physical geometry (plan §6).
import { TINY_HOME_V1 } from "@/lib/architect-2525/seeds/tiny-home-v1";
import { sha256Hex } from "@/lib/wire-core/sha256";
import { canonicalStringify } from "../serialization/canonical-json";

export interface V1BayProgram {
  bay_code: string;
  legacy_slug: string;
  function: string;
  wet_class: string;
}

export interface V1Program {
  bays: V1BayProgram[];
  source_project_hash: string; // H0 — deterministic hash of the V1 semantic program
}

export function readV1Program(): V1Program {
  const bays: V1BayProgram[] = TINY_HOME_V1.spaces.map((s) => ({
    bay_code: s.bay_code,
    legacy_slug: s.legacy_slug,
    function: s.function,
    wet_class: s.wet_class,
  }));
  // H0 is a hash of the semantic program only (not the 10-ft geometry), so it is stable across geometry regeneration.
  const source_project_hash = sha256Hex(canonicalStringify(bays));
  return { bays, source_project_hash };
}
