/**
 * ARCHITECT-2525 · PLACEMENT (Rev A, PLACEMENT slice) — his placement operations (intake master §9–§11; showcase brief
 * "PLACEMENT MODE": SELECT · PLACE · MOVE · ROTATE · SNAP · REMOVE, + DUPLICATE) as ONE pure reducer over
 * `{ instances: PlacedAsset[] }`.
 * =================================================================================================
 * "Do not require model reconstruction to rotate a chair. Rotation is transform state." Every op takes a state and returns
 * a NEW state (the input is never mutated — structural sharing for untouched instances); every transform goes through
 * snap.ts' resolvePlacement so an instance can only ever hold a valid transform for its host (a FLOOR asset at z = 0, a
 * CEILING asset at the ceiling, a window above the floor, a wall asset on its wall). The metadata the ops read comes from
 * the injected lookup (default: the registry's metadataById) — never an id switch. Instance ids are deterministic
 * (`<roomId>-<slug>-NNN`, the next free number in the state, or a `seq` the caller passes — no clock, no RNG, the
 * replay law). Authority is always "ILLUSTRATIVE" (§27): nothing here imports canonical/*, and the RoomCell.objects store
 * stays the persisted carrier through the existing placed-asset.ts adapters (placedToRoomObjects / roomObjectsToPlaced).
 */
import type { PlacedObject, Wall } from "@/lib/room-objects";
import { fromPlacedAsset, placedAssetsOf, type PlacedAsset } from "./placed-asset";
import { metadataById } from "./registry";
import { resolvePlacement, hostOf, isWallHost, wallOfPlaced, ROOM_BOX, type PlacementMeta, type RoomBox, type SnapReason, type ResolvedPlacement } from "./snap";

export type { PlacedAsset };

export interface PlacementState { instances: PlacedAsset[] }
export const EMPTY_PLACEMENT: PlacementState = Object.freeze({ instances: Object.freeze([]) as unknown as PlacedAsset[] });

/** How an op finds the metadata behind an assetId (the registry by default; a test passes the library's JSON). */
export type MetaLookup = (assetId: string) => PlacementMeta | undefined;
export interface PlacementContext { meta?: MetaLookup; room?: RoomBox }

export type PositionIn = { x: number; y: number; z?: number };
export interface PlaceArgs { assetId: string; roomId: string; positionM: PositionIn; rotationDeg?: number; wall?: Wall; seq?: number }
export interface MoveArgs { instanceId: string; positionM: PositionIn; wall?: Wall }
export interface RotateArgs { instanceId: string; rotationDeg?: number; byDeg?: number }
export interface RemoveArgs { instanceId: string }
export interface DuplicateArgs { instanceId: string; offsetM?: { x: number; y: number }; seq?: number }
export interface SelectArgs { instanceId: string | null }

export type PlacementOp =
  | ({ type: "SELECT" } & SelectArgs)
  | ({ type: "PLACE" } & PlaceArgs)
  | ({ type: "MOVE" } & MoveArgs)
  | ({ type: "ROTATE" } & RotateArgs)
  | ({ type: "REMOVE" } & RemoveArgs)
  | ({ type: "DUPLICATE" } & DuplicateArgs);

export type OpReason = SnapReason | "UNKNOWN_ASSET" | "UNKNOWN_INSTANCE" | "TRANSLATE_FORBIDDEN" | "ROTATE_FORBIDDEN" | "NOT_PLACEABLE";

export interface PlacementResult {
  state: PlacementState;       // ALWAYS a new object; equal in content to the input when the op was refused (ok false)
  ok: boolean;
  reasons: OpReason[];         // what constrained the transform, or why the op was refused
  instanceId?: string;         // the instance the op touched / created / selected
  resolved?: ResolvedPlacement;
}

const AUTHORITY = "ILLUSTRATIVE" as const;
const fin = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const fresh = (instances: readonly PlacedAsset[]): PlacementState => ({ instances: [...instances] });
const refuse = (state: PlacementState, reasons: OpReason[], instanceId?: string): PlacementResult =>
  ({ state: fresh(state.instances), ok: false, reasons, ...(instanceId ? { instanceId } : {}) });
const lookupOf = (ctx?: PlacementContext): MetaLookup => ctx?.meta ?? ((id) => metadataById(id));
const roomOf = (ctx?: PlacementContext): RoomBox => ctx?.room ?? ROOM_BOX;
const find = (state: PlacementState, id: string): PlacedAsset | undefined => state.instances.find((i) => i.instanceId === id);
/** The wall a wall-hosted instance is on — the lock a ROTATE / DUPLICATE passes so the piece never jumps walls at a corner
 *  (a deep, narrow piece in a corner is nearer the other wall by pivot). A floor asset gets no lock: its WALL_BACK snap is
 *  soft and follows where its back turns. */
const wallLock = (meta: PlacementMeta, cur: PlacedAsset, room: RoomBox): Wall | undefined => (isWallHost(hostOf(meta)) ? wallOfPlaced(meta, cur, room) : undefined);

/** The slug of a semantic id for instance ids: the grammar prefix (`architect2525.asset.`) and the version suffix dropped,
 *  dots → hyphens — `architect2525.asset.sofa.v1` → `sofa`, `furniture.sofa.3seat.v1` → `furniture-sofa-3seat`. */
export function assetSlug(assetId: string): string {
  const parts = String(assetId).toLowerCase().replace(/\.v\d+$/, "").split(".").filter(Boolean);
  while (parts.length > 1 && (parts[0] === "architect2525" || parts[0] === "asset")) parts.shift();
  const s = parts.join("-").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "asset";
}

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The next instance id for an asset in a room: `<roomId>-<slug>-NNN` — `seq` when given (bumped past any collision), else
 *  one past the highest NNN already in the state for that room + slug. Deterministic: the same state → the same id. */
export function instanceIdFor(state: PlacementState, roomId: string, assetId: string, seq?: number): string {
  const slug = assetSlug(assetId);
  const prefix = `${roomId}-${slug}-`;
  const re = new RegExp(`^${esc(prefix)}(\\d+)$`);
  const taken = new Set(state.instances.map((i) => i.instanceId));
  let n = fin(seq) && seq > 0 ? Math.floor(seq) : 0;
  if (n === 0) for (const id of taken) { const m = re.exec(id); if (m) n = Math.max(n, Number(m[1])); }
  if (!(fin(seq) && seq > 0)) n += 1;
  let id = `${prefix}${String(n).padStart(3, "0")}`;
  while (taken.has(id)) { n += 1; id = `${prefix}${String(n).padStart(3, "0")}`; }
  return id;
}

/** SELECT — a pure lookup (selection is UI state, not placement state): ok when the instance exists; null clears. */
export function selectAsset(state: PlacementState, args: SelectArgs): PlacementResult {
  if (args.instanceId === null) return { state: fresh(state.instances), ok: true, reasons: [] };
  const hit = find(state, args.instanceId);
  return hit ? { state: fresh(state.instances), ok: true, reasons: [], instanceId: hit.instanceId } : refuse(state, ["UNKNOWN_INSTANCE"]);
}

/** PLACE — a new instance of `assetId` in `roomId` at the resolved transform; refused for an unknown asset or a BUILT_IN. */
export function placeAsset(state: PlacementState, args: PlaceArgs, ctx?: PlacementContext): PlacementResult {
  const meta = lookupOf(ctx)(args.assetId);
  if (!meta) return refuse(state, ["UNKNOWN_ASSET"]);
  const resolved = resolvePlacement(meta, { positionM: args.positionM, rotationDeg: args.rotationDeg, wall: args.wall }, roomOf(ctx));
  if (!resolved.placeable) return { ...refuse(state, [...resolved.reasons, "NOT_PLACEABLE"]), resolved };
  const instanceId = instanceIdFor(state, args.roomId, args.assetId, args.seq);
  const inst: PlacedAsset = { instanceId, assetId: args.assetId, roomId: args.roomId, positionM: { ...resolved.positionM }, rotationDeg: resolved.rotationDeg, authority: AUTHORITY };
  return { state: { instances: [...state.instances, inst] }, ok: true, reasons: [...resolved.reasons], instanceId, resolved };
}

/** MOVE — translate an instance to a proposed pivot (z optional); the host re-resolves it (a wall asset stays on a wall, a
 *  floor asset stays at z 0 and inside the room). Refused when the metadata forbids translation. */
export function moveAsset(state: PlacementState, args: MoveArgs, ctx?: PlacementContext): PlacementResult {
  const cur = find(state, args.instanceId);
  if (!cur) return refuse(state, ["UNKNOWN_INSTANCE"]);
  const meta = lookupOf(ctx)(cur.assetId);
  if (!meta) return refuse(state, ["UNKNOWN_ASSET"], cur.instanceId);
  if (meta.placement?.allowTranslate === false) return refuse(state, ["TRANSLATE_FORBIDDEN"], cur.instanceId);
  const z = fin(args.positionM.z) ? args.positionM.z : cur.positionM.z;
  const resolved = resolvePlacement(meta, { positionM: { x: args.positionM.x, y: args.positionM.y, z }, rotationDeg: cur.rotationDeg, wall: args.wall }, roomOf(ctx));
  if (!resolved.placeable) return { ...refuse(state, [...resolved.reasons, "NOT_PLACEABLE"], cur.instanceId), resolved };
  const next: PlacedAsset = { ...cur, positionM: { ...resolved.positionM }, rotationDeg: resolved.rotationDeg, authority: AUTHORITY };
  return { state: { instances: state.instances.map((i) => (i === cur ? next : i)) }, ok: true, reasons: [...resolved.reasons], instanceId: cur.instanceId, resolved };
}

/** ROTATE — yaw only, about the vertical axis at the FLOOR_CENTER pivot: absolute `rotationDeg` or relative `byDeg`,
 *  wrapped to [0, 360) and snapped per the metadata (15° grain when freeRotation, else the nearest allowedDegrees); a
 *  wall-hosted asset keeps facing the room (a WALL_OPENING may flip 180° — the hinge side). Refused when forbidden. */
export function rotateAsset(state: PlacementState, args: RotateArgs, ctx?: PlacementContext): PlacementResult {
  const cur = find(state, args.instanceId);
  if (!cur) return refuse(state, ["UNKNOWN_INSTANCE"]);
  const meta = lookupOf(ctx)(cur.assetId);
  if (!meta) return refuse(state, ["UNKNOWN_ASSET"], cur.instanceId);
  if (meta.placement?.allowRotate === false) return refuse(state, ["ROTATE_FORBIDDEN"], cur.instanceId);
  const want = fin(args.rotationDeg) ? args.rotationDeg : cur.rotationDeg + (fin(args.byDeg) ? args.byDeg : 0);
  const resolved = resolvePlacement(meta, { positionM: { ...cur.positionM }, rotationDeg: want, wall: wallLock(meta, cur, roomOf(ctx)) }, roomOf(ctx));
  if (!resolved.placeable) return { ...refuse(state, [...resolved.reasons, "NOT_PLACEABLE"], cur.instanceId), resolved };
  const next: PlacedAsset = { ...cur, positionM: { ...resolved.positionM }, rotationDeg: resolved.rotationDeg, authority: AUTHORITY };
  return { state: { instances: state.instances.map((i) => (i === cur ? next : i)) }, ok: true, reasons: [...resolved.reasons], instanceId: cur.instanceId, resolved };
}

/** REMOVE — drop an instance (no metadata needed). Refused for an unknown id. */
export function removeAsset(state: PlacementState, args: RemoveArgs): PlacementResult {
  const cur = find(state, args.instanceId);
  if (!cur) return refuse(state, ["UNKNOWN_INSTANCE"]);
  return { state: { instances: state.instances.filter((i) => i !== cur) }, ok: true, reasons: [], instanceId: cur.instanceId };
}

/** DUPLICATE — a new instance (next id) with the SAME transform (or offset by `offsetM`, re-resolved so it stays valid). */
export function duplicateAsset(state: PlacementState, args: DuplicateArgs, ctx?: PlacementContext): PlacementResult {
  const cur = find(state, args.instanceId);
  if (!cur) return refuse(state, ["UNKNOWN_INSTANCE"]);
  const meta = lookupOf(ctx)(cur.assetId);
  if (!meta) return refuse(state, ["UNKNOWN_ASSET"], cur.instanceId);
  const off = args.offsetM && fin(args.offsetM.x) && fin(args.offsetM.y) ? args.offsetM : { x: 0, y: 0 };
  const lock = off.x === 0 && off.y === 0 ? wallLock(meta, cur, roomOf(ctx)) : undefined;
  const resolved = resolvePlacement(meta, { positionM: { x: cur.positionM.x + off.x, y: cur.positionM.y + off.y, z: cur.positionM.z }, rotationDeg: cur.rotationDeg, wall: lock }, roomOf(ctx));
  if (!resolved.placeable) return { ...refuse(state, [...resolved.reasons, "NOT_PLACEABLE"], cur.instanceId), resolved };
  const instanceId = instanceIdFor(state, cur.roomId, cur.assetId, args.seq);
  const copy: PlacedAsset = { instanceId, assetId: cur.assetId, roomId: cur.roomId, positionM: { ...resolved.positionM }, rotationDeg: resolved.rotationDeg, authority: AUTHORITY };
  return { state: { instances: [...state.instances, copy] }, ok: true, reasons: [...resolved.reasons], instanceId, resolved };
}

/** The one dispatcher: every PlacementOp through its handler. */
export function applyPlacementOp(state: PlacementState, op: PlacementOp, ctx?: PlacementContext): PlacementResult {
  switch (op.type) {
    case "SELECT": return selectAsset(state, op);
    case "PLACE": return placeAsset(state, op, ctx);
    case "MOVE": return moveAsset(state, op, ctx);
    case "ROTATE": return rotateAsset(state, op, ctx);
    case "REMOVE": return removeAsset(state, op);
    case "DUPLICATE": return duplicateAsset(state, op, ctx);
    default: return refuse(state, []);
  }
}

/** A sequence of ops, folded; the result carries the final state and the last op's verdict. */
export function applyPlacementOps(state: PlacementState, ops: readonly PlacementOp[], ctx?: PlacementContext): PlacementResult {
  let last: PlacementResult = { state: fresh(state.instances), ok: true, reasons: [] };
  for (const op of ops) last = applyPlacementOp(last.state, op, ctx);
  return last;
}

/** The instances of one room, state order. */
export function instancesInRoom(state: PlacementState, roomId: string): PlacedAsset[] { return state.instances.filter((i) => i.roomId === roomId); }

/**
 * PlacementState → RoomCell.objects (the persisted store) through the existing adapter (fromPlacedAsset): one PlacedObject per
 * instance whose assetId the registry knows (the registry decides the kind; an unknown id is skipped — WireGuard, never a
 * crash). `prior` (the room's current objects) carries variant / per-instance size, which the semantic record never holds.
 * The adapter quantizes yaw to the designer's Rot (0/90/180/270) and feet to 1e-6 ft; metres ⇄ ft through dimensions.ts.
 */
export function placedToRoomObjects(state: PlacementState, registry: Readonly<Record<string, { kind: unknown }>>, roomId?: string, prior?: readonly PlacedObject[]): PlacedObject[] {
  const byId = new Map((prior ?? []).map((o) => [o.id, o] as const));
  const out: PlacedObject[] = [];
  for (const inst of state.instances) {
    if (roomId !== undefined && inst.roomId !== roomId) continue;
    if (!Object.hasOwn(registry, inst.assetId)) continue;
    // Rev A' — a library asset with no legacy kind round-trips as a kind "asset" PlacedObject (fromPlacedAsset), so all 139
    // persist into RoomCell.objects; only a truly-unknown id is skipped (WireGuard, never a crash).
    const o = fromPlacedAsset(inst, byId.get(inst.instanceId));
    if (o) out.push(o);
  }
  return out;
}

/** The instances placedToRoomObjects CANNOT carry into RoomCell.objects — only an assetId the registry does not know (every
 *  library asset now persists via the kind "asset" carrier). Surfaced, never silently lost. */
export function unpersistableInstances(state: PlacementState, registry: Readonly<Record<string, { kind: unknown }>>): PlacedAsset[] {
  return state.instances.filter((i) => !Object.hasOwn(registry, i.assetId));
}

/** RoomCell.objects → PlacementState through the existing adapter (placedAssetsOf). */
export function roomObjectsToPlaced(objects: readonly PlacedObject[] | undefined, roomId: string): PlacementState {
  return { instances: placedAssetsOf(objects, roomId) };
}
