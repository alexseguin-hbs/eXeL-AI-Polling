"use client";

/**
 * ARCHITECT-2525 · HOUSE BUILD SPEC panel — the expandable bottom section of the Design workspace.
 * Shows the house the user has wireframed by SELECTING components (R4): totals (count · cost · time),
 * a per-phase rollup, and the chosen components grouped by install phase, each removable. Parallel
 * install time (overlapping phases) is shown alongside the naive sequential total.
 */
import { X, Home, Layers } from "lucide-react";
import { houseEstimate, houseSchedule, componentEstimate } from "@/lib/architect-house";
import { projectRollup, styleEquivalence } from "@/lib/architect-project";
import { findLayer, type LayerNode, type HomeType } from "@/lib/architect-layers";
import { type LayerState } from "./use-layer-state";
import { HouseSchematic } from "./house-schematic";
import { BimIO } from "./bim-io";

const C = { border: "#1e2b3a", panel: "#111826", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400", red: "#ef4444" };
const fmtUsd = (n: number) => "$" + Math.round(n).toLocaleString();

export function HouseSpec({ state, homeType = "full", selectedId, onSelect, onLoadArchitect }: { state: LayerState; homeType?: HomeType; selectedId?: string | null; onSelect?: (id: string) => void; onLoadArchitect?: (file: import("@/lib/architect-project-file").ArchitectProjectFile) => void }) {
  const ids = Array.from(state.spec);
  const est = houseEstimate(ids);

  if (est.count === 0) {
    return (
      <div data-arch-house-spec data-house-count="0" className="flex flex-col gap-3 text-[11px]" style={{ color: C.dim }}>
        <div className="flex flex-wrap items-center gap-4">
          <HouseSchematic state={state} selectedId={selectedId} onSelect={onSelect} />
          <div className="flex-1">
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: C.violet }}><Home className="h-4 w-4" /> Wireframe your house</span>
            <div className="mt-1">Select a component in the Layer Tree, then <span style={{ color: C.text }}>Add&nbsp;to&nbsp;house</span> in the Context panel — or <span style={{ color: C.text }}>Import BIM</span> below. The cross-section fills in as you go.</div>
          </div>
        </div>
        <BimIO state={state} homeType={homeType} onLoadArchitect={onLoadArchitect} />
      </div>
    );
  }

  const maxPhaseDays = Math.max(...est.byPhase.map((p) => p.days), 1);
  const sched = houseSchedule(ids);
  // spec ids resolved to their (leaf) component nodes — excludes any non-buildable (level3) ids so the
  // chip list matches exactly what houseEstimate counts/prices (specLeafIds also drops level3).
  const items = ids.map((id) => findLayer(id)?.node).filter((n): n is LayerNode => !!n && !n.children?.length && !n.level3);

  return (
    <div data-arch-house-spec data-house-count={est.count} className="flex flex-col gap-3 text-[11px] md:flex-row md:items-start md:gap-4">
      <div className="shrink-0"><HouseSchematic state={state} selectedId={selectedId} onSelect={onSelect} /></div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
      {/* totals */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: C.violet }}><Home className="h-4 w-4" /> HOUSE BUILD SPEC</span>
        <span style={{ color: C.dim }}>Components <span className="tabular-nums" style={{ color: C.text }}>{est.count}</span></span>
        <span style={{ color: C.dim }}>Est. cost <span className="tabular-nums" style={{ color: C.gold }}>{fmtUsd(est.cost)}</span></span>
        <span style={{ color: C.dim }}>Parallel <span className="tabular-nums" style={{ color: C.green }}>~{est.parallelDays} days</span></span>
        <span style={{ color: C.dim }}>Sequential <span className="tabular-nums" style={{ color: C.dim }}>{est.sequentialDays} days</span></span>
        <button data-house-clear onClick={state.clearSpec} className="ml-auto rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>Clear</button>
      </div>

      {/* GLOBAL BUILDING PARAMS (S5) — whole-project inputs that LIVE-RECALCULATE the rollup below. */}
      <div data-arch-global-params className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border px-2 py-1" style={{ borderColor: C.border }}>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Building</span>
        <label className="flex items-center gap-1" style={{ color: C.dim }}>Area
          <input data-param-area type="number" min={200} max={100000} step={100} value={state.globalParams.areaSqft}
            onChange={(e) => state.setGlobalParams({ areaSqft: Math.max(200, Math.min(100000, Math.round(Number(e.target.value) || 200))) })}
            className="w-16 rounded border bg-transparent px-1 py-0.5 text-right text-[10px] tabular-nums" style={{ borderColor: C.border, color: C.text }} /> ft²</label>
        <span className="flex items-center gap-1" style={{ color: C.dim }}>Stories
          <button data-param-stories-dec onClick={() => state.setGlobalParams({ stories: Math.max(1, state.globalParams.stories - 1) })} className="rounded border px-1 leading-none" style={{ borderColor: C.border, color: C.text }}>−</button>
          <span className="tabular-nums" style={{ color: C.text }}>{state.globalParams.stories}</span>
          <button data-param-stories-inc onClick={() => state.setGlobalParams({ stories: Math.min(60, state.globalParams.stories + 1) })} className="rounded border px-1 leading-none" style={{ borderColor: C.border, color: C.text }}>+</button></span>
        <label className="flex items-center gap-1" style={{ color: C.dim }}>Finish
          <select data-param-finish value={state.globalParams.finish} onChange={(e) => state.setGlobalParams({ finish: e.target.value as "standard" | "premium" | "luxury" })}
            className="rounded border bg-transparent px-1 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>
            <option value="standard">Standard</option><option value="premium">Premium</option><option value="luxury">Luxury</option>
          </select></label>
        {/* HOUSE STYLE — mock Standard vs Stylized and see the equivalent usable square footage (operator). */}
        <span className="flex items-center gap-1" style={{ color: C.dim }}>Style
          {(["standard", "stylized"] as const).map((s) => (
            <button key={s} data-param-style={s} onClick={() => state.setGlobalParams({ style: s })}
              className="rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase"
              style={{ borderColor: C.border, background: (state.globalParams.style ?? "standard") === s ? "#0e2233" : "transparent", color: (state.globalParams.style ?? "standard") === s ? C.cyan : C.dim }}>{s}</button>
          ))}
        </span>
        {(() => { const e = styleEquivalence(state.globalParams); return (
          <span data-arch-style-equiv className="tabular-nums" style={{ color: C.dim }}>
            Usable <span style={{ color: C.text }}>{e.usable.toLocaleString()} ft²</span> · ≡ <span style={{ color: C.cyan }}>{e.equivalentStandardGross.toLocaleString()} ft²</span> standard
          </span>
        ); })()}
      </div>

      {/* PROJECT ROLLUP & QUALIFICATION (Inc 6) — the real spec rolled up at the current gate, REUSING the estimate
          engine, scaled live by the global building params (S5). Gate is referenced (frameworkId + sequence +
          status), never a literal G8; SSSES is a score+status. */}
      {(() => {
        const roll = projectRollup(ids, state.gate, state.globalParams);
        const ss = { passed: C.green, in_progress: C.cyan, warning: C.gold, blocked: C.red, not_assessed: C.dim }[roll.ssses.status];
        return (
          <div data-arch-project-rollup data-gate-seq={roll.gate.sequence} data-ssses-score={roll.ssses.score}
            data-rollup-cost={roll.costUsd} data-rollup-scale={roll.scale}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border px-2 py-1" style={{ borderColor: C.border, background: C.panel }}>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.violet }}>Project rollup</span>
            <span style={{ color: C.dim }}>Scale <span className="tabular-nums" style={{ color: C.text }}>×{roll.scale}</span></span>
            <span style={{ color: C.dim }}>AACE <span style={{ color: C.text }}>Class&nbsp;{roll.aaceClass} · {roll.aaceLabel}</span></span>
            <span style={{ color: C.dim }}>Confidence <span className="tabular-nums" style={{ color: C.cyan }}>{roll.confidencePct}%</span></span>
            <span style={{ color: C.dim }}>Cost band <span className="tabular-nums" style={{ color: C.gold }}>{fmtUsd(roll.costBand.lo)}–{fmtUsd(roll.costBand.hi)}</span> <span className="tabular-nums">±{Math.round(roll.costBand.pct * 100)}%</span></span>
            <span style={{ color: C.dim }} title={`Framework ${roll.gate.frameworkId}`}>Gate <span style={{ color: C.text }}>{roll.gate.gateId}</span> <span className="uppercase" style={{ color: C.cyan }}>{roll.gate.status.replace("_", " ")}</span></span>
            <span style={{ color: C.dim }}>SSSES <span className="tabular-nums" style={{ color: ss }}>{roll.ssses.score}</span> <span className="uppercase" style={{ color: ss }}>{roll.ssses.status.replace("_", " ")}</span></span>
          </div>
        );
      })()}

      {/* BIM I/O — generate a BIM-compatible model or import one (Inc 1). */}
      <BimIO state={state} homeType={homeType} onLoadArchitect={onLoadArchitect} />

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
                width: `${Math.min(100 - (p.start / (sched.totalDays || 1)) * 100, Math.max(4, (p.days / (sched.totalDays || 1)) * 100))}%`,
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
    </div>
  );
}
