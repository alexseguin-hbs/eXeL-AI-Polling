// ARCHITECT-2525 · PIPELINE gate (operator 2026-10-29: "architect future versions now — Revit + Unity/Unreal"). The four
// fidelity tiers (Draft → Revit·DXF → Unity → Unreal), one edge graph → many renderers, and the projection registry wired
// to the canonical export seam: honest LIVE (WebGL draft + BIM/IFC + Voortman cut-list) vs DECLARED (Revit/DXF/glTF/Unity/Unreal).
import { PIPELINE_STAGES, PROJECTIONS, EXPORT_SCHEMA_VERSION, exportManifest, manifestIds, projectionsFor, liveProjections, declaredProjections, pipelineSummary, stageStatus } from "@/lib/architect-pipeline";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// four fidelity tiers in order
const TIERS = ["edge", "cad", "realtime", "cinematic"];
ok(PIPELINE_STAGES.length === 4, `4 fidelity stages (got ${PIPELINE_STAGES.length})`);
ok(JSON.stringify(PIPELINE_STAGES.map((s) => s.id)) === JSON.stringify(TIERS), "stages are edge → cad → realtime → cinematic");
ok(JSON.stringify(PIPELINE_STAGES.map((s) => s.order)) === JSON.stringify([1, 2, 3, 4]), "stages ordered 1..4");
for (const s of PIPELINE_STAGES) {
  ok(s.label && s.renderer && s.produces && s.audience && s.blurb, `${s.id} has label/renderer/produces/audience/blurb`);
  ok(s.status === "LIVE" || s.status === "DECLARED", `${s.id} status is LIVE or DECLARED`);
  ok(Array.isArray(s.projectionIds) && s.projectionIds.length >= 1, `${s.id} registers ≥1 projection`);
  ok(s.projectionIds.every((pid) => PROJECTIONS.some((p) => p.id === pid)), `${s.id} projection ids all resolve`);
}
// the Draft/edge tier is LIVE (it ships today); Revit/Unity/Unreal tiers are DECLARED
ok(PIPELINE_STAGES.find((s) => s.id === "edge").status === "LIVE", "the Draft/edge tier is LIVE today");
ok(["cad", "realtime", "cinematic"].every((id) => PIPELINE_STAGES.find((s) => s.id === id).status === "DECLARED"), "Revit/Unity/Unreal tiers are DECLARED");

// Revit + Unity + Unreal are present as named renderers (the operator's pipeline)
const renderers = PIPELINE_STAGES.map((s) => s.renderer).join(" ");
ok(/Revit/.test(renderers) && /Unity/.test(renderers) && /Unreal/.test(renderers), "Revit + Unity + Unreal are named in the pipeline");

// projection registry
ok(PROJECTIONS.length >= 7, `≥7 projection targets (got ${PROJECTIONS.length})`);
for (const p of PROJECTIONS) {
  ok(p.id && p.label && p.format && p.via && p.note, `${p.id} has label/format/via/note`);
  ok(p.status === "LIVE" || p.status === "DECLARED", `${p.id} valid status`);
  ok(TIERS.includes(p.stageId), `${p.id} belongs to a real tier`);
}
// the LIVE exports are exactly the shipping ones: WebGL draft, BIM/IFC, Voortman cut-list
const live = liveProjections().map((p) => p.id).sort();
ok(JSON.stringify(live) === JSON.stringify(["bim-ifc", "cut-list", "webgl"]), `LIVE = webgl + bim-ifc + cut-list (got ${live.join(",")})`);
ok(liveProjections().find((p) => p.id === "cut-list").note.toLowerCase().includes("voortman"), "the cut-list names the Voortman automated-fab path");
// the DECLARED targets include Revit, DXF, glTF, Unity, Unreal
const declared = declaredProjections().map((p) => p.id).sort();
ok(["revit", "dxf", "gltf", "unity", "unreal"].every((id) => declared.includes(id)), "Revit/DXF/glTF/Unity/Unreal are DECLARED targets");

// the canonical export manifest seam — v2: each projection carries {id, status, format} (fleet P1#9: the machine seam is
// as honest as the UI badges)
const mf = exportManifest();
ok(mf.schema_version === EXPORT_SCHEMA_VERSION && EXPORT_SCHEMA_VERSION === 2 && Array.isArray(mf.projections), "exportManifest is schema v2 with projections[]");
ok(mf.projections.length === PROJECTIONS.length && mf.projections.every((mp) => PROJECTIONS.some((p) => p.id === mp.id) && (mp.status === "LIVE" || mp.status === "DECLARED") && typeof mp.format === "string"), "every manifest projection carries id + status + format (honest seam)");
ok(JSON.stringify(manifestIds()) === JSON.stringify(PROJECTIONS.map((p) => p.id)), "manifestIds() is the flat id list for the R-CORE invalidated_exports seam");

// fleet P0#4: the cement concrete-print toolpath (ICON's native method) is registered on the seam, paired with the steel cut-list
const printPath = PROJECTIONS.find((p) => p.id === "print-path");
ok(printPath && /concrete|print|toolpath|cement/i.test(printPath.label + printPath.note), "a concrete print toolpath projection exists (ICON cement path)");
ok(printPath && printPath.stageId === "cad", "the concrete print path sits with the fabrication deliverables (cad tier)");
ok(PROJECTIONS.some((p) => p.id === "cut-list" && p.status === "LIVE") && PROJECTIONS.some((p) => p.id === "print-path"), "steel cut-list (LIVE) + concrete print path both present — Frame or Cement off one seam");

// fleet P0#5: the cad tier reads MIXED (ships LIVE deliverables though its native renderer is declared), never a flat DECLARED that undercounts
const cad = stageStatus("cad");
ok(cad.status === "MIXED" && cad.live === 2 && cad.declared === 3, `cad tier is MIXED · 2 LIVE · 3 declared (got ${cad.status} ${cad.live}/${cad.declared})`);
ok(stageStatus("edge").status === "LIVE", "the edge/Draft tier is fully LIVE");
ok(stageStatus("realtime").status === "DECLARED" && stageStatus("cinematic").status === "DECLARED", "the Unity + Unreal tiers are fully declared");

// projectionsFor + summary
ok(projectionsFor("cad").length >= 3, "the CAD tier carries multiple projections (BIM/cut-list/print-path/Revit/DXF)");
const sum = pipelineSummary();
ok(sum.stages === 4 && sum.live === 3 && sum.declared === PROJECTIONS.length - 3, `summary: 4 stages, 3 live, ${PROJECTIONS.length - 3} declared`);

// determinism (replay law)
ok(JSON.stringify(exportManifest()) === JSON.stringify(exportManifest()), "exportManifest is deterministic");

console.log(`\narchitect-pipeline: ${pass} passed, ${fail} failed · Draft→Revit→Unity/Unreal · projection registry on the canonical seam`);
process.exit(fail ? 1 : 0);
