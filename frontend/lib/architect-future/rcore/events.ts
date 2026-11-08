// ARCHITECT-2525 / FUTURE · rcore/events — the Future event vocabulary (plan §12, FCRS-09).
// Rich enough to represent the real product (canonical asset placement, openings, construction, ratings, authority).
// NOT the legacy 5-event union. Every canonical change is one of these; not every UI interaction is an event.

import type { ActorRef } from "../domain/actors";

export const EVENT_TYPES = [
  "PROJECT_CREATED",
  "PROJECT_TRANSFORMED_FROM_V1",
  "INTENT_CHANGED",
  "SPACE_CHANGED",
  "WALL_ASSEMBLY_CHANGED",
  "OPENING_ADDED",
  "OPENING_CHANGED",
  "OPENING_REMOVED",
  "ASSET_PLACED",
  "ASSET_MOVED",
  "ASSET_ROTATED",
  "ASSET_REMOVED",
  "CONSTRUCTION_METHOD_CHANGED",
  "ASSUMPTION_ADDED",
  "DESIGN_TARGET_CREATED",
  "DESIGN_TARGET_REVISED",
  "SIMULATION_RUN",
  "PLAN_SUBMITTED",
  "PLAN_REVIEWED",
  "PLAN_APPROVED",
  "QUALIFICATION_ATTACHED",
  "REVISION_CREATED",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** The common envelope every event carries (plan §12). Payload shapes are refined per type in Phase 1. */
export interface FutureEvent {
  event_id: string;
  sequence: number;
  event_type: EventType;
  actor: ActorRef;
  occurred_at: string;
  /** hash of the parent project state, chaining the log (set by the R-CORE committer in Phase 1). */
  parent_hash: string;
  payload: Record<string, unknown>;
}

/** The explicit V1→V2 provenance event (plan §11). */
export interface ProjectTransformedFromV1Event extends FutureEvent {
  event_type: "PROJECT_TRANSFORMED_FROM_V1";
  payload: {
    source_project_hash: string;
    target_project_hash: string;
    transformation_profile_id: string;
    assumptions: string[];
  };
}

export function isEventType(x: unknown): x is EventType {
  return typeof x === "string" && (EVENT_TYPES as readonly string[]).includes(x);
}
