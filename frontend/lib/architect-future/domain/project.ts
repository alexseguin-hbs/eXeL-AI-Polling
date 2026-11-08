// ARCHITECT-2525 / FUTURE · domain/project — the one canonical project root (plan §9). All views derive from this.

import type { HumanIntent } from "./intent";
import type { SpaceEntityV2 } from "./geometry";
import type { WallAssembly } from "./walls";
import type { OpeningDefinition } from "./openings";
import type { PlacedAsset } from "./assets";
import type { ConstructionScenario } from "./construction";
import type { ProjectEconomics } from "./economics";
import type { ReferenceClaim, DesignTarget, ProjectQualification } from "./ratings";
import type { ActorRef } from "./actors";
import type { EvidenceState } from "./evidence";

export const PLAN_AUTHORITY = ["DRAFT", "SUBMITTED", "REVIEWED", "APPROVED", "BUILD_READY"] as const;
export type PlanAuthority = (typeof PLAN_AUTHORITY)[number];

/** Submit ≠ Review ≠ Approve ≠ build-ready (plan §13, FCRS-33). Approve/build-ready require an authenticated human. */
export interface AuthorityState {
  plan: PlanAuthority;
  /** who last advanced authority; APPROVED requires an AuthenticatedHumanActor (enforced in the authority machine). */
  by: ActorRef | null;
  at: string | null;
}

export interface AssumptionRecord {
  assumption_id: string;
  text: string;
  evidence: EvidenceState;
}

export interface SiteDefinition {
  site_id: string;
  label: string;
}

export interface ProjectProvenance {
  /** set when the project was created by transforming the immutable V1 seed (plan §11). */
  transformed_from_v1?: {
    source_project_hash: string;
    transformation_profile_id: string;
    at: string;
  };
  created_by: ActorRef;
  created_at: string;
}

export interface ArchitectProjectV2 {
  schema_version: 2;
  project_id: string;
  revision_id: string;
  intent: HumanIntent;
  site: SiteDefinition | null;
  spaces: SpaceEntityV2[];
  wall_assemblies: WallAssembly[];
  openings: OpeningDefinition[];
  assets: PlacedAsset[];
  construction: ConstructionScenario;
  economics: ProjectEconomics;
  references: ReferenceClaim[];
  design_targets: DesignTarget[];
  qualifications: ProjectQualification[];
  assumptions: AssumptionRecord[];
  authority: AuthorityState;
  provenance: ProjectProvenance;
}
