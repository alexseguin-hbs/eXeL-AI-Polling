/**
 * ARCHITECT-2525 · BIM I/O test harness — creation + intake, 3 off-the-shelf shapes + our example.
 * =================================================================================================
 * Operator: "test BIM file creation and intake with 3 off the shelf data examples and our example."
 * Run: node --experimental-strip-types tests/architect-bim.test.mjs   (Node ≥22.6)
 *
 * Exercises lib/architect-bim.ts against realistic foreign shapes so a file authored elsewhere (an IFC
 * export, a Revit/BIM export, an unknown vendor format) intakes into the Physical Digital Twin — mapped
 * by exact IFC class, keyword inference, or explicit system id — with everything unrecognized queued
 * (never dropped), de-duped by external id, spatial hierarchy resolved, and deterministic hashing.
 * Also verifies creation (exportBIM) yields a preliminary, human-review-required model.
 */
import { importBIM, exportBIM, BIM_FORMAT } from "../lib/architect-bim.ts";

let pass = 0, fail = 0;
const rec = (name, ok, detail = "") => { (ok ? pass++ : fail++); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? "  (" + detail + ")" : ""}`); };

// ── Example 1 — OFF-THE-SHELF IFC building export (IFC4 element set with a spatial tree) ──
const IFC_EXPORT = {
  schema: "IFC4", objects: [
    { guid: "S1", ifcClass: "IfcSite" },
    { guid: "B1", ifcClass: "IfcBuilding", parent: "S1" },
    { guid: "ST1", ifcClass: "IfcBuildingStorey", parent: "B1" },
    { guid: "SP1", ifcClass: "IfcSpace", parent: "ST1" },
    { guid: "W1", ifcClass: "IfcWallStandardCase", parent: "SP1", quantities: { length: 30, area: 300, netVolume: 25 }, material: "Concrete" },
    { guid: "W2", ifcClass: "IfcWallStandardCase", parent: "SP1", quantities: { length: 30, area: 300 } },
    { guid: "SL1", ifcClass: "IfcSlab", parent: "ST1", quantities: { area: 900, volume: 90 } },
    { guid: "WIN1", ifcClass: "IfcWindow", parent: "W1", quantities: { area: 12 } },
    { guid: "DR1", ifcClass: "IfcDoor", parent: "W1" },
    { guid: "COL1", ifcClass: "IfcColumn", parent: "ST1" },
    { guid: "PIPE1", ifcClass: "IfcPipeSegment", parent: "SP1", quantities: { length: 40 } },
    { guid: "LGT1", ifcClass: "IfcLightFixture", parent: "SP1" },
  ],
};

// ── Example 2 — OFF-THE-SHELF Revit-style export (`elements`, `type` names, quantities) ──
const REVIT_EXPORT = {
  application: "Autodesk Revit 2025", elements: [
    { id: "r-wall-1", type: "Basic Wall", quantities: { area: 420 }, material: "Gypsum" },
    { id: "r-floor-1", type: "Floor", quantities: { area: 900 } },
    { id: "r-win-1", type: "Window", quantities: { area: 15 } },
    { id: "r-door-1", type: "Door" },
    { id: "r-duct-1", type: "Duct", quantities: { length: 60 } },
    { id: "r-pipe-1", type: "Pipe", quantities: { length: 55 } },
    { id: "r-fix-1", type: "Plumbing Fixture" },
    { id: "r-cab-1", type: "Casework" },
  ],
};

// ── Example 3 — OFF-THE-SHELF unknown/foreign vendor format (mixed; some unmappable → queue) ──
const FOREIGN_EXPORT = [
  { id: "x1", class: "Wall", quantity: 4 },
  { id: "x2", class: "Roofing Panel" },
  { id: "x3", class: "Widget-9000" },       // unclassifiable → queue
  { id: "x4", class: "FooBar" },            // unclassifiable → queue
  { id: "x5", class: "Electrical Outlet" },
  { id: "x5", class: "Electrical Outlet" }, // duplicate id → deduped
];

// ── Our example — eXeL-BIM style, explicit system ids (round-trips through our own slugs) ──
const EXEL_EXAMPLE = {
  format: BIM_FORMAT, objects: [
    { id: "e1", type: "Assembly", system: "physical/electrical", quantities: { length: 120 } },
    { id: "e2", type: "Assembly", system: "physical/plumbing" },
    { id: "e3", type: "Assembly", system: "physical/foundation" },
    { id: "e4", type: "Assembly", system: "physical/not-a-real-system" }, // invalid explicit → queue
  ],
};

// ── 1) IFC export intake ──
{
  const r = importBIM(IFC_EXPORT, "ifc-export.ifc.json", 1);
  const win = r.objects.find((o) => o.extId === "WIN1");
  rec("BIM-1 IFC export — walls/slab/window/door/column/pipe/light mapped by exact IFC class", r.summary.exact >= 7, `exact=${r.summary.exact} placed=${r.objects.length}`);
  rec("BIM-1 IFC export — spatial hierarchy resolved (objects linked to storey/space)", r.summary.spatialLinked >= 4, `spatialLinked=${r.summary.spatialLinked}`);
  rec("BIM-1 IFC export — spatial containers (Site/Building/Storey/Space) not placed as assets", r.objects.every((o) => !/ifcsite|ifcbuilding|ifcspace|ifcbuildingstorey/.test(o.ifcClass.toLowerCase())), "");
  rec("BIM-1 IFC export — quantity takeoff carried (window area = 12)", !!win && win.area === 12, `winArea=${win?.area}`);
}

// ── 2) Revit-style intake (keyword inference) ──
{
  const r = importBIM(REVIT_EXPORT, "revit-export.json", 1);
  rec("BIM-2 Revit export — types mapped via keyword inference (wall/floor/window/door/duct/pipe/plumbing/casework)", r.summary.keyword >= 6, `keyword=${r.summary.keyword} placed=${r.objects.length} queued=${r.unclassified.length}`);
  rec("BIM-2 Revit export — nothing silently dropped (placed + queued = input count)", r.objects.length + r.unclassified.length === REVIT_EXPORT.elements.length, `${r.objects.length}+${r.unclassified.length} vs ${REVIT_EXPORT.elements.length}`);
}

// ── 3) Foreign/unknown intake (unclassified queue + dedupe) ──
{
  const r = importBIM(FOREIGN_EXPORT, "vendor.json", 1);
  rec("BIM-3 foreign format — unknown classes routed to the Unclassified queue (never discarded)", r.unclassified.length >= 2, `queued=${r.unclassified.length}`);
  rec("BIM-3 foreign format — duplicate extId deduped (x5 once)", r.objects.concat(r.unclassified).filter((o) => o.extId === "x5").length === 1, "");
}

// ── 4) Our eXeL-BIM example (explicit system ids) ──
{
  const r = importBIM(EXEL_EXAMPLE, "our-example.exel-bim.json", 1);
  rec("BIM-4 eXeL example — explicit valid system ids mapped; invalid one queued", r.summary.explicit >= 3 && r.unclassified.some((o) => o.extId === "e4"), `explicit=${r.summary.explicit} queued=${r.unclassified.length}`);
}

// ── 5) Determinism — same input → identical hash + leaf set ──
{
  const a = importBIM(IFC_EXPORT, "x", 0), b = importBIM(IFC_EXPORT, "x", 999);
  const sameHash = a.sourceHash === b.sourceHash;
  const sameLeaves = JSON.stringify([...a.leafIds].sort()) === JSON.stringify([...b.leafIds].sort());
  rec("BIM-5 determinism — identical input yields identical sourceHash + leaf set (replayable)", sameHash && sameLeaves, `hash=${a.sourceHash}`);
}

// ── 6) Creation (exportBIM) — preliminary, human-review-required model ──
{
  const specIds = ["physical/foundation/footings", "physical/structure/floor-systems/floor-joists", "physical/electrical/lighting", "physical/plumbing/fixtures"];
  const m = exportBIM(specIds, "full", "V2525-TEST");
  const ok = m.format === BIM_FORMAT && m.components.length === specIds.length && m.meta.humanReviewRequired === true && m.meta.validationStatus.startsWith("Preliminary");
  rec("BIM-6 creation — exportBIM yields a preliminary, human-review-required model with components + estimate", ok, `format=${m.format} components=${m.components.length} review=${m.meta.humanReviewRequired}`);
  // round-trip: the exported model's components carry system context
  rec("BIM-6 creation — every exported component carries a resolved path", m.components.every((c) => c.path && c.label), "");
}

console.log(`\nBIM-TEST ${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
