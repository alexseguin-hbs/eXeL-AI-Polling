/**
 * ARCHITECT-2525 · PLACED ASSET (Rev A) — his instance-state record (intake master §9 / CLAUDE_CODE_INTAKE.md) and the
 * pure adapters to/from the EXISTING PlacedObject (the persisted store stays RoomCell.objects — ft grid, centre-of-cell).
 * =================================================================================================
 * "Do not store GLB mesh data as canonical project state. Placement state should reference the semantic asset." A
 * PlacedAsset is semantic id + transform only: instanceId · assetId · roomId · positionM (metres, the asset's FLOOR_CENTER
 * pivot in the room frame: +X east, +Y north, +Z up) · rotationDeg (about Z, ∈ allowedDegrees) · authority ILLUSTRATIVE.
 * The adapters convert ONCE at this boundary: plan gx/gy (centre at g+0.5 ft, y DOWN = south) ⇄ metres (y UP = north);
 * elevation ⇄ z. Variant / per-instance size live on the PlacedObject (the designer's parametric state) — a round trip
 * through fromPlacedAsset keeps them when the prior object is passed. Pure + deterministic; nothing here can reach
 * canonical truth (a PlacedAsset is never written into an ArchitectProject).
 */
import { ROOM_GRID, elevOf, kindByAssetId, ASSET_PARAMS, type ObjectKind, type PlacedObject, type Rot } from "@/lib/room-objects";
import { ftFromM, mFromFt } from "./dimensions";
import { ALLOWED_DEGREES } from "./registry";

export interface PlacedAsset {
  instanceId: string;
  assetId: string;
  roomId: string;
  positionM: { x: number; y: number; z: number };
  rotationDeg: number;
  authority: "ILLUSTRATIVE";
}

/** PlacedObject (ft grid) → PlacedAsset (metres, his record). `roomId` is the RoomCell id the object belongs to. */
export function toPlacedAsset(o: PlacedObject, roomId: string): PlacedAsset {
  return {
    instanceId: o.id,
    assetId: ASSET_PARAMS[o.kind].id,
    roomId,
    positionM: { x: mFromFt(o.gx + 0.5), y: mFromFt(ROOM_GRID - (o.gy + 0.5)), z: mFromFt(elevOf(o)) },
    rotationDeg: o.rot,
    authority: "ILLUSTRATIVE",
  };
}

/** Every object of a room as PlacedAssets. */
export function placedAssetsOf(objects: readonly PlacedObject[] | undefined, roomId: string): PlacedAsset[] {
  return (objects ?? []).map((o) => toPlacedAsset(o, roomId));
}

/** The nearest supported rotation (room-objects Rot) to a yaw in degrees. */
export function snapRotation(deg: number): Rot {
  const d = ((Math.round(deg) % 360) + 360) % 360;
  let best: number = ALLOWED_DEGREES[0], bestD = 360;
  for (const a of ALLOWED_DEGREES) { const dd = Math.min(Math.abs(d - a), 360 - Math.abs(d - a)); if (dd < bestD) { best = a; bestD = dd; } }
  return best as Rot;
}

/** PlacedAsset → PlacedObject. An unknown assetId yields null (WireGuard: never a crash). `prior` (the object this record
 *  was made from, when known) carries its variant / per-instance size, which the semantic record does not hold. */
export function fromPlacedAsset(a: PlacedAsset, prior?: PlacedObject): PlacedObject | null {
  const kind: ObjectKind | undefined = kindByAssetId(a.assetId);
  if (!kind) return null;
  const gx = ftFromM(a.positionM.x) - 0.5;
  const gy = ROOM_GRID - ftFromM(a.positionM.y) - 0.5;
  const elev = ftFromM(a.positionM.z);
  const r6 = (n: number) => Math.round(n * 1e6) / 1e6;
  const base: PlacedObject = { id: a.instanceId, kind, gx: r6(gx), gy: r6(gy), rot: snapRotation(a.rotationDeg) };
  const keep = prior && prior.kind === kind ? { ...(prior.variant ? { variant: prior.variant } : {}), ...(prior.size ? { size: prior.size } : {}) } : {};
  // an elevation that is just the kind's default (a window's 3-ft sill) stays implicit, as the designer stores it
  const explicit = prior && typeof prior.elev === "number";
  const withElev = explicit || Math.abs(elev - elevOf(base)) > 1e-6 ? { elev: r6(elev) } : {};
  return { ...base, ...keep, ...withElev };
}
