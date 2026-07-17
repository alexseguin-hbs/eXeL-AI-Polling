"use client";

/**
 * ARCHITECT-2525 · BIM I/O bar (Vision 2525 v3.2, Increment 1) — sits in the House Build Spec.
 * Generate a BIM-compatible / structured building model (JSON download, with visible disclaimers), and
 * Import BIM: map objects into the Physical Digital Twin, de-dupe, and route unknowns to an Unclassified
 * queue for human review. Every action logs a Replay event.
 */
import { useRef } from "react";
import { Download, Upload, FileWarning } from "lucide-react";
import { exportBIM, importBIM, physicalSystems } from "@/lib/architect-bim";
import { type HomeType } from "@/lib/architect-layers";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", panel2: "#0c1420", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400" };
const nowMs = () => { try { return Date.now(); } catch { return 0; } };

export function BimIO({ state, homeType }: { state: LayerState; homeType: HomeType }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { unclassified, bimManifest: manifest } = state;

  const generate = () => {
    const model = exportBIM(Array.from(state.spec), homeType);
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `exel-bim-${model.project}.json`; a.click();
    URL.revokeObjectURL(url);
    state.logReplay("bim.export", `${model.components.length} components · ${model.meta.validationStatus}`);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = importBIM(JSON.parse(String(reader.result)), f.name, nowMs());
        state.applyBimImport(res);
      } catch {
        state.logReplay("bim.import.error", f.name);
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const btn = "flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-semibold hover:bg-white/5";
  return (
    <div data-arch-bim className="flex flex-col gap-1.5 rounded border p-1.5" style={{ borderColor: C.border }}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>BIM</span>
        <button data-bim-export onClick={generate} className={btn} style={{ borderColor: C.violet, color: C.violet }}>
          <Download className="h-3 w-3" /> Generate BIM-compatible model
        </button>
        <button data-bim-import onClick={() => fileRef.current?.click()} className={btn} style={{ borderColor: C.border, color: C.text }}>
          <Upload className="h-3 w-3" /> Import BIM
        </button>
        <input ref={fileRef} data-bim-file type="file" accept="application/json,.json,.ifcjson" onChange={onFile} className="hidden" />
      </div>
      <div className="text-[8px] leading-tight" style={{ color: C.dim }}>
        Preliminary structured model · not for construction · states assumptions &amp; gaps · <span style={{ color: C.gold }}>human review required</span> before professional use.
      </div>
      {manifest && (
        <div data-bim-manifest className="text-[8px]" style={{ color: C.dim }}>
          Imported <span style={{ color: C.text }}>{manifest.file}</span> · hash {manifest.hash} · placed <span style={{ color: C.cyan }}>{manifest.placed}</span> · queued <span style={{ color: C.gold }}>{manifest.queued}</span>
        </div>
      )}
      {manifest && (
        // Inc 5 — mapping provenance: exact IFC matches vs auto-inferred (keyword) vs spatially-located.
        // Keyword mappings are AI-inferred best-guesses → surfaced so a human can review them.
        <div data-bim-mapsummary className="text-[8px]" style={{ color: C.dim }}>
          Mapping · <span style={{ color: C.cyan }}>{manifest.exact} exact</span> · <span style={{ color: C.violet }}>{manifest.keyword} keyword-inferred</span> · <span style={{ color: C.gold }}>{manifest.queued} unclassified</span> · <span style={{ color: C.text }}>{manifest.spatialLinked} spatially-located</span>
        </div>
      )}
      {unclassified.length > 0 && (
        <div data-bim-unclassified className="flex flex-col gap-1 rounded border p-1" style={{ borderColor: C.border, background: C.panel2 }}>
          <div className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: C.gold }}>
            <FileWarning className="h-3 w-3" /> Unclassified imports · {unclassified.length} <span className="font-normal" style={{ color: C.dim }}>— assign to a system (not discarded)</span>
          </div>
          {unclassified.slice(0, 12).map((o) => (
            <div key={o.extId} data-unclassified-item={o.extId} className="flex items-center gap-1 text-[9px]">
              <span className="min-w-0 flex-1 truncate" style={{ color: C.text }}>{o.ifcClass} · {o.material || o.extId}</span>
              <select data-unclassified-assign defaultValue="" onChange={(e) => e.target.value && state.resolveUnclassified(o.extId, e.target.value)}
                className="rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }}>
                <option value="">Assign to…</option>
                {physicalSystems().map((s) => <option key={s.id} value={s.id} style={{ background: C.panel2 }}>{s.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
