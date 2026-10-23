// SPECS / ARCHITECT-2525 §01, §08, §XII, §XVII, Part 3 — the canonical domain contract. Committed
// BEFORE any Runtime behaviour changes (§01 / §XXVI pre-flight). Each enum is a runtime const array
// (so the .mjs gates can read the real members) paired with its stripped type. No canonical field is
// named with a 웃/◬/♡ symbol, a bare `mot`, `rate`, `time_capital`, `yaw`, `svg`, `mesh`, or `wall`
// (§3.4 / §XI / §22): a symbol is never a field name; authorship is `master_of_thought`; the reserved
// Financial reference is source-qualified (`financial2525_mot`, unused this cycle).
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-schema.test.mjs

/** SPECS §VIII(5) — a 128-bit-class opaque identity token (UUIDv7 now; future IFC GlobalId is NOT a UUID). */
export type EntityId = string;
/** A revision id: "R0", "R1", … (§23 live ids start R0; test harnesses may use synthetic R31/R32/R33). */
export type RevisionId = string;

// ── §08 / §XII — AUTHORITY and VALIDITY are ORTHOGONAL ──────────────────────────────────────────────
/**
 * SPECS / ARCHITECT-2525 §08 — the nine authority states. STALE is NOT one of them (it is a validity).
 * The four not yet exercised by any V1 path are ANTICIPATORY (documented, never emitted this cycle).
 */
export const AUTHORITY_STATES = [
  "ILLUSTRATIVE", // anticipatory — explicit illustrative/placeholder data
  "OBSERVED",     // anticipatory — measured from the real world
  "IMPORTED",     // anticipatory — brought in from another file/format (IMPORTED on V1 load)
  "ASSUMED",      // the seed program, storey height, budget target (template:TINY_HOME)
  "CALCULATED",   // derived by a deterministic calculation
  "SIMULATED",    // produced by a simulation (≠ STALE; §08)
  "AI_PROPOSED",  // an AI proposal, not yet accepted by a human
  "HI_APPROVED",  // a human approved it (plan approval; not emitted by a V1 edit ACCEPT — §04)
  "QUALIFIED",    // anticipatory — SSSES-qualified for readiness
] as const;
export type AuthorityState = (typeof AUTHORITY_STATES)[number];

/** SPECS §XXVI/§08 — the authority states no V1 code path emits this cycle (documented, not faked). */
export const ANTICIPATORY_AUTHORITY_STATES = ["ILLUSTRATIVE", "OBSERVED", "IMPORTED", "QUALIFIED"] as const;

/** SPECS / ARCHITECT-2525 §08 — validity is orthogonal to authority; STALE and SUPERSEDED are here, not above. */
export const EVIDENCE_VALIDITIES = ["CURRENT", "STALE", "SUPERSEDED"] as const;
export type EvidenceValidity = (typeof EVIDENCE_VALIDITIES)[number];

/** SPECS / ARCHITECT-2525 §08 — Authority and validity are orthogonal; neither collapses into the other. */
export interface EvidenceState {
  authority_state: AuthorityState;
  validity: EvidenceValidity;
  source_revision_id: RevisionId;
  invalidated_by_revision_id: RevisionId | null;
  invalidated_reason: string | null;
}

// ── §X — PORTFOLIO STAGE (separate from the estimate GATE firewall) ─────────────────────────────────
/** SPECS / ARCHITECT-2525 §X — the seven portfolio stages, rendered as the WORD, never a bare G#. */
export const PORTFOLIO_STAGES = [
  "G1_CONCEPT", "G2_PLAN", "G3_DEVELOP", "G4_QUALIFY", "G5_BUILD", "G6_MAXIMIZE", "G7_RETIRE",
] as const;
export type PortfolioStage = (typeof PORTFOLIO_STAGES)[number];

/** SPECS / ARCHITECT-2525 §04/§XIII — the seed is REVIEWABLE; HI_APPROVED is a separate future act. */
export const PLAN_STATES = ["REVIEWABLE", "HI_APPROVED"] as const;
export type PlanState = (typeof PLAN_STATES)[number];

// ── §02 / §IX — the nine Space functions and wet class ──────────────────────────────────────────────
export const SPACE_FUNCTIONS = [
  "BEDROOM", "BATH", "CLOSET", "LIVING", "KITCHEN", "DINING", "OFFICE", "UTILITY", "ENTRY",
] as const;
export type SpaceFunction = (typeof SPACE_FUNCTIONS)[number];

export const WET_CLASSES = ["WET", "DRY"] as const;
export type WetClass = (typeof WET_CLASSES)[number];

// ── §VIII(2) / §34.02 — the polymorphic entity hierarchy, keyed by entity_type ──────────────────────
export const ENTITY_TYPES = ["PROJECT", "SITE", "BUILDING", "STOREY", "SPACE"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** Common to every canonical entity; identity survives rename/move/resize/revision/export (§VIII(5)). */
export interface EntityBase {
  entity_id: EntityId;
  entity_type: EntityType;
  parent_id: EntityId | null;
  revision_id: RevisionId;
  evidence: EvidenceState;
}

export interface ProjectEntity extends EntityBase {
  entity_type: "PROJECT";
  parent_id: null;
  name: string;
}
export interface SiteEntity extends EntityBase {
  entity_type: "SITE";
  name: string;
}
export interface BuildingEntity extends EntityBase {
  entity_type: "BUILDING";
  name: string;
}
export interface StoreyEntity extends EntityBase {
  entity_type: "STOREY";
  name: string;
  /** Storey height in µm — ASSUMED 3,048,000 (§16 promotion: human/professional confirmation). */
  height_um: number;
}

/**
 * SPECS / ARCHITECT-2525 §A4 / §IX — a rectangular Space. Integer-µm geometry on the right-handed datum
 * (+X East, +Y North, +Z Up); no `yaw`, and no row/col as canonical geometry (row/col may live only in
 * seed/template metadata). `bay_code` (A1…C3) is the human handle; `legacy_slug` is an optional bridge.
 */
export interface SpaceEntity extends EntityBase {
  entity_type: "SPACE";
  bay_code: string;
  legacy_slug?: string;
  shape: { kind: "RECT" };
  x_um: number;
  y_um: number;
  z_um: number;
  width_um: number;
  depth_um: number;
  function: SpaceFunction;
  wet_class: WetClass;
}

export type CanonicalEntity =
  | ProjectEntity | SiteEntity | BuildingEntity | StoreyEntity | SpaceEntity;

// ── The canonical project container ─────────────────────────────────────────────────────────────────
/**
 * SPECS / ARCHITECT-2525 §VIII / §03 / §3.3 — the canonical project. The datum is a permanent project
 * origin established at R0 at the SW corner of C1; it never recenters (§05). The entities array is the
 * polymorphic Project→Site→Building→Storey→Space×9 hierarchy. Financial references are reserved-nullable
 * (§3.3; never a copied Financial-2525 calculation). created_at/updated_at/package_hash are volatile and
 * are EXCLUDED from project_hash by the serializer (§09/§24).
 */
export interface ArchitectProject {
  schema_version: number;
  project_id: EntityId;
  portfolio_stage: PortfolioStage;
  plan_state: PlanState;
  datum: [number, number, number];
  current_revision_id: RevisionId;
  entities: CanonicalEntity[];
  /** §3.3 — reserved identity/provenance reference into Financial-2525; null and unused this cycle. */
  financial_record_id: string | null;
  financial_record_hash: string | null;
  // volatile / provenance (serializer-excluded):
  created_at?: string;
  updated_at?: string;
  package_hash?: string;
}

// ── §XVII — R-CORE event group + §3.2 dual time ─────────────────────────────────────────────────────
export const EVENT_TYPES = [
  "SEED_R0", "EDGE_RESIZE", "FUNCTION_CHANGE", "WET_CHANGE", "PLAN_APPROVED",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const ACTOR_ROLES = ["HI", "AI", "SYSTEM", "TEMPLATE"] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

/** One field-level change inside an event group (§XVII changes[]). */
export interface EntityChange {
  entity_id: EntityId;
  entity_type: EntityType;
  field: string;
  before: unknown;
  after: unknown;
}

/**
 * SPECS / ARCHITECT-2525 §XVII / §3.2 — a committed R-CORE event group. GENESIS = the R0 project_hash.
 * Carries BOTH a 웃 human-context local_date (contextual) and a ◬ absolute timestamp_ms (UTC); both are
 * provenance and are EXCLUDED from project_hash and from event_hash (§3.2/§24). event_hash/prev_hash are
 * sha256Hex of the canonical serialization — never a timestamp-folding, charCodeAt/UTF-16 hash (Thoth).
 */
export interface RCoreEventGroup {
  event_id: string;
  revision_id: RevisionId;
  parent_revision_id: RevisionId;
  event_type: EventType;
  actor_id: string;
  actor_role: ActorRole;
  /** optional authorship; never a generic `mot` (§3.4). */
  master_of_thought?: string;
  /** reserved Financial-2525 measure; source-qualified, unused this cycle (§3.4). */
  financial2525_mot?: null;
  /** ◬ absolute UTC instant — provenance, hash-excluded (§3.2). */
  timestamp_ms: number;
  /** 웃 human-context local date — contextual, hash-excluded (§3.2). */
  local_date: string;
  reason: string;
  changes: EntityChange[];
  invalidated_entities: EntityId[];
  invalidated_metrics: string[];
  invalidated_evidence: string[];
  invalidated_exports: string[];
  event_hash: string;
  prev_hash: string;
}

/** SPECS / ARCHITECT-2525 §XVII — snapshot taken at R0, every 10 revisions, every HI gate transition. */
export interface RCoreSnapshot {
  revision_id: RevisionId;
  project_hash: string;
  project: ArchitectProject;
}

// ── §XVIII / §XIX — SPIRAL + R-CORE SYNC states (populated in Block B) ───────────────────────────────
export const SPIRAL_STATES = ["NOT_RUN", "PASS", "HOLD", "FAIL"] as const;
export type SpiralState = (typeof SPIRAL_STATES)[number];

export const SYNC_STATES = ["SYNCED", "PENDING", "DIVERGED", "OFFLINE"] as const;
export type SyncState = (typeof SYNC_STATES)[number];

// ── §06 / §XIV / §XVI — the ephemeral AI preview (hash-excluded; never canonical) ───────────────────
export const AI_PREVIEW_STATUSES = ["PROPOSED", "HELD", "CLEARED"] as const;
export type AiPreviewStatus = (typeof AI_PREVIEW_STATUSES)[number];

/** SPECS §06 — the AI proposed-impact preview. HOLD keeps it; REJECT clears it; both write nothing. */
export interface AiPreviewState {
  status: AiPreviewStatus;
  proposed_change: unknown | null;
}

// ── §01 — export + package manifests (minimal pre-flight contracts; filled in Block C) ──────────────
/** SPECS §XXV — a declared projection target; nothing is generated this cycle (§XXIV hard stops). */
export interface ExportManifest {
  schema_version: number;
  projections: string[];
}

/** SPECS §12 / §XXI — the deterministic .arch2525 V2 content manifest; package_hash excludes archive accidents. */
export interface CanonicalPackageManifest {
  schema_version: number;
  min_reader_version: number;
  entries: { normalized_path: string; content_hash: string }[];
}
