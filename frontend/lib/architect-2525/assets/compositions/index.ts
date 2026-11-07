/**
 * ARCHITECT-2525 · ASSET COMPOSITIONS (Rev A · 3D asset intake) — authored part compositions the build compiles to REAL
 * .glb files (+ metadata.json + plan.svg + thumbnail + manifest entry) through the pure in-repo GLB writer.
 * =================================================================================================
 * A composition is the L1-fidelity source of one semantic asset: boxes in METRES in the pack's frame (X width · Y depth ·
 * Z up · origin FLOOR-CENTRE), each with a named material. Higher fidelity replaces the parts, never the id (the id is
 * law). ONLY WOOD IS TAN: a wood material reads MATERIALS.WOOD.fill (FRAME_COLOR, the walk's framing tan — ONE source);
 * every other colour is a MATERIALS preset too. No colour literal lives here.
 *
 * One example today — the placeholder `structure.stud.2x4.v1`: a nominal 2×4 stud, actual 1½" × 3½" × 8' (the SPF
 * dimensional lumber the Framing phase draws), standing on the floor, its footprint centred on the origin.
 */
import { MATERIALS } from "../materials";
import { hexToBaseColor, type BoxM, type WriteGlbInput, type WriterMaterial, GLB_GENERATOR } from "../gltf/glb-writer";

export const M_PER_IN = 0.0254;
export const M_PER_FT = 0.3048;
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

export interface CompositionPart { name: string; material: string; box: BoxM }
export interface Composition {
  id: string;                  // the semantic id — law
  file: string;                // models/<file>.glb · metadata/<file>.json · plan/<file>.svg · thumbs/<file>.png
  label: string;
  category: string;
  dimensionsM: { width: number; depth: number; height: number };
  mounting: "FLOOR" | "WALL" | "CEILING" | "SURFACE" | "BUILT_IN";
  snap: string[];
  rotation: { axis: "Z"; allowedDegrees: number[]; freeRotation: boolean };
  authority: "ILLUSTRATIVE";
  rooms: string[];
  phaseCompatibility: string[];
  placement: { collisionFootprint: "BOUNDING_BOX_XY"; allowTranslate: boolean; allowRotate: boolean; allowScale: boolean };
  materials: WriterMaterial[];
  parts: CompositionPart[];
  notes: string;
}

const STUD_W = r4(1.5 * M_PER_IN), STUD_D = r4(3.5 * M_PER_IN), STUD_H = r4(8 * M_PER_FT);

export const STUD_2X4: Composition = {
  id: "structure.stud.2x4.v1",
  file: "stud_2x4",
  label: "Stud 2×4 (8 ft)",
  category: "STRUCTURE",
  dimensionsM: { width: STUD_W, depth: STUD_D, height: STUD_H },
  mounting: "FLOOR",
  snap: ["FLOOR", "WALL"],
  rotation: { axis: "Z", allowedDegrees: [0, 90, 180, 270], freeRotation: false },
  authority: "ILLUSTRATIVE",
  rooms: ["ANY"],
  phaseCompatibility: ["FRAMING"],
  placement: { collisionFootprint: "BOUNDING_BOX_XY", allowTranslate: true, allowRotate: true, allowScale: false },
  materials: [{ name: "wood", baseColorFactor: hexToBaseColor(MATERIALS.WOOD.fill), roughnessFactor: 0.6, metallicFactor: 0 }],
  parts: [{ name: "stud", material: "wood", box: { x: -STUD_W / 2, y: -STUD_D / 2, z: 0, w: STUD_W, d: STUD_D, h: STUD_H } }],
  notes: "Placeholder L1 box composition of a nominal 2×4 stud (actual 1.5 in × 3.5 in × 8 ft). Rebuild or replace the geometry while preserving id, dimensions contract, floor-centre pivot, mounting and metadata.",
};

/** Every authored composition, in build order (sorted by id — the build is deterministic). */
export const COMPOSITIONS: Composition[] = [STUD_2X4].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** The writer input for a composition (parts → nodes, materials → pbr, generator stamped). Pure. */
export function compositionGlbInput(c: Composition): WriteGlbInput {
  return { parts: c.parts.map((p) => ({ name: p.name, material: p.material, box: p.box })), materials: c.materials, generator: GLB_GENERATOR, rootName: "world" };
}

/** The pack-schema metadata record for a composition, in the starter pack's exact key order. Pure, no timestamps. */
export function compositionMetadata(c: Composition): Record<string, unknown> {
  return {
    schemaVersion: "1.0",
    id: c.id,
    label: c.label,
    category: c.category,
    model: `../models/${c.file}.glb`,
    planSymbol: `../plan/${c.file}.svg`,
    dimensionsM: { width: c.dimensionsM.width, depth: c.dimensionsM.depth, height: c.dimensionsM.height },
    pivot: { origin: "FLOOR_CENTER", axes: "X=width,Y=depth,Z=up" },
    rotation: { axis: c.rotation.axis, allowedDegrees: [...c.rotation.allowedDegrees], freeRotation: c.rotation.freeRotation },
    mounting: c.mounting,
    snap: [...c.snap],
    authority: c.authority,
    rooms: [...c.rooms],
    phaseCompatibility: [...c.phaseCompatibility],
    placement: { ...c.placement },
    rebuildSpec: {
      generator: `lib/architect-2525/assets/compositions/index.ts::${c.id}`,
      targetLOD: "browser-lightweight",
      sourceReference: "Architect-2525 asset compositions (concept + starter pack by eXeL AI)",
      notes: c.notes,
    },
  };
}

/** The manifest entry for a composition (the pack's key order; the thumbnail is added by the thumbs build). Pure. */
export function compositionManifestEntry(c: Composition): { id: string; label: string; category: string; model: string; metadata: string; planSymbol: string } {
  return { id: c.id, label: c.label, category: c.category, model: `models/${c.file}.glb`, metadata: `metadata/${c.file}.json`, planSymbol: `plan/${c.file}.svg` };
}

/** The expected whole-asset bounds of a composition (the union of its boxes) — the round-trip gate compares the parsed
 *  GLB against this. Pure. */
export function compositionBounds(c: Composition): { min: [number, number, number]; max: [number, number, number] } {
  const min: [number, number, number] = [Infinity, Infinity, Infinity], max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of c.parts) {
    const b = p.box;
    const lo = [b.x, b.y, b.z], hi = [b.x + b.w, b.y + b.d, b.z + b.h];
    for (let i = 0; i < 3; i++) { if (lo[i] < min[i]) min[i] = lo[i]; if (hi[i] > max[i]) max[i] = hi[i]; }
  }
  return { min, max };
}
