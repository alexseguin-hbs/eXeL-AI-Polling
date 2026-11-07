/**
 * ARCHITECT-2525 · ASSET RUNTIME ENTRY (Rev A · 3D asset intake) — the ONE browser entry the walk calls later.
 * =================================================================================================
 * `loadAssetMeshFt(assetId)` → the asset's triangles in FEET (the room grid), fetched from the served library at
 * /architect-2525/assets (public/architect-2525/assets — manifest.json + models/*.glb) through the model cache: the
 * manifest is fetched once, each GLB is fetched + parsed once, every placed instance of an id shares the parsed mesh
 * and derives its own transform with `instanceTriangles`. Nothing runs at import time (no fetch, no DOM), so this module
 * is safe in Node; `fetch` is touched only inside the async calls. No React component is wired here — a later slice
 * calls `loadAssetMeshFt` + `meshToFaces` and pushes the faces into the walk's existing solidFaces() pass.
 */
import type { AssetMesh } from "./gltf/glb-reader";
import { createModelCache, instanceTriangles, type AssetManifest, type ModelCache } from "./model-cache";

export { instanceTriangles };
export { meshToFaces } from "./gltf/to-quads";
export type { AssetMesh, AssetTri } from "./gltf/glb-reader";
export type { AssetManifest, AssetManifestEntry, PlacedAssetFt } from "./model-cache";

/** Where the runtime library is served (public/architect-2525/assets). */
export const ASSET_BASE_URL = "/architect-2525/assets";
export const ASSET_MANIFEST_URL = `${ASSET_BASE_URL}/manifest.json`;

let manifestP: Promise<AssetManifest> | null = null;
let cache: ModelCache | null = null;

const fetchBytes = async (url: string): Promise<ArrayBuffer> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ASSET: fetch ${r.status} for ${url}`);
  return r.arrayBuffer();
};

/** The served manifest, fetched once per page. */
export function loadAssetManifest(): Promise<AssetManifest> {
  if (!manifestP) {
    manifestP = fetch(ASSET_MANIFEST_URL).then(async (r) => {
      if (!r.ok) throw new Error(`ASSET: manifest fetch ${r.status}`);
      const m = (await r.json()) as AssetManifest;
      if (!m || !Array.isArray(m.assets)) throw new Error("ASSET: manifest has no assets[]");
      return m;
    });
    manifestP.catch(() => { manifestP = null; });   // a failed fetch is retried on the next call
  }
  return manifestP;
}

/** The runtime's model cache (bound to the served manifest), created on first use. */
export async function assetCache(): Promise<ModelCache> {
  const manifest = await loadAssetManifest();
  if (!cache) cache = createModelCache(manifest, fetchBytes, ASSET_BASE_URL);
  return cache;
}

/** The asset's parsed mesh in FEET — one network fetch + one parse per id for the life of the page. */
export async function loadAssetMeshFt(assetId: string): Promise<AssetMesh> {
  return (await assetCache()).getFt(assetId);
}

/** Forget the page-level manifest + cache (tests / hot reload). */
export function resetRuntimeAssets(): void { manifestP = null; cache = null; }
