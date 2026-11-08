// ARCHITECT-2525 / FUTURE · serialization/canonical-json — one deterministic stringifier for V2 (plan §10).
// Keys sorted recursively; undefined dropped; arrays kept in order. Used by serialize-v2 and hash-v2 so the
// canonical bytes are identical everywhere. No donor import; pure.
import type { ArchitectProjectV2 } from "../domain/project";

export function canonicalStringify(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalStringify).join(",") + "]";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o).filter((k) => o[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify(o[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

/**
 * The canonical DESIGN subset that identity (the V2 hash) is a function of (plan §10). INCLUDES physical geometry,
 * walls, openings, canonical assets, construction method, economics, design targets, assumptions, intent and the
 * authority STATE. EXCLUDES volatile/provenance fields (revision_id, provenance, created/updated timestamps,
 * authority.by/at) and all view state — so save/reload and a new revision leave the hash unchanged, while a
 * canonical edit changes it.
 */
export function hashableProject(p: ArchitectProjectV2): unknown {
  return {
    schema_version: p.schema_version,
    project_id: p.project_id,
    intent: p.intent,
    site: p.site,
    spaces: p.spaces,
    wall_assemblies: p.wall_assemblies,
    openings: p.openings,
    assets: p.assets,
    construction: p.construction,
    economics: p.economics,
    references: p.references,
    design_targets: p.design_targets.map((t) => ({ ...t, actor: undefined, created_at: undefined })),
    qualifications: p.qualifications.map((q) => ({ ...q, qualified_by: undefined, qualified_at: undefined })),
    assumptions: p.assumptions,
    authority_plan: p.authority.plan,
  };
}
