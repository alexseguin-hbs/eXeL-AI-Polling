"use client";

/**
 * ARCHITECT-2525 · PIPELINE surface (operator 2026-10-29: "architect future versions now — Revit + Unity/Unreal").
 * Shows the four fidelity tiers (Draft → Revit · DXF → Unity → Unreal) and the projection registry wired to the canonical
 * export seam, honest about what is LIVE today vs DECLARED. Pure presentation over lib/architect-pipeline.ts.
 */
import { PIPELINE_STAGES, PROJECTIONS, exportManifest, pipelineSummary, projectionsFor, stageStatus, type ProjectionStatus } from "@/lib/architect-pipeline";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", ground: "#070b12" };
const statusStyle = (s: ProjectionStatus) => s === "LIVE"
  ? { color: C.green, border: "#14532d", bg: "#052e16" }
  : { color: C.amber, border: "#92400e", bg: "#1a1205" };

export function ArchitectPipelineView() {
  const sum = pipelineSummary();
  const manifest = exportManifest();
  return (
    <div className="space-y-3" data-arch-pipeline>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[12px] font-bold tracking-wider" style={{ color: C.violet }}>PIPELINE · DRAFT → REVIT → UNITY / UNREAL</div>
        <span className="text-[9px]" style={{ color: C.dim }}>· one design (the canonical edit graph) feeds every renderer — write once, project many</span>
      </div>

      {/* the four fidelity tiers */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" data-arch-pipeline-stages>
        {PIPELINE_STAGES.map((st) => { const info = stageStatus(st.id); const ss = statusStyle(info.live > 0 ? "LIVE" : "DECLARED");
          const badge = info.status === "MIXED" ? `${info.live} LIVE · ${info.declared} declared` : info.status === "LIVE" ? "LIVE" : "DECLARED";
          const projs = projectionsFor(st.id); return (
          <div key={st.id} className="flex flex-col rounded-lg border p-2.5" style={{ borderColor: C.border, background: C.panel }}>
            <div className="flex items-start justify-between gap-1">
              <span className="text-[10px] font-bold" style={{ color: C.cyan }}>{st.order} · {st.label}</span>
              <span className="rounded-full border px-1.5 py-0.5 text-[8px] font-semibold whitespace-nowrap" style={{ borderColor: ss.border, color: ss.color, background: ss.bg }}>{badge}</span>
            </div>
            <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>{st.renderer}</div>
            <div className="mt-1.5 text-[10px]" style={{ color: C.text }}>{st.blurb}</div>
            {/* per-projection LIVE/DECLARED chips so each card shows what actually ships today (fleet P0#5) */}
            <div className="mt-1.5 flex flex-wrap gap-1" data-arch-stage-projections={st.id}>
              {projs.map((p) => { const cs = statusStyle(p.status); return (
                <span key={p.id} className="rounded border px-1 py-0.5 text-[8px] font-semibold" style={{ borderColor: cs.border, color: cs.color, background: cs.bg }}>{p.status === "LIVE" ? "● " : "○ "}{p.label}</span>
              ); })}
            </div>
            <div className="mt-1.5 space-y-0.5 text-[8px]">
              <div><span style={{ color: C.dim }}>Produces </span><span style={{ color: C.text }}>{st.produces}</span></div>
              <div><span style={{ color: C.dim }}>For </span><span style={{ color: C.violet }}>{st.audience}</span></div>
            </div>
          </div>
        ); })}
      </div>

      {/* projection registry — the export seam */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider" style={{ color: C.cyan }}>EXPORT PROJECTIONS · the canonical seam</span>
          <span className="text-[9px]" style={{ color: C.dim }}>· manifest v{manifest.schema_version} · {sum.live} LIVE · {sum.declared} declared</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]" style={{ borderCollapse: "collapse" }}>
            <thead><tr style={{ color: C.gold }}>
              <th className="px-1.5 py-1 text-left">Projection</th><th className="px-1.5 py-1 text-left">Format</th><th className="px-1.5 py-1 text-left">Status</th><th className="px-1.5 py-1 text-left">Via / note</th>
            </tr></thead>
            <tbody>
              {PROJECTIONS.map((p) => { const ss = statusStyle(p.status); return (
                <tr key={p.id} data-arch-projection={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-1.5 py-1" style={{ color: C.text }}>{p.label}</td>
                  <td className="px-1.5 py-1" style={{ color: C.dim }}>{p.format}</td>
                  <td className="px-1.5 py-1"><span className="rounded px-1 py-0.5 font-semibold" style={{ color: ss.color, background: ss.bg, border: `1px solid ${ss.border}` }}>{p.status}</span></td>
                  <td className="px-1.5 py-1" style={{ color: C.dim, wordBreak: "break-word" }}>{p.via} · {p.note}</td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
        <div className="mt-1.5 text-[9px]" style={{ color: C.amber }}>⚠ Architected now, filled in later: the WebGL draft + low-fi walkthrough, the BIM/IFC model and the Voortman steel cut-list are <b style={{ color: C.green }}>LIVE</b> today; the <b>concrete print toolpath</b> (ICON / Vulcan-style cement — the counterpart to the steel cut-list), Revit · DXF · glTF · Unity · Unreal are <b>DECLARED</b> projection targets registered on the canonical export seam — a later version adds each writer with no re-modeling (same edge graph). A <b>Frame</b> build exports the cut-list; a <b>Cement</b> build exports the print path; both come off one model.</div>
        <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>Per-step Materials · Labor · Markup for the actual house build live in the <b style={{ color: C.cyan }}>Simulate</b> tab (cost-by-element + the Build Instructions); this surface is the design-to-deliverable ladder.</div>
      </div>
    </div>
  );
}
