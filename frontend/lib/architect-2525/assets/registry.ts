/**
 * ARCHITECT-2525 · ASSET REGISTRY (Rev A) — ONE ASSET REGISTRY · ONE SEMANTIC ELEMENT MODEL.
 * =================================================================================================
 * Concept boards by eXeL AI (the operator's asset boards, docs/asks/img/2026.11.07_architect2525_*_board.png) are the
 * reference every entry is authored against — visual SPECIFICATIONS, never rasters pasted into the product. The
 * semantic-id scheme and the metadata contract are FIXED by his 3D Asset Starter Pack
 * (docs/architecture-2525/asset-library/3d-starter-2026-11-06: manifest.json · metadata/*.json · schemas/asset.schema.json)
 * and the intake master (docs/asks/2026.11.07_architect2525_3d_asset_intake_master.md §5–§14, §19): every entry carries
 * his metadata shape EXACTLY (schemaVersion "1.0" · id · label · category · model · planSymbol · dimensionsM in METRES ·
 * pivot FLOOR_CENTER / X=width,Y=depth,Z=up · rotation about Z · mounting · snap · rooms · phaseCompatibility · authority
 * · placement · packs) plus a `kind` back-reference to the legacy ObjectKind. Paths are relative to ASSET_BASE_URL (his
 * starter layout: models/<file>.glb · metadata/<file>.json · plan/<file>.svg); a separate loader slice owns the runtime
 * copy + GLB parsing — this registry carries identity + contract only, never mesh data.
 *
 * The brief's core architecture (§29): ONE CANONICAL PROJECT → ONE ASSET REGISTRY → ONE SEMANTIC ELEMENT MODEL → PHASE +
 * ROOM + AUTHORITY PROJECTIONS → PLAN · 3D · VOXEL · WALK · SIMULATE · BUILD. The visible asset may change projection;
 * its identity must not. Assembled from the existing boundaries (never a parallel engine): ASSET_PARAMS + OBJECT_SPEC +
 * SHAPE_PARTS_LOD + the dimension, room and phase projections. Assets are ILLUSTRATIVE design content: they never enter
 * canonical truth (§7 / master §27 — gated). Pure data + pure lookups, no React.
 */
import {
  ASSET_PARAMS, OBJECT_KINDS, OBJECT_SPEC, SHAPE_PARTS_LOD, LOD_LEVELS, shapePartsOf,
  type AssetCategory, type AssetAuthority, type DimRange, type Lod, type MaterialPreset, type MetaCategory, type Mounting,
  type ObjectKind, type RoomKey, type ShapePart, type SnapTarget,
} from "@/lib/room-objects";
import { dimsFt, dimsM, dimsUm, type DimsFt, type DimsUm } from "./dimensions";
import { phaseNamesFor, phasesFor, visibleInPhase, type PhaseName } from "./phase-compatibility";
import { isCompatibleWithRoom, roomNamesOf } from "./room-compatibility";

/** Where the runtime copy of his pack is served from (the loader slice's contract); every path below is relative to it. */
export const ASSET_BASE_URL = "/architect-2525/assets/";

/** His metadata contract, verbatim (schemas/asset.schema.json + intake master §8), plus the `kind` back-reference and the
 *  honest `modelStatus` (STARTER = one of his 18 native GLBs; PENDING = the same grammar, awaiting its model). */
export interface AssetMetadata {
  schemaVersion: "1.0";
  id: string;
  label: string;
  category: MetaCategory;
  model: string;                 // models/<file>.glb, relative to ASSET_BASE_URL
  planSymbol: string;            // plan/<file>.svg
  metadata: string;              // metadata/<file>.json
  thumbnail?: string;            // thumbs/<file>.webp — none shipped in the starter
  dimensionsM: { width: number; depth: number; height: number };
  pivot: { origin: "FLOOR_CENTER"; axes: "X=width,Y=depth,Z=up" };
  rotation: { axis: "Z"; allowedDegrees: number[]; freeRotation: boolean };
  mounting: Mounting;
  snap: SnapTarget[];
  authority: AssetAuthority;
  rooms: string[];               // his room names (MASTER_BEDROOM … ENTRY_PORCH) or ["GENERAL"]
  phaseCompatibility: PhaseName[];
  placement: { allowTranslate: boolean; allowRotate: boolean; allowScale: false; collisionFootprint: "BOUNDING_BOX_XY" };
  packs: number[];
  kind: ObjectKind;
  modelStatus: "STARTER" | "PENDING";
}

export interface AssetDef {
  id: string;                         // STABLE identity — never a React name or a visible label
  kind: ObjectKind;                   // the placeable kind behind it (PlacedObject.kind)
  label: string;                      // display name (OBJECT_SPEC)
  category: AssetCategory;            // the brief §17 general category (the Asset Library filter)
  rooms: RoomKey[] | "GENERAL";       // legacy keys (room-layout) — his names are in metadata.rooms
  phases: string[];                   // architect-phases ids this asset is visible in — his names are in metadata.phaseCompatibility
  mounting: Mounting;
  authority: AssetAuthority;          // ILLUSTRATIVE | REFERENCE — never verified/engineered/qualified/certified
  lod: Lod;                           // the level this definition is authored at (1 of 5)
  lods: Lod[];                        // the levels with authored parts (L1 today)
  materialPreset: MaterialPreset;
  dimensions: DimsFt;                 // nominal (default) footprint + height, ft (the designer's unit)
  dimensionsUm: DimsUm;               // the canonical-µm projection (widthUm/depthUm/heightUm)
  params: { w: DimRange; d: DimRange; h: DimRange }; // adjustable instance ranges, ft
  parts: ShapePart[];                 // the L1 parts (fractions of the w×d×h box)
  onWall: boolean;                    // the legacy wall-snap flag the designer still reads
  metadata: AssetMetadata;            // his contract, exactly
}

/** The rotation our data model supports today (room-objects Rot) — ⊆ his allowedDegrees for every starter asset (gated). */
export const ALLOWED_DEGREES: readonly number[] = [0, 90, 180, 270];

function metadataOf(kind: ObjectKind): AssetMetadata {
  const p = ASSET_PARAMS[kind], s = OBJECT_SPEC[kind];
  return {
    schemaVersion: "1.0", id: p.id, label: s.label, category: p.metaCategory,
    model: `models/${p.file}.glb`, planSymbol: `plan/${p.file}.svg`, metadata: `metadata/${p.file}.json`,
    dimensionsM: dimsM(kind),
    pivot: { origin: "FLOOR_CENTER", axes: "X=width,Y=depth,Z=up" },
    rotation: { axis: "Z", allowedDegrees: [...ALLOWED_DEGREES], freeRotation: false },
    mounting: p.mounting, snap: [...p.snap], authority: p.authority,
    rooms: roomNamesOf(kind), phaseCompatibility: phaseNamesFor(kind),
    placement: { allowTranslate: true, allowRotate: true, allowScale: false, collisionFootprint: "BOUNDING_BOX_XY" },
    packs: [...p.packs], kind, modelStatus: p.starter ? "STARTER" : "PENDING",
  };
}

function define(kind: ObjectKind): AssetDef {
  const p = ASSET_PARAMS[kind], s = OBJECT_SPEC[kind];
  const levels = SHAPE_PARTS_LOD[kind] ?? {};
  return {
    id: p.id, kind, label: s.label, category: p.category, rooms: p.rooms, phases: [...p.phases], mounting: p.mounting,
    authority: p.authority, lod: p.lod, lods: LOD_LEVELS.filter((l) => (levels[l]?.length ?? 0) > 0), materialPreset: p.materialPreset,
    dimensions: dimsFt(kind), dimensionsUm: dimsUm(kind), params: p.params, parts: shapePartsOf(kind), onWall: s.onWall,
    metadata: metadataOf(kind),
  };
}

/** The registry — one entry per kind, keyed by stable id, OBJECT_KINDS order. */
export const ASSET_REGISTRY: Record<string, AssetDef> = Object.fromEntries(OBJECT_KINDS.map((k) => { const d = define(k); return [d.id, d]; }));
/** Every stable id, OBJECT_KINDS order. */
export const ASSET_IDS: string[] = OBJECT_KINDS.map((k) => ASSET_PARAMS[k].id);
/** How many assets the registry holds. */
export const ASSET_COUNT = ASSET_IDS.length;
/** kind → id, the map the loader slice and the report read. */
export const ASSET_ID_BY_KIND: Record<ObjectKind, string> = Object.fromEntries(OBJECT_KINDS.map((k) => [k, ASSET_PARAMS[k].id])) as Record<ObjectKind, string>;

/** An asset by its stable id (own keys only), or undefined. */
export function assetById(id: string): AssetDef | undefined { return Object.hasOwn(ASSET_REGISTRY, id) ? ASSET_REGISTRY[id] : undefined; }
/** An asset by its placeable kind. */
export function assetByKind(kind: ObjectKind): AssetDef { return ASSET_REGISTRY[ASSET_PARAMS[kind].id]; }
/** His metadata record for an id, or undefined. */
export function metadataById(id: string): AssetMetadata | undefined { return assetById(id)?.metadata; }

export interface AssetFilter { room?: RoomKey; phase?: string | null; category?: AssetCategory | MetaCategory; pack?: number; starterOnly?: boolean }
/** The assets matching every given filter (room compatibility · phase projection · category — the brief §17 one OR his
 *  metadata one · pack · starter-only), registry order. */
export function listAssets(f: AssetFilter = {}): AssetDef[] {
  return ASSET_IDS.map((id) => ASSET_REGISTRY[id]).filter((a) =>
    (f.room === undefined || isCompatibleWithRoom(a.kind, f.room)) &&
    (f.phase === undefined || visibleInPhase(a.id, f.phase)) &&
    (f.category === undefined || a.category === f.category || a.metadata.category === f.category) &&
    (f.pack === undefined || a.metadata.packs.includes(f.pack)) &&
    (!f.starterOnly || a.metadata.modelStatus === "STARTER"));
}

/** The phases an asset is visible in, straight from the projection (equal to its authored `phases` — gated). */
export function assetPhases(id: string): string[] { return phasesFor(id); }
