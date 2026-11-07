/**
 * ARCHITECT-2525 · ASSET EXPORT (Rev A) — ONE emit, TWO shapes: Revit-oriented + engine-oriented (Unity / Unreal / glTF).
 * =================================================================================================
 * The operator's bar (docs/asks/2026.11.07_architect2525_level1of5_parametric_portable.md): "ensure all items have
 * dimensions that are adjustable and that can be ported to Revit and Unity/Unreal engines". This is the PORTABLE half:
 * a pure projection of the placed, ILLUSTRATIVE room assets through the existing export seam, in the canonical datum
 * (+X East · +Y North · +Z Up, integer µm — umFromFt at the boundary). It stays INSIDE SPECS v1.2 at Level 1: a JSON
 * emit in Revit / engine SHAPES, not a .rvt/.glb writer (those are a spec amendment the operator approves for Level 2+);
 * lib/architect-pipeline.ts PROJECTIONS stay DECLARED and the .arch2525 package is untouched.
 *  · revit[]  — one record per placed object: stable id, category + Revit category + IFC class, instance id, origin
 *               (the object's plan centre), plan rotation, the INSTANCE PARAMETERS w/d/h in µm (object-local, from
 *               size → variant → kind default), mounting, authority, lod.
 *  · engine[] — the same identity + transform, with the L1 PARTS as axis-aligned boxes already placed in the ROOM frame
 *               (partRects — the ONE placement law — with the plan's y-down flipped to +Y North), each with its material
 *               id, so an engine instances boxes with no rotation maths of its own.
 * Deterministic: no Date, no random; the same objects → byte-identical output (gated). Assets never enter canonical
 * truth: this reads RoomCell objects only and writes nothing back.
 */
import { umFromFt } from "@/lib/architect-2525/canonical/units";
import { materialOf } from "@/lib/architect-2525/assets/materials";
import {
  ASSET_PARAMS, ROOM_GRID, footprintOf, heightOf, elevOf, partRects,
  type AssetAuthority, type AssetCategory, type Lod, type Mounting, type ObjectKind, type PlacedObject,
} from "@/lib/room-objects";

export const ASSET_EXPORT_SCHEMA = "arch2525-assets/1";

export interface Um3 { x: number; y: number; z: number }
export interface RevitClass { revitCategory: string; ifcClass: string }

export interface AssetRevit {
  id: string;
  category: AssetCategory;
  revitCategory: string;
  ifcClass: string;
  instance_id: string;
  origin_um: Um3;               // the object's plan centre, room origin + (x east, y north, z = elevation)
  rotation_deg: number;         // the plan rotation (room-objects Rot: 0/90/180/270, as partRects applies it)
  params_um: { w: number; d: number; h: number }; // object-local instance parameters
  mounting: Mounting;
  authority: AssetAuthority;
  lod: Lod;
}
export interface AssetEnginePart { origin_um: Um3; size_um: Um3; material: string }
export interface AssetEngine {
  id: string;
  instance_id: string;
  transform: { origin_um: Um3; rotation_deg: number };
  parts: AssetEnginePart[];      // axis-aligned boxes in the ROOM frame (rotation already applied) — min corner + size
  lod: Lod;
}
export interface AssetExport { schema: typeof ASSET_EXPORT_SCHEMA; revit: AssetRevit[]; engine: AssetEngine[] }

/** Revit category + IFC class by general category (the default), overridden per kind where IFC is more specific. */
const REVIT_BY_CATEGORY: Record<AssetCategory, RevitClass> = {
  FURNITURE:         { revitCategory: "Furniture",           ifcClass: "IfcFurniture" },
  FIXTURES:          { revitCategory: "Plumbing Fixtures",   ifcClass: "IfcSanitaryTerminal" },
  LIGHTING:          { revitCategory: "Lighting Fixtures",   ifcClass: "IfcLightFixture" },
  DOORS_WINDOWS:     { revitCategory: "Doors",               ifcClass: "IfcDoor" },
  BUILDING_ELEMENTS: { revitCategory: "Walls",               ifcClass: "IfcWall" },
  MECHANICAL:        { revitCategory: "Mechanical Equipment", ifcClass: "IfcUnitaryEquipment" },
  ELECTRICAL:        { revitCategory: "Electrical Equipment", ifcClass: "IfcElectricDistributionBoard" },
  PLUMBING:          { revitCategory: "Plumbing Fixtures",   ifcClass: "IfcSanitaryTerminal" },
  SECURITY:          { revitCategory: "Security Devices",    ifcClass: "IfcSensor" },
  SITE:              { revitCategory: "Site",                ifcClass: "IfcGeographicElement" },
};
const REVIT_BY_KIND: Partial<Record<ObjectKind, RevitClass>> = {
  window:    { revitCategory: "Windows",            ifcClass: "IfcWindow" },
  roof:      { revitCategory: "Roofs",              ifcClass: "IfcRoof" },
  counter:   { revitCategory: "Casework",           ifcClass: "IfcFurniture" },
  mirror:    { revitCategory: "Generic Models",     ifcClass: "IfcFurnishingElement" },
  rug:       { revitCategory: "Furniture",          ifcClass: "IfcFurnishingElement" },
  tv:        { revitCategory: "Specialty Equipment", ifcClass: "IfcAudioVisualAppliance" },
  fridge:    { revitCategory: "Specialty Equipment", ifcClass: "IfcElectricAppliance" },
  stove:     { revitCategory: "Specialty Equipment", ifcClass: "IfcElectricAppliance" },
  washer:    { revitCategory: "Specialty Equipment", ifcClass: "IfcElectricAppliance" },
  rangehood: { revitCategory: "Mechanical Equipment", ifcClass: "IfcAirTerminal" },
};
/** The Revit category + IFC class of a kind. Pure. */
export function revitClassOf(kind: ObjectKind): RevitClass { return REVIT_BY_KIND[kind] ?? REVIT_BY_CATEGORY[ASSET_PARAMS[kind].category]; }

/**
 * Project placed room objects to the two export shapes. `roomOrigin` is the room's SW floor corner in the canonical
 * datum (µm): plan x maps to +X East; the plan's y-DOWN (gy 0 = north) maps to +Y North as ROOM_GRID − y (the walk's
 * Y-flip); elevation maps to +Z. Pure + deterministic.
 */
export function assetExport(objects: PlacedObject[], roomOrigin: Um3): AssetExport {
  const revit: AssetRevit[] = [];
  const engine: AssetEngine[] = [];
  for (const o of objects) {
    const p = ASSET_PARAMS[o.kind];
    const fp = footprintOf(o);
    const origin_um: Um3 = {
      x: roomOrigin.x + umFromFt(o.gx + 0.5),
      y: roomOrigin.y + umFromFt(ROOM_GRID - (o.gy + 0.5)),
      z: roomOrigin.z + umFromFt(elevOf(o)),
    };
    const rc = revitClassOf(o.kind);
    revit.push({
      id: p.id, category: p.category, revitCategory: rc.revitCategory, ifcClass: rc.ifcClass, instance_id: o.id,
      origin_um, rotation_deg: o.rot,
      params_um: { w: umFromFt(fp.w), d: umFromFt(fp.d), h: umFromFt(heightOf(o)) },
      mounting: p.mounting, authority: p.authority, lod: p.lod,
    });
    const parts: AssetEnginePart[] = partRects(o, p.lod).map((r) => ({
      origin_um: { x: roomOrigin.x + umFromFt(r.x1), y: roomOrigin.y + umFromFt(ROOM_GRID - r.y2), z: roomOrigin.z + umFromFt(r.z0) },
      size_um: { x: umFromFt(r.x2 - r.x1), y: umFromFt(r.y2 - r.y1), z: umFromFt(r.z1 - r.z0) },
      material: materialOf(o.kind, r.part.accent).id,
    }));
    engine.push({ id: p.id, instance_id: o.id, transform: { origin_um, rotation_deg: o.rot }, parts, lod: p.lod });
  }
  return { schema: ASSET_EXPORT_SCHEMA, revit, engine };
}
