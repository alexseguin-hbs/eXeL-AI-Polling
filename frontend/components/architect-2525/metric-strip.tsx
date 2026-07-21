"use client";

/**
 * ARCHITECT-2525 · METRIC STRIP (F4) — the minimum housing metrics, icon-led.
 * =================================================================================================
 * Operator (IMG_7419): "when I shrink Active Items I should see key housing metrics using icons —
 * Rooms, Bathrooms, Sq Foot, Windows, Doors, Electrical Outlets — that go onto the map when the menu
 * is hidden." Rendered as a compact overlay on the map by DesignWorkspace when the right rail is
 * collapsed. Values are the deterministic `programMetrics(...).counts` (+ sqft), never re-derived here.
 */
import { useMemo, useState } from "react";
import { LayoutGrid, Bath, Ruler, Square, DoorOpen, Plug, SlidersHorizontal } from "lucide-react";
import { programMetrics } from "@/lib/room-program";
import { BuildingProgram } from "./building-program";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };

export function MetricStrip({ state, overlay = false, homeType = "full" }: { state: LayerState; overlay?: boolean; homeType?: "full" | "tiny" | "multifamily" | "commercial" }) {
  const m = useMemo(() => programMetrics(state.globalParams, state.program, homeType), [state.globalParams, state.program, homeType]);
  // 3-state view (operator feedback FX-54): tap ••• to cycle  icons+number → icons+number+words → ••• only.
  // "dots" is the minimal footprint so the rail never covers critical UX.
  const [mode, setMode] = useState<"icons" | "words" | "dots">("icons");
  const cycleMode = () => setMode((v) => (v === "icons" ? "words" : v === "words" ? "dots" : "icons"));
  const showItems = mode !== "dots";
  const expanded = mode === "words";
  const [showProgram, setShowProgram] = useState(false); // operator IMG_7545: Building Program is a TOGGLE here, not atop Active Items
  const items: { icon: typeof Bath; label: string; value: string; color: string }[] = [
    { icon: LayoutGrid, label: "Rooms", value: `${m.counts.rooms}`, color: C.violet },
    { icon: Bath, label: "Baths", value: `${m.bathrooms}`, color: C.violet },
    { icon: Ruler, label: "Sq Ft", value: m.grossSqft.toLocaleString(), color: C.cyan },
    { icon: Square, label: "Windows", value: `${m.counts.windows}`, color: C.cyan },
    { icon: DoorOpen, label: "Doors", value: `${m.counts.doors}`, color: C.green },
    { icon: Plug, label: "Outlets", value: `${m.counts.outlets}`, color: C.gold },
  ];
  // Non-overlay (docked in a rail): the original wrap layout.
  if (!overlay) {
    return (
      <div data-arch-metricstrip className="flex flex-wrap gap-1">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} data-arch-metric={label.toLowerCase()} title={`${label}: ${value}`} className="flex items-center gap-1.5 px-1 text-[10px]">
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
            <span className="tabular-nums font-semibold" style={{ color }}>{value}</span>
            <span className="uppercase tracking-wide" style={{ color: C.dim, fontSize: 8 }}>{label}</span>
          </div>
        ))}
      </div>
    );
  }
  // OVERLAY (operator IMG_7484): a VERTICAL rail on the RIGHT, INSIDE the map border — one icon+number per row.
  // Collapsed = icons + numbers only; the ••• button expands to reveal the grey labels (widens the rail).
  return (
    <div data-arch-metricstrip data-arch-metric-mode={mode}
      className="pointer-events-auto absolute right-2 top-20 z-10 flex max-h-[72%] flex-col items-center gap-0.5 overflow-y-auto rounded-lg border px-1 py-1 shadow-lg"
      style={{ background: "#0a0f16e6", borderColor: C.border }}>{/* top-20 clears the 2D/3D · gear · Edit/Walk controls so the rail never covers critical UX (operator FX-54) */}
      {/* ••• — tap to CYCLE the 3 views: icons+number → +labels → dots only (operator FX-54). Centered, stacked. */}
      <button data-arch-metric-cycle onClick={cycleMode}
        title={`Metrics view: ${mode === "icons" ? "icons + number" : mode === "words" ? "icons + number + labels" : "hidden (••• only)"} — tap to cycle`}
        className="flex flex-col items-center justify-center gap-[3px] rounded p-0.5 hover:bg-white/10" style={{ marginBottom: showItems ? 2 : 0 }}>
        {[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full" style={{ background: C.cyan }} />)}
      </button>
      {showItems && items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} data-arch-metric={label.toLowerCase()} title={`${label}: ${value}`} className="flex items-center justify-center gap-1.5 px-1 text-[10px]">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
          <span className="tabular-nums font-semibold" style={{ color }}>{value}</span>
          {expanded && <span className="uppercase tracking-wide" style={{ color: C.dim, fontSize: 8 }}>{label}</span>}
        </div>
      ))}
      {/* Building Program TOGGLE — under the existing metric info (operator IMG_7545). Only when expanded. */}
      {expanded && (
        <>
          <button data-arch-program-toggle onClick={() => setShowProgram((v) => !v)} title="Building Program — bedrooms · baths · sqft · electric · plumbing"
            className="mt-0.5 flex items-center gap-1.5 rounded border px-1 py-0.5 text-[9px] font-semibold hover:bg-white/10" style={{ borderColor: C.border, color: showProgram ? C.cyan : C.dim }}>
            <SlidersHorizontal className="h-3 w-3 shrink-0" /> Program {showProgram ? "▾" : "▸"}
          </button>
          {showProgram && (
            <div data-arch-program-panel className="mt-0.5 max-h-[46vh] w-56 overflow-y-auto rounded border p-1" style={{ borderColor: C.border, background: "#0a0f16" }}>
              <BuildingProgram state={state} homeType={homeType} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
