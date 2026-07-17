"use client";

/**
 * ARCHITECT-2525 · RIGHT PANEL — Active Elements (top) + Selected Element (bottom).
 * =================================================================================================
 * Mirrors Security-2525 Mission Planning's ActiveItems(list) + ItemInspector(detail) split
 * (mission-planning.tsx:4409 / :4171). TOP third = "Active Elements" — the in-house components
 * (`state.spec`), each a button that selects it. BOTTOM two-thirds = "Selected Element" — the deep
 * detail (reuses `LayerInspector` wholesale), driven by a highlighted Vision-Tree row OR an
 * Active-Elements click. Empty Selected shows a quiet prompt until something is picked.
 */
import { Trash2, Boxes } from "lucide-react";
import { findLayer, type HomeType } from "@/lib/architect-layers";
import { LayerInspector } from "./layer-inspector";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", panel2: "#0c1420", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e" };

export function RightPanel({ selectedId, onSelect, state, homeType = "full" }: {
  selectedId?: string | null; onSelect?: (id: string) => void; state?: LayerState; homeType?: HomeType;
}) {
  const active = state ? Array.from(state.spec) : [];
  return (
    <div data-arch-right-panel className="flex flex-col gap-2">
      {/* TOP ~⅓ — ACTIVE ELEMENTS: the in-house components; click one to make it the Selected Element. */}
      <div data-arch-active-elements className="rounded-lg border" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-1 border-b px-2 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: C.border, color: C.cyan }}>
          <Boxes className="h-3 w-3" /> Active Elements <span style={{ color: C.dim }}>— {active.length}</span>
        </div>
        <div className="flex max-h-[28vh] flex-col gap-0.5 overflow-y-auto p-1">
          {active.length === 0 ? (
            <div className="px-1 py-2 text-[9px] leading-relaxed" style={{ color: C.dim }}>
              No active elements yet — add from the Vision Tree, drag one onto the map, or use 웃 HI / ◬ AI recommend.
            </div>
          ) : active.map((id) => {
            const f = findLayer(id); const label = f?.node.label ?? id; const sel = selectedId === id;
            return (
              <div key={id} className="group flex items-center gap-1 rounded px-1 py-0.5 hover:bg-white/5" style={{ background: sel ? "#221833" : "transparent" }}>
                <button data-active-el={id} onClick={() => onSelect?.(id)} className="min-w-0 flex-1 truncate text-left text-[10px]" style={{ color: sel ? C.violet : C.text }}>{label}</button>
                {state && (
                  <button data-active-remove={id} title="Remove from house" onClick={(e) => { e.stopPropagation(); state.toggleSpec(id); }}
                    className="shrink-0 rounded p-0.5 opacity-0 hover:bg-white/10 group-hover:opacity-100"><Trash2 className="h-3 w-3" style={{ color: C.dim }} /></button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ~⅔ — SELECTED ELEMENT: the deep detail (LayerInspector), null-prompt until picked. */}
      <div data-arch-selected-element className="rounded-lg border" style={{ borderColor: C.border }}>
        <div className="border-b px-2 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: C.border, color: C.violet }}>Selected Element</div>
        <div className="max-h-[56vh] overflow-y-auto p-2">
          <LayerInspector selectedId={selectedId} state={state} homeType={homeType} />
        </div>
      </div>
    </div>
  );
}
