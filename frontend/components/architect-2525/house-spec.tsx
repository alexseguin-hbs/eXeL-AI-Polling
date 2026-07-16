"use client";

/**
 * ARCHITECT-2525 · HOUSE BUILD SPEC panel — the expandable bottom section of the Design workspace.
 * Shows the house the user has wireframed by SELECTING components (R4): totals (count · cost · time),
 * a per-phase rollup, and the chosen components grouped by install phase, each removable. Parallel
 * install time (overlapping phases) is shown alongside the naive sequential total.
 */
import { X, Home, Layers } from "lucide-react";
import { houseEstimate, houseSchedule, componentEstimate } from "@/lib/architect-house";
import { findLayer, type LayerNode } from "@/lib/architect-layers";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", panel: "#111826", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400", red: "#ef4444" };
const fmtUsd = (n: number) => "$" + Math.round(n).toLocaleString();

export function HouseSpec({ state }: { state: LayerState }) {
  const ids = Array.from(state.spec);
  const est = houseEstimate(ids);

  if (est.count === 0) {
    return (
      <div data-arch-house-spec data-house-count="0" className="flex items-center gap-2 text-[11px]" style={{ color: C.dim }}>
        <Home className="h-4 w-4" style={{ color: C.violet }} />
        Wireframe your house — select a component in the Layer Tree, then <span style={{ color: C.text }}>Add&nbsp;to&nbsp;house</span> in the Context panel.
      </div>
    );
  }

  const maxPhaseDays = Math.max(...est.byPhase.map((p) => p.days), 1);
  const sched = houseSchedule(ids);
  // spec ids resolved to their (leaf) component nodes
  const items = ids.map((id) => findLayer(id)?.node).filter((n): n is LayerNode => !!n && !n.children?.length);

  return (
    <div data-arch-house-spec data-house-count={est.count} className="flex flex-col gap-3 text-[11px]">
      {/* totals */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: C.violet }}><Home className="h-4 w-4" /> HOUSE BUILD SPEC</span>
        <span style={{ color: C.dim }}>Components <span className="tabular-nums" style={{ color: C.text }}>{est.count}</span></span>
        <span style={{ color: C.dim }}>Est. cost <span className="tabular-nums" style={{ color: C.gold }}>{fmtUsd(est.cost)}</span></span>
        <span style={{ color: C.dim }}>Parallel <span className="tabular-nums" style={{ color: C.green }}>~{est.parallelDays} days</span></span>
        <span style={{ color: C.dim }}>Sequential <span className="tabular-nums" style={{ color: C.dim }}>{est.sequentialDays} days</span></span>
        <button data-house-clear onClick={state.clearSpec} className="ml-auto rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>Clear</button>
      </div>

      {/* per-phase rollup bars (parallel install: MEP systems share one phase) */}
      <div className="flex flex-col gap-1">
        {est.byPhase.map((p) => (
          <div key={p.phase} data-house-phase={p.phase} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-[10px]" style={{ color: p.color }}>{p.label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded" style={{ background: "#0c1420" }}>
              <div className="h-full rounded" style={{ width: `${(p.days / maxPhaseDays) * 100}%`, background: p.color, opacity: 0.8 }} />
            </div>
            <span className="w-24 shrink-0 text-right text-[9px] tabular-nums" style={{ color: C.dim }}>{p.count}× · {p.days}d · {fmtUsd(p.cost)}</span>
          </div>
        ))}
      </div>

      {/* PARALLEL INSTALL TIMELINE — phase bars on a shared day-axis; overlaps show parallel install (R5). */}
      <div data-arch-timeline className="flex flex-col gap-1 rounded border p-2" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider" style={{ color: C.dim }}>
          <span style={{ color: C.cyan }}>Parallel install timeline</span>
          <span>· critical path <span className="tabular-nums" style={{ color: C.green }}>{sched.totalDays} days</span></span>
          {sched.savedDays > 0 && <span>· saves <span className="tabular-nums" style={{ color: C.gold }}>{sched.savedDays} days</span> vs sequential</span>}
        </div>
        <div className="relative" style={{ height: sched.phases.length * 18 + 4 }}>
          {sched.phases.map((p, i) => (
            <div key={p.phase} data-timeline-phase={p.phase} className="absolute flex items-center rounded px-1.5 text-[8px] font-semibold"
              style={{
                top: i * 18, height: 15,
                left: `${(p.start / (sched.totalDays || 1)) * 100}%`,
                width: `${Math.max(4, (p.days / (sched.totalDays || 1)) * 100)}%`,
                background: p.color, color: "#0a0e14", opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden",
              }}
              title={`${p.label}: day ${p.start}–${p.start + p.days}`}>
              {p.label}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[8px] tabular-nums" style={{ color: C.dim }}>
          <span>day 0</span><span>day {sched.totalDays}</span>
        </div>
      </div>

      {/* chosen components */}
      <div className="flex flex-wrap gap-1">
        {items.map((n) => {
          const e = componentEstimate(n.id);
          return (
            <span key={n.id} data-house-item={n.id} className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }}>
              <Layers className="h-3 w-3" style={{ color: e ? C.cyan : C.dim }} />
              {n.label}
              {e && <span style={{ color: C.dim }}>· {fmtUsd(e.cost)}</span>}
              <button data-house-remove={n.id} onClick={() => state.toggleSpec(n.id)} className="ml-0.5 rounded hover:bg-white/10"><X className="h-3 w-3" style={{ color: C.red }} /></button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
