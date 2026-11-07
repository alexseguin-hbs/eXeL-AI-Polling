/**
 * ARCHITECT-2525 · MODEL CACHE (Rev A · 3D asset intake) — intake master §24: "load each semantic model once …
 * assetId → model cache → clone / instance. Do not reload the same refrigerator from the network for every placed
 * refrigerator."
 * =================================================================================================
 * One parse per asset id per manifest: the in-flight Promise is memoised, so two instances requested together share
 * ONE fetch + ONE parse and receive the SAME parsed mesh object. Instances never copy geometry into state (§9 — a
 * PlacedAsset is a semantic id + a transform); `instanceTriangles(mesh, placement)` derives one placed instance's
 * world triangles (feet, the room grid) from the shared mesh, pure, on demand. `fetchBytes` is injected so the same
 * cache runs in Node (fs) and in the browser (fetch — see index-runtime.ts).
 *
 * Triangle budget (the plan amendment's "per-asset/per-room triangle budget gate"): MAX_TRIS_PER_ASSET /
 * MAX_TRIS_PER_ROOM. Exceeding one sets a WARN flag — it never throws, never drops an asset; the SVG projector simply
 * gets slower, which the gate makes visible rather than fatal.
 */
import { readGlb, toFeet, transformMesh, type AssetMesh, type AssetTri } from "./gltf/glb-reader";

/** A single asset may carry at most this many triangles before the gate warns (the starter pack peaks at 276). */
export const MAX_TRIS_PER_ASSET = 600;
/** All placed instances in one room may total at most this many before the gate warns (~15 heavy assets). */
export const MAX_TRIS_PER_ROOM = 4000;

export interface AssetManifestEntry { id: string; label: string; category: string; model: string; metadata: string; planSymbol: string; thumbnail?: string }
export interface AssetManifest {
  library: string; version: string;
  coordinateSystem?: string; units?: string; pivotConvention?: string; authorityDefault?: string;
  assets: AssetManifestEntry[];
}
export type FetchBytes = (url: string) => Promise<ArrayBuffer | Uint8Array>;

/** A manifest entry in the pack's key order (id · label · category · model · metadata · planSymbol · thumbnail). Pure. */
export function normalizeManifestEntry(e: AssetManifestEntry): AssetManifestEntry {
  const out: AssetManifestEntry = { id: e.id, label: e.label, category: e.category, model: e.model, metadata: e.metadata, planSymbol: e.planSymbol };
  if (e.thumbnail) out.thumbnail = e.thumbnail;
  return out;
}

/** The entry for an id (own entries only); throws on an unknown id — an unknown asset is a refusal, not a blank. */
export function manifestEntry(manifest: AssetManifest, assetId: string): AssetManifestEntry {
  const e = manifest.assets.find((a) => a.id === assetId);
  if (!e) throw new Error(`ASSET: unknown asset id ${assetId}`);
  return e;
}

/** `${baseUrl}/${entry.model}` with the pack's relative "models/x.glb" (a leading "./" or "/" stripped). */
export function modelUrl(manifest: AssetManifest, assetId: string, baseUrl = ""): string {
  const rel = manifestEntry(manifest, assetId).model.replace(/^\.?\//, "");
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/${rel}` : rel;
}

export interface ModelCache {
  /** The parsed METRES mesh — one fetch + one parse per id, concurrent callers share the in-flight promise. */
  get(assetId: string): Promise<AssetMesh>;
  /** The same mesh in FEET (the room grid), converted once per id and memoised. */
  getFt(assetId: string): Promise<AssetMesh>;
  has(assetId: string): boolean;
  readonly size: number;
  /** How many GLB parses have run — the performance gate (§30) asserts 1 for N instances of one id. */
  readonly parseCount: number;
  /** How many fetches have run. */
  readonly fetchCount: number;
  clear(): void;
}

export function createModelCache(manifest: AssetManifest, fetchBytes: FetchBytes, baseUrl = ""): ModelCache {
  const meshes = new Map<string, Promise<AssetMesh>>();
  const feet = new Map<string, Promise<AssetMesh>>();
  let parses = 0, fetches = 0;
  const get = (assetId: string): Promise<AssetMesh> => {
    let p = meshes.get(assetId);
    if (!p) {
      let url: string;
      try { url = modelUrl(manifest, assetId, baseUrl); } catch (e) { return Promise.reject(e); }   // an unknown id REJECTS (never a sync throw into an await chain)
      fetches++;
      p = fetchBytes(url).then((bytes) => { parses++; return readGlb(bytes); });
      p.catch(() => meshes.delete(assetId));               // a failed load is not cached — the next call retries
      meshes.set(assetId, p);
    }
    return p;
  };
  const getFt = (assetId: string): Promise<AssetMesh> => {
    let p = feet.get(assetId);
    if (!p) { p = get(assetId).then(toFeet); p.catch(() => feet.delete(assetId)); feet.set(assetId, p); }
    return p;
  };
  return {
    get, getFt,
    has: (id) => meshes.has(id),
    get size() { return meshes.size; },
    get parseCount() { return parses; },
    get fetchCount() { return fetches; },
    clear() { meshes.clear(); feet.clear(); },
  };
}

// ── the module-level memo: one cache per manifest object (the runtime holds one manifest; a test may hold several) ──
const caches = new WeakMap<AssetManifest, ModelCache>();

/** The memoised parsed mesh for an id (metres). `fetchBytes`/`baseUrl` are bound the first time a manifest is seen. */
export function getAssetMesh(assetId: string, manifest: AssetManifest, fetchBytes: FetchBytes, baseUrl = ""): Promise<AssetMesh> {
  let c = caches.get(manifest);
  if (!c) { c = createModelCache(manifest, fetchBytes, baseUrl); caches.set(manifest, c); }
  return c.get(assetId);
}
/** The cache bound to a manifest, if one exists (for the gate's parseCount). */
export function cacheFor(manifest: AssetManifest): ModelCache | undefined { return caches.get(manifest); }
/** Forget a manifest's cache (tests). */
export function resetModelCache(manifest: AssetManifest): void { caches.delete(manifest); }

/** A placed instance (intake master §9 — semantic id + transform, never geometry), in FEET on the room grid. */
export interface PlacedAssetFt { instanceId?: string; assetId: string; x: number; y: number; z: number; rotationDeg: number }

/** One placed instance's world triangles (feet): the shared mesh (converted to feet if still metres) yawed about its
 *  floor-centre pivot and translated to the placement. Pure — the cached mesh is never mutated. */
export function instanceTriangles(mesh: AssetMesh, placement: { x: number; y: number; z: number; rotationDeg?: number }): AssetTri[] {
  const ft = mesh.units === "m" ? toFeet(mesh) : mesh;
  return transformMesh(ft, { x: placement.x, y: placement.y, z: placement.z }, placement.rotationDeg ?? 0).triangles;
}

export interface TriBudget {
  assetTris: number[];   // per instance, as given
  roomTris: number;      // the sum
  assetOver: boolean;    // any single instance past MAX_TRIS_PER_ASSET
  roomOver: boolean;     // the room total past MAX_TRIS_PER_ROOM
  warnings: string[];
}

/** The budget check — a WARN flag, never a throw. `counts` is the triCount of each placed instance in the room. */
export function checkTriBudget(counts: number[], limits: { perAsset?: number; perRoom?: number } = {}): TriBudget {
  const perAsset = limits.perAsset ?? MAX_TRIS_PER_ASSET, perRoom = limits.perRoom ?? MAX_TRIS_PER_ROOM;
  const safe = counts.map((n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0));
  const roomTris = safe.reduce((s, n) => s + n, 0);
  const warnings: string[] = [];
  safe.forEach((n, i) => { if (n > perAsset) warnings.push(`instance ${i}: ${n} triangles > ${perAsset} per asset`); });
  if (roomTris > perRoom) warnings.push(`room: ${roomTris} triangles > ${perRoom} per room`);
  return { assetTris: safe, roomTris, assetOver: safe.some((n) => n > perAsset), roomOver: roomTris > perRoom, warnings };
}
