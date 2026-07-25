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
  timeReadout, toleranceBand, TIME_UNITS, UNIT_LABEL, scheduleFromStart,
  growthModel, RISK_LABEL, HIER_LEVELS, hierValues, filterByHier, hierOf,
  REV_MODE, DEMO_RISKS, riskScore, riskExposure, riskPriority, riskBand, riskRollup,
  RISK_STATUS_LABEL, spendByBU, spendByCategory, rdEfficiency, costSplit, roiSummary,
  pipelineByGate, devTypeOf, DEV_TYPE, lobBaseM, companyBaseM, companyRollup, COMPANY_NAME, sayDo, briefOf, execOf,
  type Project, type TimeUnit, type HierKey, type RevMode, type Risk, type RiskStatus, type RiskCategory,
} from "@/lib/innovation-data";

const CODE = "369963";
const SS_KEY = "innovation-unlocked";
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
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/20 bg-[#111820] p-7 shadow-2xl">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400">Vision • 2525</div>
        <h1 className="mt-1 text-xl font-semibold">Project Innovation — Unlock</h1>
        <p className="mt-2 text-sm text-slate-400">Access-gated preview. Enter the code to open the portfolio workbench.</p>
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
        <p className="mt-3 text-center text-[11px] text-slate-500">Gated until full test sign-off.</p>
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
  const [view, setView] = useState<"portfolio" | "dashboards">("portfolio");
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

      {/* View tabs — Portfolio (Rack/Stack/Risk/Growth) ⟷ Dashboards (ROI Visuals) */}
      <nav className="flex gap-1 border-b border-slate-800 px-5">
        {([["portfolio", "Portfolio · Rack & Stack"], ["dashboards", "Dashboards · ROI Visuals"]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${view === v ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {label}
          </button>
        ))}
      </nav>

      {view === "portfolio" && (<>
      <div className="grid gap-4 p-5 lg:grid-cols-[1.6fr_1fr]">
        {/* STACK table */}
        <section className="rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
            <h2 className="text-sm font-semibold">Stack · drag priority across the funding line</h2>
            <span className="text-[11px] text-slate-500">above line = funded · below = unfunded</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="w-6"></th>
                  <th className="px-2 py-2 text-left">#</th>
                  <th className="px-2 py-2 text-left">Project</th>
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
                {rows.map((r, i) => (
                  <RowFrag key={r.p.id} r={r} i={i} showLine={i === lineIndex} selId={selId}
                    onSelect={setSelId} onUp={() => move(i, -1)} onDown={() => move(i, 1)} last={i === rows.length - 1} avail={avail}
                    dragging={dragIdx === i} onDragStartRow={() => setDragIdx(i)} onDropRow={() => { reorder(dragIdx, i); setDragIdx(null); }} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Selected project detail */}
        <section className="space-y-4">
          <ProjectDetail p={sel} risks={risks} />
          <TimeEngine p={sel} />
          <GateCube p={sel} />
          <Differentiators p={sel} />
        </section>
      </div>

      {/* Crowd-sourced Risk Register — anyone documents, the community polls, the team de-risks */}
      <div className="px-5 pb-4">
        <RiskRegister risks={risks} setRisks={setRisks} projects={order} selId={selId} onSelect={setSelId} />
      </div>

      {/* Portfolio Growth Model — the signature Rack & Stack chart */}
      <div className="px-5 pb-2">
        <GrowthModelChart funded={fundedRows.map((r) => r.p)} />
      </div>
      </>)}

      {view === "dashboards" && (
        <div className="p-5">
          <Dashboards projects={order} funded={fundedRows.map((r) => r.p)} onSelect={(id) => { setSelId(id); setView("portfolio"); }} />
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

function RowFrag({ r, i, showLine, selId, onSelect, onUp, onDown, last, avail, dragging, onDragStartRow, onDropRow }: {
  r: ReturnType<typeof stackWithBudget>["rows"][number]; i: number; showLine: boolean;
  selId: string; onSelect: (id: string) => void; onUp: () => void; onDown: () => void; last: boolean; avail: number;
  dragging: boolean; onDragStartRow: () => void; onDropRow: () => void;
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
        draggable
        onDragStart={onDragStartRow}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onDropRow(); }}
        className={`cursor-pointer border-b border-slate-900 ${selId === p.id ? "bg-cyan-500/10" : "hover:bg-slate-800/40"} ${funded ? "" : "opacity-70"} ${dragging ? "opacity-40" : ""}`}
      >
        <td className="w-6 text-center align-middle text-slate-600 cursor-grab active:cursor-grabbing select-none" title="Drag to reprioritize">⠿</td>
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
          <button onClick={(e) => { e.stopPropagation(); onUp(); }} disabled={i === 0} className="px-1 text-slate-400 hover:text-cyan-300 disabled:opacity-20">▲</button>
          <button onClick={(e) => { e.stopPropagation(); onDown(); }} disabled={last} className="px-1 text-slate-400 hover:text-cyan-300 disabled:opacity-20">▼</button>
        </td>
      </tr>
    </>
  );
}

// Risk-level pill: colour by level (low=emerald, med=amber, high=rose).
function RiskPill({ label, level }: { label: string; level: Project["tech"] }) {
  const c = level === "low" ? "bg-emerald-500/15 text-emerald-300" : level === "med" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${c}`}>{label} {RISK_LABEL[level]}</span>;
}

function ProjectDetail({ p, risks }: { p: Project; risks: Risk[] }) {
  const band = GATE_BAND[p.gate];
  const captured = Math.round(pSuccess(p) * 100);
  const upside = Math.round(upsideFraction(p) * 100);
  const roll = riskRollup(risks, p.id);
  const brief = briefOf(p);
  const ex = execOf(p);
  const metrics: [string, string][] = [
    ["NPV", usd(npvM(p))], ["IRR", `${irrPct(p)}%`], ["Rev/NRE", `${revOverNre(p).toFixed(1)}×`],
    ["Rev captured", `${captured}%`], ["Upside", `${upside}%`], ["P-wt revenue", usd(weightedRevM(p))],
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
      <div className="mt-3 grid grid-cols-3 gap-2">
        {metrics.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-[#0b0f14] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div>
            <div className="text-sm font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>
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
  const [years, setYears] = useState(3);
  const [growthPct, setGrowthPct] = useState("3.8");
  const [declinePct, setDeclinePct] = useState("15.1");
  const [revMode, setRevMode] = useState<RevMode>("full");
  const [showBaseline, setShowBaseline] = useState(true);
  // LOB base revenue ($M) — enterable; defaults to the selected LOB (SBU-1/2/3) or company sum.
  const [baseStr, setBaseStr] = useState(String(companyBaseM()));
  useEffect(() => { setBaseStr(String(lobBaseM(bu))); }, [bu]);
  // View level (max-UX switcher): Company → LOB/SBU → Product Group. Drives the scope dropdowns.
  const [level, setLevel] = useState<"company" | "lob" | "pg">("company");
  const [hover, setHover] = useState<number | null>(null);
  const setLevelScope = (lv: "company" | "lob" | "pg") => {
    setLevel(lv);
    if (lv === "company") { setBu("All"); setSbu("All"); }
    else if (lv === "lob") { setSbu("All"); if (bu === "All") setBu(hierValues(funded, "bu")[0] ?? "All"); }
    else { if (bu === "All") setBu(hierValues(funded, "bu")[0] ?? "All"); }
  };

  const bus = useMemo(() => ["All", ...hierValues(funded, "bu")], [funded]);
  const sbus = useMemo(() => ["All", ...hierValues(funded, "sbu", bu === "All" ? undefined : { level: "bu", value: bu })], [funded, bu]);
  const scoped = useMemo(() => {
    let s = filterByHier(funded, "bu", bu);
    s = filterByHier(s, "sbu", sbu);
    return s;
  }, [funded, bu, sbu]);

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

      {/* View-level switcher (max UX): Company → LOB/SBU → Product Group, + cascading scope */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <div className="flex overflow-hidden rounded-md border border-slate-700">
          {([["company", "Company"], ["lob", "LOB / SBU"], ["pg", "Product Group"]] as const).map(([lv, lbl]) => (
            <button key={lv} onClick={() => setLevelScope(lv)}
              className={`px-2.5 py-1 ${level === lv ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
        {level !== "company" && (
          <label>{HIER_LEVELS[0].label}
            <select value={bu} onChange={(e) => { setBu(e.target.value); setSbu("All"); }} className={`ml-1.5 ${selStyle}`}>
              {bus.filter((o) => o !== "All").map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
        {level === "pg" && (
          <label>{HIER_LEVELS[1].label}
            <select value={sbu} onChange={(e) => setSbu(e.target.value)} className={`ml-1.5 ${selStyle}`}>
              {sbus.map((o) => <option key={o} value={o}>{o}</option>)}
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
      {/* Company → LOB → Product Group rollup (base revenue · spend · NPV) */}
      <DashCard title="Rollup · Company → LOB → Product Group" tag="Company">
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
              {roll.lobs.map((lob) => (
                <React.Fragment key={lob.name}>
                  <tr className="border-b border-slate-900 bg-slate-900/30">
                    <td className="px-2 py-1.5 pl-5 font-medium">▸ {lob.name} <span className="text-[10px] text-slate-500">(LOB)</span></td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300">${lob.baseM}M</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-300">{kM(lob.spendK)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-400">{usd(lob.npvM)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-400">{lob.count}</td>
                  </tr>
                  {lob.groups.map((g) => (
                    <tr key={g.name} className="border-b border-slate-900/50 text-[12px]">
                      <td className="px-2 py-1 pl-9 text-slate-400">· {g.name} <span className="text-[10px] text-slate-600">(Product Group)</span></td>
                      <td className="px-2 py-1 text-right text-slate-600">—</td>
                      <td className="px-2 py-1 text-right tabular-nums text-slate-400">{kM(g.spendK)}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-slate-400">{usd(g.npvM)}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-slate-500">{g.count}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Base revenue anchors the do-nothing growth model per LOB (enter it in Growth Model). Company = Σ LOB base.</p>
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
    </div>
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
