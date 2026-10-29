/**
 * ARCHITECT-2525 · PIPELINE — Draft → Revit → Unity/Unreal, architected now (operator 2026-10-29: "ensure future versions
 * are architected now (Revit + Unity/Unreal)").
 * ============================================================================================================
 * One design (the canonical edit graph) feeds every renderer — "write once, project many." This module is the real
 * ARCHITECTURE of that: the four fidelity TIERS and the PROJECTION registry wired to the canonical export seam
 * (ExportManifest.projections). It is honest about what ships today: the WebGL draft + low-fi walkthrough are LIVE,
 * the BIM/IFC model and the Voortman steel CUT LIST are LIVE exports; Revit · DXF · glTF · Unity · Unreal are DECLARED
 * projection targets registered on the seam now so future versions fill in each writer with no re-modeling.
 *
 * Pure data (no React, no Date.now/Math.random) → replay-safe + gate-tested. Anchored to docs/CUBE_3D_HOME_DESIGN_FRAMEWORK.md.
 */
export type FidelityTier = "edge" | "cad" | "realtime" | "cinematic";
export type ProjectionStatus = "LIVE" | "DECLARED";

export interface PipelineStage {
  id: FidelityTier;
  order: number;             // 1..4 along the pipeline
  label: string;            // conventional-language stage name
  renderer: string;         // the engine/target that produces this fidelity
  produces: string;         // what the stage hands the next one / the client
  audience: string;         // who it is FOR (play everywhere → presentation)
  status: ProjectionStatus; // LIVE = ships today, DECLARED = architected, writer pending
  blurb: string;
  projectionIds: string[];  // the export projections this stage registers
}

/** The four fidelity tiers — the same edge graph, every renderer, no re-modeling. */
export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "edge", order: 1, label: "Draft · edge", renderer: "WebGL (browser) + Python edge (Pi)", produces: "wireframe + voxel model, low-fi walkthrough", audience: "Play everywhere — design on any device",
    status: "LIVE", blurb: "The initial draft: the canonical room/edge model drawn in the browser (and on a Raspberry-Pi edge), with the low-fidelity walkthrough you can already step through.", projectionIds: ["webgl"] },
  { id: "cad", order: 2, label: "Revit · DXF", renderer: "Revit / DXF (architect-grade CAD)", produces: "stamped CAD set from the same edge graph", audience: "Send to architect / permit",
    status: "DECLARED", blurb: "Architect-grade CAD export for permit + the licensed architect. The BIM/IFC model and the Voortman steel cut-list are LIVE today; the native .rvt / .dxf writers are the declared next step.", projectionIds: ["bim-ifc", "cut-list", "revit", "dxf"] },
  { id: "realtime", order: 3, label: "Unity · walkthrough", renderer: "Unity 3D (real-time / VR)", produces: "real-time walkthrough / VR scene", audience: "Client review",
    status: "DECLARED", blurb: "A real-time Unity walkthrough / VR review built from the same model — the fidelity upgrade of the in-browser walk that already exists.", projectionIds: ["gltf", "unity"] },
  { id: "cinematic", order: 4, label: "Unreal · photoreal", renderer: "Unreal Engine 5 (cinematic)", produces: "photorealistic renders / film", audience: "Presentation",
    status: "DECLARED", blurb: "Photorealistic Unreal 5 renders for the final presentation — same edge graph, no re-modeling.", projectionIds: ["unreal"] },
];

export interface Projection {
  id: string;
  label: string;
  format: string;          // the file/interchange format
  status: ProjectionStatus;
  stageId: FidelityTier;
  via: string;             // the real function/path that produces it (LIVE) or the declared seam (DECLARED)
  note: string;
}

/** The projection registry — every export target, wired to the canonical ExportManifest seam. LIVE ones name the real
 *  shipping path; DECLARED ones are registered now so a later version fills in the writer. */
export const PROJECTIONS: Projection[] = [
  { id: "webgl",   label: "WebGL draft",     format: "in-browser",      status: "LIVE",     stageId: "edge",      via: "architect-design / voxel-house (walk mode)", note: "Draft + low-fi walkthrough — ships today." },
  { id: "bim-ifc", label: "BIM / IFC model", format: "eXeL-BIM/1.0 + IFC map", status: "LIVE", stageId: "cad",  via: "lib/architect-bim.ts · exportBIM()", note: "Structured, IFC-mappable model with assumptions + human-review flag — not a certified BIM." },
  { id: "cut-list", label: "Steel cut list", format: "CSV (Voortman-ready)", status: "LIVE", stageId: "cad",     via: "lib/architect-framing.ts · cutListCsv()", note: "Member-by-member takeoff for automated plasma cut/drill (Voortman)." },
  { id: "revit",   label: "Revit",           format: ".rvt",            status: "DECLARED", stageId: "cad",      via: "ExportManifest.projections seam", note: "Native Revit project — declared target; writer pending." },
  { id: "dxf",     label: "DXF",             format: ".dxf",            status: "DECLARED", stageId: "cad",      via: "ExportManifest.projections seam", note: "2D/3D CAD interchange — declared target." },
  { id: "gltf",    label: "glTF scene",      format: ".glb / .gltf",    status: "DECLARED", stageId: "realtime", via: "ExportManifest.projections seam", note: "Real-time scene for Unity/web 3D — declared target." },
  { id: "unity",   label: "Unity project",   format: "Unity package",   status: "DECLARED", stageId: "realtime", via: "ExportManifest.projections seam", note: "Unity walkthrough/VR — declared target." },
  { id: "unreal",  label: "Unreal render",   format: "Unreal / film",   status: "DECLARED", stageId: "cinematic", via: "ExportManifest.projections seam", note: "Photoreal Unreal 5 — declared target." },
];

export const EXPORT_SCHEMA_VERSION = 1;
/** The canonical ExportManifest (schema_version + the declared projection target ids) — the seam the R-CORE chain's
 *  `invalidated_exports` field tracks. Architected now; writers fill in later. */
export function exportManifest(): { schema_version: number; projections: string[] } {
  return { schema_version: EXPORT_SCHEMA_VERSION, projections: PROJECTIONS.map((p) => p.id) };
}
export function projectionsFor(stageId: FidelityTier): Projection[] { return PROJECTIONS.filter((p) => p.stageId === stageId); }
export function liveProjections(): Projection[] { return PROJECTIONS.filter((p) => p.status === "LIVE"); }
export function declaredProjections(): Projection[] { return PROJECTIONS.filter((p) => p.status === "DECLARED"); }

export interface PipelineSummary { stages: number; live: number; declared: number; tiers: FidelityTier[]; }
export function pipelineSummary(): PipelineSummary {
  return { stages: PIPELINE_STAGES.length, live: liveProjections().length, declared: declaredProjections().length, tiers: PIPELINE_STAGES.map((s) => s.id) };
}
