"use client";

/**
 * ARCHITECT-2525 · LAYER INSPECTOR — the RIGHT Context panel of the Design workspace.
 * =================================================================================================
 * Mirrors Security-2525's ItemInspector (mission-planning.tsx:4171): renders the selected Layer
 * Tree node's context — breadcrumb, scope, Level-3-Cube children, and scope-specific linked records.
 * Selection is the canonical "what exists" pointer (selectedLayerId, lifted to the shell). Returns a
 * quiet prompt when nothing is selected.
 */
import { Eye, EyeOff, Lock, Unlock, Crosshair, RotateCcw, Home, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { findLayer, flattenLayers, isVisibleForType, type LayerNode, type HomeType } from "@/lib/architect-layers";
import { assetIntel, assetRValue } from "@/lib/architect-assets";
import { assetTotalDays, DIGITAL_TWIN_PHASES } from "@/lib/vision2525/asset";
import { GATES, LAST_GATE, checkpointForGate, bandFor, AACE, classForGate, advanceGate, retreatGate } from "@/lib/architect-estimate";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", panel2: "#0c1420", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400", red: "#ef4444" };
const fmtUsd = (n: number) => "$" + Math.round(n).toLocaleString();
const RISK_COLOR: Record<string, string> = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const SCOPE_COLOR: Record<string, string> = { physical: C.violet, operational: C.cyan, lifecycle: C.green };
// Scope-specific "linked records" hint — what the Digital Twin references at this node (wiring is progressive).
const SCOPE_LINK: Record<string, string> = {
  physical: "Documents · Simulations · Reviews reference this system",
  operational: "Cross-cutting reference layer — read by every workspace",
  lifecycle: "Generated post-occupancy — Assets · Warranty · Service History",
};

export function LayerInspector({ selectedId, state, homeType = "full" }: { selectedId?: string | null; state?: LayerState; homeType?: HomeType }) {
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
  // Honor the Tiny Home filter so "Contains" matches what the tree offers (R3).
  const kids: LayerNode[] = (node.children ?? []).filter((c) => isVisibleForType(c.id, scope.id, homeType));
  const leafCount = flattenLayers([node]).filter((n) => !n.children?.length && isVisibleForType(n.id, scope.id, homeType)).length;
  const isHidden = !!state?.hidden.has(node.id);
  const isLocked = !!state?.locked.has(node.id);
  // "Add to house" (R4) — a leaf toggles itself; a branch/system adds all its buildable leaves. Level 3
  // Cubes are NOT buildable, and the leaf set honors the Tiny Home filter (so "Add system" never adds
  // components the tree doesn't offer).
  const canBuild = node.id.startsWith("physical/") && !node.level3;
  const leafDescendants = flattenLayers([node]).filter((n) => !n.children?.length && !n.level3 && isVisibleForType(n.id, scope.id, homeType));
  const inHouse = !!state && canBuild && leafDescendants.length > 0 && leafDescendants.every((n) => state.spec.has(n.id));
  const addToHouse = () => {
    if (!state) return;
    if (kids.length) { inHouse ? leafDescendants.forEach((n) => state.spec.has(n.id) && state.toggleSpec(n.id)) : state.addSpecIds(leafDescendants.map((n) => n.id)); }
    else state.toggleSpec(node.id);
  };

  // Asset Intelligence (Inc 2) — a leaf physical component IS an asset; render the shared Asset record.
  const isAsset = canBuild && !kids.length;
  const ov = state?.assetOverrides?.[node.id] ?? {};
  // Inc 4 — the project stage gate drives the asset estimate through the reused estimate engine: advancing a
  // gate raises confidence + narrows the ± band. Human Authority (checkpointForGate) shows who must sign off.
  const gate = state?.gate ?? 3;
  const asset = isAsset ? assetIntel(node.id, { gateIdx: gate }, ov) : null;
  const rValue = isAsset ? assetRValue(node.id, ov) : 0;
  const phaseIdx = asset ? DIGITAL_TWIN_PHASES.indexOf(asset.status.phase) : 0;
  const stepPhase = (d: number) => {
    if (!state || !asset) return;
    const i = Math.max(0, Math.min(DIGITAL_TWIN_PHASES.length - 1, phaseIdx + d));
    state.setAssetOverride(node.id, { phase: DIGITAL_TWIN_PHASES[i] });
  };
  const Row = ({ k, v, c }: { k: string; v: string; c?: string }) => (
    <div className="flex items-center justify-between gap-2"><span style={{ color: C.dim }}>{k}</span><span className="tabular-nums" style={{ color: c ?? C.text }}>{v}</span></div>
  );

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

      {/* SETTINGS for THIS single item (Security asset-inspector model) — visibility · lock · isolate · reveal all */}
      {state && (
        <div data-inspect-actions className="flex flex-wrap items-center gap-1.5 rounded border p-1.5" style={{ borderColor: C.border }}>
          {canBuild && (
            <button data-inspect-ctl="house" onClick={addToHouse}
              className="flex items-center gap-1 rounded border px-1.5 py-1 text-[9px] font-semibold hover:bg-white/5"
              style={{ borderColor: inHouse ? C.green : C.violet, color: inHouse ? C.green : C.violet, background: inHouse ? "#0c1420" : "transparent" }}>
              {inHouse ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {inHouse ? "In house" : (kids.length ? "Add system" : "Add to house")}
              <Home className="h-3 w-3" />
            </button>
          )}
          <button data-inspect-ctl="visibility" onClick={() => state.toggleHidden(node.id)}
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[9px] hover:bg-white/5"
            style={{ borderColor: C.border, color: isHidden ? C.dim : C.text }}>
            {isHidden ? <EyeOff className="h-3 w-3" style={{ color: C.dim }} /> : <Eye className="h-3 w-3" style={{ color: C.cyan }} />}
            {isHidden ? "Hidden" : "Visible"}
          </button>
          <button data-inspect-ctl="lock" onClick={() => state.toggleLocked(node.id)}
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[9px] hover:bg-white/5"
            style={{ borderColor: C.border, color: isLocked ? C.gold : C.text }}>
            {isLocked ? <Lock className="h-3 w-3" style={{ color: C.gold }} /> : <Unlock className="h-3 w-3" style={{ color: C.dim }} />}
            {isLocked ? "Locked" : "Unlocked"}
          </button>
          <button data-inspect-ctl="isolate" onClick={() => state.isolate(node)}
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[9px] hover:bg-white/5" style={{ borderColor: C.border, color: C.text }}>
            <Crosshair className="h-3 w-3" style={{ color: C.violet }} /> Isolate
          </button>
          <button data-inspect-ctl="reveal" onClick={() => state.revealAll()}
            className="flex items-center gap-1 rounded border px-1.5 py-1 text-[9px] hover:bg-white/5" style={{ borderColor: C.border, color: C.dim }}>
            <RotateCcw className="h-3 w-3" /> Reveal all
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: "#0c1420", color }}>{scope.label}</span>
        {node.level3 && <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: "#0c1420", color: C.cyan }}>Level 3 Substrate</span>}
        <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: "#0c1420", color: C.dim }}>{kids.length ? `${kids.length} children · ${leafCount} leaves` : "leaf"}</span>
        {asset && <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: "#0c1420", color: RISK_COLOR[asset.status.risk] }}>{asset.status.risk} risk</span>}
      </div>

      {/* ASSET INTELLIGENCE — the shared Vision-2525 Asset record for this component (Inc 2). */}
      {asset && state && (
        <div data-arch-asset data-asset-id={asset.id} className="flex flex-col gap-2 rounded border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
          <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
            <span>Asset Intelligence</span>
            <span style={{ color: C.dim }}>AACE {asset.status.aaceClass} · {asset.status.confidence}% conf</span>
          </div>

          {/* Digital-Twin status stepper (Human Authority advances qualification) */}
          <div data-asset-status className="flex items-center gap-1.5">
            <button data-asset-status-prev onClick={() => stepPhase(-1)} className="rounded border p-0.5 hover:bg-white/10" style={{ borderColor: C.border }}><ChevronLeft className="h-3 w-3" style={{ color: C.dim }} /></button>
            <span className="flex-1 rounded py-1 text-center text-[9px] font-semibold uppercase" style={{ background: "#152238", color: C.violet }}>{asset.status.phase}</span>
            <button data-asset-status-next onClick={() => stepPhase(1)} className="rounded border p-0.5 hover:bg-white/10" style={{ borderColor: C.border }}><ChevronRight className="h-3 w-3" style={{ color: C.cyan }} /></button>
          </div>
          <div className="text-[8px]" style={{ color: C.dim }}>Human Authority advances the Digital-Twin status (Designed → … → Operational). Every step is logged to Replay.</div>

          {/* HUMAN AUTHORITY · QUALIFICATION GATE (Inc 4) — who must sign off at the current stage gate, and the
              estimate cone (AACE band on installed cost) that TIGHTENS as gates advance. Reuses architect-estimate. */}
          {(() => {
            const cp = checkpointForGate(gate);
            const band = bandFor(asset.cost.installed, gate);
            const cls = classForGate(gate);
            const anyPending = Object.values(asset.status.qualification).some((s) => s !== "approved");
            return (
              <div data-asset-authority className="flex flex-col gap-1 rounded border p-1.5" style={{ borderColor: anyPending ? C.gold : C.green, background: "#0c1420" }}>
                <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.gold }}>
                  <span>Human Authority · {GATES[gate]}</span>
                  <span style={{ color: C.dim }}>AACE {cls} · {AACE[cls].label}</span>
                </div>
                <Row k="Required decision" v={cp.decision} c={C.text} />
                <div data-asset-authority-who className="flex items-center justify-between gap-2"><span style={{ color: C.dim }}>Responsible authority</span><span style={{ color: C.violet }}>{cp.authority}</span></div>
                <Row k="Evidence" v={cp.evidence} c={C.dim} />
                <Row k="Estimate cone (installed)" v={`${fmtUsd(band.lo)} – ${fmtUsd(band.hi)} · ±${Math.round(band.pct * 100)}%`} c={C.gold} />
                {anyPending && <div className="text-[8px]" style={{ color: C.gold }}>⚠ Qualification pending — {cp.authority} sign-off required before this asset is qualified.</div>}
                {state && (
                  <div className="flex items-center gap-1.5">
                    <button data-authority-retreat onClick={() => state.setGate(retreatGate(gate))} disabled={gate === 0}
                      className="rounded border px-1.5 py-0.5 text-[9px] hover:bg-white/10" style={{ borderColor: C.border, color: gate === 0 ? C.dim : C.text }}>◀ back</button>
                    <span className="flex-1 text-center text-[8px]" style={{ color: C.dim }}>decision → tighter estimate</span>
                    <button data-authority-advance onClick={() => state.setGate(advanceGate(gate))} disabled={gate === LAST_GATE}
                      className="rounded border px-1.5 py-0.5 text-[9px] font-bold hover:bg-white/10" style={{ borderColor: C.gold, color: gate === LAST_GATE ? C.dim : C.gold }}>advance ▶</button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Cost intelligence */}
          <div data-asset-cost className="flex flex-col gap-0.5">
            <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Cost</div>
            <Row k="Material" v={fmtUsd(asset.cost.material)} />
            <Row k="Labor" v={fmtUsd(asset.cost.labor)} />
            <Row k="Equipment" v={fmtUsd(asset.cost.equipment)} />
            <Row k="Subcontract" v={fmtUsd(asset.cost.subcontract)} />
            <Row k="Installed" v={fmtUsd(asset.cost.installed)} c={C.gold} />
            <Row k="Replacement · Lifecycle" v={`${fmtUsd(asset.cost.replacement)} · ${fmtUsd(asset.cost.lifecycle)}`} c={C.dim} />
          </div>

          {/* Schedule intelligence */}
          <div data-asset-schedule className="flex flex-col gap-0.5">
            <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Schedule (days)</div>
            <Row k="Eng · Proc · Fab" v={`${asset.schedule.engineering} · ${asset.schedule.procurement} · ${asset.schedule.fabrication}`} />
            <Row k="Ship · Install · Insp · Comm" v={`${asset.schedule.shipping} · ${asset.schedule.installation} · ${asset.schedule.inspection} · ${asset.schedule.commissioning}`} />
            <Row k="Total duration" v={`${assetTotalDays(asset)} days`} c={C.green} />
          </div>

          {/* Procurement + energy + economy */}
          <div className="flex flex-col gap-0.5">
            <Row k="Lead time" v={`${asset.procurement.leadTime} days`} />
            <Row k="Unit price" v={fmtUsd(asset.procurement.unitPrice)} />
            {rValue > 0 && <Row k="Insulation R-value" v={`R-${rValue}`} c={C.cyan} />}
            <Row k="MoT (minutes)" v={`${asset.economy.mot} min`} c={C.violet} />
            {/* Trinity = three distinct ledgers (◬ AI · ♡ spiritual · 웃 human), never collapsed to one (MoT #2). */}
            <div data-asset-trinity className="flex items-center justify-between gap-2">
              <span style={{ color: C.dim }}>Trinity ledgers</span>
              <span className="tabular-nums" style={{ color: C.violet }}>
                <span data-trinity-ai>◬ {asset.economy.trinity.ai}</span>{" · "}
                <span data-trinity-spiritual>♡ {asset.economy.trinity.spiritual}</span>{" · "}
                <span data-trinity-human>웃 {asset.economy.trinity.human}</span>
              </span>
            </div>
            <Row k="Time Capital" v={fmtUsd(asset.economy.timeCapital)} c={C.gold} />
          </div>

          {/* CUSTOMIZATIONS — live recalculation + validation + Replay */}
          <div data-asset-customize className="flex flex-col gap-1 rounded border p-1.5" style={{ borderColor: C.border }}>
            <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Customize</div>
            <label className="flex items-center justify-between gap-2 text-[9px]" style={{ color: C.text }}>
              <span>Quantity</span>
              <input data-asset-qty type="number" min={1} value={asset.quantities.count}
                onChange={(e) => state.setAssetOverride(node.id, { quantity: Math.max(1, Math.round(+e.target.value || 1)) })}
                className="w-16 rounded border bg-transparent px-1 py-0.5 text-right tabular-nums" style={{ borderColor: C.border, color: C.text }} />
            </label>
            <label className="flex items-center justify-between gap-2 text-[9px]" style={{ color: C.text }}>
              <span>Premium upgrade (+R / +25% cost)</span>
              <button data-asset-upgrade onClick={() => state.setAssetOverride(node.id, { upgraded: !ov.upgraded })}
                className="rounded border px-1.5 py-0.5 text-[9px] font-semibold" style={{ borderColor: ov.upgraded ? C.green : C.border, color: ov.upgraded ? C.green : C.dim }}>
                {ov.upgraded ? "On" : "Off"}
              </button>
            </label>
            <label className="flex items-center justify-between gap-2 text-[9px]" style={{ color: C.text }}>
              <span>Supplier</span>
              <input data-asset-supplier type="text" value={asset.procurement.preferredSupplier} placeholder="—"
                onChange={(e) => state.setAssetOverride(node.id, { supplier: e.target.value })}
                className="w-24 rounded border bg-transparent px-1 py-0.5 text-right" style={{ borderColor: C.border, color: C.text }} />
            </label>
          </div>

          {/* SSSES qualification (per-asset readiness) */}
          <div data-asset-ssses className="flex flex-wrap gap-1">
            {(["security", "stability", "scalability", "efficiency", "succinctness"] as const).map((k) => (
              <span key={k} className="rounded px-1 py-0.5 text-[7px] uppercase" style={{ background: "#0c1420", color: C.dim }}>{k[0]}:{asset.status.qualification[k][0]}</span>
            ))}
          </div>
        </div>
      )}

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
