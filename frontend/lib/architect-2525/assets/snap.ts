/**
 * ARCHITECT-2525 · SNAP (Rev A, PLACEMENT slice) — his mounting + snap taxonomy (intake master §6, §11, §12; showcase brief
 * "ROTATION · PIVOT STANDARD · SNAP SYSTEM") as ONE pure, metadata-driven resolver.
 * =================================================================================================
 * `resolvePlacement(meta, proposed, room)` takes what the user asked for and returns the CONSTRAINED transform plus the
 * reasons it moved. Invalid states are impossible by construction — a FLOOR asset is always at z = 0, a CEILING asset
 * always hangs from the ceiling, a window (a WALL_OPENING shorter than a door) never lies on the floor, a WALL asset
 * never leaves its wall, a BUILT_IN element is not freely placeable. Rotation is only ever YAW about the vertical axis at
 * the FLOOR_CENTER pivot (§6): freeRotation → 15° steps (his furniture grammar: [0,15,30,45,60,75,90,180,270] generalised
 * to the whole circle); otherwise the nearest of `allowedDegrees` (missing/empty → the orthogonal four).
 *
 * Frame: the ROOM frame of placed-asset.ts — metres, +X east, +Y north, +Z up, origin the room's SW floor corner; the room
 * is the designer's 10 × 10 ft cube (room-objects ROOM_GRID · room-layout ROOM_FT / STOREY_FT) converted ONCE through
 * dimensions.ts. The asset's local X = width, Y = depth; its BACK is the −depth edge at yaw 0 (the room-objects part
 * convention — headboard / sofa back / toilet tank at local y = 0, which the adapter maps to +Y north), so the back normal
 * is (−sin θ, cos θ) and "back to the N wall" is yaw 0 · W 90 · S 180 · E 270 — the same yaws room-objects' partRects draws.
 *
 * Everything here is driven by the METADATA OBJECT (dimensionsM · rotation · mounting · snap · placement) — never by an
 * asset id. Pure + deterministic (no clock, no RNG — the replay law); outputs rounded at the micrometre, the canonical
 * grain. Nothing here can reach canonical truth (no canonical/* import; a resolved transform is illustrative state).
 */
import { OBJECT_SPEC, type Wall } from "@/lib/room-objects";
import { ROOM_FT, STOREY_FT, OPENING_STD } from "@/lib/room-layout";
import { mFromFt } from "./dimensions";

/** The subset of his metadata contract the resolver reads — structurally satisfied by the registry's LibraryMetadata, an
 *  AssetDef and a raw metadata/*.json record alike (never an id lookup). */
export interface PlacementMeta {
  id: string;
  dimensionsM: { width: number; depth: number; height: number };
  rotation?: { axis?: string; allowedDegrees?: readonly number[]; freeRotation?: boolean };
  mounting: string;                                   // FLOOR | WALL | CEILING | SURFACE | BUILT_IN (an unknown value reads FLOOR)
  snap?: readonly string[];                           // his snap taxonomy; unknown targets are ignored
  placement?: { allowTranslate?: boolean; allowRotate?: boolean };
}

/** The room the asset is placed in (metres). The default is the designer's 10 × 10 × 10 ft cube. */
export interface RoomBox { widthM: number; depthM: number; heightM: number }
export const ROOM_BOX: RoomBox = Object.freeze({ widthM: mFromFt(ROOM_FT), depthM: mFromFt(ROOM_FT), heightM: mFromFt(STOREY_FT) });

export type Vec3 = { x: number; y: number; z: number };
export type Host = "FLOOR" | "WALL" | "WALL_OPENING" | "CEILING" | "SURFACE" | "CABINET_UNDERSIDE" | "DOOR" | "BUILT_IN";

export interface ProposedPlacement {
  positionM: { x: number; y: number; z?: number };    // the FLOOR_CENTER pivot the user asked for (z optional — the host decides)
  rotationDeg?: number;                                // yaw asked for (any number; wrapped + snapped)
  wall?: Wall;                                         // lock to this wall (a drag along a wall passes the wall it locked — moveObject's rule)
}

export type SnapReason =
  | "BUILT_IN" | "INVALID_DIMENSIONS" | "TOO_TALL" | "INPUT_DEFAULTED"
  | "YAW_SNAPPED_15" | "YAW_SNAPPED_ALLOWED" | "YAW_WALL_FACING"
  | "FLOOR_Z0" | "CEILING_Z" | "SURFACE_Z_DEFAULT" | "WALL_Z_DEFAULT" | "Z_CLAMPED"
  | "FOOTPRINT_CLAMPED" | "WALL_FLUSH" | "WALL_BACK_FLUSH" | "WALL_CORNER"
  | "OPENING_DOOR_Z0" | "OPENING_SILL" | "OPENING_SILL_DEFAULT";

export interface ResolvedPlacement {
  placeable: boolean;          // false → BUILT_IN / invalid dimensions / a ceiling asset taller than the storey; positionM / rotationDeg then echo the sanitized proposal
  host: Host;                  // the plane the asset is hosted on (from mounting + snap)
  positionM: Vec3;             // the constrained FLOOR_CENTER pivot, metres, µm-rounded
  rotationDeg: number;         // yaw ∈ [0, 360), snapped per the metadata (and forced for wall-hosted assets)
  wall?: Wall;                 // the wall the asset is flush to (wall hosts · a snapped WALL_BACK / WALL_CORNER)
  corner?: `${"N" | "S"}${"W" | "E"}`;
  reasons: SnapReason[];       // every constraint that changed the proposal, in the order applied
}

// ── The documented constants (one source each — the room contract, never a per-asset offset) ───────────────────────────
/** Free-rotation grain: his furniture metadata's 15° list, generalised to the whole circle. */
export const FREE_STEP_DEG = 15;
/** The orthogonal four — the default allowedDegrees when the metadata gives none (and the architectural orientation set). */
export const ORTHO_DEGREES: readonly number[] = Object.freeze([0, 90, 180, 270]);
/** Soft-snap reach (WALL_BACK · WALL_CORNER): one grid cell — the designer's 1-ft cell. */
export const SNAP_DIST_M = mFromFt(1);
/** Default underside height of a WALL-hosted asset with no instance elevation: 54 in AFF — the upper-cabinet line
 *  (36 in counter + 18 in clearance), the standard wall-mount datum. Any instance elevation (z) overrides it. */
export const WALL_MOUNT_Z_M = mFromFt(4.5);
/** SURFACE / COUNTERTOP default: the counter height — OBJECT_SPEC.counter.h (36 in = 0.9144 m, the brief's ≈0.9 m). */
export const SURFACE_Z_M = mFromFt(OBJECT_SPEC.counter.h);
/** DOOR-hosted hardware (a lock, a lever set) default: the 36-in hardware line (ADA 34–48 in). */
export const DOOR_HARDWARE_Z_M = mFromFt(3);
/** Openings — the room contract's standards (room-layout OPENING_STD): a window's sill + head, the door leaf. */
export const WIN_SILL_M = mFromFt(OPENING_STD.WIN_SILL_FT);
export const WIN_HEAD_M = mFromFt(OPENING_STD.WIN_HEAD_FT);
export const DOOR_H_M = mFromFt(OPENING_STD.DOOR_H_FT);
/** A window can NEVER lie on the floor: the lowest sill the resolver allows — one grid cell (a stool + apron + framed sill;
 *  glazing below that is a door). */
export const WINDOW_MIN_SILL_M = mFromFt(1);

const KNOWN_SNAPS = new Set<string>(["FLOOR", "WALL", "WALL_BACK", "WALL_CORNER", "WALL_OPENING", "CEILING", "SURFACE", "COUNTERTOP", "CABINET_UNDERSIDE", "CABINET_LINE", "ROOF_LINE", "ROOF_EDGE", "DOOR"]);
const KNOWN_MOUNTS = new Set<string>(["FLOOR", "WALL", "CEILING", "SURFACE", "BUILT_IN"]);
const WALLS: readonly Wall[] = ["N", "S", "W", "E"];
/** A wall hint is honoured only when it names a wall (a stray string from a caller is ignored, never a crash). */
const hintOf = (w: unknown): Wall | undefined => (typeof w === "string" && (WALLS as readonly string[]).includes(w) ? (w as Wall) : undefined);

/** µm rounding — the canonical grain (dimensions.ts) — kills float noise so equal inputs give byte-equal outputs. */
const r6 = (n: number): number => { const v = Math.round(n * 1e6) / 1e6; return v === 0 ? 0 : v; };
const fin = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** Yaw wrapped to [0, 360). */
export function wrapYaw(deg: number): number {
  if (!fin(deg)) return 0;
  const w = ((deg % 360) + 360) % 360;
  return w === 0 ? 0 : w;   // never -0
}

/** The effective snap targets of a metadata record: its `snap[]` (known targets only), else the one its mounting implies. */
export function snapTargetsFor(meta: PlacementMeta): string[] {
  const given = (meta.snap ?? []).filter((s) => KNOWN_SNAPS.has(s));
  if (given.length > 0) return [...new Set(given)];
  const m = KNOWN_MOUNTS.has(meta.mounting) ? meta.mounting : "FLOOR";
  return m === "BUILT_IN" ? [] : [m];
}

/** The plane an asset is hosted on. MOUNTING is the arbiter (a FLOOR asset with WALL in its snap list is a floor asset that
 *  snaps its back to the wall); the snap list refines a WALL host into WALL_OPENING / DOOR / CABINET_UNDERSIDE. */
export function hostOf(meta: PlacementMeta): Host {
  const m = KNOWN_MOUNTS.has(meta.mounting) ? meta.mounting : "FLOOR";
  if (m === "BUILT_IN") return "BUILT_IN";
  if (m === "CEILING") return "CEILING";
  if (m === "SURFACE") return "SURFACE";
  if (m === "WALL") {
    const s = new Set(snapTargetsFor(meta));
    if (s.has("WALL_OPENING")) return "WALL_OPENING";
    if (s.has("DOOR")) return "DOOR";
    if (s.has("CABINET_UNDERSIDE")) return "CABINET_UNDERSIDE";
    return "WALL";
  }
  return "FLOOR";
}

/** A door reaches the floor; a window hangs at its sill. An opening at least as tall as the window HEAD line (6'-6") stands
 *  on the floor — nothing shorter than that is a door. */
export function isDoorOpening(meta: PlacementMeta): boolean { return meta.dimensionsM.height >= WIN_HEAD_M - 1e-9; }

/** Yaw snapped per the metadata: freeRotation → the 15° grain; else the nearest allowedDegrees (ties → list order). */
export function snapYaw(meta: PlacementMeta, deg: number): { deg: number; reason: SnapReason | null } {
  const w = wrapYaw(deg);
  if (meta.rotation?.freeRotation) {
    const s = wrapYaw(Math.round(w / FREE_STEP_DEG) * FREE_STEP_DEG);
    return { deg: s, reason: s === w ? null : "YAW_SNAPPED_15" };
  }
  const list = (meta.rotation?.allowedDegrees ?? []).filter(fin).map(wrapYaw);
  const allowed = list.length > 0 ? list : [...ORTHO_DEGREES];
  let best = allowed[0], bestD = Infinity;
  for (const a of allowed) { const d = Math.abs(w - a); const dd = Math.min(d, 360 - d); if (dd < bestD - 1e-9) { best = a; bestD = dd; } }
  return { deg: best, reason: best === w ? null : "YAW_SNAPPED_ALLOWED" };
}

/** The yaw that puts an asset's BACK against a wall (N 0 · W 90 · S 180 · E 270 — room-objects' partRects convention). */
export function wallYaw(wall: Wall): number { return wall === "N" ? 0 : wall === "W" ? 90 : wall === "S" ? 180 : 270; }

/** The wall a yaw's back normal (−sin θ, cos θ) points at — the dominant axis; a 45° tie prefers N/S (wallOf's order). */
export function wallFacedByBack(deg: number): Wall {
  const t = (wrapYaw(deg) * Math.PI) / 180;
  const bx = -Math.sin(t), by = Math.cos(t);
  if (Math.abs(by) + 1e-9 >= Math.abs(bx)) return by >= 0 ? "N" : "S";
  return bx < 0 ? "W" : "E";
}

/** The wall nearest a pivot (N = +Y, S = y 0, W = x 0, E = +X); ties resolve N · S · W · E like room-objects' wallOf. */
export function nearestWall(p: { x: number; y: number }, room: RoomBox = ROOM_BOX): Wall {
  const dN = room.depthM - p.y, dS = p.y, dW = p.x, dE = room.widthM - p.x;
  const m = Math.min(dN, dS, dW, dE);
  if (m === dN) return "N";
  if (m === dS) return "S";
  if (m === dW) return "W";
  return "E";
}

/** Half extents (metres) of the yaw-rotated footprint's axis-aligned box — exact at the orthogonal yaws. */
export function halfExtents(meta: PlacementMeta, deg: number): { hx: number; hy: number } {
  const w = meta.dimensionsM.width, d = meta.dimensionsM.depth, y = wrapYaw(deg);
  if (y % 90 === 0) { const swap = y === 90 || y === 270; return swap ? { hx: d / 2, hy: w / 2 } : { hx: w / 2, hy: d / 2 }; }
  const t = (y * Math.PI) / 180, c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
  return { hx: c * w / 2 + s * d / 2, hy: s * w / 2 + c * d / 2 };
}

/** One axis of the footprint kept inside [0, size]: the same rule as room-objects clampFootprint (round = false) — the
 *  centre lives in [half, size − half]; an oversize piece is centred (best effort). Gated equal to clampFootprint at the
 *  orthogonal yaws for every in-range size. */
export function clampAxis(centre: number, half: number, size: number): number {
  if (2 * half > size) return size / 2;
  return clamp(centre, half, size - half);
}

const flushTo = (wall: Wall, x: number, y: number, hx: number, hy: number, room: RoomBox): { x: number; y: number } => {
  switch (wall) {
    case "N": return { x: clampAxis(x, hx, room.widthM), y: room.depthM - hy };
    case "S": return { x: clampAxis(x, hx, room.widthM), y: hy };
    case "W": return { x: hx, y: clampAxis(y, hy, room.depthM) };
    default:  return { x: room.widthM - hx, y: clampAxis(y, hy, room.depthM) };
  }
};

/** The distance from the rotated box's edge to the wall it faces. */
const gapTo = (wall: Wall, x: number, y: number, hx: number, hy: number, room: RoomBox): number =>
  wall === "N" ? room.depthM - (y + hy) : wall === "S" ? y - hy : wall === "W" ? x - hx : room.widthM - (x + hx);

/**
 * THE resolver — the constrained {positionM, rotationDeg} for a proposal plus the reasons, per host:
 *  FLOOR            z = 0; footprint clamped inside; soft snaps when within one cell — WALL_BACK (back flush, yaw to the wall)
 *                   · WALL_CORNER (pushed into the corner, yaw orthogonal); CABINET_LINE reads as WALL_BACK.
 *  WALL             always on a wall (hint or nearest), back flush, yaw FORCED to face the room; z = instance z or 54 in,
 *                   clamped under the ceiling. CABINET_UNDERSIDE: z defaults to the cabinet line minus height. DOOR: 36 in.
 *  WALL_OPENING     on a wall with the wall's normal (yaw or its 180° flip — a door's hinge side); a door at z = 0, a window
 *                   at its sill (instance z, default 3 ft, never below 1 ft).
 *  CEILING          z = storey − height (the top at the ceiling), x/y clamped inside, yaw per metadata.
 *  SURFACE          z = instance z or the counter height, clamped; x/y clamped inside.
 *  BUILT_IN         not freely placeable → placeable false, reason "BUILT_IN". A ceiling asset taller than the storey → "TOO_TALL".
 */
export function resolvePlacement(meta: PlacementMeta, proposed: ProposedPlacement, room: RoomBox = ROOM_BOX): ResolvedPlacement {
  const reasons: SnapReason[] = [];
  const host = hostOf(meta);
  const dm = meta.dimensionsM;
  const dimsOk = fin(dm?.width) && fin(dm?.depth) && fin(dm?.height) && dm.width > 0 && dm.depth > 0 && dm.height > 0;
  const px = proposed.positionM?.x, py = proposed.positionM?.y, pz = proposed.positionM?.z;
  let x = fin(px) ? px : room.widthM / 2, y = fin(py) ? py : room.depthM / 2;
  const zIn: number | undefined = fin(pz) ? pz : undefined;
  if (!fin(px) || !fin(py) || (pz !== undefined && !fin(pz)) || (proposed.rotationDeg !== undefined && !fin(proposed.rotationDeg))) reasons.push("INPUT_DEFAULTED");
  const snapped = snapYaw(meta, fin(proposed.rotationDeg) ? proposed.rotationDeg : 0);
  let yaw = snapped.deg;
  if (snapped.reason) reasons.push(snapped.reason);
  if (!dimsOk) return { placeable: false, host, positionM: { x: r6(x), y: r6(y), z: r6(zIn ?? 0) }, rotationDeg: yaw, reasons: [...reasons, "INVALID_DIMENSIONS"] };
  if (host === "BUILT_IN") return { placeable: false, host, positionM: { x: r6(x), y: r6(y), z: r6(zIn ?? 0) }, rotationDeg: yaw, reasons: [...reasons, "BUILT_IN"] };

  const h = dm.height, zMax = Math.max(0, room.heightM - h);
  // a ceiling asset taller than the storey cannot hang from the ceiling — refused rather than left standing on the floor
  if (host === "CEILING" && h >= room.heightM) return { placeable: false, host, positionM: { x: r6(x), y: r6(y), z: r6(zIn ?? 0) }, rotationDeg: yaw, reasons: [...reasons, "TOO_TALL"] };
  const hint = hintOf(proposed.wall);
  const targets = new Set(snapTargetsFor(meta));
  let z = 0, wall: Wall | undefined, corner: ResolvedPlacement["corner"];
  const clampZ = (want: number): number => { const c = clamp(want, 0, zMax); if (c !== want) reasons.push("Z_CLAMPED"); return c; };
  const clampXY = (): void => {
    const { hx, hy } = halfExtents(meta, yaw);
    const nx = clampAxis(x, hx, room.widthM), ny = clampAxis(y, hy, room.depthM);
    if (nx !== x || ny !== y) reasons.push("FOOTPRINT_CLAMPED");
    x = nx; y = ny;
  };
  const forceYaw = (deg: number, reason: SnapReason): void => { if (yaw !== deg) { yaw = deg; reasons.push(reason); } };

  switch (host) {
    case "FLOOR": {
      if (zIn !== undefined && zIn !== 0) reasons.push("FLOOR_Z0");
      z = 0;
      let done = false;
      if (targets.has("WALL_CORNER")) {
        const { hx, hy } = halfExtents(meta, yaw);
        const wx: Wall = x - hx <= room.widthM - (x + hx) ? "W" : "E", wy: Wall = y - hy <= room.depthM - (y + hy) ? "S" : "N";
        if (gapTo(wx, x, y, hx, hy, room) <= SNAP_DIST_M && gapTo(wy, x, y, hx, hy, room) <= SNAP_DIST_M) {
          const o = snapYaw({ ...meta, rotation: { freeRotation: false, allowedDegrees: ORTHO_DEGREES } }, yaw).deg;
          forceYaw(o, "YAW_WALL_FACING");
          const e = halfExtents(meta, yaw);
          const a = flushTo(wx, x, y, e.hx, e.hy, room), b = flushTo(wy, a.x, a.y, e.hx, e.hy, room);
          x = b.x; y = b.y; corner = `${wy}${wx}` as ResolvedPlacement["corner"]; wall = wy;
          reasons.push("WALL_CORNER"); done = true;
        }
      }
      if (!done && (targets.has("WALL_BACK") || targets.has("CABINET_LINE") || targets.has("WALL"))) {
        const back = hint ?? wallFacedByBack(yaw);
        const { hx, hy } = halfExtents(meta, yaw);
        if (hint !== undefined || gapTo(back, x, y, hx, hy, room) <= SNAP_DIST_M) {
          forceYaw(wallYaw(back), "YAW_WALL_FACING");
          const e = halfExtents(meta, yaw);
          const f = flushTo(back, x, y, e.hx, e.hy, room);
          if (f.x !== x || f.y !== y) reasons.push("WALL_BACK_FLUSH");
          x = f.x; y = f.y; wall = back; done = true;
        }
      }
      if (!done) clampXY();
      break;
    }
    case "CEILING": {
      z = zMax;
      if (zIn === undefined || zIn !== z) reasons.push("CEILING_Z");
      clampXY();
      break;
    }
    case "SURFACE": {
      if (zIn === undefined) reasons.push("SURFACE_Z_DEFAULT");
      z = clampZ(zIn ?? SURFACE_Z_M);
      clampXY();
      break;
    }
    case "WALL": case "DOOR": case "CABINET_UNDERSIDE": {
      wall = hint ?? nearestWall({ x, y }, room);
      forceYaw(wallYaw(wall), "YAW_WALL_FACING");
      const { hx, hy } = halfExtents(meta, yaw);
      const f = flushTo(wall, x, y, hx, hy, room);
      if (f.x !== x || f.y !== y) reasons.push("WALL_FLUSH");
      x = f.x; y = f.y;
      if (zIn === undefined) reasons.push("WALL_Z_DEFAULT");
      const dflt = host === "DOOR" ? DOOR_HARDWARE_Z_M : host === "CABINET_UNDERSIDE" ? Math.max(0, WALL_MOUNT_Z_M - h) : WALL_MOUNT_Z_M;
      z = clampZ(zIn ?? dflt);
      break;
    }
    case "WALL_OPENING": {
      wall = hint ?? nearestWall({ x, y }, room);
      const base = wallYaw(wall), flip = wrapYaw(base + 180);
      const d1 = Math.min(Math.abs(yaw - base), 360 - Math.abs(yaw - base)), d2 = Math.min(Math.abs(yaw - flip), 360 - Math.abs(yaw - flip));
      forceYaw(d2 < d1 - 1e-9 ? flip : base, "YAW_WALL_FACING");
      const { hx, hy } = halfExtents(meta, yaw);
      const f = flushTo(wall, x, y, hx, hy, room);
      if (f.x !== x || f.y !== y) reasons.push("WALL_FLUSH");
      x = f.x; y = f.y;
      if (isDoorOpening(meta)) { z = 0; if (zIn !== undefined && zIn !== 0) reasons.push("OPENING_DOOR_Z0"); }
      else {
        if (zIn === undefined) reasons.push("OPENING_SILL_DEFAULT");
        const want = zIn ?? WIN_SILL_M;
        z = clamp(want, Math.min(WINDOW_MIN_SILL_M, zMax), zMax);
        if (z !== want) reasons.push("OPENING_SILL");
      }
      break;
    }
    default: break;
  }
  const out: ResolvedPlacement = { placeable: true, host, positionM: { x: r6(x), y: r6(y), z: r6(z) }, rotationDeg: yaw, reasons };
  if (wall) out.wall = wall;
  if (corner) out.corner = corner;
  return out;
}

/** The wall a placed transform is flush to (its rotated box touching that wall), or undefined — ties N · S · W · E. */
export function wallOfPlaced(meta: PlacementMeta, t: { positionM: { x: number; y: number }; rotationDeg: number }, room: RoomBox = ROOM_BOX): Wall | undefined {
  const { hx, hy } = halfExtents(meta, t.rotationDeg);
  return WALLS.find((w) => Math.abs(gapTo(w, t.positionM.x, t.positionM.y, hx, hy, room)) <= 1e-6);
}

/** Hosts that live on a wall (the ones a ROTATE / DUPLICATE keeps on the wall they are on). */
export function isWallHost(host: Host): boolean { return host === "WALL" || host === "WALL_OPENING" || host === "DOOR" || host === "CABINET_UNDERSIDE"; }

/** The impossible states, as one predicate the gate and the UI can both ask: is this resolved transform valid for its host? */
export function isValidFor(meta: PlacementMeta, t: { positionM: Vec3; rotationDeg: number }, room: RoomBox = ROOM_BOX): boolean {
  const host = hostOf(meta);
  if (host === "BUILT_IN") return false;
  const h = meta.dimensionsM.height, z = t.positionM.z;
  if (host === "CEILING" && h >= room.heightM) return false;
  if (!fin(t.positionM.x) || !fin(t.positionM.y) || !fin(z) || !fin(t.rotationDeg) || t.rotationDeg < 0 || t.rotationDeg >= 360) return false;
  if (host === "FLOOR" && z !== 0) return false;
  if (host === "CEILING" && Math.abs(z - Math.max(0, room.heightM - h)) > 1e-6) return false;
  if (host === "WALL_OPENING" && !isDoorOpening(meta) && z < Math.min(WINDOW_MIN_SILL_M, Math.max(0, room.heightM - h)) - 1e-6) return false;
  if (z + h > room.heightM + 1e-6 && z > 0) return false;
  const { hx, hy } = halfExtents(meta, t.rotationDeg);
  const inX = 2 * hx > room.widthM ? Math.abs(t.positionM.x - room.widthM / 2) <= 1e-6 : t.positionM.x >= hx - 1e-6 && t.positionM.x <= room.widthM - hx + 1e-6;
  const inY = 2 * hy > room.depthM ? Math.abs(t.positionM.y - room.depthM / 2) <= 1e-6 : t.positionM.y >= hy - 1e-6 && t.positionM.y <= room.depthM - hy + 1e-6;
  if (!inX || !inY) return false;
  if (isWallHost(host) && (wallOfPlaced(meta, t, room) === undefined || t.rotationDeg % 90 !== 0)) return false;
  return true;
}

