"use client";

/**
 * ARCHITECT-2525 · LAYER INSPECTOR — the RIGHT Context panel of the Design workspace.
 * =================================================================================================
 * Mirrors Security-2525's ItemInspector (mission-planning.tsx:4171): renders the selected Layer
 * Tree node's context — breadcrumb, scope, Level-3-Cube children, and scope-specific linked records.
 * Selection is the canonical "what exists" pointer (selectedLayerId, lifted to the shell). Returns a
 * quiet prompt when nothing is selected.
 */
import { findLayer, flattenLayers, type LayerNode } from "@/lib/architect-layers";

const C = { border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400" };
const SCOPE_COLOR: Record<string, string> = { physical: C.violet, operational: C.cyan, lifecycle: C.green };
// Scope-specific "linked records" hint — what the Digital Twin references at this node (wiring is progressive).
const SCOPE_LINK: Record<string, string> = {
  physical: "Documents · Simulations · Reviews reference this system",
  operational: "Cross-cutting reference layer — read by every workspace",
  lifecycle: "Generated post-occupancy — Assets · Warranty · Service History",
};

export function LayerInspector({ selectedId }: { selectedId?: string | null }) {
  if (!selectedId) {
    return (
      <div className="text-[10px] leading-relaxed" style={{ color: C.dim }}>
        Select a layer to inspect its properties, Level&nbsp;3 Cubes, and linked records.
      </div>
    );
  }
  const found = findLayer(selectedId);
  if (!found) return <div className="text-[10px]" style={{ color: C.dim }}>Unknown layer.</div>;
  const { node, scope, path } = found;
  const color = SCOPE_COLOR[scope.id] ?? C.text;
  const kids: LayerNode[] = node.children ?? [];
  const leafCount = flattenLayers([node]).filter((n) => !n.children?.length).length;

  return (
    <div data-arch-layer-inspector data-inspect-id={node.id} className="flex flex-col gap-2 text-[10px]">
      {/* breadcrumb: scope › … › parent */}
      <div className="truncate text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>
        {scope.label}{path.length > 1 ? " › " + path.slice(0, -1).map((n) => n.label).join(" › ") : ""}
      </div>
      {/* title + badges */}
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold" style={{ color: node.level3 ? C.cyan : C.text }}>{node.label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: "#0c1420", color }}>{scope.label}</span>
        {node.level3 && <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: "#0c1420", color: C.cyan }}>Level 3 Substrate</span>}
        <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: "#0c1420", color: C.dim }}>{kids.length ? `${kids.length} children · ${leafCount} leaves` : "leaf"}</span>
      </div>

      {/* children */}
      {kids.length > 0 && (
        <div className="rounded border p-1.5" style={{ borderColor: C.border }}>
          <div className="mb-1 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Contains</div>
          <div className="flex flex-col gap-0.5">
            {kids.map((k) => (
              <div key={k.id} data-inspect-child className="truncate" style={{ color: k.level3 ? C.cyan : C.text }}>· {k.label}</div>
            ))}
          </div>
        </div>
      )}

      {/* Level 3 Cubes note */}
      {node.level3 && (
        <div className="rounded border p-1.5 text-[9px] leading-relaxed" style={{ borderColor: C.border, color: C.dim }}>
          The Level 3 innovation substrate (Cubes 19–27) attaches here — Concept/Model Ingest, De-Risk
          gates, Estimator, Governance &amp; Quote Board — scoped to this physical system.
        </div>
      )}

      {/* linked records (progressive wiring) */}
      <div className="rounded border p-1.5 text-[9px] leading-relaxed" style={{ borderColor: C.border, color: C.dim }}>
        <span className="font-semibold" style={{ color: C.dim }}>Linked</span> — {SCOPE_LINK[scope.id]}.
      </div>
    </div>
  );
}
