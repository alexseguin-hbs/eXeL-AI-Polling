"use client";

/**
 * ARCHITECT-2525 · Decisions → Tighter Estimates surface (Build → Estimate). Sprint 4.
 * ===================================================================================
 * The homeowner advances building gates; each decision matures the estimate — confidence RISES and the
 * cost/man-hour ± band NARROWS (the cone of uncertainty). Human Authority Checkpoint shows who must decide
 * before advancing. Driven by lib/architect-estimate.ts (pure, AACE-grounded). Self-contained SVG chart.
 */
import { useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import {
  DEFAULT_SECTIONS, GATES, LAST_GATE, rollupProject, bandPctForGate,
  advanceGate, retreatGate, checkpointForGate, confidenceForGate, type Rag,
} from "@/lib/architect-estimate";
import { proForma } from "@/lib/architect-proforma";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", red: "#ef4444" };
const RAG_C: Record<Rag, string> = { green: C.green, amber: C.amber, red: C.red };
const fmtUsd = (n: number) => `$${Math.round(n).toLocaleString()}`;

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
      <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.dim }}>{label}</div>
      <div className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: color ?? C.text }}>{value}</div>
      {sub && <div className="text-[8px]" style={{ color: C.dim }}>{sub}</div>}
    </div>
  );
}

export function ArchitectEstimate() {
  const { t } = useLexicon();
  const [gate, setGate] = useState(3);
  const sections = DEFAULT_SECTIONS;
  const roll = rollupProject(sections, gate);
  const cp = checkpointForGate(gate);

  // Cone-of-uncertainty geometry (cost). Center line = total; envelope = ±band, narrowing across gates.
  const center = roll.costUsd || 1;
  const gs = Array.from({ length: LAST_GATE + 1 }, (_, g) => g);
  const xOf = (g: number) => 6 + (g / LAST_GATE) * 90;
  const yOf = (v: number) => Math.max(6, Math.min(94, 50 - ((v / center) - 1) * 72.73)); // 0.55 dev → ~40 units
  const upper = gs.map((g) => `${xOf(g).toFixed(1)},${yOf(center * (1 + bandPctForGate(g))).toFixed(1)}`);
  const lower = gs.map((g) => `${xOf(g).toFixed(1)},${yOf(center * (1 - bandPctForGate(g))).toFixed(1)}`);
  const conePoly = [...upper, ...[...lower].reverse()].join(" ");
  const gx = xOf(gate);

  return (
    <div data-arch-estimate className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>DECISIONS → TIGHTER ESTIMATES · QUALIFICATION ENGINE</div>
        <div className="text-[9px]" style={{ color: C.dim }}>{t("arch.estimate.narrowsCone")}</div>
      </div>

      {/* Rollup — the tightening numbers */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Man-hours" value={roll.manHours.toLocaleString()} sub={`${roll.hoursBand.lo.toLocaleString()}–${roll.hoursBand.hi.toLocaleString()}`} color={C.cyan} />
        <Tile label="Cost" value={fmtUsd(roll.costUsd)} sub={`${fmtUsd(roll.costBand.lo)}–${fmtUsd(roll.costBand.hi)}`} color={C.gold} />
        <Tile label="Confidence" value={`${roll.confidencePct}%`} sub={`±${Math.round(roll.costBand.pct * 100)}% band`} color={roll.confidencePct >= 85 ? C.green : roll.confidencePct >= 60 ? C.amber : C.red} />
        <Tile label="AACE Class" value={`Class ${roll.aaceClass}`} sub={roll.aaceLabel} color={C.violet} />
        <Tile label="Gate" value={GATES[gate].split(" ")[0]} sub={GATES[gate].split(" ").slice(1).join(" ")} color={C.text} />
      </div>

      {/* Gate ladder — advance a gate → the estimate tightens */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>{t("arch.estimate.stageGates")}</span>
          <div className="flex gap-1">
            <button data-est-back onClick={() => setGate(retreatGate(gate))} disabled={gate === 0} className="rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: gate === 0 ? C.dim : C.text }}>◀ back</button>
            <button data-est-advance onClick={() => setGate(advanceGate(gate))} disabled={gate === LAST_GATE} className="rounded border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: C.gold, color: gate === LAST_GATE ? C.dim : C.gold }}>advance ▶</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {GATES.map((g, i) => (
            <button key={g} onClick={() => setGate(i)} title={g} className="rounded border px-1.5 py-0.5 text-[8px]"
              style={{ borderColor: C.border, color: i < gate ? C.green : i === gate ? C.gold : C.dim, background: i === gate ? "#221833" : "transparent" }}>
              {g.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        {/* CONE OF UNCERTAINTY — cost band narrowing as gates advance */}
        <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
          <div className="mb-1 text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>{t("arch.estimate.coneOfUncertainty")}</div>
          <svg data-arch-cone viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full rounded" style={{ background: "#05070d", aspectRatio: "2.2 / 1" }}>
            {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={6} y1={6 + f * 88} x2={96} y2={6 + f * 88} stroke="#141d29" strokeWidth="0.3" />)}
            <polygon points={conePoly} fill={`${C.gold}22`} stroke={C.gold} strokeWidth="0.4" opacity="0.9" />
            <line x1={xOf(0)} y1={50} x2={xOf(LAST_GATE)} y2={50} stroke={C.gold} strokeWidth="0.6" strokeDasharray="1.5 1" />
            <line data-cone-marker x1={gx} y1={6} x2={gx} y2={94} stroke={C.cyan} strokeWidth="0.5" />
            <circle cx={gx} cy={50} r="1.6" fill={C.cyan} />
            <text x={6} y={99} fontSize="3" fill={C.dim} style={{ fontFamily: "monospace" }}>G0</text>
            <text x={90} y={99} fontSize="3" fill={C.dim} style={{ fontFamily: "monospace" }}>G13</text>
          </svg>
          <div className="mt-0.5 text-[8px]" style={{ color: C.dim }}>{t("arch.estimate.coneCaption")}</div>
        </div>

        {/* HUMAN AUTHORITY CHECKPOINT — who must decide before advancing */}
        <div data-arch-checkpoint className="space-y-1 rounded-lg border p-2 text-[10px]" style={{ borderColor: C.violet, background: C.panel }}>
          <div className="text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>HUMAN AUTHORITY CHECKPOINT</div>
          <div><span style={{ color: C.dim }}>Gate:</span> <span style={{ color: C.gold }}>{GATES[gate]}</span></div>
          <div><span style={{ color: C.dim }}>{t("arch.estimate.decisionRequired")}</span> <span style={{ color: C.text }}>{cp.decision}</span></div>
          <div><span style={{ color: C.dim }}>{t("arch.estimate.responsibleAuthority")}</span> <span style={{ color: C.cyan }}>{cp.authority}</span></div>
          <div><span style={{ color: C.dim }}>Evidence:</span> <span style={{ color: C.text }}>{cp.evidence}</span></div>
          <div className="flex items-center justify-between border-t pt-1" style={{ borderColor: C.border }}>
            <span><span style={{ color: C.dim }}>Confidence:</span> <span style={{ color: C.green }}>{confidenceForGate(gate)}%</span></span>
            <span style={{ color: C.dim }}>{t("arch.estimate.replayAvailable")}</span>
          </div>
        </div>
      </div>

      {/* Work sections — the breakdown, with RAG gate-review status */}
      <div data-arch-sections className="overflow-x-auto rounded-lg border" style={{ borderColor: C.border, background: C.panel }}>
        <table className="w-full text-[10px]" style={{ minWidth: 420 }}>
          <thead><tr style={{ color: C.dim }}>
            {["", "Work section", "Trade", "Man-hrs", "Cost", "± band"].map((h) => <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {sections.map((w) => (
              <tr key={w.id} data-est-section className="border-t" style={{ borderColor: "#141d29" }}>
                <td className="px-2 py-1"><span style={{ color: RAG_C[w.rag] }}>●</span></td>
                <td className="px-2 py-1" style={{ color: C.text }}>{w.name}</td>
                <td className="px-2 py-1" style={{ color: C.dim }}>{w.trade}</td>
                <td className="px-2 py-1 tabular-nums" style={{ color: C.cyan }}>{w.manHours.toLocaleString()}</td>
                <td className="px-2 py-1 tabular-nums" style={{ color: C.gold }}>{fmtUsd(w.costUsd)}</td>
                <td className="px-2 py-1 tabular-nums" style={{ color: C.dim }}>±{Math.round(bandPctForGate(gate) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* THE HOME BUILDING PROCESS — the developer pro-forma (reference) that wraps the build. Two truths kept
          distinct: "build the home" (from your design) and "develop + sell" (the full project). */}
      {(() => {
        const pf = proForma();
        return (
          <div data-arch-proforma className="space-y-2 rounded-lg border p-2" style={{ borderColor: C.gold, background: C.panel }}>
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <span className="text-[11px] font-bold tracking-wider" style={{ color: C.gold }}>THE HOME BUILDING PROCESS</span>
              <span className="text-[8px]" style={{ color: C.dim }}>developer pro-forma · reference · wraps the build</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]" style={{ minWidth: 440 }}>
                <thead><tr style={{ color: C.dim }}>
                  {["#", "Stage", "Cost", "Basis", "Days", "Decides"].map((h) => <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {pf.stages.map((s) => (
                    <tr key={s.id} data-proforma-stage className="border-t align-top" style={{ borderColor: "#141d29" }}>
                      <td className="px-2 py-1 tabular-nums" style={{ color: C.dim }}>{s.order}</td>
                      <td className="px-2 py-1" style={{ color: C.text }}>
                        {s.label}
                        {s.id === "construction" && (
                          <div className="text-[8px]" style={{ color: C.dim }}>your build {fmtUsd(pf.constructionBuildCost)} · +{fmtUsd(pf.constructionDeltaUsd)} full-service (basis to confirm)</div>
                        )}
                      </td>
                      <td className="px-2 py-1 tabular-nums" style={{ color: C.gold }}>{fmtUsd(s.cost)}</td>
                      <td className="px-2 py-1" style={{ color: s.id === "construction" ? C.cyan : C.dim }}>{s.id === "construction" ? "market" : "reference"}</td>
                      <td className="px-2 py-1 tabular-nums" style={{ color: s.durationDays != null ? C.cyan : C.dim }}>{s.durationDays != null ? s.durationDays : "—"}</td>
                      <td className="px-2 py-1" style={{ color: C.cyan }}>{s.authority ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Tile label="Build the home" value={fmtUsd(pf.buildCostUsd)} sub="from your design" color={C.cyan} />
              <Tile label="Develop + sell" value={fmtUsd(pf.projectCostUsd)} sub="full project · reference" color={C.gold} />
              <Tile label="Project timeline" value={`~${pf.projectDaysRef} days`} sub={`reference · build ~${pf.constructionDays}d of it`} color={C.text} />
            </div>
            <div className="text-[10px] leading-snug" style={{ color: C.dim }}>
              Reference figures from your slide — not fixed values yet. “Build the home” ({fmtUsd(pf.buildCostUsd)}) is what we model your build at; “develop + sell” ({fmtUsd(pf.projectCostUsd)}) wraps it with land, design, permitting, management and sales. The {fmtUsd(pf.constructionDeltaUsd)} gap between the market build line and your build is yours to name — it isn’t markup (your build already includes contractor markup). The two numbers are never added together.
            </div>
          </div>
        );
      })()}
    </div>
  );
}
