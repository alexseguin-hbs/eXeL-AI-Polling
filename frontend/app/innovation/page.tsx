"use client";

/**
 * PROJECT INNOVATION — Vision • 2525  (CRS-36 → CRS-93)
 * Rack & Stack portfolio (registry + prioritization + funding line + live budget) plus the
 * differentiators: gate progression by review slide, risk-prediction market, Project Upside pool,
 * $/min cost of elapsed time, and AI·SI·HI intelligence load with a burnout guard.
 *
 * Gated behind an access code (369963) until fully tested — the "UNLOCK" tab.
 */
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  DEMO_PROJECTS, DEMO_BUDGET, availableK, stackWithBudget, incrementalRevM, weightedRevM,
  pSuccess, upsideFraction, npvM, irrPct, revOverNre, GATE_BAND, GATE_STAGE,
  timeReadout, toleranceBand, TIME_UNITS, UNIT_LABEL, scheduleFromStart, GATES,
  riskContingency, riskAdjustedNreK, riskAdjustedWorkdays,
  growthModel, RISK_LABEL, HIER_LEVELS, hierValues, filterByHier, hierOf,
  REV_MODE, DEMO_RISKS, riskScore, riskExposure, riskPriority, riskBand, riskRollup,
  RISK_STATUS_LABEL, spendByBU, spendByCategory, rdEfficiency, costSplit, roiSummary,
  pipelineByGate, devTypeOf, DEV_TYPE, lobBaseM, companyBaseM, companyRollup, COMPANY_NAME, sayDo, briefOf, execOf, intelligenceLoad,
  scopeBaseM, GATE_REVIEW, rackByLevel, projectRevSeries,
  bomOf, bomStdCost, bomExtended, productionCost, BU_LABEL, SBU_LABEL,
  GATE_REQUIREMENTS, requirementStatus, gateReadinessAll,
  TOLERANCE_LADDER, REQ_STATUS_LABEL,
  metaOf, financialMetrics, financialsOverview, execSummaryBullets,
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

// Safe storage — a sandboxed iframe (the <exel-polling> embed) or Safari "Block All Cookies" /
// private mode throws SecurityError on bare localStorage/sessionStorage ACCESS (not just write),
// which would crash the Gate render (loadPillars runs inline). These degrade to null-read /
// no-op-write so the tool never crashes when storage is unavailable, and behave identically
// when it works. Embed-ready + resilient (SSSES Security/Stability).
const lsGet = (key: string): string | null => { try { return typeof window !== "undefined" ? window.localStorage.getItem(key) : null; } catch { return null; } };
const lsSet = (key: string, val: string) => { try { if (typeof window !== "undefined") window.localStorage.setItem(key, val); } catch { /* storage unavailable */ } };
const ssGet = (key: string): string | null => { try { return typeof window !== "undefined" ? window.sessionStorage.getItem(key) : null; } catch { return null; } };
const ssSet = (key: string, val: string) => { try { if (typeof window !== "undefined") window.sessionStorage.setItem(key, val); } catch { /* storage unavailable */ } };
const ssDel = (key: string) => { try { if (typeof window !== "undefined") window.sessionStorage.removeItem(key); } catch { /* storage unavailable */ } };

export default function InnovationPage() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { setUnlocked(ssGet(SS_KEY) === "1"); }, []);
  if (!unlocked) return <Gate onUnlock={() => { ssSet(SS_KEY, "1"); setUnlocked(true); }} />;
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
          <p className="mt-2 text-sm text-slate-400">Access-gated preview. Enter the code to open the portfolio-prioritization board across the four strategic pillars.</p>
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
        {/* Strategic pillars — admin-editable in Business Setup (loadPillars) */}
        <div className="w-full">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Strategic Pillars</div>
          <div className="mt-2 grid gap-2">
            {loadPillars().map((pillar, i) => (
              <div key={pillar.name} className="rounded-xl border border-slate-800 bg-[#0e141b] p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/15 text-[11px] font-mono text-cyan-300">P{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-100">{pillar.name}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{pillar.desc}</p>
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
  const [detailMax, setDetailMax] = useState(false); // maximize the selected-project deep dive full-width
  // Optimization cadence — legacy prioritization was quarterly; this tool enables monthly now,
  // weekly next. Drives how often the stack is re-optimized / snapshotted.
  const [cadence, setCadence] = useState<"Q" | "M" | "W">("M");
  // Master data (BU/SBU/Alpha…) for the edit + new-idea dropdowns; reloads when leaving Setup.
  const [setup, setSetup] = useState<BizSetup>(() => seedBizSetup(DEMO_PROJECTS));
  useEffect(() => { setSetup(loadBizSetup()); }, [view]);
  // Remembered defaults — a returning VP lands on the VP lens, not a PM view (usability).
  useEffect(() => {
    const sp = lsGet("innovation-persona") as Persona | null;
    const sc = lsGet("innovation-cadence") as "Q" | "M" | "W" | null;
    if (sc) setCadence(sc);
    const pp = PERSONAS.find((x) => x.key === sp);
    if (pp) { setPersona(pp.key); setView(pp.view); if (pp.level) setStackLevel(pp.level); }
  }, []);
  useEffect(() => { lsSet("innovation-persona", persona); }, [persona]);
  useEffect(() => { lsSet("innovation-cadence", cadence); }, [cadence]);
  // Submit a new idea → a fresh Project seeded from the master data, opened for edit.
  const submitIdea = () => {
    const maxN = order.reduce((m, p) => Math.max(m, parseInt(p.id.replace(/\D/g, ""), 10) || 0), 0);
    const id = `PRJ-${String(maxN + 1).padStart(2, "0")}`;
    const np: Project = {
      id, name: "New Idea", division: "New", manager: "you", category: "New Product",
      gate: "G1", confidence: 2, tech: "med", comm: "med", lob: setup.sbu[0]?.code ?? "SBU-1",
      nreK: 1000, fullRev10yM: 50, doNothing10yM: 0, firstRevenue: "2028-Q1",
      criticalPath: false, humanLoad: 0.4, ai: 0.4, si: 0.3, hi: 0.3, predictions: 0,
      bu: setup.bu[0]?.code, sbu: setup.sbu[0]?.code, pgroup: setup.pgroup[0]?.code,
      alpha: setup.alpha[0]?.code, initiative: loadPillars()[0]?.name ?? STRATEGIC_INITIATIVES[0],
    };
    setOrder((o) => [np, ...o]);
    setSelId(id); setView("portfolio"); setStackLevel("product");
    log("edit", np.name, "submitted new idea (G1)", "you");
  };
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
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const overIdxRef = useRef<number | null>(null);
  const setOver = (n: number | null) => { overIdxRef.current = n; setOverIdx(n); };
  const reorder = (from: number | null, to: number | null) => {
    if (from == null || to == null || from === to || from < 0 || to < 0) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  };
  // Cross-device drag: pointer-based (works on mouse AND touch, unlike native HTML5 DnD which
  // never fires on touch). Grab the ⠿ handle → drag over a row → drop to reprioritize.
  const startRowDrag = (from: number) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragIdx(from); setOver(from);
    const onMove = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const row = el?.closest("[data-stack-row]") as HTMLElement | null;
      const to = row ? Number(row.getAttribute("data-stack-row")) : null;
      if (to != null && Number.isInteger(to)) setOver(to);
    };
    const onUp = () => {
      reorder(from, overIdxRef.current);
      setDragIdx(null); setOver(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  // Material # / BOM: default rolled up (product summary only); expand a product to show its BOM build.
  const [bomOpen, setBomOpen] = useState<Set<string>>(() => new Set());
  const toggleBom = (id: string) => setBomOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  // Level-aware Rack & Stack: high-level rollup (BU/SBU/PG/Alpha) for decisions · Product #
  // = working project stack (drag/select → deep dive) · Material # = BOM. Metrics always
  // stay bound to the project (derived from r.p), so arrows/drag carry NPV/REV/NRE with it.
  const [stackLevel, setStackLevel] = useState<HierKey>("sbu");
  const [drill, setDrill] = useState<{ level: HierKey; value: string } | null>(null);
  // Rack & Stack decisions + access rights are by BU · SBU · Alpha Group (Alpha Code is not a
  // decision level — it's only a project attribute). Product # = working stack · Material # = BOM.
  const isGroupLevel = stackLevel === "bu" || stackLevel === "sbu" || stackLevel === "pgroup";
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
  // Admin-configurable module name (formerly "Rack & Stack") — held in state so an admin rename
  // hot-swaps the tab/title/header instantly (no reload), seeded from the persisted value.
  const [stackName, setStackName] = useState<string>(() => loadStackName());

  return (
    <div className="min-h-screen bg-[#0b0f14] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400">Vision • 2525 · Harmattan AI</div>
          <h1 className="text-lg font-semibold">Project Innovation — {stackName}</h1>
        </div>
        <a
          href="/innovation/pdm-template.html" target="_blank" rel="noopener"
          className="rounded-md border border-cyan-500/40 px-2.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10"
        >
          R-Core Project Template ↗
        </a>
        <button onClick={submitIdea}
          className="rounded-md bg-cyan-500 px-2.5 py-1.5 text-xs font-semibold text-[#06202a] hover:bg-cyan-400">
          ＋ Submit New Idea
        </button>
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
        {/* Optimization cadence — quarterly (legacy) → monthly (now) → weekly (next) */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Optimize</span>
          <div className="flex overflow-hidden rounded-md border border-slate-700 text-[11px]">
            {([["Q", "Quarterly"], ["M", "Monthly"], ["W", "Weekly"]] as const).map(([c, lbl]) => (
              <button key={c} onClick={() => setCadence(c)}
                className={`px-2 py-1 ${cadence === c ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>
      <p className="border-b border-slate-800 bg-[#0c1219] px-5 pb-2 text-[11px] text-slate-400">
        <span className="hidden sm:inline">{PERSONAS.find((pp) => pp.key === persona)!.lens} · </span>
        Re-optimizing <b className="text-cyan-300">{cadence === "Q" ? "quarterly" : cadence === "M" ? "monthly" : "weekly"}</b> · time is money — cost shown in $/min on each project · AI + HI now, SI polling next.
      </p>

      {/* View tabs — Portfolio (Rack/Stack/Risk/Growth) ⟷ Dashboards (ROI Visuals) */}
      <nav className="flex gap-1 border-b border-slate-800 px-5 overflow-x-auto">
        {([["portfolio", "Portfolio Prioritization"], ["gates", "Gate Requirements"], ["dashboards", "Dashboards · ROI Visuals"], ["setup", "⚙ Business Setup"]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${view === v ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {v === "portfolio" ? stackName : label}
          </button>
        ))}
      </nav>

      {view === "portfolio" && (<>
      <div className="grid gap-4 p-5 lg:grid-cols-[1.6fr_1fr]">
        {/* STACK table — level-aware Rack & Stack */}
        <section className="rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800">
            <h2 className="text-sm font-semibold">
              {stackName} · {stackLevel === "product" ? "drag priority across the funding line" : isGroupLevel ? "roll-up for decisions" : "bill of materials"}
            </h2>
            {/* Top level toggle: BU · SBU · Product Group · Alpha Group · Product # · Material # */}
            <div className="flex flex-wrap overflow-hidden rounded-md border border-slate-700 text-[11px]">
              {([["bu", "BU"], ["sbu", "SBU"], ["pgroup", "Alpha Grp"], ["product", "Product #"], ["material", "Material #"]] as const).map(([lv, lbl]) => (
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
                          <td className="px-2 py-2 text-right tabular-nums"><PwtCell weighted={g.weightedRevM} incremental={g.incRevM} /></td>
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
                        dragging={dragIdx === i} over={overIdx === i && dragIdx !== i} onGripDown={canDrag ? startRowDrag(i) : undefined} />
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
                    const open = bomOpen.has(p.id);
                    return (
                      <React.Fragment key={p.id}>
                        {/* Product # header (rolled-up by default) — click to expand the BOM build */}
                        <tr onClick={() => { toggleBom(p.id); setSelId(p.id); }} title={open ? "Collapse BOM build" : "Expand BOM build"} className={`cursor-pointer border-b border-slate-800 bg-slate-900/40 ${selId === p.id ? "ring-1 ring-inset ring-cyan-500/30" : ""}`}>
                          <td className="px-2 py-1.5 font-mono font-semibold text-cyan-300"><span className="mr-1 text-slate-500">{open ? "▾" : "▸"}</span>{hierOf(p).product}</td>
                          <td className="px-2 py-1.5 text-slate-300" colSpan={6}>{p.name} <span className="text-[10px] text-slate-500">· Material {hierOf(p).material} · {hierOf(p).pgroup} · {lines.length} lines{open ? "" : " · tap to expand BOM"}</span></td>
                          <td className="px-2 py-1.5 text-right text-[10px] uppercase tracking-wider text-slate-500">Prod cost →</td>
                          <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-emerald-400">${Math.round(productionCost(p)).toLocaleString()}</td>
                        </tr>
                        {open && lines.map((l) => (
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
          <ProjectDetail p={sel} risks={risks} setup={setup} maximized={false} onToggleMax={() => setDetailMax(true)}
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
          <BusinessSetup onRename={setStackName} />
        </div>
      )}

      {/* Full-screen deep-dive overlay (⤢ maximize) */}
      {detailMax && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6" onClick={() => setDetailMax(false)}>
          <div className="mx-auto max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <ProjectDetail p={sel} risks={risks} setup={setup} maximized onToggleMax={() => setDetailMax(false)}
              onEdit={(patch, changes) => applyEdit(sel.id, patch, changes)}
              onApprove={(kind, by) => log(kind, sel.name, kind === "approve" ? `${GATE_STAGE[sel.gate]} (${sel.gate}) approved` : `${sel.gate} — changes requested`, by)} />
          </div>
        </div>
      )}

      <footer className="px-5 pb-8 text-[11px] text-slate-500">
        Demo portfolio · financials are derived from the inputs, never hand-entered. Reprioritize the stack, gate projects, and poll feedback to de-risk the roadmap.
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

function RowFrag({ r, i, showLine, selId, onSelect, onUp, onDown, last, avail, dragging, over, onGripDown, canDrag = true }: {
  r: ReturnType<typeof stackWithBudget>["rows"][number]; i: number; showLine: boolean;
  selId: string; onSelect: (id: string) => void; onUp?: () => void; onDown?: () => void; last: boolean; avail: number;
  dragging: boolean; over?: boolean; onGripDown?: (e: React.PointerEvent) => void; canDrag?: boolean;
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
        data-stack-row={i}
        className={`cursor-pointer border-b border-slate-900 ${over ? "border-t-2 border-t-cyan-400" : ""} ${selId === p.id ? "bg-cyan-500/10" : "hover:bg-slate-800/40"} ${funded ? "" : "opacity-70"} ${dragging ? "opacity-40" : ""}`}
      >
        <td className="w-6 text-center align-middle text-slate-600 select-none">{canDrag ? <span onPointerDown={onGripDown} style={{ touchAction: "none" }} title="Drag to reprioritize" className="inline-block cursor-grab px-1 py-2 active:cursor-grabbing">⠿</span> : ""}</td>
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
        <td className="px-2 py-2 text-center tabular-nums" title={`Model confidence ${p.confidence}/5`}>{"●".repeat(p.confidence)}<span className="text-slate-700">{"●".repeat(5 - p.confidence)}</span></td>
        <td className="px-2 py-2 text-right tabular-nums text-slate-300">{k(p.nreK)}</td>
        <td className="px-2 py-2 text-right tabular-nums"><PwtCell weighted={weightedRevM(p)} incremental={incrementalRevM(p)} /></td>
        <td className={`px-2 py-2 text-right tabular-nums font-semibold ${npvM(p) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{usd(npvM(p))}</td>
        <td className="px-2 py-2 text-right tabular-nums text-slate-400">{k(cumK)}</td>
        <td className="px-2 py-2 text-right whitespace-nowrap">
          {canDrag ? (<span className="inline-flex gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); onUp?.(); }} disabled={i === 0} title="Move up" className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-20">▲</button>
            <button onClick={(e) => { e.stopPropagation(); onDown?.(); }} disabled={last} title="Move down" className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-20">▼</button>
          </span>) : <span className="text-slate-700 text-[10px]">·</span>}
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

// Risk-weighted revenue split — green (probability-weighted REV) + orange (at-risk upside),
// the exact Growth-Model color scheme (grey/green/orange) applied at the project level.
function RiskWeightedBar({ p }: { p: Project }) {
  const inc = incrementalRevM(p), wt = weightedRevM(p), up = Math.max(0, inc - wt);
  const wPct = inc > 0 ? (wt / inc) * 100 : 0;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
        <span>Risk-weighted revenue</span><span className="text-slate-400 tabular-nums">{usd(inc)} incremental</span>
      </div>
      <div className="mt-1 flex h-4 overflow-hidden rounded bg-[#0b0f14]">
        <span className="bg-[#34d399]" style={{ width: `${wPct}%` }} title={`Probability-weighted ${usd(wt)}`} />
        <span className="bg-[#fbbf24]" style={{ width: `${100 - wPct}%` }} title={`At-risk upside ${usd(up)}`} />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#34d399" }} />REV · probability-weighted {usd(wt)}</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#fbbf24" }} />Upside · risk {usd(up)}</span>
      </div>
    </div>
  );
}

// Compact P-wt Rev table cell — number + a thin green(probability-weighted)/orange(at-risk
// upside) split bar, the deck's risk-weighted-revenue color scheme at rack scale.
function PwtCell({ weighted, incremental }: { weighted: number; incremental: number }) {
  const wPct = incremental > 0 ? Math.min(100, (weighted / incremental) * 100) : 0;
  const up = Math.max(0, incremental - weighted);
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="tabular-nums">{usd(weighted)}</span>
      <span className="flex h-1 w-14 overflow-hidden rounded-full bg-[#0b0f14]" title={`weighted ${usd(weighted)} · at-risk upside ${usd(up)}`}>
        <span className="bg-[#34d399]" style={{ width: `${wPct}%` }} />
        <span className="bg-[#fbbf24]" style={{ width: `${100 - wPct}%` }} />
      </span>
    </div>
  );
}

// Risk-level pill: colour by level (low=emerald, med=amber, high=rose).
function RiskPill({ label, level }: { label: string; level: Project["tech"] }) {
  const c = level === "low" ? "bg-emerald-500/15 text-emerald-300" : level === "med" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${c}`}>{label} {RISK_LABEL[level]}</span>;
}

function ProjectDetail({ p, risks, setup, maximized, onToggleMax, onEdit, onApprove }: {
  p: Project; risks: Risk[]; setup: BizSetup; maximized?: boolean; onToggleMax?: () => void;
  onEdit: (patch: Partial<Project>, changes: string[]) => void;
  onApprove: (kind: "approve" | "reject", by: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showExec, setShowExec] = useState(false);
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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExec((s) => !s)} title="Expandable executive slide (2-screen swipe overview)"
            className={`rounded border px-2 py-0.5 text-[11px] ${showExec ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>▤ Exec slide</button>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-mono text-amber-300">±{Math.round(band * 100)}% band</span>
          {onToggleMax && (
            <button onClick={onToggleMax} title={maximized ? "Restore" : "Maximize deep-dive"}
              className="rounded border border-slate-700 px-1.5 py-0.5 text-[13px] leading-none text-slate-300 hover:bg-slate-800">{maximized ? "⤡" : "⤢"}</button>
          )}
        </div>
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

      {/* Expandable executive slide — 2-screen swipe overview (AMTS best-in-class one-pager) */}
      {showExec && <div className="mt-3"><ExecutiveSlide p={p} risks={risks} /></div>}

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
          {/* Master-data dropdowns — options come from Business Setup (BU/SBU/Alpha…) + pillars */}
          <label className="col-span-2 sm:col-span-3">Strategic Pillar
            <select value={dv("initiative") ?? metaOf(p).initiative} onChange={(e) => setD("initiative", e.target.value)} className={`mt-0.5 block w-full ${editStyle}`}>
              {loadPillars().map((pl) => <option key={pl.name} value={pl.name}>{pl.name}</option>)}
            </select>
          </label>
          <label>BU
            <select value={dv("bu") ?? hierOf(p).bu} onChange={(e) => setD("bu", e.target.value)} className={`mt-0.5 block w-full ${editStyle}`}>
              {setup.bu.map((n) => <option key={n.code} value={n.code}>{n.code} · {n.label}</option>)}
            </select>
          </label>
          <label>SBU
            <select value={dv("sbu") ?? hierOf(p).sbu} onChange={(e) => setD("sbu", e.target.value)} className={`mt-0.5 block w-full ${editStyle}`}>
              {setup.sbu.filter((s) => s.parent === (dv("bu") ?? hierOf(p).bu)).map((n) => <option key={n.code} value={n.code}>{n.code} · {n.label}</option>)}
            </select>
          </label>
          <label>Alpha Group
            <select value={dv("pgroup") ?? hierOf(p).pgroup} onChange={(e) => setD("pgroup", e.target.value)} className={`mt-0.5 block w-full ${editStyle}`}>
              {setup.pgroup.filter((g) => g.parent === (dv("sbu") ?? hierOf(p).sbu)).map((n) => <option key={n.code} value={n.code}>{n.code}</option>)}
            </select>
          </label>
          <label>Alpha Code
            <select value={dv("alpha") ?? hierOf(p).alpha} onChange={(e) => setD("alpha", e.target.value)} className={`mt-0.5 block w-full ${editStyle}`}>
              {setup.alpha.filter((a) => a.parent === (dv("pgroup") ?? hierOf(p).pgroup)).map((n) => <option key={n.code} value={n.code}>{n.code}</option>)}
            </select>
          </label>
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
      <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">Project Metrics · 12-metric set</div>
      <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {metrics.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-[#0b0f14] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate" title={l}>{l}</div>
            <div className="text-sm font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-slate-500">Payback &amp; IRR are model estimates · NPV discounted ~5%/yr over 10 yr · margins post-overhead — confirm with Finance before gate sign-off.</p>
      {/* Risk-weighted revenue — green (probability-weighted) + orange (at-risk upside) per deck */}
      <RiskWeightedBar p={p} />
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
              {items.slice(0, 5).map((it, i) => <li key={i} className="text-[11px] leading-snug text-slate-300">· {it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// Executive slide — an expandable, best-in-class overview one-pager (AMTS parity, IMG_7825/7826).
// Two swipeable screens: ① OVERVIEW (two-bullet summary · strategy/value · market) → right-swipe →
// ② DETAIL (objectives · dependencies · critical issues & risks · cost actuals-vs-forecast). Every
// number is sourced from the SAME live model that drives the rack — one platform for presentation
// + analysis. Swipe on touch, or use ‹ › / the dots on desktop.
function ExecutiveSlide({ p, risks }: { p: Project; risks: Risk[] }) {
  const [screen, setScreen] = useState(0);            // 0 = overview · 1 = detail
  const touchX = React.useRef<number | null>(null);
  const go = (n: number) => setScreen(Math.max(0, Math.min(1, n)));
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(screen + (dx < 0 ? 1 : -1)); // swipe left → next, right → prev
    touchX.current = null;
  };

  const bullets = execSummaryBullets(p);
  const m = metaOf(p), ex = execOf(p), brief = briefOf(p), fm = financialMetrics(p), h = hierOf(p);
  const captured = Math.round(pSuccess(p) * 100);
  const roll = riskRollup(risks, p.id);
  const myRisks = risks.filter((r) => r.projectId === p.id).sort((a, b) => riskPriority(b) - riskPriority(a));
  const deps = dependsOn(DEMO_DEPS, p.id), dependents = dependentsOf(DEMO_DEPS, p.id);
  const fin = financialsOverview(p).filter((_, i) => i < 6);        // R&D actuals-vs-forecast window
  const maxRd = Math.max(1, ...fin.map((f) => f.rdK));
  const gi = GATES.indexOf(p.gate);
  const nextGate = GATES[gi + 1];
  const nextReview = GATE_REVIEW[nextGate ?? p.gate];
  const dt = DEV_TYPE[devTypeOf(p)];

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{children}</div>
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      {/* Slide header band — PROJECT NAME · tags · financials (AMTS header) */}
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-cyan-500/20 bg-[#0b0f14] p-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold tracking-wide text-slate-100">{p.name}</h3>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ borderColor: dt.color, color: dt.color }}>{dt.label}</span>
            <span className="rounded-full border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300">{m.initiative}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">{h.bu} › {h.sbu} › {h.pgroup} · {ex.customer} · {GATE_STAGE[p.gate]} ({p.gate})</div>
        </div>
        <div className="flex gap-4 text-right">
          <div><div className="text-[9px] uppercase tracking-wider text-slate-500">1st Rev</div><div className="text-xs font-mono text-slate-200">{p.firstRevenue}</div></div>
          <div><div className="text-[9px] uppercase tracking-wider text-slate-500">3-Yr NPV</div><div className="text-xs font-mono text-emerald-400">{usd(fm.npvM)}</div></div>
          <div><div className="text-[9px] uppercase tracking-wider text-slate-500">IRR</div><div className="text-xs font-mono text-slate-200">{fm.irrPct}%</div></div>
        </div>
      </div>

      {/* Two-screen swipe carousel — touch swipe + ← → keyboard (a11y), ARIA carousel semantics */}
      <div className="mt-3 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        role="group" aria-roledescription="carousel" aria-label="Executive slide — overview and detail"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { go(screen + 1); e.preventDefault(); } else if (e.key === "ArrowLeft") { go(screen - 1); e.preventDefault(); } }}>
        <div className="flex transition-transform duration-300 ease-out" style={{ width: "200%", transform: `translateX(-${screen * 50}%)` }}>
          {/* ── Screen ① OVERVIEW ─────────────────────────────────────────────── */}
          <div className="w-1/2 shrink-0 pr-1.5" role="group" aria-roledescription="slide" aria-label="① Overview" aria-hidden={screen !== 0}>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Project Overview — the two-bullet summary (the flagship "two bullet") */}
              <div className="space-y-1.5">
                <SectionTitle>Project Overview</SectionTitle>
                <ul className="space-y-2">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[12px] leading-snug text-slate-200">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Product Strategy / Value Proposition */}
              <div className="space-y-1.5">
                <SectionTitle>Strategy · Value Proposition</SectionTitle>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300">▦ {m.valueLadder}</span>
                  <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300">↗ {m.valueImpact}</span>
                  <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300">⚑ {m.competitive}</span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {brief.solution.slice(0, 3).map((s, i) => <li key={i} className="text-[11px] leading-snug text-slate-300">· {s}</li>)}
                </ul>
              </div>
              {/* Market Opportunity — customer + franchise pursuits */}
              <div className="space-y-1.5">
                <SectionTitle>Market Opportunity</SectionTitle>
                <div className="text-[11px] text-slate-400">Customer / PoR · <span className="text-cyan-300">{ex.customer}</span> · target {m.targetMarket}</div>
                <ul className="space-y-0.5">
                  {ex.pursuits.map((pu) => (
                    <li key={pu.name} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-slate-300">{pu.name}</span>
                      <span className="shrink-0 font-mono tabular-nums text-slate-400">{usd(pu.valueM)} · {pu.award}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Portfolio Positioning — margin + risk-weighted capture */}
              <div className="space-y-1.5">
                <SectionTitle>Portfolio Positioning</SectionTitle>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded bg-[#0b0f14] px-2 py-1.5"><div className="text-[9px] uppercase tracking-wider text-slate-500">Gross margin</div><div className="font-mono tabular-nums text-emerald-400">{ex.marginPct}%</div></div>
                  <div className="rounded bg-[#0b0f14] px-2 py-1.5"><div className="text-[9px] uppercase tracking-wider text-slate-500">Rev captured</div><div className="font-mono tabular-nums text-slate-200">{captured}%</div></div>
                  <div className="rounded bg-[#0b0f14] px-2 py-1.5"><div className="text-[9px] uppercase tracking-wider text-slate-500">10-Yr revenue</div><div className="font-mono tabular-nums text-slate-200">{usd(fm.rev10yM)}</div></div>
                  <div className="rounded bg-[#0b0f14] px-2 py-1.5"><div className="text-[9px] uppercase tracking-wider text-slate-500">Payback</div><div className="font-mono tabular-nums text-slate-200">{fm.paybackYears} yr</div></div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Screen ② DETAIL ───────────────────────────────────────────────── */}
          <div className="w-1/2 shrink-0 pl-1.5" role="group" aria-roledescription="slide" aria-label="② Detail" aria-hidden={screen !== 1}>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Objectives — near-term + beyond, from outcomes */}
              <div className="space-y-1.5">
                <SectionTitle>Objectives</SectionTitle>
                <ul className="space-y-0.5">
                  {brief.outcomes.slice(0, 3).map((o, i) => <li key={i} className="text-[11px] leading-snug text-slate-300">· {o}</li>)}
                </ul>
                <div className="mt-1 text-[10px] text-amber-400">Next gate · {nextGate ? `${GATE_STAGE[nextGate]} (${nextGate})` : `Final (${p.gate})`} · {nextReview.deliverables.length} slide{nextReview.deliverables.length === 1 ? "" : "s"}</div>
              </div>
              {/* Dependencies — intra-BU + declared/acknowledged counts */}
              <div className="space-y-1.5">
                <SectionTitle>Dependencies</SectionTitle>
                <div className="text-[11px] text-slate-400">Depends on <span className="text-slate-200">{deps.length}</span> · relied on by <span className="text-slate-200">{dependents.length}</span></div>
                <ul className="space-y-0.5">
                  {ex.intraDeps.map((d) => <li key={d} className="text-[11px] leading-snug text-slate-300">· {d}</li>)}
                  {deps.some((e) => e.critical) && <li className="text-[11px] text-rose-300">· ⚠ on the critical path</li>}
                </ul>
              </div>
              {/* Critical Issues & Risks — top by polling-weighted priority */}
              <div className="space-y-1.5">
                <SectionTitle>Critical Issues &amp; Risks</SectionTitle>
                {myRisks.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No risks logged — raise one in the Risk Register.</p>
                ) : (
                  <ul className="space-y-1">
                    {myRisks.slice(0, 4).map((r) => {
                      const band = riskBand(r);
                      const tone = band === "critical" ? "text-rose-400" : band === "high" ? "text-amber-400" : band === "med" ? "text-sky-300" : "text-slate-400";
                      return (
                        <li key={r.id} className="flex items-start gap-2 text-[11px] leading-snug">
                          <span className={`mt-0.5 shrink-0 font-mono text-[9px] uppercase ${tone}`}>{band}</span>
                          <span className="flex-1 text-slate-300">{r.title}</span>
                          <span className="shrink-0 text-slate-500">{RISK_STATUS_LABEL[r.status]}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="text-[10px] text-emerald-400">{Math.round(roll.retired * 100)}% de-risked · {roll.open} open</div>
              </div>
              {/* Project Cost — R&D actuals vs forecast (mini bar series) */}
              <div className="space-y-1.5">
                <SectionTitle>Cost · R&amp;D Actuals vs Forecast</SectionTitle>
                <div className="flex items-end gap-1" style={{ height: 56 }}>
                  {fin.map((f, i) => (
                    <div key={f.year} className="flex flex-1 flex-col items-center justify-end gap-0.5">
                      <div className="w-full rounded-t" title={`${f.year} · ${k(f.rdK)}`}
                        style={{ height: `${Math.max(2, (f.rdK / maxRd) * 44)}px`, background: i === 0 ? "#19c8cf" : "#334155" }} />
                      <div className="text-[8px] tabular-nums text-slate-500">{String(f.year).slice(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span><span className="text-cyan-300">▮</span> actual (yr 1)</span>
                  <span>Total R&amp;D {k(fm.totalRdOpexK)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe controls — ‹ › + dots (screen ① ↔ ②) */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2">
        <button onClick={() => go(screen - 1)} disabled={screen === 0}
          className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 disabled:opacity-30 enabled:hover:bg-slate-800">‹ Overview</button>
        <div className="flex items-center gap-2">
          {[0, 1].map((i) => (
            <button key={i} onClick={() => go(i)} aria-label={`screen ${i + 1}`}
              className={`h-2 w-2 rounded-full ${screen === i ? "bg-cyan-400" : "bg-slate-700 hover:bg-slate-600"}`} />
          ))}
          <span className="ml-1 text-[10px] text-slate-500">{screen === 0 ? "① Overview" : "② Detail"} · swipe →</span>
        </div>
        <button onClick={() => go(screen + 1)} disabled={screen === 1}
          className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 disabled:opacity-30 enabled:hover:bg-slate-800">Detail ›</button>
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
      {/* Risk-adjusted cost · schedule · upside — all move with the tech × commercial risk */}
      <div className="mt-2 rounded-lg border border-amber-500/20 bg-[#0b0f14] p-2.5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
          <span>Risk-adjusted (Tech {RISK_LABEL[p.tech]} × Comm {RISK_LABEL[p.comm]})</span>
          <span className="text-amber-300">+{Math.round(riskContingency(p) * 100)}% contingency</span>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2 text-[11px]">
          <div><div className="text-[10px] text-slate-500">Cost (NRE)</div><div className="tabular-nums text-slate-200">{k(p.nreK)} → <b className="text-amber-300">{k(riskAdjustedNreK(p))}</b></div></div>
          <div><div className="text-[10px] text-slate-500">Schedule</div><div className="tabular-nums text-slate-200">{riskAdjustedWorkdays(p)}wd <span className="text-slate-500">(+risk)</span></div></div>
          <div><div className="text-[10px] text-slate-500">Upside (at-risk)</div><div className="tabular-nums text-amber-300">{Math.round(upsideFraction(p) * 100)}%</div></div>
        </div>
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

// S# slide inputs — per-project, per-slide status the operator sets in-tool (decision input).
// Cycles Not-started → Drafted → Submitted → Approved; persisted; drives the next-gate readiness.
const SLIDE_KEY = "innovation-slides";
const SLIDE_STATES = ["", "drafted", "submitted", "approved"] as const;
const SLIDE_PILL: Record<string, string> = {
  "": "border-slate-700 text-slate-500 hover:bg-slate-800",
  drafted: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  submitted: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};
const SLIDE_TXT: Record<string, string> = { "": "+ input", drafted: "drafted", submitted: "submitted", approved: "approved ✓" };

// Gate progression — measured by review-slide progression across gates G1–G7 (no fixed
// stage-count reference). We surface the review slides completed so far and the slides needed
// next, each an editable gate-feedback input the operator sets to drive the next-gate decision.
function GateCube({ p }: { p: Project }) {
  const gi = GATES.indexOf(p.gate);
  const nextGate = GATES[gi + 1];                 // undefined once at the final gate
  const review = GATE_REVIEW[nextGate ?? p.gate]; // slides for the next gate (or the final gate)
  const [slides, setSlides] = useState<Record<string, string>>({});
  useEffect(() => { try { setSlides(JSON.parse(lsGet(SLIDE_KEY) || "{}")); } catch { /* none */ } }, []);
  const slideStatus = (s: string) => slides[`${p.id}|${s}`] || "";
  const cycleSlide = (s: string) => setSlides((prev) => {
    const k = `${p.id}|${s}`, cur = prev[k] || "";
    const next = SLIDE_STATES[(SLIDE_STATES.indexOf(cur as (typeof SLIDE_STATES)[number]) + 1) % SLIDE_STATES.length];
    const upd = { ...prev, [k]: next };
    lsSet(SLIDE_KEY, JSON.stringify(upd));
    return upd;
  });
  const readyCount = review.deliverables.filter((d) => slideStatus(d.slide) === "approved").length;
  const allSlides = GATES.flatMap((g) => GATE_REVIEW[g].deliverables.map((d) => d.slide));
  const approvedSlides = allSlides.filter((s) => slideStatus(s) === "approved").length;
  const board = loadReviewBoard();
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Gate progression · {p.gate} {GATE_STAGE[p.gate]}</h3>
        <span className="text-[11px] text-slate-500">gate {gi + 1} of {GATES.length} · source of record</span>
      </div>
      {/* Deliverables S1–S18 across gates G1–G7 — tap a slide to cycle its IRB gate feedback */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span className="uppercase tracking-wider">Deliverables · S1–S18 · {board} gate feedback</span>
          <span className="font-mono text-slate-300">{approvedSlides}/{allSlides.length} approved</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {GATES.map((g, ci) => {
            const state = ci < gi ? "done" : ci === gi ? "current" : ci === gi + 1 ? "next" : "future";
            const gateColor = state === "next" ? "text-amber-300" : state === "current" ? "text-cyan-300" : state === "done" ? "text-emerald-300" : "text-slate-500";
            return (
              <div key={g} className="flex flex-wrap items-center gap-1.5">
                <span className={`w-24 shrink-0 text-[10px] font-mono ${gateColor}`}>{g} {GATE_STAGE[g]}{state === "done" || state === "current" ? " ✓" : ""}</span>
                {GATE_REVIEW[g].deliverables.map((d) => {
                  const st = slideStatus(d.slide);
                  return (
                    <button key={d.slide} onClick={() => cycleSlide(d.slide)}
                      title={`${d.slide} · Gate ${g} · ${board} gate feedback: ${SLIDE_TXT[st]} — tap to advance`}
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-mono ${SLIDE_PILL[st]}`}>{d.slide}{st === "approved" ? " ✓" : ""}</button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Tap a slide to cycle its {board} (Innovation Review Board) gate feedback{nextGate ? ` · next gate ${nextGate} ${GATE_STAGE[nextGate]} · ${readyCount}/${review.deliverables.length} approved` : " · final gate"}.</p>
      </div>
    </div>
  );
}

// Expand a requirement into its ACTUAL detail — the live financials/metrics behind it, pulled
// from the SAME model that drives the rack, growth model, and metric cards (one platform for
// presentation + analysis). Slide info is the key: each row opens into the real numbers.
function reqDetailRows(req: { id: string; type: string }, p: Project): [string, string][] {
  const fm = financialMetrics(p), ex = execOf(p), m = metaOf(p), h = hierOf(p);
  const rows: [string, string][] = [];
  switch (req.id) {
    case "REQ-47": rows.push(["NRE cost", k(p.nreK)], ["Risk-adjusted", k(riskAdjustedNreK(p))], ["Man-hours", fm.manHours.toLocaleString()], ["Capital", k(fm.capitalK)]); break;
    case "REQ-49": rows.push(["10-yr revenue", usd(p.fullRev10yM)], ["MSRP", `$${ex.msrpK}k`], ["COGS", `$${ex.cogsK}k`], ["Gross margin", `${ex.marginPct}%`], ["10-yr volume", fm.vol10y.toLocaleString()]); break;
    case "REQ-50": rows.push(["Do-Nothing 10-yr", usd(p.doNothing10yM)], ["Note", "price + volume decline; may not reach 0"]); break;
    case "REQ-51": rows.push(["Existing line", usd(p.doNothing10yM)], ["Rule", "phase-out ≤ 3 yrs → terminal zero"]); break;
    case "REQ-52": rows.push(["Incremental", usd(incrementalRevM(p))], ["Probability-weighted", usd(weightedRevM(p))], ["Upside (at-risk)", `${Math.round(upsideFraction(p) * 100)}%`]); break;
    case "REQ-38": rows.push(["Model confidence", `${p.confidence}/5`]); break;
    case "REQ-53": rows.push(["Technical risk", RISK_LABEL[p.tech]], ["Commercial risk", RISK_LABEL[p.comm]], ["Contingency", `+${Math.round(riskContingency(p) * 100)}%`], ["NPV", usd(fm.npvM)], ["IRR", `${fm.irrPct}%`]); break;
    case "REQ-54": rows.push(["Strategic pillar", m.initiative]); break;
    case "REQ-55": rows.push(["Value ladder", m.valueLadder], ["Impact", m.valueImpact], ["Competitive", m.competitive]); break;
    case "REQ-89": rows.push(["Dependencies declared", String(dependsOn(DEMO_DEPS, p.id).length)]); break;
    case "REQ-90": rows.push(["Acknowledged by others", String(dependentsOf(DEMO_DEPS, p.id).length)]); break;
    case "REQ-71": rows.push(["Product #", h.product], ["Material #", h.material], ["Hierarchy", `${h.bu} › ${h.sbu} › ${h.pgroup} › ${h.alpha}`]); break;
    case "REQ-42": rows.push(["Payback", `${fm.paybackYears} yr`], ["REV/NRE", `${fm.revOverNre.toFixed(1)}×`]); break;
    case "REQ-69": rows.push(["Growth contribution (wtd)", usd(weightedRevM(p))], ["10-yr gross profit", usd(fm.grossProfit10yM)]); break;
    case "REQ-56": rows.push(["Customer / PoR", ex.customer], ["Pursuits", ex.pursuits.map((x) => x.name).join(" · ")], ["Target market", m.targetMarket]); break;
    case "REQ-48": rows.push(["Capital & Tooling", k(fm.capitalK)], ["Total R&D", k(fm.totalRdOpexK)]); break;
    default: break;
  }
  if (req.type === "S") {
    let st = "not started";
    try { st = (JSON.parse(lsGet("innovation-slides") || "{}") as Record<string, string>)[`${p.id}|${req.id}`] || "not started"; } catch { /* none */ }
    rows.push(["Slide input status", st]);
  }
  return rows;
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
  S: "text-cyan-300", REQ: "text-emerald-300", DR: "text-sky-300",
  TR: "text-amber-300", IS: "text-violet-300", DT: "text-rose-300", DC: "text-slate-300",
};
// No "REQ" jargon in the UX — requirement IDs render as R-## (S/DR/IS/DC/TR/DT keep their codes).
const dispReqId = (id: string) => (id.startsWith("REQ-") ? "R-" + id.slice(4) : id);

function GateRequirementsView({ projects, sel, onSelect }: { projects: Project[]; sel: Project; onSelect: (id: string) => void }) {
  const readiness = useMemo(() => gateReadinessAll(sel), [sel]);
  const gateIdx = GATES.indexOf(sel.gate);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  // The registry surfaces ONLY the S1–S18 gate review slides (one per gate G1–G7). The platform's
  // own requirement rows (R-##) and design-traceability items are tracked on the platform, not in
  // this PdM/PgM gate tool. Per-slide gate feedback is set here and shares the SLIDE_KEY store with
  // the Gate-progression cube, so a slide's status stays in sync across both surfaces.
  const sRows = useMemo(() => GATE_REQUIREMENTS.filter((r) => r.type === "S"), []);
  const board = loadReviewBoard();
  const [slides, setSlides] = useState<Record<string, string>>({});
  useEffect(() => { try { setSlides(JSON.parse(lsGet(SLIDE_KEY) || "{}")); } catch { /* none */ } }, []);
  const slideStatus = (id: string) => slides[`${sel.id}|${id}`] || "";
  const cycleSlide = (id: string) => setSlides((prev) => {
    const k = `${sel.id}|${id}`, cur = prev[k] || "";
    const next = SLIDE_STATES[(SLIDE_STATES.indexOf(cur as (typeof SLIDE_STATES)[number]) + 1) % SLIDE_STATES.length];
    const upd = { ...prev, [k]: next };
    lsSet(SLIDE_KEY, JSON.stringify(upd));
    return upd;
  });
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
        <p className="mt-2 text-[11px] text-slate-500">Tolerance ladder ±60/40/20/10/5% — tightens gate over gate; a gate-to-gate move beyond the band raises a variance exception for PRB disposition.</p>
      </section>

      {/* §3.1 Requirements × gates matrix — rows = requirements, columns = G1–G7 */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800">
          <h2 className="text-sm font-semibold">Gate review slides · S1–S18 · {sRows.length} across G1–G7</h2>
          <div className="text-[10px] text-slate-500">Each slide is reviewed at its gate — set your {board} gate feedback per slide.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 text-left font-medium">Slide</th>
                <th className="px-2 py-2 text-left font-medium">Review deliverable</th>
                <th className="px-2 py-2 text-center font-medium">Band</th>
                {GATES.map((g) => <th key={g} className="px-1.5 py-2 text-center font-mono font-medium">{g}</th>)}
                <th className="px-2 py-2 text-right font-medium">Status</th>
                <th className="px-2 py-2 text-right font-medium">{board} feedback</th>
              </tr>
            </thead>
            <tbody>
              {sRows.map((req) => {
                const status = requirementStatus(req, sel);
                const earliest = GATES.indexOf(req.earliestGate);
                const isOpen = open.has(req.id);
                const detail = isOpen ? reqDetailRows(req, sel) : [];
                return (
                  <React.Fragment key={req.id}>
                  <tr onClick={() => toggle(req.id)} className={`cursor-pointer border-b border-slate-900 hover:bg-slate-800/30 ${isOpen ? "bg-slate-800/40" : ""}`} title="Expand into actual detail">
                    <td className={`px-3 py-1.5 font-mono text-[11px] ${REQ_TYPE_CHIP[req.type]}`}><span className="mr-1 text-slate-500">{isOpen ? "▾" : "▸"}</span>{dispReqId(req.id)}</td>
                    <td className="px-2 py-1.5">
                      <div className="text-[13px] text-slate-200 leading-tight">Gate {req.earliestGate} review slide</div>
                      <div className="text-[10px] text-slate-500"><span className="font-mono text-cyan-400/80">Gate {req.earliestGate}</span> · {board} review</div>
                    </td>
                    <td className="px-2 py-1.5 text-center text-[11px] tabular-nums text-slate-400">±{Math.round(req.band * 100)}%</td>
                    {GATES.map((g, gi) => {
                      if (gi < earliest) return <td key={g} className="px-1.5 py-1.5 text-center text-slate-800">·</td>;
                      const cellState = gi < gateIdx + 1 ? "done" : gi === gateIdx + 1 ? "next" : "future";
                      const dot = cellState === "done" ? "bg-emerald-400" : cellState === "next" ? "bg-amber-400" : "bg-slate-600";
                      const ring = gi === earliest ? "ring-1 ring-cyan-500/40" : "";
                      return <td key={g} className="px-1.5 py-1.5 text-center"><span className={`inline-block h-2.5 w-2.5 rounded-full ${dot} ${ring}`} title={gi === earliest ? "first required here" : "required"} /></td>;
                    })}
                    <td className="px-2 py-1.5 text-right">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${REQ_STATUS_CHIP[status]}`}>{REQ_STATUS_LABEL[status]}</span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {(() => { const st = slideStatus(req.id); return (
                        <button onClick={(e) => { e.stopPropagation(); cycleSlide(req.id); }} title={`${board} gate feedback for ${req.id} (Gate ${req.earliestGate}) — click to advance`}
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-mono ${SLIDE_PILL[st]}`}>{SLIDE_TXT[st]}</button>
                      ); })()}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-slate-900 bg-[#0b0f14]">
                      <td colSpan={3 + GATES.length + 2} className="px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wider text-cyan-400">Actual detail · {sel.name}</div>
                        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1.5 text-[11px]">
                          {detail.map(([l, v]) => (
                            <span key={l} className="inline-flex flex-col">
                              <span className="text-[9px] uppercase tracking-wider text-slate-500">{l}</span>
                              <span className="tabular-nums text-slate-100">{v}</span>
                            </span>
                          ))}
                          {detail.length === 0 && <span className="text-slate-500">Reviewed at {req.earliestGate} · ±{Math.round(req.band * 100)}% band · {REQ_STATUS_LABEL[status]}</span>}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500">Reviewed at Gate {req.earliestGate} · figures derived from the live project model (same source as the rack, growth model, and metric cards).</div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
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
const PILLAR_KEY = "innovation-pillars";
// Strategic pillars are admin-editable (Business Setup) — seeded from the code defaults and
// persisted; the edit-project + new-idea pillar dropdowns read from here.
type PillarDef = { name: string; desc: string };
function loadPillars(): PillarDef[] {
  const s = lsGet(PILLAR_KEY);
  if (s) { try { const p = JSON.parse(s) as PillarDef[]; if (Array.isArray(p) && p.length) return p; } catch { /* seed */ } }
  return STRATEGIC_INITIATIVES.map((n) => ({ name: n, desc: PILLAR_DESC[n] }));
}
// Shared master-data loader — reads the admin Business Setup (localStorage) or falls back to
// the seed. Powers the edit-project + Submit-New-Idea dropdowns so BU/SBU/Alpha changes flow.
function loadBizSetup(): BizSetup {
  const saved = lsGet(BIZ_KEY);
  if (saved) { try { return JSON.parse(saved) as BizSetup; } catch { /* fall through to seed */ } }
  return seedBizSetup(DEMO_PROJECTS);
}
// Review board that gives per-slide gate feedback. Default IRB (Innovation Review Board);
// admin-selectable/editable in Business Setup. Persisted so every gate-feedback surface agrees.
const REVIEW_BOARD_KEY = "innovation-review-board";
const DEFAULT_REVIEW_BOARD = "IRB";
const REVIEW_BOARD_PRESETS = ["IRB", "PRB", "IPT"]; // Innovation Review Board · Product Review Board · Integrated Product Team
function loadReviewBoard(): string { return (lsGet(REVIEW_BOARD_KEY) || DEFAULT_REVIEW_BOARD).trim() || DEFAULT_REVIEW_BOARD; }
// The portfolio-prioritization module name (formerly "Rack & Stack") — admin-configurable so
// each org can label the prioritize-and-fund workflow in its own vocabulary. Persisted.
const STACK_NAME_KEY = "innovation-stack-name";
const DEFAULT_STACK_NAME = "Portfolio Prioritization";
const STACK_NAME_PRESETS = ["Portfolio Prioritization", "Prioritize & Fund", "Portfolio Balancer", "Funding Line", "Priority Board"];
function loadStackName(): string { return (lsGet(STACK_NAME_KEY) || DEFAULT_STACK_NAME).trim() || DEFAULT_STACK_NAME; }
function BusinessSetup({ onRename }: { onRename?: (name: string) => void }) {
  const [admin, setAdmin] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [setup, setSetup] = useState<BizSetup>(() => seedBizSetup(DEMO_PROJECTS));
  const [tier, setTier] = useState<BizTier>("bu");
  const [pillars, setPillars] = useState<PillarDef[]>(() => STRATEGIC_INITIATIVES.map((n) => ({ name: n, desc: PILLAR_DESC[n] })));
  const [board, setBoard] = useState(DEFAULT_REVIEW_BOARD);
  const [stackName, setStackName] = useState(DEFAULT_STACK_NAME);
  useEffect(() => {
    setAdmin(ssGet(ADMIN_KEY) === "1");
    const saved = lsGet(BIZ_KEY);
    if (saved) { try { setSetup(JSON.parse(saved)); } catch { /* keep seed */ } }
    setPillars(loadPillars());
    setBoard(loadReviewBoard());
    setStackName(loadStackName());
  }, []);
  const persist = (next: BizSetup) => { setSetup(next); lsSet(BIZ_KEY, JSON.stringify(next)); };
  const persistPillars = (next: PillarDef[]) => { setPillars(next); lsSet(PILLAR_KEY, JSON.stringify(next)); };
  const persistBoard = (next: string) => { setBoard(next); lsSet(REVIEW_BOARD_KEY, next); };
  const persistStackName = (next: string) => { setStackName(next); lsSet(STACK_NAME_KEY, next); onRename?.(next); };
  const unlock = () => (pw === CODE ? (ssSet(ADMIN_KEY, "1"), setAdmin(true)) : setErr(true));

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
          <button onClick={() => { ssDel(ADMIN_KEY); setAdmin(false); }} className="rounded border border-slate-700 px-2 py-1 text-slate-400 hover:bg-slate-800">Lock</button>
        </div>
      </div>

      {/* Strategic pillars editor — the four (or more) pillars every project maps onto */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Strategic Pillars <span className="text-[11px] text-slate-500">({pillars.length}) — drive the project pillar dropdown</span></h2>
          <button onClick={() => persistPillars([...pillars, { name: `Pillar ${pillars.length + 1}`, desc: "" }])} className="rounded bg-cyan-500/90 px-2.5 py-1 text-[11px] font-semibold text-[#06202a] hover:bg-cyan-400">+ Add pillar</button>
        </div>
        <div className="mt-2 space-y-1.5">
          {pillars.map((pl, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-8 items-center justify-center rounded bg-cyan-500/15 text-[10px] font-mono text-cyan-300">P{i + 1}</span>
              <input value={pl.name} onChange={(e) => persistPillars(pillars.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={`w-56 ${inp}`} />
              <input value={pl.desc} onChange={(e) => persistPillars(pillars.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="one-line description" className={`flex-1 min-w-[200px] ${inp}`} />
              <button onClick={() => persistPillars(pillars.filter((_, j) => j !== i))} className="rounded px-1.5 text-rose-400 hover:bg-rose-500/10" title="Delete">✕</button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Renaming a pillar updates the edit-project + Submit-New-Idea dropdowns. Existing projects keep their stored pillar until re-selected.</p>
      </section>

      {/* Module name — label for the prioritize-and-fund workflow (formerly "Rack & Stack") */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <h2 className="text-sm font-semibold">Prioritization Module Name <span className="text-[11px] text-slate-500">— the tab, page title &amp; section header</span></h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {STACK_NAME_PRESETS.map((n) => (
            <button key={n} onClick={() => persistStackName(n)}
              className={`rounded border px-2.5 py-1 text-xs ${stackName === n ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>{n}</button>
          ))}
          <span className="text-[11px] text-slate-500">or</span>
          <input value={stackName} onChange={(e) => persistStackName(e.target.value)} maxLength={32}
            placeholder="Custom name" className={`w-44 ${inp}`} />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Default <b className="text-cyan-300">Portfolio Prioritization</b>. Renaming here relabels the module across the tool (tab · title · section header).</p>
      </section>

      {/* Review board — the body that gives per-slide gate feedback (default IRB) */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <h2 className="text-sm font-semibold">Review Board <span className="text-[11px] text-slate-500">— gives per-slide gate feedback across G1–G7</span></h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {REVIEW_BOARD_PRESETS.map((b) => (
            <button key={b} onClick={() => persistBoard(b)}
              className={`rounded border px-2.5 py-1 text-xs font-mono ${board === b ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>{b}</button>
          ))}
          <span className="text-[11px] text-slate-500">or</span>
          <input value={board} onChange={(e) => persistBoard(e.target.value.toUpperCase())} maxLength={8}
            placeholder="Custom" className={`w-28 text-center uppercase ${inp}`} />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Default <b className="text-cyan-300">IRB</b> (Innovation Review Board). Selecting one here relabels the gate-feedback attribution everywhere in the tool.</p>
      </section>

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
      <Card title="Risk-prediction market" tag="Poll to de-risk">
        <Row l="Open predictions" v={`${p.predictions}`} />
        <Row l="Mitigated payout" v="= materialized" good />
        <Row l="Roles enforced" v="predictor ≠ actioner ≠ resolver" />
        <p className="mt-1 text-[11px] text-slate-500">Anyone may submit a risk prediction; rewards accrue to predictions that prove correct and get actioned.</p>
      </Card>
      {/* Upside pool + $/min */}
      <Card title="Project Upside pool" tag="Time = money">
        <Row l="Pool @ 1 mo early" v={usd(upsidePoolM)} good />
        <Row l="Cost of time" v={`$${burnPerMinUsd.toFixed(2)}/min`} />
        <Row l="Critical-path" v={p.criticalPath ? "multiplier ×" : "base rate"} tone={p.criticalPath ? "good" : undefined} />
        <p className="mt-1 text-[11px] text-slate-500">Baseline locked at G2 by an approver outside the team.</p>
      </Card>
      {/* Intelligence load */}
      <Card title="Intelligence load · AI · SI · HI" tag="Burnout guard">
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

// Growth Model — the signature Rack & Stack chart: BU→SBU hierarchy filter, # Years (1/3/10),
// Targeted Growth Rate, YoY Do-Nothing decline, Revenue Options, Show/Hide baseline, 4-series legend.
// (Gate cadence lives on the per-project gate overview, not here.)
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
  // Base revenue anchors on the admin Business-Setup SBU base (one source of truth), scope-aware.
  const bizSetup = loadBizSetup();
  const scopeBase = (b: string, s: string) => {
    if (s && s !== "All") return bizSetup.sbu.find((n) => n.code === s)?.baseM ?? scopeBaseM(b, s);
    if (b && b !== "All") { const v = bizSetup.sbu.filter((n) => n.parent === b).reduce((a, n) => a + (n.baseM ?? 0), 0); return v || scopeBaseM(b, s); }
    const all = bizSetup.sbu.reduce((a, n) => a + (n.baseM ?? 0), 0); return all || companyBaseM();
  };
  const [baseStr, setBaseStr] = useState(String(companyBaseM()));
  useEffect(() => { setBaseStr(String(scopeBase(bu, sbu))); }, [bu, sbu]); // eslint-disable-line react-hooks/exhaustive-deps
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
        <h3 className="text-sm font-semibold">Growth Model · Do-Nothing Scenario with Portfolio NPIs</h3>
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
    { name: "REV · probability-weighted", value: roi.weightedM, color: "#34d399" },
    { name: "Upside · at-risk to 100%", value: Math.max(0, roi.incrementalM - roi.weightedM), color: "#fbbf24" },
  ];
  const kM = (v: number) => `$${(v / 1000).toFixed(1)}M`;
  // Admin Business-Setup drives labels + base revenue (one source of truth for the rollup).
  const bizSetup = loadBizSetup();
  const sbuBaseOf = (c: string) => bizSetup.sbu.find((n) => n.code === c)?.baseM ?? 0;
  const buLabelOf = (c: string) => bizSetup.bu.find((n) => n.code === c)?.label ?? BU_LABEL[c] ?? "BU";
  const sbuLabelOf = (c: string) => bizSetup.sbu.find((n) => n.code === c)?.label ?? SBU_LABEL[c] ?? "SBU";
  const roll = companyRollup(projects, { sbuBase: sbuBaseOf });

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
                    <td className="px-2 py-1.5 pl-4 font-semibold text-slate-100">▸ {bu.name} <span className="text-[10px] text-slate-500">{buLabelOf(bu.name)}</span></td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300">${bu.baseM}M</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-300">{kM(bu.spendK)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-400">{usd(bu.npvM)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-400">{bu.count}</td>
                  </tr>
                  {bu.sbus.map((sbu) => (
                    <React.Fragment key={sbu.name}>
                      <tr className="border-b border-slate-900 bg-slate-900/20">
                        <td className="px-2 py-1 pl-8 font-medium">· {sbu.name} <span className="text-[10px] text-slate-500">{sbuLabelOf(sbu.name)}</span></td>
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
        <StatTile label="Prob-weighted rev" value={usd(wtdTotal)} sub="risk-adjusted" tone="green" />
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

      {/* Intelligence Load — AI·SI·HI by strategic pillar / BU / SBU / Alpha Group / Project */}
      <IntelligenceLoadPanel projects={projects} />

      {/* Dependencies — Summary table + Constellation graph (FLIR §4) */}
      <DependencyPanel projects={projects} deps={DEMO_DEPS} onSelect={onSelect} />
    </div>
  );
}

// Intelligence Load (AI · SI · HI) by strategic pillar (new pillar categories) — also viewable
// per BU / SBU / Alpha Group / Project. AI cyan · SI amber · HI violet; humanLoad burnout flag.
function IntelligenceLoadPanel({ projects }: { projects: Project[] }) {
  const [group, setGroup] = useState<"pillar" | "bu" | "sbu" | "pgroup" | "project">("pillar");
  const keyFn = (p: Project) => group === "pillar" ? metaOf(p).initiative : group === "project" ? p.name : hierOf(p)[group as HierKey];
  const rows = intelligenceLoad(projects, keyFn);
  const GROUPS = [["pillar", "Strategic Pillar"], ["bu", "BU"], ["sbu", "SBU"], ["pgroup", "Alpha Group"], ["project", "Project"]] as const;
  return (
    <DashCard title="Intelligence Load · AI · SI · HI" tag="by category">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Group by</span>
        <div className="flex flex-wrap overflow-hidden rounded-md border border-slate-700">
          {GROUPS.map(([g, lbl]) => (
            <button key={g} onClick={() => setGroup(g)}
              className={`px-2 py-1 ${group === g ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
        <span className="ml-auto text-[10px]"><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-cyan-500" />AI <i className="mx-1 inline-block h-2 w-2 rounded-sm bg-amber-400" />SI <i className="mx-1 inline-block h-2 w-2 rounded-sm bg-violet-400" />HI</span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-200 truncate">{r.name} <span className="text-slate-500">· {r.count}</span></span>
              <span className="font-mono text-slate-400">AI {Math.round(r.ai * 100)} · SI {Math.round(r.si * 100)} · HI {Math.round(r.hi * 100)}{r.humanLoad > 0.7 ? " · ⚠ burnout" : ""}</span>
            </div>
            <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-[#0b0f14]">
              <span className="bg-cyan-500" style={{ width: `${r.ai * 100}%` }} />
              <span className="bg-amber-400" style={{ width: `${r.si * 100}%` }} />
              <span className="bg-violet-400" style={{ width: `${r.hi * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">Pillar-specific categories by default; switch to BU / SBU / Alpha Group / Project. Mix is the mean across the group; ⚠ flags mean human load &gt; 70%.</p>
    </DashCard>
  );
}

// Dependencies (FLIR §4) — Summary table (§4.2) + Constellation graph (§4.3). Directed edge
// A→B = "B's risk affects A's success". Bubble ∝ NPV · border green above-line / red below ·
// fill by BU · arrows point to the primary (bottom) dependency.
const BU_COLOR: Record<string, string> = { MS: "#19c8cf", DS: "#c084fc", AP: "#fbbf24" };
function DependencyPanel({ projects, deps, onSelect }: { projects: Project[]; deps: DepEdge[]; onSelect: (id: string) => void }) {
  const summary = dependencySummary(projects, deps);
  const kM = (v: number) => `$${v.toFixed(1)}M`;
  // Bubble size is selectable (deck: NPV · Year-1 Rev · 3-Year Rev · 10-Year Rev).
  const [sizeMode, setSizeMode] = useState<"npv" | "y1" | "y3" | "y10">("npv");
  const sizeVal = (p: Project) => {
    if (sizeMode === "npv") return Math.abs(npvM(p));
    const s = projectRevSeries(p, { years: 10, funded: true });
    if (sizeMode === "y1") return s[0].total;
    if (sizeMode === "y3") return s.slice(0, 3).reduce((a, r) => a + r.total, 0);
    return p.fullRev10yM;
  };
  const SIZE_LABEL: Record<string, string> = { npv: "NPV", y1: "Year-1 Rev", y3: "3-Year Rev", y10: "10-Year Rev" };
  // Constellation layout (FLIR §4.3): layered by in-degree so the MOST-depended-upon project
  // (the primary dependency) sinks to the BOTTOM and arrows point down to it. Nodes numbered
  // by dependent-rank (#1 = most depended-upon). Bubble ∝ √NPV.
  const withDeps = projects.filter((p) => dependsOn(deps, p.id).length || dependentsOf(deps, p.id).length);
  const inDeg = (id: string) => dependentsOf(deps, id).length;
  const ranked = [...withDeps].sort((a, b) => inDeg(b.id) - inDeg(a.id) || npvM(b) - npvM(a));
  const rankOf = new Map(ranked.map((p, i) => [p.id, i + 1]));           // #1 = most depended-upon
  const degVals = Array.from(new Set(withDeps.map((p) => inDeg(p.id)))).sort((a, b) => a - b); // asc → top→bottom
  const layerOf = (id: string) => degVals.indexOf(inDeg(id));            // 0 = fewest dependents (top)
  const nL = degVals.length;
  const W = 640, H = 400, T = 34, Bm = 42;
  const layerY = (li: number) => (nL <= 1 ? (T + H - Bm) / 2 : T + (li / (nL - 1)) * (H - T - Bm));
  const pos = new Map<string, { x: number; y: number; r: number }>();
  const maxSize = Math.max(...withDeps.map((p) => sizeVal(p)), 1);
  degVals.forEach((_, li) => {
    const nodes = withDeps.filter((p) => layerOf(p.id) === li).sort((a, b) => npvM(b) - npvM(a));
    nodes.forEach((p, j) => {
      const x = nodes.length === 1 ? W / 2 : 46 + (j / (nodes.length - 1)) * (W - 92);
      pos.set(p.id, { x, y: layerY(li), r: 7 + 15 * Math.sqrt(Math.max(0, sizeVal(p)) / maxSize) });
    });
  });
  return (
    <DashCard title="Dependencies · Summary + Constellation" tag="Cross-project">
      {/* Bubble-size selector (deck: NPV · Year-1 · 3-Year · 10-Year) */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Bubble size</span>
        <div className="flex overflow-hidden rounded-md border border-slate-700">
          {(["npv", "y1", "y3", "y10"] as const).map((m) => (
            <button key={m} onClick={() => setSizeMode(m)}
              className={`px-2 py-1 ${sizeMode === m ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{SIZE_LABEL[m]}</button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-slate-500">Gravity: most-depended-upon sinks to the bottom</span>
      </div>
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
            const rank = rankOf.get(p.id)!;
            const deg = inDeg(p.id);
            return (
              <g key={p.id} className="cursor-pointer" onClick={() => onSelect(p.id)}>
                <circle cx={pt.x} cy={pt.y} r={pt.r} fill={BU_COLOR[hierOf(p).bu] ?? "#38bdf8"} fillOpacity={0.25} stroke={above ? "#34d399" : "#fb7185"} strokeWidth={2} />
                <text x={pt.x} y={pt.y + 3.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#e2e8f0" fontFamily="ui-monospace, monospace">{rank}</text>
                <text x={pt.x} y={pt.y - pt.r - 3} textAnchor="middle" fontSize="9" fill="#cbd5e1" fontFamily="ui-monospace, monospace">{hierOf(p).bu}·{p.id.slice(-2)}{deg ? ` ·${deg}↓` : ""}</text>
                <text x={pt.x} y={pt.y + pt.r + 9} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">{usd(npvM(p))}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="text-slate-400"><b>#1 = most-depended-upon (bottom)</b> · arrows point down · ·N↓ = dependents</span>
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
  // Track the selected project: when the operator selects another project elsewhere, default the
  // Identify-risk form to it (the dropdown still allows manual override). Mirrors ProjectDetail's
  // [p.id] reset — fixes the stale default that logged risks against the previously-selected project.
  useEffect(() => { setPid(selId); }, [selId]);
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
        <h2 className="text-sm font-semibold">Risk Register · eXeL AI feedback session</h2>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">Identify · Concur · De-risk</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Anyone identifies a risk; the team gives internal feedback by concurring (poll) — priority = severity × likelihood × status × concurrence. Actioned + correct predictions earn ♡ / 웃 / ◬ rewards.</p>

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
        <button onClick={add} disabled={!title.trim()} className="rounded-md bg-cyan-500 px-3 py-1.5 font-semibold text-[#06202a] hover:bg-cyan-400 disabled:opacity-30">+ Identify risk</button>
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
              <th className="px-2 py-1.5 text-center">Concur</th>
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
                  <button onClick={(e) => { e.stopPropagation(); upvote(r.id); }} className="rounded border border-slate-700 px-1.5 py-0.5 text-[11px] text-cyan-300 hover:bg-cyan-500/10" title="Feedback: I concur this is a risk">▲ concur</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Priority = severity × likelihood × status × community concurrence (votes). Cycle status to de-risk — exposure collapses as the team mitigates.
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
