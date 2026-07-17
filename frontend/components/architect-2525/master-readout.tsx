"use client";

/**
 * ARCHITECT-2525 · MASTER READOUT — the house's headline numbers on the Model map's settings header.
 * ==================================================================================================
 * Replaces the removed MODEL · U-WF PRIMITIVES panel (operator 2026-07-17). Shows the whole-project
 * DIMENSIONS (from the S5 global params), the MASTER COST (Inc 6 rollup, live-scaled), and the MASTER
 * BUILD TIME (parallel schedule) with a settings-style (gear) header. Pure display — recomputes live from
 * shared layer state, so editing the building params or the spec updates it instantly.
 */
import { Settings } from "lucide-react";
import { projectRollup } from "@/lib/architect-project";
import { houseEstimate } from "@/lib/architect-house";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", panel: "#111826", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };
const fmtUsd = (n: number) => "$" + Math.round(n).toLocaleString();

export function MasterReadout({ state }: { state: LayerState }) {
  const p = state.globalParams;
  const roll = projectRollup(Array.from(state.spec), state.gate, p);
  const est = houseEstimate(Array.from(state.spec));
  const footprint = Math.max(1, Math.round(p.areaSqft / Math.max(1, p.stories)));
  const side = Math.round(Math.sqrt(footprint));   // approx square footprint W×L (ft)
  return (
    <div data-arch-master-readout className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-1.5 text-[10px]"
      style={{ borderColor: C.border, background: C.panel }}>
      <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.violet }}>
        <Settings className="h-3 w-3" /> Project · Master
      </span>
      <span style={{ color: C.dim }}>Dimensions <span style={{ color: C.text }}>{p.areaSqft.toLocaleString()} ft² · {p.stories} {p.stories > 1 ? "stories" : "story"} · ~{side}×{side} ft footprint</span></span>
      <span style={{ color: C.dim }}>Master cost <span className="tabular-nums" style={{ color: C.gold }}>{fmtUsd(roll.costUsd)}</span> <span className="tabular-nums">({fmtUsd(roll.costBand.lo)}–{fmtUsd(roll.costBand.hi)})</span></span>
      <span style={{ color: C.dim }}>Build time <span className="tabular-nums" style={{ color: C.green }}>~{est.parallelDays} days</span></span>
      <span style={{ color: C.dim }}>Confidence <span className="tabular-nums" style={{ color: C.cyan }}>{roll.confidencePct}%</span></span>
    </div>
  );
}
