/**
 * ARCHITECT-2525 · HOUSE SEED (Phase 0, operator 2026-11-08: "House does not have any of 139 objects; fix first").
 * =================================================================================================
 * The default 3×3 house must CONTAIN the operator's whole library: every one of the 139 real GLB assets is placed into a
 * compatible room, so walking/▦-viewing the house shows his assets, not a near-empty box house. This is the illustrative
 * furnishing layer — it sets RoomCell.objects (the designer's own store); it never touches canonical truth (900 ft², the
 * project hash, the R-CORE revision). A legacy kind keeps its kind (so the 29 render + edit exactly as before); the other
 * 110 ride the Rev A' `assetId` carrier (kind "asset" + the library dims on `size`), which footprintOf/heightOf read.
 *
 * ONE allocation, deterministic (no clock / no RNG — replay law): library assets in manifest order, each placed into the
 * first of its compatible rooms (AssetDef.rooms, or every room for GENERAL) that still has floor, else any room with space,
 * via the SAME greedy occupancy-grid packer the room designer uses (biggest footprint first, first-fit top-left, the one
 * centre-of-cell convention). Gated: all 139 land (tests/architect-house-seed.test.mjs). Pure; imports the registry (which
 * imports room-objects) + room-objects types — a leaf consumer, no cycle.
 */
import { ASSET_IDS, ASSET_REGISTRY, ASSET_ID_BY_KIND, type AssetDef } from "./registry";
import { ROOM_GRID, ROOM_KEYS, kindByAssetId, type ObjectKind, type PlacedObject, type RoomKey } from "@/lib/room-objects";

const N = ROOM_GRID;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** The 139 library assets (real GLB), manifest order — the PENDING kinds (closet rod · shoe rack) are excluded. */
function libraryDefs(): AssetDef[] {
  return ASSET_IDS.map((id) => ASSET_REGISTRY[id]).filter((a) => a.modelStatus === "LIBRARY");
}

/** The rooms an asset may seed into: its compatible room keys, or every room when GENERAL. */
function candidateRooms(a: AssetDef): RoomKey[] {
  return a.rooms === "GENERAL" ? [...ROOM_KEYS] : a.rooms;
}

/** A placed object for a library asset — its legacy kind when it has one (renders/edits as today), else the `asset`
 *  carrier with the library dims on `size` so footprintOf/heightOf return the real GLB footprint. */
function placedFor(a: AssetDef, roomKey: string, _seq: number, gx: number, gy: number): PlacedObject {
  const kind = kindByAssetId(a.id);
  const id = `${roomKey}-${a.id.replace(/[^a-z0-9]+/gi, "-")}`;   // each library id is placed once → globally-unique object id
  return kind
    ? { id, kind, gx, gy, rot: 0 }
    : { id, kind: "asset", assetId: a.id, size: { w: a.dimensions.w, d: a.dimensions.d, h: a.dimensions.h }, gx, gy, rot: 0 };
}

interface Grid { occ: boolean[][]; objs: PlacedObject[]; seq: number }
const newGrid = (): Grid => ({ occ: Array.from({ length: N }, () => new Array<boolean>(N).fill(false)), objs: [], seq: 0 });
const footW = (a: AssetDef) => Math.max(1, Math.min(N, Math.ceil(a.dimensions.w)));
const footD = (a: AssetDef) => Math.max(1, Math.min(N, Math.ceil(a.dimensions.d)));

/** Try to first-fit `a` into `g`; returns true and records it, or false when no free block fits. */
function tryPlace(g: Grid, a: AssetDef, roomKey: string): boolean {
  const w = footW(a), d = footD(a);
  for (let y = 0; y <= N - d; y++) for (let x = 0; x <= N - w; x++) {
    let free = true;
    for (let j = y; j < y + d && free; j++) for (let i = x; i < x + w; i++) if (g.occ[j][i]) { free = false; break; }
    if (!free) continue;
    g.objs.push(placedFor(a, roomKey, ++g.seq, r2(x + a.dimensions.w / 2 - 0.5), r2(y + a.dimensions.d / 2 - 0.5)));
    for (let j = y; j < y + d; j++) for (let i = x; i < x + w; i++) g.occ[j][i] = true;
    return true;
  }
  return false;
}

/** An asset's phase bucket — its first dev-phase id (furniture → interior, MEP → electrical/plumbing/hvac, structure →
 *  framing/shell, site → exterior/site…). Grids are per (room, bucket): the renderers phase-filter, so assets in different
 *  phases never collide and the whole 139 fit across phases without overlapping in any single view. */
const bucketOf = (a: AssetDef): string => a.phases[0] ?? "interior";

let MEMO: Record<string, PlacedObject[]> | null = null;

/** The full allocation: every library asset placed into one room, packed PER (room, phase-bucket). Deterministic; memoised. */
function allocate(): Record<string, PlacedObject[]> {
  if (MEMO) return MEMO;
  const grids = new Map<string, Grid>();                                   // key = `${roomKey}|${bucket}`
  const gridFor = (k: string, b: string): Grid => { const key = `${k}|${b}`; let g = grids.get(key); if (!g) { g = newGrid(); grids.set(key, g); } return g; };
  // biggest footprints first so small items gap-fill; ties keep manifest order (deterministic).
  const defs = libraryDefs().sort((p, q) => (footW(q) * footD(q) - footW(p) * footD(p)) || (ASSET_IDS.indexOf(p.id) - ASSET_IDS.indexOf(q.id)));
  const byLoad = (b: string, ks: readonly RoomKey[]) => ks.slice().sort((k1, k2) => (gridFor(k1, b).objs.length - gridFor(k2, b).objs.length) || ROOM_KEYS.indexOf(k1) - ROOM_KEYS.indexOf(k2));
  for (const a of defs) {
    const b = bucketOf(a);
    let placed = false;
    for (const k of byLoad(b, candidateRooms(a))) { if (tryPlace(gridFor(k, b), a, k)) { placed = true; break; } }   // the LEAST-full compatible room (load-balanced, deterministic)
    if (!placed) for (const k of byLoad(b, ROOM_KEYS)) { if (tryPlace(gridFor(k, b), a, k)) { placed = true; break; } } // else the least-full room anywhere
    // if still not placed the whole house's bucket is at capacity — the gate flags it; never silently dropped unnoticed.
  }
  const out: Record<string, PlacedObject[]> = Object.fromEntries(ROOM_KEYS.map((k) => [k, [] as PlacedObject[]]));
  for (const [key, g] of grids) { const k = key.split("|")[0]; out[k].push(...g.objs); }
  MEMO = out;
  return MEMO;
}

/** The seeded library objects for one room key (a fresh copy). The default house's furnishing from the 139. */
export function seededObjectsForRoom(roomKey: string): PlacedObject[] {
  const a = allocate(); return (a[roomKey] ?? []).map((o) => ({ ...o }));
}

/** How many of the 139 the allocation placed across the house (the gate + the status metric "visible: X/139"). */
export function seededAssetCount(): number {
  const a = allocate(); return ROOM_KEYS.reduce((s, k) => s + a[k].length, 0);
}

/** Every library id that landed in the house (for the coverage gate — must equal all 139). A carrier object names its
 *  library id on `assetId`; a legacy-kind object resolves through ASSET_ID_BY_KIND. */
export function seededAssetIds(): string[] {
  const a = allocate(); const ids: string[] = [];
  for (const k of ROOM_KEYS) for (const o of a[k]) ids.push(o.assetId ?? ASSET_ID_BY_KIND[o.kind as ObjectKind]);
  return ids;
}

/** Populate a room layout's `objects` with the seeded 139 (only rooms that have none yet — a user's saved objects win).
 *  Returns a new layout; never mutates. The renderers already read `room.objects ?? defaultObjectsForRoom`. */
export function seedHouseFromLibrary<T extends { k: string; objects?: PlacedObject[] }>(layout: T[]): T[] {
  return layout.map((r) => (r.objects && r.objects.length > 0 ? r : { ...r, objects: seededObjectsForRoom(r.k) }));
}
