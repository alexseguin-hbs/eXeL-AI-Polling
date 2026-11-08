import { hashCanonical } from "./hash";

/** Integer micrometres. 1 ft = 304,800 µm. */
export const UM_PER_FT = 304_800;
export const CLEAR_UM = 3_048_000;
export const ZONE_UM = 304_800;
export const OUTER_UM = CLEAR_UM + 2 * ZONE_UM;
export const PROFILE_ID = "REFERENCE_3X3_12_10_1" as const;
export const STORE_KEY = "architect-future-v2";

export const BANNED_IMPORTS = [
  "frontend/lib/architect-house-truth.ts",
  "frontend/lib/architect-sim-options.ts",
  "frontend/lib/architect-estimate.ts",
  "frontend/lib/architect-wall-system.ts",
  "frontend/components/architect-2525/house-spec.tsx",
  "frontend/components/architect-2525/command-ux1.tsx",
  "frontend/components/security-2525/mission-planning.tsx",
] as const;

const PROGRAM = [
  { bay: "C1", name: "Office", fn: "OFFICE", wet: "DRY", col: 0, row: 0 },
  { bay: "C2", name: "Utility", fn: "UTILITY", wet: "WET", col: 1, row: 0 },
  { bay: "C3", name: "Entry", fn: "ENTRY", wet: "DRY", col: 2, row: 0 },
  { bay: "B1", name: "Living", fn: "LIVING", wet: "DRY", col: 0, row: 1 },
  { bay: "B2", name: "Kitchen", fn: "KITCHEN", wet: "WET", col: 1, row: 1 },
  { bay: "B3", name: "Dining", fn: "DINING", wet: "DRY", col: 2, row: 1 },
  { bay: "A1", name: "Bedroom", fn: "BEDROOM", wet: "DRY", col: 0, row: 2 },
  { bay: "A2", name: "Bath", fn: "BATH", wet: "WET", col: 1, row: 2 },
  { bay: "A3", name: "Closet", fn: "CLOSET", wet: "DRY", col: 2, row: 2 },
] as const;

export const BASELINE_SECTIONS = [
  { id: "site", name: "Site Work", usd: 23_000 },
  { id: "found", name: "Foundation", usd: 33_000 },
  { id: "frame", name: "Wall System", usd: 48_000 },
  { id: "roof", name: "Roof", usd: 17_000 },
  { id: "plumb", name: "Plumbing", usd: 21_000 },
  { id: "elec", name: "Electrical", usd: 18_000 },
  { id: "hvac", name: "HVAC", usd: 16_000 },
  { id: "drywall", name: "Drywall", usd: 14_000 },
  { id: "finish", name: "Interior Finish", usd: 40_000 },
  { id: "land", name: "Landscaping", usd: 10_000 },
] as const;

export const VISION_GROUPS = [
  "Site", "Foundation", "Structure", "Envelope", "Openings", "Systems", "Fixtures", "Furniture", "Exterior",
] as const;

export const SOFA = { asset_id: "sofa", name: "Sofa", group: "Furniture" as const };

export type Wet = "WET" | "DRY";
export type Method = "UNDECIDED" | "FRAME" | "PRINT";
export type Evidence =
  | "USER_STATED" | "ASSUMED" | "REFERENCE" | "DERIVED" | "QUOTED" | "QUALIFIED" | "NOT_CALCULATED" | "UNVERIFIED";
export type PlanAuthority = "DRAFT" | "SUBMITTED" | "APPROVED";
export type Actor =
  | { kind: "UNAUTHENTICATED_HUMAN"; id: "unauthenticated-human" }
  | { kind: "AUTHENTICATED_HUMAN"; id: string }
  | { kind: "SYSTEM"; id: "system" };

export const DRAFT_ACTOR: Actor = { kind: "UNAUTHENTICATED_HUMAN", id: "unauthenticated-human" };

export interface HumanIntent {
  project_type: "CUSTOM_RESIDENCE";
  occupants: number;
  needs: string[];
  accessibility_needs: string[];
  priorities: string[];
  construction_preference: Method;
  budget_intent: { amount_usd: number; authority: "USER_STATED" } | null;
}

export interface SpaceEntityV2 {
  entity_id: string;
  entity_type: "SPACE";
  bay_code: string;
  name: string;
  fn: string;
  wet: Wet;
  outer_x_um: number;
  outer_y_um: number;
  z_um: number;
  outer_width_um: number;
  outer_depth_um: number;
  clear_x_um: number;
  clear_y_um: number;
  clear_width_um: number;
  clear_depth_um: number;
  wall_zone_thickness_um: number;
}

export interface WallAssembly {
  wall_id: string;
  space_id: string;
  side: "NORTH" | "EAST" | "SOUTH" | "WEST";
  method: Method;
  actual_assembly_thickness_um: null;
  evidence_state: "ASSUMED";
}

export interface PlacedAsset {
  instance_id: string;
  asset_id: string;
  name: string;
  space_id: string;
  x_um: number;
  y_um: number;
  rotation_deg: number;
  authority: "ASSUMED";
}

export interface BaselineSection { id: string; name: string; usd: number; evidence: "ASSUMED" }
export interface BaselineBuildEstimate {
  kind: "BaselineBuildEstimate";
  sections: BaselineSection[];
  total_usd: number;
  total_evidence: "DERIVED";
  per_net_ft2: number;
  per_net_evidence: "DERIVED";
}
export interface ProjectLaborCost { kind: "ProjectLaborCost"; labor_usd: null; evidence: "NOT_CALCULATED" }
export interface GlobalRecognition { kind: "GlobalRecognition"; u_earned: null; evidence: "NOT_CALCULATED" }
export interface LocalSettlement {
  kind: "LocalSettlement";
  jurisdiction_id: string;
  amount_native: null;
  evidence: "NOT_CALCULATED";
}
export interface ReferenceClaim {
  kind: "ReferenceClaim";
  claim_id: string;
  text: string;
  evidence: "UNVERIFIED";
}
export interface DesignTarget {
  kind: "DesignTarget";
  target_id: string;
  claim_id: string;
  set_by: Actor;
}
export interface ProjectQualification {
  kind: "ProjectQualification";
  qualification_id: string;
  set_by: { kind: "AUTHENTICATED_HUMAN"; id: string };
  evidence_note: string;
}

export interface FutureEvent {
  event_type: string;
  payload: Record<string, string | number | boolean | null>;
}

export interface FutureProject {
  schema_version: 2;
  project_id: "future-reference-3x3";
  intent: HumanIntent | null;
  spaces: SpaceEntityV2[];
  wall_assemblies: WallAssembly[];
  openings: [];
  assets: PlacedAsset[];
  construction: { method: Method };
  economics: {
    baseline: BaselineBuildEstimate;
    labor: ProjectLaborCost;
    recognition: GlobalRecognition;
    settlement: LocalSettlement;
  };
  references: ReferenceClaim[];
  design_targets: DesignTarget[];
  qualifications: ProjectQualification[];
  assumptions: { id: string; text: string; evidence: "ASSUMED" }[];
  authority: { plan: PlanAuthority };
  provenance: { profile: typeof PROFILE_ID | null; actor: Actor | null };
  events: FutureEvent[];
}

export interface ArmState { armed: string | null }

export function ft(um: number): number {
  return um / UM_PER_FT;
}

export function geometryOk(space: SpaceEntityV2): boolean {
  return space.outer_width_um === space.clear_width_um + 2 * space.wall_zone_thickness_um
    && space.outer_depth_um === space.clear_depth_um + 2 * space.wall_zone_thickness_um
    && space.clear_x_um === space.outer_x_um + space.wall_zone_thickness_um
    && space.clear_y_um === space.outer_y_um + space.wall_zone_thickness_um
    && space.clear_width_um === CLEAR_UM
    && space.wall_zone_thickness_um === ZONE_UM
    && space.outer_width_um === OUTER_UM;
}

export function shellFt(): number {
  return 3 * ft(OUTER_UM);
}

export function grossFt2(): number {
  return shellFt() * shellFt();
}

export function clearProgramFt2(): number {
  return PROGRAM.length * ft(CLEAR_UM) * ft(CLEAR_UM);
}

function baseline(): BaselineBuildEstimate {
  const sections = BASELINE_SECTIONS.map((s) => ({ ...s, evidence: "ASSUMED" as const }));
  const total_usd = sections.reduce((sum, s) => sum + s.usd, 0);
  return {
    kind: "BaselineBuildEstimate",
    sections,
    total_usd,
    total_evidence: "DERIVED",
    per_net_ft2: Math.round(total_usd / clearProgramFt2()),
    per_net_evidence: "DERIVED",
  };
}

export function emptyProject(): FutureProject {
  return {
    schema_version: 2,
    project_id: "future-reference-3x3",
    intent: null,
    spaces: [],
    wall_assemblies: [],
    openings: [],
    assets: [],
    construction: { method: "UNDECIDED" },
    economics: {
      baseline: baseline(),
      labor: { kind: "ProjectLaborCost", labor_usd: null, evidence: "NOT_CALCULATED" },
      recognition: { kind: "GlobalRecognition", u_earned: null, evidence: "NOT_CALCULATED" },
      settlement: { kind: "LocalSettlement", jurisdiction_id: "US-TX", amount_native: null, evidence: "NOT_CALCULATED" },
    },
    references: [],
    design_targets: [],
    qualifications: [],
    assumptions: [
      { id: "zone", text: "1 ft is a reserved wall/service zone, not a measured wall thickness.", evidence: "ASSUMED" },
      { id: "baseline", text: "The ten sections are illustrative baseline inputs, not a quote.", evidence: "ASSUMED" },
    ],
    authority: { plan: "DRAFT" },
    provenance: { profile: null, actor: null },
    events: [],
  };
}

function spaceFrom(row: (typeof PROGRAM)[number]): SpaceEntityV2 {
  const outer_x_um = row.col * OUTER_UM;
  const outer_y_um = row.row * OUTER_UM;
  return {
    entity_id: `space-${row.bay}`,
    entity_type: "SPACE",
    bay_code: row.bay,
    name: row.name,
    fn: row.fn,
    wet: row.wet,
    outer_x_um,
    outer_y_um,
    z_um: 0,
    outer_width_um: OUTER_UM,
    outer_depth_um: OUTER_UM,
    clear_x_um: outer_x_um + ZONE_UM,
    clear_y_um: outer_y_um + ZONE_UM,
    clear_width_um: CLEAR_UM,
    clear_depth_um: CLEAR_UM,
    wall_zone_thickness_um: ZONE_UM,
  };
}

function wallsFor(space: SpaceEntityV2, method: Method): WallAssembly[] {
  return (["NORTH", "EAST", "SOUTH", "WEST"] as const).map((side) => ({
    wall_id: `${space.entity_id}-${side}`,
    space_id: space.entity_id,
    side,
    method,
    actual_assembly_thickness_um: null,
    evidence_state: "ASSUMED" as const,
  }));
}

export function identityBody(project: FutureProject) {
  return {
    schema_version: project.schema_version,
    project_id: project.project_id,
    intent: project.intent,
    spaces: project.spaces,
    wall_assemblies: project.wall_assemblies,
    openings: project.openings,
    assets: project.assets,
    construction: project.construction,
    economics: project.economics,
    references: project.references,
    design_targets: project.design_targets,
    qualifications: project.qualifications,
    assumptions: project.assumptions,
    authority: project.authority,
    provenance: project.provenance,
  };
}

export function projectHash(project: FutureProject): string {
  return hashCanonical(identityBody(project));
}

function intentFrom(payload: FutureEvent["payload"]): HumanIntent {
  const budget = payload.budget;
  return {
    project_type: "CUSTOM_RESIDENCE",
    occupants: payload.occupants as number,
    needs: String(payload.needs ?? "").split("|").filter(Boolean),
    accessibility_needs: String(payload.accessibility ?? "").split("|").filter(Boolean),
    priorities: String(payload.priorities ?? "").split("|").filter(Boolean),
    construction_preference: payload.method as Method,
    budget_intent: typeof budget === "number" && budget >= 0 ? { amount_usd: budget, authority: "USER_STATED" } : null,
  };
}

function apply(project: FutureProject, event: FutureEvent): FutureProject {
  const next: FutureProject = { ...project, events: [...project.events, event] };
  switch (event.event_type) {
    case "INTENT_CHANGED": {
      const intent = intentFrom(event.payload);
      return { ...next, intent, construction: { method: intent.construction_preference } };
    }
    case "PROJECT_TRANSFORMED_FROM_V1": {
      if (!next.intent) return next;
      const method = next.construction.method;
      const spaces = PROGRAM.map(spaceFrom);
      return {
        ...next,
        spaces,
        wall_assemblies: spaces.flatMap((space) => wallsFor(space, method)),
        provenance: { profile: PROFILE_ID, actor: DRAFT_ACTOR },
      };
    }
    case "ASSET_PLACED": {
      const space = next.spaces.find((item) => item.entity_id === event.payload.space_id);
      if (!space) return next;
      const instance_id = String(event.payload.instance_id);
      const asset: PlacedAsset = {
        instance_id,
        asset_id: SOFA.asset_id,
        name: SOFA.name,
        space_id: space.entity_id,
        x_um: space.clear_x_um + Math.floor(space.clear_width_um / 2),
        y_um: space.clear_y_um + Math.floor(space.clear_depth_um / 2),
        rotation_deg: 0,
        authority: "ASSUMED",
      };
      return { ...next, assets: [...next.assets, asset] };
    }
    case "ASSET_ROTATED": {
      const instance_id = String(event.payload.instance_id);
      return {
        ...next,
        assets: next.assets.map((asset) =>
          asset.instance_id === instance_id ? { ...asset, rotation_deg: (asset.rotation_deg + 90) % 360 } : asset,
        ),
      };
    }
    case "CONSTRUCTION_METHOD_CHANGED": {
      const method = event.payload.method as Method;
      return {
        ...next,
        construction: { method },
        wall_assemblies: next.wall_assemblies.map((wall) => ({ ...wall, method })),
      };
    }
    case "JURISDICTION_CHANGED": {
      return {
        ...next,
        economics: {
          ...next.economics,
          settlement: { ...next.economics.settlement, jurisdiction_id: String(event.payload.jurisdiction_id) },
        },
      };
    }
    case "PLAN_SUBMITTED":
      return { ...next, authority: { plan: "SUBMITTED" } };
    case "PLAN_APPROVED":
      return { ...next, authority: { plan: "APPROVED" } };
    default:
      return next;
  }
}

export function replay(events: FutureEvent[]): FutureProject {
  return events.reduce(apply, emptyProject());
}

export function setIntent(project: FutureProject, intent: HumanIntent): FutureProject {
  return apply(project, {
    event_type: "INTENT_CHANGED",
    payload: {
      occupants: intent.occupants,
      needs: intent.needs.join("|"),
      accessibility: intent.accessibility_needs.join("|"),
      priorities: intent.priorities.join("|"),
      method: intent.construction_preference,
      budget: intent.budget_intent?.amount_usd ?? -1,
    },
  });
}

/** Transfers bay, name, function, and wet/dry. Regenerates geometry. Does not copy a 10 ft coordinate. */
export function transformReference(project: FutureProject, actor: Actor = DRAFT_ACTOR): FutureProject {
  if (!project.intent || project.spaces.length > 0) return project;
  return apply(project, { event_type: "PROJECT_TRANSFORMED_FROM_V1", payload: { profile: PROFILE_ID, actor: actor.id } });
}

export function arm(state: ArmState, assetId: string): ArmState {
  return { armed: assetId };
}

export function disarm(): ArmState {
  return { armed: null };
}

export function place(project: FutureProject, state: ArmState, spaceId: string): { project: FutureProject; arm: ArmState } {
  if (!state.armed || state.armed !== SOFA.asset_id) return { project, arm: state };
  const space = project.spaces.find((item) => item.entity_id === spaceId);
  if (!space) return { project, arm: state };
  const instance_id = `sofa-${project.assets.length + 1}`;
  return {
    arm: disarm(),
    project: apply(project, { event_type: "ASSET_PLACED", payload: { instance_id, space_id: space.entity_id } }),
  };
}

export function rotate(project: FutureProject, instanceId: string): FutureProject {
  if (!project.assets.some((asset) => asset.instance_id === instanceId)) return project;
  return apply(project, { event_type: "ASSET_ROTATED", payload: { instance_id: instanceId } });
}

export function setMethod(project: FutureProject, method: Method): FutureProject {
  if (project.construction.method === method) return project;
  return apply(project, { event_type: "CONSTRUCTION_METHOD_CHANGED", payload: { method } });
}

export function setJurisdiction(project: FutureProject, jurisdiction_id: string): FutureProject {
  if (project.economics.settlement.jurisdiction_id === jurisdiction_id) return project;
  return apply(project, { event_type: "JURISDICTION_CHANGED", payload: { jurisdiction_id } });
}

export function submit(project: FutureProject): FutureProject {
  if (project.authority.plan !== "DRAFT") return project;
  return apply(project, { event_type: "PLAN_SUBMITTED", payload: { plan: "SUBMITTED" } });
}

/** Approval is refused unless the actor is an authenticated human. State does not change on refusal. */
export function approve(project: FutureProject, actor: Actor): { project: FutureProject; accepted: boolean } {
  if (project.authority.plan !== "SUBMITTED" || actor.kind !== "AUTHENTICATED_HUMAN") {
    return { project, accepted: false };
  }
  return { accepted: true, project: apply(project, { event_type: "PLAN_APPROVED", payload: { actor: actor.id } }) };
}

export function addUnverifiedReference(project: FutureProject, text: string): FutureProject {
  const claim: ReferenceClaim = { kind: "ReferenceClaim", claim_id: `ref-${project.references.length + 1}`, text, evidence: "UNVERIFIED" };
  return { ...project, references: [...project.references, claim] };
}

export function setDesignTarget(project: FutureProject, claim_id: string, actor: Actor = DRAFT_ACTOR): FutureProject {
  const claim = project.references.find((item) => item.claim_id === claim_id);
  if (!claim || claim.evidence === "UNVERIFIED") return project;
  const target: DesignTarget = { kind: "DesignTarget", target_id: `target-${project.design_targets.length + 1}`, claim_id, set_by: actor };
  return { ...project, design_targets: [...project.design_targets, target] };
}

/** Qualification without an authenticated human is refused. A reference is never rewritten into one. */
export function qualify(project: FutureProject, actor: Actor): { project: FutureProject; accepted: boolean } {
  if (actor.kind !== "AUTHENTICATED_HUMAN") return { project, accepted: false };
  return { project, accepted: false };
}

export interface TakeoffLine { item: string; method: Method; evidence: Evidence; note: string }

export function takeoff(project: FutureProject): TakeoffLine[] {
  if (project.construction.method === "UNDECIDED" || project.spaces.length === 0) return [];
  if (project.construction.method === "PRINT") {
    return [{
      item: "Printed wall",
      method: "PRINT",
      evidence: "ASSUMED",
      note: "Current method is print. Stud framing is not the current take-off.",
    }];
  }
  return [
    { item: "Studs", method: "FRAME", evidence: "ASSUMED", note: "Frame method only. Not a measured count." },
    { item: "Plates", method: "FRAME", evidence: "ASSUMED", note: "Frame method only." },
  ];
}

export function mepRollup(project: FutureProject): { usd: number; label: "DISPLAY ROLLUP" } {
  const ids = new Set(["plumb", "elec", "hvac"]);
  const usd = project.economics.baseline.sections.filter((s) => ids.has(s.id)).reduce((sum, s) => sum + s.usd, 0);
  return { usd, label: "DISPLAY ROLLUP" };
}

export function sameIdentity(a: FutureProject, b: FutureProject): boolean {
  return projectHash(a) === projectHash(b);
}

export interface HealthFinding { id: string; ok: boolean; text: string }

export function health(project: FutureProject): HealthFinding[] {
  const geometry = project.spaces.every(geometryOk);
  const total = project.economics.baseline.sections.reduce((sum, s) => sum + s.usd, 0);
  const print = project.construction.method === "PRINT";
  const studs = takeoff(project).some((line) => /stud/i.test(line.item));
  return [
    { id: "geometry", ok: project.spaces.length === 0 || geometry, text: "Outer equals clear plus two reserved zones." },
    { id: "baseline", ok: total === project.economics.baseline.total_usd && total === 240_000, text: "Ten sections derive 240,000." },
    { id: "method", ok: !(print && studs), text: "Print take-off does not list studs." },
    { id: "qualify", ok: project.qualifications.every((q) => q.set_by.kind === "AUTHENTICATED_HUMAN"), text: "Qualifications require an authenticated human." },
  ];
}

export function parseStored(raw: string | null): FutureProject | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as FutureProject;
    if (value?.schema_version !== 2 || value.project_id !== "future-reference-3x3") return null;
    return value;
  } catch {
    return null;
  }
}
