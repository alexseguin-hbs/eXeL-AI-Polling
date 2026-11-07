/**
 * ARCHITECT-2525 · ASSET REGISTRY (Rev A) — ONE ASSET REGISTRY · ONE SEMANTIC ELEMENT MODEL · THE WHOLE LIBRARY.
 * =================================================================================================
 * Concept boards by eXeL AI. The registry truth is the operator's COMPLETE 3D asset library (139 real GLBs + metadata +
 * PLAN SVGs — docs/architecture-2525/asset-library/3d-all-assets-2026-11-07, manifest.json + metadata/*.json), carried
 * VERBATIM in the committed, generated library-manifest.ts (source sha recorded; gated against the docs master). Every
 * one of the 139 is a registry entry so the picker lists the full library; the 29 legacy ObjectKinds map onto 27 of them
 * (`kind` back-reference) and the 2 kinds without a library entry (closet rod · shoe rack) are PENDING entries in his
 * grammar. `metadata` is HIS record, verbatim (rotation freeRotation + 15° steps, mounting, snap, dimensionsM, sections,
 * sourcePlacementIds …); rooms · phases · category are DERIVED — from ASSET_PARAMS for a kind, from his `sections` + packs
 * through the documented map in sections.ts otherwise. Paths are his manifest's, relative to ASSET_BASE_URL (the loader
 * slice serves his library verbatim at public/architect-2525/assets). Assets are ILLUSTRATIVE and never enter canonical
 * truth (brief §7 / intake master §27 — gated). Pure data + pure lookups, no React.
 */
import {
  ASSET_PARAMS, OBJECT_KINDS, OBJECT_SPEC, SHAPE_PARTS_LOD, LOD_LEVELS, shapePartsOf, kindByAssetId,
  type AssetCategory, type AssetAuthority, type DimRange, type Lod, type MaterialPreset, type Mounting,
  type ObjectKind, type RoomKey, type ShapePart, type SnapTarget,
} from "@/lib/room-objects";
import { dimsFt, dimsM, dimsUm, ftFromM, umFromFt, type DimsFt, type DimsUm } from "./dimensions";
import { LIBRARY_MANIFEST, LIBRARY_METADATA, LIBRARY_SOURCE, type LibraryManifestEntry, type LibraryMetadata } from "./library-manifest";
import { phaseNamesFor, phasesFor, visibleInPhase, type PhaseName } from "./phase-compatibility";
import { isAssetCompatibleWithRoom, roomNamesOf, ROOM_NAME_BY_KEY } from "./room-compatibility";
import { categoryForSections, roomsForSections } from "./sections";

export { LIBRARY_SOURCE };

/** Where the runtime copy of his library is served from (the loader slice's contract); every path below is relative to it. */
export const ASSET_BASE_URL = "/architect-2525/assets/";

/** The rotation our data model supports today (room-objects Rot) — ⊆ his allowedDegrees for every library asset (gated). */
export const ALLOWED_DEGREES: readonly number[] = [0, 90, 180, 270];

export type ModelStatus = "LIBRARY" | "PENDING";

export interface AssetDef {
  id: string;                         // STABLE identity — his library id (architect2525.asset.<name>.v1)
  aliases: string[];                  // provenance ids (starter pack / rotator) that resolve to this asset
  kind: ObjectKind | null;            // the legacy placeable kind, or null for a library asset the designer cannot place yet
  label: string;                      // his label (a kind keeps OBJECT_SPEC's label as `kindLabel`)
  kindLabel: string | null;
  category: AssetCategory;            // the brief §17 general category (the Asset Library filter)
  rooms: RoomKey[] | "GENERAL";       // room-layout keys (derived)
  roomNames: string[];                // his room taxonomy names, or ["GENERAL"]
  phases: string[];                   // DEV_PHASES ids this asset draws in (derived)
  phaseNames: PhaseName[];            // his phase taxonomy names
  packs: number[];                    // his manifest packs (one entry, many filters — intake master §19)
  sections: string[];                 // his board sections
  mounting: Mounting;                 // his (verbatim); a kind's designer mounting is ASSET_PARAMS[kind].mounting
  snap: SnapTarget[];                 // his (verbatim)
  rotation: { axis: "Z"; allowedDegrees: number[]; freeRotation: boolean }; // his (verbatim); ALLOWED_DEGREES is what the model supports
  authority: AssetAuthority;          // ILLUSTRATIVE | REFERENCE — never verified/engineered/qualified/certified
  lod: Lod;                           // the level this definition is authored at (1 of 5)
  lods: Lod[];                        // the levels with authored parts (L1 today; [] for a library asset without a kind)
  materialPreset: MaterialPreset;
  dimensions: DimsFt;                 // ft — a kind's OBJECT_SPEC default (the designer's truth), else his dimensionsM in ft
  dimensionsM: { width: number; depth: number; height: number }; // his, verbatim (a kind: converted once from the ft default — see metadata for his)
  dimensionsUm: DimsUm;               // the canonical-µm projection of `dimensions`
  params?: { w: DimRange; d: DimRange; h: DimRange }; // adjustable instance ranges (kinds only)
  parts: ShapePart[];                 // the L1 parts (kinds only; [] otherwise)
  onWall: boolean;                    // the legacy wall-snap flag (OBJECT_SPEC for a kind; his mounting === WALL otherwise)
  model: string;                      // models/<stem>.glb, relative to ASSET_BASE_URL
  planSymbol: string;                 // plan/<stem>.svg
  metadataPath: string;               // metadata/<stem>.json
  modelStatus: ModelStatus;           // LIBRARY = a real GLB in his library · PENDING = no entry yet
  metadata: LibraryMetadata;          // HIS metadata, verbatim (a PENDING entry carries a synthesized record, flagged)
}

const SNAPS = new Set<string>(["FLOOR", "WALL", "WALL_BACK", "WALL_CORNER", "WALL_OPENING", "CEILING", "SURFACE", "COUNTERTOP", "CABINET_UNDERSIDE", "CABINET_LINE", "ROOF_LINE", "ROOF_EDGE", "DOOR"]);
const MOUNTS = new Set<string>(["FLOOR", "WALL", "CEILING", "SURFACE", "BUILT_IN"]);
const asMounting = (m: string): Mounting => (MOUNTS.has(m) ? (m as Mounting) : "FLOOR");
const asSnap = (s: readonly string[]): SnapTarget[] => s.filter((x) => SNAPS.has(x)) as SnapTarget[];
const asAuthority = (a: string): AssetAuthority => (a === "REFERENCE" ? "REFERENCE" : "ILLUSTRATIVE");

function fromLibrary(e: LibraryManifestEntry, m: LibraryMetadata): AssetDef {
  const kind = kindByAssetId(e.id) ?? null;
  const p = kind ? ASSET_PARAMS[kind] : null;
  const s = kind ? OBJECT_SPEC[kind] : null;
  const levels = kind ? (SHAPE_PARTS_LOD[kind] ?? {}) : {};
  const rooms = p ? p.rooms : roomsForSections(m.sections);
  const dimensions: DimsFt = kind ? dimsFt(kind) : { w: ftFromM(m.dimensionsM.width), d: ftFromM(m.dimensionsM.depth), h: ftFromM(m.dimensionsM.height) };
  return {
    id: e.id, aliases: p ? [...p.aliases] : [], kind, label: e.label, kindLabel: s ? s.label : null,
    category: p ? p.category : categoryForSections(m.sections),
    rooms, roomNames: rooms === "GENERAL" ? ["GENERAL"] : rooms.map((k) => ROOM_NAME_BY_KEY[k]),
    phases: phasesFor(e.id), phaseNames: phaseNamesFor(e.id),
    packs: [...e.packs], sections: [...m.sections],
    mounting: asMounting(m.mounting), snap: asSnap(m.snap),
    rotation: { axis: "Z", allowedDegrees: [...m.rotation.allowedDegrees], freeRotation: m.rotation.freeRotation },
    authority: p ? p.authority : asAuthority(m.authority), lod: p ? p.lod : 1,
    lods: kind ? LOD_LEVELS.filter((l) => (levels[l]?.length ?? 0) > 0) : [], materialPreset: p ? p.materialPreset : "ARCH_TEAL",
    dimensions, dimensionsM: { ...m.dimensionsM },
    dimensionsUm: { widthUm: umFromFt(dimensions.w), depthUm: umFromFt(dimensions.d), heightUm: umFromFt(dimensions.h) },
    ...(p ? { params: p.params } : {}),
    parts: kind ? shapePartsOf(kind) : [], onWall: s ? s.onWall : m.mounting === "WALL",
    model: e.model, planSymbol: e.planSymbol, metadataPath: e.metadata, modelStatus: "LIBRARY", metadata: m,
  };
}

/** A legacy kind with NO library entry yet (closet rod · shoe rack): a PENDING entry in his grammar, his metadata shape
 *  synthesized from the kind's defaults and flagged (modelQuality "PENDING — no library model"). */
function pendingForKind(kind: ObjectKind): AssetDef {
  const p = ASSET_PARAMS[kind], s = OBJECT_SPEC[kind];
  const m: LibraryMetadata = {
    schemaVersion: "1.0", id: p.id, label: s.label, packs: [...p.packs], sections: [], sourcePlacementIds: [],
    model: `../models/${p.file}.glb`, planSymbol: `../plan/${p.file}.svg`,
    dimensionsM: dimsM(kind), pivot: { origin: "FLOOR_CENTER", axes: "X=width,Y=depth,Z=up" },
    rotation: { axis: "Z", freeRotation: false, allowedDegrees: [...ALLOWED_DEGREES] },
    mounting: p.mounting, snap: [...p.snap], authority: p.authority,
    modelQuality: "PENDING — no library model", materialRule: "Only actual wood uses tan; general geometry cyan/teal with violet accents.",
    rebuildSpec: { preserveSemanticId: true, preservePivotContract: true, preservePlacementContract: true },
  };
  const levels = SHAPE_PARTS_LOD[kind] ?? {};
  const dimensions = dimsFt(kind);
  return {
    id: p.id, aliases: [...p.aliases], kind, label: s.label, kindLabel: s.label, category: p.category,
    rooms: p.rooms, roomNames: roomNamesOf(kind), phases: [...p.phases], phaseNames: phaseNamesFor(kind), packs: [...p.packs], sections: [],
    mounting: p.mounting, snap: [...p.snap], rotation: { axis: "Z", allowedDegrees: [...ALLOWED_DEGREES], freeRotation: false },
    authority: p.authority, lod: p.lod, lods: LOD_LEVELS.filter((l) => (levels[l]?.length ?? 0) > 0), materialPreset: p.materialPreset,
    dimensions, dimensionsM: dimsM(kind), dimensionsUm: dimsUm(kind), params: p.params, parts: shapePartsOf(kind), onWall: s.onWall,
    model: `models/${p.file}.glb`, planSymbol: `plan/${p.file}.svg`, metadataPath: `metadata/${p.file}.json`, modelStatus: "PENDING", metadata: m,
  };
}

/** The registry — every library asset (manifest order) + the PENDING legacy kinds, keyed by stable id. */
export const ASSET_REGISTRY: Record<string, AssetDef> = (() => {
  const out: Record<string, AssetDef> = {};
  for (const e of LIBRARY_MANIFEST) { const m = LIBRARY_METADATA[e.id]; if (m) out[e.id] = fromLibrary(e, m); }
  for (const k of OBJECT_KINDS) if (!ASSET_PARAMS[k].library && !Object.hasOwn(out, ASSET_PARAMS[k].id)) out[ASSET_PARAMS[k].id] = pendingForKind(k);
  return out;
})();
/** Every stable id, registry order (library first, then PENDING kinds). */
export const ASSET_IDS: string[] = Object.keys(ASSET_REGISTRY);
/** How many assets the registry holds (139 library + the PENDING kinds). */
export const ASSET_COUNT = ASSET_IDS.length;
/** How many of them are his library's (have a real GLB). */
export const LIBRARY_COUNT = LIBRARY_MANIFEST.length;
/** kind → id, the map the loader slice and the report read. */
export const ASSET_ID_BY_KIND: Record<ObjectKind, string> = Object.fromEntries(OBJECT_KINDS.map((k) => [k, ASSET_PARAMS[k].id])) as Record<ObjectKind, string>;

/** An asset by its stable id or a provenance alias (own keys only), or undefined. */
export function assetById(id: string): AssetDef | undefined {
  if (Object.hasOwn(ASSET_REGISTRY, id)) return ASSET_REGISTRY[id];
  const k = kindByAssetId(id);
  return k ? ASSET_REGISTRY[ASSET_PARAMS[k].id] : undefined;
}
/** An asset by its placeable kind. */
export function assetByKind(kind: ObjectKind): AssetDef { return ASSET_REGISTRY[ASSET_PARAMS[kind].id]; }
/** His metadata record for an id (or alias), or undefined. */
export function metadataById(id: string): LibraryMetadata | undefined { return assetById(id)?.metadata; }

export interface AssetFilter { room?: RoomKey; phase?: string | null; category?: AssetCategory; pack?: number; section?: string; placeable?: boolean; status?: ModelStatus }
/** The assets matching every given filter (room compatibility · phase projection · category · pack · section · placeable =
 *  has a legacy kind · status), registry order — the picker's BY ROOM · GENERAL · BY PHASE · ALL ASSETS views. */
export function listAssets(f: AssetFilter = {}): AssetDef[] {
  return ASSET_IDS.map((id) => ASSET_REGISTRY[id]).filter((a) =>
    (f.room === undefined || isAssetCompatibleWithRoom(a.id, f.room)) &&
    (f.phase === undefined || visibleInPhase(a.id, f.phase)) &&
    (f.category === undefined || a.category === f.category) &&
    (f.pack === undefined || a.packs.includes(f.pack)) &&
    (f.section === undefined || a.sections.includes(f.section)) &&
    (f.placeable === undefined || (a.kind !== null) === f.placeable) &&
    (f.status === undefined || a.modelStatus === f.status));
}

/** The phases an asset is visible in, straight from the projection. */
export function assetPhases(id: string): string[] { return phasesFor(id); }
