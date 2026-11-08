// ARCHITECT-2525 / FUTURE · transformation/reference-v1-to-v2 — the explicit V1→V2 reference transformation (plan §11).
// Pure, deterministic, no hidden random/time (the caller passes `now`), never mutates V1. Same V1 + same profile +
// same now/actor → byte-identical V2 and the same hash. Regenerates physical geometry at 12/10/1; carries only the
// V1 semantic program. Records a PROJECT_TRANSFORMED_FROM_V1 provenance event.
import type { ArchitectProjectV2, SiteDefinition } from "../domain/project";
import type { SpaceEntityV2, SpaceFunction, WetClass } from "../domain/geometry";
import type { ActorRef } from "../domain/actors";
import type { ProjectTransformedFromV1Event } from "../rcore/events";
import type { BaselineBuildEstimate, ProjectEconomics } from "../domain/economics";
import { OUTER_UM, CLEAR_UM, ZONE_UM, PROFILE_ID, CLEAR_FT2 } from "../domain/geometry";
import { BASELINE_ROWS, BASELINE_TOTAL_USD, tagUsd } from "../domain/economics";
import { readV1Program } from "../adapters/legacy-v1";
import { hashV2 } from "../serialization/hash-v2";

export interface TransformResult {
  project: ArchitectProjectV2;
  event: ProjectTransformedFromV1Event;
}

const ROW_INDEX: Record<string, number> = { C: 0, B: 1, A: 2 }; // seed y-order: C at 0, B at 1·OUTER, A at 2·OUTER
const COL_INDEX: Record<string, number> = { "1": 0, "2": 1, "3": 2 };

function baselineEconomics(): ProjectEconomics {
  const sections = BASELINE_ROWS.map((r) => ({ id: r.id, name: r.name, usd: tagUsd("baseline", r.usd), evidence: "ASSUMED" as const }));
  const baseline: BaselineBuildEstimate = {
    kind: "BaselineBuildEstimate",
    sections,
    total_usd: tagUsd("baseline", BASELINE_TOTAL_USD),
    total_evidence: "DERIVED",
    per_net_ft2_usd: Math.round(BASELINE_TOTAL_USD / CLEAR_FT2),
    per_net_ft2_evidence: "DERIVED",
  };
  return {
    baseline,
    labor: { kind: "ProjectLaborCost", labor_usd: null, evidence: "NOT_CALCULATED" },
    recognition: { kind: "GlobalRecognition", u_earned: null, evidence: "NOT_CALCULATED" },
    settlement: { kind: "LocalSettlement", jurisdiction_id: "", native_currency: "USD", settlement_native: null, evidence: "NOT_CALCULATED" },
  };
}

export function transformV1toV2(_v1Ignored: unknown, profileId: string, actor: ActorRef, now: string): TransformResult {
  if (profileId !== PROFILE_ID) throw new Error(`architect-future: unknown transformation profile "${profileId}" (expected ${PROFILE_ID})`);
  const v1 = readV1Program();

  const spaces: SpaceEntityV2[] = v1.bays.map((b) => {
    const col = COL_INDEX[b.bay_code[1]];
    const row = ROW_INDEX[b.bay_code[0]];
    return {
      entity_id: "space-" + b.bay_code.toLowerCase(),
      entity_type: "SPACE",
      bay_code: b.bay_code,
      outer_x_um: col * OUTER_UM,
      outer_y_um: row * OUTER_UM,
      z_um: 0,
      outer_width_um: OUTER_UM,
      outer_depth_um: OUTER_UM,
      clear_width_um: CLEAR_UM,
      clear_depth_um: CLEAR_UM,
      wall_zone_thickness_um: ZONE_UM,
      function: b.function as SpaceFunction,
      wet_class: b.wet_class as WetClass,
    };
  });

  const site: SiteDefinition = { site_id: "site-reference", label: "Reference site" };

  const project: ArchitectProjectV2 = {
    schema_version: 2,
    project_id: "architect-future-reference-3x3",
    revision_id: "r1",
    intent: { project_type: "CUSTOM_RESIDENCE", needs: [], accessibility_needs: [], priorities: [], construction_preference: "UNDECIDED" },
    site,
    spaces,
    wall_assemblies: [],
    openings: [],
    assets: [],
    construction: { method: "UNDECIDED" },
    economics: baselineEconomics(),
    references: [],
    design_targets: [],
    qualifications: [],
    assumptions: [
      { assumption_id: "storey-height", text: "Storey clear height 10 ft (ASSUMED).", evidence: "ASSUMED" },
      { assumption_id: "baseline", text: "Illustrative baseline build estimate; the ten rows are ASSUMED.", evidence: "ASSUMED" },
    ],
    authority: { plan: "DRAFT", by: actor, at: now },
    provenance: {
      transformed_from_v1: { source_project_hash: v1.source_project_hash, transformation_profile_id: profileId, at: now },
      created_by: actor,
      created_at: now,
    },
  };

  const target_project_hash = hashV2(project);
  const event: ProjectTransformedFromV1Event = {
    event_id: "evt-transform-r1",
    sequence: 1,
    event_type: "PROJECT_TRANSFORMED_FROM_V1",
    actor,
    occurred_at: now,
    parent_hash: v1.source_project_hash,
    payload: {
      source_project_hash: v1.source_project_hash,
      target_project_hash,
      transformation_profile_id: profileId,
      assumptions: project.assumptions.map((a) => a.text),
    },
  };

  return { project, event };
}
