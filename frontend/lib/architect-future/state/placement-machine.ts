// ARCHITECT-2525 / FUTURE · state/placement-machine — tap→arm→tap→place→disarm (plan §16, FCRS-12/13).
// Invariant: one arm → at most one placement → disarm. Placement goes through canonical state + an event. STUB (Phase 0).
import type { ArchitectProjectV2 } from "../domain/project";
import type { Vec3Um } from "../domain/assets";
import type { ActorRef } from "../domain/actors";
import { notImplemented } from "../_notimpl";

export interface ArmState {
  armed_asset_id: string | null;
}

export function arm(_state: ArmState, _assetId: string): ArmState {
  return notImplemented("arm", 2);
}
export function disarm(_state: ArmState): ArmState {
  return notImplemented("disarm", 2);
}

export interface PlaceResult {
  project: ArchitectProjectV2;
  arm: ArmState;        // ALWAYS disarmed after a placement (the §16 invariant)
  placed: boolean;
  rejected_reason?: string;
}

/** Place the armed asset at a point in a room; rejects if it would pass through a wall or overlap (Phase 2). */
export function placeArmed(
  _project: ArchitectProjectV2,
  _arm: ArmState,
  _spaceId: string,
  _pointUm: Vec3Um,
  _rotationDeg: number,
  _actor: ActorRef,
): PlaceResult {
  return notImplemented("placeArmed", 2);
}
