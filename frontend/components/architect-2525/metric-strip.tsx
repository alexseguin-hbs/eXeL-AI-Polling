"use client";

/**
 * ARCHITECT-2525 · METRIC STRIP (F4) — the minimum housing metrics, icon-led.
 * =================================================================================================
 * Operator (IMG_7419): "when I shrink Active Items I should see key housing metrics using icons —
 * Rooms, Bathrooms, Sq Foot, Windows, Doors, Electrical Outlets — that go onto the map when the menu
 * is hidden." Rendered as a compact overlay on the map by DesignWorkspace when the right rail is
 * collapsed. Values are the deterministic `programMetrics(...).counts` (+ sqft), never re-derived here.
 */
import { LayoutGrid, Bath, Ruler, Square, DoorOpen, Plug } from "lucide-react";
import { programMetrics } from "@/lib/room-program";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };

export function MetricStrip({ state, overlay = false }: { state: LayerState; overlay?: boolean }) {
  const m = programMetrics(state.globalParams, state.program);
  const items: { icon: typeof Bath; label: string; value: string; color: string }[] = [
    { icon: LayoutGrid, label: "Rooms", value: `${m.counts.rooms}`, color: C.violet },
    { icon: Bath, label: "Baths", value: `${m.bathrooms}`, color: C.violet },
    { icon: Ruler, label: "Sq Ft", value: m.grossSqft.toLocaleString(), color: C.cyan },
    { icon: Square, label: "Windows", value: `${m.counts.windows}`, color: C.cyan },
    { icon: DoorOpen, label: "Doors", value: `${m.counts.doors}`, color: C.green },
    { icon: Plug, label: "Outlets", value: `${m.counts.outlets}`, color: C.gold },
  ];
  return (
    <div data-arch-metricstrip className={overlay ? "pointer-events-none absolute right-2 top-2 z-10 flex flex-col gap-1 rounded-lg border p-1.5 shadow-lg" : "flex flex-wrap gap-1"}
      style={overlay ? { background: "#0a0f16e6", borderColor: C.border } : undefined}>
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
