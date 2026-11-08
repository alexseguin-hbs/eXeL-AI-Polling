// ARCHITECT-2525 / FUTURE · state/placement-machine — tap→arm→tap→place→disarm (plan §16, FCRS-12/13).
// Real physics (plan item 5): nothing passes through a wall (clamped to the clear interior), wall pieces sit FLUSH to
// the nearest wall, no two floor pieces overlap. Invariant: one arm → at most one placement → disarm. Pure.
import type { ArchitectProjectV2 } from "../domain/project";
import type { PlacedAsset, Vec3Um } from "../domain/assets";
import type { SpaceEntityV2 } from "../domain/geometry";
import type { ActorRef } from "../domain/actors";
import { assetById } from "../domain/asset-catalog";
import type { CatalogAsset } from "../domain/asset-catalog";

export interface ArmState { armed_asset_id: string | null }

export function arm(_state: ArmState, assetId: string): ArmState { return { armed_asset_id: assetId }; }
export function disarm(_state: ArmState): ArmState { return { armed_asset_id: null }; }

export interface PlaceResult {
  project: ArchitectProjectV2;
  arm: ArmState;        // ALWAYS disarmed after a placement attempt that succeeds
  placed: boolean;
  rejected_reason?: string;
}

interface Rect { x0: number; y0: number; x1: number; y1: number }

/** The clear interior of a space in world µm (inside the 1-ft reserved zone on every side). */
function clearRect(s: SpaceEntityV2): Rect {
  const x0 = s.outer_x_um + s.wall_zone_thickness_um;
  const y0 = s.outer_y_um + s.wall_zone_thickness_um;
  return { x0, y0, x1: x0 + s.clear_width_um, y1: y0 + s.clear_depth_um };
}

/** Footprint half-extents (µm) after rotation; 90/270 swap width and depth. */
function halfExtents(a: CatalogAsset, rotationDeg: number): { hw: number; hd: number } {
  const swap = rotationDeg === 90 || rotationDeg === 270;
  return { hw: (swap ? a.depth_um : a.width_um) / 2, hd: (swap ? a.width_um : a.depth_um) / 2 };
}

function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

function rectOf(center: { x: number; y: number }, hw: number, hd: number): Rect {
  return { x0: center.x - hw, y0: center.y - hd, x1: center.x + hw, y1: center.y + hd };
}
function overlaps(a: Rect, b: Rect): number {
  return Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
}

/**
 * Place the armed asset at a world point in a room. Clamps inside the clear interior (never through a wall); a WALL
 * asset snaps flush to the nearest wall; rejects if it would overlap another floor piece in the same room.
 */
export function placeArmed(
  project: ArchitectProjectV2,
  armState: ArmState,
  spaceId: string,
  pointUm: Vec3Um,
  rotationDeg: number,
  _actor: ActorRef,
): PlaceResult {
  const keep: PlaceResult = { project, arm: armState, placed: false };
  if (!armState.armed_asset_id) return { ...keep, rejected_reason: "nothing armed" };
  const asset = assetById(armState.armed_asset_id);
  if (!asset) return { ...keep, rejected_reason: `unknown asset ${armState.armed_asset_id}` };
  const space = project.spaces.find((s) => s.entity_id === spaceId);
  if (!space) return { ...keep, rejected_reason: `unknown room ${spaceId}` };

  const clear = clearRect(space);
  const { hw, hd } = halfExtents(asset, rotationDeg);
  // the footprint must fit the room at all
  if (hw * 2 > clear.x1 - clear.x0 || hd * 2 > clear.y1 - clear.y0) {
    return { ...keep, rejected_reason: "does not fit the room" };
  }

  let cx = clamp(pointUm.x, clear.x0 + hw, clear.x1 - hw);
  let cy = clamp(pointUm.y, clear.y0 + hd, clear.y1 - hd);

  // WALL assets snap flush to the nearest wall (back edge on the wall).
  if (asset.mounting === "WALL") {
    const dLeft = cx - (clear.x0 + hw), dRight = (clear.x1 - hw) - cx;
    const dTop = cy - (clear.y0 + hd), dBottom = (clear.y1 - hd) - cy;
    const m = Math.min(dLeft, dRight, dTop, dBottom);
    if (m === dLeft) cx = clear.x0 + hw;
    else if (m === dRight) cx = clear.x1 - hw;
    else if (m === dTop) cy = clear.y0 + hd;
    else cy = clear.y1 - hd;
  }

  const newRect = rectOf({ x: cx, y: cy }, hw, hd);
  for (const other of project.assets) {
    if (other.space_id !== spaceId) continue;
    const oa = assetById(other.asset_id);
    if (!oa) continue;
    const oe = halfExtents(oa, other.rotation_deg);
    if (overlaps(newRect, rectOf({ x: other.position_um.x, y: other.position_um.y }, oe.hw, oe.hd)) > 1) {
      return { ...keep, rejected_reason: "overlaps an existing item" };
    }
  }

  const instance: PlacedAsset = {
    instance_id: `i-${asset.asset_id}-${project.assets.length + 1}-${Math.round(cx)}-${Math.round(cy)}`,
    asset_id: asset.asset_id,
    space_id: spaceId,
    position_um: { x: cx, y: cy, z: 0 },
    rotation_deg: rotationDeg,
    authority: "USER_SELECTED",
  };
  return {
    project: { ...project, assets: [...project.assets, instance] },
    arm: { armed_asset_id: null }, // disarm after a successful placement (the §16 invariant)
    placed: true,
  };
}

/** Move / rotate / remove a placed instance (Active Elements), with the same wall-clamp + no-overlap guarantees. */
export function moveInstance(project: ArchitectProjectV2, instanceId: string, pointUm: Vec3Um): PlaceResult {
  const inst = project.assets.find((a) => a.instance_id === instanceId);
  if (!inst) return { project, arm: { armed_asset_id: null }, placed: false, rejected_reason: "unknown instance" };
  const without = { ...project, assets: project.assets.filter((a) => a.instance_id !== instanceId) };
  const res = placeArmed(without, { armed_asset_id: inst.asset_id }, inst.space_id, pointUm, inst.rotation_deg, { kind: "SYSTEM", id: "move" });
  if (!res.placed) return { project, arm: { armed_asset_id: null }, placed: false, rejected_reason: res.rejected_reason };
  // keep the original instance_id
  const moved = res.project.assets[res.project.assets.length - 1];
  return { project: { ...res.project, assets: res.project.assets.map((a) => (a === moved ? { ...a, instance_id: instanceId } : a)) }, arm: { armed_asset_id: null }, placed: true };
}

export function rotateInstance(project: ArchitectProjectV2, instanceId: string): ArchitectProjectV2 {
  return { ...project, assets: project.assets.map((a) => (a.instance_id === instanceId ? { ...a, rotation_deg: (a.rotation_deg + 90) % 360 } : a)) };
}
export function removeInstance(project: ArchitectProjectV2, instanceId: string): ArchitectProjectV2 {
  return { ...project, assets: project.assets.filter((a) => a.instance_id !== instanceId) };
}
