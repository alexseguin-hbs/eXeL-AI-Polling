// ARCHITECT-2525 / FUTURE · rcore/replay — reconstruct the canonical project from the event log (plan §12, FCRS-09).
// The log's first event is PROJECT_TRANSFORMED_FROM_V1 (or PROJECT_CREATED); replay re-runs the PURE transform to
// rebuild the base, then applies each later event forward. Every canonical change is an event, so replay(events)
// reproduces the exact canonical state (T-REPLAY). Pure; no donor import beyond the transform.
import type { ArchitectProjectV2 } from "../domain/project";
import type { PlacedAsset } from "../domain/assets";
import type { ConstructionMethod } from "../domain/construction";
import type { ActorRef } from "../domain/actors";
import type { FutureEvent } from "./events";
import { transformV1toV2 } from "../transformation/reference-v1-to-v2";
import { isAuthenticatedHuman } from "../domain/actors";

// Authority is enforced in the REDUCER and on REPLAY (plan §40.7), not only in command helpers: a forged log whose
// PLAN_APPROVED is by an AI/SYSTEM can never reach APPROVED on replay. Submit/review need a person; approve needs an
// authenticated human.
function isHuman(a: ActorRef | null | undefined): boolean {
  return !!a && (a.kind === "AUTHENTICATED_HUMAN" || a.kind === "UNAUTHENTICATED_HUMAN");
}

export function applyEvent(project: ArchitectProjectV2, event: FutureEvent): ArchitectProjectV2 {
  const p = { ...project, revision_id: "r" + event.sequence };
  const pl = event.payload || {};
  switch (event.event_type) {
    case "ASSET_PLACED":
      return { ...p, assets: [...p.assets, pl.asset as PlacedAsset] };
    case "ASSET_MOVED":
      return { ...p, assets: p.assets.map((a) => (a.instance_id === pl.instance_id ? { ...a, position_um: pl.position_um as PlacedAsset["position_um"] } : a)) };
    case "ASSET_ROTATED":
      return { ...p, assets: p.assets.map((a) => (a.instance_id === pl.instance_id ? { ...a, rotation_deg: pl.rotation_deg as number } : a)) };
    case "ASSET_REMOVED":
      return { ...p, assets: p.assets.filter((a) => a.instance_id !== pl.instance_id) };
    case "CONSTRUCTION_METHOD_CHANGED":
      return { ...p, construction: { method: pl.method as ConstructionMethod } };
    case "INTENT_CHANGED":
      return { ...p, intent: pl.intent as ArchitectProjectV2["intent"] };
    case "PLAN_SUBMITTED":
      return isHuman(event.actor) ? { ...p, authority: { plan: "SUBMITTED", by: event.actor, at: event.occurred_at } } : p;
    case "PLAN_REVIEWED":
      return isHuman(event.actor) ? { ...p, authority: { plan: "REVIEWED", by: event.actor, at: event.occurred_at } } : p;
    case "PLAN_APPROVED":
      // only an AUTHENTICATED human can reach APPROVED — an AI/SYSTEM-authored approval is ignored on replay (§13/§40.7)
      return isAuthenticatedHuman(event.actor) ? { ...p, authority: { plan: "APPROVED", by: event.actor, at: event.occurred_at } } : p;
    default:
      return p; // events with no canonical effect yet (Phase 3/4 extend this)
  }
}

export function replay(events: FutureEvent[]): ArchitectProjectV2 {
  if (!events.length) throw new Error("architect-future: cannot replay an empty event log");
  const first = events[0];
  if (first.event_type !== "PROJECT_TRANSFORMED_FROM_V1" && first.event_type !== "PROJECT_CREATED") {
    throw new Error(`architect-future: the first event must create the project (got ${first.event_type})`);
  }
  const profileId = String((first.payload || {}).transformation_profile_id || "REFERENCE_3X3_12_10_1");
  let project = transformV1toV2(null, profileId, first.actor, first.occurred_at).project;
  for (const e of events.slice(1)) project = applyEvent(project, e);
  return project;
}
