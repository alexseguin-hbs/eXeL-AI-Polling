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

export interface ImportedObject {
  extId: string; ifcClass: string; sourceFile: string; sourceHash: string; parent: string;
  geometryRef: string; material: string; quantity: number; importedAt: number;
  humanReviewStatus: "pending" | "accepted"; system?: string; leafId?: string;
}
export interface BimImport { objects: ImportedObject[]; unclassified: ImportedObject[]; leafIds: string[]; sourceFile: string; sourceHash: string; }

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

export function importBIM(raw: unknown, sourceFile = "import.json", now = 0): BimImport {
  const sourceHash = fnv1a(JSON.stringify(raw ?? null));
  const r = raw as Record<string, unknown> | unknown[];
  const list: Record<string, unknown>[] = Array.isArray(r)
    ? (r as Record<string, unknown>[])
    : (((r?.["objects"] ?? r?.["components"] ?? r?.["elements"] ?? []) as Record<string, unknown>[]) || []);
  const seen = new Set<string>();
  const objects: ImportedObject[] = [];
  const unclassified: ImportedObject[] = [];
  const leaves = new Set<string>();
  list.forEach((o, i) => {
    const ifcClass = String(o["ifcClass"] ?? o["type"] ?? o["class"] ?? o["sourceType"] ?? "Unknown");
    const extId = String(o["extId"] ?? o["id"] ?? o["guid"] ?? `${ifcClass}-${i}`);
    if (seen.has(extId)) return;   // de-dupe by external id (no duplicate assets)
    seen.add(extId);
    const obj: ImportedObject = {
      extId, ifcClass, sourceFile, sourceHash,
      parent: String(o["parent"] ?? ""), geometryRef: String(o["geometryRef"] ?? o["geometry"] ?? ""),
      material: String(o["material"] ?? ""), quantity: Number(o["quantity"] ?? o["count"] ?? 1) || 1,
      importedAt: now, humanReviewStatus: "pending",
    };
    const explicit = typeof o["system"] === "string" && findLayer(o["system"] as string) ? (o["system"] as string) : undefined;
    const system = IFC_TO_SYSTEM[ifcClass.toLowerCase()] ?? explicit;
    const leafId = system ? firstLeaf(system) ?? undefined : undefined;
    if (system && leafId) { obj.system = system; obj.leafId = leafId; leaves.add(leafId); objects.push(obj); }
    else unclassified.push(obj);
  });
  return { objects, unclassified, leafIds: Array.from(leaves), sourceFile, sourceHash };
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
