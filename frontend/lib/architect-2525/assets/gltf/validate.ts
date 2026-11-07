/**
 * ARCHITECT-2525 · ASSET MESH VALIDATION (Rev A · 3D asset intake) — the geometry half of intake master §30.
 * =================================================================================================
 * One pure check per asset: the parsed mesh against its metadata contract. ERRORS are the §4 musts (parses — the reader
 * threw otherwise —, nonzero geometry, positive bounds, finite); WARNINGS are the contract drifts the operator wants
 * LISTED with the numbers, never silently failed or silently passed (plan amendment 2026-11-07: "bed_queen bounds
 * z∈[0.15,1.20] and toilet z∈[0.18,0.95] float above Z=0 … window_unit z min −0.02 → NEEDS_REBUILD or metadata offset
 * per the pivot contract (fix the model, never a UI offset)"): a bounds extent off its dimensionsM by more than
 * DIM_TOLERANCE, a FLOOR-mounted asset whose lowest point floats above Z=0, any asset sunk below it, and a triangle
 * count past the per-asset budget. The gate writes these to tests/fixtures/asset-glb-report.json.
 */
import type { AssetMesh } from "./glb-reader";
import { boundsExtents } from "./glb-reader";
import { MAX_TRIS_PER_ASSET } from "../model-cache";

export interface AssetDimsM { width: number; depth: number; height: number }
export interface MeshCheckOptions { tolerance?: number; floatEpsM?: number; sunkEpsM?: number; mounting?: string; maxTris?: number; rawMinZ?: number | null }
export interface MeshCheck {
  id: string;
  triCount: number; meshCount: number;
  extentsM: { w: number; d: number; h: number };
  dimsM: AssetDimsM;
  deviation: { w: number; d: number; h: number };   // (extent − dim) / dim, signed
  minZ: number; maxZ: number;             // WORLD (node matrices applied — what a viewer renders)
  rawMinZ: number | null;                 // the lowest POSITION accessor minimum BEFORE node matrices (ledger reference)
  mounting: string;
  floating: boolean; sunk: boolean; elevatedRaw: boolean; withinTolerance: boolean; overBudget: boolean;
  errors: string[]; warnings: string[];
}

/** |extent − dim| / dim must stay within this (±20%). */
export const DIM_TOLERANCE = 0.2;
/** A FLOOR-mounted asset FLOATS when its lowest point is more than 2 cm above Z = 0 (bed_queen 0.15 · toilet 0.18). */
export const FLOAT_EPS_M = 0.02;
/** Any asset is SUNK when its lowest point is more than 1 cm below Z = 0 (window_unit −0.02). */
export const SUNK_EPS_M = 0.01;
/** @deprecated kept as the float threshold's old name. */
export const FLOOR_EPS_M = FLOAT_EPS_M;

const r3 = (v: number) => Math.round(v * 1000) / 1000;

export function checkAssetMesh(id: string, mesh: AssetMesh, dims: AssetDimsM, opts: MeshCheckOptions = {}): MeshCheck {
  const tol = opts.tolerance ?? DIM_TOLERANCE, floatEps = opts.floatEpsM ?? FLOAT_EPS_M, sunkEps = opts.sunkEpsM ?? SUNK_EPS_M, maxTris = opts.maxTris ?? MAX_TRIS_PER_ASSET;
  const errors: string[] = [], warnings: string[] = [];
  const ext = boundsExtents(mesh.bounds);
  const minZ = mesh.bounds.min[2], maxZ = mesh.bounds.max[2];
  if (mesh.units !== "m") errors.push(`mesh units are ${mesh.units}, the contract is metres`);
  if (mesh.meshCount <= 0) errors.push("meshCount is 0 — no mesh-bearing node");
  if (mesh.triCount <= 0) errors.push("triCount is 0 — no geometry");
  for (const [k, v] of Object.entries(ext)) { if (!Number.isFinite(v)) errors.push(`extent ${k} is not finite`); else if (!(v > 0)) errors.push(`extent ${k} is ${v} (must be > 0)`); }
  for (const [k, v] of Object.entries(dims)) if (!(Number.isFinite(v) && v > 0)) errors.push(`dimensionsM.${k} is ${v} (must be > 0)`);
  const dev = { w: (ext.w - dims.width) / dims.width, d: (ext.d - dims.depth) / dims.depth, h: (ext.h - dims.height) / dims.height };
  const within = Math.abs(dev.w) <= tol && Math.abs(dev.d) <= tol && Math.abs(dev.h) <= tol;
  if (!within) warnings.push(`bounds off dimensionsM by more than ±${Math.round(tol * 100)}%: extents ${r3(ext.w)}×${r3(ext.d)}×${r3(ext.h)} m vs ${dims.width}×${dims.depth}×${dims.height} m (Δ w ${Math.round(dev.w * 100)}% · d ${Math.round(dev.d * 100)}% · h ${Math.round(dev.h * 100)}%)`);
  const mounting = opts.mounting ?? "FLOOR", floorMounted = mounting === "FLOOR";
  const floating = floorMounted && minZ > floatEps;
  const sunk = minZ < -sunkEps;
  if (floating) warnings.push(`floats: lowest point z = ${r3(minZ)} m above the floor (FLOOR-mounted, pivot contract says ≈ 0) — fix the model, never a UI offset`);
  if (sunk) warnings.push(`sunk: lowest point z = ${r3(minZ)} m below the floor`);
  const rawMinZ = typeof opts.rawMinZ === "number" && Number.isFinite(opts.rawMinZ) ? r3(opts.rawMinZ) : null;
  const elevatedRaw = rawMinZ !== null && rawMinZ > floatEps;
  if (elevatedRaw) warnings.push(`raw geometry min z = ${rawMinZ} m before node matrices (world min z = ${r3(minZ)} m) · mounting ${mounting}${floorMounted ? " — VISUAL QA" : ` (expected for ${mounting})`}`);
  const overBudget = mesh.triCount > maxTris;
  if (overBudget) warnings.push(`triangle budget: ${mesh.triCount} > ${maxTris} per asset`);
  return {
    id, triCount: mesh.triCount, meshCount: mesh.meshCount,
    extentsM: { w: r3(ext.w), d: r3(ext.d), h: r3(ext.h) }, dimsM: dims,
    deviation: { w: r3(dev.w), d: r3(dev.d), h: r3(dev.h) },
    minZ: r3(minZ), maxZ: r3(maxZ), rawMinZ, mounting, floating, sunk, elevatedRaw, withinTolerance: within, overBudget, errors, warnings,
  };
}
