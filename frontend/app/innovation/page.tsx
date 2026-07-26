"use client";

/**
 * PROJECT INNOVATION — Vision • 2525  (CRS-36 → CRS-93)
 * Rack & Stack portfolio (registry + prioritization + funding line + live budget) plus the
 * Series-9 differentiators: 3×3×3 gate cube, risk-prediction market, Project Upside pool,
 * $/min cost of elapsed time, and AI·SI·HI intelligence load with a burnout guard.
 *
 * Gated behind an access code (369963) until fully tested — the "UNLOCK" tab.
 */
import React, { useMemo, useState, useEffect } from "react";
import {
  DEMO_PROJECTS, DEMO_BUDGET, availableK, stackWithBudget, incrementalRevM, weightedRevM,
  pSuccess, upsideFraction, npvM, irrPct, revOverNre, cubeFilled, GATE_BAND, GATE_STAGE,
  timeReadout, toleranceBand, TIME_UNITS, UNIT_LABEL, scheduleFromStart, GATES,
  growthModel, RISK_LABEL, HIER_LEVELS, hierValues, filterByHier, hierOf,
  REV_MODE, DEMO_RISKS, riskScore, riskExposure, riskPriority, riskBand, riskRollup,
  RISK_STATUS_LABEL, spendByBU, spendByCategory, rdEfficiency, costSplit, roiSummary,
  pipelineByGate, devTypeOf, DEV_TYPE, lobBaseM, companyBaseM, companyRollup, COMPANY_NAME, sayDo, briefOf, execOf,
  scopeBaseM, GATE_DELIVERABLES, GATE_REVIEW, rackByLevel, projectRevSeries,
  bomOf, bomStdCost, bomExtended, productionCost, BU_LABEL, SBU_LABEL,
  GATE_REQUIREMENTS, requirementStatus, gateReadinessAll,
  TOLERANCE_LADDER, REQ_TYPE_LABEL, REQ_STATUS_LABEL,
  metaOf, financialMetrics, financialsOverview,
  DEMO_DEPS, dependencySummary, dependsOn, dependentsOf,
  STRATEGIC_INITIATIVES, PILLAR_DESC,
  seedBizSetup, BIZ_TIERS,
  type Project, type TimeUnit, type HierKey, type RevMode, type Risk, type RiskStatus, type RiskCategory,
  type ReqStatus, type DepEdge, type BizTier, type BizNode, type BizSetup,
} from "@/lib/innovation-data";

const CODE = "369963";
const SS_KEY = "innovation-unlocked";

// Persona lens (12-AsM usability) — the same portfolio seen through four operator roles.
type Persona = "pm" | "mgr" | "sbu" | "vp";
const PERSONAS: { key: Persona; label: string; glyph: string; lens: string; view: "portfolio" | "gates" | "dashboards" | "setup"; level?: HierKey }[] = [
  { key: "pm",  label: "Product / Project Mgr", glyph: "◱", lens: "Deep-dive one project — gates, 12 metrics, financials, risks, Say/Do.", view: "portfolio", level: "product" },
  { key: "mgr", label: "Manager",               glyph: "☰", lens: "Your projects above/below the funding line — reprioritize the working stack.", view: "portfolio", level: "product" },
  { key: "sbu", label: "SBU Director",          glyph: "▤", lens: "SBU rollup + funding decisions across Alpha Groups.", view: "portfolio", level: "sbu" },
  { key: "vp",  label: "VP · Portfolio",        glyph: "◈", lens: "Whole-portfolio dashboards, growth model, dependencies, gate readiness.", view: "dashboards" },
];
const usd = (m: number) => `$${m.toFixed(1)}M`;
const k = (n: number) => `$${(n / 1000).toFixed(1)}M`;

export default function InnovationPage() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { setUnlocked(sessionStorage.getItem(SS_KEY) === "1"); }, []);
  if (!unlocked) return <Gate onUnlock={() => { sessionStorage.setItem(SS_KEY, "1"); setUnlocked(true); }} />;
  return <Board />;
}

// ── Access gate ──────────────────────────────────────────────────────────────────────────
function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => (pw === CODE ? onUnlock() : setErr(true));
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f14] text-slate-100 p-6">
      <div className="w-full max-w-3xl grid gap-5 md:grid-cols-[1fr_1.1fr] items-center">
        {/* Unlock card */}
        <div className="w-full rounded-2xl border border-cyan-500/20 bg-[#111820] p-7 shadow-2xl">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400">Vision • 2525 · Harmattan AI</div>
          <h1 className="mt-1 text-xl font-semibold">Project Innovation — Unlock to Pillars</h1>
          <p className="mt-2 text-sm text-slate-400">Access-gated preview. Enter the code to open the Rack &amp; Stack portfolio across the four strategic pillars.</p>
          <input
            type="password" inputMode="numeric" value={pw} autoFocus
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Access code"
            className="mt-4 w-full rounded-lg border border-slate-700 bg-[#0b0f14] px-3 py-2.5 text-center tracking-[0.4em] font-mono text-lg outline-none focus:border-cyan-500"
          />
          {err && <p className="mt-2 text-sm text-rose-400">Incorrect code.</p>}
          <button onClick={submit} className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-[#06202a] hover:bg-cyan-400">
            Unlock
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-500">Same code unlocks Business Setup (master data) inside the tool.</p>
        </div>
        {/* The four strategic pillars (Harmattan-AI focus) */}
        <div className="w-full">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Four Strategic Pillars</div>
          <div className="mt-2 grid gap-2">
            {STRATEGIC_INITIATIVES.map((pillar, i) => (
              <div key={pillar} className="rounded-xl border border-slate-800 bg-[#0e141b] p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/15 text-[11px] font-mono text-cyan-300">P{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-100">{pillar}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{PILLAR_DESC[pillar]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Portfolio workbench ─────────────────────────────────────────────────────────────────
function Board() {
  // Default rank: by weighted NPV desc (a sane starting stack; user then drags).
  const [order, setOrder] = useState<Project[]>(
    [...DEMO_PROJECTS].sort((a, b) => npvM(b) - npvM(a))
  );
  const [selId, setSelId] = useState(order[0].id);
  const [risks, setRisks] = useState<Risk[]>(DEMO_RISKS);
  const [view, setView] = useState<"portfolio" | "gates" | "dashboards" | "setup">("portfolio");
  const [persona, setPersona] = useState<Persona>("sbu");
  // Change + approval activity log (edits and gate approvals) — the audit summary.
  const [activity, setActivity] = useState<{ id: number; kind: "edit" | "approve" | "reject"; project: string; text: string; by: string }[]>([]);
  const log = (kind: "edit" | "approve" | "reject", project: string, text: string, by: string) =>
    setActivity((a) => [{ id: a.length + 1, kind, project, text, by }, ...a]);
  const applyEdit = (id: string, patch: Partial<Project>, changes: string[]) => {
    const proj = order.find((p) => p.id === id);
    setOrder((o) => o.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    changes.forEach((c) => log("edit", proj?.name ?? id, c, "you"));
  };
  const avail = availableK(DEMO_BUDGET);
  const { rows, lineIndex } = useMemo(() => stackWithBudget(order, avail), [order, avail]);
  const sel = order.find((p) => p.id === selId) ?? order[0];

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const reorder = (from: number | null, to: number) => {
    if (from == null || from === to || from < 0 || to < 0) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  };
  // Level-aware Rack & Stack: high-level rollup (BU/SBU/PG/Alpha) for decisions · Product #
  // = working project stack (drag/select → deep dive) · Material # = BOM. Metrics always
  // stay bound to the project (derived from r.p), so arrows/drag carry NPV/REV/NRE with it.
  const [stackLevel, setStackLevel] = useState<HierKey>("sbu");
  const [drill, setDrill] = useState<{ level: HierKey; value: string } | null>(null);
  const isGroupLevel = stackLevel === "bu" || stackLevel === "sbu" || stackLevel === "pgroup" || stackLevel === "alpha";
  const groupRows = useMemo(() => rackByLevel(order, stackLevel), [order, stackLevel]);
  const drilled = drill && stackLevel === "product" ? order.filter((p) => hierOf(p)[drill.level] === drill.value) : null;
  // Breadcrumb ancestry (Company › BU › SBU › …) for the drilled node — clickable to navigate up.
  const HIER_ORDER: HierKey[] = ["bu", "sbu", "pgroup", "alpha"];
  const drillPath = drill && stackLevel === "product" ? (() => {
    const p0 = order.find((p) => hierOf(p)[drill.level] === drill.value);
    if (!p0) return [] as { level: HierKey; value: string }[];
    const h = hierOf(p0);
    return HIER_ORDER.slice(0, HIER_ORDER.indexOf(drill.level) + 1).map((lv) => ({ level: lv, value: h[lv] }));
  })() : [];

  const fundedRows = rows.filter((r) => r.funded);
  const portfolioNpv = fundedRows.reduce((s, r) => s + npvM(r.p), 0);
  const fundedNre = fundedRows.reduce((s, r) => s + r.p.nreK, 0);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400">Vision • 2525 · CRS-36→93</div>
          <h1 className="text-lg font-semibold">Project Innovation — Rack &amp; Stack</h1>
        </div>
        <a
          href="/innovation/pdm-template.html" target="_blank" rel="noopener"
          className="rounded-md border border-cyan-500/40 px-2.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10"
        >
          R-Core Project Template ↗
        </a>
        <div className="ml-auto flex gap-5 text-right">
          <Kpi label="R&D available" value={k(avail)} />
          <Kpi label="Funded NRE" value={k(fundedNre)} tone={fundedNre > avail ? "bad" : "ok"} />
          <Kpi label="Funded projects" value={`${fundedRows.length}/${order.length}`} />
          <Kpi label="Portfolio NPV" value={usd(portfolioNpv)} tone="good" />
        </div>
      </header>

      {/* Persona lens (12-AsM usability) — reframe the same portfolio by operator role */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-[#0c1219] px-5 py-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">View as</span>
        <div className="flex flex-wrap gap-1">
          {PERSONAS.map((pp) => (
            <button key={pp.key}
              onClick={() => { setPersona(pp.key); setView(pp.view); if (pp.level) setStackLevel(pp.level); setDrill(null); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${persona === pp.key ? "bg-cyan-500 text-[#06202a]" : "border border-slate-700 text-slate-300 hover:bg-slate-800"}`}>
              <span className="mr-1">{pp.glyph}</span>{pp.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-slate-400 hidden sm:block">{PERSONAS.find((pp) => pp.key === persona)!.lens}</span>
      </div>
      <p className="border-b border-slate-800 bg-[#0c1219] px-5 pb-2 text-[11px] text-slate-400 sm:hidden">{PERSONAS.find((pp) => pp.key === persona)!.lens}</p>

      {/* View tabs — Portfolio (Rack/Stack/Risk/Growth) ⟷ Dashboards (ROI Visuals) */}
      <nav className="flex gap-1 border-b border-slate-800 px-5 overflow-x-auto">
        {([["portfolio", "Portfolio · Rack & Stack"], ["gates", "Gate Requirements"], ["dashboards", "Dashboards · ROI Visuals"], ["setup", "⚙ Business Setup"]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${view === v ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {label}
          </button>
        ))}
      </nav>

      {view === "portfolio" && (<>
      <div className="grid gap-4 p-5 lg:grid-cols-[1.6fr_1fr]">
        {/* STACK table — level-aware Rack & Stack */}
        <section className="rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800">
            <h2 className="text-sm font-semibold">
              Rack &amp; Stack · {stackLevel === "product" ? "drag priority across the funding line" : isGroupLevel ? "roll-up for decisions" : "bill of materials"}
            </h2>
            {/* Top level toggle: BU · SBU · Product Group · Alpha Group · Product # · Material # */}
            <div className="flex flex-wrap overflow-hidden rounded-md border border-slate-700 text-[11px]">
              {([["bu", "BU"], ["sbu", "SBU"], ["pgroup", "Alpha Grp"], ["alpha", "Alpha Cd"], ["product", "Product #"], ["material", "Material #"]] as const).map(([lv, lbl]) => (
                <button key={lv} onClick={() => { setStackLevel(lv); setDrill(null); }}
                  className={`px-2 py-1 ${stackLevel === lv ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
              ))}
            </div>
          </div>

          {drill && stackLevel === "product" && (
            <div className="flex flex-wrap items-center gap-1 px-4 py-1.5 text-[11px] bg-cyan-500/5 border-b border-slate-800">
              <button onClick={() => { setDrill(null); setStackLevel("bu"); }} className="text-slate-400 hover:text-cyan-300">Company</button>
              {drillPath.map((seg, i) => (
                <span key={seg.level} className="flex items-center gap-1">
                  <span className="text-slate-600">›</span>
                  <button onClick={() => setDrill({ level: seg.level, value: seg.value })}
                    className={i === drillPath.length - 1 ? "text-cyan-300 font-semibold" : "text-slate-400 hover:text-cyan-300"}>
                    {seg.value}<span className="text-[9px] text-slate-600"> {seg.level.toUpperCase()}</span>
                  </button>
                </span>
              ))}
              <button onClick={() => { setDrill(null); }} className="ml-2 rounded border border-slate-700 px-1.5 text-slate-400 hover:bg-slate-800">✕ all projects</button>
            </div>
          )}

          <div className="overflow-x-auto">
            {isGroupLevel && (() => {
              const st = stackWithBudget(groupRows.map((g) => ({ nreK: g.nreK } as unknown as Project)), avail);
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">{HIER_LEVELS.find((h) => h.key === stackLevel)?.label}</th>
                      <th className="px-2 py-2 text-center"># Proj</th>
                      <th className="px-2 py-2 text-right">NRE</th>
                      <th className="px-2 py-2 text-right">P-wt Rev</th>
                      <th className="px-2 py-2 text-right">NPV</th>
                      <th className="px-2 py-2 text-right">Cum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupRows.map((g, i) => (
                      <React.Fragment key={g.key}>
                        {i === st.lineIndex && (
                          <tr><td colSpan={7} className="px-2 py-0.5">
                            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                              <span className="h-px flex-1 bg-amber-500/60" />Funding line · {k(avail)} R&amp;D<span className="h-px flex-1 bg-amber-500/60" />
                            </div></td></tr>
                        )}
                        <tr onClick={() => { setDrill({ level: stackLevel, value: g.key }); setStackLevel("product"); }}
                          className={`cursor-pointer border-b border-slate-900 hover:bg-cyan-500/10 hover:ring-1 hover:ring-inset hover:ring-cyan-500/30 ${st.rows[i]?.funded ? "" : "opacity-70"}`} title="Drill to projects">
                          <td className="px-2 py-2 tabular-nums text-slate-400">{i + 1}</td>
                          <td className="px-2 py-2 font-medium">{g.key} <span className="text-[10px] text-slate-500">↳ drill</span></td>
                          <td className="px-2 py-2 text-center tabular-nums text-slate-400">{g.count}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-slate-300">{k(g.nreK)}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{usd(g.weightedRevM)}</td>
                          <td className={`px-2 py-2 text-right tabular-nums font-semibold ${g.npvM >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{usd(g.npvM)}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-slate-400">{k(st.rows[i]?.cumK ?? 0)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {stackLevel === "product" && (() => {
              const src = drilled ?? order;
              const st = drilled ? stackWithBudget(src, avail) : { rows, lineIndex };
              const canDrag = !drilled;
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                      <th className="w-6"></th>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">Project #</th>
                      <th className="px-2 py-2 text-center">Gate</th>
                      <th className="px-2 py-2 text-center">Conf</th>
                      <th className="px-2 py-2 text-right">NRE</th>
                      <th className="px-2 py-2 text-right">P-wt Rev</th>
                      <th className="px-2 py-2 text-right">NPV</th>
                      <th className="px-2 py-2 text-right">Cum</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {st.rows.map((r, i) => (
                      <RowFrag key={r.p.id} r={r} i={i} showLine={i === st.lineIndex} selId={selId}
                        onSelect={setSelId} onUp={canDrag ? () => move(i, -1) : undefined} onDown={canDrag ? () => move(i, 1) : undefined}
                        last={i === st.rows.length - 1} avail={avail} canDrag={canDrag}
                        dragging={dragIdx === i} onDragStartRow={() => setDragIdx(i)} onDropRow={() => { reorder(dragIdx, i); setDragIdx(null); }} />
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {stackLevel === "material" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="px-2 py-2 text-left">Material # (BOM)</th>
                    <th className="px-2 py-2 text-left">Description</th>
                    <th className="px-2 py-2 text-center">Qty</th>
                    <th className="px-2 py-2 text-right">Labor</th>
                    <th className="px-2 py-2 text-right">Material</th>
                    <th className="px-2 py-2 text-right">Machining</th>
                    <th className="px-2 py-2 text-right">Other</th>
                    <th className="px-2 py-2 text-right">Std cost</th>
                    <th className="px-2 py-2 text-right">Extended</th>
                  </tr>
                </thead>
                <tbody>
                  {(drilled ?? order).map((p) => {
                    const lines = bomOf(p);
                    return (
                      <React.Fragment key={p.id}>
                        {/* Product # header — estimated per-unit production (standard) cost */}
                        <tr onClick={() => setSelId(p.id)} className={`cursor-pointer border-b border-slate-800 bg-slate-900/40 ${selId === p.id ? "ring-1 ring-inset ring-cyan-500/30" : ""}`}>
                          <td className="px-2 py-1.5 font-mono font-semibold text-cyan-300">{hierOf(p).product}</td>
                          <td className="px-2 py-1.5 text-slate-300" colSpan={6}>{p.name} <span className="text-[10px] text-slate-500">· Material {hierOf(p).material} · {hierOf(p).pgroup} · {lines.length} lines</span></td>
                          <td className="px-2 py-1.5 text-right text-[10px] uppercase tracking-wider text-slate-500">Prod cost →</td>
                          <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-emerald-400">${Math.round(productionCost(p)).toLocaleString()}</td>
                        </tr>
                        {lines.map((l) => (
                          <tr key={l.material} className="border-b border-slate-900/50 text-[12px]">
                            <td className="px-2 py-1 pl-5 font-mono text-slate-300">{l.material}</td>
                            <td className="px-2 py-1 text-slate-400">{l.desc} <span className={`ml-1 rounded px-1 text-[9px] ${l.kind === "complete" ? "bg-violet-500/20 text-violet-300" : l.kind === "partial" ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-500"}`}>{l.kind === "raw" ? "1·raw" : l.kind === "partial" ? "3·partial" : "5·complete"}</span></td>
                            <td className="px-2 py-1 text-center tabular-nums text-slate-400">{l.qty}</td>
                            <td className="px-2 py-1 text-right tabular-nums text-slate-400">${l.labor}</td>
                            <td className="px-2 py-1 text-right tabular-nums text-slate-400">${l.matl}</td>
                            <td className="px-2 py-1 text-right tabular-nums text-slate-400">${l.machining}</td>
                            <td className="px-2 py-1 text-right tabular-nums text-slate-500">${l.other}</td>
                            <td className="px-2 py-1 text-right tabular-nums text-slate-200">${bomStdCost(l)}</td>
                            <td className="px-2 py-1 text-right tabular-nums text-slate-300">${bomExtended(l).toLocaleString()}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-1.5 text-[10px] text-slate-500 border-t border-slate-800">
            {isGroupLevel ? "Decision roll-up · click a row to drill to its projects" : stackLevel === "product" ? "Working stack · drag ⠿ or ▲▼ to reprioritize — NPV/REV/NRE follow the project · click → financials + Stage-Gate deep dive" : "BOM · components & assemblies · click → project deep dive"}
          </div>
        </section>

        {/* Selected project detail */}
        <section className="space-y-4">
          <ProjectDetail p={sel} risks={risks}
            onEdit={(patch, changes) => applyEdit(sel.id, patch, changes)}
            onApprove={(kind, by) => log(kind, sel.name, kind === "approve" ? `${GATE_STAGE[sel.gate]} (${sel.gate}) approved` : `${sel.gate} — changes requested`, by)} />
          <TimeEngine p={sel} />
          <GateCube p={sel} />
          <Differentiators p={sel} />
        </section>
      </div>

      {/* Crowd-sourced Risk Register — anyone documents, the community polls, the team de-risks */}
      <div className="px-5 pb-4">
        <RiskRegister risks={risks} setRisks={setRisks} projects={order} selId={selId} onSelect={setSelId} />
      </div>

      {/* Changes & Approvals summary — the audit trail of edits + gate approvals */}
      <div className="px-5 pb-4">
        <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Changes &amp; Approvals · summary</h2>
            <span className="text-[11px] text-slate-500">{activity.filter((a) => a.kind === "edit").length} edits · {activity.filter((a) => a.kind === "approve").length} approvals · {activity.filter((a) => a.kind === "reject").length} change-requests</span>
          </div>
          {activity.length === 0 ? (
            <p className="mt-2 text-[11px] text-slate-500">No changes yet — edit a project (✎) or approve a gate to build the audit trail.</p>
          ) : (
            <ul className="mt-2 max-h-52 overflow-y-auto divide-y divide-slate-900">
              {activity.map((a) => (
                <li key={a.id} className="flex items-baseline gap-2 py-1 text-[12px]">
                  <span className={`w-14 shrink-0 text-[10px] font-mono uppercase ${a.kind === "approve" ? "text-emerald-400" : a.kind === "reject" ? "text-rose-400" : "text-cyan-300"}`}>{a.kind === "approve" ? "✓ apprv" : a.kind === "reject" ? "✕ chg-req" : "✎ edit"}</span>
                  <span className="text-slate-300">{a.project}</span>
                  <span className="text-slate-500">— {a.text}</span>
                  <span className="ml-auto text-[10px] text-slate-600">by {a.by}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Portfolio Growth Model — the signature Rack & Stack chart */}
      <div className="px-5 pb-2">
        <GrowthModelChart funded={fundedRows.map((r) => r.p)} />
      </div>
      </>)}

      {view === "gates" && (
        <div className="p-5">
          <GateRequirementsView projects={order} sel={sel} onSelect={setSelId} />
        </div>
      )}

      {view === "dashboards" && (
        <div className="p-5">
          <Dashboards projects={order} funded={fundedRows.map((r) => r.p)} onSelect={(id) => { setSelId(id); setView("portfolio"); }} />
        </div>
      )}

      {view === "setup" && (
        <div className="p-5">
          <BusinessSetup />
        </div>
      )}

      <footer className="px-5 pb-8 text-[11px] text-slate-500">
        Demo portfolio · figures derived (CRS-52/53/67), never entered. Series 9 (CRS-75→93) is the differentiator vs. classic rack-and-stack.
      </footer>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "good" | "ok" | "bad" }) {
  const c = tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-rose-400" : "text-slate-100";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

function RowFrag({ r, i, showLine, selId, onSelect, onUp, onDown, last, avail, dragging, onDragStartRow, onDropRow, canDrag = true }: {
  r: ReturnType<typeof stackWithBudget>["rows"][number]; i: number; showLine: boolean;
  selId: string; onSelect: (id: string) => void; onUp?: () => void; onDown?: () => void; last: boolean; avail: number;
  dragging: boolean; onDragStartRow: () => void; onDropRow: () => void; canDrag?: boolean;
}) {
  const { p, cumK, funded } = r;
  return (
    <>
      {showLine && (
        <tr>
          <td colSpan={10} className="px-2 py-0.5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-amber-400">
              <span className="h-px flex-1 bg-amber-500/60" />
              Funding line · {k(avail)} R&amp;D
              <span className="h-px flex-1 bg-amber-500/60" />
            </div>
          </td>
        </tr>
      )}
      <tr
        onClick={() => onSelect(p.id)}
        draggable={canDrag}
        onDragStart={canDrag ? onDragStartRow : undefined}
        onDragOver={canDrag ? (e) => e.preventDefault() : undefined}
        onDrop={canDrag ? (e) => { e.preventDefault(); onDropRow(); } : undefined}
        className={`cursor-pointer border-b border-slate-900 ${selId === p.id ? "bg-cyan-500/10" : "hover:bg-slate-800/40"} ${funded ? "" : "opacity-70"} ${dragging ? "opacity-40" : ""}`}
      >
        <td className="w-6 text-center align-middle text-slate-600 select-none" title={canDrag ? "Drag to reprioritize" : ""}>{canDrag ? <span className="cursor-grab active:cursor-grabbing">⠿</span> : ""}</td>
        <td className="px-2 py-2 tabular-nums text-slate-400">{i + 1}</td>
        <td className="px-2 py-2">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${funded ? "bg-emerald-500" : "bg-rose-500"}`} />
            <div>
              <div className="font-medium leading-tight">{p.name}</div>
              <div className="text-[11px] text-slate-500">{p.division} · {p.category}{p.criticalPath ? " · ⚡crit-path" : ""}</div>
            </div>
          </div>
        </td>
        <td className="px-2 py-2 text-center"><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-mono">{p.gate}</span></td>
        <td className="px-2 py-2 text-center tabular-nums">{"●".repeat(p.confidence)}<span className="text-slate-700">{"●".repeat(4 - p.confidence)}</span></td>
        <td className="px-2 py-2 text-right tabular-nums text-slate-300">{k(p.nreK)}</td>
        <td className="px-2 py-2 text-right tabular-nums">{usd(weightedRevM(p))}</td>
        <td className={`px-2 py-2 text-right tabular-nums font-semibold ${npvM(p) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{usd(npvM(p))}</td>
        <td className="px-2 py-2 text-right tabular-nums text-slate-400">{k(cumK)}</td>
        <td className="px-2 py-2 text-right whitespace-nowrap">
          {canDrag ? (<>
            <button onClick={(e) => { e.stopPropagation(); onUp?.(); }} disabled={i === 0} className="px-1 text-slate-400 hover:text-cyan-300 disabled:opacity-20">▲</button>
            <button onClick={(e) => { e.stopPropagation(); onDown?.(); }} disabled={last} className="px-1 text-slate-400 hover:text-cyan-300 disabled:opacity-20">▼</button>
          </>) : <span className="text-slate-700 text-[10px]">·</span>}
        </td>
      </tr>
    </>
  );
}

// Per-project financial projection — old product line declining (no innovation) + new product
// ramp when funded. The operator methodology for aging-portfolio financials.
function ProjectRevChart({ p }: { p: Project }) {
  const [funded, setFunded] = useState(true);
  const rows = projectRevSeries(p, { years: 10, funded });
  const W = 340, H = 120, B = 16, T = 8;
  const max = Math.max(...rows.map((r) => r.total), 1) * 1.1;
  const bw = (W - 8) / rows.length;
  const hy = (v: number) => (v / max) * (H - B - T);
  const noInno = projectRevSeries(p, { years: 10, funded: false });
  const lost = noInno.reduce((s, r) => s + r.oldDecline, 0);
  const added = rows.reduce((s, r) => s + r.newRamp, 0);
  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Financial projection · aging line + new product (10 yr)</div>
        <div className="flex overflow-hidden rounded-md border border-slate-700 text-[10px]">
          {([[true, "With new product"], [false, "No innovation"]] as const).map(([f, lbl]) => (
            <button key={String(f)} onClick={() => setFunded(f)}
              className={`px-2 py-0.5 ${funded === f ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" preserveAspectRatio="xMidYMid meet" style={{ height: "auto" }}>
        {rows.map((r, i) => {
          const x = 4 + i * bw + bw * 0.15, w = bw * 0.7;
          const oh = hy(r.oldDecline), nh = hy(r.newRamp);
          const yOld = H - B - oh, yNew = yOld - nh;
          return (
            <g key={r.year}>
              <title>{r.year}: old {Math.round(r.oldDecline)} + new {Math.round(r.newRamp)} = {Math.round(r.total)} $M</title>
              <rect x={x} y={yOld} width={w} height={Math.max(0, oh)} fill="#64748b" opacity="0.7" />
              <rect x={x} y={yNew} width={w} height={Math.max(0, nh)} fill="#34d399" />
              {i % 3 === 0 && <text x={x + w / 2} y={H - 4} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="ui-monospace, monospace">{String(r.year).slice(2)}</text>}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#64748b" }} />old line (declines {Math.round((1 - noInno[9].oldDecline / (noInno[0].oldDecline || 1)) * 100)}% w/o innovation)</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#34d399" }} />new product ramp</span>
        <span className="ml-auto text-slate-400">erodes {usd(lost)} · new adds {usd(added)}</span>
      </div>
    </div>
  );
}

// Project Financials Overview (FLIR §2.3) — read-only yearly Revenue / Margin / R&D + Totals.
function FinancialsOverviewTable({ p }: { p: Project }) {
  const rows = financialsOverview(p, { years: 10, funded: true });
  const tot = rows.reduce((a, r) => ({ revM: a.revM + r.revM, marginM: a.marginM + r.marginM, rdK: a.rdK + r.rdK }), { revM: 0, marginM: 0, rdK: 0 });
  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">Project Financials Overview · 10-yr (Revenue · Margin · R&D)</div>
      <div className="mt-1 overflow-x-auto">
        <table className="w-full min-w-[520px] text-[11px] tabular-nums">
          <thead>
            <tr className="text-slate-500">
              <th className="px-1 py-0.5 text-left font-medium">$M</th>
              {rows.map((r) => <th key={r.year} className="px-1 py-0.5 text-right font-mono">{String(r.year).slice(2)}</th>)}
              <th className="px-1 py-0.5 text-right font-medium text-slate-300">Σ</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="px-1 py-0.5 text-slate-400">Revenue</td>{rows.map((r) => <td key={r.year} className="px-1 py-0.5 text-right text-slate-300">{r.revM.toFixed(0)}</td>)}<td className="px-1 py-0.5 text-right font-semibold text-slate-100">{tot.revM.toFixed(0)}</td></tr>
            <tr><td className="px-1 py-0.5 text-slate-400">Margin</td>{rows.map((r) => <td key={r.year} className="px-1 py-0.5 text-right text-emerald-400/90">{r.marginM.toFixed(0)}</td>)}<td className="px-1 py-0.5 text-right font-semibold text-emerald-400">{tot.marginM.toFixed(0)}</td></tr>
            <tr><td className="px-1 py-0.5 text-slate-400">R&amp;D $k</td>{rows.map((r) => <td key={r.year} className="px-1 py-0.5 text-right text-amber-300/80">{r.rdK ? (r.rdK / 1000).toFixed(1) + "M" : "–"}</td>)}<td className="px-1 py-0.5 text-right font-semibold text-amber-300">{(tot.rdK / 1000).toFixed(1)}M</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Risk-level pill: colour by level (low=emerald, med=amber, high=rose).
function RiskPill({ label, level }: { label: string; level: Project["tech"] }) {
  const c = level === "low" ? "bg-emerald-500/15 text-emerald-300" : level === "med" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${c}`}>{label} {RISK_LABEL[level]}</span>;
}

function ProjectDetail({ p, risks, onEdit, onApprove }: {
  p: Project; risks: Risk[];
  onEdit: (patch: Partial<Project>, changes: string[]) => void;
  onApprove: (kind: "approve" | "reject", by: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Project>>({});
  useEffect(() => { setDraft({}); setEditing(false); }, [p.id]);
  const dv = <K extends keyof Project>(k: K): Project[K] => (draft[k] !== undefined ? (draft[k] as Project[K]) : p[k]);
  const setD = <K extends keyof Project>(k: K, v: Project[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const saveEdit = () => {
    const patch = draft;
    const changes: string[] = [];
    (Object.keys(patch) as (keyof Project)[]).forEach((k) => { if (patch[k] !== undefined && patch[k] !== p[k]) changes.push(`${String(k)}: ${p[k]} → ${patch[k]}`); });
    if (changes.length) onEdit(patch, changes);
    setDraft({}); setEditing(false);
  };
  const editStyle = "rounded border border-slate-700 bg-[#0b0f14] px-1.5 py-0.5 text-xs text-slate-100 outline-none focus:border-cyan-500";
  const band = GATE_BAND[p.gate];
  const captured = Math.round(pSuccess(p) * 100);
  const upside = Math.round(upsideFraction(p) * 100);
  const roll = riskRollup(risks, p.id);
  const brief = briefOf(p);
  const ex = execOf(p);
  const meta = metaOf(p);
  const fm = financialMetrics(p);
  // Full FLIR "Project Metrics" card set (12) — IMG_7843 / spec §2.4.
  const metrics: [string, string][] = [
    ["NPV", usd(fm.npvM)], ["REV/NRE", `${fm.revOverNre.toFixed(1)}×`], ["IRR", `${fm.irrPct}%`],
    ["Gross Margin", `${fm.grossMarginPct}%`], ["Payback", `${fm.paybackYears} yr`], ["10-Yr Volume", fm.vol10y.toLocaleString()],
    ["10-Yr Revenue", usd(fm.rev10yM)], ["10-Yr Gross Profit", usd(fm.grossProfit10yM)], ["Cur-Yr Op Expense", k(fm.curYearOpexK)],
    ["Total R&D Op Ex", k(fm.totalRdOpexK)], ["Capital", k(fm.capitalK)], ["Man Hours", `${(fm.manHours / 1000).toFixed(1)}k`],
  ];
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{p.name}</h3>
          <div className="text-[11px] text-slate-500">{p.division} · {p.manager} · {GATE_STAGE[p.gate]} ({p.gate}) · 1st rev {p.firstRevenue}</div>
        </div>
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-mono text-amber-300">±{Math.round(band * 100)}% band</span>
      </div>

      {/* Edit + Approvals bar */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <button onClick={() => setEditing((e) => !e)} className={`rounded border px-2 py-0.5 ${editing ? "border-cyan-500 text-cyan-300 bg-cyan-500/10" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>{editing ? "✕ Cancel" : "✎ Edit"}</button>
        {editing && <button onClick={saveEdit} className="rounded bg-cyan-500 px-2 py-0.5 font-semibold text-[#06202a] hover:bg-cyan-400">Save</button>}
        <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">Gate approval:</span>
        {([["◬", "AI"], ["♡", "SI"], ["웃", "HI"]] as const).map(([g, by]) => (
          <button key={by} onClick={() => onApprove("approve", `${g} ${by}`)} title={`Approve as ${by}`}
            className="rounded border border-emerald-600/40 px-1.5 py-0.5 text-emerald-300 hover:bg-emerald-500/10">{g} approve</button>
        ))}
        <button onClick={() => onApprove("reject", "you")} className="rounded border border-rose-600/40 px-1.5 py-0.5 text-rose-300 hover:bg-rose-500/10">Request changes</button>
      </div>

      {/* Editable key fields */}
      {editing && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-cyan-500/20 bg-[#0b0f14] p-2.5 text-[11px] text-slate-400 sm:grid-cols-3">
          <label className="col-span-2 sm:col-span-3">Name<input value={dv("name")} onChange={(e) => setD("name", e.target.value)} className={`mt-0.5 block w-full ${editStyle}`} /></label>
          <label>NRE $K<input type="text" inputMode="numeric" value={String(dv("nreK"))} onChange={(e) => /^\d*$/.test(e.target.value) && setD("nreK", +e.target.value)} className={`mt-0.5 block w-full ${editStyle} tabular-nums`} /></label>
          <label>New rev 10yr $M<input type="text" inputMode="numeric" value={String(dv("fullRev10yM"))} onChange={(e) => /^\d*$/.test(e.target.value) && setD("fullRev10yM", +e.target.value)} className={`mt-0.5 block w-full ${editStyle} tabular-nums`} /></label>
          <label>Do-nothing 10yr $M<input type="text" inputMode="numeric" value={String(dv("doNothing10yM"))} onChange={(e) => /^\d*$/.test(e.target.value) && setD("doNothing10yM", +e.target.value)} className={`mt-0.5 block w-full ${editStyle} tabular-nums`} /></label>
          <label>Gate<select value={dv("gate")} onChange={(e) => setD("gate", e.target.value as Project["gate"])} className={`mt-0.5 block w-full ${editStyle}`}>{GATES.map((g) => <option key={g} value={g}>{g} {GATE_STAGE[g]}</option>)}</select></label>
          <label>Tech risk<select value={dv("tech")} onChange={(e) => setD("tech", e.target.value as Project["tech"])} className={`mt-0.5 block w-full ${editStyle}`}>{["low", "med", "high"].map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
          <label>Comm risk<select value={dv("comm")} onChange={(e) => setD("comm", e.target.value as Project["comm"])} className={`mt-0.5 block w-full ${editStyle}`}>{["low", "med", "high"].map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
        </div>
      )}
      {/* Tech × Comm risk → revenue captured / upside (operator default model) */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <RiskPill label="Tech" level={p.tech} />
        <RiskPill label="Comm" level={p.comm} />
        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300">{hierOf(p).bu} › {hierOf(p).sbu}</span>
        <span className="ml-auto">P(success) = {Math.round(pSuccess(p) * 100)}% → {captured}% captured · {upside}% upside</span>
      </div>
      {/* Live crowd-sourced risk rollup for this project */}
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <span className="text-slate-500">Risk register:</span>
        <span className="text-slate-300">{roll.count} risk{roll.count === 1 ? "" : "s"}</span>
        <span className="text-slate-600">·</span>
        <span className={roll.open ? "text-rose-300" : "text-emerald-300"}>{roll.open} open</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-300">exposure {Math.round(roll.liveExposure)}/{roll.rawExposure}</span>
        <span className="ml-auto text-emerald-400">{Math.round(roll.retired * 100)}% de-risked</span>
      </div>
      {/* Meta Data (FLIR §2.1 / IMG_7843): Strategic Initiative · Value Ladder · Target Market · Competitive */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-cyan-300" title="Strategic Initiative">◎ {meta.initiative}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Value Ladder position">▦ {meta.valueLadder}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Value Ladder impact">↗ {meta.valueImpact}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Competitive position">⚑ {meta.competitive}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Target market">◈ {meta.targetMarket}</span>
      </div>
      {/* Project Metrics — full 12-metric FLIR card set (§2.4 / IMG_7843) */}
      <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">Project Metrics · FLIR set</div>
      <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {metrics.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-[#0b0f14] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate" title={l}>{l}</div>
            <div className="text-sm font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      {/* Per-project financial projection — aging line decline + new-product ramp (operator methodology) */}
      <ProjectRevChart p={p} />
      {/* Project Financials Overview (FLIR §2.3) — yearly Revenue / Margin / R&D expense */}
      <FinancialsOverviewTable p={p} />
      {/* AMTS Product-Management-Summary exec fields — Functional Leads · COGS/MSRP/Margin · Customer */}
      <div className="mt-3 border-t border-slate-800 pt-3 text-[11px]">
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Product Mgr</div><div className="text-slate-200">{ex.productMgr}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Project Eng</div><div className="text-slate-200">{ex.projectEng}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">BD / Sales</div><div className="text-slate-200">{ex.bdLead}</div></div>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">COGS</div><div className="tabular-nums text-slate-200">${ex.cogsK}k</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">MSRP</div><div className="tabular-nums text-slate-200">${ex.msrpK}k</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Margin</div><div className="tabular-nums text-emerald-400">{ex.marginPct}%</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Customer</div><div className="text-cyan-300">{ex.customer}</div></div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Pursuits:</span>
          {ex.pursuits.map((pu) => <span key={pu.name} className="rounded bg-slate-800 px-1.5 py-0.5">{pu.name} · {usd(pu.valueM)} · {pu.award}</span>)}
          <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">Intra-BU:</span>
          <span className="text-slate-400">{ex.intraDeps.join(" · ")}</span>
        </div>
      </div>
      {/* AMTS One-Page Summary — Needs · Outcomes · Solution · Evidence */}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
        {([["Needs", brief.needs, "#fb7185"], ["Outcomes", brief.outcomes, "#34d399"], ["Solution", brief.solution, "#19c8cf"], ["Evidence", brief.evidence, "#fbbf24"]] as const).map(([title, items, color]) => (
          <div key={title} className="rounded-lg bg-[#0b0f14] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider font-mono" style={{ color }}>{title}</div>
            <ul className="mt-1 space-y-0.5">
              {items.map((it, i) => <li key={i} className="text-[11px] leading-snug text-slate-300">· {it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// Time engine (CRS-85→88): start date → schedule → month/week/day/hour/min, with ± bands
// that tighten by gate and widen with the commercial+technical risk profile.
function TimeEngine({ p }: { p: Project }) {
  const [startISO, setStartISO] = useState("2026-01-05");
  const [unit, setUnit] = useState<TimeUnit>("month");
  const r = timeReadout(p, startISO, unit);
  const sd = sayDo(p);
  const band = Math.round(toleranceBand(p) * 100);
  const fmtTime = (v: number) => (unit === "minute" || unit === "hour" ? Math.round(v).toLocaleString() : v.toFixed(unit === "month" ? 1 : 0));
  const fmtUsd0 = (v: number) => `$${(v / 1e6).toFixed(2)}M`;
  const sched = scheduleFromStart(p, startISO);
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Time engine · remaining to launch</h3>
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-mono text-amber-300">±{band}% @ {p.gate}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-[11px] text-slate-400">Start
          <input type="date" value={startISO} onChange={(e) => setStartISO(e.target.value)}
            className="ml-2 rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1 text-xs text-slate-100" />
        </label>
        <div className="ml-auto flex overflow-hidden rounded-md border border-slate-700 text-[11px]">
          {TIME_UNITS.map((u) => (
            <button key={u} onClick={() => setUnit(u)}
              className={`px-2.5 py-1 font-mono capitalize ${unit === u ? "bg-cyan-500 text-[#06202a]" : "text-slate-300 hover:bg-slate-800"}`}>
              {UNIT_LABEL[u]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Band label={`Time (${UNIT_LABEL[unit]})`} value={fmtTime(r.time.value)} lo={fmtTime(r.time.lo)} hi={fmtTime(r.time.hi)} />
        <Band label="Cost remaining" value={fmtUsd0(r.cost.value)} lo={fmtUsd0(r.cost.lo)} hi={fmtUsd0(r.cost.hi)} />
        <Band label="Finish (± days)" value={`${r.scheduleDays.value}d`} lo={`${r.scheduleDays.lo}d`} hi={`${r.scheduleDays.hi}d`} />
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-slate-500">
        <span>Cost of time <b className="text-cyan-300">${r.costPerMinUsd.toFixed(2)}/min</b></span>
        <span>1st revenue <b className="text-slate-300">{r.firstRevenueISO}</b> (derived)</span>
      </div>
      <div className="mt-1 text-[10px] text-slate-600">
        {sched.rows.map((g) => `${g.gate} ${g.endISO.slice(2)}`).join(" · ")}
      </div>
      {/* Say / Do ratio — planned vs delivered on Time · Schedule · Budget (binds to actuals at Launch) */}
      <div className="mt-3 border-t border-slate-800 pt-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Say / Do ratio</span><span className="text-[10px] text-slate-600">planned ÷ delivered · &gt;1.0 beats plan</span>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {([["Time", sd.time], ["Schedule", sd.schedule], ["Budget", sd.budget]] as const).map(([lbl, v]) => (
            <div key={lbl} className="rounded-lg bg-[#0b0f14] px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{lbl}</div>
              <div className={`text-sm font-semibold tabular-nums ${v >= 1 ? "text-emerald-400" : "text-rose-400"}`}>{v.toFixed(2)}×</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Band({ label, value, lo, hi }: { label: string; value: string; lo: string; hi: string }) {
  return (
    <div className="rounded-lg bg-[#0b0f14] px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] tabular-nums text-amber-300/80">{lo} – {hi}</div>
    </div>
  );
}

// 3×3×3 gate cube (CRS-79/80): 27 cells fill as deliverables approve.
function GateCube({ p }: { p: Project }) {
  const filled = cubeFilled(p);
  const layers = [0, 1, 2];
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Gate progression · {filled}/27 deliverables</h3>
        <span className="text-[11px] text-slate-500">G1–G7 · 27 cells · source of record</span>
      </div>
      <div className="mt-3 flex gap-4">
        {layers.map((L) => (
          <div key={L} className="grid grid-cols-3 gap-1" style={{ transform: "perspective(320px) rotateX(52deg) rotateZ(-45deg)" }}>
            {Array.from({ length: 9 }).map((_, c) => {
              const idx = L * 9 + c;
              const on = idx < filled;
              return <div key={c} className={`h-5 w-5 rounded-[3px] border ${on ? "bg-cyan-400/80 border-cyan-300" : "bg-slate-800/40 border-slate-700"}`} />;
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-slate-500">Layers = gate bands · lit = approved (append-only event fold, CRS-76/78)</div>
      {/* Minimum deliverables required at this gate to de-risk (AMTS S1–S18 matrix) */}
      <div className="mt-3 border-t border-slate-800 pt-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Min deliverables to de-risk · {GATE_STAGE[p.gate]} ({p.gate})</div>
        <ul className="mt-1 space-y-0.5">
          {GATE_REVIEW[p.gate].deliverables.map((d) => (
            <li key={d.slide} className="flex items-baseline gap-2 text-[11px]">
              <span className="font-mono text-slate-500 w-10 shrink-0">{d.slide}</span>
              <span className={`text-slate-200 ${d.priority ? "text-amber-300 font-medium" : ""}`}>{d.name}{d.priority === 3 ? " ★3rd" : ""}</span>
              <span className="text-slate-500">· {d.summary}</span>
            </li>
          ))}
        </ul>
        {GATE_REVIEW[p.gate].mustHave.length > 0 && (
          <div className="mt-1.5 text-[11px]"><span className="text-emerald-400 font-medium">Must have:</span> <span className="text-slate-400">{GATE_REVIEW[p.gate].mustHave.join(" · ")}</span></div>
        )}
        {GATE_REVIEW[p.gate].recommended.length > 0 && (
          <div className="mt-0.5 text-[11px]"><span className="text-slate-500 font-medium">Recommended:</span> <span className="text-slate-600">{GATE_REVIEW[p.gate].recommended.join(" · ")}</span></div>
        )}
      </div>
    </div>
  );
}

// ── GATE REQUIREMENTS VIEW (SPEC §3) — the governance-facing surface ──────────────────────
// Requirements × gates matrix (§3.1), per-gate readiness rollup (§3.5), and the estimate
// tolerance ladder (§3.4). Status is derived from the selected project's gate progression.
const REQ_STATUS_CHIP: Record<ReqStatus, string> = {
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  in_work: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  submitted: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  not_started: "bg-slate-700/30 text-slate-400 border-slate-700",
  waived: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  na: "bg-slate-800/40 text-slate-500 border-slate-800",
};
const REQ_TYPE_CHIP: Record<string, string> = {
  S: "text-cyan-300", CRS: "text-emerald-300", DR: "text-sky-300",
  TR: "text-amber-300", IS: "text-violet-300", DT: "text-rose-300", DC: "text-slate-300",
};

function GateRequirementsView({ projects, sel, onSelect }: { projects: Project[]; sel: Project; onSelect: (id: string) => void }) {
  const readiness = useMemo(() => gateReadinessAll(sel), [sel]);
  const gateIdx = GATES.indexOf(sel.gate);
  return (
    <div className="space-y-4">
      {/* Project selector + context */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-400">Gate governance for</div>
        <select
          value={sel.id} onChange={(e) => onSelect(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0b0f14] px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
        >
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.gate}</option>)}
        </select>
        <span className="text-[11px] text-slate-500">Last completed gate <span className="font-mono text-slate-300">{sel.gate}</span> → stage <span className="text-slate-300">{GATE_STAGE[sel.gate]}</span></span>
      </div>

      {/* §3.5 Gate readiness rollup — % satisfied · Ready/Not · blocking count · band */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <h2 className="text-sm font-semibold">Gate readiness · % requirements satisfied</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {readiness.map((r, i) => {
            const state = i < gateIdx ? "done" : i === gateIdx ? "current" : "future";
            const barColor = r.ready ? "bg-emerald-500" : r.pct >= 50 ? "bg-amber-500" : "bg-rose-500";
            return (
              <div key={r.gate} className={`rounded-lg border p-2.5 ${state === "current" ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-800 bg-[#0b0f14]"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-300">{r.gate}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">±{Math.round(TOLERANCE_LADDER[r.gate] * 100)}%</span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500 truncate">{r.stage}</div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full ${barColor}`} style={{ width: `${r.pct}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="tabular-nums text-slate-400">{r.satisfied}/{r.required}</span>
                  <span className={r.ready ? "text-emerald-400 font-medium" : "text-rose-400"}>{r.ready ? "Ready" : `${r.blocking.length} open`}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Tolerance ladder (§3.4): ±60/40/20/10/5% — tightens gate over gate; a gate-to-gate move beyond the band raises a variance exception for PRB disposition.</p>
      </section>

      {/* §3.1 Requirements × gates matrix — rows = requirements, columns = G1–G7 */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800">
          <h2 className="text-sm font-semibold">Requirement registry · {GATE_REQUIREMENTS.length} rows</h2>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {(["S", "CRS", "DR", "TR", "IS", "DT", "DC"] as const).map((t) => (
              <span key={t} className={REQ_TYPE_CHIP[t]}>{t}<span className="text-slate-600"> {REQ_TYPE_LABEL[t]}</span></span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-2 py-2 text-left font-medium">Requirement</th>
                <th className="px-2 py-2 text-center font-medium">Band</th>
                {GATES.map((g) => <th key={g} className="px-1.5 py-2 text-center font-mono font-medium">{g}</th>)}
                <th className="px-2 py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {GATE_REQUIREMENTS.map((req) => {
                const status = requirementStatus(req, sel);
                const earliest = GATES.indexOf(req.earliestGate);
                return (
                  <tr key={req.id} className="border-b border-slate-900 hover:bg-slate-800/30">
                    <td className={`px-3 py-1.5 font-mono text-[11px] ${REQ_TYPE_CHIP[req.type]}`}>{req.id}</td>
                    <td className="px-2 py-1.5">
                      <div className="text-[13px] text-slate-200 leading-tight">{req.title}</div>
                      <div className="text-[10px] text-slate-500">{req.verification}{req.parentId && req.parentId !== req.id ? ` · ↳ ${req.parentId}` : ""}</div>
                    </td>
                    <td className="px-2 py-1.5 text-center text-[11px] tabular-nums text-slate-400">±{Math.round(req.band * 100)}%</td>
                    {GATES.map((g, gi) => {
                      if (gi < earliest) return <td key={g} className="px-1.5 py-1.5 text-center text-slate-800">·</td>;
                      // required at this gate onward; color by the selected project's progression
                      const cellState = gi < gateIdx + 1 ? "done" : gi === gateIdx + 1 ? "next" : "future";
                      const dot = cellState === "done" ? "bg-emerald-400" : cellState === "next" ? "bg-amber-400" : "bg-slate-600";
                      const ring = gi === earliest ? "ring-1 ring-cyan-500/40" : "";
                      return <td key={g} className="px-1.5 py-1.5 text-center"><span className={`inline-block h-2.5 w-2.5 rounded-full ${dot} ${ring}`} title={gi === earliest ? "first required here" : "required"} /></td>;
                    })}
                    <td className="px-2 py-1.5 text-right">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${REQ_STATUS_CHIP[status]}`}>{REQ_STATUS_LABEL[status]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />satisfied (gate complete)</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />in work (next gate)</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-600" />required (future gate)</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-600 ring-1 ring-cyan-500/40" />first required at this gate</span>
        </div>
      </section>
    </div>
  );
}

// ── BUSINESS SETUP (master data admin) — unlock 369963 → set up BU→SBU→Alpha Group→Alpha
// Code→Product→Material. Seeds from the live portfolio; edits persist to localStorage.
const BIZ_KEY = "innovation-biz-setup";
const ADMIN_KEY = "innovation-admin";
function BusinessSetup() {
  const [admin, setAdmin] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [setup, setSetup] = useState<BizSetup>(() => seedBizSetup(DEMO_PROJECTS));
  const [tier, setTier] = useState<BizTier>("bu");
  useEffect(() => {
    setAdmin(sessionStorage.getItem(ADMIN_KEY) === "1");
    const saved = localStorage.getItem(BIZ_KEY);
    if (saved) { try { setSetup(JSON.parse(saved)); } catch { /* keep seed */ } }
  }, []);
  const persist = (next: BizSetup) => { setSetup(next); localStorage.setItem(BIZ_KEY, JSON.stringify(next)); };
  const unlock = () => (pw === CODE ? (sessionStorage.setItem(ADMIN_KEY, "1"), setAdmin(true)) : setErr(true));

  if (!admin) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border border-amber-500/30 bg-[#111820] p-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">Admin · Master Business Setup</div>
        <h2 className="mt-1 text-lg font-semibold">Business Setup — Admin Unlock</h2>
        <p className="mt-2 text-sm text-slate-400">Enter the admin code to set up the master hierarchy: BU · SBU · Alpha Group · Alpha Code · Product · Material.</p>
        <input type="password" inputMode="numeric" value={pw} autoFocus
          onChange={(e) => { setPw(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && unlock()}
          placeholder="Admin code" className="mt-4 w-full rounded-lg border border-slate-700 bg-[#0b0f14] px-3 py-2.5 text-center tracking-[0.4em] font-mono text-lg outline-none focus:border-amber-500" />
        {err && <p className="mt-2 text-sm text-rose-400">Incorrect code.</p>}
        <button onClick={unlock} className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-[#06202a] hover:bg-amber-400">Unlock Business Setup</button>
      </div>
    );
  }

  const tierMeta = BIZ_TIERS.find((t) => t.key === tier)!;
  const parentTier = tierMeta.parent;
  const rows = setup[tier];
  const parentRows = parentTier ? setup[parentTier] : [];
  const setRows = (next: BizNode[]) => persist({ ...setup, [tier]: next });
  const updateRow = (i: number, patch: Partial<BizNode>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows([...rows, { code: `NEW${rows.length + 1}`, label: "New " + tierMeta.label, parent: parentRows[0]?.code, baseM: tier === "sbu" ? 0 : undefined }]);
  const delRow = (i: number) => setRows(rows.filter((_, j) => j !== i));
  const resetSeed = () => persist(seedBizSetup(DEMO_PROJECTS));
  const inp = "rounded border border-slate-700 bg-[#0b0f14] px-1.5 py-0.5 text-xs text-slate-100 outline-none focus:border-cyan-500";
  const totalBase = setup.sbu.reduce((s, n) => s + (n.baseM ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">Master Business Setup · Admin</div>
          <input value={setup.company} onChange={(e) => persist({ ...setup, company: e.target.value })}
            className="mt-0.5 rounded border border-slate-700 bg-[#0b0f14] px-2 py-1 text-lg font-semibold text-slate-100 outline-none focus:border-cyan-500" />
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="text-slate-500">Σ SBU base <b className="text-emerald-300">${totalBase}M</b></span>
          <button onClick={resetSeed} className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">Reset to seed</button>
          <button onClick={() => { sessionStorage.removeItem(ADMIN_KEY); setAdmin(false); }} className="rounded border border-slate-700 px-2 py-1 text-slate-400 hover:bg-slate-800">Lock</button>
        </div>
      </div>

      {/* Tier tabs */}
      <div className="flex flex-wrap gap-1">
        {BIZ_TIERS.map((t) => (
          <button key={t.key} onClick={() => setTier(t.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${tier === t.key ? "bg-cyan-500 text-[#06202a]" : "border border-slate-700 text-slate-300 hover:bg-slate-800"}`}>
            {t.label} <span className="opacity-60">({setup[t.key].length})</span>
          </button>
        ))}
      </div>

      {/* Editable tier table */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
          <h2 className="text-sm font-semibold">{tierMeta.label} <span className="text-[11px] text-slate-500">{parentTier ? `→ under ${BIZ_TIERS.find((t) => t.key === parentTier)!.label}` : "top of hierarchy"}</span></h2>
          <button onClick={addRow} className="rounded bg-cyan-500/90 px-2.5 py-1 text-[11px] font-semibold text-[#06202a] hover:bg-cyan-400">+ Add {tierMeta.label}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-2 py-2 text-left">Label</th>
                {parentTier && <th className="px-2 py-2 text-left">{BIZ_TIERS.find((t) => t.key === parentTier)!.label}</th>}
                {tier === "sbu" && <th className="px-2 py-2 text-right">Base $M</th>}
                <th className="px-2 py-2 text-right">·</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-900">
                  <td className="px-3 py-1.5"><input value={r.code} onChange={(e) => updateRow(i, { code: e.target.value })} className={`w-24 font-mono ${inp}`} /></td>
                  <td className="px-2 py-1.5"><input value={r.label} onChange={(e) => updateRow(i, { label: e.target.value })} className={`w-full ${inp}`} /></td>
                  {parentTier && (
                    <td className="px-2 py-1.5">
                      <select value={r.parent ?? ""} onChange={(e) => updateRow(i, { parent: e.target.value })} className={inp}>
                        <option value="">—</option>
                        {parentRows.map((pr) => <option key={pr.code} value={pr.code}>{pr.code}</option>)}
                      </select>
                    </td>
                  )}
                  {tier === "sbu" && <td className="px-2 py-1.5 text-right"><input type="text" inputMode="numeric" value={String(r.baseM ?? 0)} onChange={(e) => /^\d*$/.test(e.target.value) && updateRow(i, { baseM: +e.target.value })} className={`w-16 text-right tabular-nums ${inp}`} /></td>}
                  <td className="px-2 py-1.5 text-right"><button onClick={() => delRow(i)} className="rounded px-1.5 text-rose-400 hover:bg-rose-500/10" title="Delete">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800">Master data persists in this browser. Codes: BU 2-letter · SBU 3-letter · Alpha Group alphanumeric · Alpha Code 4-char · Product 7xxxx · Material 7xxxx-yyy. Base revenue on the SBU anchors the growth model.</p>
      </section>
    </div>
  );
}

function Differentiators({ p }: { p: Project }) {
  const monthsEarly = 1.0;
  const programValueM = weightedRevM(p) * 0.35;
  const upsidePoolM = programValueM * 0.111 * monthsEarly;  // CRS-91 ~11.1%/month early
  const burnPerMinUsd = (p.nreK * 1000) / (18 * 30 * 24 * 60); // NRE burn over ~18 mo, $/min
  const guard = p.humanLoad > 0.7;                              // CRS-93 burnout guard
  return (
    <div className="space-y-4">
      {/* Risk market */}
      <Card title="Risk-prediction market" tag="CRS-81→84">
        <Row l="Open predictions" v={`${p.predictions}`} />
        <Row l="Mitigated payout" v="= materialized" good />
        <Row l="Roles enforced" v="predictor ≠ actioner ≠ resolver" />
        <p className="mt-1 text-[11px] text-slate-500">Any user may predict; themed at 1M/60s, deterministic (CRS-82).</p>
      </Card>
      {/* Upside pool + $/min */}
      <Card title="Project Upside pool" tag="CRS-88/91/92">
        <Row l="Pool @ 1 mo early" v={usd(upsidePoolM)} good />
        <Row l="Cost of time" v={`$${burnPerMinUsd.toFixed(2)}/min`} />
        <Row l="Critical-path" v={p.criticalPath ? "multiplier ×" : "base rate"} tone={p.criticalPath ? "good" : undefined} />
        <p className="mt-1 text-[11px] text-slate-500">Baseline locked at G2 by an approver outside the team (CRS-90).</p>
      </Card>
      {/* Intelligence load */}
      <Card title="Intelligence load · AI · SI · HI" tag="CRS-93">
        <div className="mt-1 flex h-3 overflow-hidden rounded-full">
          <span className="bg-cyan-500" style={{ width: `${p.ai * 100}%` }} title="AI" />
          <span className="bg-amber-400" style={{ width: `${p.si * 100}%` }} title="SI" />
          <span className="bg-violet-400" style={{ width: `${p.hi * 100}%` }} title="HI" />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-500">
          <span>AI {Math.round(p.ai * 100)}%</span><span>SI {Math.round(p.si * 100)}%</span><span>HI {Math.round(p.hi * 100)}%</span>
        </div>
        <Row l="Human load" v={`${Math.round(p.humanLoad * 100)}%`} tone={guard ? "bad" : "ok"} />
        {guard && <p className="mt-1 text-[11px] text-rose-400">⚠ Burnout guard active — upside withheld pending review.</p>}
      </Card>
    </div>
  );
}

// Growth Model (CRS-69) — the signature Rack & Stack chart, now with the full FLIR control set:
// BU→SBU hierarchy filter, # Years (1/3/10), Targeted Growth Rate, YoY Do-Nothing decline,
// Revenue Options (which NPI steps count), Show/Hide baseline, 4-series legend.
const GATE_DIAMONDS = ["G1", "G2", "G3", "G4", "G5", "G6", "G7"] as const;
function GrowthModelChart({ funded }: { funded: Project[] }) {
  const [bu, setBu] = useState("All");
  const [sbu, setSbu] = useState("All");
  const [pg, setPg] = useState("All");
  const [years, setYears] = useState(3);
  const [growthPct, setGrowthPct] = useState("3.8");
  const [declinePct, setDeclinePct] = useState("15.1");
  const [revMode, setRevMode] = useState<RevMode>("full");
  const [showBaseline, setShowBaseline] = useState(true);
  // SBU base revenue ($M) — enterable; defaults to scope (SBU → SBU base · BU → Σ SBUs · Company → 700).
  const [baseStr, setBaseStr] = useState(String(companyBaseM()));
  useEffect(() => { setBaseStr(String(scopeBaseM(bu, sbu))); }, [bu, sbu]);
  // View level (max-UX switcher): Company → BU → SBU → Product Group. Drives the scope dropdowns.
  const [level, setLevel] = useState<"company" | "bu" | "sbu" | "pg">("company");
  const [hover, setHover] = useState<number | null>(null);
  const firstBu = () => hierValues(funded, "bu")[0] ?? "All";
  const setLevelScope = (lv: "company" | "bu" | "sbu" | "pg") => {
    setLevel(lv);
    if (lv === "company") { setBu("All"); setSbu("All"); setPg("All"); }
    else if (lv === "bu") { setSbu("All"); setPg("All"); if (bu === "All") setBu(firstBu()); }
    else if (lv === "sbu") { setPg("All"); if (bu === "All") setBu(firstBu()); }
    else { if (bu === "All") setBu(firstBu()); }
  };

  const bus = useMemo(() => ["All", ...hierValues(funded, "bu")], [funded]);
  const sbus = useMemo(() => ["All", ...hierValues(funded, "sbu", bu === "All" ? undefined : { level: "bu", value: bu })], [funded, bu]);
  const pgs = useMemo(() => ["All", ...hierValues(funded, "pgroup", sbu === "All" ? undefined : { level: "sbu", value: sbu })], [funded, sbu]);
  const scoped = useMemo(() => {
    let s = filterByHier(funded, "bu", bu);
    s = filterByHier(s, "sbu", sbu);
    s = filterByHier(s, "pgroup", pg);
    return s;
  }, [funded, bu, sbu, pg]);

  const growth = (parseFloat(growthPct) || 0) / 100;
  const decline = (parseFloat(declinePct) || 0) / 100;
  const baseM = parseFloat(baseStr) || 0;
  const rows = growthModel(scoped, { years, growth, decline, revMode, baseYear: 2026, baseOverrideM: baseM });
  const W = 720, H = 240, L = 34, B = 26, T = 26, R = 10;
  const stackOf = (r: (typeof rows)[number]) => (showBaseline ? r.doNothing : 0) + r.weighted + r.remaining;
  const max = Math.max(...rows.map((r) => Math.max(r.target, stackOf(r))), 1) * 1.1;
  const pw = (W - L - R) / rows.length;
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  const cagr = ((Math.pow((rows[rows.length - 1]?.target || 1) / (rows[0]?.target || 1), 1 / Math.max(1, rows.length - 1)) - 1) * 100).toFixed(1);

  const selStyle = "rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500";
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Growth Model · Do-Nothing Scenario with Rack &amp; Stack NPIs</h3>
        <span className="text-[11px] text-slate-500">target CAGR ~{cagr}% · {scoped.length} project{scoped.length === 1 ? "" : "s"}</span>
      </div>

      {/* View-level switcher (max UX): Company → BU → SBU → Product Group, + cascading scope */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <div className="flex overflow-hidden rounded-md border border-slate-700">
          {([["company", "Company"], ["bu", "BU"], ["sbu", "SBU"], ["pg", "Alpha Group"]] as const).map(([lv, lbl]) => (
            <button key={lv} onClick={() => setLevelScope(lv)}
              className={`px-2.5 py-1 ${level === lv ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
        {level !== "company" && (
          <label>BU
            <select value={bu} onChange={(e) => { setBu(e.target.value); setSbu("All"); setPg("All"); }} className={`ml-1.5 ${selStyle}`}>
              {bus.filter((o) => o !== "All").map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
        {(level === "sbu" || level === "pg") && (
          <label>SBU
            <select value={sbu} onChange={(e) => { setSbu(e.target.value); setPg("All"); }} className={`ml-1.5 ${selStyle}`}>
              {sbus.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
        {level === "pg" && (
          <label>Product Group
            <select value={pg} onChange={(e) => setPg(e.target.value)} className={`ml-1.5 ${selStyle}`}>
              {pgs.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
        {/* # Years */}
        <div className="ml-auto flex overflow-hidden rounded-md border border-slate-700">
          {[1, 3, 10].map((yv) => (
            <button key={yv} onClick={() => setYears(yv)}
              className={`px-2.5 py-1 font-mono ${years === yv ? "bg-cyan-500 text-[#06202a]" : "text-slate-300 hover:bg-slate-800"}`}>{yv}yr</button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" preserveAspectRatio="xMidYMid meet" style={{ height: "auto" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={L} y1={y(max * f)} x2={W - R} y2={y(max * f)} stroke="rgba(148,163,184,.12)" />
        ))}
        {rows.map((r, i) => {
          const x = L + i * pw + pw * 0.18, bw = pw * 0.64;
          const base = showBaseline ? r.doNothing : 0;
          const dnH = (H - B) - y(base);
          const wY = y(base + r.weighted), rY = y(base + r.weighted + r.remaining);
          const on = hover === i;
          const dim = hover != null && !on ? 0.35 : 1;
          const cx = x + bw / 2;
          const lbl = (yy: number, v: number, fill: string) => v > 0.5 ? <text x={cx} y={yy} textAnchor="middle" fill={fill} fontSize="9" fontWeight="700">{Math.round(v)}</text> : null;
          return (
            <g key={r.year} fontFamily="ui-monospace, monospace" fontSize="9" opacity={dim}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <title>{r.year}: do-nothing {Math.round(base)} · REV {Math.round(r.weighted)} · upside {Math.round(r.remaining)} · target {Math.round(r.target)}</title>
              {/* invisible hit area so hover works over the whole column */}
              <rect x={x} y={T} width={bw} height={H - B - T} fill="transparent" />
              {showBaseline && <rect x={x} y={y(base)} width={bw} height={Math.max(0, dnH)} fill="#64748b" opacity={on ? 0.95 : 0.7} />}
              <rect x={x} y={wY} width={bw} height={Math.max(0, y(base) - wY)} fill="#34d399" opacity={on ? 1 : 0.9} />
              <rect x={x} y={rY} width={bw} height={Math.max(0, wY - rY)} fill="#fbbf24" opacity={on ? 1 : 0.9} />
              <text x={cx} y={H - B + 12} textAnchor="middle" fill={on ? "#e2e8f0" : "#64748b"}>{r.year}</text>
              <text x={cx} y={rY - 4} textAnchor="middle" fill="#e2e8f0">{Math.round(stackOf(r))}</text>
              {/* On hover: reveal grey / green / orange segment numbers in-place */}
              {on && showBaseline && lbl(y(base) + dnH / 2 + 3, base, "#cbd5e1")}
              {on && lbl((wY + y(base)) / 2 + 3, r.weighted, "#06281f")}
              {on && lbl((rY + wY) / 2 + 3, r.remaining, "#3a2a06")}
            </g>
          );
        })}
        <polyline points={rows.map((r, i) => `${L + i * pw + pw * 0.5},${y(r.target)}`).join(" ")} fill="none" stroke="#e2e8f0" strokeWidth="1.4" />
        {rows.map((r, i) => <circle key={r.year} cx={L + i * pw + pw * 0.5} cy={y(r.target)} r="2.6" fill="#e2e8f0" />)}
        {/* Gate cadence — MIL-STD-2525 hostile (red) diamonds between the bars, G1..G7 */}
        {GATE_DIAMONDS.map((g, i) => {
          const gx = L + ((i + 0.5) / GATE_DIAMONDS.length) * (W - L - R);
          const gy = T - 8;
          return (
            <g key={g} fontFamily="ui-monospace, monospace">
              <rect x={gx - 4} y={gy - 4} width="8" height="8" transform={`rotate(45 ${gx} ${gy})`} fill="#ef4444" stroke="#fca5a5" strokeWidth="0.6" />
              <text x={gx} y={gy - 7} textAnchor="middle" fill="#fca5a5" fontSize="7">{g}</text>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#64748b" }} />Do-Nothing baseline (grey — set 0 for per-project)</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#34d399" }} />REV · probability-weighted</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#fbbf24" }} />Upside · risk-weighted</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#e2e8f0" }} />Growth target</span>
      </div>

      {/* Adjustable rates + revenue options (FLIR control parity) */}
      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
        <label>Base revenue $M ({bu === "All" ? "Company" : bu})
          <input type="text" inputMode="decimal" value={baseStr} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setBaseStr(e.target.value)}
            className={`ml-1.5 w-20 ${selStyle} tabular-nums`} />
        </label>
        <label>Targeted Growth %
          <input type="text" inputMode="decimal" value={growthPct} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setGrowthPct(e.target.value)}
            className={`ml-1.5 w-16 ${selStyle} tabular-nums`} />
        </label>
        <label>YoY Do-Nothing % (decline)
          <input type="text" inputMode="decimal" value={declinePct} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setDeclinePct(e.target.value)}
            className={`ml-1.5 w-16 ${selStyle} tabular-nums`} />
        </label>
        <label>Revenue Options
          <select value={revMode} onChange={(e) => setRevMode(e.target.value as RevMode)} className={`ml-1.5 ${selStyle}`}>
            {(Object.keys(REV_MODE) as RevMode[]).map((m) => <option key={m} value={m}>{REV_MODE[m].label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showBaseline} onChange={(e) => setShowBaseline(e.target.checked)} className="accent-cyan-500" />
          Show baseline
        </label>
      </div>
    </div>
  );
}

// ── DASHBOARDS (ROI Visuals) — Rack & Stack dashboards, themed eXeL AI Polling ───────────
function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "cyan" | "green" | "amber" | "violet" }) {
  const c = tone === "green" ? "text-emerald-400" : tone === "amber" ? "text-amber-300" : tone === "violet" ? "text-violet-300" : "text-cyan-300";
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${c}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
// Horizontal bar list — one coherent mark style across every dashboard.
function HBars({ rows, fmt }: { rows: { name: string; value: number; color?: string; sub?: string }[]; fmt: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2 text-[12px]">
          <div className="w-32 shrink-0 truncate text-slate-300" title={r.name}>{r.name}</div>
          <div className="relative h-4 flex-1 rounded bg-[#0b0f14] overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(r.value / max) * 100}%`, background: r.color || "#19c8cf", opacity: 0.85 }} />
          </div>
          <div className="w-20 shrink-0 text-right tabular-nums text-slate-200">{fmt(r.value)}</div>
          {r.sub && <div className="w-10 shrink-0 text-right text-[10px] text-slate-500">{r.sub}</div>}
        </div>
      ))}
    </div>
  );
}
function DashCard({ title, tag, children }: { title: string; tag?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {tag && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">{tag}</span>}
      </div>
      {children}
    </div>
  );
}

// Financial Map — R&D Spend (cost) vs Risk-Weighted Revenue per project, with an Upside toggle.
// The 3rd-most-important view (Financial): where each project sits on cost-vs-return.
function FinancialMap({ projects, onSelect }: { projects: Project[]; onSelect: (id: string) => void }) {
  const [mode, setMode] = useState<"rw" | "upside">("rw");
  const [hover, setHover] = useState<string | null>(null);
  const W = 720, H = 300, L = 46, B = 34, T = 16, R = 16;
  const xOf = (p: Project) => p.nreK / 1000; // $M R&D spend
  const yOf = (p: Project) => (mode === "rw" ? weightedRevM(p) : incrementalRevM(p));
  const maxX = Math.max(...projects.map(xOf), 1) * 1.1;
  const maxY = Math.max(...projects.map(yOf), 1) * 1.1;
  const px = (v: number) => L + (v / maxX) * (W - L - R);
  const py = (v: number) => H - B - (v / maxY) * (H - B - T);
  const rOf = (p: Project) => Math.max(4, Math.min(20, Math.sqrt(Math.max(1, npvM(p))) * 2));
  const usdM = (v: number) => `$${v.toFixed(0)}M`;
  return (
    <DashCard title="Financial Map · R&D Spend vs Risk-Weighted Revenue" tag="Financial ★">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <div className="flex overflow-hidden rounded-md border border-slate-700">
          {([["rw", "Risk-weighted"], ["upside", "Upside (unweighted)"]] as const).map(([m, lbl]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 ${mode === m ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
        <span className="text-[10px] text-slate-500">bubble size = NPV · color = dev-type · top-left = high return / low cost</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet" style={{ height: "auto" }}>
        {/* sweet-spot shading (low cost, high return) */}
        <rect x={L} y={T} width={(W - L - R) * 0.4} height={(H - B - T) * 0.5} fill="rgba(52,211,153,.06)" />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={L} y1={py(maxY * f)} x2={W - R} y2={py(maxY * f)} stroke="rgba(148,163,184,.1)" />
            <text x={L - 4} y={py(maxY * f) + 3} textAnchor="end" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">{Math.round(maxY * f)}</text>
          </g>
        ))}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={px(maxX * f)} y={H - B + 12} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">${Math.round(maxX * f)}M</text>
        ))}
        <text x={(L + W - R) / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">R&amp;D Spend (NRE $M) →</text>
        <text x={12} y={(T + H - B) / 2} textAnchor="middle" fontSize="9" fill="#94a3b8" transform={`rotate(-90 12 ${(T + H - B) / 2})`}>{mode === "rw" ? "Risk-Weighted Revenue $M ↑" : "Upside Revenue $M ↑"}</text>
        {projects.map((p) => {
          const cx = px(xOf(p)), cy = py(yOf(p)), on = hover === p.id;
          return (
            <g key={p.id} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(p.id)} style={{ cursor: "pointer" }}>
              <title>{p.name} · spend {usdM(xOf(p))} · {mode === "rw" ? "risk-wt" : "upside"} rev {usdM(yOf(p))} · NPV {usdM(npvM(p))}</title>
              <circle cx={cx} cy={cy} r={rOf(p)} fill={DEV_TYPE[devTypeOf(p)].color} opacity={on ? 0.95 : 0.6} stroke={on ? "#e2e8f0" : "none"} strokeWidth="1.2" />
              <text x={cx} y={cy + 2.5} textAnchor="middle" fontSize="7.5" fill="#06202a" fontWeight="700" fontFamily="ui-monospace, monospace">{p.id.replace("PRJ-", "")}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        {(Object.keys(DEV_TYPE) as (keyof typeof DEV_TYPE)[]).map((k2) => (
          <span key={k2}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: DEV_TYPE[k2].color }} />{DEV_TYPE[k2].label}</span>
        ))}
      </div>
    </DashCard>
  );
}

function Dashboards({ projects, funded, onSelect }: { projects: Project[]; funded: Project[]; onSelect: (id: string) => void }) {
  const npvTotal = funded.reduce((s, p) => s + npvM(p), 0);
  const incrTotal = funded.reduce((s, p) => s + incrementalRevM(p), 0);
  const wtdTotal = funded.reduce((s, p) => s + weightedRevM(p), 0);
  const eff = rdEfficiency(funded);
  const byBU = spendByBU(projects);
  const byCat = spendByCategory(projects);
  const cost = costSplit(projects);
  const roi = roiSummary(funded);
  const pipe = pipelineByGate(projects);
  const maxGateSpend = Math.max(...pipe.map((g) => g.spendK), 1);

  const costRows = [
    { name: "Labor", value: cost.labor, color: "#19c8cf" },
    { name: "Subcontractor", value: cost.subcontractor, color: "#a78bfa" },
    { name: "Material", value: cost.material, color: "#fbbf24" },
    { name: "Other", value: cost.other, color: "#64748b" },
  ];
  const roiRows = [
    { name: "New Product (rev)", value: roi.newProductM, color: "#34d399" },
    { name: "Do-Nothing base", value: roi.doNothingM, color: "#64748b" },
    { name: "End-of-Life", value: roi.eolM, color: "#fb923c" },
    { name: "Incremental", value: roi.incrementalM, color: "#19c8cf" },
    { name: "Prob-weighted", value: roi.weightedM, color: "#c084fc" },
  ];
  const kM = (v: number) => `$${(v / 1000).toFixed(1)}M`;
  const roll = companyRollup(projects);

  return (
    <div className="space-y-4">
      {/* Financial Map — R&D spend vs risk-weighted revenue (Financial = 3rd-most-important) */}
      <FinancialMap projects={projects} onSelect={onSelect} />

      {/* Company → BU → SBU → Product Group rollup (base revenue · spend · NPV) */}
      <DashCard title="Rollup · Company → BU → SBU → Product Group" tag="Company">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-2 py-1.5 text-left">Node</th>
                <th className="px-2 py-1.5 text-right">Base rev</th>
                <th className="px-2 py-1.5 text-right">NRE spend</th>
                <th className="px-2 py-1.5 text-right">NPV</th>
                <th className="px-2 py-1.5 text-right">Projects</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800 font-semibold">
                <td className="px-2 py-1.5 text-cyan-300">◱ {roll.company.name}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300">${roll.company.baseM}M</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-slate-300">{kM(roll.company.spendK)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-emerald-400">{usd(roll.company.npvM)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-slate-400">{roll.company.count}</td>
              </tr>
              {roll.bus.map((bu) => (
                <React.Fragment key={bu.name}>
                  <tr className="border-b border-slate-900 bg-slate-900/40">
                    <td className="px-2 py-1.5 pl-4 font-semibold text-slate-100">▸ {bu.name} <span className="text-[10px] text-slate-500">{BU_LABEL[bu.name] ?? "BU"}</span></td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300">${bu.baseM}M</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-300">{kM(bu.spendK)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-400">{usd(bu.npvM)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-400">{bu.count}</td>
                  </tr>
                  {bu.sbus.map((sbu) => (
                    <React.Fragment key={sbu.name}>
                      <tr className="border-b border-slate-900 bg-slate-900/20">
                        <td className="px-2 py-1 pl-8 font-medium">· {sbu.name} <span className="text-[10px] text-slate-500">{SBU_LABEL[sbu.name] ?? "SBU"}</span></td>
                        <td className="px-2 py-1 text-right tabular-nums text-emerald-300">${sbu.baseM}M</td>
                        <td className="px-2 py-1 text-right tabular-nums text-slate-300">{kM(sbu.spendK)}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-emerald-400">{usd(sbu.npvM)}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-slate-400">{sbu.count}</td>
                      </tr>
                      {sbu.groups.map((g) => (
                        <tr key={g.name} className="border-b border-slate-900/50 text-[12px]">
                          <td className="px-2 py-1 pl-12 text-slate-400">– {g.name} <span className="text-[10px] text-slate-600">(PG)</span></td>
                          <td className="px-2 py-1 text-right text-slate-600">—</td>
                          <td className="px-2 py-1 text-right tabular-nums text-slate-400">{kM(g.spendK)}</td>
                          <td className="px-2 py-1 text-right tabular-nums text-slate-400">{usd(g.npvM)}</td>
                          <td className="px-2 py-1 text-right tabular-nums text-slate-500">{g.count}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Base revenue anchors the do-nothing growth model per SBU. BU = Σ its SBUs · Company = Σ all BUs (700M).</p>
      </DashCard>

      {/* Top Dashboard — FLIR R&D VIEW KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Projects" value={`${projects.length}`} sub={`${funded.length} funded`} />
        <StatTile label="R&D efficiency" value={`${eff.toFixed(2)}×`} sub="NPV per $ NRE" tone="green" />
        <StatTile label="10yr Op Contribution" value={usd(npvTotal)} sub="funded NPV" tone="green" />
        <StatTile label="Incremental rev" value={usd(incrTotal)} sub="10yr, funded" tone="cyan" />
        <StatTile label="Prob-weighted rev" value={usd(wtdTotal)} sub="risk-adjusted" tone="violet" />
        <StatTile label="Total NRE" value={kM(cost.totalK)} sub="all projects" tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Division / BU Dashboard */}
        <DashCard title="Spend by Business Unit" tag="Division">
          <HBars rows={byBU.map((s) => ({ name: s.name, value: s.spendK, sub: `${s.count}` }))} fmt={kM} />
          <p className="mt-2 text-[10px] text-slate-500">Bar = NRE spend · right count = # projects in the BU.</p>
        </DashCard>

        {/* Spend by Category */}
        <DashCard title="Spend by Category" tag="Top">
          <HBars rows={byCat.map((s) => ({ name: s.name, value: s.spendK, color: "#38bdf8", sub: `${s.count}` }))} fmt={kM} />
        </DashCard>

        {/* Cost Dashboard */}
        <DashCard title="Cost Dashboard · expense split" tag="Cost">
          <HBars rows={costRows} fmt={kM} />
          <p className="mt-2 text-[10px] text-slate-500">Labor / Subcontractor / Material / Other — split of {kM(cost.totalK)} total NRE.</p>
        </DashCard>

        {/* ROI Summary */}
        <DashCard title="ROI Summary" tag="ROI Visuals">
          <HBars rows={roiRows} fmt={usd} />
          <p className="mt-2 text-[10px] text-slate-500">New / Do-Nothing / EOL / Incremental, then probability-weighted (technical × commercial risk).</p>
        </DashCard>
      </div>

      {/* Pipeline by Gate */}
      <DashCard title="Pipeline by Gate" tag="Unofficial Framework">
        <div className="grid grid-cols-7 gap-2">
          {pipe.map((g) => (
            <div key={g.gate} className="rounded-lg border border-slate-800 bg-[#0b0f14] p-2 text-center">
              <div className="text-[11px] font-mono text-slate-300">{g.gate}</div>
              <div className="text-[9px] text-slate-500 mb-1.5 truncate" title={g.stage}>{g.stage}</div>
              <div className="mx-auto flex h-16 w-full items-end justify-center">
                <div className="w-6 rounded-t" style={{ height: `${Math.max(4, (g.spendK / maxGateSpend) * 60)}px`, background: "#19c8cf", opacity: 0.8 }} />
              </div>
              <div className="mt-1 text-[11px] tabular-nums text-slate-200">{kM(g.spendK)}</div>
              <div className="text-[10px] text-slate-500">{g.count} proj</div>
            </div>
          ))}
        </div>
        {/* Dev-type legend + colored chips per project */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
          {(Object.keys(DEV_TYPE) as (keyof typeof DEV_TYPE)[]).map((k2) => (
            <span key={k2}><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: DEV_TYPE[k2].color }} />{DEV_TYPE[k2].label}</span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {projects.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)}
              className="rounded px-2 py-0.5 text-[10px] font-medium text-[#06202a] hover:opacity-90"
              style={{ background: DEV_TYPE[devTypeOf(p)].color }} title={`${p.name} · ${p.gate}`}>
              {p.id}
            </button>
          ))}
        </div>
      </DashCard>

      {/* Dependencies — Summary table + Constellation graph (FLIR §4) */}
      <DependencyPanel projects={projects} deps={DEMO_DEPS} onSelect={onSelect} />
    </div>
  );
}

// Dependencies (FLIR §4) — Summary table (§4.2) + Constellation graph (§4.3). Directed edge
// A→B = "B's risk affects A's success". Bubble ∝ NPV · border green above-line / red below ·
// fill by BU · arrows point to the primary (bottom) dependency.
const BU_COLOR: Record<string, string> = { MS: "#19c8cf", DS: "#c084fc", AP: "#fbbf24" };
function DependencyPanel({ projects, deps, onSelect }: { projects: Project[]; deps: DepEdge[]; onSelect: (id: string) => void }) {
  const summary = dependencySummary(projects, deps);
  const kM = (v: number) => `$${v.toFixed(1)}M`;
  // Constellation layout: projects on a circle, deterministic by index; bubble ∝ √NPV.
  const withDeps = projects.filter((p) => dependsOn(deps, p.id).length || dependentsOf(deps, p.id).length);
  const W = 640, H = 380, cx = W / 2, cy = H / 2, R = 150;
  const pos = new Map<string, { x: number; y: number; r: number }>();
  const maxNpv = Math.max(...withDeps.map((p) => Math.abs(npvM(p))), 1);
  withDeps.forEach((p, i) => {
    const a = (i / withDeps.length) * Math.PI * 2 - Math.PI / 2;
    pos.set(p.id, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), r: 8 + 16 * Math.sqrt(Math.abs(npvM(p)) / maxNpv) });
  });
  return (
    <DashCard title="Dependencies · Summary + Constellation" tag="§4">
      {/* Constellation graph */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 520, height: "auto" }}>
          <defs>
            <marker id="dep-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
            </marker>
          </defs>
          {deps.map((e, i) => {
            const a = pos.get(e.from), b = pos.get(e.to);
            if (!a || !b) return null;
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={e.critical ? "#fb7185" : "#475569"} strokeWidth={e.critical ? 1.6 : 1} strokeDasharray={e.acknowledged ? "" : "4 3"} markerEnd="url(#dep-arrow)" opacity={0.7} />;
          })}
          {withDeps.map((p) => {
            const pt = pos.get(p.id)!;
            const above = npvM(p) >= 0;
            return (
              <g key={p.id} className="cursor-pointer" onClick={() => onSelect(p.id)}>
                <circle cx={pt.x} cy={pt.y} r={pt.r} fill={BU_COLOR[hierOf(p).bu] ?? "#38bdf8"} fillOpacity={0.25} stroke={above ? "#34d399" : "#fb7185"} strokeWidth={2} />
                <text x={pt.x} y={pt.y - pt.r - 3} textAnchor="middle" fontSize="9" fill="#cbd5e1" fontFamily="ui-monospace, monospace">{hierOf(p).bu}·{p.id.slice(-2)}</text>
                <text x={pt.x} y={pt.y + 3} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">{usd(npvM(p))}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span>bubble ∝ NPV</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full ring-2 ring-emerald-400" />above line</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full ring-2 ring-rose-400" />below line</span>
        <span><span className="mr-1 text-rose-400">──</span>critical</span>
        <span><span className="mr-1 text-slate-500">– –</span>unacknowledged</span>
        {(["MS", "DS", "AP"] as const).map((b) => <span key={b}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: BU_COLOR[b] }} />{b}</span>)}
      </div>
      {/* Summary table (§4.2) */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-2 py-1.5 text-left">Project</th>
              <th className="px-2 py-1.5 text-right">NPV</th>
              <th className="px-2 py-1.5 text-right">NPV w/ deps</th>
              <th className="px-2 py-1.5 text-center"># deps →</th>
              <th className="px-2 py-1.5 text-center"># dependents ←</th>
            </tr>
          </thead>
          <tbody>
            {summary.filter((r) => r.deps || r.dependents).map((r) => (
              <tr key={r.id} onClick={() => onSelect(r.id)} className="cursor-pointer border-b border-slate-900 hover:bg-slate-800/40">
                <td className="px-2 py-1.5"><span className="font-medium">{r.name}</span> {r.critical && <span className="ml-1 text-[10px] text-rose-400">⚡crit</span>}<div className="text-[10px] text-slate-500">{r.division}</div></td>
                <td className={`px-2 py-1.5 text-right tabular-nums ${r.npvM >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{kM(r.npvM)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-cyan-300">{kM(r.npvWithDepsM)}</td>
                <td className="px-2 py-1.5 text-center tabular-nums text-slate-300">{r.deps || "–"}</td>
                <td className="px-2 py-1.5 text-center tabular-nums text-slate-300">{r.dependents || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">Arrow A→B: B&apos;s risk affects A. NPV-with-deps rolls the NPV a project leans on into its own — a below-line dependency drags an above-line project.</p>
    </DashCard>
  );
}

// Crowd-sourced Risk Register — anyone documents a risk, the community polls it (votes),
// the team de-risks it (status ladder). The 2525 differentiator vs. a static risk cell.
const RISK_CATS: RiskCategory[] = ["technical", "commercial", "schedule", "supply", "regulatory", "other"];
const RISK_STATUS_ORDER: RiskStatus[] = ["open", "mitigating", "mitigated", "accepted"];
const bandColor: Record<string, string> = {
  low: "bg-slate-700 text-slate-200", med: "bg-amber-500/20 text-amber-300",
  high: "bg-orange-500/25 text-orange-300", critical: "bg-rose-500/25 text-rose-300",
};
const statusColor: Record<RiskStatus, string> = {
  open: "text-rose-300", mitigating: "text-amber-300", mitigated: "text-emerald-300", accepted: "text-slate-400",
};

function RiskRegister({ risks, setRisks, projects, selId, onSelect }: {
  risks: Risk[]; setRisks: (r: Risk[]) => void; projects: Project[]; selId: string; onSelect: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<RiskCategory>("technical");
  const [sev, setSev] = useState(3);
  const [like, setLike] = useState(3);
  const [pid, setPid] = useState(selId);
  const ranked = useMemo(() => [...risks].sort((a, b) => riskPriority(b) - riskPriority(a)), [risks]);
  const nameOf = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  const add = () => {
    if (!title.trim()) return;
    const n = risks.length + 1;
    const risk: Risk = {
      id: `RSK-${String(n).padStart(2, "0")}-${Math.round(sev * like)}`,
      projectId: pid, scopeKey: "product", title: title.trim(), category: cat,
      severity: sev as Risk["severity"], likelihood: like as Risk["likelihood"],
      author: "you", votes: 1, status: "open",
    };
    setRisks([risk, ...risks]);
    setTitle("");
  };
  const upvote = (id: string) => setRisks(risks.map((r) => r.id === id ? { ...r, votes: r.votes + 1 } : r));
  const cycle = (id: string) => setRisks(risks.map((r) => {
    if (r.id !== id) return r;
    const i = RISK_STATUS_ORDER.indexOf(r.status);
    return { ...r, status: RISK_STATUS_ORDER[(i + 1) % RISK_STATUS_ORDER.length] };
  }));

  const sel = `rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500`;
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Risk Register · documented by anyone, ranked by the community</h2>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">eXeL AI Polling · de-risk together</span>
      </div>

      {/* Add-a-risk form — anyone can document */}
      <div className="mt-3 flex flex-wrap items-end gap-2 text-[11px] text-slate-400">
        <label className="flex-1 min-w-[180px]">Risk
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Describe a risk anyone should know about…" className={`mt-0.5 block w-full ${sel}`} />
        </label>
        <label>Project
          <select value={pid} onChange={(e) => setPid(e.target.value)} className={`ml-1.5 ${sel}`}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label>Type
          <select value={cat} onChange={(e) => setCat(e.target.value as RiskCategory)} className={`ml-1.5 ${sel}`}>
            {RISK_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Sev
          <select value={sev} onChange={(e) => setSev(+e.target.value)} className={`ml-1.5 ${sel}`}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        <label>Like
          <select value={like} onChange={(e) => setLike(+e.target.value)} className={`ml-1.5 ${sel}`}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        <button onClick={add} disabled={!title.trim()} className="rounded-md bg-cyan-500 px-3 py-1.5 font-semibold text-[#06202a] hover:bg-cyan-400 disabled:opacity-30">+ Add</button>
      </div>

      {/* Ranked risk list */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-2 py-1.5 text-left">Risk</th>
              <th className="px-2 py-1.5 text-left">Project</th>
              <th className="px-2 py-1.5 text-center">S×L</th>
              <th className="px-2 py-1.5 text-center">Status</th>
              <th className="px-2 py-1.5 text-right">Priority</th>
              <th className="px-2 py-1.5 text-center">Votes</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r) => (
              <tr key={r.id} onClick={() => onSelect(r.projectId)}
                className={`cursor-pointer border-b border-slate-900 hover:bg-slate-800/40 ${selId === r.projectId ? "bg-cyan-500/5" : ""}`}>
                <td className="px-2 py-1.5">
                  <div className="leading-tight">{r.title}</div>
                  <div className="text-[10px] text-slate-500">{r.category} · by {r.author}{r.mitigation ? ` · ${r.mitigation}` : ""}</div>
                </td>
                <td className="px-2 py-1.5 text-[11px] text-slate-400">{nameOf(r.projectId)}</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${bandColor[riskBand(r)]}`}>{r.severity}×{r.likelihood}={riskScore(r)}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button onClick={(e) => { e.stopPropagation(); cycle(r.id); }} className={`text-[11px] font-medium ${statusColor[r.status]} hover:underline`}>{RISK_STATUS_LABEL[r.status]} ↻</button>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-slate-200">{Math.round(riskPriority(r))}</td>
                <td className="px-2 py-1.5 text-center tabular-nums text-slate-300">{r.votes}</td>
                <td className="px-2 py-1.5 text-right">
                  <button onClick={(e) => { e.stopPropagation(); upvote(r.id); }} className="rounded border border-slate-700 px-1.5 py-0.5 text-[11px] text-cyan-300 hover:bg-cyan-500/10" title="Poll: I agree this is a risk">▲ vote</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Priority = severity × likelihood × status × community concurrence (votes). Cycle status to de-risk — exposure collapses as the team mitigates. Mitigated pays = materialized (CRS-81→84).
      </p>
    </div>
  );
}

function Card({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">{tag}</span>
      </div>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}
function Row({ l, v, good, tone }: { l: string; v: string; good?: boolean; tone?: "good" | "ok" | "bad" }) {
  const c = good || tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-rose-400" : "text-slate-200";
  return <div className="flex justify-between text-sm"><span className="text-slate-400">{l}</span><span className={`font-medium tabular-nums ${c}`}>{v}</span></div>;
}
