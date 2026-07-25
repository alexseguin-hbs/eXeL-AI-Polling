"use client";

/**
 * PROJECT INNOVATION — Vision • 2525  (CRS-36 → CRS-93)
 * Rack & Stack portfolio (registry + prioritization + funding line + live budget) plus the
 * Series-9 differentiators: 3×3×3 gate cube, risk-prediction market, Project Upside pool,
 * $/min cost of elapsed time, and AI·SI·HI intelligence load with a burnout guard.
 *
 * Gated behind an access code (369963) until fully tested — the "UNLOCK" tab.
 */
import { useMemo, useState, useEffect } from "react";
import {
  DEMO_PROJECTS, DEMO_BUDGET, availableK, stackWithBudget, incrementalRevM, weightedRevM,
  pSuccess, npvM, irrPct, revOverNre, cubeFilled, GATE_BAND, GATE_STAGE,
  timeReadout, toleranceBand, TIME_UNITS, UNIT_LABEL, scheduleFromStart,
  growthModel,
  type Project, type TimeUnit,
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
                    onSelect={setSelId} onUp={() => move(i, -1)} onDown={() => move(i, 1)} last={i === rows.length - 1} avail={avail} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Selected project detail */}
        <section className="space-y-4">
          <ProjectDetail p={sel} />
          <TimeEngine p={sel} />
          <GateCube p={sel} />
          <Differentiators p={sel} />
        </section>
      </div>

      {/* Portfolio Growth Model — the signature Rack & Stack chart */}
      <div className="px-5 pb-2">
        <GrowthModelChart funded={fundedRows.map((r) => r.p)} />
      </div>

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

function RowFrag({ r, i, showLine, selId, onSelect, onUp, onDown, last, avail }: {
  r: ReturnType<typeof stackWithBudget>["rows"][number]; i: number; showLine: boolean;
  selId: string; onSelect: (id: string) => void; onUp: () => void; onDown: () => void; last: boolean; avail: number;
}) {
  const { p, cumK, funded } = r;
  return (
    <>
      {showLine && (
        <tr>
          <td colSpan={9} className="px-2 py-0.5">
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
        className={`cursor-pointer border-b border-slate-900 ${selId === p.id ? "bg-cyan-500/10" : "hover:bg-slate-800/40"} ${funded ? "" : "opacity-70"}`}
      >
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

function ProjectDetail({ p }: { p: Project }) {
  const band = GATE_BAND[p.gate];
  const metrics: [string, string][] = [
    ["NPV", usd(npvM(p))], ["IRR", `${irrPct(p)}%`], ["Rev/NRE", `${revOverNre(p).toFixed(1)}×`],
    ["P(success)", `${Math.round(pSuccess(p) * 100)}%`], ["Incremental", usd(incrementalRevM(p))],
    ["P-wt revenue", usd(weightedRevM(p))],
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
      <div className="mt-3 grid grid-cols-3 gap-2">
        {metrics.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-[#0b0f14] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div>
            <div className="text-sm font-semibold tabular-nums">{v}</div>
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
        <h3 className="text-sm font-semibold">Gate cube · {filled}/27 deliverables</h3>
        <span className="text-[11px] text-slate-500">stage &amp; blocker readable from the cube alone</span>
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

// Growth Model (CRS-69): stacked do-nothing + weighted NPI + remaining-to-target, target line.
function GrowthModelChart({ funded }: { funded: Project[] }) {
  const rows = growthModel(funded);
  const W = 720, H = 240, L = 34, B = 26, T = 26, R = 10;
  const max = Math.max(...rows.map((r) => Math.max(r.target, r.doNothing + r.weighted + r.remaining))) * 1.1 || 1;
  const pw = (W - L - R) / rows.length;
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  const growthPct = ((Math.pow(rows[rows.length - 1].target / (rows[0].target || 1), 1 / Math.max(1, rows.length - 1)) - 1) * 100).toFixed(1);
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Growth Model · Do-Nothing + Rack-&-Stack NPIs</h3>
        <span className="text-[11px] text-slate-500">target CAGR ~{growthPct}% · funded portfolio</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" preserveAspectRatio="xMidYMid meet" style={{ height: "auto" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={L} y1={y(max * f)} x2={W - R} y2={y(max * f)} stroke="rgba(148,163,184,.12)" />
        ))}
        {rows.map((r, i) => {
          const x = L + i * pw + pw * 0.18, bw = pw * 0.64;
          const dnH = (H - B) - y(r.doNothing);
          const wY = y(r.doNothing + r.weighted), rY = y(r.doNothing + r.weighted + r.remaining);
          return (
            <g key={r.year} fontFamily="ui-monospace, monospace" fontSize="9">
              <rect x={x} y={y(r.doNothing)} width={bw} height={Math.max(0, dnH)} fill="#64748b" opacity="0.7" />
              <rect x={x} y={wY} width={bw} height={Math.max(0, y(r.doNothing) - wY)} fill="#34d399" />
              <rect x={x} y={rY} width={bw} height={Math.max(0, wY - rY)} fill="#fbbf24" opacity="0.9" />
              <text x={x + bw / 2} y={H - B + 12} textAnchor="middle" fill="#64748b">{r.year}</text>
              <text x={x + bw / 2} y={rY - 4} textAnchor="middle" fill="#e2e8f0">{Math.round(r.doNothing + r.weighted + r.remaining)}</text>
            </g>
          );
        })}
        <polyline
          points={rows.map((r, i) => `${L + i * pw + pw * 0.5},${y(r.target)}`).join(" ")}
          fill="none" stroke="#e2e8f0" strokeWidth="1.4"
        />
        {rows.map((r, i) => <circle key={r.year} cx={L + i * pw + pw * 0.5} cy={y(r.target)} r="2.6" fill="#e2e8f0" />)}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#64748b" }} />do-nothing (YoY decline)</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#34d399" }} />probability-weighted NPI</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#fbbf24" }} />remaining to target</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#e2e8f0" }} />growth target</span>
      </div>
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
