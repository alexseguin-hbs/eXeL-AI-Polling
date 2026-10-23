// SPECS / ARCHITECT-2525 §11 / §XXXI(A) — the production Runtime CONSTRUCTOR. buildProjectFromSeed is the
// ONE path that turns the tiny-home seed into the canonical R0 ArchitectProject, and the same path
// initializes real projects, so Runtime(seed) == Replay(R0) from day one. It mints no id (the seed carries
// pinned UUIDv7 literals) and sets no timestamp, so the R0 project_hash is reproducible across runs and
// from a fresh checkout (Thor). The edge engine + HI-ACCEPT commit path live in runtime-edit.ts (Block B) —
// a separate file, a separate owner, zero Phase-1 collision (Enlil).
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-seed.test.mjs

import { assertSafeInt, areaUm2, sumAreaUm2 } from "./units";
import { projectHash } from "./serialize";
import type {
  ArchitectProject, CanonicalEntity, EvidenceState,
  ProjectEntity, SiteEntity, BuildingEntity, StoreyEntity, SpaceEntity, RCoreSnapshot,
} from "./types";
import type { TinyHomeSeed } from "../seeds/tiny-home-v1";

const R0 = "R0";

/** An ASSUMED/CURRENT evidence state sourced at a revision (the seed program is ASSUMED, §16). */
function assumedAt(revision: string): EvidenceState {
  return {
    authority_state: "ASSUMED",
    validity: "CURRENT",
    source_revision_id: revision,
    invalidated_by_revision_id: null,
    invalidated_reason: null,
  };
}

/**
 * SPECS / ARCHITECT-2525 §11 — build the canonical R0 project from the seed. Polymorphic entities keyed by
 * entity_type (Project→Site→Building→Storey→Space×9); datum fixed at [0,0,0] (C1 SW corner, §05); seed
 * state G2_PLAN / REVIEWABLE / ASSUMED / R0 (§IX); never marked HI_APPROVED. Every dimension and derived
 * area is safe-int guarded (§24).
 */
export function buildProjectFromSeed(seed: TinyHomeSeed): ArchitectProject {
  const project: ProjectEntity = {
    entity_id: seed.project.entity_id, entity_type: "PROJECT", parent_id: null,
    revision_id: R0, evidence: assumedAt(R0), name: seed.project.name,
  };
  const site: SiteEntity = {
    entity_id: seed.site.entity_id, entity_type: "SITE", parent_id: seed.project.entity_id,
    revision_id: R0, evidence: assumedAt(R0), name: seed.site.name,
  };
  const building: BuildingEntity = {
    entity_id: seed.building.entity_id, entity_type: "BUILDING", parent_id: seed.site.entity_id,
    revision_id: R0, evidence: assumedAt(R0), name: seed.building.name,
  };
  const storey: StoreyEntity = {
    entity_id: seed.storey.entity_id, entity_type: "STOREY", parent_id: seed.building.entity_id,
    revision_id: R0, evidence: assumedAt(R0), name: seed.storey.name,
    height_um: assertSafeInt(seed.storey_height_um, "storey.height_um"),
  };
  const spaces: SpaceEntity[] = seed.spaces.map((s) => {
    assertSafeInt(s.x_um, `${s.bay_code}.x_um`);
    assertSafeInt(s.y_um, `${s.bay_code}.y_um`);
    assertSafeInt(s.z_um, `${s.bay_code}.z_um`);
    assertSafeInt(s.width_um, `${s.bay_code}.width_um`);
    assertSafeInt(s.depth_um, `${s.bay_code}.depth_um`);
    areaUm2(s.width_um, s.depth_um); // guards the derived area product (§24)
    return {
      entity_id: s.entity_id, entity_type: "SPACE", parent_id: seed.storey.entity_id,
      revision_id: R0, evidence: assumedAt(R0),
      bay_code: s.bay_code, legacy_slug: s.legacy_slug, shape: { kind: "RECT" },
      x_um: s.x_um, y_um: s.y_um, z_um: s.z_um, width_um: s.width_um, depth_um: s.depth_um,
      function: s.function, wet_class: s.wet_class,
    };
  });
  const entities: CanonicalEntity[] = [project, site, building, storey, ...spaces];
  return {
    schema_version: seed.schema_version,
    project_id: seed.project.entity_id,
    portfolio_stage: "G2_PLAN",
    plan_state: "REVIEWABLE",
    datum: [0, 0, 0],
    current_revision_id: R0,
    entities,
    financial_record_id: null,
    financial_record_hash: null,
  };
}

/** SPECS §24 — net program area in µm² (sum of Space areas, each product + the running total safe-int guarded). */
export function netProgramAreaUm2(project: ArchitectProject): number {
  const areas = project.entities
    .filter((e): e is SpaceEntity => e.entity_type === "SPACE")
    .map((s) => areaUm2(s.width_um, s.depth_um));
  return sumAreaUm2(areas);
}

/** The count of Space entities (for the metric strip / HASH_PROOF). */
export function spaceCount(project: ArchitectProject): number {
  return project.entities.filter((e) => e.entity_type === "SPACE").length;
}

/** The count of WET Spaces, and of BATH Spaces (the seed proof: 3 wet, 1 bath). */
export function wetCount(project: ArchitectProject): number {
  return project.entities.filter((e) => e.entity_type === "SPACE" && (e as SpaceEntity).wet_class === "WET").length;
}
export function bathCount(project: ArchitectProject): number {
  return project.entities.filter((e) => e.entity_type === "SPACE" && (e as SpaceEntity).function === "BATH").length;
}

/** SPECS §11 — the R0 snapshot GENERATED through the production serializer+hash (never hand-written). */
export function buildR0Snapshot(project: ArchitectProject): RCoreSnapshot {
  return { revision_id: project.current_revision_id, project_hash: projectHash(project), project };
}
