/**
 * ARCHITECT-2525 · ASSET DIMENSIONS (Rev A, brief §10) — every asset has a nominal footprint, consumed consistently.
 * =================================================================================================
 * The asset layer AUTHORS in feet (OBJECT_SPEC defaults · VARIANTS · the per-instance PlacedObject.size, all read through
 * footprintOf / heightOf — one source) and CONVERTS AT THE BOUNDARY to the canonical integer-µm convention (umFromFt in
 * canonical/units.ts: round, then §24 safe-int). No render function mixes feet, metres, pixels and world units; the
 * export seam and any engine consumer read dimsUm. These are ILLUSTRATIVE dimensions — they never enter canonical
 * truth (§7): a Space is authored in µm by the Runtime, an asset is projected to µm for portability.
 * Pure, no React.
 */
import { UM_PER_FT, umFromFt, ftFromUm } from "@/lib/architect-2525/canonical/units";
import { footprintOf, heightOf, type ObjectKind, type PlacedObject } from "@/lib/room-objects";

export { UM_PER_FT, umFromFt, ftFromUm };

/** His 3D Asset Starter Pack is authored in METRES (manifest.json `units`); the designer authors feet. One conversion, here. */
export const M_PER_FT = 0.3048;
/** ft → m, rounded at the MICROMETRE (the canonical grain — a millimetre loses 1.5 ft = 457.2 mm; deterministic, replay law). */
export function mFromFt(ft: number): number { return Math.round(ft * M_PER_FT * 1e6) / 1e6; }
/** m → ft (presentation / the PlacedAsset adapter), rounded to 1e-6 ft to kill float noise. */
export function ftFromM(m: number): number { return Math.round((m / M_PER_FT) * 1e6) / 1e6; }

export interface DimsFt { w: number; d: number; h: number }
export interface DimsUm { widthUm: number; depthUm: number; heightUm: number }

/** A kind's default instance (used when no placed object is given). Pure. */
export function defaultInstance(kind: ObjectKind): PlacedObject { return { id: `${kind}-0`, kind, gx: 0, gy: 0, rot: 0 }; }

/** The object-local dimensions (ft) of a kind — of the placed instance when given (size → variant → kind default). */
export function dimsFt(kind: ObjectKind, o?: PlacedObject): DimsFt {
  const obj = o ?? defaultInstance(kind);
  const fp = footprintOf(obj);
  return { w: fp.w, d: fp.d, h: heightOf(obj) };
}

/** His metadata `dimensionsM` {width, depth, height} in metres — converted from the ft defaults ONCE, here. */
export function dimsM(kind: ObjectKind, o?: PlacedObject): { width: number; depth: number; height: number } {
  const f = dimsFt(kind, o);
  return { width: mFromFt(f.w), depth: mFromFt(f.d), height: mFromFt(f.h) };
}

/** The same dimensions as integer µm (the brief's widthUm/depthUm/heightUm) — converted at this boundary only. */
export function dimsUm(kind: ObjectKind, o?: PlacedObject): DimsUm {
  const f = dimsFt(kind, o);
  return { widthUm: umFromFt(f.w), depthUm: umFromFt(f.d), heightUm: umFromFt(f.h) };
}
