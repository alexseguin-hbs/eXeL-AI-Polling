/**
 * ARCHITECT-2525 · BIM I/O (Vision 2525 v3.2, Increment 1).
 * =================================================================================================
 * "Convert to BIM" is surfaced as GENERATE a BIM-compatible / structured building model — never a
 * certified professional BIM. Import maps foreign objects into the Physical Digital Twin hierarchy,
 * de-dupes by external id / source hash, and routes anything unrecognized to an Unclassified queue
 * (never discarded). Pure functions — no React, no network.
 */
import { findLayer, flattenLayers, type HomeType } from "./architect-layers";
import { houseEstimate, houseSchedule, componentEstimate, type HouseEstimate, type HouseSchedule } from "./architect-house";

export const BIM_FORMAT = "eXeL-BIM/1.0";

// ── EXPORT ───────────────────────────────────────────────────────────────────────────────────────
export interface BimComponent { id: string; path: string; label: string; system: string; cost: number | null; installDays: number | null; phase: string | null; }
export interface BimMeta { sourceAssumptions: string[]; missing: string[]; confidencePct: number; validationStatus: string; humanReviewRequired: boolean; }
export interface BimModel { format: string; targetMarket: HomeType; project: string; meta: BimMeta; estimate: HouseEstimate; schedule: HouseSchedule; components: BimComponent[]; }

export function exportBIM(specIds: string[], homeType: HomeType, project = "V2525-000842"): BimModel {
  const components: BimComponent[] = specIds.map((id) => {
    const f = findLayer(id);
    const e = componentEstimate(id);
    return {
      id,
      path: f ? [f.scope.label, ...f.path.map((n) => n.label)].join(" > ") : id,
      label: f?.node.label ?? id,
      system: f ? f.path[0]?.label ?? "" : "",
      cost: e?.cost ?? null, installDays: e?.days ?? null, phase: e?.phase ?? null,
    };
  });
  return {
    format: BIM_FORMAT, targetMarket: homeType, project,
    // The generated model is PRELIMINARY: it states its own assumptions, gaps, confidence and that a
    // human must review before any professional/construction use.
    meta: {
      sourceAssumptions: ["Rough per-system unit costs (not quoted)", "Parallel-install overlap ≈ 40% on phase seams", "Quantities from target-market defaults, not a site takeoff"],
      missing: ["Supplier quotes / POs", "Site-specific quantities & geometry", "Structural / MEP engineer sign-off", "Permit set"],
      confidencePct: 65, validationStatus: "Preliminary — not for construction", humanReviewRequired: true,
    },
    estimate: houseEstimate(specIds), schedule: houseSchedule(specIds), components,
  };
}

// ── IMPORT ───────────────────────────────────────────────────────────────────────────────────────
// IFC class / source type → Physical Digital Twin system id (best-effort; Increment 5 deepens this).
const IFC_TO_SYSTEM: Record<string, string> = {
  ifcsite: "physical/site", ifcspace: "physical/spaces", ifcbuildingstorey: "physical/spaces", ifcbuilding: "physical/spaces",
  ifcfooting: "physical/foundation", ifcslab: "physical/foundation", ifcpile: "physical/foundation",
  ifccolumn: "physical/structure", ifcbeam: "physical/structure", ifcmember: "physical/structure", ifcwall: "physical/structure", ifcwallstandardcase: "physical/structure",
  ifcroof: "physical/building-envelope", ifcwindow: "physical/building-envelope", ifcdoor: "physical/building-envelope", ifccovering: "physical/building-envelope", ifccurtainwall: "physical/building-envelope",
  ifcductsegment: "physical/mechanical", ifcairterminal: "physical/mechanical", ifcunitaryequipment: "physical/mechanical", ifcfan: "physical/mechanical",
  ifccablecarriersegment: "physical/electrical", ifcelectricappliance: "physical/electrical", ifclightfixture: "physical/electrical", ifcoutlet: "physical/electrical", ifcelectricdistributionboard: "physical/electrical",
  ifcpipesegment: "physical/plumbing", ifcsanitaryterminal: "physical/plumbing", ifcvalve: "physical/plumbing",
  ifcalarm: "physical/fire-protection", ifcfiresuppressionterminal: "physical/fire-protection",
  ifcsensor: "physical/communications-low-voltage", ifccommunicationsappliance: "physical/communications-low-voltage",
  ifcfurniture: "physical/interior", ifcfurnishingelement: "physical/interior",
};

// How an object's system was resolved — provenance so auto-inferred (keyword) mappings are visible + reviewable.
export type MappedBy = "explicit" | "ifc-exact" | "ifc-keyword" | "unclassified";

// Keyword → system fallback (Inc 5): fires ONLY when the exact IFC map misses, catching class variants
// (IfcStairFlight, IfcPlate, IfcRailing, IfcSpaceHeater, …). Ordered; first substring hit wins. Genuinely
// ambiguous classes (IfcBuildingElementProxy, bare IfcFlowSegment) match nothing → routed to Unclassified.
const IFC_KEYWORDS: Array<[string, string]> = [
  ["footing", "physical/foundation"], ["pile", "physical/foundation"], ["slab", "physical/foundation"], ["raft", "physical/foundation"], ["foundation", "physical/foundation"],
  ["stair", "physical/structure"], ["railing", "physical/structure"], ["ramp", "physical/structure"], ["truss", "physical/structure"], ["joist", "physical/structure"], ["girder", "physical/structure"], ["brace", "physical/structure"], ["plate", "physical/structure"], ["column", "physical/structure"], ["beam", "physical/structure"], ["framing", "physical/structure"], ["floor", "physical/structure"], ["wall", "physical/structure"],
  ["roof", "physical/building-envelope"], ["window", "physical/building-envelope"], ["door", "physical/building-envelope"], ["curtain", "physical/building-envelope"], ["cladding", "physical/building-envelope"], ["facade", "physical/building-envelope"], ["shading", "physical/building-envelope"], ["covering", "physical/building-envelope"],
  ["duct", "physical/mechanical"], ["airterminal", "physical/mechanical"], ["boiler", "physical/mechanical"], ["chiller", "physical/mechanical"], ["coil", "physical/mechanical"], ["fan", "physical/mechanical"], ["damper", "physical/mechanical"], ["ventilat", "physical/mechanical"], ["spaceheater", "physical/mechanical"], ["hvac", "physical/mechanical"],
  ["cable", "physical/electrical"], ["electric", "physical/electrical"], ["light", "physical/electrical"], ["outlet", "physical/electrical"], ["switch", "physical/electrical"], ["distributionboard", "physical/electrical"], ["transformer", "physical/electrical"], ["busbar", "physical/electrical"], ["junction", "physical/electrical"],
  ["pipe", "physical/plumbing"], ["sanitary", "physical/plumbing"], ["valve", "physical/plumbing"], ["waterheater", "physical/plumbing"], ["drain", "physical/plumbing"], ["pump", "physical/plumbing"], ["tank", "physical/plumbing"], ["plumbing", "physical/plumbing"], ["faucet", "physical/plumbing"], ["toilet", "physical/plumbing"], ["sink", "physical/plumbing"],
  ["alarm", "physical/fire-protection"], ["firesuppression", "physical/fire-protection"], ["sprinkler", "physical/fire-protection"], ["smoke", "physical/fire-protection"], ["extinguisher", "physical/fire-protection"],
  ["sensor", "physical/communications-low-voltage"], ["communication", "physical/communications-low-voltage"], ["controller", "physical/communications-low-voltage"], ["actuator", "physical/communications-low-voltage"], ["audiovisual", "physical/communications-low-voltage"],
  ["furniture", "physical/interior"], ["furnishing", "physical/interior"], ["cabinet", "physical/interior"], ["casework", "physical/interior"], ["millwork", "physical/interior"], ["counter", "physical/interior"], ["appliance", "physical/interior"],
  ["landscap", "physical/exterior"], ["hardscap", "physical/exterior"], ["fence", "physical/exterior"], ["deck", "physical/exterior"], ["pavement", "physical/exterior"], ["driveway", "physical/exterior"],
  ["terrain", "physical/site"], ["grading", "physical/site"], ["geographic", "physical/site"],
];
function classifyIfcKeyword(ifcClass: string, material: string): string | undefined {
  const hay = `${ifcClass} ${material}`.toLowerCase();
  for (const [kw, sys] of IFC_KEYWORDS) if (hay.includes(kw)) return sys;
  return undefined;
}

// IFC spatial-container classes (site → building → storey → space) — used to resolve an element's location.
const SPATIAL_CLASS: Record<string, "building" | "storey" | "space" | "site"> = {
  ifcsite: "site", ifcbuilding: "building", ifcbuildingstorey: "storey", ifcstorey: "storey", ifcspace: "space",
};

export interface ImportedObject {
  extId: string; ifcClass: string; sourceFile: string; sourceHash: string; parent: string;
  geometryRef: string; material: string; quantity: number; importedAt: number;
  humanReviewStatus: "pending" | "accepted"; system?: string; leafId?: string;
  // Inc 5 — quantity takeoff, spatial hierarchy refs, and mapping provenance.
  area: number; length: number; volume: number;
  buildingRef: string; storeyRef: string; spaceRef: string;
  mappedBy: MappedBy;
}
// Mapping provenance summary — how the import resolved (visible in the UI for review/transparency).
export interface BimMapSummary { exact: number; keyword: number; explicit: number; unclassified: number; spatialLinked: number; }
export interface BimImport { objects: ImportedObject[]; unclassified: ImportedObject[]; leafIds: string[]; sourceFile: string; sourceHash: string; summary: BimMapSummary; }

// Representative buildable leaf for a system (first non-Level-3 leaf) so an imported object lands as an asset.
export function systemFirstLeaf(systemId: string): string | null {
  const f = findLayer(systemId);
  if (!f) return null;
  const leaves = flattenLayers([f.node]).filter((n) => !n.children?.length && !n.level3);
  return leaves[0]?.id ?? null;
}
const firstLeaf = systemFirstLeaf;

// FNV-1a — a stable, dependency-free source hash for de-duplication / provenance.
function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function importBIM(raw: unknown, sourceFile = "import.json", now = 0): BimImport {
  const sourceHash = fnv1a(JSON.stringify(raw ?? null));
  const r = raw as Record<string, unknown> | unknown[];
  const list: Record<string, unknown>[] = Array.isArray(r)
    ? (r as Record<string, unknown>[])
    : (((r?.["objects"] ?? r?.["components"] ?? r?.["elements"] ?? []) as Record<string, unknown>[]) || []);

  // Pass 1 — materialize each object (dedupe by extId), extracting quantities + geometry + material.
  const seen = new Set<string>();
  const all: ImportedObject[] = [];
  const byId = new Map<string, ImportedObject>();
  list.forEach((o, i) => {
    const ifcClass = String(o["ifcClass"] ?? o["type"] ?? o["class"] ?? o["sourceType"] ?? "Unknown");
    const extId = String(o["extId"] ?? o["id"] ?? o["guid"] ?? `${ifcClass}-${i}`);
    if (seen.has(extId)) return;   // de-dupe by external id (no duplicate assets)
    seen.add(extId);
    const q = (o["quantities"] ?? {}) as Record<string, unknown>;
    const obj: ImportedObject = {
      extId, ifcClass, sourceFile, sourceHash,
      parent: String(o["parent"] ?? o["container"] ?? o["parentId"] ?? ""),
      geometryRef: String(o["geometryRef"] ?? o["geometry"] ?? ""),
      material: String(o["material"] ?? ""), quantity: num(o["quantity"] ?? o["count"] ?? 1) || 1,
      area: num(o["area"] ?? q["area"] ?? q["netArea"] ?? q["grossArea"]),
      length: num(o["length"] ?? q["length"]),
      volume: num(o["volume"] ?? q["volume"] ?? q["netVolume"]),
      buildingRef: "", storeyRef: "", spaceRef: "",
      importedAt: now, humanReviewStatus: "pending", mappedBy: "unclassified",
    };
    all.push(obj); byId.set(extId, obj);
  });

  // Pass 2 — resolve the spatial hierarchy: walk each object's parent chain to its enclosing space/storey/building.
  const spatialOf = (id: string): "building" | "storey" | "space" | "site" | undefined => {
    const c = byId.get(id); return c ? SPATIAL_CLASS[c.ifcClass.toLowerCase()] : undefined;
  };
  for (const obj of all) {
    let cur = obj.parent, guard = 0;
    while (cur && byId.has(cur) && guard++ < 32) {
      const kind = spatialOf(cur);
      if (kind === "space" && !obj.spaceRef) obj.spaceRef = cur;
      else if (kind === "storey" && !obj.storeyRef) obj.storeyRef = cur;
      else if (kind === "building" && !obj.buildingRef) obj.buildingRef = cur;
      cur = byId.get(cur)!.parent;
    }
  }

  // Pass 3 — classify each non-spatial object into a Physical-Twin system (exact → keyword → explicit), else queue.
  const objects: ImportedObject[] = [];
  const unclassified: ImportedObject[] = [];
  const leaves = new Set<string>();
  let exact = 0, keyword = 0, explicitN = 0, spatialLinked = 0;
  for (const obj of all) {
    if (obj.buildingRef || obj.storeyRef || obj.spaceRef) spatialLinked++;
    // Spatial containers themselves are structure/geography context — not buildable assets; skip placement.
    if (SPATIAL_CLASS[obj.ifcClass.toLowerCase()]) { obj.mappedBy = "unclassified"; continue; }
    const oExplicit = list.find((x) => String(x["extId"] ?? x["id"] ?? x["guid"] ?? "") === obj.extId)?.["system"];
    const explicit = typeof oExplicit === "string" && findLayer(oExplicit) ? oExplicit : undefined;
    const cls = obj.ifcClass.toLowerCase();
    let system: string | undefined; let how: MappedBy = "unclassified";
    if (IFC_TO_SYSTEM[cls]) { system = IFC_TO_SYSTEM[cls]; how = "ifc-exact"; }
    else if (explicit) { system = explicit; how = "explicit"; }
    else { const kw = classifyIfcKeyword(obj.ifcClass, obj.material); if (kw) { system = kw; how = "ifc-keyword"; } }
    const leafId = system ? firstLeaf(system) ?? undefined : undefined;
    if (system && leafId) {
      obj.system = system; obj.leafId = leafId; obj.mappedBy = how; leaves.add(leafId); objects.push(obj);
      if (how === "ifc-exact") exact++; else if (how === "ifc-keyword") keyword++; else explicitN++;
    } else { obj.mappedBy = "unclassified"; unclassified.push(obj); }
  }
  const summary: BimMapSummary = { exact, keyword, explicit: explicitN, unclassified: unclassified.length, spatialLinked };
  return { objects, unclassified, leafIds: Array.from(leaves), sourceFile, sourceHash, summary };
}

// The 12 physical systems an unclassified object can be assigned to (Increment 5 UI uses this).
export function physicalSystems(): { id: string; label: string }[] {
  const f = findLayer("physical/site");
  void f;
  return [
    "site", "spaces", "foundation", "structure", "building-envelope", "mechanical",
    "electrical", "plumbing", "fire-protection", "communications-low-voltage", "interior", "exterior",
  ].map((s) => {
    const node = findLayer(`physical/${s}`);
    return { id: `physical/${s}`, label: node?.node.label ?? s };
  });
}
