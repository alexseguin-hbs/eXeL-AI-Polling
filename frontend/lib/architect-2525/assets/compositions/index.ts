/**
 * ARCHITECT-2525 · ASSET COMPOSITIONS (Rev A · 3D asset intake) — the REBUILD PATH. The served library
 * (public/architect-2525/assets) is the operator's complete 139-asset library VERBATIM (concept + library by eXeL AI;
 * his rule: "DO NOT REMODEL unless necessary — ingest, preserve ids"). When a rebuild IS necessary, a composition
 * authored here compiles through the pure in-repo GLB writer (scripts/architect-assets-build.mjs) into his exact layout
 * and contracts — models/<file>.glb · metadata/<file>.json · plan/<file>.svg · a manifest row — so the rebuilt file
 * replaces his under the SAME semantic id (the id is law), the floor-centre pivot, metres, mounting/snap, PLAN linkage
 * and ILLUSTRATIVE authority preserved (docs/CLAUDE_CODE_INTAKE.md).
 *
 * A composition is primitives (box · cyl · sphere · torus — glb-writer partMesh) in METRES in his frame (X width ·
 * Y depth · Z up · origin FLOOR-CENTRE), each `size` = full extents, `center` = the part's centre, optional
 * rotX/rotY/rotZ about that centre, and a MATERIAL ROLE. The operator's 126 rotator families compile through
 * `writeGlbFromComposition`. Roles → the ONE palette (../materials.ts): ARCH_TEAL (body) · EDGE (bright cyan) · ACCENT
 * (purple) · GLASS (translucent) · SCREEN (dark navy) · WOOD (FRAME_COLOR — ONLY WOOD IS TAN) · the semantic roles
 * ELECTRICAL · WATER · HOT_WATER · SEWER · AIR · SECURITY_ALERT. No colour literal lives here.
 */
import { ARCH_EDGE, MATERIALS, SEMANTIC } from "../materials";
import { hexToBaseColor, partMesh, rawMeshBounds, writeGlb, GLB_GENERATOR, type PartKind, type V3Like, type WriteGlbInput, type WriterMaterial } from "../gltf/glb-writer";

export const M_PER_IN = 0.0254;
export const M_PER_FT = 0.3048;
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

export type MaterialRole = "ARCH_TEAL" | "EDGE" | "ACCENT" | "GLASS" | "SCREEN" | "WOOD" | "ELECTRICAL" | "WATER" | "HOT_WATER" | "SEWER" | "AIR" | "SECURITY_ALERT";
export const MATERIAL_ROLES: readonly MaterialRole[] = ["ARCH_TEAL", "EDGE", "ACCENT", "GLASS", "SCREEN", "WOOD", "ELECTRICAL", "WATER", "HOT_WATER", "SEWER", "AIR", "SECURITY_ALERT"];

/** A role's fill + opacity, from the one palette. */
export function roleColor(role: MaterialRole): { fill: string; opacity: number } {
  switch (role) {
    case "ARCH_TEAL": return { fill: MATERIALS.ARCH_TEAL.fill, opacity: MATERIALS.ARCH_TEAL.opacity };
    case "EDGE": return { fill: ARCH_EDGE, opacity: 1 };
    case "ACCENT": return { fill: MATERIALS.ARCH_ACCENT.fill, opacity: MATERIALS.ARCH_ACCENT.opacity };
    case "GLASS": return { fill: MATERIALS.GLASS.fill, opacity: MATERIALS.GLASS.opacity };
    case "SCREEN": return { fill: MATERIALS.SCREEN.fill, opacity: MATERIALS.SCREEN.opacity };
    case "WOOD": return { fill: MATERIALS.WOOD.fill, opacity: MATERIALS.WOOD.opacity };
    case "ELECTRICAL": return { fill: SEMANTIC.ELECTRICAL, opacity: 1 };
    case "WATER": return { fill: SEMANTIC.WATER, opacity: 1 };
    case "HOT_WATER": return { fill: SEMANTIC.HOT_WATER, opacity: 1 };
    case "SEWER": return { fill: SEMANTIC.SEWER, opacity: 1 };
    case "AIR": return { fill: SEMANTIC.AIR, opacity: 1 };
    case "SECURITY_ALERT": return { fill: SEMANTIC.SECURITY_ALERT, opacity: 1 };
  }
}

/** The glTF material for a role (its name IS the role, so a reader can recover the semantics). */
export function materialForRole(role: MaterialRole): WriterMaterial {
  if (!MATERIAL_ROLES.includes(role)) throw new Error(`COMPOSITION: unknown material role ${String(role)}`);
  const { fill, opacity } = roleColor(role);
  return { name: role, baseColorFactor: hexToBaseColor(fill, opacity), alphaMode: opacity < 1 ? "BLEND" : "OPAQUE", metallicFactor: 0, roughnessFactor: 0.5 };
}

export interface CompositionPart {
  kind: PartKind;
  size: [number, number, number];     // full extents w × d × h, metres
  center: [number, number, number];   // the part's centre, metres (Z-up, floor-centre origin)
  rotX?: number; rotY?: number; rotZ?: number;   // degrees, about the part's centre, applied X → Y → Z
  material: MaterialRole;
  name?: string;
  segments?: number;
}
export interface Composition {
  id: string;                  // his scheme: architect2525.asset.<slug segments>.v<n> — law
  file: string;                // models/<file>.glb · metadata/<file>.json · plan/<file>.svg · thumbs/<file>.png
  label: string;
  packs: number[];             // intake master §18 pack numbers
  sections?: string[];         // his board sections
  sourcePlacementIds?: string[];
  dimensionsM: { width: number; depth: number; height: number };
  mounting: "FLOOR" | "WALL" | "CEILING" | "SURFACE" | "BUILT_IN";
  snap: string[];
  rotation: { axis: "Z"; freeRotation: boolean; allowedDegrees: number[] };
  authority: "ILLUSTRATIVE";
  parts: CompositionPart[];
  notes?: string;
}

/** His file-name rule: the id minus the `architect2525.asset.` prefix and the version, dots → '-'. */
export function fileForId(id: string): string {
  const m = /^architect2525\.asset\.((?:[a-z0-9_]+\.)*[a-z0-9_]+)\.v\d+$/.exec(id);
  if (!m) throw new Error(`ASSET: malformed id ${id} (expected architect2525.asset.<segments…>.v<n>)`);
  return m[1].replace(/\./g, "-");
}

export const MODEL_QUALITY = "browser-lightweight procedural composition (architect-2525/assets-build)";
export const MATERIAL_RULE = "Only actual wood uses tan; general geometry cyan/teal with violet accents.";

/** The metadata record for a composition in HIS exact shape and key order (schemaVersion · id · label · packs · sections ·
 *  sourcePlacementIds · model · planSymbol · dimensionsM · pivot · rotation · mounting · snap · authority · modelQuality ·
 *  materialRule · rebuildSpec), paths relative to metadata/ as his are. Pure, no timestamps. */
export function compositionMetadata(c: Composition): Record<string, unknown> {
  return {
    schemaVersion: "1.0",
    id: c.id,
    label: c.label,
    packs: [...c.packs],
    sections: [...(c.sections ?? [])],
    sourcePlacementIds: [...(c.sourcePlacementIds ?? [])],
    model: `../models/${c.file}.glb`,
    planSymbol: `../plan/${c.file}.svg`,
    dimensionsM: { width: c.dimensionsM.width, depth: c.dimensionsM.depth, height: c.dimensionsM.height },
    pivot: { origin: "FLOOR_CENTER", axes: "X=width,Y=depth,Z=up" },
    rotation: { axis: c.rotation.axis, freeRotation: c.rotation.freeRotation, allowedDegrees: [...c.rotation.allowedDegrees] },
    mounting: c.mounting,
    snap: [...c.snap],
    authority: c.authority,
    modelQuality: MODEL_QUALITY,
    materialRule: MATERIAL_RULE,
    rebuildSpec: {
      preserveSemanticId: true,
      preservePivotContract: true,
      preservePlacementContract: true,
      generator: `lib/architect-2525/assets/compositions/index.ts::${c.id}`,
      notes: c.notes ?? "L1 primitive composition. Rebuild or replace the geometry while preserving id, dimensions contract, floor-centre pivot, mounting and metadata.",
    },
  };
}

/** The manifest row for a composition in HIS row shape (id · label · packs · model · metadata · planSymbol). Pure. */
export function compositionManifestEntry(c: Composition): { id: string; label: string; packs: number[]; model: string; metadata: string; planSymbol: string } {
  return { id: c.id, label: c.label, packs: [...c.packs], model: `models/${c.file}.glb`, metadata: `metadata/${c.file}.json`, planSymbol: `plan/${c.file}.svg` };
}

// ── the writer path ──
/** The writer input for a composition: every part → its primitive mesh (rotated, placed); the materials = the distinct
 *  roles used, first-use order. Pure. */
export function compositionGlbInput(c: Composition): WriteGlbInput {
  const roles: MaterialRole[] = [];
  for (const p of c.parts) if (!roles.includes(p.material)) roles.push(p.material);
  return {
    parts: c.parts.map((p, i) => ({ name: p.name ?? `${p.kind}_${i}`, material: p.material, mesh: partMesh(p) })),
    materials: roles.map(materialForRole),
    generator: GLB_GENERATOR,
    rootName: "world",
  };
}
/** Composition → GLB bytes. */
export function writeGlbFromComposition(c: Composition): Uint8Array { return writeGlb(compositionGlbInput(c)); }

/** The expected whole-asset bounds of a composition (the union of its placed part meshes) — the round-trip gate
 *  compares the parsed GLB against this. Pure. */
export function compositionBounds(c: Composition): { min: V3Like; max: V3Like } {
  const min: V3Like = [Infinity, Infinity, Infinity], max: V3Like = [-Infinity, -Infinity, -Infinity];
  for (const p of c.parts) {
    const b = rawMeshBounds(partMesh(p));
    for (let i = 0; i < 3; i++) { if (b.min[i] < min[i]) min[i] = b.min[i]; if (b.max[i] > max[i]) max[i] = b.max[i]; }
  }
  return { min, max };
}
/** Triangle count the composition compiles to. */
export function compositionTriCount(c: Composition): number { return c.parts.reduce((s, p) => s + partMesh(p).indices.length / 3, 0); }

// ── authored compositions (the rebuild path's examples — NOT in the served library, which is his verbatim) ──
const STUD_W = r4(1.5 * M_PER_IN), STUD_D = r4(3.5 * M_PER_IN), STUD_H = r4(8 * M_PER_FT);

/** The example `architect2525.asset.stud.2x4.v1`: a nominal 2×4 stud, actual 1½″ × 3½″ × 8′ (the SPF lumber the Framing
 *  phase draws), standing on the floor, its footprint centred on the origin — WOOD, because a stud IS wood. */
export const STUD_2X4: Composition = {
  id: "architect2525.asset.stud.2x4.v1",
  file: "stud-2x4",
  label: "Stud 2×4 (8 ft)",
  packs: [1],
  sections: ["Shell & Structure"],
  dimensionsM: { width: STUD_W, depth: STUD_D, height: STUD_H },
  mounting: "FLOOR",
  snap: ["FLOOR", "WALL"],
  rotation: { axis: "Z", freeRotation: false, allowedDegrees: [0, 90, 180, 270] },
  authority: "ILLUSTRATIVE",
  parts: [{ kind: "box", name: "stud", size: [STUD_W, STUD_D, STUD_H], center: [0, 0, r4(STUD_H / 2)], material: "WOOD" }],
  notes: "Example L1 box composition of a nominal 2×4 stud (actual 1.5 in × 3.5 in × 8 ft) — the rebuild path's proof, not a served asset.",
};

/** Every authored composition, sorted by id (the build is deterministic). */
export const COMPOSITIONS: Composition[] = [STUD_2X4].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
