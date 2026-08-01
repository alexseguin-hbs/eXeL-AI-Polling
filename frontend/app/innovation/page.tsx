"use client";

/**
 * PROJECT INNOVATION — Vision • 2525  (CRS-36 → CRS-93)
 * Rack & Stack portfolio (registry + prioritization + funding line + live budget) plus the
 * differentiators: gate progression by review slide, risk-prediction market, Project Upside pool,
 * $/min cost of elapsed time, and AI·SI·HI intelligence load with a burnout guard.
 *
 * Gated behind an access code (369963) until fully tested — the "UNLOCK" tab.
 */
import ReactDOM from "react-dom";
import React, { useMemo, useState, useEffect, useRef, useCallback, useId, Fragment } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { saveState, loadState, loadAllState, ownerKey } from "@/lib/innovation-store";
import {
  DEMO_PROJECTS, stackWithBudget, incrementalRevM, weightedRevM, blendedMarginFrac, segColorOf, scopeSeed, buCagrPct,
  launchYearOf, perMinFinancials, groupsOf,
  BUDGET_SCENARIOS, derivedDriversOf, type BudgetScenario, scenarioNodeBudgets,
  pSuccess, upsideFraction, npvM, irrPct, revOverNre, GATE_BAND, GATE_STAGE,
  timeReadout, toleranceBand, TIME_UNITS, UNIT_LABEL, scheduleFromStart, GATES,
  gateScheduleOf, defaultStartISO, addDaysISO, PHASE_DAYS, type GateStop,
  riskContingency, riskAdjustedNreK, riskAdjustedWorkdays,
  growthModel, RISK_LABEL, HIER_LEVELS, hierValues, scopeByHier, hierOf, type HierSel, scopePrefixOf, scopedProjectLabel,
  DEMO_RISKS, riskScore, riskExposure, riskPriority, riskBand, riskRollup,
  RISK_STATUS_LABEL, spendByBU, spendByCategory, rdEfficiency, costSplit, roiSummary,
  pipelineByGate, devTypeOf, DEV_TYPE, lobBaseM, companyBaseM, companyRollup, COMPANY_NAME, sayDo, briefOf, execOf, intelligenceLoad,
  scopeBaseM, GATE_REVIEW, GATE_NOTES, SLIDES, slideDef, slideHintOf, aiSlideOf, rackByLevel, projectRevSeries,
  SLIDE_SCHEMA, slideSpec, linkedSlideField, aiSlideField, SLIDE_SEED,
  sourceSlideOf, sourceLabelOf, SOURCE_LABEL,
  DISCIPLINES, disciplineLabel, storyReqId, DISCIPLINE_MAX,
  STORY_MATURITY, isStoryGroupRow, storyTableRows, TRACE_COLS, isTraceGroupRow, traceRowsOf, designOutputId,
  fitHeader, HEADER_NAME_BUDGET, HEADER_NAME_FLOOR, HEADER_TITLE_BUDGET, HEADER_TITLE_FLOOR,
  type SlideField, type SlideSpec, type SlideFieldValue,
  buBuckets, fundingBuckets, costPerMinuteOf, upsideAccelOf, nodeAllocation, type BuBucket, type FundingBucket, type NodeAllocation,
  bomOf, bomStdCost, bomExtended, productionCost, BU_LABEL, SBU_LABEL,
  GATE_REQUIREMENTS, requirementStatus, gateReadinessAll,
  TOLERANCE_LADDER, REQ_STATUS_LABEL,
  metaOf, pillarColorOf, financialMetrics, financialsOverview, execSummaryBullets, valuePropOf, nbaOf, aiValuePropOf,
  valueEquation, valuePropFromEquation, valueEquationOf, type ValueDriver,
  valuePerDollarOf, winProbabilityOf, valueIndexOf, riskBandOf, costPerServedBuyerOf, killRiskOf,
  expectedValueOf, handoffReadiness, consistencyCheck, intelLoadGloss,
  DEMO_DEPS, dependencySummary, dependsOn, dependentsOf, constellationLayout,
  STRATEGIC_INITIATIVES, PILLAR_DESC,
  seedBizSetup, DEFAULT_COMPANY_NAME, BIZ_TIERS, BU_COLOR, fmtPerCadence, CADENCE_UNIT, type Cadence,
  can, roleOf, isLastLead, scrubText, ROLE_LABEL, PROJECT_ROLES, type ProjectRole, type ProjectMember, type MembershipMap,
  makeAuditEntry, mergeAudit, diffFundedSets, summarizeAudit, fmtAuditEntry, auditTimeline, type AuditEntry, type AuditKind, type TimelinePoint,
  changeSummaryRows, reviewApprovalRows,
  makeSlideVersion, mergeSlideVersions, slideVersionTimeline, versionDelta, isSubstantial, finSnapOf, buildDemoVersionSeed,
  gateReviewHistoryRows, gateApprovalPanels, GATE_HISTORY_COLS, isSayDoReferenceGate, SAYDO_REFERENCE_GATES, tabLabelOf,
  type SlideVersion,
  type Project, type Gate, type TimeUnit, type HierKey, type RevMode, type Risk, type RiskStatus, type RiskCategory,
  type ReqStatus, type DepEdge, type BizTier, type BizNode, type BizSetup, type SegmentValueProp,
  // S10 · the financial record — Rack & Stack 3-step model, 11 calendar years.
  finOf, visibleYearCount, spendTotalK, bandRevK, bandMgnK, bandMgnPct, incRevK, incMgnK, incMgnPct,
  incUnits, incYoYPct, type FinYear, type FinPlan, type FinBandYear, aspOf, allocHeadroom, allocBarSplit, valueSplit, captureOf, valueForMoney, VFM_BANDS, driverValueM, driverTone, importanceBars,
  withFinYear, withFinBand, withFinSpendRow, withFinBandRow, linearize, FIN_SPAN, yearLabel, finRollup,
  finGateReadiness, finFmtK, finFmtPct, finFmtQty, confidenceFromRisk, confidenceOf, confidenceTone,
  BIZ_CONF_LADDER, bizConfOf, competitorsOf, clampX, nextCompetitorLabel, type WtpMarker,
} from "@/lib/innovation-data";
import { useViewport, pinchZoom, touchDistance, ZOOM_MIN, ZOOM_MAX } from "@/lib/use-viewport";
import { Settings, FileText, Lightbulb, Save, Trash2 } from "lucide-react"; // settings gear + Template/New-Idea icons + W-7 disk Save (the ONE save glyph, matching Architect-2525)
import { SPREAD_BASES, spreadPerMin, spreadDaysOf, type SpreadKey } from "@/lib/soi-calendar"; // MoT time-spread → $/min
import { loadImageLibrary, addToImageLibrary, removeFromImageLibrary, signedDataURL, type LibImage } from "@/lib/image-library"; // shared CONOPS image pool (Light-Codex signed)

const CODE = "369963";
const SS_KEY = "innovation-unlocked";
// Admin config bundle mirrored to Supabase (Slice 0) — the persisted localStorage keys that make up
// the tool's editable master data. Kept as literals so the store stays decoupled from the loaders below.
const CONFIG_KEYS = [
  "innovation-pillars", "innovation-biz-setup", "innovation-review-board",
  "innovation-stack-name", "innovation-dogtag-highlights", "innovation-segment-library",
  "innovation-glossary",
];
// Shared glossary (Slice 8) — one versioned definition per metric/term, admin-editable, cited across the
// tool. Persisted with the config bundle (→ Supabase). Keeps engineer/business/BD vocabulary aligned.
const GLOSSARY_KEY = "innovation-glossary";
const DEFAULT_GLOSSARY: Record<string, string> = {
  "NBA": "Next Best Alternative — the current competitive alternative or As-Is solution the customer uses today.",
  "EVC": "Economic Value to Customer — the NBA reference value plus our differentiation value vs the NBA.",
  "Value Equation": "importance × (our score − NBA score) × addressable revenue, summed across differentiators.",
  "$/min cost-of-time": "Burn rate of elapsed development time; NRE spread across the remaining schedule.",
  "Intelligence Load": "The AI · SI · HI mix of a project — machine, shared-intent, and human effort shares.",
};
function loadGlossary(): Record<string, string> {
  const s = lsGet(GLOSSARY_KEY);
  if (s) { try { const o = JSON.parse(s); if (o && typeof o === "object") return o as Record<string, string>; } catch { /* default */ } }
  return DEFAULT_GLOSSARY;
}
// Segment library (Slice 7) — a cross-project taxonomy of recurring buyer needs, admin-editable, so one
// team's discovered segment seeds another's value prop. Persisted with the config bundle (→ Supabase).
const SEGLIB_KEY = "innovation-segment-library";
const DEFAULT_SEGLIB = ["Air Force · ISR", "Army · Fires", "Navy · Maritime", "USMC · Expeditionary", "SOF · Direct Action", "Allied / FMS"];
function loadSegLib(): string[] {
  const s = lsGet(SEGLIB_KEY);
  if (s) { try { const a = JSON.parse(s) as string[]; if (Array.isArray(a)) return a.filter((x) => typeof x === "string"); } catch { /* default */ } }
  return DEFAULT_SEGLIB;
}

// Persona lens (12-AsM usability) — the same portfolio seen through four operator roles.
type Persona = "pm" | "mgr" | "sbu" | "vp";
const PERSONAS: { key: Persona; label: string; glyph: string; lens: string; view: "portfolio" | "gates" | "dashboards" | "setup"; level?: HierKey }[] = [
  { key: "pm",  label: "Product / Project Mgr", glyph: "◱", lens: "Deep-dive one project — gates, 12 metrics, financials, risks, Say/Do.", view: "portfolio", level: "product" },
  { key: "mgr", label: "Manager",               glyph: "☰", lens: "Alpha-Group rollup — funding decisions across your projects, financial projection on top.", view: "portfolio", level: "pgroup" },
  { key: "sbu", label: "SBU Director",          glyph: "▤", lens: "SBU rollup + funding decisions across Alpha Groups — financial projection on top.", view: "portfolio", level: "sbu" },
  { key: "vp",  label: "VP · Portfolio",        glyph: "◈", lens: "Whole-portfolio (BU) rollup — financial projection on top, growth model, dependencies, gate readiness.", view: "portfolio", level: "bu" },
];
const usd = (m: number) => `$${m.toFixed(1)}M`;
const k = (n: number) => `$${(n / 1000).toFixed(1)}M`;
// Shared data-viz palette (single source, Spiral) — named tokens used by charts/bars/scatter so no surface
// re-introduces a stray hex. Trinity-aligned: AI cyan · SI sunset · HI violet, plus semantic accents.
const VIZ = { cyan: "#19c8cf", violet: "#c084fc", amber: "#fbbf24", rose: "#fb7185", emerald: "#34d399", sunset: "#f7b955", hiViolet: "#a78bfa", slate: "#334155" } as const;
// Raw project-category string → the project-type (DEV_TYPE) color, so category surfaces read from ONE palette
// (Spiral: was a hardcoded #38bdf8). Mirrors devTypeOf's category regex (gate isn't available at the category level).
const categoryColor = (cat: string): string =>
  /phase|legacy|sustain/i.test(cat) ? DEV_TYPE.sustaining.color
    : /platform/i.test(cat) ? DEV_TYPE.newmarket.color
    : /research|study|concept/i.test(cat) ? DEV_TYPE.prestudy.color
    : DEV_TYPE.enhance.color;
// Respect reduced-motion for programmatic scrolls (a11y). Falls back to instant when the user opts out.
const scrollToEl = (el: Element | null) => {
  if (!el) return;
  const smooth = typeof window !== "undefined" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
};
// Payback display — a non-finite / non-positive value means the project never recovers its NRE; render
// an em-dash rather than a misleading "0 yr" that reads as the best payback (council: Thoth/Enki).
const payb = (y: number) => (Number.isFinite(y) && y > 0 ? `${y} yr` : "—");

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
  const { t } = useLexicon();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => (pw === CODE ? onUnlock() : setErr(true));
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f14] text-slate-100 p-6">
      <div className="w-full max-w-3xl grid gap-5 md:grid-cols-[1fr_1.1fr] items-center">
        {/* Unlock card */}
        <div className="w-full rounded-2xl border border-cyan-500/20 bg-[#111820] p-7 shadow-2xl">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400">{t("innovation.gate.eyebrow")}</div>
          <h1 className="mt-1 text-xl font-semibold">{t("innovation.gate.title")}</h1>
          <p className="mt-2 text-sm text-slate-400">{t("innovation.gate.blurb")}</p>
          <input
            type="password" inputMode="numeric" value={pw} autoFocus
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("innovation.gate.codePlaceholder")}
            className="mt-4 w-full rounded-lg border border-slate-700 bg-[#0b0f14] px-3 py-2.5 text-center tracking-[0.4em] font-mono text-lg outline-none focus:border-cyan-500"
          />
          {err && <p className="mt-2 text-sm text-rose-400">{t("innovation.gate.incorrect")}</p>}
          <button onClick={submit} className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-[#06202a] hover:bg-cyan-400">
            {t("innovation.gate.unlock")}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-500">{t("innovation.gate.codeNote")}</p>
        </div>
        {/* Strategic pillars — admin-editable in Business Setup (loadPillars) */}
        <div className="w-full">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">{t("innovation.gate.pillars")}</div>
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

/** Local mirror of the working project set. Same namespace convention as the other `innovation-*` keys. */
const PROJECTS_KEY = "innovation-projects";

// ── Portfolio workbench ─────────────────────────────────────────────────────────────────
function Board() {
  const { t } = useLexicon();
  const vp = useViewport(); // F6 — responsive contract (16:9/1080p/4k/other · portrait/landscape), parity with Architect/Security-2525
  // Default rank: by weighted NPV desc (a sane starting stack; user then drags).
  // PROJECT EDITS MUST SURVIVE A REFRESH, cloud or no cloud. Until now `order` was pushed to Supabase and
  // nowhere else — so with no `NEXT_PUBLIC_SUPABASE_*` configured, `saveState` returns "offline" and every
  // per-project edit (a new idea, value drivers, and now 154 typed S10 cells) died on reload. A financial
  // record that evaporates when you close the tab is not a source of truth. Local mirror first, cloud still
  // wins on hydrate (see the loadAllState effect) so cross-device behaviour is unchanged.
  const [order, setOrder] = useState<Project[]>(
    [...DEMO_PROJECTS].sort((a, b) => npvM(b) - npvM(a))
  );
  useEffect(() => {
    const raw = lsGet(PROJECTS_KEY);
    if (!raw) return;
    try {
      const local = JSON.parse(raw) as Project[];
      if (Array.isArray(local) && local.length > 0 && local.every((p) => p && typeof p.id === "string")) {
        setOrder(local); setSelId(local[0].id);
      }
    } catch { /* corrupt mirror → keep the seeds, never blank the portfolio */ }
  }, []);
  const [selId, setSelId] = useState(order[0].id);
  const [risks, setRisks] = useState<Risk[]>(DEMO_RISKS);
  const [view, setView] = useState<"portfolio" | "gates" | "dashboards" | "setup">("portfolio");
  const [persona, setPersona] = useState<Persona>("sbu");
  const [detailMax, setDetailMax] = useState(false); // maximize the selected-project deep dive full-width
  const [portfolioMax, setPortfolioMax] = useState(false); // expand the Rack & Stack card to full screen (phone: see all columns)
  // a11y — Escape closes the full-screen overlays (parity with the dialog modals).
  useEffect(() => {
    if (!detailMax && !portfolioMax) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setDetailMax(false); setPortfolioMax(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailMax, portfolioMax]);
  // Responsive project detail (Slice 4): landscape = list left / detail right; portrait = list top /
  // detail bottom, revealed on tap so a phone user can actually reach the details.
  const [detailOpen, setDetailOpen] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLElement>(null);
  const selectProject = (id: string) => {
    setSelId(id);
    setDetailOpen(true);
    // Portrait/narrow: bring the detail pane into view (landscape already shows it side-by-side).
    if (typeof window !== "undefined" && window.matchMedia?.("(orientation: portrait)").matches) {
      requestAnimationFrame(() => scrollToEl(detailRef.current));
    }
  };
  // Roles / project membership (Slice 5). `me` = stable per-browser identity token (ownerKey → auth.uid later).
  // Self-asserted UX gating, not a security boundary (accounts/RLS pending). Persist localStorage + cloud "members".
  const [me] = useState(() => (typeof window !== "undefined" ? ownerKey() : "anon"));
  const [members, setMembers] = useState<MembershipMap>({});
  const MEMBERS_KEY = "innovation-members";
  useEffect(() => {
    try { const raw = localStorage.getItem(MEMBERS_KEY); if (raw) setMembers(JSON.parse(raw)); } catch { /* keep empty */ }
    void loadState<MembershipMap>("members").then((cloud) => { if (cloud && typeof cloud === "object") setMembers((cur) => (Object.keys(cur).length ? cur : cloud)); });
  }, []);
  const _memTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistMembers = (next: MembershipMap) => {
    setMembers(next);
    try { localStorage.setItem(MEMBERS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    if (_memTimer.current) clearTimeout(_memTimer.current);
    _memTimer.current = setTimeout(() => { void saveState("members", next); }, 800);
  };
  const myRole = roleOf(members, selId, me);
  // Node budgets (Allocation pass) — per-node financial-spend cap keyed `${level}:${code}` ($K). Overrides the
  // default R&D-envelope share; drives the per-node UPSIDE (unallocated) bucket. Persist local + cloud "node-budgets".
  const [nodeBudgets, setNodeBudgets] = useState<Record<string, number>>({});
  const NODE_BUDGETS_KEY = "innovation-node-budgets";
  useEffect(() => {
    try { const raw = localStorage.getItem(NODE_BUDGETS_KEY); if (raw) setNodeBudgets(JSON.parse(raw)); } catch { /* keep empty */ }
    void loadState<Record<string, number>>("node-budgets").then((cloud) => { if (cloud && typeof cloud === "object") setNodeBudgets((cur) => (Object.keys(cur).length ? cur : cloud)); });
  }, []);
  const _nbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setNodeBudget = (level: string, code: string, budgetK: number | null) => {
    setNodeBudgets((cur) => {
      const next = { ...cur };
      if (budgetK == null) delete next[`${level}:${code}`]; else next[`${level}:${code}`] = Math.max(0, Math.round(budgetK));
      try { localStorage.setItem(NODE_BUDGETS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      if (_nbTimer.current) clearTimeout(_nbTimer.current);
      _nbTimer.current = setTimeout(() => { void saveState("node-budgets", next); }, 800);
      return next;
    });
  };
  const budgetOverrideK = (level: HierKey, code: string): number | undefined => nodeBudgets[`${level}:${code}`];
  // Optimization cadence — legacy prioritization was quarterly; this tool enables monthly now,
  // weekly next. Drives how often the stack is re-optimized / snapshotted.
  const [cadence, setCadence] = useState<"Q" | "M" | "W" | "D">("M");
  // Master data (BU/SBU/Alpha…) for the edit + new-idea dropdowns; reloads ONLY when LEAVING Setup (not on
  // every tab switch — spurious localStorage re-read + full state replace on each navigation, Stability).
  const [setup, setSetup] = useState<BizSetup>(() => seedBizSetup(DEMO_PROJECTS));
  // Editable company brand shown in the header eyebrow. Admin renames it live via onCompanyRename (below);
  // seeded/hydrated from the master Business Setup (setup.company), default "Harmattan AI".
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const _prevViewForSetup = useRef<typeof view | null>(null);
  useEffect(() => {
    // Hydrate from the localStorage rung once on mount; thereafter re-read ONLY when LEAVING Setup — not on
    // every tab switch (the prior [view] dep re-read localStorage + full-replaced state on each navigation).
    if (_prevViewForSetup.current === null || (_prevViewForSetup.current === "setup" && view !== "setup")) { const s = loadBizSetup(); setSetup(s); setCompanyName(s.company); setScenarios(loadScenarios()); }
    _prevViewForSetup.current = view;
  }, [view]);
  // Remembered defaults — a returning VP lands on the VP lens, not a PM view (usability).
  useEffect(() => {
    const sp = lsGet("innovation-persona") as Persona | null;
    const sc = lsGet("innovation-cadence") as "Q" | "M" | "W" | "D" | null;
    if (sc) setCadence(sc);
    const pp = PERSONAS.find((x) => x.key === sp);
    if (pp) { setPersona(pp.key); setView(pp.view); if (pp.level) setStackLevel(pp.level); }
  }, []);
  useEffect(() => { lsSet("innovation-persona", persona); }, [persona]);
  useEffect(() => { lsSet("innovation-cadence", cadence); }, [cadence]);
  // Submit a new idea → a fresh Project seeded from the master data, opened for edit.
  // New-idea creation now runs through a modal that REQUIRES a master value proposition
  // (per-needs-segment value props recommended) — value prop is a must-have at creation (CRS-56).
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const createIdea = (fields: { name: string; valueProp: string; nba: string; segments: SegmentValueProp[]; drivers: ValueDriver[] }) => {
    const maxN = order.reduce((m, p) => Math.max(m, parseInt(p.id.replace(/\D/g, ""), 10) || 0), 0);
    const id = `PRJ-${String(maxN + 1).padStart(2, "0")}`;
    const np: Project = {
      id, name: fields.name.trim() || "New Idea", division: "New", manager: "you", category: "New Product",
      gate: "G1", confidence: 2, tech: "med", comm: "med", lob: setup.sbu[0]?.code ?? "SBU-1",
      nreK: 1000, fullRev10yM: 50, doNothing10yM: 0, firstRevenue: "2028-Q1",
      criticalPath: false, humanLoad: 0.4, ai: 0.4, si: 0.3, hi: 0.3, predictions: 0,
      bu: setup.bu[0]?.code, sbu: setup.sbu[0]?.code, pgroup: setup.pgroup[0]?.code,
      alpha: setup.alpha[0]?.code, initiative: loadPillars()[0]?.name ?? STRATEGIC_INITIATIVES[0],
      valueProp: fields.valueProp.trim(),
      nextBestAlternative: fields.nba.trim(),
      segmentValueProps: fields.segments.filter((s) => s.prop.trim() && s.segment.trim()),
      valueDrivers: fields.drivers.filter((d) => d.name.trim()),
      valuePropSource: "HI",
    };
    // Mint the AI rendition at submission (HI is done first) so an AI-improved version is available
    // via the HI⇄AI toggle to spark quality ideas — deterministic + offline (no provider call).
    np.valuePropAI = aiValuePropOf(np);
    setOrder((o) => [np, ...o]);
    selectProject(id); setView("portfolio"); setStackLevel("product");
    log("edit", np.name, `submitted new idea (G1) · HI value prop + NBA set · AI version minted${np.segmentValueProps?.length ? ` · ${np.segmentValueProps.length} segment(s)` : ""}`, "you");
    setNewIdeaOpen(false);
  };
  // ── REMOVE A PROJECT (operator: "user can add and remove projects at will") ──────────────────────────
  //
  // ⚠ ADD ALREADY WORKED; REMOVE DID NOT EXIST AT ALL. Grep-verified before writing a line, per R-CORE:
  // `deleteProject|removeProject|onDelete|onRemove` returned NOTHING across app/innovation/ and the lib.
  // So "at will" was half true — you could grow the portfolio and never shrink it.
  //
  // ONE WRITER, NOT A SECOND DOOR. This mutates the same `order` array `createIdea` appends to, so the
  // SAME debounced `saveState("projects", order)` effect persists it. No new persistence path, no second
  // Supabase call, nothing to keep in sync.
  const [undoRemoved, setUndoRemoved] = useState<{ p: Project; at: number } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const removeIdea = (id: string) => {
    const victim = order.find((x) => x.id === id);
    if (!victim) return;
    // ⚠ ORPHANS ARE LEFT INERT AND COUNTED, NOT SWEPT. bags[id] / versions[id] / members[id] are keyed by
    // project id. Deleting them would destroy slide cells, approved gate history and role assignments that
    // an undo could not restore — and `createIdea` mints ids from max+1, so an id is NEVER reused and the
    // records can never be inherited by a different project. The count is reported to the operator rather
    // than silently swept: their data, their call.
    const orphans = [
      Object.keys(readFieldBags()[id] ?? {}).length,
      (readVersions()[id] ?? []).length,
      (members[id] ?? []).length,
    ];
    setUndoRemoved({ p: victim, at: Date.now() });
    setOrder((o) => o.filter((x) => x.id !== id));
    // Selection safety: never leave the detail pane pointed at a dead id.
    if (selId === id) {
      const rest = order.filter((x) => x.id !== id);
      setSelId(rest[0]?.id ?? "");
      if (!rest.length) setDetailOpen(false);
    }
    log("edit", victim.name, `project REMOVED from the portfolio · ${orphans[0]} slide-field cells · ${orphans[1]} versions · ${orphans[2]} member(s) left keyed (ids are never reused)`, "you",
        { projectId: id, field: "project", from: victim.id, to: "removed" });
  };
  const undoRemove = () => {
    if (!undoRemoved) return;
    // Restore at the head, exactly where createIdea puts a project, and re-select it so the operator sees
    // it come back rather than having to hunt for it.
    setOrder((o) => (o.some((x) => x.id === undoRemoved.p.id) ? o : [undoRemoved.p, ...o]));
    selectProject(undoRemoved.p.id);
    log("edit", undoRemoved.p.name, "project removal UNDONE — record restored intact", "you", { projectId: undoRemoved.p.id });
    setUndoRemoved(null);
  };
  // Change + approval activity log (edits and gate approvals) — the audit summary.
  // Funding & approval AUDIT TRAIL (Slice 6) — append-only, timestamped, PERSISTED (localStorage + debounced
  // cloud "audit"), hydrated with union-merge-by-id so history survives reload and never clobbers cloud entries.
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const AUDIT_KEY = "innovation-audit";
  const _auditTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try { const raw = lsGet(AUDIT_KEY); if (raw) setActivity(JSON.parse(raw)); } catch { /* keep empty */ }
    void loadState<AuditEntry[]>("audit").then((cloud) => { if (Array.isArray(cloud)) setActivity((cur) => mergeAudit(cur, cloud)); });
  }, []);
  const pushAudit = (entries: AuditEntry[]) => {
    if (!entries.length) return;
    setActivity((a) => {
      const next = mergeAudit(entries, a);
      try { lsSet(AUDIT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      if (_auditTimer.current) clearTimeout(_auditTimer.current);
      _auditTimer.current = setTimeout(() => { void saveState("audit", next); }, 800);
      return next;
    });
  };
  const log = (kind: AuditKind, project: string, text: string, by: string, extra?: { projectId?: string; field?: string; from?: string; to?: string }) =>
    pushAudit([makeAuditEntry({ ts: new Date().toISOString(), kind, project, field: extra?.field ?? scrubText(text, 160), from: extra?.from, to: extra?.to, projectId: extra?.projectId, by })]);
  const applyEdit = (id: string, patch: Partial<Project>, changes: string[]) => {
    const proj = order.find((p) => p.id === id);
    setOrder((o) => o.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    changes.forEach((c) => log("edit", proj?.name ?? id, c, "you"));
  };
  // R&D budget scenario (operator) — Conservative $66M · Base $77M · Growth $88M sets the funding line.
  const [scenario, setScenario] = useState<BudgetScenario>("base");
  useEffect(() => { const s = lsGet("innovation-scenario") as BudgetScenario | null; if (s && BUDGET_SCENARIOS.some((x) => x.key === s)) setScenario(s); }, []);
  // FUNDED-ONLY IS THE RESTING STATE (operator, asked four times). ONE flag for every surface that can show
  // unfunded work — not a per-chart toggle. Default OFF on first load, then persisted like the other view
  // preferences. Unfunded projects were not merely visual clutter: they were inflating the per-gate spend a
  // board funds from, so this filters the ARITHMETIC as well as the chips.
  const [showUnfunded, setShowUnfunded] = useState(false);
  useEffect(() => { setShowUnfunded(lsGet("innovation-show-unfunded") === "1"); }, []);
  useEffect(() => { lsSet("innovation-show-unfunded", showUnfunded ? "1" : "0"); }, [showUnfunded]);
  useEffect(() => { lsSet("innovation-scenario", scenario); }, [scenario]);
  // R&D scenarios (name + $M) are admin-editable in Business Setup; re-read when leaving setup (below). avail = configured $M.
  const [scenarios, setScenarios] = useState<ScenarioCfg[]>(() => loadScenarios());
  const avail = (scenarios.find((s) => s.key === scenario)?.m ?? scenarioMOf(scenario)) * 1000;
  // Scope filter (P2) — BU · SBU · Alpha Group multi-select, available to ALL personas. `scoped` is the single
  // choke point between `order` and every consumer (rows/rack/drill/dashboards/budget/risk/gates). Drag still
  // operates on the full `order`; drag is disabled while a filter is active (see canDrag) to avoid index drift.
  const [hierFilter, setHierFilter] = useState<HierSel>({ bu: [], sbu: [], pgroup: [] });
  useEffect(() => { try { const raw = lsGet("innovation-hier-filter"); if (raw) setHierFilter(JSON.parse(raw)); } catch { /* keep empty */ } }, []);
  useEffect(() => { lsSet("innovation-hier-filter", JSON.stringify(hierFilter)); }, [hierFilter]);
  const filterActive = hierFilter.bu.length + hierFilter.sbu.length + hierFilter.pgroup.length > 0;
  const scoped = useMemo(() => scopeByHier(order, hierFilter), [order, hierFilter]);
  const { rows, lineIndex } = useMemo(() => stackWithBudget(scoped, avail), [scoped, avail]);
  const sel = order.find((p) => p.id === selId) ?? scoped[0] ?? order[0];

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
  const [budgetOpen, setBudgetOpen] = useState(false);
  // Working-stack row rendering: "table" (default) or "cards" (FLIR dog-tag kanban style).
  const [rowMode, setRowMode] = useState<"table" | "cards">("table");
  // Level-aware Rack & Stack: high-level rollup (BU/SBU/PG/Alpha) for decisions · Product #
  // = working project stack (drag/select → deep dive) · Material # = BOM. Metrics always
  // stay bound to the project (derived from r.p), so arrows/drag carry NPV/REV/NRE with it.
  const [stackLevel, setStackLevel] = useState<HierKey>("sbu");
  const [drill, setDrill] = useState<{ level: HierKey; value: string } | null>(null);
  // Rack & Stack decisions + access rights are by BU · SBU · Alpha Group (Alpha Code is not a
  // decision level — it's only a project attribute). Product # = working stack · Material # = BOM.
  const isGroupLevel = stackLevel === "bu" || stackLevel === "sbu" || stackLevel === "pgroup";
  const drilled = drill && stackLevel === "product" ? scoped.filter((p) => hierOf(p)[drill.level] === drill.value) : (filterActive ? scoped : null);
  // Breadcrumb ancestry (Company › BU › SBU › …) for the drilled node — clickable to navigate up.
  const HIER_ORDER: HierKey[] = ["bu", "sbu", "pgroup", "alpha"];
  const drillPath = drill && stackLevel === "product" ? (() => {
    const p0 = order.find((p) => hierOf(p)[drill.level] === drill.value);
    if (!p0) return [] as { level: HierKey; value: string }[];
    const h = hierOf(p0);
    return HIER_ORDER.slice(0, HIER_ORDER.indexOf(drill.level) + 1).map((lv) => ({ level: lv, value: h[lv] }));
  })() : [];

  const fundedRows = useMemo(() => rows.filter((r) => r.funded), [rows]);
  const portfolioNpv = useMemo(() => fundedRows.reduce((s, r) => s + npvM(r.p), 0), [fundedRows]);
  const fundedNre = useMemo(() => fundedRows.reduce((s, r) => s + r.p.nreK, 0), [fundedRows]);
  // Capture funding decisions (fund/defund) from ONE diff of the derived funded set vs a ref snapshot —
  // covers reorder + arrows + scenario + edits with no double-emit. Skips the mount-time first render.
  const _prevFunded = useRef<string[] | null>(null);
  useEffect(() => {
    const ids = fundedRows.map((r) => r.p.id);
    if (_prevFunded.current === null) { _prevFunded.current = ids; return; }
    const diffs = diffFundedSets(_prevFunded.current, ids, (id) => order.find((p) => p.id === id)?.name ?? id, new Date().toISOString(), me);
    _prevFunded.current = ids;
    pushAudit(diffs);
  }, [fundedRows]);
  // Capture R&D scenario changes (skip the mount-time fire).
  const _scenarioMounted = useRef(false);
  useEffect(() => {
    if (!_scenarioMounted.current) { _scenarioMounted.current = true; return; }
    log("scenario", "Portfolio", `scenario → ${scenario}`, me, { to: scenario });
  }, [scenario]);
  // Admin-configurable module name (formerly "Rack & Stack") — held in state so an admin rename
  // hot-swaps the tab/title/header instantly (no reload), seeded from the persisted value.
  const [stackName, setStackName] = useState<string>(() => loadStackName());

  // Supabase persistence (Slice 0) — the admin config bundle rounds-trips to the cloud so it survives a
  // cache-clear and reloads on the same owner elsewhere. localStorage is the fast/offline rung; Supabase
  // the durable rung. Best-effort + never blocks: no env / no table → local-only. On mount, hydrate cloud
  // → localStorage, then refresh the derived config state. Config keys are the tool's persisted admin data.
  const cloudHydrated = useRef(false);
  useEffect(() => {
    if (cloudHydrated.current) return;
    cloudHydrated.current = true;
    (async () => {
      // SSSES Efficiency (SoI-2525) — hydrate the whole namespace set in ONE round-trip (loadAllState) instead
      // of ~8 sequential per-name selects; identical fill-if-empty semantics, far lower mount latency.
      const CLOUD_NS: [string, string][] = [
        ["slides", SLIDE_KEY], ["signoff", SIGNOFF_KEY], ["ledger", LEDGER_KEY],
        ["gateconf", GATECONF_KEY], ["slide-hi", SLIDE_HI_KEY], ["slide-lens", SLIDE_LENS_KEY],
      ];
      const cloud = await loadAllState(["config", "projects", ...CLOUD_NS.map(([n]) => n)]);
      const bundle = cloud["config"] as Record<string, string> | undefined;
      if (bundle && typeof bundle === "object") {
        for (const [key, raw] of Object.entries(bundle)) {
          if (CONFIG_KEYS.includes(key) && typeof raw === "string") lsSet(key, raw);
        }
        const s = loadBizSetup(); setSetup(s); setCompanyName(s.company); setStackName(loadStackName());
      }
      // Per-project edits (new ideas, value drivers, gate/field edits, S10 financials) — durable +
      // cross-device. Cloud is the source of truth once the operator has saved anything; with no cloud we
      // fall back to the local mirror below, and only then to the seeds.
      const saved = cloud["projects"] as Project[] | undefined;
      if (Array.isArray(saved) && saved.length > 0 && saved.every((p) => p && typeof p.id === "string")) {
        setOrder(saved); setSelId(saved[0].id);
      }
      // De-risk (council · Odin/Krishna): restore the per-project slide/gate namespaces — seed localStorage ONLY
      // where the local key is absent/empty, so a fresher local edit is never clobbered (guarded fill-if-empty).
      for (const [name, lsKey] of CLOUD_NS) {
        const local = lsGet(lsKey);
        if (local && local !== "{}") continue; // keep fresher local edits
        const c = cloud[name] as Record<string, string> | undefined;
        if (c && typeof c === "object" && Object.keys(c).length > 0) lsSet(lsKey, JSON.stringify(c));
      }
      projectsHydrated.current = true;
    })();
  }, []);
  // Debounced best-effort push of the working project set (new ideas + edits + value drivers) to the cloud.
  const projectsHydrated = useRef(false);
  useEffect(() => {
    if (!projectsHydrated.current) return; // don't overwrite the cloud with seeds before hydration completes
    const id = setTimeout(() => {
      lsSet(PROJECTS_KEY, JSON.stringify(order));   // always durable locally, even when the cloud is offline
      void saveState("projects", order);
    }, 800);
    return () => clearTimeout(id);
  }, [order]);
  // Push the admin config bundle to the cloud whenever the operator leaves Business Setup (where edits
  // happen). Reads the persisted localStorage config keys and upserts them as one blob. Best-effort.
  const prevView = useRef(view);
  useEffect(() => {
    if (prevView.current === "setup" && view !== "setup") {
      const bundle: Record<string, string> = {};
      for (const key of CONFIG_KEYS) { const raw = lsGet(key); if (raw != null) bundle[key] = raw; }
      void saveState("config", bundle);
    }
    prevView.current = view;
  }, [view]);

  return (
    // Ease-of-viewing (operator): on phone/tablet (portrait + landscape) the whole PAGE scrolls so nothing —
    // including the bottom controls — is ever clipped by a fixed height; on desktop (lg+) keep the fixed
    // app-shell with an internal scroll rail. Mirrors the Architect-2525 / Security-2525 responsive pattern.
    <div data-orientation={vp.orientation} data-vpclass={vp.aspectClass} className="flex min-h-[100dvh] w-full flex-col bg-[#0b0f14] text-slate-100 lg:h-[100dvh] lg:overflow-hidden">
    {/* Consistent max-width band (phone → desktop) — every section shares these bounds; full-bleed bg behind. */}
    <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:min-h-0 lg:flex-1">
      {/* Header */}
      <header className="border-b border-slate-800 px-5 py-4 flex flex-col gap-3">
        {/* Row 1: eyebrow (left) lines up with Template + New Idea tabs (right) — operator alignment */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400">Vision • 2525 · {companyName}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTemplateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 px-2.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10">
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{t("innovation.header.template")}
            </button>
            <button onClick={() => setNewIdeaOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-2.5 py-1.5 text-xs font-semibold text-[#06202a] hover:bg-cyan-400">
              <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{t("innovation.header.newIdea")}
            </button>
            {/* ── REMOVE, BESIDE ADD — the operator asked to "add and remove projects at will", and until now
                only half of that existed. Deliberately NOT a bare ✕ on a row: a project carries slide cells,
                approved gate history, membership and audit, so it asks first and NAMES what goes. */}
            <button onClick={() => setConfirmRemove(selId)} disabled={!selId}
              title={sel ? `Remove ${sel.name} from the portfolio` : "Select a project first"}
              aria-label="Remove the selected project"
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />Remove
            </button>
          </div>
        </div>
        {/* UNDO — `saveState("projects", …)` is debounced, so an accidental delete is otherwise unrecoverable
            from the cloud copy. One step back, holding the whole record, restored intact. */}
        {undoRemoved && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200">
            <span>Removed <strong>{undoRemoved.p.name}</strong> ({undoRemoved.p.id}) from the portfolio.</span>
            <button onClick={undoRemove} className="rounded border border-amber-400/50 px-2 py-0.5 font-semibold text-amber-100 hover:bg-amber-500/20">Undo</button>
            <button onClick={() => setUndoRemoved(null)} className="text-amber-300/70 hover:text-amber-200">dismiss</button>
          </div>
        )}
        {/* Row 2: System of Innovation title (left) lines up with the R&D Scenario dropdown (right) — operator */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div>
            <h1 className="text-lg font-semibold leading-tight">{t("innovation.header.title")}</h1>
            <div className="text-[11px] text-slate-500">{stackName}</div>
          </div>
          <label className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500">{t("innovation.scenario.label")}
            <select value={scenario} onChange={(e) => setScenario(e.target.value as BudgetScenario)} title="R&D budget scenario (sets the funding line)"
              className="rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1 text-[11px] normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-500">
              {scenarios.map((s) => <option key={s.key} value={s.key}>{s.label} · ${s.m}M</option>)}
            </select>
          </label>
        </div>
        {/* KPI strip — full width; 2-up on phone, on landscape/desktop spread edge-to-edge with Portfolio NPV
            pushed all the way to the right (operator). */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-2.5 sm:flex sm:justify-between sm:gap-4">
          <Kpi label={t("innovation.kpi.rdAvailable")} value={k(avail)} />
          <Kpi label={t("innovation.kpi.fundedNre")} value={k(fundedNre)} tone={fundedNre > avail ? "bad" : "ok"} />
          {/* Upside R&D (eXeL nomenclature — was "dry powder") = unallocated R&D (available − funded NRE): the
              decision-speed lever, how much room remains to fund the next project across the line.
              Negative = overcommitted (bad). Label only — the math is untouched. */}
          <Kpi label={t("innovation.kpi.upside")} value={k(avail - fundedNre)} tone={avail - fundedNre < 0 ? "bad" : "good"} />
          <Kpi label={t("innovation.kpi.fundedProjects")} value={`${fundedRows.length}/${order.length}`} />
          <Kpi label={t("innovation.kpi.portfolioNpv")} value={usd(portfolioNpv)} tone="good" align="right" />
        </div>
      </header>

      {/* Persona lens + optimize cadence — ONE row of dropdowns (operator: "one row for View as and Optimize"). */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-[#0c1219] px-5 py-2">
        <label className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{t("innovation.persona.viewAs")}</span>
          <select value={persona} aria-label={t("innovation.persona.viewAs")}
            onChange={(e) => { const pp = PERSONAS.find((x) => x.key === (e.target.value as Persona)); if (!pp) return; setPersona(pp.key); setView(pp.view); if (pp.level) setStackLevel(pp.level); setDrill(null); }}
            className="rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500">
            {PERSONAS.map((pp) => <option key={pp.key} value={pp.key}>{pp.glyph} {t(`innovation.persona.${pp.key}.label`)}</option>)}
          </select>
        </label>
        <label className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{t("innovation.cadence.optimize")}</span>
          <select value={cadence} aria-label={t("innovation.cadence.optimize")}
            onChange={(e) => setCadence(e.target.value as "Q" | "M" | "W" | "D")}
            className="rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500">
            {(["Q", "M", "W", "D"] as const).map((c) => <option key={c} value={c}>{t(`innovation.cadence.${c}`)}</option>)}
          </select>
        </label>
      </div>
      <p className="border-b border-slate-800 bg-[#0c1219] px-5 pb-2 text-[11px] text-slate-400">
        <span className="hidden sm:inline">{t(`innovation.persona.${persona}.lens`)} · </span>
        Re-optimizing <b className="text-cyan-300">{cadence === "Q" ? "quarterly" : cadence === "M" ? "monthly" : cadence === "W" ? "weekly" : "daily"}</b> · time is money — cost shown in <b className="text-cyan-300">$/{CADENCE_UNIT[cadence].short}</b> on each project · AI + HI now, SI polling next.
      </p>

      {/* View tabs — Portfolio (Rack/Stack/Risk/Growth) ⟷ Dashboards (ROI Visuals) */}
      <nav className="flex gap-1 border-b border-slate-800 px-5 overflow-x-auto">
        {([["portfolio", stackName], ["gates", t("innovation.tab.gates")], ["dashboards", t("innovation.tab.dashboards")], ["setup", t("innovation.tab.setup")]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${view === v ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {v === "setup"
              ? <span className="inline-flex items-center gap-1.5"><Settings className="h-4 w-4 shrink-0" aria-hidden="true" />{label}</span>
              : label}
          </button>
        ))}
      </nav>

      {/* Scroll rail — the only scrolling region; header/persona/tabs above stay fixed (app-shell) */}
      <div className="overflow-x-hidden lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      {view === "portfolio" && (<>
      {/* Portfolio Growth Model — the signature financial projection. Baseline financials live at the BU / SBU /
          Alpha Group roll-up (Business Setup), so it shows ON TOP whenever a roll-up level is selected (Manager /
          SBU Director / VP) — not at Alpha Code / Product # / Material #, where there is no baseline to age against. */}
      {isGroupLevel && (
        <div className="px-5 pt-4 pb-1">
          <GrowthModelChart funded={fundedRows.map((r) => r.p)} cadence={cadence} hierFilter={hierFilter} allProjects={order} onScope={setHierFilter} />
        </div>
      )}
      {/* Orientation-aware split: landscape = list LEFT / detail RIGHT · portrait = list TOP / detail BOTTOM
          (revealed on tap so phone users can reach the details). */}
      <div className="flex flex-col gap-4 p-5 landscape:flex-row landscape:items-start">
        {/* STACK table — level-aware Rack & Stack. Maximizes to full screen so a phone can see every column. */}
        <section ref={stackRef} className={portfolioMax
          ? "fixed inset-0 z-[60] flex flex-col border-0 rounded-none bg-[#0e141b] overflow-hidden"
          : "w-full rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden landscape:flex-1 landscape:min-w-0"}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                {stackName} · {stackLevel === "product" ? "drag priority across the funding line" : isGroupLevel ? "roll-up for decisions" : "bill of materials"}
              </h2>
              <button onClick={() => setPortfolioMax((v) => !v)}
                aria-label={portfolioMax ? t("innovation.max.restore") : t("innovation.max.expand")}
                title={portfolioMax ? t("innovation.max.restore") : t("innovation.max.expand")}
                className="rounded-md border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800">{portfolioMax ? "⤡" : "⤢"}</button>
              <button onClick={() => setBudgetOpen(true)} title="Budget by SBU / Alpha Group — incl. unfunded"
                className="rounded-md border border-emerald-500/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/10">{t("innovation.stack.budget")}</button>
              {stackLevel === "product" && (
                <div className="flex overflow-hidden rounded-md border border-slate-700 text-[11px]" title="Working-stack row layout">
                  {([["table", "▤ Table"], ["cards", "▦ Cards"]] as const).map(([m, lbl]) => (
                    <button key={m} onClick={() => setRowMode(m)}
                      className={`px-2 py-0.5 ${rowMode === m ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Scope filter — BU · SBU · Alpha Group multi-select (one or many), for ALL personas */}
              <ScopeFilter projects={order} sel={hierFilter} onChange={setHierFilter} />
              {/* Top level toggle: BU · SBU · Product Group · Alpha Group · Product # · Material # */}
              <div className="flex flex-wrap overflow-hidden rounded-md border border-slate-700 text-[11px]">
                {([["bu", "BU"], ["sbu", "SBU"], ["pgroup", "Alpha Grp"], ["product", "Product #"], ["material", "Material #"]] as const).map(([lv, lbl]) => (
                  <button key={lv} onClick={() => { setStackLevel(lv); setDrill(null); }}
                    className={`px-2 py-1 ${stackLevel === lv ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
                ))}
              </div>
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

          <div className={portfolioMax ? "flex-1 min-h-0 overflow-auto" : "overflow-x-auto"}>
            {isGroupLevel && (() => {
              // FUNDED / UNFUNDED split by the PROJECT-LEVEL funded set (fundedRows — the SAME source the Budget
              // modal reads), NOT a group-cumulative funding line. So Σ NRE + project count ABOVE the line equal
              // the Budget modal EXACTLY (operator: must be accurate in both) for every persona. A group that
              // straddles the line appears in BOTH sections, each side carrying only its own projects.
              const fundedIds = new Set(fundedRows.map((r) => r.p.id));
              const fundedProjects = scoped.filter((p) => fundedIds.has(p.id));
              const unfundedProjects = scoped.filter((p) => !fundedIds.has(p.id));
              const fundedNreK = fundedProjects.reduce((s, p) => s + p.nreK, 0);
              const unfundedNreK = unfundedProjects.reduce((s, p) => s + p.nreK, 0);
              // Row → BU (for the Trinity color bar). Same color code as the Admin panel (DS cyan · MS amber · AP
              // violet): the grouping is shown by the left color bar, NOT by parent rollup/subtotal rows (operator:
              // "remove sub total and totals … subtotal and rollups seems to be confusing HI and AI").
              const buOfCode: Record<string, string> = {};
              for (const p of scoped) buOfCode[hierOf(p)[stackLevel]] = hierOf(p).bu;
              type GRow = { key: string; nreK: number; weightedRevM: number; incRevM: number; npvM: number; count: number };
              let rowNo = 0, cum = 0;
              const dataRow = (g: GRow, side: "funded" | "unfunded") => {
                rowNo += 1; cum += g.nreK;
                return (
                  <tr key={`${side}-${g.key}`} onClick={() => { setDrill({ level: stackLevel, value: g.key }); setStackLevel("product"); }}
                    className={`cursor-pointer border-b border-slate-900 hover:bg-cyan-500/10 hover:ring-1 hover:ring-inset hover:ring-cyan-500/30 ${side === "funded" ? "" : "opacity-70"}`} title="Drill to projects">
                    <td className="px-2 py-2 tabular-nums text-slate-400">{rowNo}</td>
                    <td className="px-2 py-2 font-medium" style={{ borderLeft: `3px solid ${BU_COLOR[buOfCode[g.key]] ?? "#334155"}` }}>{g.key}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-slate-400">{g.count}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-300">{k(g.nreK)}</td>
                    <td className="px-2 py-2 text-right tabular-nums"><PwtCell weighted={g.weightedRevM} incremental={g.incRevM} /></td>
                    <td className={`px-2 py-2 text-right tabular-nums font-semibold ${g.npvM >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{usd(g.npvM)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-400">{k(cum)}</td>
                  </tr>
                );
              };
              // Flat rows (NPV desc) per side — NO parent rollup/subtotal rows; the BU color bar carries the grouping.
              const section = (projects: Project[], side: "funded" | "unfunded") =>
                rackByLevel(projects, stackLevel).map((g) => dataRow(g, side));
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
                    {/* Funded rows above the line, unfunded below — one reusable divider carries the symmetric
                        ▲ Above · Funded / ▼ Below · Not funded labels (counts + Σ NRE match the Budget modal). */}
                    {section(fundedProjects, "funded")}
                    <FundingDivider availK={avail} colSpan={7}
                      above={{ count: fundedProjects.length, nreK: fundedNreK }}
                      below={{ count: unfundedProjects.length, nreK: unfundedNreK }} />
                    {section(unfundedProjects, "unfunded")}
                  </tbody>
                </table>
              );
            })()}

            {stackLevel === "product" && (() => {
              const src = drilled ?? order;
              const st = drilled ? stackWithBudget(src, avail) : { rows, lineIndex };
              const canDrag = !drilled && !filterActive;
              // CARDS mode — FLIR dog-tag kanban rows (SBU left · name top · launch right · highlights),
              // with the same drag + arrows + funding line as the table.
              if (rowMode === "cards") {
                return (
                  <div className="space-y-2 p-3">
                    {st.rows.map((r, i) => {
                      const p = r.p, last = i === st.rows.length - 1;
                      return (
                        <React.Fragment key={p.id}>
                          {i === st.lineIndex && <FundingDivider availK={avail} />}
                          <div data-stack-row={i} onClick={() => selectProject(p.id)}
                            className={`flex items-center gap-2 rounded-lg ${dragIdx === i ? "opacity-40" : ""} ${!r.funded ? "opacity-70" : ""} ${overIdx === i && dragIdx !== i ? "ring-1 ring-cyan-400" : selId === p.id ? "ring-1 ring-cyan-500/60" : ""}`}>
                            {canDrag && <span onPointerDown={startRowDrag(i)} style={{ touchAction: "none" }} title="Drag to reprioritize" className="cursor-grab px-0.5 text-slate-600 active:cursor-grabbing">⠿</span>}
                            <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-slate-500">{i + 1}</span>
                            <div className="min-w-0 flex-1"><DogTag p={p} /></div>
                            {canDrag && (
                              <span className="flex flex-col">
                                <button onClick={(e) => { e.stopPropagation(); move(i, -1); }} disabled={i === 0} title="Move up" className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-20">▲</button>
                                <button onClick={(e) => { e.stopPropagation(); move(i, 1); }} disabled={last} title="Move down" className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-20">▼</button>
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              }
              // W-12 · THE RACK HEADER FREEZES ON SCROLL (operator: "For portfolio prioritization, freeze
              // headers so if I scroll down, I can still see headers"). Scrolling past row ~6 left the
              // operator reading four unlabelled money columns — NRE, P-wt Rev, NPV and Cum all render
              // "$NN.NM" and are indistinguishable without their header.
              //
              // ⚠ THE STICKY GOES ON EVERY `th`, NEVER ON THE `thead` — the E2 finding, already paid for
              // once in the S10 editor. Tailwind's preflight sets `border-collapse: collapse`, and a
              // collapsed table gives `thead`/`tr` no box to position against, so the rule is silently
              // ignored and the header scrolls away exactly as before. Each `th` carries its own background
              // too, or the rows scroll through it.
              //
              // ⚠ AND THESE ARE `//` COMMENTS, NOT `{/* */}` — the JSX form cannot be the FIRST thing after
              // `return (`, because a JSX comment is only valid INSIDE an element, never as the expression
              // that opens one. The first draft put it there and produced 14 type errors while the lock
              // suite passed 3025/3025, which is the third time this session a green suite has certified a
              // file that does not compile. Locks read source as text; only tsc sees validity.
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                      {(() => { const th = "sticky top-0 z-20 bg-[#0e141b]"; return (<>
                      <th className={`w-6 ${th}`}></th>
                      <th className={`px-2 py-2 text-left ${th}`}>#</th>
                      <th className={`px-2 py-2 text-left ${th}`}>Project #</th>
                      <th className={`px-2 py-2 text-center ${th}`}>Gate</th>
                      <th className={`px-2 py-2 text-center ${th}`}>Conf</th>
                      <th className={`px-2 py-2 text-right ${th}`}>NRE</th>
                      <th className={`px-2 py-2 text-right ${th}`}>P-wt Rev</th>
                      <th className={`px-2 py-2 text-right ${th}`}>NPV</th>
                      <th className={`px-2 py-2 text-right ${th}`}>Cum</th>
                      <th className={`px-2 py-2 ${th}`}></th>
                      </>); })()}
                    </tr>
                  </thead>
                  <tbody>
                    {st.rows.map((r, i) => (
                      <RowFrag key={r.p.id} r={r} i={i} showLine={i === st.lineIndex} selId={selId}
                        onSelect={selectProject} onUp={canDrag ? () => move(i, -1) : undefined} onDown={canDrag ? () => move(i, 1) : undefined}
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
                        <tr onClick={() => toggleBom(p.id)} title={open ? "Collapse BOM build" : "Expand BOM build"} className={`cursor-pointer border-b border-slate-800 bg-slate-900/40 ${open ? "ring-1 ring-inset ring-cyan-500/30" : ""}`}>
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
            {isGroupLevel ? "Decision roll-up · click a row to drill to its projects" : stackLevel === "product" ? "Working stack · drag ⠿ or ▲▼ to reprioritize — NPV/REV/NRE follow the project · click → financials + Stage-Gate deep dive" : "BOM · components & assemblies · tap a Product # to expand its material roll-up in place"}
          </div>
        </section>

        {/* Selected project detail — portrait: hidden until a project is tapped (top/bottom split); landscape: always shown right */}
        {/* UNMOUNT the inline rail while the ⤢ overlay is open. `landscape:block` kept it mounted underneath,
            so in landscape — the operator's default on PC and phone — ⤢ produced TWO live RiskRegister forms
            inside one aria-modal dialog, each with its own draft state, identical heading and placeholder.
            A half-typed risk in the hidden copy was silently abandoned. (Krishna #5) */}
        <section ref={detailRef} className={`${detailMax ? "hidden" : detailOpen ? "block" : "hidden"} w-full space-y-4 ${detailMax ? "" : "landscape:block"} landscape:w-[42%] landscape:shrink-0`}>
          <button onClick={() => { setDetailOpen(false); scrollToEl(stackRef.current); }}
            className="flex w-full items-center gap-1 rounded-lg border border-slate-700 bg-[#0e141b] px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-slate-800 landscape:hidden">
            ‹ {t("innovation.detail.back")}
          </button>
          <ProjectDetail p={sel} risks={risks} setRisks={setRisks} setup={setup} maximized={false} onToggleMax={() => setDetailMax(true)}
            onEdit={(patch, changes) => applyEdit(sel.id, patch, changes)}
            onApprove={(kind, by) => log(kind, sel.name, kind === "approve" ? `${GATE_STAGE[sel.gate]} (${sel.gate}) approved` : `${sel.gate} — changes requested`, by)} />
          <TimeEngine p={sel} />
          <GateCube p={sel} onEditSource={(patch, changes) => applyEdit(sel.id, patch, changes)} />
          <Differentiators p={sel} cadence={cadence} />
          <TeamRoles projectId={sel.id} members={members} me={me} onChange={persistMembers} />
        </section>
      </div>


      {/* Funding & Approval history — the append-only, timestamped, PERSISTED audit trail (Slice 6) */}
      <div className="px-5 pb-4">
        <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{t("innovation.audit.title")}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">{(() => { const s = summarizeAudit(activity); return `${(s.fund ?? 0) + (s.defund ?? 0)} funding · ${s.approve ?? 0} approvals · ${s.edit ?? 0} edits · ${s.budget ?? 0} budget`; })()}</span>
              <button onClick={() => setHistoryOpen(true)} className="rounded border border-cyan-500/40 px-2 py-0.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/10">{t("innovation.audit.open")}</button>
            </div>
          </div>
          {activity.length === 0 ? (
            <p className="mt-2 text-[11px] text-slate-500">{t("innovation.audit.empty")}</p>
          ) : (
            <ul className="mt-2 max-h-52 overflow-y-auto divide-y divide-slate-900">
              {activity.slice(0, 40).map((a) => (<AuditRow key={a.id} a={a} />))}
            </ul>
          )}
        </div>
      </div>
      </>)}

      {view === "gates" && (
        <div className="p-5">
          <GateRequirementsView projects={scoped} allProjects={order} hierFilter={hierFilter} onScope={setHierFilter} sel={sel} onSelect={setSelId} onEditSource={(patch, changes) => applyEdit(sel.id, patch, changes)} />
        </div>
      )}

      {view === "dashboards" && (
        <div className="p-5">
          <Dashboards projects={scoped} funded={fundedRows.map((r) => r.p)} availK={avail} budgetOverrideK={budgetOverrideK} cadence={cadence} showUnfunded={showUnfunded} onShowUnfunded={setShowUnfunded} onSelect={(id) => { selectProject(id); setView("portfolio"); }}
            allProjects={order} hierFilter={hierFilter} onScope={setHierFilter} />
        </div>
      )}

      {view === "setup" && (
        <div className="p-5">
          <BusinessSetup onRename={setStackName} onCompanyRename={setCompanyName} onClose={() => setView("portfolio")} />
        </div>
      )}
      </div>{/* end scroll rail */}

      {/* New-idea modal — value proposition is a must-have at creation */}
      {newIdeaOpen && <NewIdeaModal onCreate={createIdea} onClose={() => setNewIdeaOpen(false)} />}
      {/* ── CONFIRM REMOVE — names the project AND what stays behind, so the operator decides with the
          facts. Orphan records are LEFT INERT deliberately: deleting them would destroy slide cells and
          approved gate history that Undo could not restore, and ids are never reused (createIdea mints
          max+1), so nothing can inherit them. */}
      {confirmRemove && (() => {
        const v = order.find((x) => x.id === confirmRemove);
        if (!v) return null;
        const cells = Object.keys(readFieldBags()[v.id] ?? {}).length;
        const vers = (readVersions()[v.id] ?? []).length;
        const mem = (members[v.id] ?? []).length;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Confirm project removal"
               onClick={() => setConfirmRemove(null)}>
            <div className="w-full max-w-md rounded-lg border border-rose-500/40 bg-[#0e141b] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-sm font-semibold text-rose-300">Remove this project?</h2>
              <p className="mt-2 text-[13px] text-slate-200"><strong>{v.name}</strong> <span className="text-slate-400">({v.id})</span></p>
              <p className="mt-1 text-[12px] text-slate-400">
                {GATE_STAGE[v.gate]} ({v.gate}) · R&amp;D {k(v.nreK)} · it leaves the Rack &amp; Stack and every rollup immediately.
              </p>
              <ul className="mt-3 space-y-0.5 text-[11px] text-slate-400">
                <li>· {cells} slide-field cell{cells === 1 ? "" : "s"}, {vers} version{vers === 1 ? "" : "s"} and {mem} member record{mem === 1 ? "" : "s"} stay keyed to {v.id}</li>
                <li>· project ids are never reused, so nothing can inherit them</li>
                <li>· one-step <strong>Undo</strong> appears immediately after</li>
              </ul>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setConfirmRemove(null)}
                  className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Cancel</button>
                <button onClick={() => { removeIdea(v.id); setConfirmRemove(null); }}
                  className="rounded bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400">Remove project</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* R-Core Project Template — in-app pop-out (was a new-tab link); embeds the standalone template doc */}
      {templateOpen && <TemplateModal onClose={() => setTemplateOpen(false)} />}

      {/* Funding & Approval History pop-out (Slice 6) — the full append-only, timestamped audit trail */}
      {historyOpen && <HistoryModal activity={activity} onClose={() => setHistoryOpen(false)} />}

      {/* Budget popup — per-SBU / per-Alpha-Group budget incl. unfunded projects */}
      {budgetOpen && <BudgetModal projects={scoped} fundedIds={new Set(fundedRows.map((r) => r.p.id))} availK={avail} budgetOverrideK={budgetOverrideK} onSetBudget={setNodeBudget} canEditBudget={can(myRole, "editBudget")} cadence={cadence} onClose={() => setBudgetOpen(false)} />}

      {/* Full-screen deep-dive overlay (⤢ maximize) */}
      {detailMax && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6" onClick={() => setDetailMax(false)} role="dialog" aria-modal="true" aria-label={sel?.name ?? "Project detail"}>
          <div className="mx-auto max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <ProjectDetail p={sel} risks={risks} setRisks={setRisks} setup={setup} maximized onToggleMax={() => setDetailMax(false)}
              onEdit={(patch, changes) => applyEdit(sel.id, patch, changes)}
              onApprove={(kind, by) => log(kind, sel.name, kind === "approve" ? `${GATE_STAGE[sel.gate]} (${sel.gate}) approved` : `${sel.gate} — changes requested`, by)} />
          </div>
        </div>
      )}

      <footer className="px-5 pb-8 text-[11px] text-slate-500">
        Demo portfolio · financials are derived from the inputs, never hand-entered. Reprioritize the stack, gate projects, and poll feedback to de-risk the roadmap.
      </footer>
    </div>
    </div>
  );
}

function Kpi({ label, value, tone, align }: { label: string; value: string; tone?: "good" | "ok" | "bad"; align?: "right" }) {
  const c = tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-rose-400" : "text-slate-100";
  return (
    <div className={align === "right" ? "sm:text-right" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

// R-Core · ONE reusable funding-line divider (operator: "always max reuse"). Symmetric ▲ Above · Funded (up)
// and ▼ Below · Not funded (down) around the amber "Funding line · $X R&D" rule. Pass `above`/`below`
// {count,nreK} to show the labeled sides; omit for a bare rule (drilled + product stacks). `colSpan` wraps it
// as a <tr> for table bodies; omit for a plain flex row (card/product lists). Single source → identical arrows
// + Above/Below wording on every surface (group rack · drilled rack · product stack · Budget modal).
function FundingDivider({ availK, above, below, colSpan }: { availK: number; above?: { count: number; nreK: number }; below?: { count: number; nreK: number }; colSpan?: number }) {
  {/* H3 — stacked layout so side labels never run off the right edge: ABOVE label left-justified over the rule,
      the amber funding rule centered, BELOW label right-justified under the rule (operator IMG_8227/8228). */}
  const line = (
    <div className="text-[10px] font-mono uppercase tracking-wider">
      {above && <div className="text-left text-emerald-400">▲ Above · Funded {above.count} proj · {k(above.nreK)}</div>}
      <div className="flex items-center gap-2 text-amber-400"><span className="h-px flex-1 bg-amber-500/60" />Funding line · {k(availK)} R&amp;D<span className="h-px flex-1 bg-amber-500/60" /></div>
      {below && <div className="text-right text-rose-400">▼ Below · Not funded {below.count} proj · {k(below.nreK)} NRE</div>}
    </div>
  );
  return colSpan != null ? <tr><td colSpan={colSpan} className="px-2 py-1">{line}</td></tr> : <div className="py-0.5">{line}</div>;
}

function RowFrag({ r, i, showLine, selId, onSelect, onUp, onDown, last, avail, dragging, over, onGripDown, canDrag = true }: {
  r: ReturnType<typeof stackWithBudget>["rows"][number]; i: number; showLine: boolean;
  selId: string; onSelect: (id: string) => void; onUp?: () => void; onDown?: () => void; last: boolean; avail: number;
  dragging: boolean; over?: boolean; onGripDown?: (e: React.PointerEvent) => void; canDrag?: boolean;
}) {
  const { p, cumK, funded } = r;
  return (
    <>
      {showLine && <FundingDivider availK={avail} colSpan={10} />}
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
        {/* G3 · filled bullets take the score's tone (1-2 red · 3-4 sunset · 5 green) from `confidenceTone`,
            the SAME function the S10 panel uses. Unfilled stay slate. */}
        <td className="px-2 py-2 text-center tabular-nums" title={`Model confidence ${confidenceOf(p)}/5 — derived from ${RISK_LABEL[p.tech]} technical / ${RISK_LABEL[p.comm]} commercial risk`}><span style={{ color: confidenceTone(confidenceOf(p)) }}>{"●".repeat(confidenceOf(p))}</span><span className="text-slate-700">{"●".repeat(5 - confidenceOf(p))}</span></td>
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

// Per-section banner accent (AMTS deck parity) — a colored header bar + icon per slide field, keyed by the
// field's role (value / concern / flow / money / governance / default). Pure + deterministic.
// ⚠ D8 · THESE ARE RINGS, NOT BORDERS, AND THAT IS A LAYOUT DECISION NOT A STYLE ONE. Measured on S8 at
// 1440x810: the two list panels reported clientHeight 123 against scrollHeight 125 — overflowing by exactly
// 2px, at both viewports, which is exactly one border top plus one border bottom. The grid sizes an auto row
// to the item's CONTENT (125px), then `box-sizing: border-box` spends 2px of that row on the border and
// leaves a 123px content box. The content never fit by construction. A ring is painted with box-shadow, so
// it occupies the same pixels and costs NOTHING in layout — the 2px goes back to the content. The field was
// already named `ring`; it is now actually one. Gaining space can only reduce overflow, never create it.
function sectionAccent(code: string, f: SlideField): { icon: string; bar: string; ring: string } {
  const id = f.id.toLowerCase(), name = f.name.toLowerCase();
  const has = (re: RegExp) => re.test(id) || re.test(name);
  if (code === "CSRA" || has(/approv|sign|review|change|member|role/))
    return { icon: "✔", bar: "bg-indigo-500/20 text-indigo-100", ring: "ring-indigo-500/30" };
  if (has(/valueprop|vprop|value prop|desc|oneline|overview|ask|benefit/))
    return { icon: "◆", bar: "bg-cyan-500/20 text-cyan-100", ring: "ring-cyan-500/30" };
  if (has(/risk|problem|concern|statusquo|counter|toprisk|dep|nba/))
    return { icon: "▲", bar: "bg-rose-500/20 text-rose-100", ring: "ring-rose-500/30" };
  if (has(/conops|roadmap|workflow|persona|stor|flow|future|outcome|why|voc|experiment|l90|l60|l30|l0|e120|e90|e60|e0|launch|prio/))
    return { icon: "→", bar: "bg-violet-500/20 text-violet-100", ring: "ring-violet-500/30" };
  if (f.kind === "chart" || f.kind === "metrics" || has(/profile|rev|margin|financ|spend|scenario|saydo|capture|fte|fincomment|plc|bom|accel|conf|resource/))
    return { icon: "$", bar: "bg-emerald-500/15 text-emerald-100", ring: "ring-emerald-500/25" };
  return { icon: "▪", bar: "bg-sky-500/15 text-sky-100", ring: "ring-slate-700" };
}

// A field value is a renderable image when it's an uploaded data URI OR a pasted/BYOK http(s) image URL.
const isImageSrc = (s: unknown): s is string => typeof s === "string" && (s.startsWith("data:image") || /^https?:\/\/\S+/i.test(s));

// ChartFrame — wraps any chart/financial so it can expand to full-screen and minimize back to slide view
// (operator). Reuses the deck's `fixed inset-0` maximize idiom; ⤢/⤡ toggle + Esc-to-restore (capture-phase so
// it closes the chart before the modal's own Esc). Renders inline until maximized.
// Published by ChartFrame so a child can render differently collapsed vs maximized. Same idiom as
// PanelTitleCtx — the frame already owns the expand state, it just never told anyone.
const ChartMaxCtx = React.createContext(false);

function ChartFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  const [max, setMax] = useState(false);
  useEffect(() => {
    if (!max) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMax(false); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [max]);
  // X-1 · THE FOURTH CONSTRAINT, found by reading the chain AFTER shipping — the commit says so plainly.
  // The panel row, the field wrapper and the SVG were all made growable, and the chart STILL could not grow,
  // because ChartFrame sat between them as a bare `relative` div with AUTO height. `h-full` needs a DEFINITE
  // parent height; one auto-height ancestor anywhere in the chain silently resolves it to nothing. Both of
  // ChartFrame's boxes now carry the height through when not maximised. The maximised branch already had one.
  return (
    <div className={max ? "fixed inset-0 z-[70] flex flex-col overflow-auto bg-[#0b0f14] p-[clamp(12px,3vw,32px)]" : "relative flex min-h-0 flex-1 flex-col"}>
      <button onClick={() => setMax((v) => !v)} aria-label={max ? "Restore" : "Full screen"} title={max ? "Restore" : "Full screen"}
        className="absolute right-1 top-1 z-[2] rounded border border-slate-700 bg-[#0b0f14]/85 px-1.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800">{max ? "⤡" : "⤢"}</button>
      {max && label && <div className="mb-2 shrink-0 pr-8 text-[clamp(13px,1.6vw,18px)] font-semibold text-slate-100">{label}</div>}
      {/* Top-aligned (not justify-center) so a tall table/chart scrolls from the top instead of clipping — the
          outer container is overflow-auto, so both axes scroll and every number is reachable + readable. */}
      <div className={max ? "flex min-h-0 w-full flex-1 flex-col overflow-auto" : "flex min-h-0 flex-1 flex-col"}><ChartMaxCtx.Provider value={max}>{children}</ChartMaxCtx.Provider></div>
    </div>
  );
}

// MoT gate timeline — G1..G7 stops with estimated dates. Anchored on the program start (p.startDate or the
// default that lands Launch on first-revenue); when the start changes, every gate date slides. Done gates fill
// emerald, the current gate pulses cyan, future gates stay slate. Horizontal-scrolls on phone, full width on PC.
function GateTimeline({ p }: { p: Project }) {
  const stops = gateScheduleOf(p);
  const fmt = (iso: string) => { const d = new Date(iso + "T00:00:00Z"); return `${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`; };
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[600px] items-start">
        {stops.map((s, i) => (
          <div key={s.gate} className="relative flex flex-1 flex-col items-center px-1 text-center">
            {i < stops.length - 1 && <div className={`absolute left-1/2 top-[7px] -z-0 h-0.5 w-full ${s.done ? "bg-emerald-500/50" : "bg-slate-700"}`} />}
            <div className={`relative z-[1] h-3.5 w-3.5 rounded-full border-2 ${s.current ? "border-cyan-300 bg-cyan-400 ring-2 ring-cyan-400/30" : s.done ? "border-emerald-500 bg-emerald-500" : "border-slate-600 bg-[#0b0f14]"}`} />
            <div className={`mt-1 font-mono text-[11px] font-semibold ${s.current ? "text-cyan-300" : s.done ? "text-emerald-300" : "text-slate-400"}`}>{s.gate}</div>
            <div className="text-[9px] leading-tight text-slate-400">{s.stage}</div>
            <div className="mt-0.5 text-[9px] tabular-nums text-slate-500">{fmt(s.startISO)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// CONOPS wireframe — a GENERATIVE schematic drawn procedurally from the step text (operator: "wireframe
// generative, not chatgpt images"). Deterministic: a string-seeded PRNG places system boxes, actor nodes and
// arrowed connectors inside a system envelope — same step text → same wireframe. Pure SVG, no external assets.
function ConopsWireframe({ seed }: { seed: string }) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 16777619); }
  const rand = () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const W = 160, H = 90, P = 8;
  const n = 3 + Math.floor(rand() * 3); // 3–5 nodes
  const cols = n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols);
  const cw = (W - 2 * P) / cols, ch = (H - 2 * P) / rows;
  type Node = { x: number; y: number; w: number; h: number; shape: "box" | "node" | "sat" };
  const nodes: Node[] = Array.from({ length: n }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const jx = (rand() - 0.5) * cw * 0.18, jy = (rand() - 0.5) * ch * 0.18;
    const bw = cw * (0.5 + rand() * 0.18), bh = ch * (0.42 + rand() * 0.18);
    const cx = P + c * cw + (cw - bw) / 2 + jx, cy = P + r * ch + (ch - bh) / 2 + jy;
    const shape: Node["shape"] = i === 0 ? "sat" : rand() > 0.55 ? "node" : "box";
    return { x: cx, y: cy, w: bw, h: bh, shape };
  });
  const cxy = (nd: Node) => [nd.x + nd.w / 2, nd.y + nd.h / 2] as const;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Generative CONOPS wireframe">
      <defs><marker id={`ar-${Math.floor(h % 100000)}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill="#38bdf8" opacity="0.7" /></marker></defs>
      <rect x={3} y={3} width={W - 6} height={H - 6} rx={4} fill="none" stroke="rgba(56,189,248,.18)" strokeWidth="0.8" strokeDasharray="3 3" />
      {nodes.slice(1).map((nd, i) => { const [x1, y1] = cxy(nodes[i]); const [x2, y2] = cxy(nd); return (
        <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="0.8" opacity="0.5" markerEnd={`url(#ar-${Math.floor(h % 100000)})`} />
      ); })}
      {nodes.map((nd, i) => {
        const [cx, cy] = cxy(nd);
        if (nd.shape === "sat") return <g key={i}><circle cx={cx} cy={cy} r={Math.min(nd.w, nd.h) / 2.6} fill="rgba(52,211,153,.10)" stroke="#34d399" strokeWidth="0.9" /><line x1={cx - nd.w / 2} y1={cy} x2={cx - nd.w / 2 - 4} y2={cy - 3} stroke="#34d399" strokeWidth="0.8" /><line x1={cx + nd.w / 2} y1={cy} x2={cx + nd.w / 2 + 4} y2={cy - 3} stroke="#34d399" strokeWidth="0.8" /></g>;
        if (nd.shape === "node") return <circle key={i} cx={cx} cy={cy} r={Math.min(nd.w, nd.h) / 2.4} fill="rgba(148,163,184,.06)" stroke="#94a3b8" strokeWidth="0.9" />;
        return <g key={i}><rect x={nd.x} y={nd.y} width={nd.w} height={nd.h} rx={2} fill="rgba(148,163,184,.05)" stroke="#cbd5e1" strokeWidth="0.9" /><line x1={nd.x + 3} y1={nd.y + nd.h * 0.38} x2={nd.x + nd.w - 3} y2={nd.y + nd.h * 0.38} stroke="#64748b" strokeWidth="0.7" /><line x1={nd.x + 3} y1={nd.y + nd.h * 0.62} x2={nd.x + nd.w * 0.7} y2={nd.y + nd.h * 0.62} stroke="#64748b" strokeWidth="0.7" /></g>;
      })}
    </svg>
  );
}

// S3 Business-Case cash chart (AMTS deck parity). Top-level so its horizon `useState` keeps a stable identity.
// R&D / NRE is a NEGATIVE flow (below the zero baseline), Revenue + Margin are positive bars, and cumulative
// CASH FLOW (Σ margin − R&D) is a line. The horizon toggle renders horizon+1 year columns so a CAGR measured
// over `horizon` years spans `horizon+1` points on the chart (3-Yr→4 · 5-Yr→6 · 10-Yr→11).
function S3CashChart({ p, big }: { p: Project; big?: boolean }) {
  const [horizon, setHorizon] = useState(3);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [pin, setPin] = useState<number | null>(null); // F3 — tap a year → pin its exact figures
  const fo = financialsOverview(p, { years: horizon + 1, funded: true });
  let run = 0;
  const cash = fo.map((r) => (run += r.marginM - r.rdK / 1000)); // cumulative net cash ($M)
  const posMax = Math.max(1, ...fo.map((r) => Math.max(r.revM, r.marginM)), ...cash.filter((c) => c > 0)) * 1.14;
  const negMax = Math.max(1, ...fo.map((r) => r.rdK / 1000), ...cash.filter((c) => c < 0).map((c) => -c)) * 1.14;
  const W = 320, H = big ? 168 : 108, L = 6, B = 16, T = 8, n = fo.length;
  const gw = (W - L) / n;
  const zeroY = T + (H - B - T) * (posMax / (posMax + negMax)); // split point between positive/negative bands
  const yVal = (v: number) => (v >= 0 ? zeroY - (v / posMax) * (zeroY - T) : zeroY + (-v / negMax) * (H - B - zeroY));
  const bw = Math.max(3, (gw * 0.6) / 2);
  const cx = (i: number) => L + i * gw + gw / 2;
  const legend = [
    { label: "Revenue", color: "#34d399" },
    { label: "Margin", color: "#f7b955" },
    { label: "R&D / NRE", color: "#f87171" },
    { label: "Cash flow", color: "#38bdf8" },
  ];
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {legend.map((s) => <span key={s.label} className="flex items-center gap-1 text-[10px] text-slate-400"><span data-ink className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.label}</span>)}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex overflow-hidden rounded border border-slate-700 text-[9px]" role="group" aria-label="View mode">
            {(["chart", "table"] as const).map((v) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
              className={`px-1.5 py-0.5 capitalize ${view === v ? "bg-cyan-500 font-semibold text-[#06202a]" : "text-slate-400 hover:bg-slate-800"}`}>{v}</button>)}
          </div>
          <div className="flex overflow-hidden rounded border border-slate-700 text-[9px]" role="group" aria-label="CAGR horizon">
            {[3, 5, 10].map((h) => <button key={h} onClick={() => setHorizon(h)} aria-pressed={horizon === h}
              className={`px-1.5 py-0.5 ${horizon === h ? "bg-cyan-500 font-semibold text-[#06202a]" : "text-slate-400 hover:bg-slate-800"}`}>{h}-Yr</button>)}
          </div>
        </div>
      </div>
      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right font-mono text-[10px] tabular-nums">
            <thead>
              <tr className="text-slate-400">
                <th className="sticky left-0 z-[1] bg-[#0b0f14] px-1 py-0.5 text-left font-medium">$M</th>
                {fo.map((r) => <th key={r.year} className="px-1 py-0.5 font-medium">{r.year}</th>)}
              </tr>
            </thead>
            <tbody>
              {([
                { label: "Revenue", color: "#34d399", vals: fo.map((r) => r.revM) },
                { label: "Margin", color: "#f7b955", vals: fo.map((r) => r.marginM) },
                { label: "R&D / NRE", color: "#f87171", vals: fo.map((r) => -r.rdK / 1000) },
                { label: "Cash flow", color: "#38bdf8", vals: cash },
              ]).map((row) => (
                <tr key={row.label} className="border-t border-slate-800/70">
                  <td className="sticky left-0 z-[1] whitespace-nowrap bg-[#0b0f14] px-1 py-0.5 text-left text-slate-300">
                    <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: row.color }} />{row.label}
                  </td>
                  {row.vals.map((v, i) => <td key={i} className={`px-1 py-0.5 ${v < 0 ? "text-rose-400" : "text-slate-200"}`}>{v < 0 ? `(${Math.abs(v).toFixed(1)})` : v.toFixed(1)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} role="img" aria-label={`S3 cash flow, ${horizon}-year horizon`}>
        {[0.5, 1].map((fr) => <line key={`p${fr}`} x1={L} y1={yVal(posMax * fr / 1.14)} x2={W} y2={yVal(posMax * fr / 1.14)} stroke="rgba(148,163,184,.09)" />)}
        <line key="neg" x1={L} y1={yVal(-negMax / 1.14)} x2={W} y2={yVal(-negMax / 1.14)} stroke="rgba(148,163,184,.09)" />
        <line x1={L} y1={zeroY} x2={W} y2={zeroY} stroke="rgba(148,163,184,.4)" />
        {fo.map((r, i) => {
          const bx = L + i * gw + gw * 0.16;
          const rev = yVal(r.revM), mar = yVal(r.marginM), rd = yVal(-r.rdK / 1000);
          return (
            <g key={r.year} style={{ cursor: "pointer" }} onClick={() => setPin((prev) => (prev === i ? null : i))}>
              <rect x={L + i * gw} y={T} width={gw} height={H - T} fill={pin === i ? "rgba(56,189,248,.08)" : "transparent"} />
              <rect x={bx} y={rev} width={bw - 1} height={Math.max(0, zeroY - rev)} fill="#34d399" rx={1} />
              <rect x={bx + bw} y={mar} width={bw - 1} height={Math.max(0, zeroY - mar)} fill="#f7b955" rx={1} />
              <rect x={bx + bw * 0.35} y={zeroY} width={bw * 1.3} height={Math.max(0, rd - zeroY)} fill="#f87171" rx={1} opacity={0.9} />
              <text x={cx(i)} y={H - 3} textAnchor="middle" fontSize="6" fill={pin === i ? "#38bdf8" : "#64748b"} fontFamily="ui-monospace, monospace">{r.year}</text>
            </g>
          );
        })}
        <polyline fill="none" stroke="#38bdf8" strokeWidth={1.6} points={cash.map((c, i) => `${cx(i)},${yVal(c)}`).join(" ")} />
        {cash.map((c, i) => <circle key={i} cx={cx(i)} cy={yVal(c)} r={2} fill="#38bdf8" />)}
      </svg>
      )}
      {/* F3 — pinned figure chip for the tapped year (Revenue · Margin · R&D · cumulative cash). */}
      {view === "chart" && pin != null && fo[pin] && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px]">
          <span className="font-mono font-semibold text-cyan-200">{fo[pin].year}</span>
          <span className="text-emerald-300">Rev <b className="tabular-nums">${fo[pin].revM.toFixed(1)}M</b></span>
          <span className="text-amber-300">Mgn <b className="tabular-nums">${fo[pin].marginM.toFixed(1)}M</b></span>
          <span className="text-rose-300">R&D <b className="tabular-nums">${(fo[pin].rdK / 1000).toFixed(1)}M</b></span>
          <span className="text-sky-300">Cash <b className="tabular-nums">${cash[pin].toFixed(1)}M</b></span>
          <button onClick={() => setPin(null)} className="ml-auto rounded px-1 leading-none text-slate-400 hover:text-cyan-300" aria-label="Dismiss">✕</button>
        </div>
      )}
    </div>
  );
}

// ══ W-1b · THE ONE VALUE PROP VISUAL ═══════════════════════════════════════════════════════════════════
// Operator: "there is only one Value Prop visual that is source for everything including slide" ·
// "S8 is the sole source of Truth" · "Place chart at Top … differentiators under visual value prop".
//
// THIS REPLACES TWO CHARTS THAT DREW THE SAME RECORD DIFFERENTLY. `S8ValueChart` (the slide, y-ticks + WTP
// strip) and `ValueEquationPanel` (the authoring surface, sliders) were separate implementations of one
// waterfall, so a fix to either — V-1's top label band, V4's axis fitting — reached only half the app. Every
// consumer now renders THIS component; the differences are a `mode`, not a second file.
//
//   mode="slide"  S8 in Present — chart only, fills its area, no controls
//   mode="read"   project deep-dive — chart + READ-ONLY table (operator: "remove sliders … sliders only for S8")
//   mode="edit"   S8 source panel + New Idea — chart + the editable table
//
// THE MODEL IS W-1a's: a differentiator's bar is its TYPED `valueM`, its ▲▬▼ is the SIGN of that number
// (`driverTone`), and Importance is a manual 1-5 pick that scales nothing. Two capture bars close the chart
// using `valueSplit` — Customer Value @ (1−X)% steps DOWN from EVC, Price @ X% is a total from zero, which
// is the shape of the operator's own reference waterfall.
type VPMode = "slide" | "read" | "edit";

/** Importance as the template draws it: five bars, coloured by band. Operator: "Importance should be red 1-2
 *  bars, sunset 3-4 bars, green, 5 full bars. Use drop down for simplicity."
 *  ⚠ THE SAME THREE-BAND SCALE `confidenceTone` ALREADY SHIPS (G3: 1-2 coral · 3-4 SI-Sunset · 5 green), so
 *  this is a second consumer of one semantic palette, not a fourth set of hexes invented for one control. */
function ImportanceBars({ n }: { n: 1 | 2 | 3 | 4 | 5 }) {
  const tone = confidenceTone(n);
  return (
    <span className="inline-flex items-end gap-[1px] align-middle" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className="inline-block w-[3px] rounded-[1px]"
           style={{ height: `${3 + i * 1.6}px`, background: i <= n ? tone : "#334155" }} />
      ))}
    </span>
  );
}

/** vs NBA — operator: "green up arrow, 0 equal or line sunset colour, down arrow red if number is negative."
 *  DERIVED, never typed: `driverTone` reads the sign of the differentiator's own dollars, so the arrow and
 *  the bar are one function apart and cannot contradict each other on screen. */
function VsNba({ tone }: { tone: "pos" | "neutral" | "neg" }) {
  const glyph = tone === "pos" ? "▲" : tone === "neg" ? "▼" : "▬";
  const color = tone === "pos" ? "#22c55e" : tone === "neg" ? "#ef4444" : "#ffb020";
  const label = tone === "pos" ? "Above the NBA" : tone === "neg" ? "Below the NBA" : "Parity with the NBA";
  return <span title={label} aria-label={label} style={{ color }} className="text-[11px] leading-none">{glyph}</span>;
}

/** W-7 · PRICE PERFORMANCE: COMPETITION — the strip, renamed and made editable.
 *
 *  Operator: "Add Edit mode for and rename to: 'Price Performance: Competition' / Add Comp C / If None,
 *  starts with Comp A (may relabel as well) / User drags where left to right on Competitive Bar, then saves,
 *  exiting Edit Mode. Use Save icon (Standard disk). Never use a pin" — and, with a screenshot,
 *  "Clean this up and add edit to drag NBA and other Comp A and Comp B around."
 *
 *  ⚠ OUR OWN MARKER IS NOT DRAGGABLE, DELIBERATELY. Its position is the competitive index, which is computed
 *  from the drivers. Letting it be dragged would move the picture without moving the number behind it — the
 *  exact single-source violation this whole workstream exists to close. It is drawn, never grabbed.
 *
 *  POINTER EVENTS, NOT MOUSE EVENTS. A marker drag mutates the subtree being touched, and a touch drag dies
 *  on any re-render that does that — the idiom is taken from `mission-planning.tsx`'s mini-map grip, which
 *  learned it the hard way. `touch-none` stops the browser scrolling the page instead of moving the marker.
 *
 *  EDITS ARE STAGED, NOT LIVE. Dragging mutates a local draft; the disk button commits it and leaves edit
 *  mode, and Cancel discards. That is what the operator described ("then saves, exiting Edit Mode") and it
 *  also means a half-finished drag never reaches the record. */
function CompetitionStrip({ p, ours, oursLabel, onSave }: {
  p: Project; ours: number; oursLabel: string; onSave?: (c: WtpMarker[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WtpMarker[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<number | null>(null);
  const saved = competitorsOf(p);
  const marks = editing ? draft : saved;

  // The strip's usable track is inset 6%..94% (the Low/High captions own the ends), so screen x maps back
  // through the SAME constants the markers are positioned with — one geometry, not two that drift.
  const X0 = 6, SPAN = 88;
  const xFromEvent = (clientX: number) => {
    const r = barRef.current?.getBoundingClientRect();
    if (!r || r.width <= 0) return 0.5;
    return clampX(((clientX - r.left) / r.width * 100 - X0) / SPAN);
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current === null) return;
    const i = dragging.current, x = xFromEvent(e.clientX);
    setDraft((d) => d.map((m, j) => (j === i ? { ...m, x } : m)));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (dragging.current === null) return;
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch { /* capture may already be gone */ }
    dragging.current = null;
  };
  const startEdit = () => { setDraft(saved.map((m) => ({ ...m }))); setEditing(true); };
  const commit = () => { onSave?.(draft.map((m) => ({ label: m.label.trim() || "Comp", x: clampX(m.x) }))); setEditing(false); };
  const addOne = () => { const l = nextCompetitorLabel(draft); if (l) setDraft([...draft, { label: l, x: 0.5 }]); };

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[10px] text-slate-400">Price Performance: Competition</div>
        {onSave && (editing ? (
          <div className="flex items-center gap-1">
            <button onClick={addOne} disabled={!nextCompetitorLabel(draft)}
              className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-40"
              title={nextCompetitorLabel(draft) ? `Add ${nextCompetitorLabel(draft)}` : "Comp A, B and C are all placed"}>+ Comp</button>
            <button onClick={() => setEditing(false)}
              className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-200">Cancel</button>
            {/* THE DISK, NOT A PIN (operator: "Use Save icon (Standard disk). Never use a pin"). Same lucide
                `Save` already used by Architect-2525's design library — one save glyph across the tool. */}
            <button onClick={commit} aria-label="Save competitor positions"
              className="flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/20">
              <Save className="h-3 w-3" aria-hidden /> Save
            </button>
          </div>
        ) : (
          <button onClick={startEdit} aria-label="Edit competitor positions"
            className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 hover:border-cyan-500 hover:text-cyan-300">✎ Edit</button>
        ))}
      </div>
      <div ref={barRef} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}
           className={`relative h-12 rounded border bg-[#0e141b] ${editing ? "border-cyan-500/40" : "border-slate-800"} ${editing ? "touch-none" : ""}`}>
        <div data-ink className="absolute inset-x-3 top-1/2 h-px bg-slate-700" />
        {/* ⚠ X-1c · THREE BANDS, NOT ONE (operator, with the screenshot: "Price performance labels: NBA,
            Comp A, Comp B must be above circle. Have circle centered on line so we can read Low to High
            below line and title"). THE CAUSE: this wrapper carried `-translate-y-1/2` around the dot AND
            the label TOGETHER, so translating the STACK up by half its own height pushed the DOT above the
            rule and dropped the LABEL onto the band where LOW/HIGH live — three things competing for one
            band, which is why SAR overprinted HIGH.
            A `1fr auto 1fr` grid over the full height puts the middle row exactly on the centre line, so
            the DOT is centred on the rule and the position it encodes is literally where the marker is —
            which it was not before. The label bottom-aligns in the row above; LOW/HIGH keep the row below
            to themselves. Strip grows h-9 → h-12 to hold three legible bands. */}
        {marks.map((m, i) => (
          <div key={`${m.label}-${i}`} className="absolute inset-y-0 -translate-x-1/2 grid grid-rows-[1fr_auto_1fr] justify-items-center" style={{ left: `${X0 + m.x * SPAN}%`, maxWidth: "22%" }}>
            <div
              onPointerDown={editing ? (e) => { dragging.current = i; (e.target as Element).setPointerCapture?.(e.pointerId); } : undefined}
              role={editing ? "slider" : undefined} tabIndex={editing ? 0 : undefined}
              aria-label={editing ? `${m.label} price-performance position` : undefined}
              aria-valuemin={editing ? 0 : undefined} aria-valuemax={editing ? 100 : undefined}
              aria-valuenow={editing ? Math.round(m.x * 100) : undefined}
              // Keyboard is not an afterthought: a drag-only control is unusable without a pointer, and the
              // arrow keys move by the same 1% the pointer resolves to.
              onKeyDown={editing ? (e) => {
                const d = e.key === "ArrowLeft" ? -0.01 : e.key === "ArrowRight" ? 0.01 : 0;
                if (!d) return; e.preventDefault();
                setDraft((cur) => cur.map((c, j) => (j === i ? { ...c, x: clampX(c.x + d) } : c)));
              } : undefined}
              // ROW 2 = the centre line. Only the DOT sits here, so its centre is on the rule.
              className={`row-start-2 mx-auto h-2.5 w-2.5 rounded-full ${editing ? "h-3.5 w-3.5 cursor-grab ring-2 ring-cyan-400/60 active:cursor-grabbing" : ""}`}
              data-ink style={{ background: m.label === "NBA" ? "#64748b" : "#94a3b8" }} />
            {/* ROW 1, BOTTOM-ALIGNED — the label sits directly ABOVE the dot and can never reach the
                LOW/HIGH band. Placed by grid row rather than by moving this JSX, so the drag handlers
                above stay exactly where they are. */}
            {editing ? (
              <input value={m.label} onChange={(e) => setDraft((d) => d.map((c, j) => (j === i ? { ...c, label: e.target.value } : c)))}
                aria-label={`${m.label} label`}
                className="row-start-1 mb-0.5 w-full self-end bg-transparent text-center text-[7px] leading-tight text-slate-300 outline-none focus:text-cyan-300" />
            ) : (
              /* The MARKER is positioned; its label wraps within a share of the strip, so a long product
                 name at either end folds instead of running off the edge. */
              <div className="row-start-1 mb-0.5 self-end break-words text-center text-[7px] leading-tight text-slate-400">{m.label}</div>
            )}
          </div>
        ))}
        {/* OURS — derived from the competitive index, drawn last so it sits above the competitors, and never
            given a pointer handler even in edit mode. */}
        <div className="pointer-events-none absolute inset-y-0 -translate-x-1/2 grid grid-rows-[1fr_auto_1fr] justify-items-center" style={{ left: `${X0 + clampX(ours) * SPAN}%`, maxWidth: "22%" }}>
          <div data-ink className="row-start-2 mx-auto h-2.5 w-2.5 rounded-full" style={{ background: "#3b82f6" }} />
          {/* OURS gets the same three-band treatment — this is the marker whose label (e.g. "SAR")
              overprinted HIGH, because the competitive index pins it hard right at x = 1.0. */}
          <div className="row-start-1 mb-0.5 self-end break-words text-center text-[7px] leading-tight text-blue-300">{oursLabel}</div>
        </div>
        <span className="absolute bottom-0.5 left-2 text-[7px] uppercase text-slate-600">Low</span>
        <span className="absolute bottom-0.5 right-2 text-[7px] uppercase text-slate-600">High</span>
      </div>
      {editing && <div className="mt-0.5 text-[9px] text-slate-500">Drag a marker (or use ← →) — your own position is computed from the competitive index and cannot be moved.</div>}
    </div>
  );
}

function ValueProp({ p, mode, drivers, onChange, nbaLabel, addressableRevM, onGenerate, onCompetitors, big }: {
  p: Project; mode: VPMode;
  drivers?: ValueDriver[]; onChange?: (d: ValueDriver[]) => void;
  nbaLabel?: string; addressableRevM?: number; onGenerate?: () => void;
  onCompetitors?: (c: WtpMarker[]) => void; big?: boolean;
}) {
  const { t } = useLexicon();
  // ONE RECORD. When a caller is authoring it passes its own draft; otherwise the project's own drivers are
  // the source, falling back to the derived backfill so no project renders a blank chart.
  const rows = drivers ?? (p.valueDrivers?.length ? p.valueDrivers : derivedDriversOf(p));
  const rev = addressableRevM ?? incrementalRevM(p);
  const ve = valueEquation(rows, rev);
  const split = valueSplit(ve.evcUsdM, ve.referenceM, captureOf(p));   // X-5a · the chart's two capture bars read the SAME % as the tile
  const editable = mode === "edit" && !!onChange;
  const set = (i: number, patch: Partial<ValueDriver>) => onChange?.(rows.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  // ── THE WATERFALL ────────────────────────────────────────────────────────────────────────────────────
  // BOX FIRST, THEN TYPE. NEVER CLIP, NEVER ELLIPSIS. The y gutter is measured from the FORMATTED ticks and
  // the bottom band from however many lines the longest x-label actually needs, so the plot yields to the
  // labels rather than the labels being cut to fit the plot (V4). The TOP band `T` exists because a bar whose
  // value equals the domain max would otherwise put its number at y≈0 — outside the viewBox entirely, which
  // is exactly how V-1 found the two tallest bars silently label-less.
  //
  // ⚠ X-1 · THE CHART UNDER-FILLED ITS SLOT BECAUSE OF AN ASPECT MISMATCH, NOT A HEIGHT BUG. Measured on S8
  // in Present mode: the slot is 703.8 x 220.3 (aspect 3.19) and the viewBox was 320 x 154.4 (aspect 2.07).
  // `xMidYMid meet` fits the SMALLER of the two scales, so the drawing was HEIGHT-limited: it rendered
  // 460.4 x 193.8 and left 243px of the panel's width as letterbox — 62.2% of the width used.
  // I chased the wrong lever first and it cost a round. Sweeping the viewBox HEIGHT (154.4 -> 175/200/212/230)
  // could never work: the slot's height is pinned by flex, so a taller viewBox only makes the drawing
  // SMALLER (H=230 measured 41.7% fill, worse than the control). The lever is the layout WIDTH. Injection
  // proof, on the live build, against a pristine clone per variant:
  //     control                       painted 460.4 x 193.8   62.2%
  //     viewBox H -> 230              painted 309.1 x 131.2   41.7%   (the wrong lever, and it hurts)
  //     preserveAspectRatio="none"    painted 709.6 x 193.1   95.8%   (the slot IS fillable)
  //     content widened 1.54x         painted 709.1 x 193.1   95.8%   (the lever, without distortion)
  //
  // So the width is measured, not guessed. `W` is the intrinsic 320 everywhere except a slide, where it is
  // set to whatever makes the viewBox aspect match the box the slide actually hands over. Bars spread and
  // labels get room; the RENDERED type size does not change, because the height-limited scale is unchanged.
  //
  // NO FEEDBACK LOOP, AND THIS IS LOAD-BEARING: the svg's own layout box is the flex remainder of its
  // column (width from the parent, height from `flex-1` after the sibling strip) — measured 703.8 x 220.3
  // and INDEPENDENT of the viewBox. Widening `W` therefore cannot change what the observer reports. The 1%
  // dead-band below is belt-and-braces, not the mechanism.
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [slotAspect, setSlotAspect] = useState(0);   // 0 until measured — SSR and first paint keep the 320
  useEffect(() => {
    const el = svgRef.current;
    if (!big || !el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (!(width > 0 && height > 0)) return;
      const a = +(width / height).toFixed(3);
      setSlotAspect((prev) => (Math.abs(a - prev) > prev * 0.01 ? a : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [big]);
  const W0 = 320;                                    // the intrinsic layout width — every non-slide surface
  const steps = ve.perDriver.slice(0, 8);
  let run = ve.referenceM;
  type Bar = { label: string; from: number; to: number; kind: "base" | "up" | "down" | "give" | "total"; v: number };
  const seq: Bar[] = [{ label: "NBA", from: 0, to: ve.referenceM, kind: "base", v: ve.referenceM }];
  for (const d of steps) { const from = run; run += d.weighted; seq.push({ label: d.name, from, to: run, kind: d.weighted >= 0 ? "up" : "down", v: d.weighted }); }
  // The two capture bars, in the operator's own order: the customer's share steps DOWN from the top, then
  // our price stands as a TOTAL from zero — bookending "their price" against "our price".
  if (split.totalValueM > 0) {
    seq.push({ label: `Customer Value @ ${100 - split.capturePct}%`, from: run, to: split.priceM, kind: "give", v: -split.customerValueM });
    seq.push({ label: `Price · Value Capture @ ${split.capturePct}%`, from: 0, to: split.priceM, kind: "total", v: split.priceM });
  } else {
    seq.push({ label: "EVC", from: 0, to: run, kind: "total", v: run });
  }
  const TICKS = [0, 0.25, 0.5, 0.75, 1];
  const max = Math.max(1, ...seq.map((s) => Math.max(s.from, s.to))) * 1.1;
  const tickTxt = TICKS.map((f) => `${Math.round((max * f) / 1.1)}`);
  const L = Math.max(6, Math.max(...tickTxt.map((s) => s.length)) * 2.6 + 3);
  const n = seq.length;
  /** Everything downstream of the layout WIDTH, in one place so it can be evaluated twice — once at the
   *  intrinsic 320 to learn how tall the drawing wants to be, and again at the width that makes the viewBox
   *  aspect match the slot. Identical arithmetic to before; only the free variable moved into a parameter. */
  const layout = (Wx: number) => {
    const gw = (Wx - L) / n, bw = Math.max(4, gw * 0.62);
    const FS = Math.max(4.4, Math.min(6, gw / 5.2));
    const wrap = (txt: string): string[] => {
      const per = Math.max(4, Math.floor(gw / (FS * 0.56)));
      if (txt.length <= per) return [txt];
      const words = txt.split(" "); const out: string[] = []; let line = "";
      for (const w of words) { if (!line) { line = w; continue; } if ((line + " " + w).length <= per) line += " " + w; else { out.push(line); line = w; } }
      if (line) out.push(line);
      return out.slice(0, 2);
    };
    const wrapped = seq.map((s) => wrap(s.label));
    const linesN = Math.max(1, ...wrapped.map((w) => w.length));
    const B = 6 + linesN * (FS + 1.2);
    return { gw, bw, FS, wrapped, B, T: FS + 3, H: (big ? 150 : 124) + Math.max(0, B - 16) };
  };
  const intrinsic = layout(W0);
  // The slide's slot is wider than tall, so `W` is the width that squares the viewBox aspect with it. Clamped
  // so a degenerate measurement (a collapsed or absurd box) can never produce a chart narrower than the
  // intrinsic one or wider than four sheets. Pass two can only SHORTEN `H` — wider columns wrap fewer label
  // lines — so any residual mismatch letterboxes by a few percent vertically, never by the 35% it did.
  const W = big && slotAspect > 0
    ? Math.min(1200, Math.max(W0, Math.round(intrinsic.H * slotAspect)))
    : W0;
  const { gw, bw, FS, wrapped, B, T, H } = W === W0 ? intrinsic : layout(W);
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  const fill = (k: Bar["kind"]) =>
    k === "base" ? "#64748b" : k === "up" ? "#34d399" : k === "down" ? "#fb7185" : k === "give" ? "#60a5fa" : "#94a3b8";
  // W-20 · one gradient per semantic fill. `gold` is W-19's premium segment; the rest mirror `fill` exactly,
  // so the flat colour and its shaded twin can never drift apart.
  const GRAD: Record<string, string> = { base: "#64748b", up: "#34d399", down: "#fb7185", give: "#60a5fa", total: "#94a3b8", gold: "#ffb020" };
  const gid = useId().replace(/:/g, "");   // `useId` emits colons, which are illegal in an SVG url(#…) ref
  const grad = (k: string) => `url(#${gid}-${k})`;
  /** A bar, drawn with the bevel: gradient body · lighter top cap · darker foot. One helper, so every bar in
   *  every mode gets the identical treatment and a future bar cannot ship flat by omission. */
  const Bar3D = ({ x, y: by, w, h, k }: { x: number; y: number; w: number; h: number; k: string }) => (
    <g>
      {/* ⚠ P3 · THE FLAT UNDERCOAT IS WHY THE BARS SURVIVE A PDF. Measured on the operator's own export and
          reproduced here: every bar was INVISIBLE in the printed deck — axis rules, tick numbers, value
          labels and x-labels all printed, and the bars did not, because a `url(#gradient)` paint server does
          not resolve in Chrome's PDF rasteriser. It failed in BOTH the light and the dark export, so this
          was never a dark-mode bug: it is every PDF this deck has ever produced.
          AND THE GATE COULD NOT SEE IT — pdf-gate asserted "S8 has >= 4 numeric SVG labels", counted 12, and
          went green while the chart it exists to protect was blank. Labels are not bars.
          THE FIX IS ADDITIVE AND UNCONDITIONAL: paint the same colour FLAT underneath, then the gradient on
          top. Where gradients resolve (every browser) you see the bevel exactly as before — the screen does
          not change by one pixel. Where they do not (the PDF, and any reader that rasterises it differently)
          you see the solid bar. No print branch, no mode flag, nothing to keep in sync — and it satisfies
          the operator's actual requirement, that the export "should not matter what PDF reader is used".
          `GRAD[k]` is the SAME hex the gradient's stops are built from, so the two can never disagree. */}
      <rect x={x} y={by} width={w} height={h} fill={GRAD[k] ?? fill(k as Bar["kind"])} rx={1} />
      <rect x={x} y={by} width={w} height={h} fill={grad(k)} rx={1} />
      <rect x={x} y={by} width={w} height={Math.min(1.6, h * 0.22)} fill="#ffffff" opacity={0.28} rx={0.6} />
      <rect x={x} y={by + h - Math.min(1.2, h * 0.16)} width={w} height={Math.min(1.2, h * 0.16)} fill="#000000" opacity={0.22} />
      <rect x={x + w - Math.min(1.1, w * 0.12)} y={by} width={Math.min(1.1, w * 0.12)} height={h} fill="#000000" opacity={0.16} />
    </g>
  );
  const money = (v: number) => `${v < 0 ? "−" : ""}${Math.round(Math.abs(v))}`;
  // W-21 · THE CUSTOMER-VALUE BAR PRINTS A POSITIVE NUMBER (operator: "make blue bar title from negative to
  // positive"). Its `v` is signed NEGATIVE in the model because the bar steps DOWN from EVC to the price —
  // that sign is correct GEOMETRY and stays, because it is what draws the bar in the give-back direction.
  // But it is the wrong READING: the quantity is customer surplus, and 120 of surplus is a good thing. The
  // direction is already stated by the bar's own label ("Customer Value @ 67%") and by which way it points,
  // so the minus was carrying no information and contradicting the word beside it.
  // ⚠ SCOPED TO `give` ONLY. The rose `down` bars are genuine value DESTROYED and keep their minus — that
  // sign is the whole point of a give-back, and blanket-absing every label would erase it.
  const barLabel = (b: Bar) => (b.kind === "give" ? `${Math.round(Math.abs(b.v))}` : money(b.v));
  // WTP positioning — Low→High price-performance; markers deterministic from the competitive index.
  // ⚠ D3 · OUR MARKER'S POSITION IS THE CAPTURE FRACTION, NOT A RETIRED INDEX. It used to be
  // `competitiveIndex / 100`, which measured 100/100 on ALL 33 projects — so every project's marker was
  // pinned hard right, which IS the X-1c right-edge collision, and it encoded nothing. The strip is a PRICE
  // axis, so the honest position is where our price sits between the NBA baseline and full EVC — and that
  // is exactly the capture fraction, by construction (price = NBA + capture × (EVC − NBA)).
  // ⚠ STATED, NOT HIDDEN: on the seeded portfolio this is 0.33 for all 33, because every project still uses
  // the DEFAULT capture. That is a seed gap, not a defect in the replacement — the marker now means
  // something and moves the moment anyone edits capture % on S8, which X-5a made editable.
  const ci = Math.max(0, Math.min(1, captureOf(p) / 100));

  // X-1 · IN SLIDE MODE THE CHART FILLS ITS BOX. `height: 7cqh` was a fixed slice of the container that had
  // nothing to do with how much room the panel actually gave it — the third of three constraints, and the
  // only one visible in the markup. `h-full` plus `xMidYMid meet` scales the WHOLE drawing, type included,
  // up to whatever the panel row now offers, while keeping the bars' proportions honest. NON-SLIDE MODES ARE
  // UNTOUCHED (`height: auto`), so the deep dive and the source panel render exactly as before.
  // ⚠ WRITTEN AS `//`, NOT `{/* */}`. A JSX comment before the root element of a parenthesised expression
  // makes TWO children where one is allowed — `Expected ',', got 'viewBox'`. Second time this session, and
  // BOTH times the lock suite passed while the file would not compile. Only `npm run build` catches it.
  const chart = (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={big ? "min-h-0 w-full flex-1" : "w-full"} preserveAspectRatio="xMidYMid meet"
         style={big ? undefined : { height: "auto" }}
         role="img" aria-label="Value creation and capture waterfall vs the next best alternative">
      {/* W-20 · 3D SHADED BARS (operator: "Make bars futuristic; 3D shaded like attached", with their own
          Excel reference). Excel's "3-D bevel" is, in substance, a VERTICAL GRADIENT plus a lighter cap at
          the top and a darker foot — so that is exactly what this draws: static SVG defs, two extra rects
          per bar, no library, no per-frame cost, and nothing that moves a number.
          ⚠ IDS ARE PER-INSTANCE (`useId`). Two ValueProps can render on one page — the S8 slide and the deep
          dive — and duplicate `<linearGradient id>`s in one document make the SECOND chart silently adopt
          the FIRST one's fills. That is a real bug, not a hypothetical, and it is why this is not a constant. */}
      <defs>
        {Object.entries(GRAD).map(([k, hex]) => (
          <linearGradient key={k} id={`${gid}-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hex} stopOpacity="1" />
            <stop offset="55%" stopColor={hex} stopOpacity="0.92" />
            <stop offset="100%" stopColor={hex} stopOpacity="0.62" />
          </linearGradient>
        ))}
      </defs>
      {TICKS.map((f, i) => (
        <g key={f}>
          <line x1={L} y1={y((max * f) / 1.1)} x2={W} y2={y((max * f) / 1.1)} stroke="rgba(148,163,184,.09)" />
          <text x={L - 2} y={y((max * f) / 1.1) + FS * 0.36} textAnchor="end" fontSize={FS} fill="#64748b">{tickTxt[i]}</text>
        </g>
      ))}
      {seq.map((s, i) => {
        const top = y(Math.max(s.from, s.to)), bot = y(Math.min(s.from, s.to));
        const x = L + i * gw + (gw - bw) / 2;
        return (
          <g key={i}>
            <title>{`${s.label}: ${barLabel(s)}`}{s.kind === "total" && s.from === 0 && ve.referenceM > 0 && s.to > ve.referenceM
              ? ` — ${money(ve.referenceM)} matches the NBA price · ${money(s.to - ve.referenceM)} is the premium we capture` : ""}</title>
            {/* W-19 · THE PRICE BAR IS STACKED (operator: "Make blue bar stacked Bar (with value above NBA
                as Golden). So 85-144 is golden bar we expect price range to fall").
                A single flat bar reading 144 answers "what do we charge" but not the question a board
                actually asks — how much of that is simply MATCHING the alternative, and how much is the
                premium our differentiation earns. Split at the NBA price: the base is the same slate as the
                NBA bar at the far left, so the chart BOOKENDS their price against ours and the eye can
                measure the gap directly; the segment above it is SI-Sunset #ffb020, the ♡ Shared-Intent
                anchor already in this palette, not a fourth hue invented for one bar.
                GEOMETRY, NOT DECORATION: the split y is `y(ve.referenceM)` — the SAME scale function and the
                SAME reference the NBA bar is drawn from — so the gold segment's height IS `price − NBA` and
                cannot disagree with the numbers printed above and below it. */}
            {s.kind === "total" && s.from === 0 && ve.referenceM > 0 && s.to > ve.referenceM ? (
              <>
                <Bar3D x={x} y={y(ve.referenceM)} w={bw} h={Math.max(1, bot - y(ve.referenceM))} k="base" />
                <Bar3D x={x} y={top} w={bw} h={Math.max(1, y(ve.referenceM) - top)} k="gold" />
              </>
            ) : (
              <Bar3D x={x} y={top} w={bw} h={Math.max(1.5, bot - top)} k={s.kind} />
            )}
            {/* A NUMBER ABOVE EVERY BAR (operator: "add numbers to value prop"). Drawn at `top - 1.5`, which
                the top band T was reserved for — without it the tallest bars label at y<0 and vanish. */}
            <text x={x + bw / 2} y={top - 1.5} textAnchor="middle" fontSize={FS} fontWeight={600} fill="#e2e8f0">{barLabel(s)}</text>
            {wrapped[i].map((ln, li) => (
              <text key={li} x={x + bw / 2} y={H - B + 6 + li * (FS + 1.2)} textAnchor="middle" fontSize={FS} fill="#64748b">{ln}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );

  // ── THE DIFFERENTIATOR TABLE, DIRECTLY UNDER THE CHART ───────────────────────────────────────────────
  // Operator: "I want differentiators under visual value prop" · columns as their FLIR template draws them —
  // the name, the money, the 5-bar importance, the ▲▬▼. `OURS` and `NBA` are GONE: `nbaScore` is a dead seed
  // and `ourScore` is only a fallback, so a column for either would invite typing into a number nothing reads.
  const table = mode === "slide" ? null : (
    <div className="mt-2 overflow-x-auto">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-2 gap-y-1 text-[9px] uppercase tracking-wider text-slate-500">
        <span>{t("innovation.veq.colDriver")}</span>
        <span className="w-16 text-right">Value $M</span>
        <span className="w-20 text-center">{t("innovation.veq.colImportance")}</span>
        <span className="w-10 text-center">vs NBA</span>
        <span className="w-5" />
      </div>
      {rows.map((d, i) => {
        const vm = driverValueM(d, rev);
        const tone = driverTone(d, rev);
        const bars = importanceBars(d.importance);
        return (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-2 gap-y-1 py-0.5">
            {editable
              ? <TextCell value={d.name} onCommit={(v) => set(i, { name: v })} placeholder={t("innovation.veq.driverPlaceholder")}
                          title={`Differentiator ${i + 1} name`} />
              : <span className="truncate text-[11px] text-slate-300" title={d.name}>{d.name}</span>}
            {/* VALUE $ IS THE FIRST INPUT AND IT IS THE BAR (operator: "Start with Value for Each
                Differentiator" · "value vs NBA is number"). Typed wins; blank falls back to the legacy
                geometry so a seeded project never renders empty. */}
            {editable
              ? <FinCell value={typeof d.valueM === "number" ? d.valueM : null} signed keySeed={`drv${i}-valueM`}
                         title={`${d.name || `Driver ${i + 1}`} value $M`} placeholder={vm.toFixed(0)}
                         onCommit={(v) => set(i, { valueM: v })}
                         onClear={() => set(i, { valueM: undefined })}
                         className="w-16 rounded border border-slate-700 bg-[#0b0f14] px-1 py-1 text-right text-[11px] tabular-nums text-slate-100 outline-none focus:border-cyan-500" />
              : <span className="w-16 text-right text-[11px] tabular-nums text-slate-200">{money(vm)}</span>}
            {/* IMPORTANCE IS A DROP-DOWN (operator: "Use drop down for simplicity"), not a slider — five
                discrete choices where a continuous 0-100 rail only ever produced five distinct readings. */}
            {editable
              ? <span className="flex w-20 items-center justify-center gap-1">
                  <ImportanceBars n={bars} />
                  <select value={String(bars)} aria-label={`${d.name || `Driver ${i + 1}`} customer importance`}
                          onChange={(e) => set(i, { importance: (+e.target.value - 0.5) / 5 })}
                          className="rounded border border-slate-700 bg-[#0b0f14] px-0.5 py-0.5 text-[10px] tabular-nums text-slate-100 outline-none focus:border-cyan-500">
                    {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </span>
              : <span className="flex w-20 justify-center"><ImportanceBars n={bars} /></span>}
            <span className="w-10 text-center"><VsNba tone={tone} /></span>
            {editable
              ? <button onClick={() => onChange?.(rows.filter((_, j) => j !== i))} className="w-5 rounded text-rose-400 hover:bg-rose-500/10" title="Remove">✕</button>
              : <span className="w-5" />}
          </div>
        );
      })}
      {editable && (
        <button onClick={() => onChange?.([...rows, { name: "", importance: 0.5, ourScore: 0.5, nbaScore: 0.5, valueM: 0 }])}
                className="mt-1 rounded border border-dashed border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-cyan-500/60 hover:text-cyan-300">
          + {t("innovation.veq.addDriver")}
        </button>
      )}
    </div>
  );

  // ⚠ X-1d · THE FIFTH CONSTRAINT IN THIS CHAIN, AND THE ONE THAT ACTUALLY OVERFLOWED. Measured on S8 in
  // Present mode once the screenshot gate was un-blinded: the panel row was bounded (244px), the field
  // wrapper was bounded, ChartFrame was bounded (167px) — and THIS root was `space-y-1`, a plain block with
  // `flex: 0 1 auto` and `min-height: auto`, so it sized to its CONTENT at 340px and clipped 258px inside a
  // 167px box. `h-full` on the SVG then resolved against 340px rather than against the panel, which is why
  // the chart looked right and the gate said content was being lost.
  // A height chain is only as strong as its weakest ancestor: EVERY box between the bounded panel row and
  // the SVG has to carry the height. This is the fifth I have had to fix in the same chain, so the lock
  // below asserts the whole chain rather than any one link.
  // NON-SLIDE MODES ARE UNTOUCHED — the deep dive and the source panel keep `space-y-1` and auto height.
  return (
    <div className={big ? "flex min-h-0 flex-1 flex-col gap-1" : "space-y-1"}>
      {mode !== "slide" && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-amber-400/90">{t("innovation.veq.title")}{nbaLabel ? ` — ${nbaLabel}` : ""}</div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">{t("innovation.veq.evc")} <b className="tabular-nums text-emerald-300">${ve.evcUsdM.toFixed(0)}M</b></span>
          </div>
        </div>
      )}
      {/* CHART FIRST, ALWAYS (operator: "Place chart at Top" · "Value Prop Image on top"). */}
      {chart}
      <CompetitionStrip p={p} ours={ci} oursLabel={(p.name || "Ours").split(" ")[0]} onSave={onCompetitors} />
      {table}
      {mode === "edit" && onGenerate && (
        <div className="flex justify-end pt-1">
          <button onClick={onGenerate} disabled={ve.wins === 0}
                  className="rounded-md border border-cyan-500/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40">
            {t("innovation.veq.generate")}
          </button>
        </div>
      )}
    </div>
  );
}

// Per-project revenue projection (operator): Risk-Weighted Rev vs Full Revenue — a selector, stackable across
// project → Alpha Group → SBU → BU (same two measures roll up cleanly). Full = projected revenue; Risk-Weighted =
// Full × tech×commercial success prob (pSuccess). In Full mode the bar stacks Risk-Weighted (solid) + the at-risk
// upside (light) up to Full; in Risk-Weighted mode only the solid base shows.
function ProjectRevChart({ p }: { p: Project }) {
  const [mode, setMode] = useState<"risk" | "full">("full");
  const rows = projectRevSeries(p, { years: 10, funded: true });
  const pw = pSuccess(p);
  const full = rows.map((r) => r.total);
  const rw = full.map((v) => v * pw);
  const W = 340, H = 120, B = 16, T = 8;
  const max = Math.max(...full, 1) * 1.1; // always scale to Full Revenue so Risk-Weighted green sits where it would under the orange upside
  const bw = (W - 8) / rows.length;
  const hy = (v: number) => (v / max) * (H - B - T);
  const totFull = full.reduce((a, b) => a + b, 0), totRw = rw.reduce((a, b) => a + b, 0);
  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Revenue · 10 yr · stackable (project → Alpha Grp → SBU → BU)</div>
        <div className="flex overflow-hidden rounded-md border border-slate-700 text-[10px]">
          {([["risk", "Risk-Weighted"], ["full", "Full Revenue"]] as const).map(([m, lbl]) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
              className={`px-2 py-0.5 ${mode === m ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" preserveAspectRatio="xMidYMid meet" style={{ height: "auto" }}>
        {rows.map((r, i) => {
          const x = 4 + i * bw + bw * 0.15, w = bw * 0.7;
          const rwh = hy(rw[i]), upH = mode === "full" ? hy(full[i] - rw[i]) : 0;
          const yRw = H - B - rwh, yUp = yRw - upH;
          return (
            <g key={r.year}>
              <title>{r.year}: risk-weighted {Math.round(rw[i])}{mode === "full" ? ` · full ${Math.round(full[i])}` : ""} $M</title>
              {mode === "full" && <rect x={x} y={yUp} width={w} height={Math.max(0, upH)} fill="#fbbf24" />}
              <rect x={x} y={yRw} width={w} height={Math.max(0, rwh)} fill="#34d399" />
              {i % 3 === 0 && <text x={x + w / 2} y={H - 4} textAnchor="middle" fontSize="3.5" fill="#64748b" fontFamily="ui-monospace, monospace">{String(r.year).slice(2)}</text>}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#34d399" }} />Risk-weighted (tech×comm {Math.round(pw * 100)}%)</span>
        {mode === "full" && <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#fbbf24" }} />at-risk upside</span>}
        <span className="ml-auto text-slate-400">RW {usd(totRw)} · Full {usd(totFull)}</span>
      </div>
      {/* H42 — $/min (91-day MoT spread): risk-weighted vs full revenue · cost (NRE) · margin. */}
      {(() => { const m = perMinFinancials([p], 91); const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k/min` : `$${v.toFixed(2)}/min`; return (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
          <span className="font-semibold tracking-wider text-cyan-400">$/min</span>
          <span>RW Rev <b className="tabular-nums text-emerald-300">{fmt(m.revRwPerMin)}</b></span>
          <span>Full Rev <b className="tabular-nums text-emerald-300/80">{fmt(m.revFullPerMin)}</b></span>
          <span>Cost <b className="tabular-nums text-rose-300">{fmt(m.costPerMin)}</b></span>
          <span>Margin <b className="tabular-nums text-amber-300">{fmt(m.marginPerMin)}</b></span>
        </div>
      ); })()}
    </div>
  );
}

// Project Financials Overview (FLIR §2.3) — read-only yearly Revenue / Margin / R&D + Totals.
function FinancialsOverviewTable({ p, onEdit }: { p: Project; onEdit?: () => void }) {
  const rows = financialsOverview(p, { years: 10, funded: true });
  const tot = rows.reduce((a, r) => ({ revM: a.revM + r.revM, marginM: a.marginM + r.marginM, rdK: a.rdK + r.rdK }), { revM: 0, marginM: 0, rdK: 0 });
  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Project Financials Overview · 10-yr (Revenue · Margin · R&D)</div>
        {/* F2 — one-tap financial edit access from the Financials Overview header (opens the shared source editor). */}
        {onEdit && (
          <button onClick={onEdit} title="Edit financials — opens S10, the single source of truth, with its source panel expanded" aria-label="Edit financials"
            className="shrink-0 rounded border border-cyan-500/40 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/10">✎ Financials</button>
        )}
      </div>
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
            <tr><td className="px-1 py-0.5 text-slate-400">R&amp;D $M</td>{rows.map((r) => <td key={r.year} className="px-1 py-0.5 text-right text-amber-300/80">{r.rdK ? (r.rdK / 1000).toFixed(1) + "M" : "–"}</td>)}<td className="px-1 py-0.5 text-right font-semibold text-amber-300">{(tot.rdK / 1000).toFixed(1)}M</td></tr>
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

// Dog-tag project summary card (FLIR transparency board parity): name TOP · SBU vertical LEFT ·
// launch date vertical RIGHT (all fixed) · admin-configurable highlight metrics in the middle.
// Scope filter (P2) — one compact "Scope ▾" dropdown with THREE multi-select groups (BU · SBU · Alpha Group),
// each one-or-many. Options cascade (SBU scoped by chosen BUs, Alpha by chosen SBUs). Available to every persona.
function ScopeFilter({ projects, sel, onChange }: { projects: Project[]; sel: HierSel; onChange: (s: HierSel) => void }) {
  const { t } = useLexicon();
  const [open, setOpen] = useState(false);
  const count = sel.bu.length + sel.sbu.length + sel.pgroup.length;
  const buOpts = hierValues(projects, "bu");
  const sbuOpts = Array.from(new Set(projects.filter((p) => !sel.bu.length || sel.bu.includes(hierOf(p).bu)).map((p) => hierOf(p).sbu))).sort();
  const pgOpts = Array.from(new Set(projects.filter((p) => (!sel.bu.length || sel.bu.includes(hierOf(p).bu)) && (!sel.sbu.length || sel.sbu.includes(hierOf(p).sbu))).map((p) => hierOf(p).pgroup))).sort();
  const toggle = (lvl: keyof HierSel, v: string) => {
    const cur = sel[lvl]; const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    onChange({ ...sel, [lvl]: next });
  };
  const group = (lvl: keyof HierSel, label: string, opts: string[]) => (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <button onClick={() => onChange({ ...sel, [lvl]: [] })} className="text-[10px] text-slate-500 hover:text-cyan-300">{t("innovation.scope.all")}</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {opts.map((o) => {
          const on = sel[lvl].includes(o);
          return (
            <button key={o} onClick={() => toggle(lvl, o)} aria-pressed={on}
              className={`rounded border px-1.5 py-0.5 text-[11px] ${on ? "border-cyan-500 bg-cyan-500/15 text-cyan-200" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>{o}</button>
          );
        })}
        {opts.length === 0 && <span className="text-[10px] text-slate-600">—</span>}
      </div>
    </div>
  );
  // ── OP-1 · THE PANEL IS A PORTAL. Third attempt, and the first that addresses the actual causes. ──────
  // Attempt 1 used `right-0`: the 16rem panel grew LEFTWARD off the page on a phone.
  // Attempt 2 used `left-0`: it fixed the phone but then covered the BU/SBU/Alpha/Product#/Material# toggle
  //   sitting immediately to its right on desktop, and did nothing at all for the Growth Model mount —
  //   whose row is `overflow-x-auto`, and per the CSS Overflow spec that forces `overflow-y` from `visible`
  //   to `auto`, turning a ~28px-tall row into a scroll container that clips the dropdown in BOTH axes.
  // No left/right value can fix a clipping ancestor or a sibling collision. So the panel leaves the flow
  // entirely: rendered into <body> at a FIXED position measured from the trigger, flipped when there is not
  // enough room below or to the right, and clamped to the real viewport on every edge. Nothing that scrolls,
  // clips or sits beside the trigger can affect it any more.
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; maxH: number } | null>(null);
  const PANEL_W = 256, GAP = 4, EDGE = 8;
  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    // Prefer the trigger's left edge; if the panel would cross the right edge, right-align it to the trigger;
    // if it STILL does not fit (a viewport narrower than the panel), pin it to the left margin.
    let left = r.left;
    if (left + PANEL_W > vw - EDGE) left = Math.max(EDGE, r.right - PANEL_W);
    if (left + PANEL_W > vw - EDGE) left = EDGE;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const flip = below < 200 && above > below;      // open upward only when downward is genuinely cramped
    const maxH = Math.max(140, Math.min(0.6 * vh, flip ? above : below));
    setPos({ left, top: flip ? Math.max(EDGE, r.top - GAP - maxH) : r.bottom + GAP, maxH });
  }, []);
  useEffect(() => {
    if (!open) { setPos(null); return; }
    place();
    // Re-measure rather than close: a scroll or rotate must not lose the user's half-made selection.
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);   // capture — any ancestor scroll counts
    return () => { window.removeEventListener("resize", onMove); window.removeEventListener("scroll", onMove, true); };
  }, [open, place]);
  return (
    <div className="relative">
      <button ref={btnRef} onClick={() => setOpen((v) => !v)} aria-expanded={open} title={t("innovation.scope.label")}
        className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${count ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>
        ⧉ {count ? t("innovation.scope.n").replace("{n}", String(count)) : `${t("innovation.scope.label")}: ${t("innovation.scope.allShort")}`} <span className="text-slate-500">▾</span>
      </button>
      {open && pos && typeof document !== "undefined" && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div data-scope-panel role="dialog" aria-label={t("innovation.scope.label")}
            className="fixed z-[91] overflow-y-auto overscroll-contain rounded-lg border border-slate-700 bg-[#0e141b] p-3 shadow-2xl"
            style={{ left: pos.left, top: pos.top, width: PANEL_W, maxHeight: pos.maxH }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200">{t("innovation.scope.label")}</span>
              <button onClick={() => onChange({ bu: [], sbu: [], pgroup: [] })} className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800">{t("innovation.scope.clear")}</button>
            </div>
            {group("bu", "BU", buOpts)}
            {group("sbu", "SBU", sbuOpts)}
            {group("pgroup", t("innovation.scope.alpha"), pgOpts)}
          </div>
        </>, document.body)}
    </div>
  );
}

function DogTag({ p, onEditFinancials }: { p: Project; onEditFinancials?: () => void }) {
  const { t } = useLexicon();
  const h = hierOf(p);
  const dt = DEV_TYPE[devTypeOf(p)]; // project TYPE (orange/blue/green/purple) — a distinct cue (the ● dot)
  const pillar = metaOf(p).initiative;
  const pillarColor = pillarColorOf(pillar, loadPillars()); // highlight/border = Strategic Innovation Pillar
  const [face, setFace] = useState<"biz" | "eng">("biz"); // Slice 2 — engineer ⇄ business face flip
  const metrics = loadDogtag().map((kk) => DOGTAG_METRICS.find((m) => m.key === kk)).filter(Boolean) as typeof DOGTAG_METRICS;
  // Engineering face — deps/load/readiness read (on-project data), vs the business highlight metrics.
  const rb = riskBandOf(p);
  const engMetrics: { label: string; val: string }[] = [
    { label: t("innovation.dogtag.load"), val: `${Math.round(p.ai * 100)}/${Math.round(p.si * 100)}/${Math.round(p.hi * 100)}` },
    { label: t("innovation.dogtag.hiload"), val: `${Math.round(p.humanLoad * 100)}%` },
    { label: t("innovation.dogtag.confidence"), val: `${confidenceOf(p)}/5` },
    { label: t("innovation.dogtag.risk"), val: `${rb.technical[0]}/${rb.commercial[0]}/${rb.dependency[0]}` },
  ];
  return (
    <div className="relative mx-auto flex max-w-sm items-stretch overflow-hidden rounded-lg border-2 bg-[#0b0f14]" style={{ borderColor: pillarColor }} title={`${p.name} · ${h.sbu} · launch ${p.firstRevenue}\nPillar: ${pillar} · Type: ${dt.label}\n${valuePropOf(p)}`}>
      {/* SBU — fixed, vertical left (locked to the project title); tinted by the pillar (highlight) */}
      <div className="flex shrink-0 items-center justify-center px-0.5" style={{ background: `${pillarColor}22` }}>
        <span className="text-[9px] font-mono font-bold tracking-widest" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: pillarColor }}>{h.sbu}</span>
      </div>
      {/* Center — name TOP + compact one-per-line highlights (biz = configured metrics · eng = deps/load/readiness) */}
      <div className="min-w-0 flex-1 px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1 truncate text-[13px] font-bold leading-tight text-slate-100">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: dt.color }} title={`Project type: ${dt.label}`} aria-label={`Project type: ${dt.label}`} />
          <span className="truncate">{p.name}</span>
        </div>
        <div className="mt-0.5 flex flex-col items-center gap-0 text-[10px] leading-tight">
          {face === "biz"
            ? metrics.map((m) => (<div key={m.key}><span className="text-slate-500">{m.label}:</span> <b className="tabular-nums text-slate-200">{m.val(p)}</b></div>))
            : engMetrics.map((m) => (<div key={m.label}><span className="text-slate-500">{m.label}:</span> <b className="tabular-nums text-slate-200">{m.val}</b></div>))}
        </div>
        <div className="mt-0.5 flex items-center justify-center gap-2">
          <button onClick={() => setFace((f) => (f === "biz" ? "eng" : "biz"))} title={t("innovation.dogtag.flip")} aria-label={t("innovation.dogtag.flip")}
            className="text-[8px] uppercase tracking-wider text-slate-600 hover:text-cyan-400">
            {face === "biz" ? `⇄ ${t("innovation.dogtag.engFace")}` : `⇄ ${t("innovation.dogtag.bizFace")}`}
          </button>
          {/* F2 — one-tap financial edit access from the dog tag (opens the shared Rev-Plan source editor). */}
          {onEditFinancials && (
            <button onClick={onEditFinancials} title="Edit financials — opens the Revenue Plan source editor" aria-label="Edit financials"
              className="rounded border border-cyan-500/40 px-1 text-[8px] font-semibold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/10">✎ Financials</button>
          )}
        </div>
      </div>
      {/* Launch date — fixed, vertical right (locked to the project title) */}
      <div className="flex shrink-0 items-center justify-center bg-slate-800/50 px-0.5">
        <span className="text-[9px] font-mono tracking-wider text-slate-400" style={{ writingMode: "vertical-rl" }}>{p.firstRevenue}</span>
      </div>
    </div>
  );
}

// W-1b · `ValueEquationPanel` IS NOW AN ADAPTER, NOT A SECOND CHART. It kept its call signature — three
// sites pass `{drivers, onChange, nbaLabel, addressableRevM, onGenerate}` — but every pixel it draws comes
// from `ValueProp`. That is what "one Value Prop visual that is source for everything including slide"
// means in code: ONE implementation, thin adapters for the shapes callers already use, so a fix lands
// everywhere at once instead of on whichever copy someone remembered.
//
// ⚠ IT NO LONGER RENDERS SLIDERS. Operator, explicitly: "On project tab with Value prop, remove sliders
// (sliders only for S8)." The `mode` a caller passes decides that; NewIdeaModal and the S8 source panel
// author, the project deep-dive reads.
function ValueEquationPanel({ drivers, onChange, nbaLabel, addressableRevM, onGenerate, onCompetitors, project, mode = "edit" }: {
  drivers: ValueDriver[]; onChange: (d: ValueDriver[]) => void; nbaLabel: string; addressableRevM: number;
  onGenerate?: () => void; project?: Project; mode?: "read" | "edit";
  // W-7 · absent in read/slide consumers, so the strip is read-only there and editable only where the
  // record is authored. Passing the writer IS the permission — no separate `canEdit` flag to fall out of sync.
  onCompetitors?: (c: WtpMarker[]) => void;
}) {
  // A caller without a project (the New Idea form, where none exists yet) gets a minimal stand-in: the chart
  // reads only `valueDrivers` and the addressable revenue, both of which are passed explicitly.
  const p = project ?? ({ id: "new", name: "New idea", valueDrivers: drivers } as unknown as Project);
  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.03] p-3">
      <ValueProp p={p} mode={mode} drivers={drivers} onChange={onChange} nbaLabel={nbaLabel} onCompetitors={onCompetitors}
                 addressableRevM={addressableRevM} onGenerate={onGenerate} />
    </div>
  );
}

// Team & roles panel (Slice 5) — add members to a project as Viewer / Editor / Approver / Project Lead.
// Roles authorize writes across the tool via the pure can() helper. Only a Lead may manage membership;
// the last Lead can't be demoted/removed (self-lockout guard). No members ⇒ the viewer is the implicit Lead.
function TeamRoles({ projectId, members, me, onChange }: { projectId: string; members: MembershipMap; me: string; onChange: (m: MembershipMap) => void }) {
  const { t } = useLexicon();
  const list = members[projectId] ?? [];
  const myRole = roleOf(members, projectId, me);
  const canManage = myRole === "lead";
  const [newRef, setNewRef] = useState("");
  const [newRole, setNewRole] = useState<ProjectRole>("viewer");
  const setList = (next: ProjectMember[]) => onChange({ ...members, [projectId]: next });
  const addMember = () => {
    const ref = scrubText(newRef, 64); // scrub secrets + cap before it lands in the shared blob (Thor)
    if (!ref) return;
    const base = list.length ? list : [{ userRef: me, role: "lead" as ProjectRole }]; // seed owner as Lead
    if (base.some((m) => m.userRef === ref)) return;
    setList([...base, { userRef: ref, role: newRole }]);
    setNewRef("");
  };
  const updateRole = (ref: string, role: ProjectRole) => {
    if (role !== "lead" && isLastLead(members, projectId, ref)) return;
    setList(list.map((m) => (m.userRef === ref ? { ...m, role } : m)));
  };
  const removeMember = (ref: string) => { if (!isLastLead(members, projectId, ref)) setList(list.filter((m) => m.userRef !== ref)); };
  const sel = "rounded border border-slate-700 bg-[#0b0f14] px-1.5 py-1 text-[11px] text-slate-100 outline-none focus:border-cyan-500";
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("innovation.team.title")}</h2>
        <span className="text-[11px] text-slate-500">{t("innovation.team.you")}: <b className="text-cyan-300">{t(`innovation.role.${myRole}`)}</b></span>
      </div>
      {list.length === 0 && <p className="mt-2 text-[11px] text-slate-500">{t("innovation.team.none")}</p>}
      {list.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-900">
          {list.map((m) => (
            <li key={m.userRef} className="flex items-center gap-2 py-1.5 text-[12px]">
              <span className="min-w-0 flex-1 truncate font-mono text-slate-300" title={m.userRef}>{m.userRef === me ? `${m.userRef} (you)` : m.userRef}</span>
              <select value={m.role} disabled={!canManage} aria-label={`Role for ${m.userRef}`} onChange={(e) => updateRole(m.userRef, e.target.value as ProjectRole)} className={`${sel} disabled:opacity-50`}>
                {PROJECT_ROLES.map((r) => <option key={r} value={r} disabled={r !== "lead" && isLastLead(members, projectId, m.userRef)}>{t(`innovation.role.${r}`)}</option>)}
              </select>
              {canManage && <button onClick={() => removeMember(m.userRef)} disabled={isLastLead(members, projectId, m.userRef)} aria-label={`Remove ${m.userRef}`} title={isLastLead(members, projectId, m.userRef) ? "Can't remove the last Lead" : "Remove"} className="rounded border border-slate-700 px-1.5 py-1 text-[11px] text-slate-400 hover:bg-slate-800 disabled:opacity-40">✕</button>}
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={newRef} onChange={(e) => setNewRef(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMember()} placeholder={t("innovation.team.refPlaceholder")} aria-label={t("innovation.team.add")} className={`${sel} min-w-0 flex-1`} />
          <select value={newRole} aria-label="New member role" onChange={(e) => setNewRole(e.target.value as ProjectRole)} className={sel}>
            {PROJECT_ROLES.map((r) => <option key={r} value={r}>{t(`innovation.role.${r}`)}</option>)}
          </select>
          <button onClick={addMember} className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20">＋ {t("innovation.team.add")}</button>
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-slate-600">{t("innovation.team.leadOnly")}</p>
      )}
      <p className="mt-2 text-[9px] text-slate-600">{t("innovation.team.gatingNote")}</p>
    </div>
  );
}

// R-Core Project Template — in-app pop-out (replaces the old new-tab link). Embeds the standalone
// template doc in a sandboxed iframe. Same modal idiom as NewIdeaModal/BudgetModal + Escape/focus (a11y).
// Shared modal a11y — Escape-to-close + focus the close control on open + return focus on unmount. ONE source
// for dialog dismiss/focus behavior (Template · History · NewIdea · Budget). Returns a ref for the ✕ button.
function useModalDismiss(onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return closeRef;
}
// Audit trail (Slice 6) — one append-only funding/approval entry, colored by kind.
const AUDIT_TONE: Record<AuditKind, string> = {
  fund: "bg-emerald-500/15 text-emerald-300",
  defund: "bg-rose-500/15 text-rose-300",
  approve: "bg-cyan-500/15 text-cyan-300",
  reject: "bg-amber-500/15 text-amber-300",
  edit: "bg-slate-500/15 text-slate-300",
  scenario: "bg-violet-500/15 text-violet-300",
  budget: "bg-sky-500/15 text-sky-300",
};
function AuditRow({ a, selected, refCb }: { a: AuditEntry; selected?: boolean; refCb?: (el: HTMLLIElement | null) => void }) {
  return (
    <li ref={refCb} className={`flex items-start gap-2 py-1.5 text-[11px] ${selected ? "rounded bg-cyan-500/10 ring-1 ring-inset ring-cyan-500/40" : ""}`}>
      <span className={`mt-px shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${AUDIT_TONE[a.kind] ?? "bg-slate-500/15 text-slate-300"}`}>{a.kind}</span>
      <span className="min-w-0 flex-1 break-words text-slate-400">{fmtAuditEntry(a)}</span>
    </li>
  );
}
// Approval TIMELINE scrubber — a play-bar laying the audit trail on a time axis (oldest→newest). MAJOR changes
// (approvals, funding shifts, budget moves) are RED dots; minor edits are small grey ticks. Drag the bar to scrub,
// tap a dot to jump, ▶ to play through. Selecting a point highlights + scrolls the matching row below.
function HistoryTimeline({ points, selId, onSelect }: { points: TimelinePoint[]; selId: string | null; onSelect: (id: string) => void }) {
  const { t } = useLexicon();
  const trackRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const selIdx = Math.max(0, points.findIndex((p) => p.entry.id === selId));
  useEffect(() => {
    if (!playing) return;
    if (points.length === 0 || selIdx >= points.length - 1) { setPlaying(false); return; }
    const id = setTimeout(() => onSelect(points[Math.min(points.length - 1, selIdx + 1)].entry.id), 900);
    return () => clearTimeout(id);
  }, [playing, selIdx, points, onSelect]);
  const pickNearest = (clientX: number) => {
    const el = trackRef.current; if (!el || points.length === 0) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    let best = points[0], bd = Infinity;
    for (const p of points) { const d = Math.abs(p.t - x); if (d < bd) { bd = d; best = p; } }
    onSelect(best.entry.id);
  };
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault(); pickNearest(e.clientX);
    const move = (ev: PointerEvent) => pickNearest(ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  if (points.length === 0) return null;
  const selT = points[selIdx]?.t ?? 0;
  const majorN = points.filter((p) => p.major).length;
  return (
    <div>
      <div className="flex items-center gap-3">
        <button onClick={() => setPlaying((v) => !v)} aria-label={playing ? t("innovation.audit.pause") : t("innovation.audit.play")}
          title={playing ? t("innovation.audit.pause") : t("innovation.audit.play")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20">{playing ? "⏸" : "▶"}</button>
        <div ref={trackRef} onPointerDown={onDown} role="slider" aria-label={t("innovation.audit.timeline")}
          aria-valuemin={0} aria-valuemax={points.length - 1} aria-valuenow={selIdx}
          className="relative h-8 flex-1 cursor-pointer touch-none select-none">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-700" />
          <div className="absolute top-1/2 h-px -translate-y-1/2 bg-cyan-500/50" style={{ left: 0, width: `${selT * 100}%` }} />
          {points.map((p) => (
            <button key={p.entry.id} tabIndex={-1} onClick={(e) => { e.stopPropagation(); onSelect(p.entry.id); }}
              title={fmtAuditEntry(p.entry)} style={{ left: `${p.t * 100}%` }}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${p.major ? "h-3 w-3 bg-rose-500 ring-1 ring-rose-300/60" : "h-1.5 w-1.5 bg-slate-500"} ${p.entry.id === selId ? "ring-2 ring-cyan-300" : ""}`} />
          ))}
          <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-cyan-400" style={{ left: `${selT * 100}%` }} />
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500 align-middle" />{t("innovation.audit.major")} · {majorN}</span>
        <span className="min-w-0 flex-1 truncate text-right text-slate-400">{points[selIdx] ? fmtAuditEntry(points[selIdx].entry) : ""}</span>
      </div>
    </div>
  );
}
// Funding & Approval History pop-out — shared modal idiom (backdrop tap-close · ✕ · Escape · focus-trap ·
// return-focus), scroll, filter by kind. Reads the live in-session + persisted audit trail.
function HistoryModal({ activity, onClose }: { activity: AuditEntry[]; onClose: () => void }) {
  const { t } = useLexicon();
  const closeRef = useModalDismiss(onClose);
  const [kindFilter, setKindFilter] = useState<AuditKind | "all">("all");
  const kinds: (AuditKind | "all")[] = ["all", "fund", "defund", "approve", "reject", "budget", "scenario", "edit"];
  const s = summarizeAudit(activity);
  const shown = kindFilter === "all" ? activity : activity.filter((a) => a.kind === kindFilter);
  // Timeline scrubber (ascending) + selection synced to the list below.
  const points = useMemo(() => auditTimeline(shown), [shown]);
  const [selId, setSelId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  // Default the playhead to the latest change whenever the shown set changes and the current pick fell out.
  useEffect(() => {
    if (points.length === 0) { setSelId(null); return; }
    if (!selId || !points.some((p) => p.entry.id === selId)) setSelId(points[points.length - 1].entry.id);
  }, [points, selId]);
  useEffect(() => { if (selId && rowRefs.current[selId]) scrollToEl(rowRefs.current[selId]); }, [selId]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("innovation.audit.title")}>
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col rounded-xl border border-slate-800 bg-[#0e141b]" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-100">{t("innovation.audit.title")}</h2>
          <button ref={closeRef} onClick={onClose} aria-label={t("innovation.template.close")} title={t("innovation.template.close")}
            className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20">✕ {t("innovation.template.close")}</button>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-800 px-4 py-2">
          {kinds.map((k) => (
            <button key={k} onClick={() => setKindFilter(k)}
              className={`rounded border px-2 py-1 text-[11px] ${kindFilter === k ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-400 hover:bg-slate-800"}`}>
              {k === "all" ? t("innovation.audit.all") : k}{k !== "all" && s[k] ? ` (${s[k]})` : ""}
            </button>
          ))}
        </div>
        {points.length > 0 && (
          <div className="shrink-0 border-b border-slate-800 px-4 py-2.5">
            <HistoryTimeline points={points} selId={selId} onSelect={setSelId} />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {shown.length === 0 ? (
            <p className="mt-2 text-[11px] text-slate-500">{t("innovation.audit.empty")}</p>
          ) : (
            <ul className="divide-y divide-slate-900">{shown.map((a) => (
              <AuditRow key={a.id} a={a} selected={a.id === selId} refCb={(el) => { rowRefs.current[a.id] = el; }} />
            ))}</ul>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateModal({ onClose }: { onClose: () => void }) {
  const { t } = useLexicon();
  const closeRef = useModalDismiss(onClose);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label="R-Core Project Template">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col rounded-xl border border-slate-800 bg-[#0e141b]" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-100">{t("innovation.header.template")}</h2>
          <div className="flex items-center gap-2">
            <a href="/innovation/pdm-template.html" target="_blank" rel="noopener"
              className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800">{t("innovation.template.newTab")}</a>
            <button ref={closeRef} onClick={onClose} aria-label={t("innovation.template.close")} title={t("innovation.template.close")}
              className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20">✕ {t("innovation.template.close")}</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-2">
          <iframe src="/innovation/pdm-template.html" sandbox="allow-same-origin" loading="lazy"
            title={t("innovation.header.template")} className="h-full w-full rounded-lg border-0 bg-white" />
        </div>
      </div>
    </div>
  );
}

function NewIdeaModal({ onCreate, onClose }: { onCreate: (f: { name: string; valueProp: string; nba: string; segments: SegmentValueProp[]; drivers: ValueDriver[] }) => void; onClose: () => void }) {
  const { t } = useLexicon();
  const [name, setName] = useState("");
  const [valueProp, setValueProp] = useState("");
  const [nba, setNba] = useState("");
  const [segments, setSegments] = useState<SegmentValueProp[]>([]);
  const [drivers, setDrivers] = useState<ValueDriver[]>([]);
  const segLib = loadSegLib(); // Slice 7 — recurring buyer-need taxonomy for the segment datalist
  const closeRef = useModalDismiss(onClose); // shared a11y: Escape-to-close + focus + return-focus
  const inp = "w-full rounded-lg border border-slate-700 bg-[#0b0f14] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500";
  // Best-in-class HI value prop requires BOTH the master statement and the Next Best Alternative.
  const canCreate = name.trim().length > 0 && valueProp.trim().length > 0 && nba.trim().length > 0;
  // Generate the master value prop from the Value Equation's winning drivers vs the NBA (still hand-editable).
  const generateFromEquation = () => {
    const eq = valueEquation(drivers, 50); // seed-idea default addressable rev ($50M) until financials are set
    const winners = eq.perDriver.filter((d) => d.verdict === "win").sort((a, b) => b.weighted - a.weighted).slice(0, 3).map((d) => d.name).filter(Boolean);
    if (winners.length === 0) return;
    const list = winners.length === 1 ? winners[0] : winners.slice(0, -1).join(", ") + " and " + winners[winners.length - 1];
    const who = name.trim() || "our customers";
    setValueProp(`For ${who}, this beats ${nba.trim() || "the next-best alternative"} on ${list} — ~$${eq.evcUsdM.toFixed(0)}M economic value to the customer, +$${eq.differentiationM.toFixed(0)}M over the NBA.`);
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("innovation.newidea.title")}>
      <div className="mx-auto max-w-lg rounded-xl border border-slate-800 bg-[#0e141b] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("innovation.newidea.title")} <span className="ml-1 rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">웃 HI</span></h2>
          <button ref={closeRef} onClick={onClose} aria-label={t("innovation.template.close")} title={t("innovation.template.close")} className="rounded border border-slate-700 px-2 py-1 text-slate-400 hover:bg-slate-800">✕</button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Author the best-in-class <b className="text-slate-300">human (HI)</b> value proposition. On submit, an <b className="text-cyan-300">AI (◬) rendition</b> is minted so improvement ideas surface via the HI⇄AI toggle. It&apos;s how Innovation, Business, and BD/Sales align from day one.</p>

        <label className="mt-4 block text-[11px] uppercase tracking-wider text-slate-400">Project name</label>
        <input value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder="e.g. Next-Gen ISR Sensor" className={`mt-1 ${inp}`} />

        <label className="mt-3 block text-[11px] uppercase tracking-wider text-slate-400">Master value proposition <span className="text-rose-400">· required · HI</span></label>
        <textarea value={valueProp} onChange={(e) => setValueProp(e.target.value)} rows={3}
          placeholder="For [customer] who [need], [product] is a [category] that [key benefit / quantified value]." className={`mt-1 resize-y ${inp}`} />

        <label className="mt-3 block text-[11px] uppercase tracking-wider text-slate-400">Next Best Alternative (NBA) <span className="text-rose-400">· required</span></label>
        <textarea value={nba} onChange={(e) => setNba(e.target.value)} rows={2}
          placeholder="The current competitive alternative or As-Is solution the customer uses today — what we must beat." className={`mt-1 resize-y ${inp}`} />
        <p className="mt-1 text-[10px] text-slate-500">Understand customer needs <em>versus the Next Best Alternative</em> — the As-Is / competitive option the value prop must out-perform.</p>

        {/* Value Equation — the primary authoring path: score each differentiator vs the NBA, then generate. */}
        <div className="mt-3">
          <ValueEquationPanel drivers={drivers} onChange={setDrivers} nbaLabel={nba.trim()} addressableRevM={50} onGenerate={generateFromEquation} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <label className="text-[11px] uppercase tracking-wider text-slate-400">Per-segment value props <span className="text-slate-500">· recommended</span></label>
          <button onClick={() => setSegments((s) => [...s, { segment: "", prop: "" }])} className="rounded bg-cyan-500/90 px-2 py-0.5 text-[11px] font-semibold text-[#06202a] hover:bg-cyan-400">+ Add segment</button>
        </div>
        <div className="mt-1.5 space-y-1.5">
          {segments.length === 0 && <p className="text-[11px] text-slate-600">Add a value prop per needs-based segment (e.g. by mission, buyer, or use case) — recommended for stronger BD/Sales targeting.</p>}
          <datalist id="seg-library">{segLib.map((sg) => <option key={sg} value={sg} />)}</datalist>
          {segments.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-800 p-1.5">
              <div className="flex gap-1.5">
                <input list="seg-library" value={s.segment} onChange={(e) => setSegments((a) => a.map((x, j) => j === i ? { ...x, segment: e.target.value } : x))} placeholder="Segment (from library or new)" className={`w-40 shrink-0 ${inp} py-1.5 text-xs`} />
                <input value={s.prop} onChange={(e) => setSegments((a) => a.map((x, j) => j === i ? { ...x, prop: e.target.value } : x))} placeholder="Value prop for this segment" className={`flex-1 ${inp} py-1.5 text-xs`} />
                <select value={s.confidence ?? ""} onChange={(e) => setSegments((a) => a.map((x, j) => j === i ? { ...x, confidence: (e.target.value ? Number(e.target.value) : undefined) as SegmentValueProp["confidence"] } : x))} title={t("innovation.seg.confidence")} className={`w-14 shrink-0 ${inp} py-1.5 text-xs`}>
                  <option value="">c?</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>c{n}</option>)}
                </select>
                <button onClick={() => setSegments((a) => a.filter((_, j) => j !== i))} className="rounded px-1.5 text-rose-400 hover:bg-rose-500/10" title="Remove">✕</button>
              </div>
              <div className="mt-1 flex gap-1.5">
                <input value={s.pain ?? ""} onChange={(e) => setSegments((a) => a.map((x, j) => j === i ? { ...x, pain: e.target.value } : x))} placeholder={t("innovation.seg.pain")} className={`flex-1 ${inp} py-1 text-[11px]`} />
                <input value={s.outcome ?? ""} onChange={(e) => setSegments((a) => a.map((x, j) => j === i ? { ...x, outcome: e.target.value } : x))} placeholder={t("innovation.seg.outcome")} className={`flex-1 ${inp} py-1 text-[11px]`} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 rounded-lg border border-slate-800 bg-[#0b0f14] px-3 py-2 text-[10px] leading-snug text-slate-500">Customer Pain Points and the Customer Problem Statement are early-Concept (G1) Market-Needs deliverables — a <b className="text-slate-400">separate recommended workflow</b>, not required to submit a value proposition here.</p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Cancel</button>
          <button onClick={() => canCreate && onCreate({ name, valueProp, nba, segments, drivers })} disabled={!canCreate}
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-[#06202a] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">Create project</button>
        </div>
        {!canCreate && <p className="mt-1.5 text-right text-[10px] text-slate-500">Name + master value proposition + Next Best Alternative required.</p>}
      </div>
    </div>
  );
}

// Budget popup — all budget for an SBU or Alpha Group, key metrics INCLUDING unfunded projects.
// BD packet — a one-click, client-side brief a seller carries into the room (Slice 3). Deterministic,
// offline (Blob download). Value prop · NBA + competitive index/EVC · top metrics · key risk · funding ask.
function downloadBdPacket(p: Project) {
  if (typeof document === "undefined") return;
  const fm = financialMetrics(p); const eq = valueEquationOf(p);
  const lines = [
    `BD PACKET — ${p.name}`,
    `SBU ${hierOf(p).sbu}  ·  ${GATE_STAGE[p.gate]} (${p.gate})  ·  Launch ${p.firstRevenue}`,
    ``, `VALUE PROPOSITION`, valuePropOf(p),
    ``, `NEXT BEST ALTERNATIVE`, nbaOf(p),
    `EVC vs NBA: ~$${eq.evcUsdM.toFixed(0)}M  ·  +$${eq.differentiationM.toFixed(0)}M differentiation`,
    ``, `TOP METRICS`, `NPV ${usd(fm.npvM)}  ·  IRR ${fm.irrPct}%  ·  Payback ${payb(fm.paybackYears)}  ·  10-Yr Rev ${usd(fm.rev10yM)}`,
    ``, `KEY RISK`, killRiskOf(p),
    ``, `FUNDING ASK`, `R&D (NRE): ${k(p.nreK)}`,
  ].join("\n");
  const url = URL.createObjectURL(new Blob([lines], { type: "text/plain" }));
  const a = document.createElement("a"); a.href = url; a.download = `BD-packet-${p.id}.txt`; a.click();
  URL.revokeObjectURL(url);
}

// Outcome brief (Slice 8) — a fuller shareable brief than the BD packet: value prop + value drivers vs the
// NBA + Intelligence-Load read + gate + funding. Client-side text download; deterministic/offline.
function downloadOutcomeBrief(p: Project) {
  if (typeof document === "undefined") return;
  const fm = financialMetrics(p); const eq = valueEquationOf(p); const il = intelLoadGloss(p);
  // Council (Asar): list drivers from the SAME source the competitive index/EVC use (derived fallback when
  // none are hand-scored), so the brief never shows an index above "(no drivers scored)".
  const hasScored = (p.valueDrivers?.length ?? 0) > 0;
  const driverRows = hasScored ? p.valueDrivers! : derivedDriversOf(p);
  const drivers = driverRows.map((d) => `  · ${d.name}: ours ${Math.round(d.ourScore * 100)} vs NBA ${Math.round(d.nbaScore * 100)} (importance ${Math.round(d.importance * 100)})${hasScored ? "" : " (auto-derived)"}`).join("\n") || "  (no drivers scored)";
  const segs = (p.segmentValueProps ?? []).map((s) => `  · ${s.segment}: ${s.prop}`).join("\n") || "  (no segments)";
  const lines = [
    `OUTCOME BRIEF — ${p.name}`,
    `SBU ${hierOf(p).sbu} · ${GATE_STAGE[p.gate]} (${p.gate}) · Launch ${p.firstRevenue}`,
    ``, `VALUE PROPOSITION`, valuePropOf(p),
    ``, `NEXT BEST ALTERNATIVE`, nbaOf(p),
    ``, `VALUE EQUATION vs NBA — EVC ~$${eq.evcUsdM.toFixed(0)}M · +$${eq.differentiationM.toFixed(0)}M differentiation`, drivers,
    ``, `NEEDS SEGMENTS`, segs,
    ``, `INTELLIGENCE LOAD`, `AI ${Math.round(p.ai * 100)} · SI ${Math.round(p.si * 100)} · HI ${Math.round(p.hi * 100)} — ${il.gloss}`,
    ``, `ECONOMICS`, `NPV ${usd(fm.npvM)} · IRR ${fm.irrPct}% · Payback ${payb(fm.paybackYears)} · 10-Yr Rev ${usd(fm.rev10yM)} · R&D ${k(p.nreK)}`,
    ``, `KEY RISK`, killRiskOf(p),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([lines], { type: "text/plain" }));
  const a = document.createElement("a"); a.href = url; a.download = `outcome-brief-${p.id}.txt`; a.click();
  URL.revokeObjectURL(url);
}

function BudgetModal({ projects, fundedIds, availK, budgetOverrideK, onSetBudget, canEditBudget, cadence = "M", onClose }: { projects: Project[]; fundedIds: Set<string>; availK: number; budgetOverrideK: (level: HierKey, code: string) => number | undefined; onSetBudget: (level: string, code: string, budgetK: number | null) => void; canEditBudget: boolean; cadence?: Cadence; onClose: () => void }) {
  const { t } = useLexicon();
  const closeRef = useModalDismiss(onClose); // shared a11y: Escape-to-close + focus + return-focus
  const [level, setLevel] = useState<"bu" | "sbu" | "pgroup">("bu");
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const levelLabel = level === "sbu" ? "SBU" : level === "pgroup" ? t("innovation.scope.alpha") : "BU";
  // Memoized so the (potentially large) bucket + allocation computations don't re-run on every modal render.
  const buckets = useMemo(() => fundingBuckets(projects, level, (id) => fundedIds.has(id)), [projects, level, fundedIds]);
  const alloc = useMemo(() => nodeAllocation(projects, level, (id) => fundedIds.has(id), availK, budgetOverrideK), [projects, level, fundedIds, availK, budgetOverrideK]);
  const groups = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of projects) { const key = hierOf(p)[level]; (map.get(key) ?? map.set(key, []).get(key)!).push(p); }
    return Array.from(map.entries()).map(([key, ps]) => {
      const funded = ps.filter((p) => fundedIds.has(p.id));
      const unfunded = ps.filter((p) => !fundedIds.has(p.id));
      return {
        key, ps, funded, unfunded,
        spendK: ps.reduce((s, p) => s + p.nreK, 0),
        fundedSpendK: funded.reduce((s, p) => s + p.nreK, 0),
        unfundedSpendK: unfunded.reduce((s, p) => s + p.nreK, 0),
        npv: ps.reduce((s, p) => s + npvM(p), 0),
        wrev: ps.reduce((s, p) => s + weightedRevM(p), 0),
        unfundedNpv: unfunded.reduce((s, p) => s + npvM(p), 0),                       // NPV @ risk (below the line)
        valueDensity: ps.reduce((s, p) => s + p.nreK, 0) > 0 ? ps.reduce((s, p) => s + npvM(p), 0) / (ps.reduce((s, p) => s + p.nreK, 0) / 1000) : 0, // NPV$M ÷ spend$M
        riskAdjK: ps.reduce((s, p) => s + p.nreK * pSuccess(p), 0),                   // spend × gate-pass probability
      };
    }).sort((a, b) => b.npv - a.npv);
  }, [projects, level, fundedIds]);
  const tot = { spendK: groups.reduce((s, g) => s + g.spendK, 0), fundedK: groups.reduce((s, g) => s + g.fundedSpendK, 0), unfundedK: groups.reduce((s, g) => s + g.unfundedSpendK, 0), riskAdjK: groups.reduce((s, g) => s + g.riskAdjK, 0), n: projects.length, funded: fundedIds.size };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("innovation.budget.title").replace("{level}", levelLabel)}>
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-[#0e141b]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold">{t("innovation.budget.title").replace("{level}", levelLabel)} <span className="text-[11px] text-slate-500">— {t("innovation.budget.fundedUnfunded")}</span></h2>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-slate-700 text-[11px]">
              {([["bu", "BU"], ["sbu", "SBU"], ["pgroup", t("innovation.scope.alpha")]] as const).map(([lv, lbl]) => (
                <button key={lv} onClick={() => setLevel(lv)} className={`px-2.5 py-1 ${level === lv ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
              ))}
            </div>
            <button ref={closeRef} onClick={onClose} aria-label={t("innovation.template.close")} title={t("innovation.template.close")} className="rounded border border-slate-700 px-2 py-1 text-slate-400 hover:bg-slate-800">✕</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 text-[11px] text-slate-400 border-b border-slate-800">
          <span>Total R&amp;D spend <b className="tabular-nums text-slate-200">{k(tot.spendK)}</b></span>
          <span>Funded <b className="tabular-nums text-emerald-400">{k(tot.fundedK)}</b> · {tot.funded}/{tot.n}</span>
          <span>Not funded <b className="tabular-nums text-rose-400">{k(tot.unfundedK)}</b> · {tot.n - tot.funded}</span>
          <span>{t("innovation.budget.riskAdjSpend")} <b className="tabular-nums text-amber-300">{k(tot.riskAdjK)}</b></span>
        </div>
        {/* Real-time decision core — funding buckets at the selected level: each node × {funded, unfunded}.
            BU → 3×2 = 6 buckets; SBU / Alpha Group scale the same way. $/min = live burn (System of
            Innovation: time is money). A project sits in exactly one bucket, set by the global funding line. */}
        {(level === "bu" || level === "sbu" || level === "pgroup") && (() => {
          const cell = (title: string, tone: "ok" | "bad", a: typeof buckets[number]["funded"]) => (
            <div className={`rounded-md border p-2 ${tone === "ok" ? "border-emerald-500/30 bg-emerald-500/[0.05]" : "border-rose-500/30 bg-rose-500/[0.05]"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${tone === "ok" ? "text-emerald-300" : "text-rose-300"}`}>{title}</span>
                <span className="text-[10px] tabular-nums text-slate-400">{a.count} proj</span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                <span className="text-slate-500">NRE</span><span className="text-right tabular-nums text-slate-200">{k(a.nreK)}</span>
                <span className="text-slate-500">NPV</span><span className={`text-right tabular-nums ${a.npvM >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{usd(a.npvM)}</span>
                <span className="text-slate-500">P-wt rev</span><span className="text-right tabular-nums text-slate-300">{usd(a.pwRevM)}</span>
                <span className="text-slate-500" title="Live burn — NRE spread across the program schedule">$/{CADENCE_UNIT[cadence].short}</span><span className="text-right tabular-nums text-amber-300">{fmtPerCadence(a.perMinUsd, cadence)}</span>
              </div>
            </div>
          );
          // Group the funded/unfunded buckets under a parent header (operator): SBUs nested under their BU,
          // Alpha Groups nested under "BU • SBU". BU is the top of the hierarchy, so it stays flat.
          const parentInfo = (code: string): { key: string; label: string; bu: string } => {
            const p = projects.find((pr) => hierOf(pr)[level] === code);
            if (!p) return { key: "—", label: "—", bu: "" };
            const h = hierOf(p);
            if (level === "sbu") return { key: h.bu, label: BU_LABEL[h.bu] ?? h.bu, bu: h.bu };
            return { key: `${h.bu}·${h.sbu}`, label: `${BU_LABEL[h.bu] ?? h.bu} • ${SBU_LABEL[h.sbu] ?? h.sbu}`, bu: h.bu };
          };
          const grouped: { key: string; label: string; bu: string; items: typeof buckets }[] = [];
          if (level !== "bu") {
            const idx = new Map<string, number>();
            for (const b of buckets) {
              const par = parentInfo(b.code);
              let i = idx.get(par.key);
              if (i === undefined) { i = grouped.length; idx.set(par.key, i); grouped.push({ key: par.key, label: par.label, bu: par.bu, items: [] }); }
              grouped[i].items.push(b);
            }
          }
          // Above-the-line = combined FUNDED nodes; below-the-line = combined NOT-FUNDED nodes (operator). One
          // funding line splits the two. Each node card shows that node's count + financials for the side.
          const sumSide = (side: "funded" | "unfunded") => buckets.reduce((s, b) => ({ count: s.count + b[side].count, nreK: s.nreK + b[side].nreK }), { count: 0, nreK: 0 });
          const totF = sumSide("funded"), totU = sumSide("unfunded");
          const sideCards = (side: "funded" | "unfunded") => {
            const tone: "ok" | "bad" = side === "funded" ? "ok" : "bad";
            const withData = buckets.filter((b) => b[side].count > 0);
            if (!withData.length) return <div className="text-[10px] italic text-slate-600">none</div>;
            if (level === "bu") {
              return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{withData.map((b) => <React.Fragment key={b.code}>{cell(b.code, tone, b[side])}</React.Fragment>)}</div>;
            }
            const gs = grouped.map((g) => ({ ...g, items: g.items.filter((b) => b[side].count > 0) })).filter((g) => g.items.length);
            return (
              <div className="flex flex-col gap-2.5">
                {gs.map((g) => {
                  const c = BU_COLOR[g.bu] ?? "#64748b";
                  return (
                    <div key={g.key}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-px w-4 shrink-0" style={{ background: c }} />
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: c }}>{g.label}</span>
                        <span className="h-px flex-1 bg-slate-800" />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{g.items.map((b) => <React.Fragment key={b.code}>{cell(b.code, tone, b[side])}</React.Fragment>)}</div>
                    </div>
                  );
                })}
              </div>
            );
          };
          return (
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Funding buckets · {levelLabel} · above the line = FUNDED · below = NOT FUNDED · live $/{CADENCE_UNIT[cadence].short} burn</span>
                <span className="text-[10px] text-slate-500">a project sits in one bucket, set by the funding line</span>
              </div>
              {/* Funded cards above the line, unfunded below — one reusable divider (R-Core) carries the
                  symmetric ▲ Above · Funded / ▼ Below · Not funded labels, identical to the rack. */}
              {sideCards("funded")}
              <div className="my-2.5"><FundingDivider availK={availK} above={{ count: totF.count, nreK: totF.nreK }} below={{ count: totU.count, nreK: totU.nreK }} /></div>
              {sideCards("unfunded")}
            </div>
          );
        })()}
        {/* Allocation & UPSIDE — per node: financial-spend budget (editable), allocated (funded NRE), and the
            UPSIDE bucket = unallocated funds. The R&D envelope is split across nodes; a Lead can pin any budget. */}
        {(() => {
          const totUpsideK = alloc.reduce((s, n) => s + n.upsideK, 0);
          const totOverK = alloc.reduce((s, n) => s + n.overK, 0);
          return (
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Allocation &amp; upside · {levelLabel} · budget → allocated → unallocated (upside)</span>
                <span className="text-[10px] text-slate-400">Σ upside <b className="tabular-nums text-cyan-300">{k(totUpsideK)}</b>{totOverK > 0 && <> · Σ over <b className="tabular-nums text-rose-300">{k(totOverK)}</b></>}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {alloc.map((n) => {
                  // W-8 · THE SAME RULE, FROM THE SAME HELPER. Shipping "if OVER, no UPSIDE" to the
                  // dashboard card alone would leave THIS surface — the editable twin, down to Alpha Group —
                  // still printing "Upside $0.0M" beside "Over $17.0M". That is the two-surface drift F0 and
                  // W-3 each caught the hard way, and it is cheaper to not create it than to find it later.
                  // This panel keeps its extra rows (editable Budget, $/min); "only 3 fields" was the
                  // dashboard card's rule, not this one's.
                  const head = allocHeadroom(n);
                  const split = allocBarSplit(n);
                  const firstTone = split.over ? "bg-slate-500" : n.utilPct >= 90 ? "bg-amber-500" : "bg-emerald-500";
                  const secondTone = split.over ? "bg-rose-500" : "bg-cyan-500";
                  return (
                    <div key={n.code} className="rounded-lg border border-slate-800 bg-[#0b0f14] p-2.5">
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-slate-100">{n.code}</span>
                        <span className="text-[9px] text-slate-500 truncate">{n.label}</span>
                      </div>
                      <div className="mb-1.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-800" title={`${n.utilPct}% of budget allocated`}>
                        <div className={`h-full ${firstTone}`} style={{ width: `${split.firstPct}%` }} />
                        <div className={`h-full ${secondTone}`} style={{ width: `${split.secondPct}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                        <span className="text-slate-500">{t("innovation.alloc.budget")}</span>
                        <span className="text-right">
                          {canEditBudget ? (
                            <input type="text" inputMode="numeric" defaultValue={String(Math.round(n.budgetK))} aria-label={`${t("innovation.alloc.budget")} ${n.code} ($K)`}
                              onBlur={(e) => { const v = +e.target.value; if (/^\d+$/.test(e.target.value)) onSetBudget(level, n.code, v); }}
                              className="w-16 rounded border border-slate-700 bg-[#0e141b] px-1 py-1 text-right tabular-nums text-slate-100 outline-none focus:border-cyan-500" />
                          ) : <span className="tabular-nums text-slate-200">{k(n.budgetK)}</span>}
                          {budgetOverrideK(level, n.code) != null && <button onClick={() => onSetBudget(level, n.code, null)} title={t("innovation.alloc.reset")} aria-label={`${t("innovation.alloc.reset")} · ${n.code}`} className="ml-1 text-[11px] text-slate-500 hover:text-cyan-300">↺</button>}
                        </span>
                        <span className="text-slate-500">{t("innovation.alloc.allocated")}</span><span className="text-right tabular-nums text-slate-300">{k(n.allocatedK)}</span>
                        {head.kind === "over"
                          ? (<><span className="text-rose-400">{t("innovation.alloc.over")}</span><span className="text-right tabular-nums text-rose-300">{k(head.k)}</span></>)
                          : (<><span className="text-cyan-400">◆ {t("innovation.alloc.upside")}</span><span className="text-right tabular-nums text-cyan-300">{k(head.k)}</span></>)}
                        <span className="text-slate-500" title="Live burn of the funded projects at this node">$/{CADENCE_UNIT[cadence].short}</span><span className="text-right tabular-nums text-amber-300">{fmtPerCadence(n.perMinUsd, cadence)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!canEditBudget && <p className="mt-2 text-[9px] text-slate-600">{t("innovation.alloc.leadOnly")}</p>}
            </div>
          );
        })()}
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0e141b]">
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 text-left">{levelLabel}</th>
                <th className="px-2 py-2 text-center">Projects</th>
                <th className="px-2 py-2 text-right">Spend (R&amp;D)</th>
                <th className="px-2 py-2 text-right">Funded</th>
                <th className="px-2 py-2 text-right">Not funded</th>
                <th className="px-2 py-2 text-right">NPV</th>
                <th className="px-2 py-2 text-right" title="Unfunded NPV at risk (below the funding line)">@Risk</th>
                <th className="px-2 py-2 text-right" title="Value density — NPV $M per R&amp;D $M">Val/$</th>
                <th className="px-2 py-2 text-right">P-wt Rev</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const isOpen = open.has(g.key);
                return (
                  <React.Fragment key={g.key}>
                    <tr onClick={() => setOpen((s) => { const n = new Set(s); n.has(g.key) ? n.delete(g.key) : n.add(g.key); return n; })} className="cursor-pointer border-b border-slate-900 hover:bg-slate-800/30">
                      <td className="px-3 py-1.5 font-mono text-cyan-300"><span className="mr-1 text-slate-500">{isOpen ? "▾" : "▸"}</span>{g.key}{level === "sbu" && SBU_LABEL[g.key] ? <span className="ml-1 text-[10px] text-slate-500">{SBU_LABEL[g.key]}</span> : ""}</td>
                      <td className="px-2 py-1.5 text-center tabular-nums text-slate-300">{g.ps.length}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-200">{k(g.spendK)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-emerald-400">{g.funded.length} · {k(g.fundedSpendK)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-rose-400">{g.unfunded.length} · {k(g.unfundedSpendK)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-200">{usd(g.npv)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-rose-400">{usd(g.unfundedNpv)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-amber-300">{g.valueDensity.toFixed(1)}×</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-300">{usd(g.wrev)}</td>
                    </tr>
                    {isOpen && g.ps.map((p) => {
                      const isFunded = fundedIds.has(p.id);
                      return (
                        <tr key={p.id} className="border-b border-slate-900/50 text-[12px]">
                          <td className="px-3 py-1 pl-6 text-slate-300" colSpan={2}>
                            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${isFunded ? "bg-emerald-500" : "bg-rose-500"}`} />{p.name}
                            <button onClick={(e) => { e.stopPropagation(); downloadBdPacket(p); }} title={t("innovation.budget.bdPacket")}
                              className="ml-2 rounded border border-cyan-500/40 px-1 py-0 text-[9px] font-medium text-cyan-300 hover:bg-cyan-500/10">⬇ {t("innovation.budget.bdPacket")}</button>
                            {!isFunded && (
                              <span className="ml-2 text-[9px] text-slate-500">
                                {t("innovation.budget.gap")} <b className="tabular-nums text-amber-400">{usd(Math.max(0, incrementalRevM(p) - weightedRevM(p)))}</b> · {t("innovation.budget.evIfFunded")} <b className="tabular-nums text-emerald-400/80">{usd(Math.max(0, npvM(p)))}</b>
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-right tabular-nums text-slate-400">{k(p.nreK)}</td>
                          <td className="px-2 py-1 text-right text-[10px] uppercase tracking-wider" colSpan={2}><span className={isFunded ? "text-emerald-400" : "text-rose-400"}>{isFunded ? "funded" : "not funded"}</span></td>
                          <td className="px-2 py-1 text-right tabular-nums text-slate-300">{usd(npvM(p))}</td>
                          <td className="px-2 py-1 text-right tabular-nums text-rose-400/70">{isFunded ? "" : usd(npvM(p))}</td>
                          <td className="px-2 py-1 text-right tabular-nums text-amber-300/70" title="Cost per served buyer-segment">{k(costPerServedBuyerOf(p, Math.max(1, p.segmentValueProps?.length ?? 1)) / 1000)}</td>
                          <td className="px-2 py-1 text-right tabular-nums text-slate-400">{usd(weightedRevM(p))}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800">Funded vs not-funded is set by the global funding line (Σ R&amp;D ≤ available). Balance budgets by reprioritizing the stack — unfunded projects fall below the line.</p>
      </div>
    </div>
  );
}

// Risk-level pill: colour by level (low=emerald, med=amber, high=rose).
function RiskPill({ label, level }: { label: string; level: Project["tech"] }) {
  const c = level === "low" ? "bg-emerald-500/15 text-emerald-300" : level === "med" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${c}`}>{label} {RISK_LABEL[level]}</span>;
}

function ProjectDetail({ p, risks, setRisks, setup, maximized, onToggleMax, onEdit, onApprove }: {
  p: Project; risks: Risk[]; setRisks: (r: Risk[]) => void; setup: BizSetup; maximized?: boolean; onToggleMax?: () => void;
  onEdit: (patch: Partial<Project>, changes: string[]) => void;
  onApprove: (kind: "approve" | "reject", by: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const { t } = useLexicon();
  // ONE CLOCK here too — same discipline as the deck root. Read once so a panel open across midnight on
  // 31 December cannot silently re-anchor the plan it is measuring.
  const baseYear = useMemo(() => new Date().getFullYear(), []);
  const [showExec, setShowExec] = useState(false);
  const [draft, setDraft] = useState<Partial<Project>>({});
  const [vpView, setVpView] = useState<"HI" | "AI">(p.valuePropSource ?? "HI"); // HI⇄AI value-prop toggle
  const [finDeck, setFinDeck] = useState(false); // F2 — shared financial source editor (opened from dog-tag / overview / slide)
  const openFinancials = () => setFinDeck(true);
  const [vpDeck, setVpDeck] = useState(false);
  const [veqMax, setVeqMax] = useState(false); // G1b — full-screen the Value Proposition card (Celestial-2525-style)
  // Backfill: seed from derived drivers when none are hand-scored, so the waterfall is populated for every project.
  const [veqDrivers, setVeqDrivers] = useState<ValueDriver[]>(p.valueDrivers?.length ? p.valueDrivers : derivedDriversOf(p));
  useEffect(() => { setDraft({}); setEditing(false); setVpView(p.valuePropSource ?? "HI"); setVeqDrivers(p.valueDrivers?.length ? p.valueDrivers : derivedDriversOf(p)); }, [p.id, p.valuePropSource, p.valueDrivers]);
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
  // X-4 · THE CANONICAL TWELVE (operator: "Reduce Metrics to 12 key for decision making"). This set is not
  // a preference — it is already written down and locked in the lib as the FLIR twelve, and the heading
  // count is derived (`{metrics.length}-metric set`), so it re-labels itself.
  // ⚠ REMOVING THESE TWO DELETES A LIVE BUG RATHER THAN RELABELLING ONE. `Unit COGS` was `k(ex.cogsK)`,
  // where `k` is the $K→$M converter and `ex.cogsK` is a PER-UNIT price in $K. Executed: a ~$40k unit cost
  // rendered "$0.0M" — the value was right and the tile destroyed it by applying a program-scale converter
  // to a per-unit figure. The same number renders correctly as `${ex.cogsK}k` elsewhere, so the converter
  // is right everywhere else and was wrong only here. `COGS (10-Yr)` goes with it as the other tile outside
  // the canonical set; both were bolted on and neither is backed by a locked `FinMetrics` field.
  const metrics: [string, string][] = [
    ["NPV", usd(fm.npvM)], ["REV/NRE", `${fm.revOverNre.toFixed(1)}×`], ["IRR", `${fm.irrPct}%`],
    ["Gross Margin", `${fm.grossMarginPct}%`], ["Payback", `${payb(fm.paybackYears)}`], ["Quantity (10-Yr)", fm.vol10y.toLocaleString()],
    ["10-Yr Revenue", usd(fm.rev10yM)], ["10-Yr Gross Profit", usd(fm.grossProfit10yM)], ["Cur-Yr Op Expense", k(fm.curYearOpexK)],
    ["Total R&D Op Ex", k(fm.totalRdOpexK)], ["Capital", k(fm.capitalK)], ["Man Hours", `${(fm.manHours / 1000).toFixed(1)}k`],
  ];
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      {/* F0 — shared financial source editor: one tap from the dog-tag / overview / slide opens the SAME
          editor, deep-linked to the slide that OWNS the money record with its source panel expanded.
          This said S3 until now, which stopped working the moment the source panel was gated to S10 — both
          entry points landed on a slide with no editor and nothing happened. The target is read from
          SOURCE_SLIDE so it can never drift from the panel gate again. */}
      {finDeck && <SlideShowModal p={p} startSlide={sourceSlideOf("S10", "spend") ?? "S10"} openSource onEditSource={onEdit} onClose={() => setFinDeck(false)} />}
      {/* Same pattern for the value prop: one editor, reached from wherever the record is being read. */}
      {vpDeck && <SlideShowModal p={p} startSlide={sourceSlideOf("S8", "vprop") ?? "S8"} openSource onEditSource={onEdit} onClose={() => setVpDeck(false)} />}
      {/* Dog-tag summary — SBU (left) · name (top) · launch date (right) · configurable highlights */}
      <div className="mb-3"><DogTag p={p} onEditFinancials={openFinancials} /></div>
      {/* Under the dog tag: consistency (left) · Outcome brief (center) · expand/collapse (upper-right).
          Operator: outcome in the middle, expand/collapse icon in the upper right. */}
      {(() => { const c = consistencyCheck(p); return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${c.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}
            title={c.ok ? "value prop · NBA · drivers · segments aligned" : c.issues.join(" · ")}>
            {c.ok ? `✓ ${t("innovation.consistency.ok")}` : `⚠ ${t("innovation.consistency.gaps")} (${c.issues.length})`}
          </span>
          <button onClick={() => downloadOutcomeBrief(p)} className="rounded border border-cyan-500/40 px-2 py-0.5 text-[10px] font-medium text-cyan-300 hover:bg-cyan-500/10">⬇ {t("innovation.export.outcomeBrief")}</button>
          {onToggleMax
            ? <button onClick={onToggleMax} title={maximized ? "Restore" : "Maximize deep-dive"} aria-label={maximized ? "Restore" : "Maximize deep-dive"}
                className="rounded border border-slate-700 px-1.5 py-0.5 text-[13px] leading-none text-slate-300 hover:bg-slate-800">{maximized ? "⤡" : "⤢"}</button>
            : <span className="w-6" aria-hidden="true" />}
        </div>
      ); })()}
      {/* Value proposition — HI master (must-have) with a HI⇄AI toggle, the Next Best Alternative,
          and per-needs-segment props (recommended). AI rendition is minted at submission. */}
      <div className={veqMax ? "fixed inset-0 z-[55] overflow-y-auto bg-[#0b0f14] p-4 sm:p-6" : "mb-3 rounded-lg border border-cyan-500/20 bg-[#0b0f14] p-3"}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-cyan-400">Value proposition</div>
          <div className="flex items-center gap-2">
          {/* G1b — full-screen / minimize the whole Value Proposition card (Celestial-2525-style) */}
          <button onClick={() => setVeqMax((v) => !v)} title={veqMax ? "Minimize" : "Full screen"} aria-label={veqMax ? "Minimize value proposition" : "Full screen value proposition"}
            className="rounded border border-slate-700 px-1.5 py-0.5 text-[13px] leading-none text-slate-300 hover:bg-slate-800">{veqMax ? "⤡" : "⤢"}</button>
          <div className="flex overflow-hidden rounded-md border border-slate-700 text-[10px]" title="Toggle the best-in-class human (HI) version vs the AI-generated rendition">
            {(["HI", "AI"] as const).map((v) => (
              <button key={v} onClick={() => setVpView(v)}
                className={`px-2 py-0.5 font-semibold ${vpView === v ? (v === "HI" ? "bg-violet-500 text-white" : "bg-cyan-500 text-[#06202a]") : "text-slate-400 hover:bg-slate-800"}`}>
                {v === "HI" ? "웃 HI" : "◬ AI"}
              </button>
            ))}
          </div>
          </div>
        </div>
        <p className="mt-1 text-[12px] leading-snug text-slate-200">{vpView === "AI" ? aiValuePropOf(p) : valuePropOf(p)}</p>
        {vpView === "AI" && <p className="mt-1 text-[9px] uppercase tracking-wider text-cyan-500/70">AI rendition · authored to spark improvement of the human version</p>}
        {/* Next Best Alternative — the current competitive alternative / As-Is solution to beat */}
        <div className="mt-2 flex items-center justify-between gap-2 rounded border border-amber-500/20 bg-amber-500/[0.04] px-2 py-1.5">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-amber-400/90">Next Best Alternative</span>
            <p className="text-[11px] leading-snug text-slate-300">{nbaOf(p)}</p>
          </div>
          <span className="shrink-0 rounded border border-amber-500/40 px-2 py-0.5 text-[10px] font-medium text-amber-300">◇ {t("innovation.veq.title")}</span>
        </div>
        {/* Value Equation — always shown (operator): the Competitive Value Prop (our value vs the NBA) is on screen. */}
        <div className="mt-2">
          {/* READ-ONLY HERE. S8 owns the value proposition — the sentence, the NBA and the drivers — so this
              card explores the equation without being a second place to save it. Two editable surfaces for
              one record is the duplication this work exists to end; the way in is the deep link below, which
              lands on S8 with its source panel open. `onChange` still drives the local sliders so the card
              stays interactive; nothing it does is written. */}
          {/* W-1b · READ MODE. Operator: "On project tab with Value prop, remove sliders (sliders only for
              S8). Only have importance (5 bar), and vs NBA (Above, Equal, Below) on this chart." The card
              still shows every number; it simply stops offering a control that writes nowhere — which is
              what made it read as a second editor. */}
          <ValueEquationPanel mode="read" project={p}
            drivers={veqDrivers} onChange={setVeqDrivers} nbaLabel={nbaOf(p)} addressableRevM={incrementalRevM(p)}
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[9px] text-slate-500">Exploring — S8 is where the value proposition is saved.</span>
            <button onClick={() => setVpDeck(true)} title="Open S8 with the value-proposition editor expanded"
              className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/20">
              <span aria-hidden>◈</span> Edit on S8 <span aria-hidden>→</span>
            </button>
          </div>
        </div>
        {p.segmentValueProps && p.segmentValueProps.length > 0 ? (
          <ul className="mt-2 space-y-0.5">
            {p.segmentValueProps.map((s, i) => (
              <li key={i} className="text-[11px] leading-snug text-slate-400">
                <span className="font-mono text-slate-500">{s.segment || "Segment"}:</span> {s.prop}
                {s.confidence ? <span className="ml-1 text-[9px] text-cyan-400">c{s.confidence}</span> : null}
                {(s.pain || s.outcome) && <span className="block pl-3 text-[10px] text-slate-500">{s.pain ? `pain: ${s.pain}` : ""}{s.pain && s.outcome ? " · " : ""}{s.outcome ? `outcome: ${s.outcome}` : ""}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-[10px] text-slate-500">Recommended: add per-needs-based-segment value props to sharpen BD/Sales targeting.</p>
        )}
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{p.name}</h3>
          <div className="text-[11px] text-slate-500">{p.division} · {p.manager} · {GATE_STAGE[p.gate]} ({p.gate}) · 1st rev {p.firstRevenue}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExec((s) => !s)} title="Expandable executive slide (2-screen swipe overview)"
            className={`rounded border px-2 py-0.5 text-[11px] ${showExec ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>▤ Exec slide</button>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-mono text-amber-300">±{Math.round(band * 100)}% band</span>
          {/* Maximize/restore moved to the upper-right of the dog-tag row (operator). */}
        </div>
      </div>

      {/* Edit + Approvals bar */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <button onClick={() => setEditing((e) => !e)} className={`rounded border px-2 py-0.5 ${editing ? "border-cyan-500 text-cyan-300 bg-cyan-500/10" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>{editing ? "✕ Cancel" : "✎ Edit"}</button>
        {editing && <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded bg-cyan-500 px-2 py-0.5 font-semibold text-[#06202a] hover:bg-cyan-400"><Save className="h-3 w-3" aria-hidden /> Save</button>}
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
          {/* F1 · THE SECOND DOOR IS CLOSED. These three were free-text inputs writing straight to the
              scalars while S10's grid claimed to be the only place financials are typed — so the same three
              numbers could be authored in two places and disagree, and INV-1 (ONE DOOR) was false in fact
              while two shipped commit messages said it was true. They are now READ-OUTS of the grid: every
              figure is Σ of the plan via `finRollup`, and the one way to change any of them is the S10
              editor, reached by the button below (`openFinancials`, already the route four other surfaces
              use — no new navigation was invented for this). Counted, not named: a lock asserts ProjectDetail
              offers ZERO writable money inputs, so a new one added here tomorrow fails without a list to
              update. */}
          {(() => {
            const roll = finRollup(finOf(p, baseYear));
            const cell = (label: string, val: number, unit: string) => (
              <label key={label} className="text-slate-400">{label}
                <span className="mt-0.5 flex items-baseline gap-1 rounded border border-emerald-500/25 bg-emerald-500/[0.04] px-1.5 py-0.5 text-xs tabular-nums text-emerald-300">
                  {val.toLocaleString()}<span className="text-[9px] text-slate-500">{unit}</span>
                </span>
              </label>
            );
            return (<>
              {cell("NRE $K", roll.nreK, "Σ S10 spend")}
              {cell("New rev 10yr $M", roll.fullRev10yM, "Σ Step 1b")}
              {cell("Do-nothing 10yr $M", roll.doNothing10yM, "Σ Step 2")}
              <label className="col-span-2 sm:col-span-3 text-[10px] text-slate-500">
                <button type="button" onClick={openFinancials}
                  className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/20">
                  ✎ {SOURCE_LABEL.S10}
                </button>
                <span className="ml-2">These three are totals of the S10 grid — change them there and every surface follows.</span>
              </label>
            </>);
          })()}
          {/* GATE LADDER — Concept forecasts current+3, Plan current+5, Develop current+10. The option text
              carries its own requirement so the ladder is legible at the moment of the decision, and a stage
              whose years are not yet forecast says so instead of failing silently at the review. The gate is
              NOT blocked: a board can advance a project for reasons the grid does not know about, and locking
              33 seeded projects out of their own stage would be a worse defect than the one being fixed. */}
          <label>Gate
            <select value={dv("gate")} onChange={(e) => setD("gate", e.target.value as Project["gate"])} className={`mt-0.5 block w-full ${editStyle}`}>
              {GATES.map((g) => <option key={g} value={g}>{g} {GATE_STAGE[g]} · {visibleYearCount(g)} yr</option>)}
            </select>
            {(() => {
              const g = (dv("gate") ?? p.gate) as Project["gate"];
              const r = finGateReadiness(finOf(p, baseYear), g);
              return r.ready
                ? <span className="mt-0.5 block text-[9px] text-emerald-400/90">S10 forecasts all {r.need} years this stage needs.</span>
                : <span className="mt-0.5 block text-[9px] text-amber-400/90">S10 forecasts {r.filled} of the {r.need} years {GATE_STAGE[g]} needs — missing {r.missing.map((y) => yearLabel(y)).join(", ")}.</span>;
            })()}
          </label>
          <label>Tech Risk<select value={dv("tech")} onChange={(e) => setD("tech", e.target.value as Project["tech"])} className={`mt-0.5 block w-full ${editStyle}`}>{["low", "med", "high"].map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
          <label>Comm Risk<select value={dv("comm")} onChange={(e) => setD("comm", e.target.value as Project["comm"])} className={`mt-0.5 block w-full ${editStyle}`}>{["low", "med", "high"].map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
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
      {/* Tech × Comm Risk → revenue captured / upside (operator default model) */}
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
      {/* The full Risk Register for THIS project, directly under the rollup that summarises it (operator,
          2026-07-29). It used to sit on the main page with a Project dropdown and every project's rows;
          under one project the rollup and the register are ONE risk region instead of two places to look. */}
      <div className="mt-3">
        <RiskRegister risks={risks} setRisks={setRisks} p={p} />
      </div>
      {/* Meta Data (FLIR §2.1 / IMG_7843): Strategic Initiative · Value Ladder · Target Market · Competitive */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-cyan-300" title="Strategic Initiative">◎ {meta.initiative}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Value Ladder position">▦ {meta.valueLadder}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Value Ladder impact">↗ {meta.valueImpact}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Competitive position">⚑ {meta.competitive}</span>
        <span className="rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-300" title="Target market">◈ {meta.targetMarket}</span>
      </div>
      {/* Project Metrics — full FLIR card set (§2.4 / IMG_7843) + Quantity & COGS */}
      <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">Project Metrics · {metrics.length}-metric set</div>
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
      <FinancialsOverviewTable p={p} onEdit={openFinancials} />
      {/* AMTS Product-Management-Summary exec fields — Functional Leads · COGS/MSRP/Margin · Customer */}
      <div className="mt-3 border-t border-slate-800 pt-3 text-[11px]">
        <div className="grid grid-cols-3 gap-1.5">
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
        {/* SoI Trinity colours (operator): Needs=Red · Outcomes=Sunset · Solution=Cyan · Evidence=Violet */}
        {([["Needs", brief.needs, "#f87171"], ["Outcomes", brief.outcomes, "#f7b955"], ["Solution", brief.solution, "#22d3ee"], ["Evidence", brief.evidence, "#a78bfa"]] as const).map(([title, items, color]) => (
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
  const { t } = useLexicon();
  const [screen, setScreen] = useState(0);            // 0 = overview · 1 = detail · 2 = BD pipeline
  const [custReady, setCustReady] = useState(false);  // Slice 6 — strip internal cost/IRB for external showings
  const NSCREENS = 3;
  const touchX = React.useRef<number | null>(null);
  const go = (n: number) => setScreen(Math.max(0, Math.min(NSCREENS - 1, n)));
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(screen + (dx < 0 ? 1 : -1)); // swipe left → next, right → prev
    touchX.current = null;
  };
  const eq = valueEquationOf(p);
  const scorecard: [string, string][] = [
    ["NPV", usd(npvM(p))], ["Val/$", `${valuePerDollarOf(p).toFixed(1)}×`], ["Win P50", `${Math.round(winProbabilityOf(p).p50 * 100)}%`],
    ["EVC", `$${eq.evcUsdM.toFixed(0)}M`], ["Pipeline", `${p.segmentValueProps?.length ?? 0} seg`],
  ];

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
        <div className="flex items-start gap-4 text-right">
          <div><div className="text-[9px] uppercase tracking-wider text-slate-500">1st Rev</div><div className="text-xs font-mono text-slate-200">{p.firstRevenue}</div></div>
          <div><div className="text-[9px] uppercase tracking-wider text-slate-500">3-Yr NPV</div><div className="text-xs font-mono text-emerald-400">{usd(fm.npvM)}</div></div>
          <div><div className="text-[9px] uppercase tracking-wider text-slate-500">IRR</div><div className="text-xs font-mono text-slate-200">{fm.irrPct}%</div></div>
          <button onClick={() => setCustReady((v) => !v)} title={t("innovation.exec.internalHidden")}
            className={`rounded border px-2 py-1 text-[10px] font-medium ${custReady ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-slate-700 text-slate-400 hover:bg-slate-800"}`}>
            {custReady ? "◉" : "○"} {t("innovation.exec.customerReady")}
          </button>
        </div>
      </div>
      {/* Scorecard strip (Slice 6) — NPV · Val/$ · Win P50 · EVC · pipeline at a glance */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-800 bg-[#0b0f14] px-3 py-1.5">
        <span className="text-[9px] uppercase tracking-wider text-slate-500">{t("innovation.exec.scorecard")}</span>
        {scorecard.map(([label, val]) => (
          <span key={label} className="text-[11px]"><span className="text-slate-500">{label}</span> <b className="tabular-nums text-slate-200">{val}</b></span>
        ))}
        <span className="ml-auto text-[11px]"><span className="text-slate-500">vs NBA</span> <b className="tabular-nums text-amber-300">+${Math.round(eq.differentiationM)}M</b></span>
      </div>

      {/* Two-screen swipe carousel — touch swipe + ← → keyboard (a11y), ARIA carousel semantics */}
      <div className="mt-3 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        role="group" aria-roledescription="carousel" aria-label="Executive slide — overview and detail"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { go(screen + 1); e.preventDefault(); } else if (e.key === "ArrowLeft") { go(screen - 1); e.preventDefault(); } }}>
        <div className="flex transition-transform duration-300 ease-out" style={{ width: "300%", transform: `translateX(-${screen * (100 / 3)}%)` }}>
          {/* ── Screen ① OVERVIEW ─────────────────────────────────────────────── */}
          <div className="w-1/3 shrink-0 pr-1.5" role="group" aria-roledescription="slide" aria-label="① Overview" aria-hidden={screen !== 0}>
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
                  <div className="rounded bg-[#0b0f14] px-2 py-1.5"><div className="text-[9px] uppercase tracking-wider text-slate-500">Payback</div><div className="font-mono tabular-nums text-slate-200">{payb(fm.paybackYears)}</div></div>
                </div>
              </div>
            </div>
            {/* Reconciliation two-read (Slice 6) — engineering read | business/BD read, one shared picture */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.04] p-2">
                <div className="text-[9px] uppercase tracking-wider text-violet-300">웃 {t("innovation.exec.engRead")}</div>
                <div className="mt-1 text-[11px] leading-snug text-slate-300">AI·SI·HI {Math.round(p.ai * 100)}/{Math.round(p.si * 100)}/{Math.round(p.hi * 100)} · HI load {Math.round(p.humanLoad * 100)}% · deps {deps.length}↓ · risk {riskBandOf(p).technical}/{riskBandOf(p).commercial}</div>
              </div>
              <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/[0.04] p-2">
                <div className="text-[9px] uppercase tracking-wider text-cyan-300">◬ {t("innovation.exec.bizRead")}</div>
                <div className="mt-1 text-[11px] leading-snug text-slate-300">{h.sbu} · launch {p.firstRevenue} · NPV {usd(npvM(p))} · EVC ${eq.evcUsdM.toFixed(0)}M · +${Math.round(eq.differentiationM)}M vs NBA</div>
              </div>
            </div>
          </div>

          {/* ── Screen ② DETAIL ───────────────────────────────────────────────── */}
          <div className="w-1/3 shrink-0 px-1.5" role="group" aria-roledescription="slide" aria-label="② Detail" aria-hidden={screen !== 1}>
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
              {/* Critical Issues & Risks — internal; hidden in customer-ready (external) mode */}
              {custReady ? (
                <div className="sm:col-span-2 rounded-lg border border-slate-800 bg-[#0b0f14] p-2 text-[10px] text-slate-500">{t("innovation.exec.internalHidden")}</div>
              ) : (<>
              <div className="space-y-1.5">
                <SectionTitle>Critical Issues &amp; Risks</SectionTitle>
                {myRisks.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No risks logged — raise one in the Risk Register below.</p>
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
              </>)}
            </div>
          </div>

          {/* ── Screen ③ BD PIPELINE (Slice 6) — per-segment customer-facing claims vs the NBA ─────── */}
          <div className="w-1/3 shrink-0 pl-1.5" role="group" aria-roledescription="slide" aria-label="③ BD Pipeline" aria-hidden={screen !== 2}>
            <div className="space-y-2">
              <SectionTitle>{t("innovation.exec.pipeline")} · {t("innovation.exec.claim")} vs NBA</SectionTitle>
              {(p.segmentValueProps?.length ?? 0) === 0 ? (
                <p className="text-[11px] text-slate-500">Add per-needs-segment value props (in the value-prop creator) to build the BD pipeline view.</p>
              ) : (
                <ul className="space-y-1.5">
                  {p.segmentValueProps!.map((s, i) => {
                    const stages = ["Prospect", "Qualify", "Propose", "Commit"] as const; // deterministic per-index deal stage
                    return (
                      <li key={i} className="rounded-lg border border-slate-800 bg-[#0b0f14] p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300">{s.segment || `Segment ${i + 1}`}</span>
                          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400">{t("innovation.exec.dealStage")}: {stages[i % stages.length]}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-300">{s.prop}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-2 text-[11px] text-slate-300">
                Beats <b className="text-amber-300">{nbaOf(p)}</b> — +${Math.round(eq.differentiationM)}M · EVC ${eq.evcUsdM.toFixed(0)}M. BD feedback (win/loss/objection) flows back to the originating engineer via the activity log.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe controls — ‹ › + dots (① Overview · ② Detail · ③ BD Pipeline) */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2">
        <button onClick={() => go(screen - 1)} disabled={screen === 0}
          className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 disabled:opacity-30 enabled:hover:bg-slate-800">‹ Prev</button>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <button key={i} onClick={() => go(i)} aria-label={`screen ${i + 1}`}
              className={`h-2 w-2 rounded-full ${screen === i ? "bg-cyan-400" : "bg-slate-700 hover:bg-slate-600"}`} />
          ))}
          <span className="ml-1 text-[10px] text-slate-500">{screen === 0 ? "① Overview" : screen === 1 ? "② Detail" : "③ BD Pipeline"} · swipe →</span>
        </div>
        <button onClick={() => go(screen + 1)} disabled={screen === NSCREENS - 1}
          className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 disabled:opacity-30 enabled:hover:bg-slate-800">Next ›</button>
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
  // Cost-of-time rate follows the Mo/Wk/D/H/Min selector: cost ÷ time-in-that-unit ($/mo … $/min).
  const RATE_WORD: Record<TimeUnit, string> = { month: "mth", week: "week", day: "day", hour: "hr", minute: "min" };
  const costPerUnit = r.time.value > 0 ? r.cost.value / r.time.value : r.costPerMinUsd;
  const fmtRate = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}k` : `$${v.toFixed(2)}`);
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
        <span>Cost of time <b className="text-cyan-300">{fmtRate(costPerUnit)}/{RATE_WORD[unit]}</b></span>
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
// Per-slide HUMAN (HI) content the operator writes in the digital slide show — persisted per
// `${p.id}|${slide}` (localStorage-first + best-effort Supabase). The AI rendition (aiSlideOf) fills any
// gap so a slide is never blank; the per-slide HI⇄AI toggle mirrors the value-prop pattern (view-only key).
const SLIDE_HI_KEY = "innovation-slide-hi";
const SLIDE_LENS_KEY = "innovation-slide-lens"; // per-slide "HI"|"AI" view preference
// Field-level slide authoring (S1–S18 field spec) — batched per project: bag[projId][code][fieldId] =
// { hi, ai, mode }. One write per slide change, not eighteen. localStorage-first + best-effort Supabase.
const SLIDE_FIELDS_KEY = "innovation-slide-fields";
type FieldCell = { hi: SlideFieldValue; ai: SlideFieldValue; mode: "hi" | "ai" };
type ProjFieldBag = Record<string, Record<string, FieldCell>>; // code -> fieldId -> cell
const readFieldBags = (): Record<string, ProjFieldBag> => { try { return JSON.parse(lsGet(SLIDE_FIELDS_KEY) || "{}"); } catch { return {}; } };
const writeFieldBags = (obj: Record<string, ProjFieldBag>) => { lsSet(SLIDE_FIELDS_KEY, JSON.stringify(obj)); void saveState("slide-fields", obj as unknown as Record<string, string>); };
// CS + RA closeout slides read LIVE governance from the same stores Board() writes (audit trail + membership).
const readAudit = (): AuditEntry[] => { try { const a = JSON.parse(lsGet("innovation-audit") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
const readMembers = (): MembershipMap => { try { const m = JSON.parse(lsGet("innovation-members") || "{}"); return m && typeof m === "object" ? m : {}; } catch { return {}; } };
// Per-slide VERSION HISTORY store (append-and-merge; never overwrite) — powers the replay scrubber + CS trail.
const SLIDE_VERSIONS_KEY = "innovation-slide-versions";
const readVersions = (): Record<string, SlideVersion[]> => { try { const v = JSON.parse(lsGet(SLIDE_VERSIONS_KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
const writeVersions = (obj: Record<string, SlideVersion[]>) => { lsSet(SLIDE_VERSIONS_KEY, JSON.stringify(obj)); void saveState("slide-versions", obj as unknown as Record<string, string>); };
const fieldEmpty = (v: SlideFieldValue): boolean => {
  if (v == null) return true;
  if (typeof v === "string") return !v.trim();
  if (Array.isArray(v)) return (v as unknown[]).filter((r) => Array.isArray(r) ? (r as string[]).some((c) => c && c.trim()) : (r && String(r).trim())).length === 0;
  if (typeof v === "object") return Object.values(v).every((x) => !x || !String(x).trim());
  return false;
};

// Gate/IRB upgrade (Slice 4) — tri-lens sign-off + ledger + per-gate confidence. localStorage-first with
// best-effort Supabase write-through (matches the Slice-0 store). Keyed by `${id}|${gate}[|lens]`.
const SIGNOFF_KEY = "innovation-signoff";
const LEDGER_KEY = "innovation-ledger";
const GATECONF_KEY = "innovation-gateconf";
const SIGNOFF_STATES = ["", "green", "red"] as const; // pending → signed → blocked
type SignoffState = (typeof SIGNOFF_STATES)[number];
const readStore = (key: string): Record<string, string> => { try { return JSON.parse(lsGet(key) || "{}"); } catch { return {}; } };
// localStorage write is instant; the cloud write is debounced per-name (~800ms trailing) so a textarea
// edit doesn't re-upload the whole blob per keystroke (council: Thor/Krishna/Odin). Mirrors the projects push.
const _cloudTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const writeStore = (key: string, name: string, obj: Record<string, string>) => {
  lsSet(key, JSON.stringify(obj));
  if (_cloudTimers[name]) clearTimeout(_cloudTimers[name]);
  _cloudTimers[name] = setTimeout(() => { void saveState(name, obj); }, 800);
};

// Gate progression — measured by review-slide progression across gates G1–G7 (no fixed
// stage-count reference). We surface the review slides completed so far and the slides needed
// next, each an editable gate-feedback input the operator sets to drive the next-gate decision.
function GateCube({ p, onEditSource }: { p: Project; onEditSource?: (patch: Partial<Project>, changes: string[]) => void }) {
  const { t } = useLexicon();
  const gi = GATES.indexOf(p.gate);
  const nextGate = GATES[gi + 1];                 // undefined once at the final gate
  const decGate = nextGate ?? p.gate;             // the gate under review (decision gate)
  const review = GATE_REVIEW[decGate];            // slides for the next gate (or the final gate)
  const [slides, setSlides] = useState<Record<string, string>>({});
  // Tri-lens sign-off + ledger + per-gate confidence (Slice 4) — localStorage-first, best-effort cloud.
  const [signoff, setSignoff] = useState<Record<string, string>>({});
  const [ledger, setLedger] = useState<Record<string, string>>({});
  const [gconf, setGconf] = useState<Record<string, string>>({});
  useEffect(() => { setSignoff(readStore(SIGNOFF_KEY)); setLedger(readStore(LEDGER_KEY)); setGconf(readStore(GATECONF_KEY)); }, []);
  const LENSES = [["eng", t("innovation.gate.eng")], ["biz", t("innovation.gate.biz")], ["bd", t("innovation.gate.bd")]] as const;
  const soState = (lens: string): SignoffState => (signoff[`${p.id}|${decGate}|${lens}`] as SignoffState) || "";
  const cycleSo = (lens: string) => setSignoff((prev) => {
    const key = `${p.id}|${decGate}|${lens}`, cur = (prev[key] as SignoffState) || "";
    const next = SIGNOFF_STATES[(SIGNOFF_STATES.indexOf(cur) + 1) % SIGNOFF_STATES.length];
    const upd = { ...prev, [key]: next }; writeStore(SIGNOFF_KEY, "signoff", upd); return upd;
  });
  const gateReady = LENSES.every(([l]) => soState(l) === "green");
  const confVal = Number(gconf[`${p.id}|${decGate}`] ?? "") || pSuccess(p);
  const setConf = (v: number) => setGconf((prev) => { const upd = { ...prev, [`${p.id}|${decGate}`]: String(v) }; writeStore(GATECONF_KEY, "gateconf", upd); return upd; });
  const ledgerText = ledger[`${p.id}|${decGate}`] ?? "";
  const setLedgerText = (v: string) => setLedger((prev) => { const upd = { ...prev, [`${p.id}|${decGate}`]: v }; writeStore(LEDGER_KEY, "ledger", upd); return upd; });
  const hand = handoffReadiness(p);
  useEffect(() => { try { setSlides(JSON.parse(lsGet(SLIDE_KEY) || "{}")); } catch { /* none */ } }, []);
  const slideStatus = (s: string) => slides[`${p.id}|${s}`] || "";
  const cycleSlide = (s: string) => setSlides((prev) => {
    const k = `${p.id}|${s}`, cur = prev[k] || "";
    const next = SLIDE_STATES[(SLIDE_STATES.indexOf(cur as (typeof SLIDE_STATES)[number]) + 1) % SLIDE_STATES.length];
    const upd = { ...prev, [k]: next };
    writeStore(SLIDE_KEY, "slides", upd);
    return upd;
  });
  const readyCount = review.deliverables.filter((d) => slideStatus(d.slide) === "approved").length;
  const allSlides = GATES.flatMap((g) => GATE_REVIEW[g].deliverables.map((d) => d.slide));
  const approvedSlides = allSlides.filter((s) => slideStatus(s) === "approved").length;
  const board = loadReviewBoard();
  const [deck, setDeck] = useState<{ open: boolean; slide?: string }>({ open: false });
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      {deck.open && <SlideShowModal p={p} startSlide={deck.slide} onEditSource={onEditSource} onClose={() => { setDeck({ open: false }); setSlides(readStore(SLIDE_KEY)); }} />}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Gate progression · {p.gate} {GATE_STAGE[p.gate]}</h3>
        <span className="text-[11px] text-slate-500">gate {gi + 1} of {GATES.length} · source of record</span>
      </div>
      {/* G1 → G7 on ONE line (deck parity — Robust Stage-Gate) — the stage strip; detail rows below. */}
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {GATES.map((g, ci) => {
          const state = ci < gi ? "done" : ci === gi ? "current" : ci === gi + 1 ? "next" : "future";
          const cls = state === "current" ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
            : state === "done" ? "border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-300"
            : state === "next" ? "border-amber-500/40 bg-amber-500/[0.06] text-amber-300"
            : "border-slate-800 text-slate-500";
          return (
            <div key={g} className={`min-w-[64px] flex-1 shrink-0 rounded border px-1 py-1 text-center ${cls}`} title={`${g} · ${GATE_STAGE[g]}`}>
              <div className="text-[11px] font-mono font-semibold">{g}{state === "done" || state === "current" ? " ✓" : ""}</div>
              <div className="truncate text-[8px] uppercase tracking-wider">{GATE_STAGE[g]}</div>
            </div>
          );
        })}
      </div>
      {/* Deliverables S1–S18 across gates G1–G7 — tap a slide to cycle its IRB gate feedback */}
      <div className="mt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
          <span className="uppercase tracking-wider">Deliverables · S1–S18 · {board} gate feedback</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setDeck({ open: true, slide: review.deliverables[0]?.slide })}
              className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 hover:bg-cyan-500/20">▶ {t("innovation.slides.open")}</button>
            <span className="font-mono text-slate-300">{approvedSlides}/{allSlides.length} approved</span>
          </div>
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

      {/* Tri-lens sign-off + confidence→EV + de-risk ledger + handoff-readiness (Slice 4) for the decision gate */}
      <div className="mt-3 rounded-lg border border-slate-800 bg-[#0b0f14] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">{t("innovation.gate.signoff")} · {decGate} {GATE_STAGE[decGate]}</span>
          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${gateReady ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/40 text-slate-400"}`}>{gateReady ? `✓ ${t("innovation.gate.ready")}` : t("innovation.gate.notReady")}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LENSES.map(([lens, label]) => {
            const st = soState(lens);
            const cls = st === "green" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : st === "red" ? "border-rose-500/50 bg-rose-500/10 text-rose-300" : "border-slate-700 text-slate-400 hover:bg-slate-800";
            return (
              <button key={lens} onClick={() => cycleSo(lens)} title="Tap to cycle: pending → signed → blocked"
                aria-label={`${label} sign-off: ${st === "green" ? "signed" : st === "red" ? "blocked" : "pending"} — tap to cycle`}
                className={`rounded border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
                {st === "green" ? "✓ " : st === "red" ? "✕ " : "○ "}{label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="flex items-center gap-2 text-[10px] text-slate-400">
            {t("innovation.gate.confidence")}
            <input type="range" min={0} max={1} step={0.05} value={confVal} onChange={(e) => setConf(+e.target.value)} className="w-24 accent-cyan-500" />
            <span className="tabular-nums text-slate-300">{Math.round(confVal * 100)}%</span>
          </label>
          <span className="text-[10px] text-slate-400">{t("innovation.gate.ev")} <b className="tabular-nums text-cyan-300">{usd(expectedValueOf(p, confVal))}</b></span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${hand.ready ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}
            title={`value prop ${hand.valueProp ? "✓" : "✕"} · segment ${hand.segment ? "✓" : "✕"} · measurable delta ${hand.delta ? "✓" : "✕"}`}>
            {hand.ready ? `✓ ${t("innovation.gate.handoff")}` : `⚠ ${t("innovation.gate.handoffGaps")}`}
          </span>
        </div>
        <textarea value={ledgerText} onChange={(e) => setLedgerText(e.target.value)} rows={2} maxLength={4000}
          placeholder={t("innovation.gate.ledgerPlaceholder")}
          className="mt-2 w-full resize-y rounded border border-slate-700 bg-[#0b0f14] px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-cyan-500" />
        <p className="mt-0.5 text-[9px] text-slate-600">{t("innovation.gate.ledger")}</p>
      </div>
    </div>
  );
}

// Digital slide show (S1–S18) — the schema-driven, FIELD-LEVEL gate deck for one project. Each slide is a
// set of typed fields (text · longtext · list · table · metrics · attach · chart) per the S1–S18 field spec.
// Every non-linked field carries an HI value + an AI draft toggled per field; `linked` fields read live from
// the project financial/BOM record (never typed twice → the deck can't disagree with the gate); `mirror`
// fields inherit until overridden. Gate readiness = filled required ÷ total required. Present mode renders
// the same fields as a full deck. This is the digital presentation: concept → slide detail → execution (WBS
// cost + schedule, S10/S14) → BOM at launch (S16) → validated G1→G7.
// B3 · AmtsPanel — THE single AMTS panel frame (Aset). Every per-slide panel COMPOSES this; none draws its
// own frame, so a spacing/typography fix lands once instead of once per slide. Matches the AMTS anatomy in
// docs/SOI2525_AMTS_SPEC.md §1: blue-title panel card + optional "REQUIRED: {gate}+" flag + body. Sized in
// cq units so it scales with the 16:9 SlideCanvas exactly like the header band and footer do.
// ── SLIDE_PRINT_CSS · the board artifact (/innovation backlog #4) ────────────────────────────────
// Grep-verified before writing: there is NO inverted colour scheme anywhere in the polling results view —
// the ONLY print idiom in this repo is PRINT_CSS in components/experiences/experiences-landing.tsx
// (inline <style> + @media print + @page + print-color-adjust: exact + a -noprint class). That idiom is
// reused verbatim here; the inversion itself is new because nothing to reuse existed.
//
// White page, COLOURED banners, black/grey text. Backgrounds are cleared and then the two banner surfaces
// get their tint back, so the sheet reads as the same document in reverse rather than a washed-out screen
// grab. Charts keep their colours: SVG paints with `fill`, which `background-color` cannot touch.
const SLIDE_PRINT_CSS = `
@media print {
  /* THE PAPER IS PAPER. The old rule declared size: 1600px 900px landscape — a custom size AND an
     orientation keyword at once, which is contradictory CSS, and it asserted that the sheet's 1600x900 px
     WAS the paper. The operator's paper is US Letter: at 100% scaling a 1600px sheet cannot fit an ~960px
     printable box, so it overflowed and clipped on the right in BOTH orientations. That is why the clip
     survived three fixes that were all aimed at fragmentation.
     Landscape and 0.5in are explicit operator requirements. Portrait still works — the sheet fills whatever
     printable box exists rather than demanding a fixed one. */
  @page { size: letter landscape; margin: 0.5in; }
  html, body { background: #fff !important; height: auto !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* Only the print stack paints. It is PORTALLED to <body>, so hiding body's other children is exact —
     and display:none (not visibility:hidden) removes them from FLOW, which is what stops the print engine
     paginating around boxes nobody can see. */
  body > *:not(.slide-print-stack) { display: none !important; }
  .slide-print-stack { position: static !important; display: block !important; width: 100%; margin: 0 !important; }
  /* The sheet FILLS the printable box and keeps the deck's 16:9. Because the canvas is a container-type:size
     box, every cqw/cqh inside it rescales proportionally — a true photographic reduction, the same law item 3
     established for portrait vs landscape. Deliberately NOT transform: scale(): WebKit ignores fragmentation
     inside a transformed box, which would re-break the pagination fixed in b7bad08.
       landscape Letter, 0.5in margins -> 10.0in x 5.625in
       portrait  Letter, 0.5in margins ->  7.5in x 4.219in   (both fit) */
  .slide-print-page { position: relative !important; width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; transform: none !important; }
  .slide-print-page [data-slide-canvas] { width: 100% !important; height: 100% !important; transform: none !important; }
  /* Screen zoom must never reach the exported PDF. Sheet already forces zoomOn=false for the print stack
     (it is the only caller that passes a style prop); this is the belt to that braces. */
  /* PRINT NEVER INHERITS A ZOOM. Z4 nested the scaled element one level deeper (viewport, sizer, scaled),
     so the old child-only reset stopped covering it and a zoomed screen would have carried its transform
     into the PDF. The descendant selector reaches every level. NO BACKTICKS IN HERE — this block is inside
     a template literal, and a stray one silently terminates the string. */
  /* ⚠ P3 · THIS RULE ERASED EVERY CHART BAR IN EVERY PDF, AND 'width: auto' WAS THE WHOLE OF IT.
     Z4 added 'width/height: auto !important' here to undo the body-zoom wrappers' percentage width.
     But the descendant selector reaches SVG too, and on an SVG <rect> width/height are CSS GEOMETRY
     PROPERTIES that OVERRIDE the presentation attributes — and auto computes to ZERO. Measured in the
     print sheet: <line> 611.8x0.0 (fine, it has no width property), <text> fine, and every <rect> 0.0x0.0
     with width="31.95" height="36.75" still on the attribute. So the waterfall printed its axis, its grid,
     its tick numbers and its value labels, and not one bar — in the LIGHT export as well as the dark one,
     which is why this was never a dark-mode bug but every PDF this deck has produced.
     Z5 DELETED THE WRAPPERS THIS WAS UNDOING, so the width/height half is now not merely harmful but dead.
     transform/overflow stay as a cheap guard against a re-introduced body zoom; geometry must never be
     touched by a blanket selector again. */
  [data-slide-zoom], [data-slide-zoom] * { transform: none !important; overflow: visible !important; }

  /* Both the modern and the LEGACY fragmentation properties — WebKit still wants the legacy pair. */
  .slide-print-page { break-inside: avoid; page-break-inside: avoid; }
  .slide-noprint { display: none !important; }
  .slide-printonly { display: inline !important; }
  .slide-print-page { break-after: page; page-break-after: always; overflow: hidden; }
  .slide-print-page:last-child { break-after: auto; page-break-after: auto; }
  .slide-print-stack [data-slide-canvas] { box-shadow: none !important; }

  /* ── P1 · TWO VERSIONS, ONE RENDERER ───────────────────────────────────────────────────────
     Operator: "generate a slide based off play mode (a version that is literally exact replica of
     computer screen black background), and another inverted version of black, where figure colors and
     value prop all stay the same color."

     ORIGINAL (.pdf-original) needs NO rules at all — it is this sheet, unmodified, so it is byte-identical
     to Present mode by construction rather than by a second stylesheet that could drift. Everything below
     is therefore scoped to .pdf-friendly. That asymmetry is the point: the exact replica cannot be wrong,
     because nothing acts on it.

     ⚠ AND THE INVERSION USED TO DESTROY DATA COLOUR — MEASURED, not suspected. Driving the print stack
     under @media print and diffing every element against itself on screen (keyed by structural path, after
     two probes gave false results — see the test comment) found colour that CARRIES MEANING being erased:
       · footer page-progress bars   rgb(100,116,139) -> transparent   x18 per sheet
       · chart legend swatches       emerald/sunset/coral/sky/cyan -> transparent
       · price-performance strip     rule + markers rgb(148,163,184) -> transparent
     A legend whose swatches are invisible is worse than no legend. '[data-ink]' marks a painted surface
     whose colour IS the datum; the blanket clear skips it. '*:not([data-ink])' is a SIMPLE :not (Selectors
     3) on purpose — a complex :not("not a descendant of") is Safari 16.4+, and an unsupported selector
     drops the WHOLE rule, which would print light-slate text on white paper. Fail-safe over elegant.
     (Panel-head glyph icons DO recolour cyan -> #0c4a6e. That is chrome, it is intended, and it is left.) */
  .slide-print-stack.pdf-friendly [data-slide-canvas] { background: #fff !important; }
  .slide-print-stack.pdf-friendly [data-slide-canvas] *:not([data-ink]) { background-color: transparent !important; color: #111827 !important; border-color: #cbd5e1 !important; }
  .slide-print-stack.pdf-friendly .text-slate-400, .slide-print-stack.pdf-friendly .text-slate-500, .slide-print-stack.pdf-friendly .text-slate-600 { color: #6b7280 !important; }
  .slide-print-stack.pdf-friendly [data-panel-head] { background-color: #e0f2fe !important; }
  .slide-print-stack.pdf-friendly [data-field-banner] { background-color: #f1f5f9 !important; }
  .slide-print-stack.pdf-friendly [data-panel-head] *:not([data-ink]), .slide-print-stack.pdf-friendly [data-field-banner] *:not([data-ink]) { color: #0c4a6e !important; }
  .slide-print-stack.pdf-friendly [data-slide-head] { border-bottom-color: #94a3b8 !important; }
}`;

// ── TS · THE ONE TYPE SCALE for the present-mode sheet (/innovation backlog #3) ─────────────────
// Every size is cqw, so PORTRAIT RENDERS PROPORTIONALLY IDENTICALLY TO LANDSCAPE — a px or vw size is
// correct at 1440 and four times too big at 390. The print sheet is 1600x900 (@page, backlog #4) where
// 1cqw = 16px, so these values sit inside the operator's caps: body 10-12px, headers 14-18px MAX.
// scripts/slide-shots.mjs enforces those caps at BOTH viewports; globals.css makes an inline TS size the
// only way to set type on the sheet, so a px utility added later cannot quietly reopen the hole.
const TS = {
  // #21 — the header is UNIFORM across all 20 codes. Both sizes are computed ONCE from the worst case
  // (longest project name x longest slide title rendered together) and applied to every slide. No per-slide
  // override, no content-dependent clamp, no shrink-to-fit: a header that resizes per slide is the exact
  // inconsistency being reported. Worst case measured: "AI/ML Software & Integration — Army IVAS" (40 ch)
  // + "User Stories — Highlights" (25 ch); both sit on one line inside the 1497px content width.
  proj:  "2.05cqw", // 32.8px — project name, every slide, never truncated. Raised to the IMG_8310 band.
  title: "2.2cqw",  // 35.2px — deck title, every slide. The largest type on the sheet.
  head:  "0.92cqw", // 14.7px — AMTS panel banner, field banner.
  meta:  "0.75cqw", // 12.0px — header-band figures, gate·stage, subheader, footer.
  body:  "0.75cqw", // 12.0px — body copy, lists, tables.
  lead:  "0.82cqw", // 13.1px — the value proposition: the one line that leads, at the body cap.
  num:   "0.8cqw",  // 12.8px — big tabular metric numbers (weight carries the emphasis, not size).
  micro: "0.62cqw", //  9.9px — metric captions, REQUIRED flag, source links.
} as const;

// Published by AmtsPanel, read by PresentField. Item #2 established that a panel must not print its own name
// twice; with ONE field that was detectable from the call (ids.length === 1), but a panel can also hold three
// fields where only the FIRST repeats the panel title (S8's value proposition). The title itself is the only
// reliable signal, so the panel hands it down.
const PanelTitleCtx = React.createContext<string>("");
const sameName = (a: string, b: string) => a.replace(/[^a-z0-9]/gi, "").toLowerCase() === b.replace(/[^a-z0-9]/gi, "").toLowerCase();

// S9 · THREE LEVELS ON TABS (operator 23c): "Level 1: Highlevel Specs, Tab for Level 2: Detailed CRS,
// Level 3: Design Traceability Matrix". One story set, three views — Levels 1 and 2 read the SAME 8-wide
// rows from storyTableRows() and Level 3 the 18-wide rows from traceRowsOf(), both built from storiesOf().
// No view has its own row builder, so the shifted-column bug the operator photographed cannot return in one
// view only. The tab bar is a fixed-height row INSIDE the panel body, so it cannot move the body Y-offset.
// Level 3 is 18 columns and cannot fit a 16:9 sheet: it renders only when ChartFrame is maximized (an
// overlay, not a reflow) and scrolls horizontally inside it.
const STORY_LEVELS = [
  { key: "L1", label: "Level 1 · High-Level Specs" },
  { key: "L2", label: "Level 2 · Detailed CRS" },
  { key: "L3", label: "Level 3 · Design Traceability Matrix" },
] as const;

function StorySpecs({ cols, rows, trace, big }: { cols: string[]; rows: string[][]; trace: string[][]; big?: boolean }) {
  const max = React.useContext(ChartMaxCtx);
  const [level, setLevel] = useState<"L1" | "L2" | "L3">("L1");
  const dot = (c: string) => (STORY_MATURITY as readonly string[]).includes(c);
  const cell = big ? { fontSize: TS.body } : undefined;
  const micro = big ? { fontSize: TS.micro } : undefined;

  const tabs = (
    <div className="mb-1 flex shrink-0 flex-wrap gap-1" role="tablist" aria-label="User story detail level">
      {STORY_LEVELS.map((l) => (
        <button key={l.key} type="button" role="tab" aria-selected={level === l.key} onClick={() => setLevel(l.key)}
          className={`rounded border px-1.5 py-0.5 ${level === l.key ? "border-cyan-500 bg-cyan-500/15 text-cyan-200" : "border-slate-700 text-slate-400 hover:bg-slate-800"}`}
          style={micro}>{max ? l.label : l.key}</button>
      ))}
    </div>
  );

  const L1 = (
    <table className="w-full table-fixed" style={cell}>
      <tbody>
        {rows.map((r, ri) => isStoryGroupRow(r)
          ? <tr key={ri}><td className="px-2 pb-0.5 pt-1.5 font-semibold uppercase tracking-[0.1em] text-cyan-300">{r[0]}</td></tr>
          : <tr key={ri}><td className="px-2 py-0.5 align-top text-slate-200">{r[0]}</td></tr>)}
      </tbody>
    </table>
  );

  const L2 = (
    <table className="w-full table-fixed" style={cell}>
      <thead>
        <tr>{cols.map((c) => <th key={c} style={{ width: STORY_COL_W[c] }}
          className={`px-2 py-1 font-semibold uppercase tracking-wide text-slate-400 ${dot(c) ? "text-center" : "text-left"}`}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => isStoryGroupRow(r)
          ? <tr key={ri} className="border-t border-slate-800"><td colSpan={cols.length} className="px-2 py-1 font-semibold uppercase tracking-[0.1em] text-cyan-300">{r[0]}</td></tr>
          : <tr key={ri} className="border-t border-slate-800">{cols.map((c, ci) =>
              <td key={ci} className={`px-2 py-1 align-top ${dot(c) ? "text-center text-cyan-300" : "text-slate-200"}`}>{r[ci] || (dot(c) ? "" : "—")}</td>)}</tr>)}
      </tbody>
    </table>
  );

  // 18 columns will not fit the sheet. Maximized it gets its own horizontal scroller and cells WRAP —
  // the no-clip law holds by wrapping and scrolling, never by truncating.
  const L3 = !max ? (
    <p className="m-0 px-2 py-3 italic text-slate-500" style={cell}>
      ⤢ maximize to open the 18-column Design Traceability Matrix — it does not fit the slide.
    </p>
  ) : (
    <div className="overflow-auto">
      <table className="border-collapse text-left" style={{ ...cell, minWidth: 2400 }}>
        <thead>
          <tr>{TRACE_COLS.map((c) => <th key={c} className="whitespace-normal border border-slate-800 bg-slate-900/60 px-2 py-1 align-bottom font-semibold uppercase tracking-wide text-slate-400" style={{ minWidth: 120 }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {trace.map((r, ri) => isTraceGroupRow(r)
            ? <tr key={ri}><td colSpan={TRACE_COLS.length} className="border border-slate-800 bg-cyan-500/10 px-2 py-1 font-semibold uppercase tracking-[0.1em] text-cyan-300">{r[0]}</td></tr>
            : <tr key={ri}>{TRACE_COLS.map((c, ci) =>
                <td key={ci} className="whitespace-normal break-words border border-slate-800 px-2 py-1 align-top text-slate-200" style={{ minWidth: 120 }}>{r[ci] || ""}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={max ? "flex min-h-0 w-full flex-1 flex-col" : "overflow-hidden"}>
      {tabs}
      {level === "L1" ? L1 : level === "L2" ? L2 : L3}
      {!max && level !== "L3" && <div className="px-2 pt-1 italic text-slate-500" style={micro}>⤢ expand for detail and the traceability matrix</div>}
    </div>
  );
}

// S9 is the widest table in the deck: 8 columns at 12.0px body on a 16:9 sheet. A maturity cell holds one
// dot, so those five columns are squeezed to the minimum and the width goes to the two prose columns.
// Percentages sum to 100 exactly.
const STORY_COL_W: Record<string, string> = {
  "User Stories": "38%", POC: "4%", Alpha: "4.5%", MVP1: "4.5%", MVP2: "4.5%", MVP3: "4.5%",
  "CRS #": "8%", "Customer Needs": "32%",
};

// TeamPicker — the operator's six Development Team rows plus "Other:". MULTI-SELECT because projects in this
// deck span firmware + mechanical + AI/ML at once; one discipline per SLIDE would stamp a wrong Req ID on
// most rows, so the label lives on the ROW. Writes a comma-joined label string straight back through the
// table's existing setActive round-trip — no new persistence path, no new store.
function TeamPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLexicon();
  const picked = value.split(",").map((x) => x.trim()).filter(Boolean);
  const known = DISCIPLINES.map((d) => d.key as string);
  const other = picked.find((x) => !known.includes(x)) ?? "";
  const toggle = (k: string) => onChange((picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k]).join(","));
  return (
    <div className="flex flex-wrap items-center gap-1">
      {DISCIPLINES.map((d) => (
        <button key={d.key} type="button" onClick={() => toggle(d.key)} aria-pressed={picked.includes(d.key)}
          title={t(`innovation.story.team.${d.key}`)}
          className={`rounded border px-1.5 py-0.5 text-[10px] font-mono ${picked.includes(d.key) ? "border-cyan-500 bg-cyan-500/15 text-cyan-200" : "border-slate-700 text-slate-400 hover:bg-slate-800"}`}>{d.key}</button>
      ))}
      <label className="flex items-center gap-1 text-[10px] text-slate-500">{t("innovation.story.team.other")}
        <input value={other} placeholder="LABEL"
          maxLength={DISCIPLINE_MAX}
          onChange={(e) => { const lbl = disciplineLabel(e.target.value); onChange([...picked.filter((x) => known.includes(x)), lbl].filter(Boolean).join(",")); }}
          className="w-20 rounded border border-slate-700 bg-[#0e141b] px-1 py-0.5 font-mono text-[10px] uppercase text-slate-100 outline-none focus:border-cyan-500" />
      </label>
    </div>
  );
}

// ── S10 panel marks — DRAWN, not emoji (operator: "all UX is drawn ... no emoji's"). Inline SVG so they scale
// with the sheet, print as vectors rather than font glyphs, and cannot fall back to a system emoji face.
const MarkSpend = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d="M2 13.5 8.5 7M10 2.5a3.5 3.5 0 0 0 3 5.9l-4.6 4.6a2 2 0 1 1-2.4-2.4L10.6 6A3.5 3.5 0 0 1 10 2.5Z" strokeLinejoin="round" />
  </svg>
);
const MarkRevenue = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d="M1.5 12.5 5.5 8l3 2.5 5.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 4h3.5v3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
// The three pictographic emoji that were in this file (calendar, clock, pin) are now drawn the same way. An
// emoji is a font glyph: it renders as a different picture on Windows, macOS, Android and in a PDF, and there
// is no colour or weight control over it. On a board artifact that is not acceptable.
const MarkCalendar = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" /><path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" strokeLinecap="round" />
  </svg>
);
const MarkClock = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <circle cx="8" cy="8" r="6.2" /><path d="M8 4.4V8l2.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
// W-7b · `MarkPin` IS GONE. Operator: "Use Save icon (Standard disk). Never use a pin, change all Save to
// Disk icon." It drew a pushpin on "Save version" — the one control in this deck that literally saves. The
// replacement is lucide `Save`, the SAME disk Architect-2525's design library already uses
// (components/architect-2525/architect-projects.tsx), so the tool has one save glyph rather than three.

// ── S10 · the two Rack & Stack tables, read-only on the sheet ────────────────────────────
// Money is $K to match what is entered; an em-dash for anything undefined, so a board never reads a computed
// blank as a zero. Column count comes from ONE place (`visibleYearCount`) — no surface derives its own.
// `finFmtK` / `finFmtPct` / `finFmtQty` MOVED TO THE LIB and are imported above: the S10 sheet is no longer
// the only surface printing these figures — the field-grid read-outs print them too — and two formatters for
// one number is a second source of truth wearing a harmless-looking disguise.

/** A row of the S10 sheet. `group` + `groupSpan` put the band name in a LEFT GUTTER spanning the band's rows
 *  instead of on a full-width header row of its own — four rows recovered on a sheet that cannot grow, and it
 *  reads closer to the Rack & Stack reference, where the band name sits in the gutter beside its numbers. */
type S10Row = { label: string; cells: string[]; strong?: boolean; band?: boolean; group?: string; groupSpan?: number; tint?: string };

function S10Grid({ head, rows, accent, gutter, dense }: { head: string[]; rows: S10Row[]; accent?: string; gutter?: boolean; dense?: boolean }) {
  // A `rowSpan` cell already OCCUPIES the gutter column for the rows beneath it. Emitting a placeholder <td>
  // in those rows pushes their whole line one column right, so Quantity lined up one column left of Revenue
  // and the last year fell off the sheet. Mark the covered rows and emit nothing for them.
  const covered = new Set<number>();
  rows.forEach((r, i) => { for (let k = 1; k < (r.groupSpan ?? 0); k++) covered.add(i + k); });
  return (
    <div className="min-h-0 overflow-auto">
      <table className="w-full table-fixed border-collapse" style={{ fontSize: dense ? TS.micro : TS.num }}>
        <thead>
          <tr>
            {gutter && <th className="sticky left-0 z-10 w-[8.5cqw] bg-[#0b0f14]" />}
            {/* The row-label column is sticky so eleven years can scroll on a phone without losing what the row IS. */}
            <th className={`sticky ${gutter ? "left-[8.5cqw]" : "left-0"} z-10 w-[7cqw] bg-[#0b0f14] px-[0.5cqw] py-[0.2cqh] text-left font-semibold text-slate-400`} style={{ fontSize: TS.micro }}>{head[0]}</th>
            {head.slice(1).map((h) => (
              <th key={h} className="px-[0.5cqw] py-[0.2cqh] text-right font-mono font-semibold text-cyan-300/90 tabular-nums" style={{ fontSize: TS.micro }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={`${r.group ?? ""}:${r.label}:${ri}`} className={r.band ? "bg-cyan-500/10" : ""} style={r.band && accent ? { background: accent } : undefined}>
              {gutter && r.groupSpan ? (
                <td rowSpan={r.groupSpan} className="sticky left-0 z-10 w-[8.5cqw] break-words border-r border-slate-800 bg-[#0b0f14] pr-[0.4cqw] align-middle text-left font-semibold leading-tight text-slate-200"
                    style={{ fontSize: TS.micro, background: r.tint }}>{r.group}</td>
              ) : gutter && !covered.has(ri) ? <td className="sticky left-0 z-10 bg-[#0b0f14]" /> : null}
              <td className={`sticky ${gutter ? "left-[8.5cqw]" : "left-0"} z-10 px-[0.5cqw] ${dense ? "py-0 leading-tight" : "py-[0.15cqh]"} text-left ${r.band ? "font-semibold text-slate-100" : r.strong ? "font-semibold text-slate-200" : "text-slate-400"} ${r.band ? "" : "bg-[#0b0f14]"}`}
                  style={r.band && accent ? { background: accent } : undefined}>{r.label}</td>
              {r.cells.map((c, i) => (
                <td key={i} className={`px-[0.5cqw] py-[0.15cqh] text-right font-mono tabular-nums ${r.strong ? "font-semibold text-slate-100" : "text-slate-300"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Step 1a · R&D Spend — five entered rows plus a derived Total, per calendar year.
 *  `baseYear` is a PROP, never read from the clock here: one clock at the deck root means a stored plan
 *  cannot silently re-anchor when the calendar rolls over on 1 January, and a test can pin 2026. */
function S10SpendTable({ p, baseYear }: { p: Project; baseYear: number }) {
  const f = finOf(p, baseYear);
  const n = visibleYearCount(p.gate);
  const ys = f.years.slice(0, n);
  const col = (pick: (y: FinYear) => number) => ys.map((y) => finFmtK(pick(y)));
  return (
    <>
      {/* G4 · `gutter` RESERVES THE SAME 8.5cqw LEFT COLUMN THE REVENUE TABLE USES FOR ITS BAND NAMES.
          Operator: "Add space R&D NRE to match Commercial Financial section so year 2026 and year 2036
          line up." Without it this table's label column sat at left-0 while the revenue table's sits at
          left-[8.5cqw], so the two grids' year columns were offset by exactly that gutter and 2026 did not
          sit above 2026. The gutter stays EMPTY here — spend has no bands to name, and adding a label the
          operator did not ask for would be inventing UI. This is space, not content.
          ⚠ TWO SYNTAX TRAPS HIT WHILE WRITING THIS COMMENT, both recorded so the next reader avoids them:
          (1) a JSX comment between ATTRIBUTES is invalid — it must sit outside the opening tag, as here;
          (2) writing the comment-close sequence inside a JSX comment ENDS it early, so this text may never
          contain it. Both were caught by tsc and NEITHER could be caught by the lock suite, which reads this
          file as text and passed 2941/2941 on a file that would not compile. Locks assert content; only the
          compiler asserts validity — which is why the build gate is not optional. */}
      <S10Grid
        gutter
        dense
        head={["$K", ...ys.map((y) => yearLabel(y.year))]}
        rows={[
          { label: "Total", cells: col(spendTotalK), strong: true },
          { label: "Labor", cells: col((y) => y.labor) },
          { label: "Contractor", cells: col((y) => y.contractor) },
          { label: "Materials", cells: col((y) => y.materials) },
          { label: "Other", cells: col((y) => y.other) },
          { label: "Sustain", cells: col((y) => y.sustain) },
        ]}
      />
      <div className="flex flex-wrap items-center gap-[1.4cqw] px-[0.5cqw] text-slate-400" style={{ fontSize: TS.micro }}>
        {/* W-11 · THE TWO CONFIDENCE PERCENTAGES ARE GONE FROM THE BOARD SHEET TOO, not just the editor.
            Operator: "remove % allocation for Commercial and Technical Confidence. Business Confidence will
            be allocated from PdM or PgM after talking to SBU or BU Director or VP."
            Deleting the INPUT while leaving the READ-OUT is the second-door defect inverted: a figure on a
            board slide that nobody can change and nothing derives. Both go together. */}
        <span>{yearLabel(ys[0]?.year ?? baseYear)} R&D Spend Request: <b className="font-mono text-slate-200">{finFmtK(f.spendRequestK)}</b></span>
      </div>
    </>
  );
}

/** Steps 1b / 2 / 3 + Combined — the four Rack & Stack revenue bands. Combined is derived, never entered. */
function S10RevenueTable({ p, baseYear }: { p: Project; baseYear: number }) {
  const f = finOf(p, baseYear);
  const n = visibleYearCount(p.gate);
  const ys = f.years.slice(0, n);
  // FOUR ROWS ON EVERY BAND — Quantity · Revenue · Margin · Margin % — per the operator's spec. An earlier cut
  // dropped Quantity and Margin % to clear a 21-element overflow; that was the wrong cut. "S10 is the standard
  // with 10.1 and 10.2 (if desired to show COGS AND ASP DATA)" puts COGS and ASP on the detail sheets, not
  // Quantity and Margin %. The overflow is solved by the LAYOUT instead: the band name moved into a left
  // gutter spanning its four rows (recovering four full-width header rows) and row padding tightened, so a
  // row the operator asked for is never traded away to make the sheet fit.
  // SIX ROWS PER BAND (operator, 2026-07-30, from a live screenshot: "For S10, we need rows for QTY, COGS,
  // ASP"). ASP is DERIVED — MSRP net of the distribution discount — so it is shown, never typed; that is the
  // whole reason Rack & Stack Step 1b takes four inputs and not three. Revenue and Margin follow from
  // QTY x ASP and QTY x (ASP - COGS), so the sheet now prints the build-up a board can actually audit
  // instead of two totals it has to take on faith.
  const band = (key: "neu" | "don" | "dec", label: string, tint: string): S10Row[] => {
    const on = f.unitEcon[key];
    // F2b · THE SHEET BRANCHES ON THE MODE, exactly as the editor does.
    // It used to emit Quantity/COGS/ASP UNCONDITIONALLY while using `on` only inside bandRevK/bandMgnK. So a
    // band in "Rev & Mgn only" printed a build-up that did not produce the revenue beside it — three numbers
    // that do not multiply to the fourth, in front of a board. (F2a removed the seeded case by reconciling
    // ASP to revenue; this closes the case a USER creates by flipping a band to typed entry.)
    // ORDER: Quantity -> COGS -> ASP (operator) — how many you sell, what it costs to make, what you sell it
    // for. The EDITOR carries the same order and the same presence rule, and a lock compares the two lists
    // directly rather than asserting each surface separately, because two independent assertions can both
    // pass while the surfaces drift.
    const rows: S10Row[] = [
      ...(on ? [
        { label: "Quantity", cells: ys.map((y) => finFmtQty(y[key].units)) },
        { label: "COGS", cells: ys.map((y) => finFmtK(y[key].cogsK)) },
        { label: "ASP", cells: ys.map((y) => finFmtK(aspOf(y[key]))) },
      ] : []),
      { label: "Revenue", cells: ys.map((y) => finFmtK(bandRevK(y[key], on))) },
      { label: "Margin", cells: ys.map((y) => finFmtK(bandMgnK(y[key], on))) },
      { label: "Margin %", cells: ys.map((y) => finFmtPct(bandMgnPct(y[key], on))) },
    ];
    // groupSpan is DERIVED from the row count, never a literal 6. `S10Grid` builds its rowSpan cover set from
    // groupSpan (`page.tsx` covered-set), so a hardcoded span on a 3-row band would leave three rows
    // uncovered and shift every number one column right — the defect the cover-set comment already warns of.
    return rows.map((r, i) => (i === 0 ? { ...r, group: label, groupSpan: rows.length, tint } : r));
  };
  return (
    <S10Grid
      gutter dense
      head={["", ...ys.map((y) => yearLabel(y.year))]}
      rows={[
        // F6 · SAME ORDER AND SAME STRINGS AS THE EDITOR'S `BANDS`. Whole `...band(...)` spreads are moved,
        // never split: each is a contiguous groupSpan-6 block and `S10Grid` computes its rowSpan cover set
        // positionally, so splitting one desynchronises the gutter and shifts every number a column right.
        ...band("neu", "Step 1b · New Product Rev", "rgba(59,130,246,.14)"),
        ...band("don", "Step 2 · Do Nothing Rev • Not Funded", "rgba(100,116,139,.14)"),
        ...band("dec", "Step 3 · Existing • PRD Revenue • EOL", "rgba(251,146,60,.14)"),
        // Combined is DERIVED: Revenue/Margin = New − Do-Nothing + EOL, and Quantity is the NET count
        // (New − Declining), labelled as such so nobody reads it as a gross unit total.
        { group: "Combined: Incremental", groupSpan: 5, tint: "rgba(34,211,238,.16)", label: "Quantity (net)", cells: ys.map((y) => finFmtQty(incUnits(y))) },
        { label: "Revenue", cells: ys.map((y) => finFmtK(incRevK(y, f.unitEcon))), strong: true },
        { label: "Margin", cells: ys.map((y) => finFmtK(incMgnK(y, f.unitEcon))), strong: true },
        { label: "Margin %", cells: ys.map((y) => finFmtPct(incMgnPct(y, f.unitEcon))) },
        // YoY appears on Incremental ONLY (operator). Blank in the first column — there is no prior year.
        { label: "YoY Growth", cells: ys.map((_, i) => finFmtPct(incYoYPct(f.years, i, f.unitEcon))) },
      ]}
    />
  );
}

// ═══ S10 · THE EDITOR — the writer `Project.finPlan` never had ══════════════════════════════
// `finPlan` was declared, typed and read, and NOTHING in the application ever set it. So `finOf` always fell
// through to `finBaseline`, and S10's eleven columns were a re-spread of three scalars wearing a grid's
// clothes: it looked alive because editing NRE moved the spend row, but no per-year figure could be entered
// anywhere in the product. The lockdown narrowed nine input doors to one; this is what is behind that door.
//
// EVERY WRITE CLONES. `setFin` spreads the WHOLE plan and `setCell` maps the year array — never a splice,
// never a mutation of `finOf`'s return. The failure this prevents is the classic one: the first cell you type
// into replaces the plan and the other 87 cells come back zero. There is a lock that types into one cell and
// asserts the rest are byte-identical.
/** G2 · DISPLAY rounding, never STORAGE rounding. F2a derives seeded ASP and COGS from the revenue so that
 *  `units × aspK === revK` to zero error — which makes them exact floats like 134.78048780487805. This input
 *  rendered `String(value)` raw, so the operator's screenshot showed "134.7804" and "40.00000". Two decimals,
 *  trailing zeros stripped, is what a $K figure is worth reading.
 *  ⚠ THE STORED VALUE MUST NOT BE ROUNDED. Rounding the record would re-introduce the 301 rows where
 *  Qty × ASP ≠ Revenue that F2a just eliminated. So the commit test below compares the typed string against
 *  the DISPLAYED string, not the parsed number against the stored float: tabbing through a cell without
 *  editing it must write nothing. Comparing numbers would make every cursor pass silently overwrite an exact
 *  value with its 2-dp shadow — the whole risk of this change, and it has its own lock. */
const finDisp = (v: number): string => (v ? String(Math.round(v * 100) / 100) : "");
/** ⚠ ONE NUMBER-ENTRY ENGINE FOR THE WHOLE TOOL (operator: "I checked Financials and input works fine — see
 *  if you can apply number enter from financials to fields for value prop"). S10 is the surface that WORKS,
 *  so the value prop adopts this component rather than keeping its own near-miss copy. What the copy lacked,
 *  itemised, because each one is a real defect and not a style difference:
 *    1. the `key` re-seed — without it an uncontrolled input never picks up a value changed underneath it
 *    2. the untouched guard — tabbing through a cell used to rewrite it
 *    3. Enter-to-commit
 *    4. the junk guard — bad input was silently coerced instead of restored
 *    5. `title` naming the exact stored value
 *  `onClear` and `placeholder` are ADDITIVE and optional, so every existing S10 call site is untouched and
 *  keeps its exact behaviour (blank → 0). The value prop passes `onClear` because a blank differentiator is
 *  not worth zero — it falls back to the derived geometry, which is why its placeholder is that number. */
function FinCell({ value, onCommit, title, suffix, onClear, placeholder, className, signed, keySeed }: {
  value: number | null; onCommit: (v: number) => void; title: string; suffix?: string;
  onClear?: () => void; placeholder?: string; className?: string; signed?: boolean;
  /** ⚠ A FIELD'S KEY MUST NEVER DEPEND ON A SIBLING FIELD'S VALUE. Measured: typing into Value $M worked
   *  perfectly in isolation (caret 1→2→3, focus kept) and lost focus to BODY on EVERY keystroke once the
   *  driver NAME had been edited first — because the key was `${title}:${value}` and this call site's title
   *  embeds `d.name`. A changed key makes React unmount and remount the input, which is precisely "takes
   *  cursor off the field I'm updating". S10 never hit this because its titles are `label · year`, both
   *  stable. `keySeed` lets a caller supply a stable identity (here: the row index). */
  keySeed?: string;
}) {
  const shown = finDisp(value ?? 0);
  return (
    <input type="text" inputMode={signed ? "text" : "decimal"} defaultValue={shown}
      title={`${title} — stored ${value ?? "—"}`} aria-label={title}
      key={`${keySeed ?? title}:${value}`}   // re-seed the uncontrolled input when the value changes underneath it (apply-rate, undo)
      placeholder={placeholder ?? "—"}
      onBlur={(e) => {
        const raw = e.target.value.trim();
        if (raw === shown) return;                       // untouched: leave the exact stored value alone
        if (raw === "" && onClear) { onClear(); return; } // blank CLEARS where the caller allows it
        const v = raw === "" ? 0 : Number(raw.replace(/[$,\s]/g, ""));
        if (!Number.isFinite(v)) { e.target.value = shown; return; }  // never coerce junk to 0 silently
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={className ?? "w-full min-w-[52px] rounded border border-slate-700 bg-[#0e141b] px-1 py-0.5 text-right text-[11px] tabular-nums text-slate-100 outline-none focus:border-cyan-500"} />
  );
}

/** The TEXT twin of FinCell, same five disciplines. The driver-name field was CONTROLLED (`value=` +
 *  onChange), so every keystroke round-tripped through parent state — and the operator reported exactly what
 *  that produces: "1 letter or number defaults and takes cursor to front". Uncontrolled + commit-on-blur is
 *  what S10 does and what works. */
function TextCell({ value, onCommit, title, placeholder, className, keySeed }: {
  value: string; onCommit: (v: string) => void; title: string; placeholder?: string; className?: string;
  keySeed?: string;   // same rule as FinCell: a stable identity, never a sibling's value
}) {
  return (
    <input type="text" defaultValue={value} aria-label={title} title={title} placeholder={placeholder}
      key={`${keySeed ?? title}:${value}`}
      onBlur={(e) => { const raw = e.target.value; if (raw !== value) onCommit(raw); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={className ?? "w-full rounded border border-slate-700 bg-[#0b0f14] px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500"} />
  );
}

/** One editable row across the visible years, with a fill-right handle.
 *  APPLY-RATE IS WHY THIS IS USABLE. 14 entered rows x 11 years = 154 cells per project, 5,082 across the
 *  portfolio. A seed and a growth rate turn a row's eleven keystrokes into two. It is a ONE-SHOT FILL, not a
 *  live formula: it writes eleven plain numbers and gets out of the way, so editing a year afterwards changes
 *  only that year. Negative rates are required — Do-Nothing and Declining erode. */
function FinRow({ label, years, get, set, hint, onFill }: {
  label: string; years: FinYear[]; get: (y: FinYear) => number; set: (i: number, v: number) => void; hint?: string;
  onFill?: () => void;
}) {
  return (
    <tr>
      <td className="sticky left-0 z-10 bg-[#0b0f14] py-0.5 pr-1.5 text-left text-[10px] text-slate-400" title={hint}>
        <span className="flex items-center gap-1">
          {onFill && (
            <button onClick={onFill} aria-label={`Fill ${label} across all years from a growth rate`}
              title={`Fill ${label} across all 11 years from a seed and a growth rate. Preview first; one undo.`}
              className="rounded border border-slate-700 px-1 leading-none text-[9px] text-slate-500 hover:border-cyan-500/60 hover:text-cyan-300">⇥</button>
          )}
          <span className="truncate">{label}</span>
        </span>
      </td>
      {years.map((y, i) => (
        <td key={y.year} className="px-0.5 py-0.5">
          <FinCell value={get(y)} onCommit={(v) => set(i, v)} title={`${label} · ${y.year}`} />
        </td>
      ))}
    </tr>
  );
}

/** The S10 source editor — R&D spend + the three Rack & Stack revenue bands, per calendar year.
 *  Columns follow the gate ladder (Concept 4 · Plan 6 · Develop 11); STORAGE is always 11, so demoting a
 *  project hides years, it never deletes them. */
/** A collapsible section banner for the S10 editor — one for Technical (R&D · NRE), one for Commercial
 *  (COGS · REV · MGN). Operator: "each section can be expanded or reduced. That way when we are inputting
 *  project data, we do not see commercial details, and vice versa."
 *
 *  THE SUMMARY IS THE POINT. A collapsed section still prints its headline figure, so closing one costs the
 *  DETAIL and never the ANSWER — which is what makes it safe to collapse mid-review. A bare chevron would
 *  make the operator re-open a section just to remember what was in it.
 *
 *  `aria-expanded` + `aria-controls` so the state is announced, not just drawn: the two sections are the
 *  only thing standing between a technical reviewer and a screen of commercial numbers they did not ask for. */
function FinBanner({ tone, title, sub, summary, open, onToggle }: {
  tone: "tech" | "comm"; title: string; sub: string; summary: string; open: boolean; onToggle: () => void;
}) {
  const skin = tone === "tech"
    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15"
    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15";
  return (
    <button onClick={onToggle} aria-expanded={open} aria-controls={`fin-${tone}`}
      title={open ? `Collapse ${title}` : `Expand ${title} — ${summary}`}
      className={`mt-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left ${skin}`}>
      <span aria-hidden className="text-[10px]">{open ? "▾" : "▸"}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
      <span className="text-[10px] font-normal opacity-70">{sub}</span>
      <span className="flex-1" />
      <span className="font-mono text-[11px] tabular-nums opacity-90">{summary}</span>
    </button>
  );
}

function S10FinEditor({ p, baseYear, onEdit }: {
  p: Project; baseYear: number; onEdit: (patch: Partial<Project>, changes: string[]) => void;
}) {
  const fin = finOf(p, baseYear);
  const n = visibleYearCount(p.gate);
  const ys = fin.years.slice(0, n);
  // TWO BANNERS, INDEPENDENTLY COLLAPSIBLE (operator: "Create Technical Financials banner that encapsulates
  // R&D · NRE / Create Commercial Financials banner that encapsulates COGS · REV · MGN ... each section can
  // be expanded or reduced. That way when we are inputting project data, we do not see commercial details,
  // and vice versa").
  //
  // BOTH DEFAULT OPEN. Hiding a section nobody asked to hide is the same class of defect as the duplicate
  // tables this panel just spent four commits removing — a number you cannot see is a number you assume is
  // absent. The operator collapses what they are not working on; nothing collapses itself.
  //
  // INDEPENDENT, not a radio pair: "each section can be expanded or reduced" is two switches, and closing
  // both is a legitimate state — it leaves the two summary lines, which is a compact read of the whole plan.
  const [finOpen, setFinOpen] = useState<{ tech: boolean; comm: boolean }>({ tech: true, comm: true });
  // A COLLAPSED banner still carries its section's headline figure, so shutting a section costs you the
  // detail and never the answer. That is what makes collapsing safe to do in the middle of a review.
  const techTotalK = fin.years.reduce((a, y) => a + spendTotalK(y), 0);
  const commRevK = ys.reduce((a, y) => a + incRevK(y, fin.unitEcon), 0);
  // EVERY grid write carries the scalar roll-up with it. `nreK` (69 read sites) and `fullRev10yM` feed the
  // Rack sort, the budget line, the dog-tag and S1/S2/S3; if the grid moved and they did not, the deck would
  // show two different answers for the same money — which is the exact duplication this work exists to end.
  const commit = (next: FinPlan, what: string) =>
    onEdit({ finPlan: next, ...finRollup(next) }, [`S10 · ${what}`]);
  const setFin = (patch: Partial<FinPlan>, what: string) => commit({ ...fin, ...patch }, what);
  // `withFinYear` / `withFinBand` are pure and live in the lib, so the update semantics the whole grid depends
  // on are executed by the test suite rather than re-implemented (and re-broken) here.
  const setYear = (i: number, patch: Partial<FinYear>, what: string) => commit(withFinYear(fin, i, patch), what);
  const setBand = (i: number, band: "neu" | "don" | "dec", patch: Partial<FinBandYear>, what: string) =>
    commit(withFinBand(fin, i, band, patch), what);

  // ── Apply-rate: preview, then apply, then ONE undo. The most destructive click in the grid, so it never
  //    fires straight from a keystroke — the operator sees the eleven numbers before they land.
  const [fill, setFill] = useState<{ label: string; seed: number; rate: string; write: (vals: number[]) => FinPlan } | null>(null);
  const [undo, setUndo] = useState<{ plan: FinPlan; what: string } | null>(null);
  const preview = fill ? linearize(fill.seed, Number(fill.rate) || 0, FIN_SPAN) : [];
  const applyFill = () => {
    if (!fill) return;
    setUndo({ plan: fin, what: fill.label });                       // snapshot BEFORE, so undo is exact
    commit(fill.write(preview), `${fill.label} filled at ${fill.rate || 0}%/yr`);
    setFill(null);
  };
  const openFill = (label: string, seed: number, write: (vals: number[]) => FinPlan) =>
    setFill({ label, seed, rate: "0", write });

  const spendRow = (label: string, key: "labor" | "contractor" | "materials" | "other" | "sustain") => (
    <FinRow key={key} label={label} years={ys} get={(y) => y[key]}
      set={(i, v) => setYear(i, { [key]: v } as Partial<FinYear>, `${label} ${fin.years[i].year} → ${v}`)}
      onFill={() => openFill(label, fin.years[0][key], (vals) => withFinSpendRow(fin, key, vals))} />
  );
  // F6 · ORDER AND TITLES ARE THE OPERATOR'S. The ladder now reads 1a → 1b → 2 → 3 down the panel; it used
  // to read 1a, 2, 1b, 3, with the step number LAST so a wrapped label orphaned it onto its own line as a
  // bare digit. The step is folded INTO the label — ONE string, used verbatim by the sheet as well, so the
  // two surfaces cannot compose the same name two different ways and drift. The separate `step` field is
  // gone for the same reason. `·` separates step from name, `•` separates clauses within the name; that is
  // the operator's own punctuation and it is now a stated two-level convention, not an accident.
  const BANDS: { key: "don" | "neu" | "dec"; label: string }[] = [
    { key: "neu", label: "Step 1b · New Product Rev" },
    { key: "don", label: "Step 2 · Do Nothing Rev • Not Funded" },
    { key: "dec", label: "Step 3 · Existing • PRD Revenue • EOL" },
  ];
  // STICKY TOP — the vertical twin of the pinned band labels. The editor scrolls inside `max-h-[46vh]`; with
  // six rows on each of three bands plus the spend block, scrolling down loses the calendar years and you are
  // typing into an unlabelled column. `z-20` so the header wins over the `z-10` row labels where they cross
  // at the top-left corner, and every cell carries the background or the rows show through it.
  // ⚠ THE STICKY GOES ON EVERY `th`, NOT ON THE `thead`. The table is `border-collapse: collapse`, and a
  // collapsed table has no box for `thead`/`tr` to position against — the rule is silently ignored and the
  // header scrolls away. Measured: with it on the thead the year row sat at y 1216 inside a box starting at
  // y 283. Per-cell sticky is the form that works, which is why each `th` also carries its own background.
  const head = (
    <thead>
      <tr>
        <th className="sticky left-0 top-0 z-30 bg-[#0b0f14] pr-1.5 text-left text-[9px] uppercase tracking-wider text-slate-500">$K</th>
        {ys.map((y) => <th key={y.year} className="sticky top-0 z-20 bg-[#0b0f14] px-0.5 text-right font-mono text-[9px] text-cyan-300/90 tabular-nums">{yearLabel(y.year)}</th>)}
      </tr>
    </thead>
  );
  // W-3 · THE TWO TABLES DECLARE ONE GUTTER (operator: "Financial Output on Play mode is correct as far as
  // year alignment. Do same for input").
  //
  // BOTH TABLES ALREADY SHARED `head` — and their 2026 columns still sat ~200px apart on the operator's
  // screen. A shared component guarantees nothing about shared geometry: `<table>` defaults to AUTO layout,
  // which sizes the first column from its own widest cell. Technical's is "Contractor"; Commercial's is
  // "Step 3 · Existing • PRD Revenue • EOL" PLUS its "Qty · COGS · ASP" chip. Same header, different gutter.
  //
  // So the gutter is DECLARED, exactly as the output sheet declares `w-[8.5cqw]` on S10Grid (G4). One
  // colgroup, rendered into both tables, plus `table-fixed` so the declaration actually binds — without it
  // the browser is free to grow a column past its stated width to fit content, which is the whole defect.
  //
  // `minWidth` keeps the year columns typeable on a phone (FinCell's own min-w is 52px) and lets the panel
  // scroll horizontally rather than crushing eleven columns into 390px. `w-full` still fills a wide desktop;
  // because both tables carry the SAME colgroup inside the SAME parent, any leftover width is distributed
  // identically to both, so they stay aligned at every viewport rather than only at the narrow one.
  const LABEL_W = 132;                        // reserved gutter — holds the longest band label AND its chip
  const YEAR_W = 64;                          // one calendar year — FinCell min-w 52px + the cell's px-0.5
  const cols = (
    <colgroup>
      <col style={{ width: LABEL_W }} />
      {ys.map((y) => <col key={y.year} style={{ width: YEAR_W }} />)}
    </colgroup>
  );
  const tableCls = "w-full table-fixed border-collapse";
  const tableStyle = { minWidth: LABEL_W + ys.length * YEAR_W };
  return (
    <div className="col-span-2 rounded border border-cyan-500/20 bg-[#0b0f14] p-2 sm:col-span-3">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 text-[10px]">
        <span className="font-semibold uppercase tracking-wider text-cyan-300">S10 · Financials by Year</span>
        <span className="text-slate-500">{GATE_STAGE[p.gate]} ({p.gate}) shows {n} of {fin.years.length} calendar years — demoting hides years, never deletes them.</span>
        {/* The gate ladder, measured rather than described: Concept current+3, Plan current+5, Develop +10. */}
        {(() => {
          const r = finGateReadiness(fin, p.gate);
          return r.ready
            ? <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 text-emerald-300">✓ {r.filled}/{r.need} years forecast</span>
            : <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 text-amber-300"
                    title={`${GATE_STAGE[p.gate]} needs a forecast for ${r.need} calendar years. Missing: ${r.missing.join(", ")}.`}>
                {r.filled}/{r.need} years forecast — missing {r.missing.map((y) => yearLabel(y)).join(", ")}
              </span>;
        })()}
      </div>
      {/* ── TECHNICAL FINANCIALS · R&D · NRE ─────────────────────────────────────────────── */}
      <FinBanner tone="tech" title="Technical Financials" sub="R&D · NRE"
        summary={`${finFmtK(techTotalK)} total`} open={finOpen.tech}
        onToggle={() => setFinOpen((o) => ({ ...o, tech: !o.tech }))} />
      {finOpen.tech && (<>
      <div className="max-h-[46vh] overflow-auto">
        <table className={tableCls} style={tableStyle}>
          {cols}
          {head}
          <tbody>
            {/* THE LABEL IS PINNED, NOT THE ROW. Operator: "I need Step 1A, Do nothing and other labels to
                stay on screen just like labels for rev margin, etc." The metric labels are `sticky left-0` on
                `FinRow`, so they hold when you scroll out to 2036; these band headers were full-width colSpan
                cells with no sticky, so their text rode off the left edge and you lost track of which band you
                were typing into — the failure mode that makes a wide grid unusable.
                A colSpan cell already spans the table, so stickying the CELL does nothing. The remedy is to
                pin its CONTENT: the label parks against the left edge while its stripe scrolls underneath. */}
            {/* W-3 · `sm:whitespace-nowrap` IS GONE, and its removal is the point. Under `table-fixed` a
                nowrap label does not widen its column any more — it OVERFLOWS it, painting across the year
                cells. The declared gutter only binds if the content is allowed to wrap inside it. */}
            <tr><td className="sticky left-0 z-10 bg-[#12202a] py-0.5 pr-2 text-left text-[10px] font-semibold leading-tight text-slate-100">Step 1a · R&amp;D Spend</td><td colSpan={ys.length} className="bg-cyan-500/10" /></tr>
            {spendRow("Labor", "labor")}
            {spendRow("Contractor", "contractor")}
            {spendRow("Materials", "materials")}
            {spendRow("Other", "other")}
            {spendRow("Sustain", "sustain")}
            <tr>
              <td className="sticky left-0 z-10 bg-[#0b0f14] py-0.5 pr-1.5 text-left text-[10px] font-semibold text-slate-200">Total</td>
              {ys.map((y) => <td key={y.year} className="px-1 py-0.5 text-right font-mono text-[11px] font-semibold tabular-nums text-slate-100">{finFmtK(spendTotalK(y))}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      {/* The current-year ask and the TECHNICAL rung live with the technical rows they describe. The two
          confidences used to share one footer strip, which would have put a commercial control inside the
          technical section the moment these banners existed. */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
        <label className="flex items-center gap-1">{yearLabel(ys[0]?.year ?? baseYear)} R&amp;D Spend Request
          <span className="w-20"><FinCell value={fin.spendRequestK} title="Current-year R&D ask, $K" onCommit={(v) => setFin({ spendRequestK: v }, `spend request -> ${v}`)} /></span>
        </label>
        {/* W-11 · "Technical Confidence 50%" REMOVED. Verified before deleting: `techConfPct` fed NOTHING —
            not NPV, not pSuccess, not gate scoring — so nothing downstream freezes at a stale value. The
            field stays on FinPlan so no seeded project migrates; it is simply no longer typed or printed. */}
      </div>
      </>)}

      {/* ── COMMERCIAL FINANCIALS · COGS · REV · MGN ──────────────────────────────────────── */}
      <FinBanner tone="comm" title="Commercial Financials" sub="COGS · REV · MGN"
        summary={`${finFmtK(commRevK)} incremental`} open={finOpen.comm}
        onToggle={() => setFinOpen((o) => ({ ...o, comm: !o.comm }))} />
      {finOpen.comm && (<>
      <div className="max-h-[46vh] overflow-auto">
        <table className={tableCls} style={tableStyle}>
          {cols}
          {head}
          <tbody>
            {BANDS.map((b) => {
              const on = fin.unitEcon[b.key];
              return (
                <React.Fragment key={b.key}>
                  <tr>
                    {/* THE STICKY GOES ON THE `td`, exactly as it does on `FinRow`'s metric labels — a sticky
                        SPAN inside a `colSpan` cell of a `border-collapse: collapse` table clips its own left
                        edge, measured at ~20px lost on a 390px phone. So the band header is two cells: a pinned
                        label cell carrying the name AND its toggle (the control must not scroll away from the
                        label it belongs to), and a spanning cell that carries the stripe. */}
                    {/* W-3 · THIS CELL WAS THE CAUSE. Under AUTO table layout its `sm:whitespace-nowrap`
                        content — the longest band label PLUS the mode chip beside it — sized the first
                        column, which is why Commercial's 2026 sat ~200px right of Technical's despite both
                        tables rendering the same `head`. The gutter is now declared by the shared colgroup,
                        so the label wraps inside it and the chip drops to its own line under the name rather
                        than extending it. Nothing is hidden; the cell grows DOWN, which costs a row height
                        and buys alignment on both tables at every viewport. */}
                    <td className="sticky left-0 z-10 bg-[#12202a] py-0.5 pr-2 text-left text-[10px] font-semibold leading-tight text-slate-100">
                      {b.label}
                      {/* THE TOGGLE SWAPS THE ROW SET (operator: "if Rev / Mgn Only is selected, Qty, COGS,
                          ASP are hidden and those cells are editable"). Each mode shows exactly what it takes
                          and nothing it ignores, so there is never a row on screen the current mode does not
                          use.
                          ⚠ THIS REVERSES E1, which kept all three visible in both modes on the argument that
                          they are facts about the product rather than artefacts of a revenue model. The
                          operator has decided otherwise. The original "where is my Qty. ASP, and Mgn?" was
                          caused by the toggle being INVISIBLE, not by the rows being conditional — and the
                          toggle now names both modes in plain words on every band. */}
                      <button onClick={() => setFin({ unitEcon: { ...fin.unitEcon, [b.key]: !on } }, `${b.label} ${on ? "Rev & Mgn only" : "Qty · COGS · ASP"}`)}
                        title={on
                          ? "Entered: Quantity, COGS, ASP. Revenue = Qty x ASP and Margin = Qty x (ASP - COGS) are calculated. Click to type Revenue and Margin directly instead."
                          : "Entered: Revenue and Margin, typed directly. Click to build them up from Quantity, COGS and ASP instead."}
                        className={`mt-0.5 block rounded border px-1.5 py-0 text-[9px] ${on ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200" : "border-slate-700 text-slate-400"}`}>
                        {on ? "Qty · COGS · ASP" : "Rev & Mgn only"}
                      </button>
                    </td>
                    <td colSpan={ys.length} className="bg-cyan-500/10" />
                  </tr>
                  {on ? <>
                    {/* ORDER IS THE ORDER OF THE DECISION (operator): how many you sell, what it costs to
                        make, what you sell it for. Quantity -> COGS -> ASP, and the SHEET carries the same
                        order — a lock compares the two lists directly so they cannot drift apart. */}
                    <FinRow label="Quantity" years={ys} hint="# units" get={(y) => y[b.key].units} set={(i, v) => setBand(i, b.key, { units: v }, `${b.label} qty ${fin.years[i].year} -> ${v}`)}
                      onFill={() => openFill(`${b.label} · Quantity`, fin.years[0][b.key].units, (vals) => withFinBandRow(fin, b.key, "units", vals))} />
                    <FinRow label="COGS $K" years={ys} hint="Cost of goods per unit" get={(y) => y[b.key].cogsK} set={(i, v) => setBand(i, b.key, { cogsK: v }, `${b.label} COGS ${fin.years[i].year} -> ${v}`)}
                      onFill={() => openFill(`${b.label} · COGS`, fin.years[0][b.key].cogsK, (vals) => withFinBandRow(fin, b.key, "cogsK", vals))} />
                    <FinRow label="ASP $K" years={ys} hint="Average selling price per unit. Typed ASP wins; blank falls back to MSRP net of the distribution discount." get={(y) => aspOf(y[b.key])} set={(i, v) => setBand(i, b.key, { aspK: v }, `${b.label} ASP ${fin.years[i].year} -> ${v}`)}
                      onFill={() => openFill(`${b.label} · ASP`, aspOf(fin.years[0][b.key]), (vals) => withFinBandRow(fin, b.key, "aspK", vals))} />
                    {/* G1 · CALCULATED — Revenue AND Margin, each on its OWN row, named exactly as the typed
                        mode names them. Operator: "Ensure you Show Commercial Elements: Revenue and Margin,
                        when in QTY, REV, MGN mode of input."
                        This was ONE row labelled "Rev · Mgn (calc)" that printed revenue ONLY; margin existed
                        just inside its `title`, which is invisible on a phone and invisible to a board. So the
                        mode that COMPUTES margin was the only mode that never showed it, and the two modes
                        disagreed about whether margin was worth displaying. Read-only styling (no <input>,
                        emerald) so a calculated row is never mistaken for a typeable one, and each row still
                        carries its own arithmetic in the tooltip so the number can be audited.
                        Margin % is deliberately NOT added here — the operator asked for Revenue and Margin,
                        and the sheet already carries Margin % as its sixth band row. */}
                    {([
                      ["Revenue $K", bandRevK, "Revenue = Qty × ASP"],
                      ["Margin $K", bandMgnK, "Margin = Qty × (ASP − COGS)"],
                    ] as const).map(([label, calc, formula]) => (
                      <tr key={label}>
                        <td className="sticky left-0 z-10 bg-[#0b0f14] py-0.5 pr-1.5 text-left text-[10px] text-slate-500" title={formula}>
                          {label} <span className="text-slate-600">(calc)</span>
                        </td>
                        {ys.map((y) => (
                          <td key={y.year} className="px-1 py-0.5 text-right font-mono text-[11px] tabular-nums text-emerald-400/90"
                              title={`${formula} — ${finFmtK(calc(y[b.key], true))} · margin ${finFmtPct(bandMgnPct(y[b.key], true))}`}>
                            {finFmtK(calc(y[b.key], true))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </> : <>
                    {/* REV & MGN ONLY — the three build-up rows are HIDDEN and these two are the entered pair.
                        Quantity, COGS and ASP stay ON THE RECORD untouched: switching back restores whatever
                        was typed rather than starting from blank. */}
                    <FinRow label="Revenue $K" years={ys} hint="Typed directly — the build-up rows are hidden in this mode, not deleted" get={(y) => y[b.key].revK ?? 0} set={(i, v) => setBand(i, b.key, { revK: v }, `${b.label} revenue ${fin.years[i].year} -> ${v}`)}
                      onFill={() => openFill(`${b.label} · Revenue`, fin.years[0][b.key].revK ?? 0, (vals) => withFinBandRow(fin, b.key, "revK", vals))} />
                    <FinRow label="Margin $K" years={ys} get={(y) => y[b.key].mgnK ?? 0} set={(i, v) => setBand(i, b.key, { mgnK: v }, `${b.label} margin ${fin.years[i].year} -> ${v}`)}
                      onFill={() => openFill(`${b.label} · Margin`, fin.years[0][b.key].mgnK ?? 0, (vals) => withFinBandRow(fin, b.key, "mgnK", vals))} />
                  </>}
                </React.Fragment>
              );
            })}
            {/* Combined is DERIVED — New − Do-Nothing + EOL. There is nothing to type here, so there is no input. */}
            {/* W-3 · THE FOURTH BAND HEADER GETS THE SAME TREATMENT, and it was NOT free. Driving the built
                app found this cell overflowing its declared 132px gutter at 180px on desktop while measuring
                clean on the phone — the phone wrapped it, the desktop did not, because `sm:whitespace-nowrap`
                only applies above the breakpoint. One clipped cell, found by measurement, not by a lock. */}
            <tr><td className="sticky left-0 z-10 bg-[#12202a] py-0.5 pr-2 text-left text-[10px] font-semibold leading-tight text-slate-100">Combined: Incremental <span className="font-normal text-slate-400">· derived</span></td><td colSpan={ys.length} className="bg-cyan-500/10" /></tr>
            <tr>
              <td className="sticky left-0 z-10 bg-[#0b0f14] py-0.5 pr-1.5 text-left text-[10px] text-slate-400">Revenue</td>
              {ys.map((y) => <td key={y.year} className="px-1 py-0.5 text-right font-mono text-[11px] tabular-nums text-slate-100">{finFmtK(incRevK(y, fin.unitEcon))}</td>)}
            </tr>
            <tr>
              <td className="sticky left-0 z-10 bg-[#0b0f14] py-0.5 pr-1.5 text-left text-[10px] text-slate-400">Margin</td>
              {ys.map((y) => <td key={y.year} className="px-1 py-0.5 text-right font-mono text-[11px] tabular-nums text-slate-100">{finFmtK(incMgnK(y, fin.unitEcon))}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      {/* Apply-rate strip — PREVIEW, then apply, then one undo. Nothing is written until Apply is clicked. */}
      {fill && (
        <div data-fin-fill className="mt-1.5 rounded border border-amber-500/40 bg-amber-500/[0.06] p-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-300">
            <b className="text-amber-300">Fill {fill.label}</b>
            <label className="flex items-center gap-1">seed
              <input type="text" inputMode="decimal" defaultValue={String(fill.seed)} aria-label="Seed value"
                onChange={(e) => setFill({ ...fill, seed: Number(e.target.value.replace(/[$,\s]/g, "")) || 0 })}
                className="w-16 rounded border border-slate-700 bg-[#0e141b] px-1 py-0.5 text-right tabular-nums text-slate-100 outline-none focus:border-cyan-500" />
            </label>
            <label className="flex items-center gap-1">growth %/yr
              <input type="text" inputMode="decimal" value={fill.rate} aria-label="Growth rate percent per year"
                onChange={(e) => setFill({ ...fill, rate: e.target.value })}
                title="Negative rates are expected here — Do-Nothing and Declining erode."
                className="w-16 rounded border border-slate-700 bg-[#0e141b] px-1 py-0.5 text-right tabular-nums text-slate-100 outline-none focus:border-cyan-500" />
            </label>
            <button onClick={applyFill} className="rounded border border-amber-500/60 bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-200 hover:bg-amber-500/25">Apply 11 years</button>
            <button onClick={() => setFill(null)} className="rounded border border-slate-700 px-2 py-0.5 text-slate-400 hover:bg-slate-800">Cancel</button>
            <span className="text-slate-500">one-shot fill — editing a year afterwards recomputes nothing</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] tabular-nums text-amber-200/90">
            {preview.map((v, i) => <span key={i} className="rounded bg-black/30 px-1">{yearLabel(fin.years[i]?.year ?? 0)}: {v.toLocaleString()}</span>)}
          </div>
        </div>
      )}
      {undo && !fill && (
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
          <span>Filled <b className="text-slate-200">{undo.what}</b>.</span>
          <button onClick={() => { commit(undo.plan, `undo fill · ${undo.what}`); setUndo(null); }}
            className="rounded border border-slate-700 px-2 py-0.5 text-slate-300 hover:bg-slate-800">↺ Undo fill</button>
        </div>
      )}
      {/* W-11 · "Commercial Confidence 10%" REMOVED, and the strip with it — it held nothing else.
          Operator: "Business Confidence will be allocated from PdM or PgM after talking to SBU or BU
          Director or VP." A six-rung percentage ladder is the wrong instrument for a judgement a person
          makes in a conversation; it invited a number to be picked because a control was there.
          The replacement — "Business Risk Assessment", up on the risk row beside Technical and Commercial
          Risk — is the operator's separate in-flight item and lands with it, not smuggled in here. */}
      </>)}
    </div>
  );
}

// PANELS ARE NOT ALWAYS EQUAL. The body grid gives every row the same height, which is right for two panels
// of similar weight and wrong for S10, where R&D Spend needs 7 rows and R&D Revenues needs 24. An even split
// pushed Margin % and YoY Growth off the bottom of the revenue table — present in the DOM, scrollable, and
// therefore invisible on a printed board, which is the worst of both worlds. Sizing the rows by the content
// they actually carry is the fix; anything else is shrinking type to pay for wasted space above it.
const BODY_ROWS: Record<string, string> = { S10: "minmax(0, 10fr) minmax(0, 24fr)" };

// X-0 · The four S8 fields the ◈ Edit source record panel already renders, in the operator's own order:
// the sentence, the NBA it must beat, the waterfall, and the differentiators behind it. When that panel is
// OPEN they are an echo of the editor directly above them — one reading the draft, one reading the record —
// so the edit view suppresses them. Named as a SET, not four conditions, so a fifth field moved into the
// panel is one entry here rather than a new branch someone has to notice.
// `capture`, `benefits` and `features` are deliberately absent: the panel does not render those, so hiding
// them would delete content instead of a duplicate.
const S8_PANEL_ECHO = new Set(["vprop", "nba", "valuechart", "diffs"]);

function AmtsPanel({ title, icon, required, wide, rows, children }: { title: string; icon?: React.ReactNode; required?: string; wide?: boolean; rows?: string; children: React.ReactNode }) {
  return (
    // data-panel / -head / -body are the SCREENSHOT GATE's hooks (scripts/slide-shots.mjs): a panel that
    // renders its title with an empty body is a hard build failure. Attributes only — zero visual effect.
    <div data-panel className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-cyan-500/25 bg-[#0b0f14] ${wide ? "col-span-2" : ""}`}>
      <div data-panel-head className="flex items-center justify-between gap-[1cqw] bg-cyan-500/10 px-[1cqw] py-[0.5cqh]">
        <span className="flex min-w-0 items-center gap-[0.6cqw] text-cyan-300">
          {icon && <span aria-hidden style={{ fontSize: TS.head }}>{icon}</span>}
          <span className="truncate font-semibold uppercase tracking-[0.14em]" style={{ fontSize: TS.head }}>{title}</span>
        </span>
        {required && <span className="shrink-0 whitespace-nowrap font-semibold tracking-wide text-amber-300/90" style={{ fontSize: TS.micro }}>REQUIRED: {required}+</span>}
      </div>
      {/* X-1 · `content-stretch` gives every child an EQUAL share of the panel's height, which is right when
          two panels carry similar weight and wrong when one is a chart and the other is three small figures.
          `rows` lets a panel say otherwise — S8's value panel gives the waterfall `1fr` and its metric strip
          `auto`. Opt-in, so every panel that does not pass it renders byte-identically to before. */}
      <div data-panel-body className={`grid min-h-0 flex-1 gap-[0.7cqh] p-[0.7cqw] ${rows ? "" : "content-stretch"}`}
           style={rows ? { gridTemplateRows: rows } : undefined}><PanelTitleCtx.Provider value={title}>{children}</PanelTitleCtx.Provider></div>
    </div>
  );
}

function SlideShowModal({ p, startSlide, onClose, onEditSource, openSource }: { p: Project; startSlide?: string; onClose: () => void; onEditSource?: (patch: Partial<Project>, changes: string[]) => void; openSource?: boolean }) {
  const { t } = useLexicon();
  const start = Math.max(0, SLIDE_SCHEMA.findIndex((s) => s.code === startSlide));
  const [idx, setIdx] = useState(start < 0 ? 0 : start);
  const [bags, setBags] = useState<Record<string, ProjFieldBag>>({});
  // W-14 · `bags` starts EMPTY and is filled by the hydrate effect. Nothing may persist until that has run,
  // or the first render writes `{}` over every authored field. See the debounced writer below.
  const hydrated = useRef(false);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [present, setPresent] = useState(false);
  const vp = useViewport(); // G2 — present mode adapts to portrait/landscape so the slide is readable on a phone
  // ONE CLOCK for the whole deck. S10's tables each called `new Date().getFullYear()` on every render, so a
  // deck left open across midnight on 31 December would re-anchor its columns mid-session and the stored plan
  // would silently shift a year. Read once, pass down; the pure lib still takes `baseYear` so tests pin 2026.
  const baseYear = useMemo(() => new Date().getFullYear(), []);
  // S8's driver working set. Seeded from the record (or the derived fallback so the equation is never blank)
  // and re-seeded when the project changes, exactly like the copy this replaces in Project details.
  const [s8Drivers, setS8Drivers] = useState<ValueDriver[]>(p.valueDrivers?.length ? p.valueDrivers : derivedDriversOf(p));
  // ⚠ KEYED ON `p.id` ALONE, AND THE `p.valueDrivers` DEP IS DELIBERATELY GONE. Driving the fix below found
  // a race the fix itself created: a landed write changes `p.valueDrivers`, which re-seeded this state and
  // CLOBBERED a newer draft the operator had already typed. Measured — editing three rows in a row persisted
  // ["300","301",""]: the third was overwritten by the echo of the second. Re-seeding on our own write is
  // never wanted; the comment above always said "when the project changes", and now the deps say it too.
  // Cost, stated: an EXTERNAL change to `valueDrivers` (there is no such writer today) would not refresh
  // this panel until the project is switched.
  useEffect(() => { setS8Drivers(p.valueDrivers?.length ? p.valueDrivers : derivedDriversOf(p)); }, [p.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  // ── X-0b · THE DRAFT ALWAYS LANDS ON THE RECORD ─────────────────────────────────────────────────────
  // Operator: "I can't edit; test all entry of numbers on value prop (while in Edit mode)." I DROVE IT, and
  // the report was exactly right in a way the screenshot could not show: typing WORKS (300/301/302 were
  // accepted and the chart moved 129→300, 108→301, 77→302) — and then a reload returned ["","",""]. The
  // edit reached the DRAFT and never reached the RECORD, so a successful edit looked like a failed one and
  // the seeded 69/56/58 on screen are PLACEHOLDERS, not values.
  // X-0 hid the duplicate read-out but deliberately kept this draft, and that deviation is what left the
  // defect alive. The draft stays — it is what makes entry fluid — but it now FLUSHES, exactly like W-14's
  // field bags: 400ms debounce, `pagehide` (not `beforeunload` — unreliable on iOS Safari), and an unmount
  // flush in its own effect because a `[s8Drivers]` cleanup fires on every keystroke.
  // ⚠ THE SEED GUARD IS LOAD-BEARING, TWICE OVER. The re-seed effect above keys on `p.valueDrivers`, so a
  // write that lands hands this effect a fresh array identity and the two would trade writes forever.
  // Comparing against the SEED (not just the record) also stops a spurious write of `derivedDriversOf(p)`
  // on mount and on every project switch — so opening a seeded project still writes nothing at all.
  const flushDrivers = useRef<(() => void) | null>(null);
  useEffect(() => {
    const seed = p.valueDrivers?.length ? p.valueDrivers : derivedDriversOf(p);
    if (JSON.stringify(seed) === JSON.stringify(s8Drivers)) return;   // unchanged → nothing to persist
    const snapshot = s8Drivers;
    const audit = [`value drivers: ${snapshot.length} vs NBA`];
    const write = () => { onEditSource?.({ valueDrivers: snapshot }, audit); flushDrivers.current = null; };
    const id = setTimeout(write, 400);
    flushDrivers.current = () => { clearTimeout(id); write(); };
    const onHide = () => flushDrivers.current?.();
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); clearTimeout(id); };
  }, [s8Drivers]);   // eslint-disable-line react-hooks/exhaustive-deps -- p/onEditSource read fresh at flush
  useEffect(() => () => { flushDrivers.current?.(); }, []);
  const [zoom, setZoom] = useState(1); // G-refine — pinch/tap zoom of the 16:9 slide (esp. portrait phones)
  // MEASURED PRESENT CHROME. `fit` used to be computed against a hardcoded 48px control bar; the bar is five
  // groups with no wrap, so on a 390px phone it takes two or three rows and the stage height was wrong by
  // 50-100px — which is why the operator's screenshots show the sheet parked below a screen of dead space.
  // Hooks live here, unconditionally, because Present mode is an early-return branch further down.
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const [chromeH, setChromeH] = useState(48);
  useEffect(() => {
    if (!present) return;
    const measure = () => setChromeH(chromeRef.current?.offsetHeight ?? 48);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && chromeRef.current) ro.observe(chromeRef.current);
    window.addEventListener("resize", measure);
    return () => { ro?.disconnect(); window.removeEventListener("resize", measure); };
  }, [present]);
  // ── Z6b · THE TABS NEVER SCALE — TWO INDEPENDENT MECHANISMS, EITHER ONE SUFFICIENT ────────────
  // Operator: "consider tabs at top separate from window with slide for zoom. These tabs when two finger
  // released get really big." Z6a stopped the SHEET collapsing under a browser pinch; this stops the CHROME
  // running away. Two mechanisms rather than one because the engine that matters — WebKit, which is what
  // iOS Chrome is — cannot be verified in this sandbox, so a single mechanism would be a single point of
  // failure on the only device that counts.
  //
  //   (1) BLOCK  — `gesturestart/change/end` are WebKit-proprietary and are how Safari and every iOS
  //                browser start a page pinch. preventDefault on them means a two-finger gesture reaches
  //                only OUR handler, which drives `zoom`, which by Z5 scales the sheet and never the bar.
  //                Non-passive, or preventDefault is ignored — the same reason `useWheel` exists in
  //                mission-planning.tsx:587, and the idiom is reused rather than reinvented.
  //   (2) PIN    — if a pinch lands anyway (an engine without gesture events, or a future WebKit change),
  //                `visualViewport` reports the magnification and offset, and the bar counter-scales and
  //                re-anchors to the visible rectangle. So the tabs hold their on-screen size AND stay
  //                reachable instead of panning off the top-left corner.
  //
  // PRESENT MODE ONLY. Outside the deck there is no in-app zoom to replace the affordance, and taking
  // browser zoom away from the Rack & Stack tables would be a real accessibility loss (Thor).
  const [vvPin, setVvPin] = useState<{ s: number; x: number; y: number; w: number } | null>(null);
  useEffect(() => {
    if (!present) return;
    const root = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement | null;
    const stop = (e: Event) => e.preventDefault();
    // touchmove covers engines with no gesture events; >=2 touches only, so a one-finger pan still works.
    const stopMulti = (e: Event) => { if ((e as TouchEvent).touches?.length >= 2) e.preventDefault(); };
    const target: EventTarget = root ?? document;
    for (const ev of ["gesturestart", "gesturechange", "gestureend"]) target.addEventListener(ev, stop, { passive: false });
    target.addEventListener("touchmove", stopMulti, { passive: false });
    const vv = window.visualViewport;
    // At scale 1 this stores null and the bar renders EXACTLY as before — the backstop has zero cost and
    // zero visual effect until a pinch actually gets through, which is what makes it safe to add.
    const onVv = () => setVvPin(vv && vv.scale > 1.01 ? { s: vv.scale, x: vv.offsetLeft, y: vv.offsetTop, w: vv.width } : null);
    onVv();
    vv?.addEventListener("resize", onVv); vv?.addEventListener("scroll", onVv);
    return () => {
      for (const ev of ["gesturestart", "gesturechange", "gestureend"]) target.removeEventListener(ev, stop);
      target.removeEventListener("touchmove", stopMulti);
      vv?.removeEventListener("resize", onVv); vv?.removeEventListener("scroll", onVv);
      setVvPin(null);
    };
  }, [present]);
  // The 20-page print stack is only MOUNTED while printing. Rendering 20 sheets (each with charts) behind a
  // `hidden` class would cost a phone the whole deck's layout on every present render, for pixels nobody sees.
  const [printing, setPrinting] = useState(false);
  // P1 · WHICH OF THE TWO PDFs. "friendly" is the default and is byte-identical to what shipped before,
  // so Ctrl/Cmd-P — which has no button to press and therefore no way to choose — keeps producing exactly
  // the artifact it produced yesterday. A keyboard shortcut that silently changes its output is the worst
  // kind of surprise, so the default is the incumbent, not the new thing.
  const [printMode, setPrintMode] = useState<"friendly" | "original">("friendly");
  const [exportOpen, setExportOpen] = useState(false);   // P2 · the two-option Export PDF menu
  useEffect(() => {
    // Ctrl/Cmd-P must produce the same artifact as the ⎙ PDF button — one path, not two.
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, []);
  // The PDF cover + every page footer name the R&D scenario the deck was exported under. Read from the SAME
  // "innovation-scenario" key the Board writes — one source, no prop drilling, no second definition.
  const [scenario, setScenario] = useState<BudgetScenario>("base");
  useEffect(() => { const sc = lsGet("innovation-scenario") as BudgetScenario | null; if (sc && BUDGET_SCENARIOS.some((x) => x.key === sc)) setScenario(sc); }, []);
  // Present-mode live source override (operator): flip the WHOLE deck between the human baseline and the enhanced
  // AI while presenting, or honor each field's own per-field choice ("set"). Edit mode always uses per-field mode.
  const [presentSrc, setPresentSrc] = useState<"set" | "hi" | "ai">("set");
  // Live governance snapshot for the CS + RA closeout slides (hydrated on mount alongside the field bag).
  const [gov, setGov] = useState<{ activity: AuditEntry[]; members: MembershipMap; board: string }>({ activity: [], members: {}, board: "IRB" });
  // Per-slide VERSION HISTORY for this project (persisted + demo seed), + replay scrubber state.
  const [versions, setVersions] = useState<SlideVersion[]>([]);
  const [showReplay, setShowReplay] = useState(false);
  const [vIdx, setVIdx] = useState(0);
  const [srcOpen, setSrcOpen] = useState(!!openSource); // "edit source record" panel (single source of truth) — F2: deep-link opens it expanded
  useEffect(() => { setBags(readFieldBags()); setStatus(readStore(SLIDE_KEY)); setGov({ activity: readAudit(), members: readMembers(), board: loadReviewBoard() }); setVersions(mergeSlideVersions(readVersions()[p.id] ?? [], buildDemoVersionSeed(p))); hydrated.current = true; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // W-14 · THE OTHER HALF: persistence is debounced, and NEVER runs before hydration.
  //
  // ⚠ THE GUARD IS THE LOAD-BEARING PART, NOT THE DEBOUNCE. `bags` initialises to `{}` and is filled by the
  // hydrate effect above. A naive `useEffect(… , [bags])` therefore fires ONCE WITH `{}` on first render and
  // persists an empty object — wiping every authored field in local storage AND in Supabase before the user
  // has touched anything. `hydrated` blocks that first pass; nothing is written until real data is loaded.
  //
  // NOTHING IS LOST ON EXIT. The timer is flushed synchronously on unmount and on `pagehide`, which fires on
  // tab close, navigation and mobile backgrounding (`beforeunload` does not fire reliably on iOS Safari —
  // the operator's own device). So the worst case is that a keystroke is persisted 400ms late, never never.
  const flushBags = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!hydrated.current) return;
    const snapshot = bags;                        // capture, so a later render cannot persist a stale object
    const id = setTimeout(() => { writeFieldBags(snapshot); flushBags.current = null; }, 400);
    flushBags.current = () => { clearTimeout(id); writeFieldBags(snapshot); flushBags.current = null; };
    const onHide = () => flushBags.current?.();
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); clearTimeout(id); };
  }, [bags]);
  // Unmount is its own effect: the cleanup above clears the timer on EVERY bags change, so a flush written
  // there would fire on every keystroke and undo the debounce entirely. This one runs only on teardown.
  useEffect(() => () => { flushBags.current?.(); }, []);
  const spec = SLIDE_SCHEMA[idx];
  const bag = bags[p.id] || {};
  // Fall back to the 12-AsM authored seed when the user hasn't authored a cell: seeded HI shows by default;
  // flipping to AI (per-field or the present toggle) shows the enhanced seeded AI. User edits (writeCell) win.
  const cellOf = (code: string, fid: string): FieldCell => bag[code]?.[fid] ?? { hi: SLIDE_SEED[p.id]?.[code]?.[fid]?.hi ?? null, ai: SLIDE_SEED[p.id]?.[code]?.[fid]?.ai ?? null, mode: "hi" };
  const aiFor = (code: string, fid: string): SlideFieldValue => aiSlideField(p, code, fid);
  // Effective value for display + present: linked → live record; else the active-mode slot (AI slot falls back
  // to the deterministic AI draft); empty + mirror → inherit the referenced slide's field.
  const effective = (sp: SlideSpec, f: SlideField, srcOverride?: "set" | "hi" | "ai"): SlideFieldValue => {
    if (f.linked) {
      // CS + RA resolve from LIVE governance data (audit trail + membership + review board) — never authored.
      // X-7b · now ONE code. `history` is the operator's Gate Review History matrix: the business case at
      // every gate, read from the approved version snapshots. Flattened to string[][] here so the generic
      // LinkedField still renders it in Present mode; the CSRA panel renders the same rows WITH the
      // red change-flags, from the identical producer — one source, two presentations.
      if (sp.code === "CSRA" && f.id === "history")
        return gateReviewHistoryRows(p, finOf(p, baseYear), versions).rows
          .map((r) => [`${r.rail} · ${r.label}`, ...r.values.map((v) => v ?? "—")]);
      if (sp.code === "CSRA" && f.id === "approvals") {
        const ap = gateApprovalPanels(p, gov.members, gov.activity, gov.board);
        return [...ap.prior.rows, ...ap.current.rows].map((r) => [r.required ? "●" : "○", r.fn, r.name, r.date]);
      }
      if (sp.code === "CSRA" && f.id === "board") return `${boardFull(gov.board)} (${gov.board})`;
      // `baseYear` is the deck's ONE clock (hoisted at the root). Passing it means an S10 read-out anchors to
      // exactly the calendar the S10 grid three inches above it is anchored to — the two cannot disagree.
      return linkedSlideField(p, sp.code, f.id, baseYear);
    }
    const c = cellOf(sp.code, f.id);
    // Present-mode override (As-set → per-field mode; HI/AI → force that slot); edit mode passes nothing.
    const m = srcOverride && srcOverride !== "set" ? srcOverride : c.mode;
    const v = m === "ai" ? (fieldEmpty(c.ai) ? aiFor(sp.code, f.id) : c.ai) : c.hi;
    if (fieldEmpty(v) && f.mirror) {
      const [mc, mf] = f.mirror.split(".");
      const ms = slideSpec(mc); const mff = ms?.fields.find((x) => x.id === mf);
      if (ms && mff) return effective(ms, mff, srcOverride);
    }
    return v;
  };
  // W-14 · FLUID NUMBER ENTRY. Operator: "Input fields allow for one number, then it takes me off; need
  // fluid number entry for all Value Prop numbers." Their screenshot showed `VALUE CAPTURE % 3` after
  // typing 33 — a dropped character, not a rendering bug.
  //
  // THE CAUSE, LOCATED NOT GUESSED. `writeFieldBags` (page.tsx, above) does TWO expensive things:
  //   lsSet(KEY, JSON.stringify(obj))   — serialises the ENTIRE portfolio bag, every project, every slide
  //   void saveState("slide-fields", …) — and fires a Supabase write
  // It was called INSIDE the `setBags` updater, so both ran on EVERY KEYSTROKE — and a state updater must be
  // pure, because React invokes it twice in StrictMode, doubling the work again. A controlled input whose
  // parent does O(whole-portfolio) work per character loses keystrokes and drops the caret.
  //
  // THE FIX IS TWO SEPARATIONS, NOT A REWRITE OF THE INPUTS:
  //   1. the updater becomes PURE — it computes the next bag and returns it, nothing else;
  //   2. persistence moves to a debounced effect below, so typing is bounded by React state alone.
  // The inputs themselves are untouched, so no field changes its editing behaviour or its value semantics.
  const writeCell = (code: string, fid: string, patch: Partial<FieldCell>) => setBags((prev) => {
    const nb = { ...prev }; const pb = { ...(nb[p.id] || {}) }; const cb = { ...(pb[code] || {}) };
    const baseCell: FieldCell = cb[fid] ?? { hi: null, ai: null, mode: "hi" };
    cb[fid] = { ...baseCell, ...patch };
    pb[code] = cb; nb[p.id] = pb; return nb;
  });
  const setActive = (code: string, fid: string, v: SlideFieldValue) => { const c = cellOf(code, fid); writeCell(code, fid, c.mode === "ai" ? { ai: v } : { hi: v }); };
  const setMode = (code: string, fid: string, mode: "hi" | "ai") => writeCell(code, fid, { mode });
  // "% authored" per slide. S10 HAS NO SCHEMA FIELDS — its content is the financial grid — so asking the
  // field list would score it 100% forever, which is worse than the duplicate tables it replaced. It asks the
  // RECORD instead: how many of the years this gate requires actually carry a forecast. That is a truer
  // measure than "did someone type into a table", and it is the same function the gate ladder already uses.
  const fillOf = (sp: SlideSpec) => {
    if (sp.code === "S10") { const r = finGateReadiness(finOf(p, baseYear), p.gate); return r.need ? r.filled / r.need : 1; }
    const req = sp.fields.filter((f) => f.req); const base = req.length ? req : sp.fields;
    if (!base.length) return 1;
    return base.filter((f) => !fieldEmpty(effective(sp, f))).length / base.length;
  };
  // ⚠ A SLIDE WITH NO AUTHORABLE FIELD CANNOT BE "100% COMPLETE" — operator: "make CS+RA tab grey not green".
  // They are right, and it is a semantic error rather than a colour preference. `fillOf` falls back to ALL
  // fields when a slide declares no `req` ones; CS+RA's three are live governance read-outs that always
  // resolve, so it scored 3/3 = 100% and wore the emerald "done" badge every other tab has to EARN by being
  // filled in. A derived read-out can never be incomplete, so "complete" is meaningless praise.
  //
  // ⚠ S10 IS EXCLUDED DELIBERATELY. Every S10 schema field is linked too, but S10 HAS a real completeness
  // measure — finGateReadiness over the year grid, the branch on the first line of fillOf — so its colour
  // means something. The rule is "no completeness signal", not "all fields linked".
  //
  // ⚠ THIS ALSO CHANGES S9, AND I AM SAYING SO RATHER THAN LETTING IT BE DISCOVERED. S9's one required
  // field (`stories`) is linked as well, so its green was equally hollow. Executed: exactly S9 and CSRA of
  // the 19 slides move; every other tab is byte-identical.
  const hasFillSignal = (sp: SlideSpec) => sp.code === "S10" || sp.fields.some((f) => !f.linked);
  const st = status[`${p.id}|${spec.code}`] || "";
  // Capture a durable version snapshot of the CURRENT slide (fields + financial snapshot). Deterministic id;
  // ts injected here (UI layer). Substantial = ≥10% quantified move vs the prior version → manager-approval flag.
  const captureVersion = (vstatus: SlideVersion["status"], comment: string, by = "웃 HI") => {
    const fields: SlideVersion["fields"] = {};
    for (const f of spec.fields) {
      if (f.linked || f.kind === "chart" || f.kind === "attach") continue;
      const c = cellOf(spec.code, f.id); fields[f.id] = { hi: c.hi, ai: c.ai, mode: c.mode };
    }
    const fin = finSnapOf(p);
    const prior = [...versions].filter((v) => v.slide === spec.code).sort((a, b) => b.ts.localeCompare(a.ts))[0];
    const substantial = prior ? isSubstantial(versionDelta(prior.fin, fin)) : false;
    const v = makeSlideVersion({ ts: new Date().toISOString(), projectId: p.id, slide: spec.code, gate: p.gate, by, status: vstatus, comment, substantial, fields, fin });
    const next = mergeSlideVersions(versions, [v]);
    setVersions(next);
    const all = readVersions(); all[p.id] = next; writeVersions(all);
    return substantial;
  };
  const cycleStatus = () => setStatus((prev) => {
    const kk = `${p.id}|${spec.code}`, cur = prev[kk] || "";
    const next = SLIDE_STATES[(SLIDE_STATES.indexOf(cur as (typeof SLIDE_STATES)[number]) + 1) % SLIDE_STATES.length];
    const u = { ...prev, [kk]: next }; writeStore(SLIDE_KEY, "slides", u);
    if (next === "approved") captureVersion("approved", "Approved at gate — baseline locked."); // auto-save approved versions
    return u;
  });
  const slideVersions = versions.filter((v) => v.slide === spec.code).sort((a, b) => a.ts.localeCompare(b.ts)); // oldest→newest
  const go = (d: number) => setIdx((i) => Math.min(SLIDE_SCHEMA.length - 1, Math.max(0, i + d)));
  const deckPct = Math.round((SLIDE_SCHEMA.reduce((a, s) => a + fillOf(s), 0) / SLIDE_SCHEMA.length) * 100);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName; const typing = tag === "TEXTAREA" || tag === "INPUT";
      if (e.key === "Escape") { e.preventDefault(); present ? setPresent(false) : onClose(); }
      else if (e.key === "ArrowLeft" && !typing) { e.preventDefault(); go(-1); }
      else if (e.key === "ArrowRight" && !typing) { e.preventDefault(); go(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present]); // eslint-disable-line react-hooks/exhaustive-deps
  // Present mode → real OS full-screen (operator: "full-screen stage"). Best-effort; exits on leave.
  useEffect(() => {
    if (!present || typeof document === "undefined") return;
    const el = document.documentElement;
    el.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
  }, [present]);
  // Swipe nav + PINCH-ZOOM on the stage. One-finger drag pages the deck; two fingers zoom the 16:9 canvas.
  // The pinch EXTENDS the existing `zoom` state (the ＋/－ buttons stay the same source of truth) —
  // `startZoom` is captured when the gesture begins so a pinch continues from where the buttons left off
  // instead of snapping to 1×. `pinching` suppresses the swipe handler so lifting ONE finger out of a pinch
  // can never page the slide (Enki).
  //
  // ⚠ POINTER EVENTS, NOT TOUCH EVENTS — AND THAT IS THE WHOLE BUG (measured 2026-07-30, CDP two-finger
  // probe on the built app at 390x844). The gesture was wired to onTouchStart/Move/End. A TouchEvent
  // sequence whose target lies INSIDE [data-slide-zoom] is terminated by the browser the instant the zoom
  // re-render mutates that subtree: of 8 dispatched pinch frames the page received 2, then nothing — no
  // further touchmove, no touchend, no touchcancel, ever. So a pinch advanced exactly ONE frame
  // (100% → 145%) and froze, no matter how far the fingers travelled; the ＋/－ buttons masked it because a
  // click is a single discrete event. The same gesture, on the same element, delivers 16/16 pointermove
  // frames — Chrome's implicit pointer capture keeps a touch pointer bound to its element across the
  // mutation. Pinching the header, footer or the empty stage always worked (those targets sit OUTSIDE the
  // zoom viewport), which is exactly why the bug survived the +/- verification.
  // Mouse pointers are ignored so a desktop click-drag still cannot page the deck. `touchAction: "none"` on
  // the stage root (below) is what makes pointermove fire at all for touch — do not remove it.
  // Live pointers, in the order they touched down — a plain array, so [0] and [1] are the same two fingers
  // `touches[0]`/`touches[1]` used to be.
  const ptrs = useRef<{ id: number; clientX: number; clientY: number }[]>([]);
  const touchX = useRef<number | null>(null);
  // Z5 · THE PAN VIEWPORT, and it has to be driven by hand. The stage root sets `touchAction: "none"` (that
  // is what makes pointermove fire for touch at all — see the note above), so the browser will NEVER scroll
  // this container for a finger. Wheel and trackpad are unaffected by touch-action and scroll natively.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pinchDist = useRef(0);
  const startZoom = useRef(1);
  const pinching = useRef(false);
  const spread = () => (ptrs.current.length >= 2 ? touchDistance(ptrs.current[0], ptrs.current[1]) : 0);
  /** Record/refresh one pointer. Returns false when the pointer was not already being tracked. */
  const track = (e: React.PointerEvent, add: boolean) => {
    const i = ptrs.current.findIndex((q) => q.id === e.pointerId);
    if (i < 0) { if (!add) return false; ptrs.current.push({ id: e.pointerId, clientX: e.clientX, clientY: e.clientY }); return true; }
    ptrs.current[i] = { id: e.pointerId, clientX: e.clientX, clientY: e.clientY };
    return true;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    track(e, true);
    if (ptrs.current.length >= 2) {
      pinching.current = true;
      pinchDist.current = spread();
      startZoom.current = zoom;
      touchX.current = null;
      return;
    }
    touchX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = ptrs.current.find((q) => q.id === e.pointerId);
    const dx = prev ? e.clientX - prev.clientX : 0, dy = prev ? e.clientY - prev.clientY : 0;
    if (!track(e, false)) return;
    if (pinching.current && ptrs.current.length >= 2) { setZoom(pinchZoom(startZoom.current, pinchDist.current, spread())); return; }
    // Z5 · ONE FINGER PANS THE PAGE WHILE ZOOMED. Drag the sheet and it follows the finger, so scrollLeft
    // moves OPPOSITE the delta. Only above 1x: at 1x the sheet always fits, there is nothing to pan, and the
    // same drag must still page the deck (handled on pointerup).
    if (!pinching.current && ptrs.current.length === 1 && zoom > 1 && stageRef.current) {
      const st = stageRef.current;
      st.scrollLeft -= dx; st.scrollTop -= dy;
    }
  };
  // pointerup AND pointercancel land here: a cancelled pointer that never cleared `pinching` would leave the
  // swipe handler dead for the rest of the session.
  const onPointerUp = (e: React.PointerEvent) => {
    const i = ptrs.current.findIndex((q) => q.id === e.pointerId);
    if (i < 0) return;
    ptrs.current.splice(i, 1);
    if (pinching.current) { if (ptrs.current.length === 0) { pinching.current = false; pinchDist.current = 0; } return; }
    if (touchX.current == null) return;
    const dx = e.clientX - touchX.current;
    // ZOOMED IN, A DRAG PANS — IT DOES NOT PAGE. Z5 moved the transform back onto the whole sheet, so the
    // PAGE is what moves under your finger (onPointerMove drives the stage scroller); paging the deck out
    // from under a half-read table is the opposite of what the gesture means. At 1x nothing changed: the
    // sheet always fits, there is nothing to pan, and a swipe still turns the page.
    if (zoom <= 1 && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  // ---- field editors (edit-mode) ----
  const inputCls = "w-full rounded-lg border border-slate-700 bg-[#0e141b] px-2.5 py-1.5 text-[13px] text-slate-100 outline-none focus:border-cyan-500";
  function LinkedField({ f }: { f: SlideField }) {
    const v = effective(spec, f); // routes CS/RA to live governance, others to linkedSlideField
    if (f.kind === "metrics" && v && !Array.isArray(v) && typeof v === "object") {
      const rec = v as Record<string, string>;
      return <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">{(f.items ?? []).map((m) => (
        <div key={m.k} className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] px-2 py-1.5"><div className="text-[9px] uppercase tracking-wider text-slate-500">{m.label}</div><div className="text-[13px] font-semibold tabular-nums text-emerald-300">{rec[m.k] ?? "—"}</div></div>
      ))}</div>;
    }
    if (Array.isArray(v)) {
      const rows = v as string[][];
      // COLUMN HEADERS, when the field declares them. The editable table renders a `<thead>` from `f.cols`;
      // a read-out that dropped it would REMOVE labels the operator can see today — five bare numbers with
      // nothing saying which is Labor and which is Other. Converting a field to read-only must take away the
      // typing, never the reading. Applies to every linked table, so S3's revenue read-out gains it too.
      return <div className="overflow-x-auto"><table className="w-full text-[12px]">
        {!!f.cols?.length && <thead><tr>{f.cols.map((c) => <th key={c} className="px-2 pb-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{c}</th>)}</tr></thead>}
        <tbody>{rows.map((r, ri) => <tr key={ri} className="border-b border-slate-900">{r.map((c, ci) => <td key={ci} className="px-2 py-1 tabular-nums text-emerald-300">{c}</td>)}</tr>)}</tbody></table></div>;
    }
    // chart → live financial mini-chart from the project record (import project financials); maximizable
    if (f.kind === "chart") return <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-2"><div className="mb-1 text-[10px] text-emerald-300/80">◈ Live from the project record</div><ChartFrame label={f.name}><MiniFinChart kind={spec.code} /></ChartFrame></div>;
    return <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] px-3 py-2 text-[12px] text-emerald-300/90">◈ Live from the project record — {f.name} is derived, not typed.</div>;
  }
  // Attach/image editor (operator: "Customer CONOPS" + Light-Codex shared library). Three ways to set the image:
  // UPLOAD (inline data URI, ~2.5 MB cap) · PASTE a URL (BYOK/provider) · PICK from the shared image library
  // (populated here + by the Light-Codex tool). Uploads/pastes also add to the library so other slides can reuse.
  function AttachEditor({ f }: { f: SlideField }) {
    const c = cellOf(spec.code, f.id);
    const val = c.mode === "ai" ? (fieldEmpty(c.ai) ? aiFor(spec.code, f.id) : c.ai) : c.hi;
    const s = (val as string) || "";
    const isImg = isImageSrc(s);
    const [libOpen, setLibOpen] = useState(false);
    const [lib, setLib] = useState<LibImage[]>([]);
    useEffect(() => { if (libOpen) setLib(loadImageLibrary()); }, [libOpen]);
    // Provenance stamp (Project · Date · Time · Name) — becomes the hidden Light-Codex message + the library tags.
    const nowStamp = () => { const d = new Date(); return { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }; };
    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      if (file.size > 2_500_000) { alert("Image is over 2.5 MB — please use a smaller file."); e.target.value = ""; return; }
      e.target.value = "";
      const { date, time } = nowStamp();
      const who = p.manager || "operator";
      // Transparent Light-Codex signing (1×1 double helix) — hidden provenance message; user never sees Light Codex.
      const src = await signedDataURL(file, `${p.id} ${p.name} | ${date} ${time} | ${who}`);
      if (!src) return;
      setActive(spec.code, f.id, src);
      addToImageLibrary(file.name || f.name, src, { project: `${p.id} ${p.name}`, date, time, who });
    };
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {isImg
            ? <img src={s} alt={f.name} className="h-16 w-auto rounded border border-slate-700 object-cover" />
            : <span className="rounded-lg border border-slate-700 bg-[#0e141b] px-2.5 py-1.5 text-[12px] text-slate-400">{s || "No image yet"}</span>}
          <label className="cursor-pointer rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300 hover:bg-cyan-500/20">
            {isImg ? "Replace image" : "⬆ Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          <button onClick={() => setLibOpen((v) => !v)} className="rounded border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200 hover:bg-violet-500/20">◫ Library</button>
          {s && <button onClick={() => setActive(spec.code, f.id, "")} className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-500 hover:border-rose-500/50 hover:text-rose-300">Clear</button>}
        </div>
        <input type="url" inputMode="url" defaultValue={/^https?:\/\//i.test(s) ? s : ""} placeholder="…or paste an image URL (BYOK / provider)"
          onBlur={(e) => { const u = e.target.value.trim(); if (u && u !== s) { const { date, time } = nowStamp(); setActive(spec.code, f.id, u); addToImageLibrary(f.name, u, { project: `${p.id} ${p.name}`, date, time, who: p.manager || "operator" }); } }}
          className={`${inputCls} text-[12px]`} />
        {libOpen && (
          <div className="rounded-lg border border-slate-800 bg-[#0b0f14] p-2">
            <div className="mb-1.5 text-[10px] text-slate-500">Image library — each stamped Project · Date · Time · Name. Tap to use · ✕ to delete.</div>
            {lib.length ? (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {lib.map((im, i) => (
                  <div key={i} className="relative overflow-hidden rounded border border-slate-700 hover:border-cyan-500">
                    <button onClick={() => { setActive(spec.code, f.id, im.src); setLibOpen(false); }} title={im.name} className="block w-full">
                      <img src={im.src} alt={im.name} className="aspect-video w-full object-cover" />
                      <div className="px-1.5 py-1 text-left text-[8px] leading-tight text-slate-400">
                        <div className="truncate text-slate-300">{im.name}</div>
                        <div className="truncate">{im.project ?? "—"}</div>
                        <div className="truncate">{[im.date, im.time].filter(Boolean).join(" ")}{im.who ? ` · ${im.who}` : ""}</div>
                      </div>
                    </button>
                    <button onClick={() => setLib(removeFromImageLibrary(im.src))} aria-label="Delete image" title="Delete from library"
                      className="absolute right-0.5 top-0.5 rounded bg-[#0b0f14]/85 px-1 text-[10px] text-rose-300 hover:bg-rose-500/20">✕</button>
                  </div>
                ))}
              </div>
            ) : <div className="text-[10px] italic text-slate-600">Library empty — upload here or in the Light Codex tool.</div>}
          </div>
        )}
      </div>
    );
  }
  function FieldEditor({ f }: { f: SlideField }) {
    if (f.linked) return <LinkedField f={f} />;
    const c = cellOf(spec.code, f.id);
    const v = c.mode === "ai" ? (fieldEmpty(c.ai) ? aiFor(spec.code, f.id) : c.ai) : c.hi;
    if (f.kind === "text") return <input className={inputCls} value={(v as string) || ""} placeholder={f.mirror ? `Inherits from ${f.mirror}` : "Type here"} onChange={(e) => setActive(spec.code, f.id, e.target.value)} />;
    if (f.kind === "longtext") return <textarea rows={3} maxLength={4000} className={`${inputCls} resize-y leading-relaxed`} value={(v as string) || ""} placeholder={f.mirror ? `Inherits from ${f.mirror}` : "Evidence, insight, judgment."} onChange={(e) => setActive(spec.code, f.id, e.target.value)} />;
    if (f.kind === "attach") return <AttachEditor f={f} />;
    if (f.kind === "metrics") { const rec = ((v as Record<string, string>) || {}); return <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">{(f.items ?? []).map((m) => (
      <label key={m.k} className="rounded-lg border border-slate-700 bg-[#0e141b] px-2 py-1.5"><div className="text-[9px] uppercase tracking-wider text-slate-500">{m.label}</div><input className="w-full bg-transparent text-[14px] font-semibold text-slate-100 outline-none" value={rec[m.k] || ""} placeholder="—" onChange={(e) => setActive(spec.code, f.id, { ...rec, [m.k]: e.target.value })} /></label>
    ))}</div>; }
    if (f.kind === "list") { const rows = ((v as string[])?.length ? (v as string[]) : [""]); return <div className="space-y-1.5">{rows.map((r, i) => (
      <div key={i} className="flex items-center gap-1.5">{f.ordered && <span className="w-4 shrink-0 text-right text-[10px] text-slate-500">{i + 1}</span>}<input className={inputCls} value={r} placeholder="Add a point" onChange={(e) => { const nr = [...rows]; nr[i] = e.target.value; setActive(spec.code, f.id, nr); }} /><button onClick={() => { const nr = rows.filter((_, j) => j !== i); setActive(spec.code, f.id, nr.length ? nr : [""]); }} className="shrink-0 rounded border border-slate-700 px-2 text-slate-500 hover:border-rose-500/50 hover:text-rose-300" aria-label="Remove">×</button></div>
    ))}<button onClick={() => setActive(spec.code, f.id, [...rows, ""])} className="rounded border border-dashed border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:border-cyan-500 hover:text-cyan-300">+ Add point</button></div>; }
    if (f.kind === "table") { const cols = f.cols ?? []; const rows = ((v as string[][])?.length ? (v as string[][]) : [cols.map(() => "")]); return <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-[12px]"><thead><tr>{cols.map((c) => <th key={c} className="px-1 pb-1 text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">{c}</th>)}<th /></tr></thead><tbody>{rows.map((r, ri) => (
      <tr key={ri}>{cols.map((c, ci) => <td key={ci} className="px-0.5 pb-1">{c === "Team"
        // RECONCILIATION (23b): the operator's S9 schema has EIGHT columns and none of them is Team, so the
        // discipline is no longer an S9 table control — there is nowhere to put it that they asked for, and
        // inventing a parallel per-row store would be a second persistence path. The selector and its
        // Req-ID generation are KEPT: per-row discipline comes from storiesOf(), defaulting through
        // defaultDiscipline(p), and drives the CRS-##.IN.<TEAM>.### traceability ID that the matrix consumes.
        // TeamPicker stays wired to any table that DOES declare a Team column, so nothing was deleted.
        ? <TeamPicker value={r[ci] || ""} onChange={(next) => { const nr = rows.map((x) => [...x]); nr[ri][ci] = next; const idc = cols.indexOf("Req ID"); const tc = cols.indexOf("Team");
              // Renumber EVERY row, not just this one: recomputing only the edited row from its index means
              // deleting row 3 of 6 leaves 001,002,004,005,006 and the next added row collides on 006.
              if (idc >= 0) nr.forEach((rr, k) => { rr[idc] = storyReqId(p.id, (tc >= 0 ? rr[tc] : "") || "SRS", k + 1); });
              setActive(spec.code, f.id, nr); }} />
        : <input className="w-full rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] text-slate-100 outline-none focus:border-cyan-500" value={r[ci] || ""} placeholder={c} onChange={(e) => { const nr = rows.map((x) => [...x]); nr[ri][ci] = e.target.value; setActive(spec.code, f.id, nr); }} />}</td>)}<td className="pb-1"><button onClick={() => { const nr = rows.filter((_, j) => j !== ri); setActive(spec.code, f.id, nr.length ? nr : [cols.map(() => "")]); }} className="rounded border border-slate-700 px-1.5 text-slate-500 hover:border-rose-500/50 hover:text-rose-300" aria-label="Remove row">×</button></td></tr>
    ))}</tbody></table><button onClick={() => setActive(spec.code, f.id, [...rows, cols.map(() => "")])} className="mt-1 rounded border border-dashed border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:border-cyan-500 hover:text-cyan-300">+ Add row</button></div>; }
    return null;
  }

  // ---- present-mode field renderer (read effective value) ----
  // Financial mini-chart drawn LIVE from the project record (import project financials). S3 = R&D spend
  // vs Revenue + Margin by Year (grouped bars); S14 = combined resource needs ($/yr). Deterministic SVG.
  function MiniFinChart({ kind, big }: { kind: string; big?: boolean }) {
    // S3 — Business-Case cash chart (AMTS deck parity): R&D / NRE renders as a NEGATIVE flow (money out, below
    // zero), Revenue + Margin above zero, and cumulative CASH FLOW as a line. Horizon toggle renders horizon+1
    // year points so a CAGR spanning `horizon` years reads across `horizon+1` columns (3-Yr→4, 5-Yr→6, 10-Yr→11).
    if (kind === "S3") return <S3CashChart p={p} big={big} />;
    if (kind === "S8") return <ValueProp p={p} mode="slide" big={big} />;
    const fo = financialsOverview(p, { years: 6, funded: true });
    const series = kind === "S14"
      ? [{ label: "Resource $ (R&D)", color: "#a78bfa", vals: fo.map((r) => r.rdK / 1000) }]
      : [
          { label: "Revenue", color: "#34d399", vals: fo.map((r) => r.revM) },
          { label: "Margin", color: "#f7b955", vals: fo.map((r) => r.marginM) },
          { label: "R&D", color: "#64748b", vals: fo.map((r) => r.rdK / 1000) },
        ];
    const max = Math.max(1, ...series.flatMap((s) => s.vals)) * 1.12;
    const W = 320, H = big ? 150 : 96, L = 4, B = 16, T = 6, n = fo.length, ns = series.length;
    const gw = (W - L) / n, bw = Math.max(3, (gw * 0.7) / ns);
    const y = (val: number) => H - B - (val / max) * (H - B - T);
    return (
      <div>
        <div className="mb-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {series.map((s) => <span key={s.label} className="flex items-center gap-1 text-[10px] text-slate-400"><span data-ink className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.label}</span>)}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={big ? { height: "20cqh" } : { height: "auto" }} role="img" aria-label={`${kind} financials by year`}>
          {[0.25, 0.5, 0.75, 1].map((fr) => <line key={fr} x1={L} y1={y(max * fr)} x2={W} y2={y(max * fr)} stroke="rgba(148,163,184,.1)" />)}
          {fo.map((r, i) => (
            <g key={r.year}>
              {series.map((s, si) => { const x = L + i * gw + gw * 0.15 + si * bw; const yy = y(s.vals[i]); return <rect key={si} x={x} y={yy} width={bw - 1} height={Math.max(0, H - B - yy)} fill={s.color} rx={1} />; })}
              <text x={L + i * gw + gw / 2} y={H - 4} textAnchor="middle" fontSize="6" fill="#64748b" fontFamily="ui-monospace, monospace">{r.year}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }
  // SINGLE SOURCE OF TRUTH — R&D/NRE, financials and resource planning all derive from the project record
  // (financialMetrics/financialsOverview read p.nreK; S10 spend + S14 resources trace to the same number).
  // Every financial/resource field carries a direct icon-link to edit that ONE record; edits propagate to
  // every derived surface in real time via React state (no duplicate sources anywhere).
  // WHICH SLIDE TAKES INPUT has ONE answer, and it is `SOURCE_SLIDE` (innovation-data.ts). This used to be
  // three literals that could drift: a FIN_FIELDS map, a hardcoded `spec.code === "S10"` panel gate, and a
  // SourceLink that always jumped to S10 whatever record you were looking at. All three now read the table,
  // so a field's Edit-Source control lands on the slide that actually owns it (operator: "Edit Source that
  // takes user to the right S## to edit").
  // Codes that actually RENDER a source panel today. `SOURCE_SLIDE` says who owns a record; this says whose
  // editor is built. An Edit-Source button is only drawn when its target can actually be typed into — the
  // whole defect this commit repairs was a button pointing at a slide with no editor behind it.
  const SOURCE_PANEL_CODES = ["S10", "S8"];
  const panelExists = (code: string) => SOURCE_PANEL_CODES.includes(code);
  // Edit Source is a NAVIGATION affordance, so it is drawn only where there is somewhere to go. On the
  // owning slide the editor is already right there (the source panel below, in Edit mode) and Present mode
  // has no editor at all — so a button there is pure height. Adding S8 to the registry put four of them on
  // one slide and overflowed it by 34px; the rule, not the slide, was wrong.
  const hasSourceLink = (code: string, fid: string) => { const o = sourceSlideOf(code, fid); return !!o && o !== code && panelExists(o); };
  const idxOfCode = (code: string) => SLIDE_SCHEMA.findIndex((s) => s.code === code);
  // Off the owning slide this is a DEEP LINK, not a dead button. The editor moved; the way in must not
  // disappear with it, or a user standing on S3 wondering where NPV comes from has nowhere to go.
  const SourceLink = ({ source, code, fieldId, target, inline }: { source?: string; code?: string; fieldId?: string; target?: string; inline?: boolean }) => {
    const owner = target ?? (code && fieldId ? sourceSlideOf(code, fieldId) : null) ?? "S10";
    const here = spec.code === owner;
    const oi = idxOfCode(owner);
    // The label is chosen by the OWNER, from `SOURCE_LABEL`, never typed at the call site — so a third
    // source names its own control instead of requiring an edit here, on the field header and in Present.
    const verb = (code && fieldId ? sourceLabelOf(code, fieldId) : SOURCE_LABEL[owner]) || "Edit source";
    return (
      <button onClick={() => { setPresent(false); if (!here && oi >= 0) setIdx(oi); setSrcOpen(true); }}
        title={here
          ? `${verb} — ${owner} owns this record. Updates everywhere in real time.`
          : `Entered on ${owner}, the single source of truth. Opens ${owner} with the editor ready.`}
        className={inline
          ? "inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-medium text-emerald-300 hover:bg-emerald-500/20"
          : "mt-2 inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/20"}>
        <span aria-hidden>✎</span> {verb}{source ? `: ${source}` : ""} <span aria-hidden>→</span>
      </button>
    );
  };
  // `bare` — the field is the ONLY thing in an AMTS panel, so the panel banner has already named it. Drawing
  // a second banner with the same words directly under the first is what pushed the actual value out of the
  // clipped panel and made S1/S2 read as "field name, no value" (operator, 2026-07-29). Bare drops the inner
  // banner AND the inner card frame; AmtsPanel supplies both.
  function PresentField({ sp, f, big, bare }: { sp: SlideSpec; f: SlideField; big?: boolean; bare?: boolean }) {
    const acc = sectionAccent(sp.code, f);
    const panelTitle = React.useContext(PanelTitleCtx);
    // The panel banner directly above already says this field's name — a second identical banner is chrome
    // that costs a row and says nothing (item #2's law, now covering multi-field panels too).
    bare = bare || (!!panelTitle && sameName(panelTitle, f.name));
    // Colored banner header (icon + section name) matching the reference deck, wrapping every field card.
    const Banner = () => (
      <div data-field-banner className={`flex items-center gap-1.5 ${big ? "px-[0.8cqw] py-[0.45cqh]" : "px-3 py-1.5"} ${acc.bar}`} style={big ? { fontSize: TS.head } : undefined}>
        <span aria-hidden className={big ? "leading-none" : "text-[12px] leading-none"}>{acc.icon}</span>
        <span className={`font-semibold uppercase tracking-[0.14em] ${big ? "" : "text-[10px]"}`}>{f.name}{f.linked ? ` · ✎ ${sourceLabelOf(sp.code, f.id)}` : ""}</span>
      </div>
    );
    if (f.kind === "chart" && f.linked) return (
      <div className={bare ? "flex min-h-0 min-w-0 flex-col" : `flex min-h-0 flex-col overflow-hidden rounded-lg ring-1 ring-inset ${acc.ring} bg-[#0b0f14] col-span-2`}>
        {!bare && <Banner />}
        {/* X-1 · `flex-1 min-h-0` — without it this div collapses to CONTENT height inside its
            `flex min-h-0 flex-col` parent, so widening the panel row above changed nothing at all. Two
            constraints, and fixing either alone is invisible; that is why this looked wrong three times. */}
        <div className={`${bare ? "" : big ? "p-[0.45cqw]" : "p-2"} flex min-h-0 flex-1 flex-col`}><ChartFrame label={f.name}>
          <MiniFinChart kind={sp.code} big={big} />
          {/* Direct link to the slide that owns the record feeding this chart — drawn only when that slide
              actually has an editor, so the button can never be a no-op. */}
          {hasSourceLink(sp.code, f.id) && <SourceLink source={sp.source} code={sp.code} fieldId={f.id} />}
        </ChartFrame></div>
      </div>
    );
    const v = effective(sp, f, presentSrc); if (fieldEmpty(v)) return null;
    // On CONOPS slides the FIRST attach (visual/image) is shown as the hero inside the steps view — don't
    // render it again as a standalone card.
    const heroAttachId = sp.fields.find((x) => x.kind === "attach")?.id;
    if (f.kind === "attach" && sp.fields.some((x) => x.id === "conops") && f.id === heroAttachId) return null;
    const isVp = /valueprop|vprop|desc/i.test(f.id) || f.name.toLowerCase().includes("value prop");
    // CONOPS (operational concept) renders as a numbered step-flow — 6–10 ordered steps, each an image-tiled
    // card — matching the reference deck; spans the full width so the sequence reads left-to-right.
    const isConops = f.id === "conops" && (f.ordered || !!f.mirror);
    return (
      <div className={bare ? `flex min-h-0 min-w-0 flex-col ${isConops ? "col-span-2" : ""}` : `flex min-h-0 flex-col overflow-hidden rounded-lg ring-1 ring-inset ${acc.ring} ${isVp ? "bg-cyan-500/[0.05]" : "bg-[#0b0f14]"} ${isConops ? "col-span-2" : ""}`}>
        {!bare && <Banner />}
        <div className={bare ? "" : big ? "p-[0.45cqw]" : "p-2"}>
        {/* Inside the 16:9 SlideCanvas (`big`) size in cq units so text scales WITH the slide — px/vw floors
            made portrait phones render huge headers that overflowed the slide while landscape looked fine.
            Outside the canvas there is no container context, so the original px/vw clamp stays. */}
        {(f.kind === "text" || f.kind === "longtext") && <p className={`m-0 text-slate-100 ${big ? `leading-snug ${isVp ? "font-medium" : ""}` : `leading-relaxed ${isVp ? "text-[clamp(15px,1.7vw,22px)] font-medium" : "text-[clamp(14px,1.4vw,18px)]"}`}`} style={big ? { fontSize: isVp ? TS.lead : TS.body } : undefined}>{v as string}</p>}
        {f.kind === "attach" && (isImageSrc(v)
          ? <img src={v} alt={f.name} className="max-h-[40vh] w-auto rounded border border-slate-700 object-contain" />
          : <p className={`m-0 text-slate-300 ${big ? "" : "text-[13px]"}`} style={big ? { fontSize: TS.body } : undefined}>◧ {typeof v === "string" ? v : ""}</p>)}
        {f.kind === "list" && isConops && (() => {
          // Single-slide CONOPS (operator): ONE hero visual + the ordered steps — stacked below in PORTRAIT,
          // side-by-side in LANDSCAPE. Hero = the UPLOADED image if one exists (attach field), else the
          // deterministic generative wireframe. Author 6–10 step labels below to match the image.
          const steps = (v as string[]).filter((x) => x && x.trim());
          const attachF = sp.fields.find((x) => x.kind === "attach");
          const heroImg = attachF ? effective(sp, attachF, presentSrc) : null;
          const hasImg = isImageSrc(heroImg);
          return (
            // `landscape:` is a DEVICE-orientation media query, so on a portrait phone the hero stacked ABOVE
            // the steps, doubled the block's height and clipped out of the panel (operator, IMG_8312). The
            // sheet is ALWAYS a 16:9 landscape page — inside it (`big`) the layout is fixed side-by-side and
            // the hero is bounded in cqh. Same class of defect as the sm: grid that broke portrait in #3.
            <div className={big ? "flex flex-row items-start gap-3" : "flex flex-col gap-3 landscape:flex-row landscape:items-start"}>
              <div className={big ? "w-1/2 shrink-0" : "landscape:w-1/2 landscape:shrink-0"}>
                <div className={`relative overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-cyan-500/[0.06] to-slate-900/60 ${big ? "" : "aspect-[16/9]"}`}
                  style={big ? { height: "24cqh" } : undefined}>
                  {hasImg
                    ? <img src={heroImg as string} alt={`${sp.code} CONOPS`} className="h-full w-full object-contain" />
                    : <><ConopsWireframe seed={`${sp.code}:hero:${p.id}`} /><span className="absolute bottom-1 right-1.5 font-mono uppercase tracking-wider text-cyan-300/50" style={big ? { fontSize: TS.micro } : { fontSize: 7 }}>wireframe · generative</span></>}
                </div>
              </div>
              <ol className={`m-0 min-w-0 flex-1 list-none p-0 ${big ? "space-y-[0.6cqh]" : "space-y-1.5 landscape:w-1/2"}`}>
                {steps.map((x, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 flex shrink-0 items-center justify-center rounded-md bg-cyan-500 font-bold tabular-nums text-[#06202a] ${big ? "h-[2.2cqh] w-[2.2cqh]" : "h-6 w-6 text-[13px]"}`} style={big ? { fontSize: TS.micro } : undefined}>{i + 1}</span>
                    <p className={`m-0 leading-snug text-slate-100 ${big ? "" : "text-[clamp(13px,1.4vw,18px)]"}`} style={big ? { fontSize: TS.body } : undefined}>{x}</p>
                  </li>
                ))}
              </ol>
            </div>
          );
        })()}
        {f.kind === "list" && !isConops && <ul className={`m-0 list-disc pl-5 text-slate-200 ${big ? "" : "text-[clamp(13px,1.4vw,18px)]"}`} style={big ? { fontSize: TS.body } : undefined}>{(v as string[]).filter((x) => x && x.trim()).map((x, i) => <li key={i} className="mb-0.5">{x}</li>)}</ul>}
        {/* X-1 · A CAPTION STRIP, NOT THREE CARDS (operator: "Shrink Boxes and find locations for them
            around waterfall chart"). Value and label sit on ONE line each, so the row costs the height of a
            single line instead of a stacked card with its own padding — and that reclaimed height is exactly
            what the waterfall above now uses. The figures are the chart's own endpoints, so reading them as
            its caption is truer than reading them as separate metrics. */}
        {f.kind === "metrics" && <div className="flex flex-wrap items-baseline justify-between gap-x-[1.2cqw] gap-y-[0.3cqh] rounded-lg border border-slate-800 px-[0.8cqw] py-[0.35cqh]">{(f.items ?? []).map((m) => { const rec = v as Record<string, string>; return rec[m.k] ? <span key={m.k} className="flex items-baseline gap-[0.4cqw]"><span className="font-bold tabular-nums text-slate-100" style={big ? { fontSize: TS.head } : undefined}>{rec[m.k]}</span><span className={`uppercase tracking-wider text-slate-500 ${big ? "" : "text-[9px]"}`} style={big ? { fontSize: TS.micro } : undefined}>{m.label}</span></span> : null; })}</div>}
        {(f.kind === "table" || f.kind === "chart") && Array.isArray(v) && <ChartFrame label={f.name}>{f.id === "stories"
          ? <StorySpecs cols={f.cols ?? []} rows={(v as string[][]).filter((r) => r.some((c) => c && c.trim()))} trace={traceRowsOf(p)} big={big} />
          : <div className="overflow-x-auto"><table className={`w-full ${big ? "" : "text-[clamp(12px,1.2vw,16px)]"}`} style={big ? { fontSize: TS.body } : undefined}><thead>{f.cols && <tr>{f.cols.map((c) => <th key={c} className={`px-2 py-1 text-left font-semibold uppercase tracking-wide text-slate-400 ${big ? "" : "text-[clamp(12px,1.2vw,16px)]"}`}>{c}</th>)}</tr>}</thead><tbody>{(v as string[][]).filter((r) => r.some((c) => c && c.trim())).map((r, ri) => { const ncols = f.cols?.length ?? r.length; return <tr key={ri} className="border-t border-slate-800">{Array.from({ length: ncols }, (_, ci) => <td key={ci} className="px-2 py-1 text-slate-200">{r[ci] || "—"}</td>)}</tr>; })}</tbody></table></div>}</ChartFrame>}
        {/* Single source of truth — icon-link to whichever slide OWNS this field's record (SOURCE_SLIDE). */}
        {hasSourceLink(sp.code, f.id) && <SourceLink source={sp.source} code={sp.code} fieldId={f.id} />}
        </div>
      </div>
    );
  }

  // PRESENT MODE — full-screen stage (operator: "full-screen stage + live financials"). Tap zones + arrows +
  // swipe; big responsive type; financial fields render live from the project record; value prop is featured.
  if (present) {
    const anyContent = spec.fields.some((f) => !fieldEmpty(effective(spec, f, presentSrc)) || (f.kind === "chart" && f.linked));
    // Operator: USE ORIGINAL HEADERS, identical format project→project — the title is ALWAYS the canonical slide
    // name (Executive Summary · Customer Problem · Product Summary · Customer Workflow · Competition + Value · …),
    // large white, centered between gate·stage (left) and slide code (right). No per-project subtitle/variation.
    const deckTitle = slideDef(spec.code)?.name ?? spec.code;
    const ex = execOf(p);
    // B1: fixed 16:9 slide CANVAS (container-type: size → cqw/cqh scale everything with the page, letterboxed on
    // a black backdrop). B2: AMTS SlideChrome — PROJECT NAME header band (+COGS/MSRP/Mgn%) · Business/Project#/Slide
    // · gate·stage · Req flag; footer = page# + reference links + progress. Controls stay OUTSIDE the canvas.
    // G-refine (IMG_8215/16) — play mode: controls in a TOP BAR that never overlaps the slide; the slide area
    // below fills to the screen edges in landscape (PC + phone) and shows a fit-to-width 16:9 band in portrait,
    // which the user can ZOOM into. No rotation — text renders exactly as it does in landscape.
    // B3 · per-slide AMTS panels. ONE dispatch table keyed by slide code — NOT 19 forks. A code with an entry
    // renders the AMTS two-panel layout from docs/SOI2525_AMTS_SPEC.md; a code WITHOUT one falls through to the
    // shipped PresentField grid, so the deck never regresses while the remaining panels are built slide by slide.
    // Panel CONTENTS are still PresentField — the panel only supplies the AMTS frame (AmtsPanel).
    // A panel must NEVER render its title with nothing under it. Two independent causes, both closed here:
    //  (a) DUPLICATE NAME — when a panel holds exactly ONE field, the AMTS banner and the field banner said the
    //      same words twice; on a phone the panel clipped after those two rows and the value never appeared.
    //      One field in → render it `bare` (no second banner, no nested card). Two or more → banners stay,
    //      because that is the only thing telling the fields apart.
    //  (b) NOTHING RESOLVED — an unauthored field returned null and left the body literally empty. It now says
    //      so, in the deck's own voice, instead of leaving a headed box with a void under it.
    const fieldsIn = (sp: SlideSpec, ids: string[]) => ids.map((id) => {
      const f = sp.fields.find((x) => x.id === id);
      if (!f) return null;
      const solo = ids.length === 1;
      const alwaysRenders = f.kind === "attach" || (f.kind === "chart" && f.linked);
      if (!alwaysRenders && fieldEmpty(effective(sp, f, presentSrc)))
        return <p key={id} className="m-0 italic text-slate-500" style={{ fontSize: TS.body }}>{f.name} — not authored yet</p>;
      return <PresentField key={f.id} sp={sp} f={f} big bare={solo} />;
    });
    // The panel table is now a FUNCTION of the slide, not of "the current slide". That is the whole reason the
    // print stack can render all 20 pages through the SAME renderer instead of forking a second one.
    const panelsFor = (sp: SlideSpec): Record<string, () => React.ReactNode> => {
      const fieldsOf = (...ids: string[]) => fieldsIn(sp, ids);
      return {
      // S1 — Executive Summary (AMTS exec one-pager: what / who | why | the ask). The ask spans the foot
      // because it is the one line a gate board has to act on.
      S1: () => (
        <>
          <AmtsPanel title="Product · What It Is And Who It Is For" icon="◧">
            {fieldsOf("oneline", "segment")}
          </AmtsPanel>
          {/* X-7a · THE SENTENCE, THEN THE EVIDENCE UNDER IT (operator: "place value prop from S8 with
              details on S1"). All three resolve from S8's record via the same producers S8 itself uses —
              `valuePropOf`, `valuePropRows`, `valuePropCapture` — so the exec summary carries the WHY
              (which differentiators, worth what, how the value splits) without becoming a second place to
              author it. Editing a driver or the capture % on S8 moves this panel too. */}
          <AmtsPanel title="Key Value Proposition" icon="♡">
            {fieldsOf("valueprop", "vpdiffs", "vpcapture")}
          </AmtsPanel>
          <AmtsPanel wide title="Recommendation · Ask For The Gate" icon="⚑">
            {fieldsOf("ask")}
          </AmtsPanel>
        </>
      ),
      // S2 — Project Overview as the AMTS SIX-PANEL one-pager (spec §S2 Δ): return profile + the upside
      // spending-accelerator lever read across the top, the live MoT gate timeline spans the middle, and
      // roadmap / risks / status close it out. The timeline card that shipped in G-play is FOLDED IN here
      // rather than sitting above the grid — same GateTimeline, same live source link.
      S2: () => (
        <>
          <AmtsPanel title="Return Profile" icon="▤">
            {fieldsOf("profile")}
          </AmtsPanel>
          <AmtsPanel title="Upside Spending Accelerator Lever" icon="⚡">
            {fieldsOf("accel")}
          </AmtsPanel>
          <AmtsPanel wide title={`Program Timeline · MoT Gate Schedule · ✎ ${SOURCE_LABEL.S10}`} icon={<MarkCalendar />}>
            <GateTimeline p={p} />
            {/* Program start lives in the S10 source panel beside the money it schedules. */}
            <SourceLink source="Program start (source record)" target="S10" />
          </AmtsPanel>
          <AmtsPanel title="Roadmap Snapshot" icon="◈">
            {fieldsOf("roadmap")}
          </AmtsPanel>
          <AmtsPanel title="Top Risks + Dependencies" icon="⚠">
            {fieldsOf("toprisks")}
          </AmtsPanel>
          <AmtsPanel wide title="Stage / Status" icon="◉">
            {fieldsOf("status")}
          </AmtsPanel>
        </>
      ),
      // S3 — Financials (AMTS: Return Profile + Revenue/Margin by Year | cash-flow chart + comments). Every
      // number here is LINKED to the one financial record, so the panel only arranges — it never re-derives.
      S3: () => (
        <>
          <AmtsPanel title="Return Profile · Revenue + Margin by Year" icon="▤">
            {fieldsOf("profile", "revtable")}
          </AmtsPanel>
          <AmtsPanel title="Cash Flow · R&D/NRE Out vs Revenue + Margin" icon="◈">
            {fieldsOf("rdchart")}
          </AmtsPanel>
          <AmtsPanel wide title="Financial Comments · Assumptions" icon="✎">
            {fieldsOf("fincomment")}
          </AmtsPanel>
        </>
      ),
      // S8 — Competition + Value (AMTS: Next Best Alternative | Value Prop v NBA + waterfall/WTP). The
      // flagship: left panel is what we must out-perform, right panel is what that is worth, and the value
      // proposition spans the foot of the slide as the single sentence a board remembers.
      S8: () => (
        <>
          <AmtsPanel title="Competition · Next Best Alternative" icon="⚔">
            {fieldsOf("nba", "diffs")}
          </AmtsPanel>
          {/* X-1 · THE WATERFALL FILLS THIS BOX (operator, three times: "Waterfall has to be a majority of
              slide … must fill the box its given, upper right" · "Shrink Boxes and find locations for them
              around waterfall chart"). The chart takes 1fr; the three capture figures take only the height
              they need. They are the chart's own endpoints — Value Creation is the sum of its green bars and
              Value Price Range is its NBA-to-price span — so they read as its caption, not as rivals for
              half the panel. */}
          <AmtsPanel title="Value · Creation + Capture" icon="◈" rows="minmax(0, 1fr) auto">
            {fieldsOf("valuechart", "capture")}
          </AmtsPanel>
          <AmtsPanel wide title="Primary Customer Value Proposition" icon="♡">
            {fieldsOf("vprop", "benefits", "features")}
          </AmtsPanel>
        </>
      ),
      // S10 — Financials by Year. THE single source of truth, and the only slide that accepts financial input.
      // Two panels, matching the operator's own Rack & Stack: R&D Spend above, R&D Revenues below. Both are
      // READ-ONLY here — typing happens in the source editor, which opens on this slide alone. Columns follow
      // the gate ladder (Concept 4 · Plan 6 · Develop 11) so a Concept sheet is wide and legible instead of
      // squeezing eleven columns onto a slide that only needs four.
      S10: () => (
        <>
          <AmtsPanel wide title="R&D Spend" icon={<MarkSpend />} required={sp.stage}>
            <S10SpendTable p={p} baseYear={baseYear} />
          </AmtsPanel>
          <AmtsPanel wide title="R&D Revenues" icon={<MarkRevenue />} required={sp.stage}>
            <S10RevenueTable p={p} baseYear={baseYear} />
          </AmtsPanel>
        </>
      ),
      // S11 — Early Validation / UXD (AMTS: VOC evidence | planned experiments). The Pivot-Pursue-Pass
      // column is the decision the board reads first, so the VOC table leads.
      S11: () => (
        <>
          <AmtsPanel title="Early Validation · UXD Voice Of Customer" icon="◉">
            {fieldsOf("voc")}
          </AmtsPanel>
          <AmtsPanel title="Planned Experiments" icon="⚗">
            {fieldsOf("exp")}
          </AmtsPanel>
          <AmtsPanel wide title="Comments" icon="✎">
            {fieldsOf("comments")}
          </AmtsPanel>
        </>
      ),
      // ── CS + RA · THE MERGED GOVERNANCE CLOSE-OUT (operator's Approval Templates, slides 35-36) ─────
      // CS and RA had NO panel entry at all — they fell through to the generic field list, which is why
      // slide-shots measured them as the two emptiest sheets in the deck (ink-void 668.8px / 631.5px
      // against a next-worst of 260px). This is the first designed layout either has had.
      //
      // The red flags are the reason this is a panel and not a plain linked table: the operator's template
      // says "Highlight Changes Only in Red", and `changed[]` is computed per cell by the SAME producer the
      // Present-mode read-out uses. One source, two presentations — never two computations.
      CSRA: () => {
        const hist = gateReviewHistoryRows(p, finOf(p, baseYear), versions);
        const ap = gateApprovalPanels(p, gov.members, gov.activity, gov.board);
        let rail = "";
        return (
          <>
            <AmtsPanel title="Gate Review History" icon="◫">
              {/* ⚠ NO SCROLL CONTAINER. This was `overflow-auto` and it hid the defect from my own gate:
                  slide-shots reported "overflow 0 · box-void 0px" and I reported that as proof it fit, when
                  a scroll container ABSORBS overflow — it goes green precisely when content does NOT fit.
                  The operator's phone screenshot showed 5 of 17 rows and 3 of 7 columns. Worse, a PDF cannot
                  scroll, so the printed board pack carried a truncated matrix. All 17 rows now LAY OUT on
                  the sheet: the rail is folded into the row label (reclaiming the 6 band rows) and the type
                  drops to micro. Box first, then type — the standing law, applied to a table. */}
              <div className="min-h-0 flex-1">
                <table className="w-full border-collapse" style={{ fontSize: TS.micro }}>
                  <thead><tr>
                    <th className="sticky left-0 z-10 bg-[#0e141b] px-1 py-0.5 text-left text-slate-400">Business case</th>
                    {GATE_HISTORY_COLS.map((c) => (
                      // ◆ marks a gate S16 · Say/Do names as its Reference Stage. Those columns are not
                      // decoration here — they ARE the Target S16 divides its Actual by.
                      <th key={c.gate} className={`px-1 py-0.5 text-right ${isSayDoReferenceGate(c.gate) ? "text-cyan-300" : "text-slate-400"}`}>
                        {isSayDoReferenceGate(c.gate) ? "◆ " : ""}{c.label}
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>{hist.rows.map((r, ri) => {
                    const head = r.rail !== rail ? (rail = r.rail) : null;
                    return (
                      <Fragment key={`${r.rail}-${r.label}-${ri}`}>
                        <tr className={`border-b border-slate-900 ${head ? "border-t border-t-cyan-500/25" : ""}`}>
                          {/* The rail rides on its group's FIRST row instead of costing a whole band row —
                              six rows reclaimed, which is what lets all 17 metrics lay out on one sheet. */}
                          <td className="sticky left-0 z-10 bg-[#0e141b] px-1 py-0.5 text-left leading-tight">
                            {head ? <span className="mr-1 font-semibold text-cyan-300/90">{head}</span> : null}
                            <span className="text-slate-300">{r.label}</span>
                          </td>
                          {r.values.map((v, i) => (
                            // RED = changed since the last recorded gate. Grey em-dash = nothing recorded —
                            // deliberately NOT a zero, because a fabricated figure on a governance sheet is
                            // worse than a visible hole.
                            <td key={i} className={`px-1 py-0.5 text-right tabular-nums ${v == null ? "text-slate-700" : r.changed[i] ? "font-semibold text-rose-400" : "text-slate-200"}`}>
                              {v ?? "—"}
                            </td>
                          ))}
                        </tr>
                      </Fragment>
                    );
                  })}</tbody>
                </table>
              </div>
              {/* COVERAGE, SAID OUT LOUD. A sparse matrix must never read as a complete one. */}
              <div className="mt-1 flex flex-wrap gap-x-3 text-[9px] text-slate-500">
                <span>{hist.recordedGates} of {GATE_HISTORY_COLS.length} gates carry a recorded review</span>
                <span className="text-rose-400/80">red = changed vs the prior recorded gate</span>
                {hist.gaps.length ? <span>no source yet: {hist.gaps.join(" · ")}</span> : null}
                <span className="text-cyan-300/80">
                  ◆ = S16 · Say/Do reference stage — {SAYDO_REFERENCE_GATES.map((r) => `${GATE_STAGE[r.gate]}: ${r.measures}`).join(" · ")}
                </span>
              </div>
            </AmtsPanel>
            <AmtsPanel title="PRB Reviews + Approvals" icon="◨">
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
                {[ap.prior, ap.current].map((pan, pi) => (
                  <div key={pi} className="min-w-0">
                    <div className="mb-0.5 text-[10px] font-semibold text-slate-200">
                      {pi === 0 ? "Prior Gate" : "Current Gate"}
                      <span className="ml-1 font-normal text-slate-400">{pan.gate ? `${pan.gate} · ${pan.stage}` : "— none"}</span>
                    </div>
                    {pan.gate ? (
                      <table className="w-full border-collapse" style={{ fontSize: TS.micro }}>
                        <tbody>{pan.rows.map((r) => (
                          <tr key={r.fn} className="border-b border-slate-900">
                            <td className={`w-3 py-0.5 ${r.required ? "text-cyan-400" : "text-slate-600"}`}>{r.required ? "●" : "○"}</td>
                            <td className="py-0.5 pr-1 text-slate-300">{r.fn}</td>
                            <td className="py-0.5 pr-1 text-slate-200">{r.name}</td>
                            <td className="py-0.5 text-right tabular-nums text-slate-400">{r.date}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    ) : <div className="text-[10px] text-slate-600">This project has not cleared a gate yet.</div>}
                    {/* MEASURED, not implied: nine rows always render, so "looks full" proves nothing. */}
                    <div className="mt-0.5 text-[9px] text-slate-500">{pan.satisfied} of 3 required functions signed</div>
                    {pan.concerns.length ? (
                      <div className="mt-1 text-[9px] text-amber-300/80">PRB + Executive concerns: {pan.concerns.join(" · ")}</div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-1 text-[9px] text-slate-500">Review body: {boardFull(gov.board)} ({gov.board})</div>
            </AmtsPanel>
          </>
        );
      },
      };
    };
    // THE SHEET IS A FIXED 1600x900 PAGE, scaled to fit (operator #3: "portrait must be proportionally
    // identical to landscape", and #4: it must print as one landscape page). Sizing the canvas to the device
    // and expressing type in cq got the TYPE right but left every px padding, gap, border and dot fixed —
    // so a 390-wide phone rendered 12px gutters on a 219px-tall sheet while a 1357-wide desktop rendered the
    // same 12px on a 763px sheet. Laying out at ONE size and scaling the whole page makes portrait a literal
    // photographic reduction of landscape: nothing can drift, and 12px in the source is 12px on the printout.
    const SHEET_W = 1600, SHEET_H = 900;
    // CHROME_H WAS A GUESS AND THE GUESS WAS WRONG ON A PHONE. The control bar is five groups with no wrap;
    // at 390px it takes two or three rows, not the 48px assumed here, so `fit` was computed against a height
    // the stage did not have and the sheet ended up parked at the bottom of a tall dead region (operator's
    // iPhone screenshots, 2026-07-30). Measure the bar instead of assuming it.
    const fit = Math.min((vp.w || SHEET_W) / SHEET_W, Math.max(1, (vp.h || SHEET_H) - chromeH) / SHEET_H);
    // ⚠ Z5 · THE WHOLE SHEET ZOOMS, EDGES AND ALL — AND THIS DELIBERATELY REVERSES Z2.
    // Z2/Z4 held the chrome at 1x and magnified only [data-slide-zoom], because the operator had said "top
    // icons and banner size should not change just the content of slide". Measured at 200% that gave text
    // 2.00x, panel box 2.00x, slide title 1.00x — content growing inside a frame that stayed put. The
    // operator then asked for the opposite, with a concrete model: "ensure Zoom and edge of slide are synced
    // as one. Should zoom as I would a pdf of computer screen." A PDF viewer scales the PAGE — border,
    // banner, footer, body, one transform — and you pan it. So `zoom` multiplies into the sheet transform
    // again and the body-side zoom stack is gone. Confirmed with the operator before the change; the Z-block
    // lock was REWRITTEN to the new law rather than deleted, so neither behaviour can return by accident.
    // The top control bar is unaffected: it is a sibling OUTSIDE this transform and never scaled.
    const sheetStyle: React.CSSProperties = {
      width: SHEET_W, height: SHEET_H, flex: "none", containerType: "size",
      transform: `scale(${fit * zoom})`, transformOrigin: "top left",
    };
    // The print stack lays the same sheet out at 1:1 — the @page IS 1600x900, so no scaling at all.
    // Print path ONLY — the screen path (sheetStyle + the `fit` calc above) keeps SHEET_W/SHEET_H and is not
    // touched. Here the sheet takes the PRINTABLE box's width and derives its height from the deck's 16:9;
    // container-type:size then makes every cq unit inside rescale to whatever paper the operator chose.
    const printSheetStyle: React.CSSProperties = { width: "100%", aspectRatio: "16 / 9", flex: "none", containerType: "size" };
    const exportDate = new Date().toISOString().slice(0, 10);
    const scenarioLabel = `${scenario.charAt(0).toUpperCase()}${scenario.slice(1)} R&D`;
    // The cover's "decision requested" is the S1 ask, resolved through the deck engine like any other field —
    // never a second, hand-written sentence that could drift from the slide the board actually reads.
    const s1 = slideSpec("S1"); const s1ask = s1?.fields.find((f) => f.id === "ask");
    const askVal = s1 && s1ask ? effective(s1, s1ask, presentSrc) : null;
    const decisionAsk = typeof askVal === "string" && askVal.trim() ? askVal : `Approve ${p.gate} → ${GATES[Math.min(GATES.indexOf(p.gate) + 1, GATES.length - 1)]} progression.`;
    // ── THE SHEET · ONE renderer for the screen stage AND the print stack ────────────────────────
    // Anything that renders a slide renders THIS. A second, print-only slide renderer is exactly how a PDF
    // ends up disagreeing with what the board saw on the projector.
    const Sheet = ({ sp, i, style }: { sp: SlideSpec; i: number; style?: React.CSSProperties }) => {
      // `style` is passed ONLY by the print stack and the cover, and it REPLACES `sheetStyle` — which is
      // where the zoom transform now lives (Z5). So the exported PDF is at 1x no matter what the operator
      // has zoomed the screen to, structurally rather than by a flag. Belt and braces: the print CSS forces
      // `transform: none` on `.slide-print-page [data-slide-canvas]` AND on [data-slide-zoom].
      const panel = panelsFor(sp)[sp.code];
      const anyContent = sp.fields.some((f) => !fieldEmpty(effective(sp, f, presentSrc)) || (f.kind === "chart" && f.linked));
      const deckTitle = slideDef(sp.code)?.name ?? sp.code;
      // Standing law: never cut off, never ellipsised. Shared size for the common case; a string that would
      // overflow shrinks ITSELF, and below the floor wraps into the reserved band. Box first, then type.
      const nameFit = fitHeader(p.name, parseFloat(TS.proj), HEADER_NAME_BUDGET, HEADER_NAME_FLOOR);
      const titleFit = fitHeader(deckTitle, parseFloat(TS.title), HEADER_TITLE_BUDGET, HEADER_TITLE_FLOOR);
      return (
        <div data-slide-canvas className="absolute left-0 top-0 overflow-hidden bg-[#0b0f14] shadow-2xl ring-1 ring-slate-800" style={style ?? sheetStyle}>
          <div className="flex h-full flex-col" style={{ padding: "3.2cqh 3.2cqw" }}>
            {/* B2 · header band — PROJECT NAME + COGS/MSRP/Mgn% (left) · title (center) · gate·stage + Req (right) */}
            {/* B2 · header band — FIXED HEIGHT so the body starts at the same Y on every one of the 20 slides.
                Uniform geometry matters as much as uniform size (#21). */}
            <div data-slide-head className="flex h-[9.4cqh] shrink-0 items-start justify-between gap-[2cqw] border-b border-slate-700 pb-[1.4cqh]">
              <div className="min-w-0">
                <div data-proj-name className={`font-semibold tracking-tight text-cyan-200 ${nameFit.wrap ? "" : "whitespace-nowrap"}`}
                  style={{ fontSize: `${nameFit.cqw}cqw`, lineHeight: 1.15 }}>{p.name}</div>
                <div className="mt-[0.6cqh] flex flex-wrap gap-x-[1.4cqw] font-mono text-slate-400" style={{ fontSize: TS.meta }}>
                  <span>COGS <b className="text-slate-200">${ex.cogsK}k</b></span>
                  <span>MSRP <b className="text-slate-200">${ex.msrpK}k</b></span>
                  <span>Mgn <b className="text-slate-200">{ex.marginPct}%</b></span>
                </div>
              </div>
              <h2 data-slide-title className={`shrink-0 text-center font-semibold leading-[1.05] tracking-tight text-slate-100 ${titleFit.wrap ? "" : "whitespace-nowrap"}`}
                style={{ fontSize: `${titleFit.cqw}cqw` }}>{deckTitle}</h2>
              <div className="flex shrink-0 flex-col items-end gap-[0.6cqh]">
                <span className="rounded border border-amber-500/40 bg-amber-500/10 px-[1cqw] py-[0.4cqh] font-semibold tracking-wide text-amber-300 whitespace-nowrap" style={{ fontSize: TS.micro }}>Req: {sp.stage}+</span>
                <span className="font-mono tracking-[0.14em] text-cyan-400" style={{ fontSize: TS.meta }}>{sp.gate} · {sp.stage} · {tabLabelOf(sp.code)}</span>
              </div>
            </div>
            {/* subheader */}
            <div className="mt-[0.8cqh] flex flex-wrap items-center gap-x-[1.6cqw] text-slate-500" style={{ fontSize: TS.meta }}>
              <span>Business: <span className="text-slate-300">{p.division}</span></span>
              <span>Project #: <span className="text-slate-300">{p.id}</span></span>
              <span>Source: <span className="text-slate-300">{sp.source}</span></span>
            </div>
            {/* B3 · body — per-slide AMTS panels via ONE dispatch table, with the field grid as the fallback.
                ⚠ Z5 · NO ZOOM LIVES HERE ANY MORE. Z2/Z4 built a viewport/sizer/scaled stack in this spot so
                the body could magnify while the chrome held still. The operator has since asked for the
                PDF-viewer model — the whole page scales and you pan it — so the scale moved back onto
                [data-slide-canvas] (see `sheetStyle`) and all three wrappers collapsed to this one plain box.
                Because the sheet's own layout is now IDENTICAL at every zoom level (only its transform
                changes), `data-slide-body` measures the same geometry it always did, at 1x and at 3x alike.
                That is what keeps scripts/slide-shots.mjs honest: it reads overflow off this element, and a
                permanently-visible overflow would have retired the gate that caught S10 spilling by 21
                elements. `overflow-hidden` is therefore UNCONDITIONAL again — no zoom ternary to go wrong.
                [data-slide-zoom] is kept as the print CSS's reset anchor even though it no longer transforms:
                it costs nothing and it means a re-introduced body zoom still cannot reach the PDF. */}
            <div data-slide-zoom className="mt-[1.2cqh] min-h-0 flex-1 overflow-hidden">
              <div data-slide-body className="grid h-full min-h-0 grid-cols-2 content-stretch gap-[1.4cqh] overflow-hidden" style={{ fontSize: TS.body, ...(BODY_ROWS[sp.code] ? { gridTemplateRows: BODY_ROWS[sp.code] } : {}) }}>
                {panel ? panel() : sp.fields.map((f) => <PresentField key={f.id} sp={sp} f={f} big />)}
                {!anyContent && <p className="italic text-slate-500" style={{ fontSize: TS.body }}>Nothing authored on this slide yet — tap Edit to add content.</p>}
              </div>
            </div>
            {/* B2 · footer — page # (left) · progress · reference links (right) · PRINT provenance (print only) */}
            <div className="mt-[1cqh] flex shrink-0 items-center gap-[1.2cqw] border-t border-slate-700 pt-[1cqh] font-mono text-slate-500" style={{ fontSize: TS.meta }}>
              <span className="tabular-nums">{i + 1}/{SLIDE_SCHEMA.length}</span>
              <div className="flex flex-1 gap-[0.4cqw]">
                {SLIDE_SCHEMA.map((x, xi) => <span key={x.code} data-ink className={`h-[0.5cqh] flex-1 rounded ${xi === i ? "bg-cyan-500" : fillOf(x) > 0 ? "bg-slate-500" : "bg-slate-800"}`} />)}
              </div>
              {/* Provenance — a board artifact with no provenance is orphaned within a week (operator #17). */}
              <span className="slide-printonly hidden truncate">{p.id} · {p.gate} · {scenarioLabel} · p{i + 2}/{SLIDE_SCHEMA.length + 1} · {exportDate}</span>
              <span className="truncate">Reference Links: <span className="text-slate-400">{sp.source}</span></span>
            </div>
          </div>
        </div>
      );
    };

    // ── COVER PAGE (print only, operator #17) — every figure resolves from the deck engine ───────
    const Cover = () => (
      <div data-slide-canvas className="absolute left-0 top-0 overflow-hidden bg-[#0b0f14]" style={printSheetStyle}>
        <div className="flex h-full flex-col justify-between" style={{ padding: "6cqh 5cqw" }}>
          <div>
            <div className="font-mono uppercase tracking-[0.3em] text-cyan-400" style={{ fontSize: TS.micro }}>Gate Review Deck · S1–S{SLIDE_SCHEMA.length}</div>
            <h1 className="mt-[1.5cqh] font-semibold tracking-tight text-slate-100" style={{ fontSize: "2.4cqw", lineHeight: 1.1 }}>{p.name}</h1>
            <div className="mt-[0.8cqh] font-mono text-slate-400" style={{ fontSize: TS.body }}>{p.id} · {p.division}</div>
          </div>
          <div className="grid grid-cols-4 gap-[1.5cqw]" style={{ fontSize: TS.body }}>
            {([["Gate", `${p.gate} · ${GATE_STAGE[p.gate]}`], ["R&D scenario", scenarioLabel], ["NRE", `$${(p.nreK / 1000).toFixed(1)}M`], ["Exported", exportDate]] as const).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-slate-700 px-[1cqw] py-[0.8cqh]">
                <div className="font-bold tabular-nums text-slate-100" style={{ fontSize: TS.num }}>{v}</div>
                <div className="uppercase tracking-wider text-slate-500" style={{ fontSize: TS.micro }}>{k}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/[0.06] px-[1.4cqw] py-[1cqh]">
            <div className="uppercase tracking-[0.14em] text-cyan-300" style={{ fontSize: TS.micro }}>Decision requested</div>
            <p className="m-0 mt-[0.5cqh] text-slate-100" style={{ fontSize: TS.lead }}>{decisionAsk}</p>
          </div>
          <div className="font-mono text-slate-500" style={{ fontSize: TS.micro }}>{p.id} · {p.gate} · {scenarioLabel} · p1/{SLIDE_SCHEMA.length + 1} · {exportDate}</div>
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-black text-slate-100" role="dialog" aria-modal="true"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{ touchAction: "none" }}>
        <style>{SLIDE_PRINT_CSS}</style>
        {/* TOP CONTROL BAR — always above the slide (never covers it) */}
        {/* Z6b(2) · THE PIN. `vvPin` is null unless a browser pinch actually got past the block, so at rest
            this is `undefined` and the bar's geometry is byte-identical to before. When it is set, the bar
            counter-scales by 1/scale and re-anchors to the visible rectangle — holding its on-screen size
            AND staying reachable rather than panning off the corner. */}
        <div ref={chromeRef} className="slide-noprint flex shrink-0 flex-wrap items-center justify-end gap-2 p-2"
          style={vvPin ? { transform: `translate(${vvPin.x}px, ${vvPin.y}px) scale(${1 / vvPin.s})`, transformOrigin: "top left", width: vvPin.w * vvPin.s } : undefined}>
          {/* zoom (esp. portrait) */}
          <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-[#0b0f14]/80 text-[11px]" role="group" aria-label="Zoom slide">
            <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - 0.25).toFixed(2)))} className="px-2.5 py-1.5 text-slate-300 hover:bg-slate-800" aria-label="Zoom out">－</button>
            <span className="px-1 py-1.5 tabular-nums text-slate-400">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + 0.25).toFixed(2)))} className="px-2.5 py-1.5 text-slate-300 hover:bg-slate-800" aria-label="Zoom in">＋</button>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-[#0b0f14]/80 text-[11px]" role="group" aria-label={t("innovation.present.src")}>
            {([["set", t("innovation.present.src.set")], ["hi", `웃 ${t("innovation.slides.hi")}`], ["ai", `◬ ${t("innovation.slides.ai")}`]] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setPresentSrc(k)} aria-pressed={presentSrc === k}
                className={`px-2.5 py-1.5 ${presentSrc === k ? (k === "hi" ? "bg-violet-500/25 text-violet-100" : k === "ai" ? "bg-cyan-500/25 text-cyan-100" : "bg-slate-600/40 text-slate-100") : "text-slate-400 hover:bg-slate-800"}`}>{lbl}</button>
            ))}
          </div>
          {/* ⎙ PDF — the whole deck, cover + all {n} slides, through the SAME Sheet renderer. No dependency:
              the browser's own print engine paginates a 1600x900 landscape @page. */}
          {/* Honest affordance: this OPENS the print dialog with landscape + 0.5in margins pre-set. The user
              still picks "Save as PDF" and the destination folder — there is no direct download, and the
              label must not imply one. Zero dependencies, by design (#4/#17). */}
          {/* P1 · TWO VERSIONS OF THE SAME DECK. Both print the SAME `Sheet` through the SAME stack — only a
              class on the portal differs — so the two can never disagree about content, only about ink.
              `printMode` is set in the same click that opens the dialog, one rAF before window.print(), so
              the class is on the DOM before the print engine reads it. */}
          {/* P2 · ONE EXPORT CONTROL, TWO OPTIONS (operator: "i dont need printer friendly but export PDF
              WITH TWO OPTIONS"). P1 shipped two top-level buttons; that spent two groups of a control bar
              that already wrapped to four rows on a 390px phone, and it put a mode name in the bar where an
              action belongs. One `⎙ Export PDF` opens the choice; the two modes underneath are unchanged and
              still verified — same Sheet, same stack, same [data-ink] colour preservation. */}
          <div className="relative">
            <button onClick={() => setExportOpen((v) => !v)} aria-haspopup="menu" aria-expanded={exportOpen}
              aria-label="Export the deck as a PDF" title="Export all pages as a PDF — choose Light or Original."
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20">⎙ Export PDF</button>
            {exportOpen && (
              <div role="menu" aria-label="PDF export options"
                className="absolute right-0 top-full z-[3] mt-1 w-60 overflow-hidden rounded-lg border border-slate-700 bg-[#0b0f14] shadow-2xl">
                {([["friendly", "Light", "White page, dark text. Charts, legends and the value prop keep their own colours."],
                   ["original", "Original", "Exactly as it looks on screen — dark sheet. Turn ON “Background graphics” in the print dialog."]] as const).map(([mode, label, tip]) => (
                  <button key={mode} role="menuitem"
                    onClick={() => { setExportOpen(false); setPrintMode(mode); setPrinting(true); requestAnimationFrame(() => requestAnimationFrame(() => window.print())); }}
                    aria-label={mode === "friendly" ? "Export a light PDF" : "Export an original dark PDF"}
                    className="block w-full border-b border-slate-800 px-3 py-2 text-left last:border-b-0 hover:bg-slate-800/70">
                    <span className="text-xs font-semibold text-slate-100">⎙ {label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-slate-400">{tip}</span>
                  </button>
                ))}
                <div className="border-t border-slate-800 px-3 py-1.5 text-[10px] text-slate-500">All {SLIDE_SCHEMA.length + 1} pages · landscape · 0.5in — choose “Save as PDF”, keep scaling 100%.</div>
              </div>
            )}
          </div>
          <button onClick={() => setPresent(false)} className="rounded-lg border border-slate-700 bg-[#0b0f14]/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">✎ Edit</button>
          <button onClick={() => { setPresent(false); onClose(); }} aria-label="Exit" className="rounded-lg border border-slate-700 bg-[#0b0f14]/80 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800">✕ Exit</button>
        </div>
        {/* SLIDE AREA — fills the remaining space below the control bar. The sheet now ALWAYS fits (zoom moved
            inside it), so this box never scrolls and the page can never be parked below a screen of dead
            space, which is what the operator's phone screenshots showed. TOP-ALIGNED, not centred: a 16:9
            sheet inside a 9:19.5 phone can only ever be width-fit, so ~500px of the portrait screen is
            unavoidably empty — centring split that emptiness above AND below the sheet and made the deck look
            like it had fallen down the page. Anchoring it under the controls keeps the one contiguous gap at
            the bottom, where it reads as the end of a document rather than a layout fault. */}
        {/* ⚠ Z5 · TWO BOXES, NOT ONE. The prev/next hit zones must anchor to the STAGE FRAME, while the sheet
            scrolls INSIDE it — an absolutely-positioned child of a scroll container scrolls away with the
            content, so a single box would have panned the page-turn zones off screen the moment you zoomed.
            Frame clips and holds the buttons; the inner div is the scroller. */}
        <div className="slide-noprint relative flex flex-1 overflow-hidden">
          <button aria-label="Previous slide" onClick={() => go(-1)} className="absolute inset-y-0 left-0 z-[2] w-[10%] cursor-w-resize bg-transparent" />
          <button aria-label="Next slide" onClick={() => go(1)} className="absolute inset-y-0 right-0 z-[2] w-[10%] cursor-e-resize bg-transparent" />
          {/* THE PAN VIEWPORT. `mx-auto` on the footprint below — NOT `justify-center` here — is deliberate:
              a centred flex item that is wider than its scroll container overflows on BOTH sides and its left
              edge becomes unreachable. An auto margin on an over-wide block resolves to 0, so the sheet
              centres while it fits and pins to the left edge (fully scrollable) once it does not. */}
          <div ref={stageRef} className="flex-1 overflow-auto">
          {/* B1 · SlideCanvas — a FIXED 1600x900 page. The shrink-wrap reserves the SCALED footprint (fit ×
              zoom, Z5) so the sheet has a real layout box to pan inside rather than overflowing it. */}
          <div className="relative mx-auto" style={{ width: SHEET_W * fit * zoom, height: SHEET_H * fit * zoom }}>
            {/* CALLED, not <Sheet/>. `Sheet` is declared inside this component, so its function identity is
                new on every render — and `<Sheet/>` therefore makes React see a NEW COMPONENT TYPE each time
                and tear the whole sheet down and rebuild it on every state update (measured: full remount per
                keystroke, per zoom step). Invoking it returns the element tree inline, so React reconciles in
                place. Sheet holds no hooks, so this is safe; if a hook is ever added to it, it must be lifted
                to module scope FIRST and rendered as <Sheet/> again. The print stack below still uses the JSX
                form — remounting a hidden stack costs nothing and keeps the .map() keyed. */}
            <Sheet sp={spec} i={idx} />
          </div>
          </div>
        </div>
        {/* PRINT STACK — cover + every slide at 1:1, hidden on screen, one @page each. Same Sheet renderer. */}
        {printing && typeof document !== "undefined" && ReactDOM.createPortal(
          <div className={`slide-print-stack hidden ${printMode === "friendly" ? "pdf-friendly" : "pdf-original"}`} aria-hidden>
          {/* X-8a · `data-slide-code` IS THE GATE'S HOOK, AND IT EXISTS BECAUSE THE GATE HAD NONE.
              pdf-gate asserted page count, width, sheet count and fill — every one a GEOMETRY measure — so a
              correctly-sized, perfectly-filled deck of BLANK sheets passed it. Probing the stack for S8/S10
              had to scan `textContent` for prose, which is the proxy-assertion habit that cost fourteen lock
              rewrites this session. `sp.code` was already in scope on the very line that needed it.
              Attribute only: no class, no style, no layout — every existing pdf-gate measurement is
              byte-identical. */}
          <div data-slide-code="COVER" className="slide-print-page relative" style={{ width: "100%", aspectRatio: "16 / 9" }}><Cover /></div>
          {SLIDE_SCHEMA.map((sp, i) => (
            <div key={sp.code} data-slide-code={sp.code} className="slide-print-page relative" style={{ width: "100%", aspectRatio: "16 / 9" }}>
              <Sheet sp={sp} i={i} style={printSheetStyle} />
            </div>
          ))}
          </div>, document.body)}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("innovation.slides.title")}>
      <div ref={dialogRef} tabIndex={-1} className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-[#0e141b] p-4 sm:p-5 outline-none" onClick={(e) => e.stopPropagation()}>
        {/* G-frozen (IMG_8214/13) — header + 18+2 slide strip FROZEN at the top (sticky) so you can jump slide-
            to-slide and hit Present without scrolling back up. Negative margins let it span the card edge-to-edge. */}
        <div className="sticky top-0 z-10 -mx-4 -mt-4 rounded-t-xl bg-[#0e141b]/95 px-4 pt-4 pb-2 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
        {/* Header — project + deck progress + present + close */}
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold">{t("innovation.slides.title")} · <span className="text-slate-300">{p.name}</span></h2>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-slate-500 tabular-nums">{deckPct}% authored</span>
            <button onClick={() => setPresent((v) => !v)} className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20">{present ? "✎ Edit" : "▶ Present"}</button>
            <button onClick={onClose} aria-label="Close" className="rounded border border-slate-700 px-2 py-0.5 text-slate-400 hover:bg-slate-800">✕</button>
          </div>
        </div>

        {/* Slide strip — jump to any S# (fill bar = required-field completion) */}
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {SLIDE_SCHEMA.map((s, i) => {
            const pctF = Math.round(fillOf(s) * 100);
            // S1 = slight-blue anchor highlight; S2/S3 keep the same purple shade (violet) — operator spec.
            const cls = i === idx ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
              : s.code === "S1" ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
              : s.code === "S2" || s.code === "S3" ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
              // No completeness signal → the neutral slate every unfilled tab already uses. Not a new colour.
              : !hasFillSignal(s) ? "border-slate-700 text-slate-500 hover:bg-slate-800"
              : pctF >= 100 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : pctF > 0 ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
              : "border-slate-700 text-slate-500 hover:bg-slate-800";
            return (
              <button key={s.code} onClick={() => setIdx(i)} title={hasFillSignal(s) ? `${s.code} · ${s.gate} ${s.stage} · ${pctF}% required filled` : `${s.code} · ${s.gate} ${s.stage} · derived read-out — nothing to author`} aria-label={`Go to slide ${s.code}`}
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono ${cls}`}>{tabLabelOf(s.code)}</button>
            );
          })}
        </div>
        </div>{/* end frozen top bar */}

        {/* EDIT MODE — field-level authoring (Present renders as a full-screen stage via early return above) */}
        {(
          <div className="mt-3 rounded-xl border border-slate-800 bg-[#0b0f14] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-cyan-400">{spec.code} · {spec.gate} {spec.stage}</div>
                <h3 className="text-base font-semibold leading-tight text-slate-100">{slideDef(spec.code)?.name ?? spec.code}</h3>
                <div className="text-[11px] text-slate-500">Source: {spec.source}{spec.supplemental ? ` · supplemental: ${spec.supplemental.join(", ")}` : ""}</div>
              </div>
              <button onClick={cycleStatus} title="Cycle gate feedback: not-started → drafted → submitted → approved"
                className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-mono ${SLIDE_PILL[st]}`}>{SLIDE_TXT[st]}</button>
            </div>

            {/* Edit source record — SINGLE SOURCE OF TRUTH. The slide that renders this panel is the slide
                that OWNS the record, and that answer comes from `SOURCE_SLIDE` (innovation-data.ts) — not from
                a code literal here. This panel is the money editor: NRE, 10-yr revenue, do-nothing, upside
                accelerator, confidence, tech/comm risk, program start and the revenue plan. It used to open
                wherever a slide had ANY `linked` field or a FIN_FIELDS entry — NINE slides (S2 S3 S8 S9 S10
                S14 S16 CS RA). Nine doors into one record is how the same figure ends up typed differently in
                three places, and it is the duplication the operator photographed on S3/S8/S10.
                Every other slide still RENDERS its derived financials (that is what `linked` does — see
                FieldEditor, which short-circuits linked fields to a read-only LinkedField); it just no longer
                ACCEPTS input. `linked` therefore stays on every field it is on today: removing it would turn
                those charts and metric blocks into free-text editable tables, the exact opposite of
                single-source. Non-owning slides deep-link here instead of stranding the user. */}
            {/* ── S8 · THE VALUE PROPOSITION, and everything it is argued from ──────────────────────
                One sentence used to be editable in four places: S1.valueprop, S6.desc, S8.vprop and the
                Value Equation tool in Project details, which wrote valueProp/valueDrivers straight to the
                record from outside the deck entirely. Four doors into one sentence is how a board ends up
                reading three different value propositions for the same project.
                S8 owns all THREE roots — the sentence, the Next Best Alternative it beats, and the drivers
                the equation is built from — because owning the sentence without the drivers would leave the
                waterfall, the capture metrics and the WTP strip editable somewhere else. */}
            {onEditSource && spec.code === "S8" && panelExists("S8") && (
              <div className="mt-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.03]">
                <button onClick={() => setSrcOpen((v) => !v)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/5">
                  <span>{srcOpen ? "▾" : "▸"}</span>◈ Edit source record <span className="font-normal text-slate-500">— S8 owns the value proposition; S1 and S6 render it</span>
                </button>
                {srcOpen && (
                  <div className="space-y-2 px-3 pb-3">
                    {/* ⚠ THE `<label>` WRAPPER IS GONE, AND THAT IS THE FIX, NOT A TIDY-UP (operator: "1 letter
                        or number defaults and takes cursor to front or off the field I'm updating"). MEASURED:
                        a Playwright click on a field in this panel was INTERCEPTED by the descriptive hint
                        span — because the span sat inside a <label> that WRAPPED the control. Clicking any
                        part of a wrapping label re-focuses its control and drops the caret at position 0,
                        which is exactly "takes cursor to front". Typing itself was never broken: focusing
                        directly and typing one character at a time with 700ms pauses kept focus and advanced
                        the caret 1→2→3 with no remount. So the caret bug was a CLICK-TARGET bug all along.
                        `htmlFor`/`id` keeps the label association (and the a11y name) without the wrapper. */}
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-400">
                      <label htmlFor="s8-vprop">Primary customer value proposition <span className="text-slate-600">— the one sentence S1, S6 and the dog-tag all render</span></label>
                      <textarea id="s8-vprop" defaultValue={valuePropOf(p)} rows={3} key={`vprop:${valuePropOf(p)}`}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== valuePropOf(p)) onEditSource({ valueProp: v, valuePropSource: "HI" }, ["value proposition edited on S8"]); }}
                        className="rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] leading-snug text-slate-100 outline-none focus:border-cyan-500" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-400">
                      <label htmlFor="s8-nba">Next Best Alternative <span className="text-slate-600">— the As-Is option this must out-perform</span></label>
                      <TextCell value={nbaOf(p)} title="Next Best Alternative"
                        onCommit={(raw) => { const v = raw.trim(); if (v && v !== nbaOf(p)) onEditSource({ nextBestAlternative: v }, [`NBA → ${v}`]); }}
                        className="rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] text-slate-100 outline-none focus:border-cyan-500" />
                    </div>
                    <ValueEquationPanel project={p}
                      drivers={s8Drivers} onChange={setS8Drivers} nbaLabel={nbaOf(p)} addressableRevM={incrementalRevM(p)}
                      onGenerate={() => onEditSource({ valueDrivers: s8Drivers, valueProp: valuePropFromEquation({ ...p, valueDrivers: s8Drivers }), valuePropSource: "HI" }, ["value prop generated from the Value Equation vs NBA"])}
                      // W-7 · ONLY the S8 source panel passes this, so the strip is editable exactly where
                      // the record is authored and read-only on the slide and in the deep dive. The audit
                      // line names the positions, so the ledger records WHAT moved, not just that it did.
                      onCompetitors={(c) => onEditSource({ competitors: c },
                        [`competitor positions → ${c.map((m) => `${m.label} ${Math.round(m.x * 100)}%`).join(" · ")}`])}
                    />
                    {/* X-5a · VALUE CAPTURE % IS AN INPUT (operator: "I don't see option to change 33% to
                        something else. Even though value capture is defaulted to 33% should be able to
                        change as a whole"). It was a derived read-out of a module constant with no way in.
                        It sits HERE, in the one place that authors the value prop, so there is still ONE
                        door. Typing it moves the chart's two capture bars, the VALUE CAPTURE % tile and the
                        VALUE PRICE RANGE together, because all three now read `captureOf(p)`.
                        Blank CLEARS back to the 33% default rather than committing a zero. */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0b0f14] px-2 py-1.5">
                      <label htmlFor="s8-capture" className="text-[10px] text-slate-400">Value capture %
                        <span className="ml-1 text-slate-600">— our share of the value created; the rest is the customer&apos;s</span></label>
                      <span className="flex items-center gap-1">
                        <FinCell value={typeof p.capturePct === "number" ? p.capturePct : null} keySeed="s8-capture"
                          title="Value capture percent" placeholder={String(captureOf(p))}
                          onCommit={(v) => onEditSource({ capturePct: Math.max(0, Math.min(100, v)) }, [`value capture → ${Math.max(0, Math.min(100, v))}%`])}
                          onClear={() => onEditSource({ capturePct: null }, ["value capture → default"])}
                          className="w-14 rounded border border-slate-700 bg-[#0e141b] px-1 py-1 text-right text-[11px] tabular-nums text-slate-100 outline-none focus:border-cyan-500" />
                        <span className="text-[11px] text-slate-400">%</span>
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => onEditSource({ valueDrivers: s8Drivers }, [`value drivers: ${s8Drivers.length} vs NBA`])}
                        className="inline-flex items-center gap-1 rounded-md bg-cyan-500 px-2.5 py-1 text-[11px] font-semibold text-[#06202a] hover:bg-cyan-400"><Save className="h-3 w-3" aria-hidden /> Save drivers</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {onEditSource && spec.code === "S10" && panelExists("S10") && (() => {
              // ONCE THE GRID EXISTS, THE GRID IS THE SOURCE. `nreK` and `fullRev10yM` are Σ of the plan the
              // operator typed above, so leaving them as free-text inputs would put two editable surfaces on
              // one number — the duplication this whole thread exists to end. They become read-only read-outs
              // with a note saying where they come from. `doNothing10yM` and `upsideAccelK` are NOT grid
              // fields, so they stay editable.
              const gridOwns = !!p.finPlan;
              const DERIVED_BY_GRID: string[] = ["nreK", "fullRev10yM"];
              const numEdit = (label: string, key: "nreK" | "fullRev10yM" | "doNothing10yM" | "upsideAccelK", suffix: string) => {
                const cur = (p[key] ?? (key === "upsideAccelK" ? upsideAccelOf(p).accelK : 0)) as number;
                const derived = gridOwns && DERIVED_BY_GRID.includes(key);
                return (
                <label className="flex flex-col gap-0.5 text-[10px] text-slate-400">{label}{derived && <span className="text-emerald-400/80"> · Σ from the grid</span>}
                  {derived ? (
                    <div className="flex items-center gap-1" title="Derived from the S10 grid above — edit the years, not this total.">
                      <output className="w-full rounded border border-emerald-500/25 bg-[#0e141b]/60 px-1.5 py-1 text-[12px] tabular-nums text-emerald-300">{cur.toLocaleString()}</output><span className="text-slate-600">{suffix}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1"><input type="text" inputMode="numeric" defaultValue={String(cur)} onBlur={(e) => { const v = +e.target.value; if (/^\d+$/.test(e.target.value) && v !== cur) onEditSource({ [key]: v } as Partial<Project>, [`${label} → ${v}`]); }} className="w-full rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] tabular-nums text-slate-100 outline-none focus:border-cyan-500" /><span className="text-slate-600">{suffix}</span></div>
                  )}
                </label>
                );
              };
              const riskEdit = (label: string, key: "tech" | "comm") => (
                <label className="flex flex-col gap-0.5 text-[10px] text-slate-400">{label}
                  <select defaultValue={p[key]} onChange={(e) => onEditSource({ [key]: e.target.value } as Partial<Project>, [`${label} → ${e.target.value}`])} className="rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] text-slate-100 outline-none focus:border-cyan-500"><option value="low">Low</option><option value="med">Med</option><option value="high">High</option></select>
                </label>
              );
              return (
                <div data-source-panel className="mt-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.03]">
                  {/* THE FINANCIAL GRID ALWAYS SHOWS (operator, 2026-07-30: "remember financial grid S10
                      always shows"). S10 now has ZERO schema fields, so this panel is not a drawer beside
                      the content — it IS the content. A collapsed S10 would be a slide with nothing under
                      it, and a single source of truth nobody can see sends the work back to Excel, which is
                      the failure the operator named as critical. No toggle, no arrow, no way to hide it.
                      S8 keeps its collapse: it still has authored fields of its own underneath. */}
                  <div className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] font-medium text-emerald-300">
                    ◈ Financial record <span className="font-normal text-slate-500">— one edit updates every surface (no duplicate sources)</span>
                  </div>
                  {(
                    <div className="grid grid-cols-2 gap-2 px-3 pb-3 sm:grid-cols-3">
                      {/* THE GRID IS THE RECORD — and now the only thing on this panel that takes money.
                          R&D/NRE and New-rev-10-yr were read-outs of Sigma of the rows immediately above, and
                          Do-nothing-10-yr was a rival scalar for a band that has eleven years of its own. A
                          total printed twice on one panel is noise, not confirmation. The H42 Revenue Plan
                          block went with them: it wrote `revPlan`, S10 renders `finPlan`, and two financial
                          editors stacked on one panel disagree by construction (operator: "remove anything
                          that is not feeding slide financials"). What stays below is what genuinely feeds the
                          financials and is not a grid row — the two risk levers that drive pSuccess for the
                          risk-weighted NPV, and the program start the spend years are anchored to. */}
                      <S10FinEditor p={p} baseYear={baseYear} onEdit={onEditSource} />
                      {/* CONFIDENCE IS NO LONGER TYPED (operator: "confidence should be moved to risk and
                          dependent on Low, Med, High for tech and commercial"). It was a 1-5 select sitting
                          directly above two risk dropdowns that already encode the same judgement, free to
                          disagree with them. It is now `confidenceOf(p)` — a pure read of those two levers —
                          so the read-out sits WHERE THE INPUT WAS and moves the moment either risk changes. */}
                      {riskEdit("Tech Risk", "tech")}
                      {riskEdit("Comm Risk", "comm")}
                      {/* G3 · THE WHOLE READ-OUT TAKES THE SCORE'S TONE, not just the dots. It was hardcoded
                          emerald — border, fill and text — so a 3/5 read as reassuring green, which is the
                          case in the operator's screenshot (Med/Med). Tone comes from `confidenceTone`, the
                          same function the portfolio table uses, so the two can never disagree. */}
                      <label className="flex flex-col gap-0.5 text-[10px] text-slate-400">Confidence
                        <div className="rounded border px-1.5 py-1 text-[12px] tabular-nums"
                          style={{ borderColor: `${confidenceTone(confidenceOf(p))}40`, background: `${confidenceTone(confidenceOf(p))}0a`, color: confidenceTone(confidenceOf(p)) }}
                          title={`${RISK_LABEL[p.tech]} technical / ${RISK_LABEL[p.comm]} commercial → ${confidenceOf(p)} of 5`}>
                          {"●".repeat(confidenceOf(p))}<span className="text-slate-700">{"●".repeat(5 - confidenceOf(p))}</span> <span className="text-slate-400">{confidenceOf(p)}/5</span>
                        </div>
                      </label>
                      {/* W-13 · BUSINESS CONFIDENCE — THE ONE LADDER THAT COMES BACK, BECAUSE IT IS MANUAL.
                          Operator: "Add Manual 'Business Confidence' (by PdM/PgM) only using 10 - 95%
                          Confidence and same options as before … or whatever we used to have for Technical
                          and Commercial Confidence."
                          W-11 removed the ladder from Technical and Commercial for a reason that does NOT
                          apply here: those two are DERIVED from risk levels, so a rival percentage could
                          contradict them. This one is derived from nothing — it is a person's call after a
                          conversation with the SBU/BU Director or VP — so a discrete rung is the correct
                          instrument, and there is no second source for it to disagree with.
                          UNSET BY DEFAULT: an unmade call reads "—", never a number nobody chose. */}
                      {/* ONE LINE (operator: "Becomes one line: Business Confidence · PdM / PgM"). The
                          caption was a `<span>` sibling inside a `flex-col`, so it took a row of its own and
                          pushed this control's select a line below Tech Risk's and Comm Risk's — the whole
                          row stopped aligning. A nested flex-row keeps the two texts on one baseline, so the
                          three selects sit level again. `whitespace-nowrap` on the qualifier stops it
                          re-wrapping at the narrow end of the grid, which is where it started. */}
                      <label className="flex flex-col gap-0.5 text-[10px] text-slate-400">
                        <span className="flex items-baseline gap-1">
                          Business Confidence
                          <span className="whitespace-nowrap text-slate-600">· PdM / PgM</span>
                        </span>
                        <select value={bizConfOf(p) ?? ""}
                          onChange={(e) => onEditSource({ bizConfPct: e.target.value === "" ? null : +e.target.value } as Partial<Project>,
                                                        [`Business Confidence → ${e.target.value === "" ? "—" : `${e.target.value}%`}`])}
                          title="Set by the PdM/PgM after talking to the SBU or BU Director or VP. Derived from nothing — this is a judgement, not a calculation."
                          className="rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] tabular-nums text-slate-100 outline-none focus:border-cyan-500">
                          <option value="">—</option>
                          {BIZ_CONF_LADDER.map((r) => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </label>
                      {numEdit("eXeL R&D Upside", "upsideAccelK", "$K")}
                      {/* Program start — anchors the MoT gate timeline; changing it slides EVERY gate date. */}
                      <label className="flex flex-col gap-0.5 text-[10px] text-slate-400">Program Start (MoT • Slider)
                        <input type="date" defaultValue={p.startDate ?? defaultStartISO(p)} onChange={(e) => e.target.value && onEditSource({ startDate: e.target.value }, [`Program start → ${e.target.value} (timeline slid)`])} className="rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] text-slate-100 outline-none focus:border-cyan-500" />
                      </label>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-3 divide-y divide-slate-800">
              {/* ── X-0 · THE VALUE PROP RENDERS ONCE ON THIS PAGE ────────────────────────────────────
                  Operator: "Remove duplicate value prop below first one on S8 INPUT" — and, separately,
                  "I can't change numbers." THOSE WERE ONE DEFECT, and their own page dump proved it: the
                  source panel's chart read 162 while the copy below read 180.4. Both were correct. The panel
                  renders the DRAFT (`s8Drivers`), the fields below render the SAVED RECORD, so a successful
                  edit displayed as a failed one.
                  I CREATED THAT DUPLICATE IN W-1c. Before it, these four fields held independently typed
                  content, so they genuinely differed from the panel. Turning them into `linked` read-outs of
                  the same record made them a literal echo of the editor directly above them.
                  ⚠ THIS SUPPRESSES ONLY THE **EDIT** VIEW, AND ONLY THE FOUR THE PANEL ALREADY SHOWS.
                  Present mode renders through `panelsFor`, which is untouched — the slide still shows all of
                  them. `capture`, `benefits` and `features` stay here because the panel does NOT render them,
                  so hiding those would remove content rather than a duplicate.
                  ⚠ DELIBERATE DEVIATION FROM THE APPROVED PLAN, STATED NOT SLIPPED IN. The plan proposed the
                  inverse — retire the panel and make these fields the editing surface. Executing it exposed a
                  trap: un-linking `vprop`/`nba` routes them to the FIELD BAG, while S1, S6 and the dog-tag all
                  read `valuePropOf(p)` from the RECORD. That "fix" would have split the source in a new place.
                  Suppressing the echo instead keeps every write on the record, keeps the operator's field
                  ORDER intact inside the panel (value prop → NBA → chart → drivers), touches no schema, moves
                  no gate score, and removes no control — the Save the plan would have deleted stays. */}
              {spec.fields.map((f) => {
                if (spec.code === "S8" && srcOpen && S8_PANEL_ECHO.has(f.id)) return null;
                const c = cellOf(spec.code, f.id);
                return (
                  <div key={f.id} className="py-3">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-200">{f.name}</span>
                      {f.req && <span className="rounded bg-amber-500/15 px-1 text-[9px] font-mono tracking-wider text-amber-300">REQUIRED</span>}
                      {/* THE BADGE IS THE CONTROL (operator: "Anytime we say live from project have Edit
                          Financials or Edit Value Prop instead with edit symbol"). `◈ LIVE FROM PROJECT` was
                          passive — it told you the value was not yours to type, but not where it WAS. The verb
                          does both, and it sits exactly where the eye already is when someone wonders "can I
                          change this?", so the separate Edit-on-S## button below the field is removed as a
                          duplicate: one element fewer per linked field, which pays straight back into the
                          A2/V4 fit budgets on the tightest sheets.
                          Off the owning slide it navigates; ON the owning slide there is nowhere to go, so it
                          stays a badge — an edit verb that goes nowhere would be a lie. */}
                      {f.linked && (hasSourceLink(spec.code, f.id)
                        ? <SourceLink source={undefined} code={spec.code} fieldId={f.id} inline />
                        // W-18 · ON THE OWNING SLIDE THE BADGE OPENS THE EDITOR. Operator: "not sure how to
                        // add and edit differentiators vs NBA." That is MY defect: W-1c turned this field
                        // into a read-out, and the comment above says the badge "stays a badge — an edit
                        // verb that goes nowhere would be a lie." It was wrong about there being nowhere to
                        // go. The editor is the ◈ Edit source record panel at the top of THIS slide, and it
                        // starts COLLAPSED — so the one control sitting exactly where the user is looking
                        // when they wonder "can I change this?" did nothing at all.
                        // It now expands that panel and scrolls to it. No new surface, no second editor:
                        // the same one door, finally with a handle on it.
                        : <button type="button" onClick={() => { setSrcOpen(true); requestAnimationFrame(() => document.querySelector("[data-source-panel]")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}
                            title={`Open ${sourceLabelOf(spec.code, f.id)} — the editor for this record is on this slide`}
                            className="rounded bg-emerald-500/15 px-1 text-[9px] font-mono tracking-wider text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200">✎ {sourceLabelOf(spec.code, f.id)}</button>)}
                      {f.mirror && <span className="rounded bg-violet-500/15 px-1 text-[9px] font-mono tracking-wider text-violet-300">◈ MIRRORS {f.mirror}</span>}
                      <span className="flex-1" />
                      {!f.linked && (
                        <div className="flex overflow-hidden rounded border border-slate-700 text-[10px]">
                          <button onClick={() => setMode(spec.code, f.id, "hi")} aria-pressed={c.mode !== "ai"} className={`px-1.5 py-0.5 font-mono ${c.mode !== "ai" ? "bg-violet-500/20 text-violet-200" : "text-slate-500 hover:bg-slate-800"}`}>웃 HI</button>
                          <button onClick={() => setMode(spec.code, f.id, "ai")} aria-pressed={c.mode === "ai"} className={`px-1.5 py-0.5 font-mono ${c.mode === "ai" ? "bg-cyan-500/20 text-cyan-200" : "text-slate-500 hover:bg-slate-800"}`}>◬ AI</button>
                        </div>
                      )}
                    </div>
                    {f.hint && <div className="mb-1.5 text-[10px] text-slate-500">{f.hint}</div>}
                    <FieldEditor f={f} />
                    {!f.linked && c.mode === "ai" && !fieldEmpty(aiFor(spec.code, f.id)) && (
                      <button onClick={() => { writeCell(spec.code, f.id, { hi: aiFor(spec.code, f.id), mode: "hi" }); }}
                        className="mt-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 hover:bg-cyan-500/20">◬ {t("innovation.slides.useAi")}</button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Version history + replay — save a version (comment), scrub prior versions gate-to-gate, and see
                financial + risk progression over time. A ≥10% quantified change flags manager (Lead) approval. */}
            <div className="mt-3 rounded-lg border border-slate-800 bg-[#0e141b]">
              <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                <button onClick={() => { setShowReplay((v) => !v); setVIdx(Math.max(0, slideVersions.length - 1)); }}
                  className="rounded border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800"><MarkClock /> {showReplay ? "Hide" : "History / Replay"} <span className="tabular-nums text-slate-500">({slideVersions.length})</span></button>
                <input id="ver-comment" placeholder="Comment for this version…" className="min-w-0 flex-1 rounded border border-slate-700 bg-[#0b0f14] px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-cyan-500" />
                <button onClick={() => { const el = document.getElementById("ver-comment") as HTMLInputElement | null; const c = (el?.value || "").trim() || "Working update saved."; const sub = captureVersion("submitted", c, p.manager); if (el) el.value = ""; setShowReplay(true); setVIdx(slideVersions.length); if (sub) alert("Substantial change (≥10%) — this version needs Lead approval before it becomes the baseline."); }}
                  className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"><Save className="h-3 w-3" aria-hidden /> Save version</button>
              </div>
              {showReplay && (slideVersions.length === 0 ? (
                <div className="px-3 pb-3 text-[11px] italic text-slate-500">No versions yet — save one, or approve the slide, to start the history.</div>
              ) : (() => {
                const sel = slideVersions[Math.min(vIdx, slideVersions.length - 1)];
                const pts = slideVersionTimeline(slideVersions);
                const fin = sel.fin;
                return (
                  <div className="border-t border-slate-800 px-3 py-2">
                    {/* scrubber */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => setVIdx((i) => Math.max(0, i - 1))} disabled={vIdx <= 0} className="rounded border border-slate-700 px-1.5 text-slate-300 disabled:opacity-30">‹</button>
                      <div className="relative h-6 flex-1">
                        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700" />
                        {pts.map((pt, i) => (
                          <button key={pt.version.id} onClick={() => setVIdx(i)} title={`${pt.version.gate} · ${pt.version.status}`}
                            className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${i === Math.min(vIdx, slideVersions.length - 1) ? "ring-2 ring-cyan-400" : ""} ${pt.approved ? "bg-emerald-400" : pt.version.substantial ? "bg-amber-400" : "bg-slate-500"}`}
                            style={{ left: `${pt.t * 100}%` }} aria-label={`Version ${i + 1}`} />
                        ))}
                      </div>
                      <button onClick={() => setVIdx((i) => Math.min(slideVersions.length - 1, i + 1))} disabled={vIdx >= slideVersions.length - 1} className="rounded border border-slate-700 px-1.5 text-slate-300 disabled:opacity-30">›</button>
                      <span className="text-[10px] tabular-nums text-slate-500">{Math.min(vIdx, slideVersions.length - 1) + 1}/{slideVersions.length}</span>
                    </div>
                    {/* selected version detail */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-mono text-cyan-400">{sel.gate}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${sel.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : sel.status === "change-pending" ? "bg-amber-500/15 text-amber-300" : "bg-slate-700 text-slate-300"}`}>{sel.status || "draft"}</span>
                      <span className="text-slate-400">{sel.ts.slice(0, 10)}</span>
                      <span className="text-slate-500">· {sel.by}</span>
                    </div>
                    {sel.comment && <p className="mt-1 text-[12px] italic text-slate-300">“{sel.comment}”</p>}
                    {/* financials progression at this version */}
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {([["NRE", `$${fin.nreK}k`], ["10-yr Rev", `$${fin.revM}M`], ["Margin", `$${fin.marginM}M`], ["NPV", `$${fin.npvM}M`]] as const).map(([lbl, val]) => (
                        <div key={lbl} className="rounded border border-slate-700 px-1.5 py-1"><div className="text-[13px] font-semibold tabular-nums text-slate-100">{val}</div><div className="text-[8px] uppercase tracking-wider text-slate-500">{lbl}</div></div>
                      ))}
                    </div>
                    {sel.substantial && sel.status !== "approved" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
                        <span>▲ Substantial change (≥10%) — critical parties (Engineering · Commercial · Business) notified; Lead approval required.</span>
                        <button onClick={() => { captureVersion("approved", "Lead approved substantial change; baseline updated.", "웃 HI (Lead)"); setVIdx(slideVersions.length); }}
                          className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-200 hover:bg-emerald-500/25">웃 Lead approve</button>
                      </div>
                    )}
                  </div>
                );
              })())}
            </div>
          </div>
        )}

        {/* Prev / Next */}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => go(-1)} disabled={idx === 0}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">← {t("innovation.slides.prev")}</button>
          <span className="text-[10px] text-slate-500 tabular-nums">{idx + 1} / {SLIDE_SCHEMA.length}</span>
          <button onClick={() => go(1)} disabled={idx === SLIDE_SCHEMA.length - 1}
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-[#06202a] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">{t("innovation.slides.next")} →</button>
        </div>
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
    case "REQ-38": rows.push(["Model confidence", `${confidenceOf(p)}/5`]); break;
    case "REQ-53": rows.push(["Technical risk", RISK_LABEL[p.tech]], ["Commercial risk", RISK_LABEL[p.comm]], ["Contingency", `+${Math.round(riskContingency(p) * 100)}%`], ["NPV", usd(fm.npvM)], ["IRR", `${fm.irrPct}%`]); break;
    case "REQ-54": rows.push(["Strategic pillar", m.initiative]); break;
    case "REQ-55": rows.push(["Value ladder", m.valueLadder], ["Impact", m.valueImpact], ["Competitive", m.competitive]); break;
    case "REQ-89": rows.push(["Dependencies declared", String(dependsOn(DEMO_DEPS, p.id).length)]); break;
    case "REQ-90": rows.push(["Acknowledged by others", String(dependentsOf(DEMO_DEPS, p.id).length)]); break;
    case "REQ-71": rows.push(["Product #", h.product], ["Material #", h.material], ["Hierarchy", `${h.bu} › ${h.sbu} › ${h.pgroup} › ${h.alpha}`]); break;
    case "REQ-42": rows.push(["Payback", `${payb(fm.paybackYears)}`], ["REV/NRE", `${fm.revOverNre.toFixed(1)}×`]); break;
    case "REQ-69": rows.push(["Growth contribution (wtd)", usd(weightedRevM(p))], ["10-yr gross profit", usd(fm.grossProfit10yM)]); break;
    case "REQ-56": rows.push(["Customer / PoR", ex.customer], ["Pursuits", ex.pursuits.map((x) => x.name).join(" · ")], ["Target market", m.targetMarket]); break;
    case "REQ-48": rows.push(["Capital & Tooling", k(fm.capitalK)], ["Total R&D", k(fm.totalRdOpexK)]); break;
    default: break;
  }
  if (req.type === "S") {
    let st = "not started";
    try { st = (JSON.parse(lsGet(SLIDE_KEY) || "{}") as Record<string, string>)[`${p.id}|${req.id}`] || "not started"; } catch { /* none */ }
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

// Generic gate comments + countermeasures (GATE_NOTES) — the recurring IRB concern at each gate and the
// standard countermeasure that clears it, every one marked "solved per gate". Collapsible per gate; the
// project's decision gate (next gate) opens by default so the board sees what it must clear next.
function GateNotesPanel({ sel }: { sel: Project }) {
  const { t } = useLexicon();
  const gi = GATES.indexOf(sel.gate);
  const decGate = GATES[gi + 1] ?? sel.gate; // the gate under review
  const [open, setOpen] = useState<Set<Gate>>(() => new Set<Gate>([decGate]));
  const toggle = (g: Gate) => setOpen((s) => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n; });
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("innovation.notes.title")}</h2>
        <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">✓ {t("innovation.notes.solved")}</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{t("innovation.notes.sub")}</p>
      <div className="mt-3 space-y-1.5">
        {GATES.map((g, i) => {
          const note = GATE_NOTES[g];
          const isOpen = open.has(g);
          const state = i < gi ? "done" : i === gi + 1 ? "next" : i === gi ? "current" : "future";
          const badge = state === "next" ? "border-amber-500/40 text-amber-300" : state === "current" ? "border-cyan-500/40 text-cyan-300" : state === "done" ? "border-emerald-500/30 text-emerald-300" : "border-slate-700 text-slate-500";
          return (
            <div key={g} className="rounded-lg border border-slate-800 bg-[#0b0f14]">
              <button onClick={() => toggle(g)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/30" aria-expanded={isOpen}>
                <span className="text-slate-500">{isOpen ? "▾" : "▸"}</span>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-mono ${badge}`}>{g}</span>
                <span className="text-xs font-medium text-slate-300">{GATE_STAGE[g]}</span>
                <span className="ml-auto text-[10px] tabular-nums text-emerald-400">{note.countermeasures.length} ✓</span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-800 px-3 py-2.5">
                  <p className="text-[12px] leading-relaxed text-slate-400">{note.comment}</p>
                  <div className="mt-2 space-y-1.5">
                    {note.countermeasures.map((cm, j) => (
                      <div key={j} className="flex items-start gap-2 rounded-md bg-[#0e141b] px-2.5 py-1.5">
                        <span className={`mt-0.5 shrink-0 rounded px-1 text-[10px] font-semibold ${cm.solved ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{cm.solved ? "✓" : "○"}</span>
                        <div className="min-w-0">
                          <div className="text-[11px] text-rose-300/90">{t("innovation.notes.risk")}: <span className="text-slate-300">{cm.risk}</span></div>
                          <div className="text-[11px] text-emerald-300/90">{t("innovation.notes.cm")}: <span className="text-slate-300">{cm.countermeasure}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GateRequirementsView({ projects, allProjects, hierFilter, onScope, sel, onSelect, onEditSource }: { projects: Project[]; allProjects: Project[]; hierFilter: HierSel; onScope: (s: HierSel) => void; sel: Project; onSelect: (id: string) => void; onEditSource?: (patch: Partial<Project>, changes: string[]) => void }) {
  const { t } = useLexicon();
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
    writeStore(SLIDE_KEY, "slides", upd);
    return upd;
  });
  // Digital slide show — open at S1 (header) or at a specific slide (from a matrix row).
  const [deck, setDeck] = useState<{ open: boolean; slide?: string }>({ open: false });
  // ── GATE SCOPE · DECISION 1 — SHARE the page-level `hierFilter`, do not fork a Gate-local one. ──────────
  // The Growth Model / financial-review chart already drives the SAME page-level state (page.tsx:631 passes
  // `onScope={setHierFilter}`, rendered at :5913), and the portfolio header owns the same control (:663). One
  // company scope is the operator's mental model: a Gate-local copy would silently disagree with the portfolio
  // and the financial review, so narrowing here and then flipping tabs would put the "random projects" straight
  // back on screen — which is the exact defect being fixed. `projects` is ALREADY `scopeByHier(order,
  // hierFilter)` (page.tsx:385 → :909), so this adds the missing CONTROL, it does not add a second filter path.
  // ── DECISION 2 — a scope change must never orphan the selection. ────────────────────────────────────────
  // `sel` is resolved upstream from the FULL `order` (page.tsx:387), not from the scoped list, so narrowing the
  // scope can leave <select value={sel.id}> pointing at an id that is no longer one of its <option>s. Browsers
  // then paint the first option while the app still reports the old project — the header, readiness rollup and
  // slide matrix would describe a project the dropdown appears not to be on. So: SNAP TO THE FIRST IN-SCOPE
  // PROJECT. Guarded on `projects.length` — an empty scope (e.g. a BU + an Alpha Group from another BU) keeps
  // the previous selection rather than crashing on `projects[0]`, and the header says the scope is empty.
  useEffect(() => {
    if (projects.length > 0 && !projects.some((p) => p.id === sel.id)) onSelect(projects[0].id);
  }, [projects, sel.id, onSelect]);
  return (
    <div className="space-y-4">
      {deck.open && <SlideShowModal p={sel} startSlide={deck.slide} onEditSource={onEditSource} onClose={() => { setDeck({ open: false }); setSlides(readStore(SLIDE_KEY)); }} />}
      {/* Project selector + context — scoped by the ONE standard BU · SBU · Alpha Group ScopeFilter, so the
          dropdown lists only the projects in the operator's scope instead of every project in the company. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-400">Gate governance for</div>
        <ScopeFilter projects={allProjects} sel={hierFilter} onChange={onScope} />
        <select
          value={sel.id} onChange={(e) => onSelect(e.target.value)} aria-label="Gate governance project"
          className="rounded-lg border border-slate-700 bg-[#0b0f14] px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
        >
          {/* W-17 · THE LABEL NAMES THE LEVEL YOU JUST DRILLED PAST (operator: "If single BU is highlighted,
              show SBU in front of project title … If Alpha Group, show Alpha Code in front of Title").
              Once the scope is pinned to one BU, repeating that BU on every row is noise; what tells the rows
              apart is their SBU. `scopedProjectLabel` is the ONE producer, so a second scoped picker cannot
              invent its own format — and with no single level pinned it returns the bare name, byte-identical
              to today. */}
          {projects.map((p) => <option key={p.id} value={p.id}>{scopedProjectLabel(p, hierFilter)} · {p.gate}</option>)}
          {/* Empty scope — keep the current project addressable so the view below still has a subject. */}
          {projects.length === 0 && <option value={sel.id}>{scopedProjectLabel(sel, hierFilter)} · {sel.gate}</option>}
        </select>
        <span data-gate-scope-count className="text-[11px] tabular-nums text-slate-500">
          {projects.length} of {allProjects.length} in scope
        </span>
        <span className="text-[11px] text-slate-500">Last completed gate <span className="font-mono text-slate-300">{sel.gate}</span> → stage <span className="text-slate-300">{GATE_STAGE[sel.gate]}</span></span>
        <button onClick={() => setDeck({ open: true })}
          className="ml-auto rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20">▶ {t("innovation.slides.open")}</button>
      </div>

      {/* §3.5 Gate readiness rollup — % satisfied · Ready/Not · blocking count · band */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <h2 className="text-sm font-semibold">Gate readiness · % requirements satisfied <span className="text-[11px] text-slate-500">· G1 → G7 one line</span></h2>
        {/* G1–G7 on a single line (deck parity — Robust Stage-Gate) — horizontal scroll on narrow screens. */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {readiness.map((r, i) => {
            const state = i < gateIdx ? "done" : i === gateIdx ? "current" : "future";
            const barColor = r.ready ? "bg-emerald-500" : r.pct >= 50 ? "bg-amber-500" : "bg-rose-500";
            return (
              <div key={r.gate} className={`min-w-[104px] flex-1 shrink-0 rounded-lg border p-2.5 ${state === "current" ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-800 bg-[#0b0f14]"}`}>
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
        <p className="mt-2 text-[11px] text-slate-500">Tolerance ladder ±60/40/20/10/5% — tightens gate over gate; a gate-to-gate move beyond the band raises a variance exception for {board} disposition ({boardFull(board)} — the review meeting where prioritization begins).</p>
      </section>

      {/* Generic gate comments + countermeasures (solved per gate) */}
      <GateNotesPanel sel={sel} />

      {/* §3.1 Requirements × gates matrix — rows = requirements, columns = G1–G7 */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800">
          <h2 className="text-sm font-semibold">Gate Review Slides · S1 – S18</h2>
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
                  <tr onClick={() => toggle(req.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(req.id); } }}
                    role="button" tabIndex={0} aria-expanded={isOpen} aria-label={`${slideDef(req.id)?.name ?? dispReqId(req.id)} — expand detail`}
                    className={`cursor-pointer border-b border-slate-900 hover:bg-slate-800/30 focus:bg-slate-800/40 focus:outline-none ${isOpen ? "bg-slate-800/40" : ""}`} title="Expand into actual detail">
                    <td className={`px-3 py-1.5 font-mono text-[11px] ${REQ_TYPE_CHIP[req.type]}`}><span className="mr-1 text-slate-500">{isOpen ? "▾" : "▸"}</span>{dispReqId(req.id)}</td>
                    <td className="px-2 py-1.5">
                      {(() => { const d = slideDef(req.id); return (
                        <>
                          <div className="text-[13px] text-slate-200 leading-tight">{d ? d.name : req.title}</div>
                          <div className="text-[10px] text-slate-500">{d ? <>{d.summary} · </> : null}<span className="font-mono text-cyan-400/80">Gate {req.earliestGate}</span> · {board} review</div>
                        </>
                      ); })()}
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
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500">Reviewed at Gate {req.earliestGate} · figures derived from the live project model (same source as the rack, growth model, and metric cards).</span>
                          <button onClick={(e) => { e.stopPropagation(); setDeck({ open: true, slide: req.id }); }}
                            className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 hover:bg-cyan-500/20">▶ {t("innovation.slides.openThis")}</button>
                        </div>
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
type PillarDef = { name: string; desc: string; color?: string };
function loadPillars(): PillarDef[] {
  const s = lsGet(PILLAR_KEY);
  if (s) { try { const p = JSON.parse(s) as PillarDef[]; if (Array.isArray(p) && p.length) return p; } catch { /* seed */ } }
  return STRATEGIC_INITIATIVES.map((n) => ({ name: n, desc: PILLAR_DESC[n] }));
}
// Shared master-data loader — reads the admin Business Setup (localStorage) or falls back to
// the seed. Powers the edit-project + Submit-New-Idea dropdowns so BU/SBU/Alpha changes flow.
function loadBizSetup(): BizSetup {
  const saved = lsGet(BIZ_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as BizSetup;
      // Coerce the legacy generic company label (or an empty value) to the brand so existing demo
      // localStorage shows "Harmattan AI"; any operator-chosen custom name is preserved as-is.
      if (!parsed.company?.trim() || parsed.company === COMPANY_NAME) parsed.company = DEFAULT_COMPANY_NAME;
      return parsed;
    } catch { /* fall through to seed */ }
  }
  return seedBizSetup(DEMO_PROJECTS);
}
// R&D budget scenarios — admin-editable NAME + $M (operator), persisted in Business Setup; seeded from defaults.
type ScenarioCfg = { key: BudgetScenario; label: string; m: number };
const SCEN_KEY = "innovation-scenarios";
function loadScenarios(): ScenarioCfg[] {
  try { const s = lsGet(SCEN_KEY); if (s) { const a = JSON.parse(s); if (Array.isArray(a) && a.length) return a as ScenarioCfg[]; } } catch { /* seed */ }
  return BUDGET_SCENARIOS.map((s) => ({ key: s.key, label: s.label, m: s.m }));
}
const saveScenarios = (a: ScenarioCfg[]) => { lsSet(SCEN_KEY, JSON.stringify(a)); void saveState("scenarios", a as unknown as Record<string, string>); };
const scenarioMOf = (scen: BudgetScenario) => loadScenarios().find((s) => s.key === scen)?.m ?? 77;
// Review board that gives per-slide gate feedback. Default IRB (Innovation Review Board);
// admin-selectable/editable in Business Setup. Persisted so every gate-feedback surface agrees.
const REVIEW_BOARD_KEY = "innovation-review-board";
const DEFAULT_REVIEW_BOARD = "IRB";
const REVIEW_BOARD_PRESETS = ["IRB", "PRB", "IPT"]; // Innovation Review Board · Product Review Board · Integrated Product Team
const REVIEW_BOARD_FULL: Record<string, string> = { IRB: "Innovation Review Board", PRB: "Product Review Board", IPT: "Integrated Product Team" };
const boardFull = (b: string): string => REVIEW_BOARD_FULL[b] ?? "custom review body";
function loadReviewBoard(): string { return (lsGet(REVIEW_BOARD_KEY) || DEFAULT_REVIEW_BOARD).trim() || DEFAULT_REVIEW_BOARD; }
// The portfolio-prioritization module name (formerly "Rack & Stack") — admin-configurable so
// each org can label the prioritize-and-fund workflow in its own vocabulary. Persisted.
const STACK_NAME_KEY = "innovation-stack-name";
const DEFAULT_STACK_NAME = "Portfolio Prioritization";
const STACK_NAME_PRESETS = ["Portfolio Prioritization", "Prioritize & Fund", "Portfolio Balancer", "Funding Line", "Priority Board"];
function loadStackName(): string { return (lsGet(STACK_NAME_KEY) || DEFAULT_STACK_NAME).trim() || DEFAULT_STACK_NAME; }

// ── Dog-tag project summary (FLIR transparency board, IMG_7871/7872) ──────────────────────
// A project renders as a "dog tag": name on TOP, SBU vertical on the LEFT, launch date vertical
// on the RIGHT (all three fixed), and a set of admin-CONFIGURABLE highlight metrics in the middle.
const DOGTAG_METRICS: { key: string; label: string; val: (p: Project) => string }[] = [
  { key: "remaining", label: "Remaining FY Spend", val: (p) => k(p.nreK) },
  { key: "npv", label: "NPV", val: (p) => usd(npvM(p)) },
  { key: "rev", label: "Cur-Yr Revenue", val: (p) => usd(projectRevSeries(p)[0]?.total ?? 0) },
  { key: "wrev", label: "P-wt Rev", val: (p) => usd(weightedRevM(p)) },
  { key: "irr", label: "IRR", val: (p) => `${irrPct(p)}%` },
  { key: "payback", label: "Payback", val: (p) => `${payb(financialMetrics(p).paybackYears)}` },
  { key: "margin", label: "Gross Margin", val: (p) => `${execOf(p).marginPct}%` },
  { key: "tenyr", label: "10-Yr Revenue", val: (p) => usd(p.fullRev10yM) },
  // Bridge Slice 2 — new configurable highlight metrics (council asks). Compute identically wherever shown.
  { key: "vpd", label: "Value / $", val: (p) => `${valuePerDollarOf(p).toFixed(1)}×` },
  { key: "winp", label: "Win P50", val: (p) => `${Math.round(winProbabilityOf(p).p50 * 100)}%` },
  { key: "vindex", label: "Value Index", val: (p) => usd(valueIndexOf(p)) },
  { key: "riskband", label: "Risk Band", val: (p) => { const r = riskBandOf(p); return `${r.technical[0]}/${r.commercial[0]}/${r.dependency[0]}`; } },
  { key: "cpb", label: "Cost / Buyer", val: (p) => k(costPerServedBuyerOf(p, Math.max(1, p.segmentValueProps?.length ?? 1)) / 1000) },
  { key: "nba", label: "Next Best Alt", val: (p) => { const s = nbaOf(p); return s.length > 26 ? s.slice(0, 24) + "…" : s; } },
];
const DOGTAG_KEY = "innovation-dogtag-highlights";
const DEFAULT_DOGTAG = ["remaining", "npv", "rev"]; // matches the reference board
function loadDogtag(): string[] {
  const s = lsGet(DOGTAG_KEY);
  if (s) { try { const a = JSON.parse(s) as string[]; if (Array.isArray(a) && a.length) return a.filter((kk) => DOGTAG_METRICS.some((m) => m.key === kk)); } catch { /* default */ } }
  return DEFAULT_DOGTAG;
}
function BusinessSetup({ onRename, onCompanyRename, onClose }: { onRename?: (name: string) => void; onCompanyRename?: (name: string) => void; onClose?: () => void }) {
  const [admin, setAdmin] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [setup, setSetup] = useState<BizSetup>(() => seedBizSetup(DEMO_PROJECTS));
  const [tier, setTier] = useState<BizTier>("bu");
  const [pillars, setPillars] = useState<PillarDef[]>(() => STRATEGIC_INITIATIVES.map((n) => ({ name: n, desc: PILLAR_DESC[n] })));
  const [board, setBoard] = useState(DEFAULT_REVIEW_BOARD);
  const [stackName, setStackName] = useState(DEFAULT_STACK_NAME);
  const [dogtag, setDogtag] = useState<string[]>(DEFAULT_DOGTAG);
  const [segLib, setSegLib] = useState<string[]>(DEFAULT_SEGLIB);
  const [glossary, setGlossary] = useState<[string, string][]>(Object.entries(DEFAULT_GLOSSARY));
  const [scenarios, setScenarios] = useState<ScenarioCfg[]>(() => loadScenarios());
  const { t } = useLexicon();
  useEffect(() => {
    setAdmin(ssGet(ADMIN_KEY) === "1");
    setSetup(loadBizSetup()); // shared loader coerces the legacy company label → brand (single source)
    setPillars(loadPillars());
    setScenarios(loadScenarios());
    setBoard(loadReviewBoard());
    setStackName(loadStackName());
    setDogtag(loadDogtag());
    setSegLib(loadSegLib());
    setGlossary(Object.entries(loadGlossary()));
  }, []);
  const persist = (next: BizSetup) => { setSetup(next); lsSet(BIZ_KEY, JSON.stringify(next)); };
  // Company brand — the TOP editable item; persists via the setup blob AND pushes the name up so the
  // header eyebrow (Vision • 2525 · <brand>) updates live throughout the tool.
  const persistCompany = (name: string) => { persist({ ...setup, company: name }); onCompanyRename?.(name); };
  const persistSegLib = (next: string[]) => { setSegLib(next); lsSet(SEGLIB_KEY, JSON.stringify(next)); };
  const persistGlossary = (next: [string, string][]) => { setGlossary(next); lsSet(GLOSSARY_KEY, JSON.stringify(Object.fromEntries(next.filter(([k2]) => k2.trim())))); };
  const persistPillars = (next: PillarDef[]) => { setPillars(next); lsSet(PILLAR_KEY, JSON.stringify(next)); };
  const persistBoard = (next: string) => { setBoard(next); lsSet(REVIEW_BOARD_KEY, next); };
  const persistStackName = (next: string) => { setStackName(next); lsSet(STACK_NAME_KEY, next); onRename?.(next); };
  const persistDogtag = (next: string[]) => { const v = next.length ? next : DEFAULT_DOGTAG; setDogtag(v); lsSet(DOGTAG_KEY, JSON.stringify(v)); };
  const unlock = () => (pw === CODE ? (ssSet(ADMIN_KEY, "1"), setAdmin(true)) : setErr(true));

  if (!admin) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border border-amber-500/30 bg-[#111820] p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">Admin · Master Business Setup</div>
          {onClose && <button onClick={onClose} aria-label={t("innovation.setup.close")} title={t("innovation.setup.close")} className="shrink-0 rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800">✕ {t("innovation.setup.close")}</button>}
        </div>
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
  // Grey baseline revenue ($M) is settable at BU · SBU · Alpha Group (pgroup) — operator.
  const baseTier = tier === "bu" || tier === "sbu" || tier === "pgroup";
  // P&L seeds (base-year Rev · Margin $ · Growth %) are entered down to the Alpha Code tier only (operator).
  const finTier = tier === "bu" || tier === "sbu" || tier === "pgroup" || tier === "alpha";
  // Trinity BU color for a row — BU uses its own; children inherit their ancestor BU's color (walk parent chain).
  const buCodeOf = (tk: BizTier, code: string): string => {
    let t = tk, c = code;
    while (t !== "bu") { const meta = BIZ_TIERS.find((x) => x.key === t); const pk = meta?.parent; const node = setup[t].find((n) => n.code === c); if (!pk || !node?.parent) break; c = node.parent; t = pk; }
    return c;
  };
  const rowColor = (r: BizNode): string => BU_COLOR[buCodeOf(tier, r.code)] ?? "#334155";
  const addRow = () => setRows([...rows, { code: `NEW${rows.length + 1}`, label: "New " + tierMeta.label, parent: parentRows[0]?.code, baseM: baseTier ? 0 : undefined }]);
  const delRow = (i: number) => setRows(rows.filter((_, j) => j !== i));
  const resetSeed = () => persist(seedBizSetup(DEMO_PROJECTS));
  const inp = "rounded border border-slate-700 bg-[#0b0f14] px-1.5 py-0.5 text-xs text-slate-100 outline-none focus:border-cyan-500";
  // Σ Base Rev = the current-year baseline (Rev $M at SBU tier). The old do-nothing "Base $M" column was removed
  // (operator: "Base Rev / Base Mgn are current-year figures … there is not another number too").
  const totalBaseRev = setup.sbu.reduce((s, n) => s + (n.revM ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">Master Business Setup · Admin</div>
          <label className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">Company Name — top of hierarchy · drives the header brand</label>
          <input value={setup.company} onChange={(e) => persistCompany(e.target.value)} placeholder={DEFAULT_COMPANY_NAME}
            aria-label="Company name"
            className="mt-0.5 rounded border border-slate-700 bg-[#0b0f14] px-2 py-1 text-lg font-semibold text-slate-100 outline-none focus:border-cyan-500" />
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="text-slate-500">Σ Base Rev <b className="text-emerald-300">${Math.round(totalBaseRev)}M</b></span>
          <button onClick={resetSeed} className="rounded border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">Reset to seed</button>
          <button onClick={() => { ssDel(ADMIN_KEY); setAdmin(false); }} className="rounded border border-slate-700 px-2 py-1 text-slate-400 hover:bg-slate-800">Lock</button>
          {onClose && <button onClick={onClose} aria-label={t("innovation.setup.close")} title={t("innovation.setup.close")} className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 font-medium text-cyan-300 hover:bg-cyan-500/20">✕ {t("innovation.setup.close")}</button>}
        </div>
      </div>

      {/* R&D budget scenarios — editable NAME + $M (operator); drives the portfolio dropdown + funding line */}
      <div className="rounded-lg border border-slate-800 bg-[#0b0f14] p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-400">R&D Budget Scenarios</div>
        <div className="flex flex-wrap gap-3">
          {scenarios.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1.5 rounded border border-slate-700 px-2 py-1.5">
              <input value={s.label} onChange={(e) => { const next = scenarios.map((x, j) => j === i ? { ...x, label: e.target.value } : x); setScenarios(next); saveScenarios(next); }}
                className="w-28 rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-[12px] text-slate-100 outline-none focus:border-cyan-500" aria-label={`${s.key} name`} />
              <span className="text-slate-500">$</span>
              <input type="text" inputMode="numeric" value={String(s.m)} onChange={(e) => { if (!/^\d*$/.test(e.target.value)) return; const next = scenarios.map((x, j) => j === i ? { ...x, m: +e.target.value } : x); setScenarios(next); saveScenarios(next); }}
                className="w-16 rounded border border-slate-700 bg-[#0e141b] px-1.5 py-1 text-right text-[12px] tabular-nums text-slate-100 outline-none focus:border-cyan-500" aria-label={`${s.key} $M`} />
              <span className="text-slate-500">M</span>
            </div>
          ))}
        </div>
        {/* Per-scenario SBU budget split — weighted by NRE demand (operator: assign SBU/Alpha budgets per scenario) */}
        <div className="mt-3 space-y-1.5">
          {scenarios.map((s) => (
            <div key={`alloc-${s.key}`} className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="w-28 shrink-0 truncate text-slate-500">{s.label} · ${s.m}M →</span>
              {scenarioNodeBudgets(s.m, DEMO_PROJECTS, "sbu").map((n) => (
                <span key={n.node} className="rounded border border-slate-700 bg-[#0b0f14] px-1.5 py-0.5 tabular-nums text-slate-300">
                  <span className="font-mono text-cyan-400">{n.node}</span> <span className="text-emerald-300">${n.m}M</span>
                </span>
              ))}
            </div>
          ))}
          <p className="text-[10px] text-slate-500">SBU budgets are weighted by each SBU&apos;s NRE demand and sum to the scenario total. Per-node editable overrides land next.</p>
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
              <span className="flex h-6 w-8 items-center justify-center rounded text-[10px] font-mono" style={{ background: `${pillarColorOf(pl.name, pillars)}22`, color: pillarColorOf(pl.name, pillars) }}>P{i + 1}</span>
              <input value={pl.name} onChange={(e) => persistPillars(pillars.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={`w-56 ${inp}`} />
              <input value={pl.desc} onChange={(e) => persistPillars(pillars.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} placeholder="one-line description" className={`flex-1 min-w-[200px] ${inp}`} />
              {/* Pillar color — the InnovationTag highlight. Trinity defaults; custom picker (same method as Settings' custom color). */}
              <label className="flex items-center gap-1 text-[10px] text-slate-500" title="Strategic pillar color — the InnovationTag highlight">
                <input type="color" value={pl.color ?? pillarColorOf(pl.name, pillars)} aria-label={`Color for ${pl.name}`}
                  onChange={(e) => persistPillars(pillars.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
                  className="h-6 w-8 cursor-pointer rounded border border-slate-700 bg-transparent p-0" />
                {pl.color && <button onClick={() => persistPillars(pillars.map((x, j) => j === i ? { ...x, color: undefined } : x))} title="Reset to Trinity default" aria-label={`Reset color for ${pl.name}`} className="text-slate-500 hover:text-cyan-300">↺</button>}
              </label>
              <button onClick={() => persistPillars(pillars.filter((_, j) => j !== i))} className="rounded px-1.5 text-rose-400 hover:bg-rose-500/10" title="Delete">✕</button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Renaming a pillar updates the edit-project + Submit-New-Idea dropdowns. Existing projects keep their stored pillar until re-selected.</p>
      </section>

      {/* Segment library (Slice 7) — reusable buyer-need taxonomy for authoring per-segment value props */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("innovation.seg.library")} <span className="text-[11px] text-slate-500">({segLib.length})</span></h2>
          <button onClick={() => persistSegLib([...segLib, ""])} className="rounded bg-cyan-500/90 px-2.5 py-1 text-[11px] font-semibold text-[#06202a] hover:bg-cyan-400">{t("innovation.seg.addSeg")}</button>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">{t("innovation.seg.libraryHint")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {segLib.map((sg, i) => (
            <div key={i} className="flex items-center gap-1 rounded-lg border border-slate-800 px-1.5 py-1">
              <input value={sg} onChange={(e) => persistSegLib(segLib.map((x, j) => j === i ? e.target.value : x))} placeholder="buyer need" className={`w-40 ${inp} py-1 text-xs`} />
              <button onClick={() => persistSegLib(segLib.filter((_, j) => j !== i))} className="rounded px-1 text-rose-400 hover:bg-rose-500/10" title="Delete">✕</button>
            </div>
          ))}
        </div>
      </section>

      {/* Shared glossary (Slice 8) — one versioned definition per term, cited across the tool */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("innovation.glossary.title")} <span className="text-[11px] text-slate-500">({glossary.length})</span></h2>
          <button onClick={() => persistGlossary([...glossary, ["", ""]])} className="rounded bg-cyan-500/90 px-2.5 py-1 text-[11px] font-semibold text-[#06202a] hover:bg-cyan-400">{t("innovation.glossary.addTerm")}</button>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">{t("innovation.glossary.hint")}</p>
        <div className="mt-2 space-y-1.5">
          {glossary.map(([term, def], i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input value={term} onChange={(e) => persistGlossary(glossary.map((x, j) => j === i ? [e.target.value, x[1]] : x))} placeholder="term" className={`w-40 ${inp}`} />
              <input value={def} onChange={(e) => persistGlossary(glossary.map((x, j) => j === i ? [x[0], e.target.value] : x))} placeholder="definition" className={`flex-1 min-w-[220px] ${inp}`} />
              <button onClick={() => persistGlossary(glossary.filter((_, j) => j !== i))} className="rounded px-1.5 text-rose-400 hover:bg-rose-500/10" title="Delete">✕</button>
            </div>
          ))}
        </div>
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

      {/* Dog-tag highlights — which metrics show on each project's summary card */}
      <section className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
        <h2 className="text-sm font-semibold">Project Summary Highlights <span className="text-[11px] text-slate-500">— dog-tag middle metrics (SBU left · name top · launch date right are fixed)</span></h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {DOGTAG_METRICS.map((m) => {
            const on = dogtag.includes(m.key);
            return (
              <button key={m.key} onClick={() => persistDogtag(on ? dogtag.filter((kk) => kk !== m.key) : [...dogtag, m.key])}
                className={`rounded border px-2.5 py-1 text-xs ${on ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}>{on ? "✓ " : ""}{m.label}</button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Toggle which key metrics appear on each project&apos;s dog-tag summary. Default: Remaining FY Spend · NPV · Cur-Yr Revenue.</p>
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
        <p className="mt-2 text-[10px] text-slate-500">Active: <b className="text-cyan-300">{board}</b> ({boardFull(board)}). Selecting one here relabels the gate-feedback attribution everywhere in the tool. Default is IRB (Innovation Review Board).</p>
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
                <th className="px-2 py-2 text-left">Description</th>
                {parentTier && <th className="px-2 py-2 text-left">{BIZ_TIERS.find((t) => t.key === parentTier)!.label}</th>}
                {finTier && <th className="px-2 py-2 text-right">Base Rev $M</th>}
                {finTier && <th className="px-2 py-2 text-right">Base Mgn $M</th>}
                {finTier && <th className="px-2 py-2 text-right">Growth %</th>}
                <th className="px-2 py-2 text-right">·</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-900">
                  <td className="py-1.5 pl-2 pr-3" style={{ borderLeft: `3px solid ${rowColor(r)}` }}><input value={r.code} onChange={(e) => updateRow(i, { code: e.target.value })} className={`w-24 font-mono ${inp}`} title={`BU ${buCodeOf(tier, r.code)}`} /></td>
                  <td className="px-2 py-1.5"><input value={r.label} onChange={(e) => updateRow(i, { label: e.target.value })} className={`w-full ${inp}`} /></td>
                  <td className="px-2 py-1.5"><input value={r.desc ?? ""} onChange={(e) => updateRow(i, { desc: e.target.value })} placeholder="Full description" className={`w-full min-w-[180px] ${inp}`} /></td>
                  {parentTier && (
                    <td className="px-2 py-1.5">
                      <select value={r.parent ?? ""} onChange={(e) => updateRow(i, { parent: e.target.value })} className={inp}>
                        <option value="">—</option>
                        {parentRows.map((pr) => <option key={pr.code} value={pr.code}>{pr.code}</option>)}
                      </select>
                    </td>
                  )}
                  {finTier && <td className="px-2 py-1.5 text-right"><input type="text" inputMode="decimal" value={String(r.revM ?? 0)} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && updateRow(i, { revM: +e.target.value })} className={`w-16 text-right tabular-nums ${inp}`} /></td>}
                  {finTier && <td className="px-2 py-1.5 text-right"><input type="text" inputMode="decimal" value={String(r.marginM ?? 0)} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && updateRow(i, { marginM: +e.target.value })} className={`w-16 text-right tabular-nums ${inp}`} /></td>}
                  {finTier && <td className="px-2 py-1.5 text-right"><input type="text" inputMode="decimal" value={String(r.growthPct ?? 0)} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && updateRow(i, { growthPct: +e.target.value })} className={`w-14 text-right tabular-nums ${inp}`} /></td>}
                  <td className="px-2 py-1.5 text-right"><button onClick={() => delRow(i)} className="rounded px-1.5 text-rose-400 hover:bg-rose-500/10" title="Delete">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800">Master data persists in this browser. Codes: BU 2-letter · SBU 3-letter · Alpha Group alphanumeric · Alpha Code 4-char · Product 7xxxx · Material 7xxxx-yyy. Base Rev · Base Mgn · Growth % (current-year figures) seed the Growth Model down to the Alpha Code tier — Base Rev is the grey jump-off the New/Incremental stacks build on; each BU carries a Trinity color its children inherit (left bar).</p>
      </section>
    </div>
  );
}

function Differentiators({ p, cadence = "M" }: { p: Project; cadence?: Cadence }) {
  const monthsEarly = 1.0;
  const programValueM = weightedRevM(p) * 0.35;
  const upsidePoolM = programValueM * 0.111 * monthsEarly;  // CRS-91 ~11.1%/month early
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
        <Row l="Cost of time" v={fmtPerCadence(costPerMinuteOf(p), cadence)} />
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

// Growth Model — the signature Rack & Stack chart: on-chart Scope filter, Rev/Mgn/Incremental selectors (top),
// # Years (1/3/10), Targeted Growth Rate, YoY Do-Nothing decline, Show/Hide baseline, Step 1/2/3 components.
// (Gate cadence lives on the per-project gate overview, not here.)
function GrowthModelChart({ funded, cadence = "M", hierFilter, allProjects, onScope }: { funded: Project[]; cadence?: Cadence; hierFilter: HierSel; allProjects: Project[]; onScope: (s: HierSel) => void }) {
  const [years, setYears] = useState(3);
  const vpGM = useViewport(); // G-refine — keep the selector row on ONE line (compact) on a portrait phone
  const [growthPct, setGrowthPct] = useState("3.8");
  const [declinePct, setDeclinePct] = useState("15.1");
  const [revMode] = useState<RevMode>("full"); // revenue mode fixed to full; band pills carry the view choice now
  const [showBaseline, setShowBaseline] = useState(true);
  // Growth-model band view (operator, Manager-and-above decision surface). Two composable controls:
  //   • metric: Rev (default) or Mgn         • incr (Incremental modifier): default ON
  // Operator: Rev / Mgn = FULL. The chart OPENS on Full Revenue (Rev highlighted, NOT incremental). Selecting
  // Rev/Mgn always shows FULL and clears incremental+step. "Incremental" is a SEPARATE, explicit toggle that
  // composes with the current metric (Rev→Incremental Rev, Mgn→Incremental Mgn). Step 1/2/3 is its own view.
  // Two composable axes (operator): metric = Revenue | Margin (unit) · view = Incremental | Step 1 | Step 2 |
  // Step 3 (a scrollable banner). Default = Revenue + Incremental highlighted → Incremental Rev. Selecting Rev/Mgn
  // keeps the view; selecting a view keeps the metric. "Full" revenue is the grey baseline + the Incremental
  // stack on top (see showBase). Steps carry the metric too (× margin when Mgn).
  const [metric, setMetric] = useState<"rev" | "mgn">("rev");
  const [view, setView] = useState<"incremental" | "new" | "decline" | "eol">("incremental");
  const [showBase, setShowBase] = useState(true); // grey baseline (existing) revenue bar under the stacks
  const band: "incremental" | "incmgn" | "new" | "decline" | "eol" =
    view === "incremental" ? (metric === "rev" ? "incremental" : "incmgn") : view;
  // Split-by dimension (operator): stack the bar by hierarchy child (default/highlighted), strategic pillar
  // (admin colors), or Risk (risk-weighted vs at-risk upside). Charts show FUNDED (above-line) projects only —
  // for management-and-above decision-making — so there is no separate Funded split.
  const [splitBy, setSplitBy] = useState<"hier" | "pillar" | "risk">("hier");
  // MoT time-spread (operator, global deck lens): spread scoped cost/rev/margin totals to $/min over a chosen
  // window — 91-day (SoI) / 365-day / user-defined — persisted deck-wide. Linearized (even) for less lumpiness.
  const [spreadKey, setSpreadKey] = useState<SpreadKey>(() => (lsGet("innovation-spread") as SpreadKey) || "q91");
  const [spreadCustom, setSpreadCustom] = useState("120");
  useEffect(() => { lsSet("innovation-spread", spreadKey); }, [spreadKey]);
  // ONE selector (operator): the chart reads the page-level Scope filter (ScopeFilter) — NO separate cascade.
  // `funded` arrives already scoped by hierFilter; derive the single-node scope only for the base-revenue anchor
  // + the breadcrumb (a single selection at a level → that node; 0 or many → treat as "All" at that level).
  const selBu = hierFilter.bu.length === 1 ? hierFilter.bu[0] : "All";
  const selSbu = hierFilter.sbu.length === 1 ? hierFilter.sbu[0] : "All";
  const selPg = hierFilter.pgroup.length === 1 ? hierFilter.pgroup[0] : "All";
  const scopeLabel = selPg !== "All" ? `${selBu} › ${selSbu} › ${selPg}` : selSbu !== "All" ? `${selBu} › ${selSbu}` : selBu !== "All" ? selBu : "Company";
  // Grey baseline revenue ($M) — enterable; anchored on the admin Business-Setup base, settable at BU · SBU ·
  // Alpha Group (a direct override at the selected level wins; else roll up SBU → company). One source of truth.
  const bizSetup = loadBizSetup();
  const scopeBase = (b: string, s: string, g: string) => {
    if (g && g !== "All") { const pv = bizSetup.pgroup?.find((n) => n.code === g)?.baseM; if (pv) return pv; }
    if (s && s !== "All") return bizSetup.sbu.find((n) => n.code === s)?.baseM ?? scopeBaseM(b, s);
    if (b && b !== "All") { const bv = bizSetup.bu?.find((n) => n.code === b)?.baseM; if (bv) return bv; const v = bizSetup.sbu.filter((n) => n.parent === b).reduce((a, n) => a + (n.baseM ?? 0), 0); return v || scopeBaseM(b, s); }
    const all = bizSetup.sbu.reduce((a, n) => a + (n.baseM ?? 0), 0); return all || companyBaseM();
  };
  // H39: the baseline seeds from the tier-seeded base-year Revenue (revM) when present, else the do-nothing base;
  // the target line's growth seeds from the tier Growth Rate (growthPct); Margin $ reads from the tier seed.
  const scopeRev = scopeSeed(bizSetup, "revM", selBu, selSbu, selPg);
  const scopeGrowth = scopeSeed(bizSetup, "growthPct", selBu, selSbu, selPg);
  const scopeMargin = scopeSeed(bizSetup, "marginM", selBu, selSbu, selPg);
  const [baseStr, setBaseStr] = useState(String(companyBaseM()));
  useEffect(() => { setBaseStr(String(scopeRev > 0 ? scopeRev : scopeBase(selBu, selSbu, selPg))); }, [selBu, selSbu, selPg]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (scopeGrowth > 0) setGrowthPct(String(scopeGrowth)); }, [selBu, selSbu, selPg]); // eslint-disable-line react-hooks/exhaustive-deps
  const [hover, setHover] = useState<number | null>(null);
  // F3 — tap-to-pin (mobile-friendly): click a bar or the target dot → pin its exact figure in a chip below.
  const [pin, setPin] = useState<{ i: number; kind: "bar" | "target" } | null>(null);
  const scoped = funded; // already scoped by the page-level ScopeFilter (hierFilter)

  const growth = (parseFloat(growthPct) || 0) / 100;
  const decline = (parseFloat(declinePct) || 0) / 100;
  const baseM = parseFloat(baseStr) || 0;
  // CAGR visualization needs the base year PLUS the horizon: a 1-yr CAGR spans 2 columns (2026→2027),
  // 3-yr → 4, 10-yr → 11. So render years+1 columns; CAGR below divides by (rows.length−1) = the horizon.
  const rows = growthModel(scoped, { years: years + 1, growth, decline, revMode, baseYear: 2026, baseOverrideM: baseM });
  const W = 720, H = 240, L = 34, B = 26, T = 26, R = 10;
  // Operator chart math: Incremental Rev = Step 1 (New) − Step 2 (Decline) + Step 3 (EOL). Incremental Mgn =
  // Incremental Rev × the blended gross margin (single source = execOf().marginPct across the funded set).
  const marginFrac = blendedMarginFrac(funded);
  // Bands: Full Revenue / Margin $ (grow at the tier CAGR — always POSITIVE, operator), the growth-above-base-year
  // Incremental Rev / Incremental Mgn (POSITIVE by construction), and the do-nothing Step 1/2/3 components.
  const BAND = { incremental: { key: "incremental", label: "Incremental Rev", color: "#fbbf24" }, incmgn: { key: "incmgn", label: "Incremental Mgn", color: "#f7b955" }, rev: { key: "rev", label: "Full Revenue", color: "#38bdf8" }, mgn: { key: "mgn", label: "Margin $", color: "#34d399" }, new: { key: "new", label: "Step 1 · New (Next-Gen)", color: "#34d399" }, decline: { key: "decline", label: "Step 2 · Decline if unfunded", color: "#fb7185" }, eol: { key: "eol", label: "Step 3 · EOL (Prior-Gen)", color: "#a78bfa" } } as const;
  // Drill-down stacking: split the scope's bar into its CHILD nodes — Company→BUs, BU→SBUs, SBU→Alpha Codes (or
  // strategic pillars in pillar mode). Each segment GROWS from its seeded base-year Revenue at its tier CAGR, so
  // Full Revenue / Incremental / Margin are all positive; Step 1/2/3 still come from the do-nothing growth model.
  // H1/H6 — drill ladder: Company→BU → BU→SBU → SBU→Alpha Group → Alpha Group→Project (operator). Scope at
  // SBU shows Alpha Groups (not Alpha Code); scope at a single Alpha Group shows individual projects.
  const childLevel: HierKey | "project" = selBu === "All" ? "bu" : selSbu === "All" ? "sbu" : selPg === "All" ? "pgroup" : "project";
  // Membership includes altGroups (H5): a project belongs to its primary pgroup AND any additional Alpha Groups
  // within the same SBU, so scoping to any of them lists it (portfolio $ still counted once via primary pgroup).
  // When splitting BY Alpha Group, a shared project sits under the scoped group if that group is one of its
  // memberships (else its primary) — so an SBU split shows it once, under the group the viewer is looking at.
  const codeOf = (p: Project): string => {
    if (childLevel === "project") return p.id;
    if (childLevel !== "pgroup") return hierOf(p)[childLevel];
    const mine = groupsOf(p);
    const scoped = hierFilter.pgroup.filter((g) => mine.includes(g));
    return scoped[0] ?? hierOf(p).pgroup;
  };
  // H6 — project-level palette: 13 SoI-Trinity-derived colors, then HSL-rotate (golden angle) beyond 13.
  const TRINITY13 = ["#22d3ee", "#a78bfa", "#f7b955", "#34d399", "#fb7185", "#38bdf8", "#c084fc", "#fbbf24", "#4ade80", "#f472b6", "#2dd4bf", "#818cf8", "#fb923c"];
  const projColor = (i: number): string => (i < TRINITY13.length ? TRINITY13[i] : `hsl(${(i * 137.508) % 360}, 68%, 62%)`);
  const pillarDefs = loadPillars();
  const pillarKey = (p: Project) => metaOf(p).initiative;
  const segLabel = splitBy === "risk" ? "Risk" : splitBy === "pillar" ? "Pillar" : childLevel === "bu" ? "BU" : childLevel === "sbu" ? "SBU" : childLevel === "pgroup" ? "Alpha Group" : "Project";
  const scopeIncrAll = scoped.reduce((s, p) => s + incrementalRevM(p), 0) || 1;
  const tierNodes: BizNode[] = (childLevel === "project" || childLevel === "pgroup") ? [] : (bizSetup[childLevel as BizTier] ?? []);
  // Blended risk weight (tech×comm success) over the FUNDED scope — green risk-weighted share; upside = 1 − it.
  const riskFrac = (() => { const inc = scoped.reduce((s, p) => s + incrementalRevM(p), 0); return inc > 0 ? scoped.reduce((s, p) => s + weightedRevM(p), 0) / inc : 0.5; })();
  // ── ONE canonical per-year revenue for the FUNDED scope, from the hierarchy tier seeds (H38/H39 single source
  //    of truth). EVERY split (Hierarchy · Pillar · Risk) re-slices THIS same series, so all three show identical
  //    yearly totals — the split only changes how the one bar is partitioned, never its height.
  const childCodes = Array.from(new Set(scoped.map(codeOf))).sort();
  const nodeInfo = childCodes.map((code) => {
    const sp = scoped.filter((p) => codeOf(p) === code);
    const share = sp.reduce((a, p) => a + incrementalRevM(p), 0) / scopeIncrAll;
    const node = tierNodes.find((n) => n.code === code);
    return { code, sp, share, seed: node?.revM ?? scopeRev * share, g: (node?.growthPct ?? scopeGrowth) / 100 };
  });
  const scopeRevSeries = rows.map((_, i) => nodeInfo.reduce((s, n) => s + n.seed * Math.pow(1 + n.g, i), 0));
  // Each segment carries its own per-year revenue series `revAt` (+ base-year `base` for Incremental). Hierarchy
  // uses the true per-node tier compounding; Pillar / Risk take a proportional slice of the ONE canonical series,
  // so every split's stack sums to the same total as Hierarchy for every year.
  // `gm` carries the do-nothing components (Step 1 New · Step 2 Decline · Step 3 EOL · Incremental = 1−2+3).
  // Hierarchy / Pillar segments own a real project subset, so their gm sums to the scope total (gmScale 1). Risk
  // segments aren't a project partition — they carry the whole scope's gm scaled by their fraction, so the two
  // risk slices still sum to the scope total.
  type Seg = { code: string; color: string; revAt: (i: number) => number; base: number; gm: (typeof rows); gmScale?: number };
  const gmOpts = (over: number) => ({ years: years + 1, growth, decline, revMode, baseYear: 2026, baseOverrideM: over } as const);
  const scopeGm = growthModel(scoped, gmOpts(baseM));
  const segments: Seg[] = splitBy === "risk"
    ? ([["Risk-weighted", "#34d399", riskFrac], ["At-risk upside", "#fbbf24", 1 - riskFrac]] as const).map(([code, color, frac]): Seg => ({
        code, color, revAt: (i: number) => frac * scopeRevSeries[i], base: frac * scopeRevSeries[0], gm: scopeGm, gmScale: frac,
      }))
    : splitBy === "pillar"
    ? Array.from(new Set(scoped.map(pillarKey))).sort().map((code): Seg => {
        const sp = scoped.filter((p) => pillarKey(p) === code);
        const share = sp.reduce((a, p) => a + incrementalRevM(p), 0) / scopeIncrAll;
        return { code, color: pillarColorOf(code, pillarDefs), revAt: (i: number) => share * scopeRevSeries[i], base: share * scopeRevSeries[0], gm: growthModel(sp, gmOpts(baseM * share)) };
      })
    : nodeInfo.map((n, idx): Seg => ({
        code: n.code, color: (childLevel === "project" || childLevel === "pgroup") ? projColor(idx) : segColorOf(childLevel, n.code, idx),
        revAt: (i: number) => n.seed * Math.pow(1 + n.g, i), base: n.seed, gm: growthModel(n.sp, gmOpts(baseM * n.share)),
      }));
  // Value of a segment in a given year for the active band. Incremental and the Step 1/2/3 components come from
  // the do-nothing growth model, so Incremental == Step1 − Step2 + Step3 exactly. Steps carry the metric too:
  // × blended margin when Mgn is selected.
  const segVal = (seg: Seg, i: number) => {
    const gs = seg.gmScale ?? 1;
    const mul = metric === "mgn" ? marginFrac : 1;   // Step 1/2/3 shown in the selected unit (Rev or Mgn)
    return band === "incremental" ? seg.gm[i].incremental * gs : band === "incmgn" ? seg.gm[i].incremental * gs * marginFrac
      : band === "new" ? seg.gm[i].newRev * gs * mul : band === "decline" ? -seg.gm[i].declineRev * gs * mul : seg.gm[i].eolRev * gs * mul;
  };
  const stackPos = rows.map((_, i) => segments.reduce((s, g) => s + Math.max(0, segVal(g, i)), 0));
  const stackNeg = rows.map((_, i) => segments.reduce((s, g) => s + Math.min(0, segVal(g, i)), 0));
  // Grey BASELINE (existing) revenue — the do-nothing base eroding YoY (operator's 142→~55 drop). Shown via the
  // Base Revenue toggle, only in the Incremental view; the New/Incremental stacks build ON TOP of it. In Mgn unit
  // → × blended margin. Off → stacks sit on zero, no grey.
  const baselineShown = showBase && view === "incremental";
  const baseSeries = rows.map((_, i) => (baselineShown ? rows[i].doNothing * (metric === "mgn" ? marginFrac : 1) : 0));
  // Growth-target line: anchors at the base-year BASELINE REV (operator: "target starts at Baseline Rev, not the
  // top of Full Rev") and grows at the target CAGR. In the Mgn unit → × blended margin. A perfect portfolio lands
  // this line BETWEEN the top of Risk-weighted (green) and the bottom of At-risk upside (orange).
  const targetAnchor = (metric === "mgn" ? baseM * marginFrac : baseM) || Math.max(1, baseM);
  const targetLine = rows.map((_, i) => targetAnchor * Math.pow(1 + growth, i));
  // Target (Growth) line only in the Incremental view; the "Growth Target" legend is its on/off toggle.
  const targetApplies = view === "incremental";
  const showTarget = showBaseline && targetApplies;
  // Y-axis auto-adjusts to the bars (baseline + stack) when the target line is hidden — otherwise a steep target
  // would flatten the bars. Only include the target line in the max when it's actually drawn.
  const max = Math.max(...(showTarget ? targetLine : []), ...stackPos.map((v, i) => v + baseSeries[i]), 1) * 1.1;
  const minV = Math.min(0, ...stackNeg) * 1.1;
  const pw = (W - L - R) / rows.length;
  const y = (v: number) => H - B - ((v - minV) / (max - minV)) * (H - B - T);
  const cagr = ((Math.pow((rows[rows.length - 1]?.target || 1) / (rows[0]?.target || 1), 1 / Math.max(1, rows.length - 1)) - 1) * 100).toFixed(1);

  const selStyle = "rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-500";
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Growth Model · Do-Nothing Scenario with Portfolio NPIs</h3>
        <span className="text-[11px] text-slate-500">Target CAGR ~{cagr}% · Margin ${Math.round(scopeMargin)}M · {scoped.length} project{scoped.length === 1 ? "" : "s"}</span>
      </div>

      {/* Per-BU CAGR banner (operator, upper-right scrollable) — target (seeded Growth %) vs actual (rollup). */}
      <div className="mt-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-[10px]">
        <span className="shrink-0 font-semibold uppercase tracking-wider text-slate-500">CAGR</span>
        {(["DS", "MS", "AP"] as const).map((b) => {
          const tgt = scopeSeed(bizSetup, "growthPct", b, "All", "All");
          const act = buCagrPct(funded, b, { years: 10 });
          const onTrack = act >= tgt - 3;
          return (
            <span key={b} className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5" style={{ borderColor: `${BU_COLOR[b]}55` }}>
              <i className="inline-block h-2 w-2 rounded-sm" style={{ background: BU_COLOR[b] }} />
              <b className="font-mono" style={{ color: BU_COLOR[b] }}>{b}</b>
              <span className="text-slate-400">Tgt {Math.round(tgt)}%</span>
              <span className={onTrack ? "text-emerald-300" : "text-rose-300"}>Act {Math.round(act)}%</span>
            </span>
          );
        })}
      </div>

      {/* Scope selector ON the chart (operator) — the ONE standard ScopeFilter, cross-filtering the whole view.
          G-refine — on a portrait phone the selectors stay on ONE (slightly smaller) line, scrolling horizontally
          instead of wrapping (best-practice responsive: no clipped/stacked controls). */}
      <div className={`mt-2 flex items-center text-slate-400 ${vpGM.isPhone && vpGM.orientation === "portrait" ? "flex-nowrap gap-1.5 overflow-x-auto whitespace-nowrap text-[10px] [&_button]:px-2 [&_button]:py-0.5" : "flex-wrap gap-3 text-[11px]"}`}>
        <ScopeFilter projects={allProjects} sel={hierFilter} onChange={onScope} />
        <span className="rounded-md border border-slate-700 bg-[#0b0f14] px-2 py-1">Scope: <b className="font-mono text-cyan-300">{scopeLabel}</b></span>
        {/* Split-by: hierarchy child (default) · strategic pillar (admin colors) · Risk (risk-weighted vs upside).
            Funded-only — the chart counts above-line projects only, so there is no separate Funded split. */}
        <div className="flex overflow-hidden rounded-md border border-slate-700">
          {([["hier", "Hierarchy"], ["pillar", "Pillar"], ["risk", "Risk"]] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => setSplitBy(k)} aria-pressed={splitBy === k}
              className={`px-2.5 py-1 ${splitBy === k ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
        {/* Financial METRIC (unit) — Rev · Mgn — right of the split toggle (operator IMG_8129). Composable: it
            keeps the current view (Incremental/Step). Default Revenue highlighted. */}
        <div className="flex overflow-hidden rounded-md border border-slate-700">
          {([["rev", "Rev"], ["mgn", "Mgn"]] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => setMetric(k)} aria-pressed={metric === k}
              className={`px-2.5 py-1 ${metric === k ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
          ))}
        </div>
        {/* # Years */}
        <div className="ml-auto flex overflow-hidden rounded-md border border-slate-700">
          {[1, 3, 10].map((yv) => (
            <button key={yv} onClick={() => setYears(yv)}
              className={`px-2.5 py-1 font-mono ${years === yv ? "bg-cyan-500 text-[#06202a]" : "text-slate-300 hover:bg-slate-800"}`}>{yv}yr</button>
          ))}
        </div>
      </div>

      {/* Pillar color key is the single stacked-segment legend BELOW the chart (operator: no duplicate on-map key). */}
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" preserveAspectRatio="xMidYMid meet" style={{ height: "auto" }}>
        {/* Left axis = financials ($M); right axis = Growth (the target line, base-year-anchored). */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f} fontFamily="ui-monospace, monospace" fontSize="8">
            <line x1={L} y1={y(max * f)} x2={W - R} y2={y(max * f)} stroke="rgba(148,163,184,.12)" />
            <text x={L - 3} y={y(max * f) + 3} textAnchor="end" fill="#64748b">${Math.round(max * f)}</text>
          </g>
        ))}
        <text x={4} y={T - 8} fill="#64748b" fontSize="8" fontFamily="ui-monospace, monospace">$M</text>
        <text x={W - R + 2} y={T - 8} fill="#94a3b8" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="end">Growth →</text>
        <line x1={L} y1={y(0)} x2={W - R} y2={y(0)} stroke="rgba(148,163,184,.35)" />
        {rows.map((r, i) => {
          const x = L + i * pw + pw * 0.18, bw = pw * 0.64;
          const on = hover === i;
          const dim = hover != null && !on ? 0.35 : 1;
          const cx = x + bw / 2;
          const y0 = y(0);
          const net = stackPos[i] + stackNeg[i]; // net of positive + negative segments (= scope band value)
          const bl = baseSeries[i];              // grey baseline (0 unless shown)
          const topY = y(Math.max(0.0001, bl + stackPos[i])); // label above the baseline + stack
          const barLabel = Math.round(bl + net); // baseline + incremental = full revenue when baseline shown
          // Grey baseline first; then stack each child segment ON TOP of it (positives up from baseline,
          // negatives down from 0).
          let posAcc = bl, negAcc = 0;
          return (
            <g key={r.year} fontFamily="ui-monospace, monospace" fontSize="9" opacity={dim}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}
              onClick={() => setPin((prev) => (prev && prev.i === i && prev.kind === "bar" ? null : { i, kind: "bar" }))}>
              <title>{r.year} — {baselineShown ? `Base ${Math.round(bl)} + ` : ""}{BAND[band].label}: {Math.round(net)}{baselineShown ? ` = ${barLabel}` : ""} · {segments.map((g) => `${g.code} ${Math.round(segVal(g, i))}`).join(" · ")} · Target Rev ${Math.round(targetLine[i])}M · growth {growthPct}%/yr</title>
              <rect x={x} y={T} width={bw} height={H - B - T} fill="transparent" />
              {bl > 0 && <rect x={x} y={Math.min(y(0), y(bl))} width={bw} height={Math.max(0, Math.abs(y(0) - y(bl)))} fill="#475569" rx={1} opacity={on ? 0.7 : 0.5} stroke="#0e141b" strokeWidth={0.5} />}
              {segments.map((g) => {
                const v = segVal(g, i); if (!v) return null;
                const from = v >= 0 ? posAcc : negAcc; const to = from + v;
                if (v >= 0) posAcc = to; else negAcc = to;
                const yA = y(from), yB = y(to);
                return <rect key={g.code} x={x} y={Math.min(yA, yB)} width={bw} height={Math.max(0, Math.abs(yA - yB))} fill={g.color} rx={1} opacity={on ? 1 : 0.9} stroke="#0e141b" strokeWidth={0.5} />;
              })}
              <text x={cx} y={H - B + 12} textAnchor="middle" fill={on ? "#e2e8f0" : "#64748b"}>{r.year}</text>
              <text x={cx} y={(net >= 0 ? topY : y0 + 12) - 4} textAnchor="middle" fill="#e2e8f0">{barLabel}</text>
            </g>
          );
        })}
        {showTarget && <polyline points={rows.map((_, i) => `${L + i * pw + pw * 0.5},${y(targetLine[i])}`).join(" ")} fill="none" stroke="#e2e8f0" strokeWidth="1.4" />}
        {showTarget && rows.map((r, i) => (
          <g key={r.year} style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); setPin((prev) => (prev && prev.i === i && prev.kind === "target" ? null : { i, kind: "target" })); }}>
            {/* larger transparent hit area so the target dot is tappable on phones */}
            <circle cx={L + i * pw + pw * 0.5} cy={y(targetLine[i])} r="9" fill="transparent" />
            <circle cx={L + i * pw + pw * 0.5} cy={y(targetLine[i])} r={pin && pin.i === i && pin.kind === "target" ? 4 : 2.6} fill="#e2e8f0" stroke={pin && pin.i === i && pin.kind === "target" ? "#22d3ee" : "none"} strokeWidth="1.4" />
          </g>
        ))}
      </svg>
      {/* F3 — pinned figure chip: the exact $ value for the clicked bar or target dot (tap again to dismiss). */}
      {pin && (() => {
        const i = pin.i; const r = rows[i]; if (!r) return null;
        const net = stackPos[i] + stackNeg[i]; const bl = baseSeries[i]; const barLabel = Math.round(bl + net);
        return (
          <div className="mt-1.5 flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px]">
            <span className="font-mono font-semibold text-cyan-200">{r.year}</span>
            {pin.kind === "target"
              ? <span className="text-slate-200">Target {metric === "mgn" ? "Margin" : "Rev"} <b className="tabular-nums text-cyan-100">${Math.round(targetLine[i]).toLocaleString()}M</b> · growth {growthPct}%/yr</span>
              : <span className="text-slate-200">{baselineShown ? <>Full <b className="tabular-nums text-cyan-100">${barLabel.toLocaleString()}M</b> · {BAND[band].label} <b className="tabular-nums text-slate-100">${Math.round(net).toLocaleString()}M</b></> : <><span>{BAND[band].label}</span> <b className="tabular-nums text-cyan-100">${Math.round(net).toLocaleString()}M</b></>}{showTarget ? <> · vs Target ${Math.round(targetLine[i]).toLocaleString()}M</> : null}</span>}
            <button onClick={() => setPin(null)} className="ml-auto rounded px-1 text-[12px] leading-none text-slate-400 hover:text-cyan-300" aria-label="Dismiss">✕</button>
          </div>
        );
      })()}

      {/* Stacked-segment legend — the child nodes of the current scope (Company→BUs, BU→SBUs, SBU→Alpha Codes). */}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-slate-500">{segLabel}</span>
        {segments.length ? segments.map((g) => (
          <span key={g.code} className="inline-flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: g.color }} /><span className="font-mono">{g.code}</span></span>
        )) : <span className="italic text-slate-600">no projects in scope</span>}
      </div>

      {/* VIEW banner (operator) — scrollable left→right: Incremental · Step 1 · Step 2 · Step 3. Default
          Incremental. Composes with the Rev/Mgn metric. Then the Base Revenue (grey baseline) + Growth Target
          on/off toggles. */}
      <div className="mt-1 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 text-[10px]">
        {([["incremental", "Incremental", BAND.incremental.color], ["new", BAND.new.label, BAND.new.color], ["decline", BAND.decline.label, BAND.decline.color], ["eol", BAND.eol.label, BAND.eol.color]] as const).map(([k, lbl, color]) => (
          <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
            className={`shrink-0 rounded border px-2 py-0.5 ${view === k ? "border-transparent text-[#06202a] font-semibold" : "border-slate-700 text-slate-400 hover:bg-slate-800"}`}
            style={view === k ? { background: color } : undefined}>{lbl}</button>
        ))}
        {/* Base Revenue (grey baseline) toggle — only meaningful in the Incremental view. */}
        <button type="button" onClick={() => setShowBase((v) => !v)} disabled={view !== "incremental"} aria-pressed={showBase && view === "incremental"}
          title={view === "incremental" ? "Toggle the grey base (existing) revenue" : "Base revenue shows in the Incremental view"}
          className={`ml-1 inline-flex shrink-0 items-center ${view === "incremental" ? "text-slate-400 hover:text-slate-200" : "cursor-not-allowed text-slate-600"}`}>
          <i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#475569", opacity: baselineShown ? 1 : 0.3 }} />Base Revenue
        </button>
        {/* Growth-target on/off toggle — the white bullet + text IS the toggle; active only in the Incremental view. */}
        <button type="button" onClick={() => setShowBaseline((v) => !v)} disabled={!targetApplies} aria-pressed={showTarget}
          title={targetApplies ? "Toggle the growth target line" : "Growth target applies only in the Incremental view"}
          className={`ml-1 inline-flex shrink-0 items-center ${targetApplies ? "text-slate-400 hover:text-slate-200" : "cursor-not-allowed text-slate-600"}`}>
          <i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#e2e8f0", opacity: showTarget ? 1 : 0.3 }} />Growth Target
        </button>
      </div>

      {/* Per-node financial breakdown (operator: "show me the calc for each BU") — FUNDED only, final displayed
          year: Step 1 − Step 2 + Step 3 = Incremental Rev, × each node's blended margin = Incremental Mgn, with
          a scope TOTAL = Σ nodes. Makes the Incremental band auditable and reconciles to the bars. */}
      {(() => {
        const li = rows.length - 1;
        const yr = rows[li]?.year;
        // Round the ATOMIC components first, then derive Incremental = S1 − S2 + S3 from the rounded parts, and
        // the TOTAL row as the column-wise sum of the rounded node values — so every displayed row AND column
        // reconciles exactly (no "51 − 2 + 1 shows 50 but Incr says 49" rounding artifact).
        const rowsBk = nodeInfo.map((n) => {
          const g = growthModel(n.sp, gmOpts(baseM * n.share))[li] ?? { newRev: 0, declineRev: 0, eolRev: 0, incremental: 0 };
          const m = blendedMarginFrac(n.sp);
          const s1 = Math.round(g.newRev), s2 = Math.round(g.declineRev), s3 = Math.round(g.eolRev);
          const inc = s1 - s2 + s3;
          const base = Math.round(n.seed);        // Base Rev jump-off (current-year, held flat) for this node
          return { code: n.code, base, full: base + inc, s1, s2, s3, inc, mgn: Math.round(inc * m) };
        });
        const tot = rowsBk.reduce((a, r) => ({ base: a.base + r.base, full: a.full + r.full, s1: a.s1 + r.s1, s2: a.s2 + r.s2, s3: a.s3 + r.s3, inc: a.inc + r.inc, mgn: a.mgn + r.mgn }), { base: 0, full: 0, s1: 0, s2: 0, s3: 0, inc: 0, mgn: 0 });
        const segName = childLevel === "bu" ? "BU" : childLevel === "sbu" ? "SBU" : "Alpha";
        const n0 = (v: number) => v;
        return (
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-[#0b0f14]">
            {/* ⚠ "FULL REV" IS RETIRED HERE AND THE OPERATOR IS RIGHT ABOUT WHY. Their words: "Total Rev is
                Grey, plus Green + Orange (risk to get to Full Rev) — it's misleading to call [the] total
                chart of [the] final year Full Rev." The column is Base + Incremental, and the incremental
                half is the AT-RISK half the green/orange bands are about. Calling it "Full" asserts it is
                already earned. "Total" states the arithmetic without asserting the outcome. Grey, because
                it is a SUM of the coloured columns beside it, not a fourth quantity competing with them. */}
            <div className="px-3 pt-2 text-[10px] uppercase tracking-wider text-slate-500">Funded incremental · {yr} · {baselineShown ? "Base Rev + " : ""}Step 1 − Step 2 + Step 3 = Incremental Rev{baselineShown ? " · Base + Incr = Total Rev" : ""} · × margin = Incremental Mgn ($M)</div>
            <table className="w-full text-[11px] tabular-nums">
              <thead><tr className="text-slate-500">
                <th className="px-3 py-1 text-left font-medium">{segName}</th>
                {baselineShown && <th className="px-2 py-1 text-right font-medium text-slate-400">Base Rev</th>}
                <th className="px-2 py-1 text-right font-medium text-emerald-300">Step 1 New</th>
                <th className="px-2 py-1 text-right font-medium text-rose-300">− Step 2 Decline</th>
                <th className="px-2 py-1 text-right font-medium text-violet-300">+ Step 3 EOL</th>
                {/* ORDER, per the operator: = Incr Rev · Incr Mgn · Total Rev. The two INCREMENTAL figures
                    now sit together — they are the same story in dollars and margin — and the SUM lands
                    last, where a total belongs. */}
                <th className="px-2 py-1 text-right font-medium text-amber-300">= Incr Rev</th>
                <th className="px-2 py-1 text-right font-medium text-amber-200">Incr Mgn</th>
                {baselineShown && <th className="px-3 py-1 text-right font-medium text-slate-300">Total Rev</th>}
              </tr></thead>
              <tbody>
                {rowsBk.map((r) => (
                  <tr key={r.code} className="border-t border-slate-900">
                    <td className="px-3 py-1 font-mono text-slate-200">{r.code}</td>
                    {baselineShown && <td className="px-2 py-1 text-right text-slate-400">${n0(r.base)}</td>}
                    <td className="px-2 py-1 text-right text-slate-300">${n0(r.s1)}</td>
                    <td className="px-2 py-1 text-right text-slate-300">${n0(r.s2)}</td>
                    <td className="px-2 py-1 text-right text-slate-300">${n0(r.s3)}</td>
                    <td className="px-2 py-1 text-right font-semibold text-amber-300">${n0(r.inc)}</td>
                    <td className="px-2 py-1 text-right text-amber-200">${n0(r.mgn)}</td>
                    {baselineShown && <td className="px-3 py-1 text-right font-semibold text-slate-200">${n0(r.full)}</td>}
                  </tr>
                ))}
                <tr className="border-t border-slate-700 font-semibold">
                  <td className="px-3 py-1 text-cyan-300">{scopeLabel}</td>
                  {baselineShown && <td className="px-2 py-1 text-right text-slate-300">${n0(tot.base)}</td>}
                  <td className="px-2 py-1 text-right text-emerald-300">${n0(tot.s1)}</td>
                  <td className="px-2 py-1 text-right text-rose-300">${n0(tot.s2)}</td>
                  <td className="px-2 py-1 text-right text-violet-300">${n0(tot.s3)}</td>
                  <td className="px-2 py-1 text-right text-amber-300">${n0(tot.inc)}</td>
                  <td className="px-2 py-1 text-right text-amber-200">${n0(tot.mgn)}</td>
                  {baselineShown && <td className="px-3 py-1 text-right text-slate-200">${n0(tot.full)}</td>}
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* MoT time-spread (operator) — scoped cost/rev/margin totals spread to $/min over 91-day / 365-day / custom */}
      {(() => {
        const days = spreadDaysOf(spreadKey, parseInt(spreadCustom, 10) || 120);
        const costUsd = scoped.reduce((s, p) => s + p.nreK * 1000, 0);          // total NRE (cost)
        const revUsd = scoped.reduce((s, p) => s + (p.fullRev10yM * 1e6) / 10, 0); // annualized revenue
        const marginUsd = scoped.reduce((s, p) => s + (p.fullRev10yM * 1e6 / 10) * (execOf(p).marginPct / 100), 0);
        const perMin = (v: number) => { const m = spreadPerMin(v, days); return m >= 1000 ? `$${(m / 1000).toFixed(1)}k/min` : `$${m.toFixed(2)}/min`; };
        return (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-800 bg-[#0b0f14] px-2.5 py-1.5 text-[10px] text-slate-400">
            <span className="font-semibold tracking-wider text-cyan-400">MoT $/min</span>
            <div className="flex overflow-hidden rounded border border-slate-700">
              {SPREAD_BASES.map((b) => <button key={b.key} onClick={() => setSpreadKey(b.key)} aria-pressed={spreadKey === b.key} className={`px-1.5 py-0.5 ${spreadKey === b.key ? "bg-cyan-500 font-semibold text-[#06202a]" : "hover:bg-slate-800"}`}>{b.days}d</button>)}
              <button onClick={() => setSpreadKey("custom")} aria-pressed={spreadKey === "custom"} className={`px-1.5 py-0.5 ${spreadKey === "custom" ? "bg-cyan-500 font-semibold text-[#06202a]" : "hover:bg-slate-800"}`}>custom</button>
            </div>
            {spreadKey === "custom" && <input type="text" inputMode="numeric" value={spreadCustom} onChange={(e) => /^\d*$/.test(e.target.value) && setSpreadCustom(e.target.value)} className={`w-14 ${selStyle} tabular-nums`} aria-label="Custom days" />}
            <span>Cost <b className="text-rose-300 tabular-nums">{perMin(costUsd)}</b></span>
            <span>Rev <b className="text-emerald-300 tabular-nums">{perMin(revUsd)}</b></span>
            <span>Margin <b className="text-amber-300 tabular-nums">{perMin(marginUsd)}</b></span>
            <span className="text-slate-600">· linearized over {days}d</span>
          </div>
        );
      })()}

      {/* Adjustable rates + revenue options (FLIR control parity) */}
      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
        <label>Base revenue $M ({selBu === "All" ? "Company" : selBu})
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
        {/* "Show target line" checkbox removed — the toggle now lives on the "Growth target" legend above. */}
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

// Pipeline by Gate — gate-spend columns + a PRIORITY-ORDERED project list, maximizable to full
// screen. Clicking a project shows its dog-tag (in max mode) and opens the full Project details.
function PipelineByGate({ projects, funded, showUnfunded, onShowUnfunded, onSelect }: { projects: Project[]; funded: Project[]; showUnfunded: boolean; onShowUnfunded: (v: boolean) => void; onSelect: (id: string) => void }) {
  const { t } = useLexicon();
  const [maxed, setMaxed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  // H4 — gate filter: click gate columns to show ONLY those gates' dog-tags + project list; none selected = all.
  const [selGates, setSelGates] = useState<Set<string>>(new Set());
  const gateOn = (g: string) => selGates.size === 0 || selGates.has(g);
  const toggleGate = (g: string) => setSelGates((prev) => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });
  const fundedIds = useMemo(() => new Set(funded.map((p) => p.id)), [funded]);
  // THE FUNDED FIGURE NEVER CHANGES MEANING. `pipe` is always the funded-only roll-up, so the $ and the
  // count a board reads are byte-identical whether the toggle is on or off. Revealing unfunded work adds a
  // SEPARATE dim segment and a "(+n unfunded)" suffix — it never folds into the funded ask.
  const pipe = useMemo(() => pipelineByGate(funded), [funded]);
  const pipeUn = useMemo(() => pipelineByGate(projects.filter((p) => !fundedIds.has(p.id))), [projects, fundedIds]);
  const unByGate = useMemo(() => new Map(pipeUn.map((g) => [g.gate, g])), [pipeUn]);
  // The bar scale spans whatever is on screen, so the funded bars keep their proportions in both states.
  const maxGateSpend = Math.max(...pipe.map((g, i) => g.spendK + (showUnfunded ? pipeUn[i].spendK : 0)), 1);
  const kM = k; // $K → $M — single source (was a redundant re-impl of the global `k`)
  const shown = useMemo(() => (showUnfunded ? projects : projects.filter((p) => fundedIds.has(p.id))), [projects, fundedIds, showUnfunded]);
  const pickedP = picked ? projects.find((p) => p.id === picked) : null;
  // The rendered priority list, hoisted out of its own `.map` so the column-major row count below can be
  // derived from the SAME array that renders. Deriving it from `shown` would over-count the moment a gate
  // chip is selected, and the list would silently grow a third column.
  const pri = useMemo(() => shown.filter((p) => gateOn(p.gate)), [shown, selGates]);   // eslint-disable-line react-hooks/exhaustive-deps
  // In max mode a click previews the dog-tag; otherwise it opens the Project details.
  const clickProject = (id: string) => (maxed ? setPicked(id) : onSelect(id));

  const body = (
    <>
      {/* G5 — 7 gate columns, each carrying ITS project dog-tag chips underneath (CONCEPT tags under the Concept
          column, etc.). Horizontal-scroll wrapper so on a phone the columns never render off-screen (portrait). */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="grid min-w-[680px] grid-cols-7 gap-2">
          {pipe.map((g) => {
            const gateProjects = shown.filter((p) => p.gate === g.gate);
            const un = unByGate.get(g.gate);
            const active = gateOn(g.gate); const sel = selGates.has(g.gate);
            return (
              <div key={g.gate} className={`flex flex-col rounded-lg border bg-[#0b0f14] p-2 text-center transition ${sel ? "border-cyan-500 ring-1 ring-cyan-500/50" : "border-slate-800"} ${active ? "" : "opacity-40"}`}>
                <button onClick={() => toggleGate(g.gate)} title={sel ? "Click to deselect" : "Click to show only this gate"} className="flex flex-col items-center hover:opacity-90">
                  <div className={`text-[11px] font-mono ${sel ? "text-cyan-300 font-semibold" : "text-slate-300"}`}>{g.gate}</div>
                  <div className="mb-1.5 max-w-full truncate text-[9px] text-slate-500" title={g.stage}>{g.stage}</div>
                  <div className="flex h-16 w-full items-end justify-center">
                    <div className="flex w-6 flex-col justify-end">
                      {/* unfunded rides ON TOP as its own dim segment — never merged into the funded bar */}
                      {showUnfunded && !!un?.spendK && <div className="rounded-t" title={`${kM(un.spendK)} unfunded`} style={{ height: `${Math.max(2, (un.spendK / maxGateSpend) * 60)}px`, background: "#64748b", opacity: 0.45 }} />}
                      <div className={showUnfunded && un?.spendK ? "" : "rounded-t"} style={{ height: `${Math.max(4, (g.spendK / maxGateSpend) * 60)}px`, background: sel ? "#22d3ee" : "#19c8cf", opacity: 0.85 }} />
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] tabular-nums text-slate-200">{kM(g.spendK)}</div>
                  <div className="text-[10px] text-slate-500">{g.count} proj{showUnfunded && un?.count ? <span className="text-slate-600"> (+{un.count} {t("innovation.pipeline.unfundedShort")})</span> : null}</div>
                </button>
                {/* dog-tag chips for THIS gate — only when the gate is active (H4 filter); size unchanged */}
                <div className="mt-1.5 flex flex-col gap-1 border-t border-slate-800/70 pt-1.5">
                  {!active ? <span className="text-[9px] italic text-slate-600">·</span>
                    : gateProjects.length === 0
                    ? <span className="text-[9px] italic text-slate-600">—</span>
                    : gateProjects.map((p) => (
                        <button key={p.id} onClick={() => clickProject(p.id)}
                          className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold text-[#06202a] hover:opacity-90 ${picked === p.id ? "ring-2 ring-white/70" : ""} ${fundedIds.has(p.id) ? "" : "opacity-60"}`}
                          style={{ background: DEV_TYPE[devTypeOf(p)].color }} title={`${p.name} · ${p.gate}${fundedIds.has(p.id) ? " · funded" : " · not funded"}`}>{p.id}</button>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        {(Object.keys(DEV_TYPE) as (keyof typeof DEV_TYPE)[]).map((k2) => (
          <span key={k2}><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: DEV_TYPE[k2].color }} />{DEV_TYPE[k2].label}</span>
        ))}
        {showUnfunded && <span className="text-slate-600">· {t("innovation.pipeline.dimLegend")}</span>}
        <button type="button" onClick={() => onShowUnfunded(!showUnfunded)} aria-pressed={showUnfunded}
          title={t("innovation.pipeline.unfundedHint")}
          className="ml-auto inline-flex min-h-[44px] shrink-0 items-center text-slate-400 hover:text-slate-200">
          <i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#64748b", opacity: showUnfunded ? 1 : 0.3 }} />{t("innovation.pipeline.unfunded")}
        </button>
      </div>

      {/* Dog-tag preview of the picked project (max mode) + jump to full details */}
      {maxed && pickedP && (
        <div className="mt-3 rounded-lg border border-cyan-500/30 bg-[#0b0f14] p-3">
          <DogTag p={pickedP} />
          <button onClick={() => onSelect(pickedP.id)} className="mt-2 rounded-md bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-[#06202a] hover:bg-cyan-400">Open full Project details →</button>
        </div>
      )}

      {/* Priority-ordered project list (funding-stack order) — filtered to selected gates (H4).
          Hoisted out of the map so the column-major row count below can be derived from the SAME list that
          is rendered; deriving it from `shown` would over-count whenever a gate filter is active. */}
      <div className="mt-4 border-t border-slate-800 pt-3">
        <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
          <span>Projects · priority order · {maxed ? "tap to preview" : "tap to open details"}</span>
          {selGates.size > 0 && <button onClick={() => setSelGates(new Set())} className="rounded border border-slate-700 px-1.5 py-0.5 text-cyan-300 hover:bg-slate-800">✕ clear {selGates.size} gate{selGates.size === 1 ? "" : "s"}</button>}
        </div>
        {/* W-2 · DOWN FIRST, THEN ACROSS (operator, with a screenshot): "Ensure the projects get listed down
            1-8 then second column 9-15. basically go down first."
            `sm:grid-cols-2` fills ROW-major — 1,2 / 3,4 / 5,6 — so rank 8 landed mid-right and the eye had to
            zig-zag to read a funding stack that is strictly ordered. Column-major is a FLOW change only:
            `grid-flow-col` plus an explicit row count of ⌈n/2⌉ puts ranks 1-8 down the left column and 9-15
            down the right.
            DOM ORDER IS UNTOUCHED, and that is the point — the `{i + 1}` rank badge, tab order and screen-
            reader order all still read 1..n in priority sequence; only the visual placement changes.
            The `sm:` prefix keeps the phone on a single column, where down-first is already what one column
            does; a CSS variable carries the row count because Tailwind cannot emit a dynamic `grid-rows-N`. */}
        <ol className="grid gap-1 sm:grid-flow-col sm:[grid-template-rows:repeat(var(--pr),minmax(0,1fr))]"
            style={{ "--pr": Math.max(1, Math.ceil(pri.length / 2)) } as React.CSSProperties}>
          {pri.map((p, i) => {
            const fu = fundedIds.has(p.id);
            return (
              <li key={p.id}>
                <button onClick={() => clickProject(p.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] hover:bg-slate-800/50 ${picked === p.id ? "bg-cyan-500/10 ring-1 ring-cyan-500/40" : ""}`}>
                  <span className="w-5 shrink-0 text-right tabular-nums text-slate-500">{i + 1}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${fu ? "bg-emerald-500" : "bg-rose-500"}`} title={fu ? "funded" : "not funded"} />
                  <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-200">{p.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">{p.gate}</span>
                  <span className={`shrink-0 w-16 text-right tabular-nums ${npvM(p) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{usd(npvM(p))}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );

  if (maxed) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0f14]/95 backdrop-blur-sm p-3 sm:p-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-800 bg-[#0e141b] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Pipeline by Gate <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">Unofficial Framework</span></h3>
            <button onClick={() => setMaxed(false)} title="Minimize" className="rounded border border-slate-700 px-2 py-0.5 text-[13px] leading-none text-slate-300 hover:bg-slate-800">⤡ Minimize</button>
          </div>
          {body}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e141b] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Pipeline by Gate</h3>
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">Unofficial Framework</span>
          <button onClick={() => setMaxed(true)} title="Maximize" className="rounded border border-slate-700 px-1.5 py-0.5 text-[13px] leading-none text-slate-300 hover:bg-slate-800">⤢</button>
        </div>
      </div>
      {body}
    </div>
  );
}

// G6 — ROI VISUALS (simplified, R-CORE reuse). One Growth-Model-style segmented selector switches between the
// four visuals the operator kept useful: Pipeline-by-Gate · 12-box metrics · one horizontal spend bar · a new
// portfolio cash-flow line. Replaces the old messy 4-card ROI grid + redundant stat row. Everything ties to the
// same engine (financialMetrics / roiSummary / financialsOverview) so numbers never diverge from the deck.
function RoiVisuals({ projects, funded, showUnfunded, onShowUnfunded, onSelect, allProjects, hierFilter, onScope }: { projects: Project[]; funded: Project[]; showUnfunded: boolean; onShowUnfunded: (v: boolean) => void; onSelect: (id: string) => void;
  allProjects: Project[]; hierFilter: HierSel; onScope: (s: HierSel) => void }) {
  const [view, setView] = useState<"pipeline" | "metrics" | "spend" | "cash">("pipeline");
  const kM = k;
  const roi = roiSummary(funded);
  const eff = rdEfficiency(funded);
  const cost = costSplit(projects);
  const npvTotal = funded.reduce((s, p) => s + npvM(p), 0);
  const incrTotal = funded.reduce((s, p) => s + incrementalRevM(p), 0);
  const wtdTotal = funded.reduce((s, p) => s + weightedRevM(p), 0);
  const rev10 = funded.reduce((s, p) => s + financialMetrics(p).rev10yM, 0);
  const gp10 = funded.reduce((s, p) => s + financialMetrics(p).grossProfit10yM, 0);
  const gmPct = rev10 > 0 ? Math.round((gp10 / rev10) * 100) : 0;
  const byBU = spendByBU(projects);
  // Portfolio cash-flow: Σ funded (margin − R&D) per year, cumulative. Reuses financialsOverview (deck engine).
  const YRS = 10;
  const rows = funded.map((p) => financialsOverview(p, { years: YRS, funded: true }));
  let run = 0;
  const cash = Array.from({ length: YRS }, (_, y) => {
    const marginM = rows.reduce((s, r) => s + (r[y]?.marginM ?? 0), 0);
    const rdM = rows.reduce((s, r) => s + (r[y]?.rdK ?? 0) / 1000, 0);
    run += marginM - rdM;
    return { year: (rows[0]?.[y]?.year ?? 2026), marginM, rdM, cum: run };
  });
  const tiles: { label: string; value: string; sub?: string; tone?: "green" | "cyan" | "amber" }[] = [
    // W-15 · THE TILE LEADS WITH THE DECISION, NOT THE INVENTORY (operator: "Projects should be 15 / 33
    // Funded … Funded (Funded/Submitted)"). It read `33` big with `15 funded` as a whisper underneath, so
    // the headline number was the one nobody acts on. `funded / submitted` is the same ratio the Rack &
    // Stack KPI strip already prints at page.tsx:583 — one format for one fact, on both surfaces.
    { label: "Projects", value: `${funded.length} / ${projects.length}`, sub: "Funded (Funded/Submitted)" },
    { label: "R&D efficiency", value: `${eff.toFixed(2)}×`, sub: "NPV per $ NRE", tone: "green" },
    { label: "10-Yr NPV", value: usd(npvTotal), sub: "funded", tone: "green" },
    { label: "Incremental Rev", value: usd(incrTotal), sub: "10-yr funded", tone: "cyan" },
    { label: "Prob-Weighted Rev", value: usd(wtdTotal), sub: "risk-adjusted", tone: "green" },
    { label: "Total NRE", value: kM(cost.totalK), sub: "all projects", tone: "amber" },
    { label: "10-Yr Revenue", value: usd(rev10), sub: "funded", tone: "green" },
    { label: "Gross Margin", value: `${gmPct}%`, sub: "portfolio", tone: "green" },
    { label: "New-Product Rev", value: usd(roi.newProductM), sub: "10-yr", tone: "cyan" },
    { label: "End-of-Life Rev", value: usd(roi.eolM), sub: "10-yr", tone: "amber" },
    { label: "Upside (at-risk)", value: usd(Math.max(0, roi.incrementalM - roi.weightedM)), sub: "to 100%", tone: "amber" },
    { label: "Cash · 10-yr", value: usd(cash[YRS - 1]?.cum ?? 0), sub: "cumulative", tone: cash[YRS - 1]?.cum >= 0 ? "green" : "amber" },
  ];
  const VIEWS = [["pipeline", "Pipeline"], ["metrics", "Metrics"], ["spend", "Spend"], ["cash", "Cash Flow"]] as const;
  // cash-flow mini chart geometry
  const W = 560, H = 150, L = 34, B = 20, T = 10;
  const maxV = Math.max(1, ...cash.map((c) => Math.max(c.marginM, c.cum)));
  const minV = Math.min(0, ...cash.map((c) => c.cum), ...cash.map((c) => -c.rdM));
  const span = maxV - minV || 1, pw = (W - L) / YRS;
  const y = (v: number) => T + (H - B - T) * (1 - (v - minV) / span);
  return (
    <DashCard title="ROI Visuals" tag="Portfolio">
      {/* X-2a · SCOPE SITS BEFORE THE FOUR-WAY SELECTOR (operator, with both screenshots: "Scope addition in
          ROI Chart before 4 toggle selector, matching Image 1"). This is the THIRD mount of the one standard
          `ScopeFilter` — the same control, same props shape, as Portfolio (`:664`) and Gate Requirements
          (`:5827`). The data on this tab was ALREADY scoped; only the control was missing. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ScopeFilter projects={allProjects} sel={hierFilter} onChange={onScope} />
      {/* Growth-Model-style segmented selector (Sofia: identical class recipe) */}
      <div className="flex overflow-hidden rounded-md border border-slate-700 text-[11px] w-fit">
        {VIEWS.map(([k2, lbl]) => (
          <button key={k2} onClick={() => setView(k2)} aria-pressed={view === k2}
            className={`px-2.5 py-1 ${view === k2 ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{lbl}</button>
        ))}
      </div>
      </div>
      {view === "pipeline" && <PipelineByGate projects={projects} funded={funded} showUnfunded={showUnfunded} onShowUnfunded={onShowUnfunded} onSelect={onSelect} />}
      {view === "metrics" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((m) => <StatTile key={m.label} label={m.label} value={m.value} sub={m.sub} tone={m.tone} />)}
        </div>
      )}
      {view === "spend" && (<><HBars rows={byBU.map((s) => ({ name: s.name, value: s.spendK, sub: `${s.count}` }))} fmt={kM} /><p className="mt-2 text-[10px] text-slate-500">NRE spend by Business Unit · right count = # projects.</p></>)}
      {view === "cash" && (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 360, height: "auto" }} role="img" aria-label="Portfolio cash flow">
            <line x1={L} y1={y(0)} x2={W} y2={y(0)} stroke="rgba(148,163,184,.35)" />
            {cash.map((c, i) => { const bx = L + i * pw + pw * 0.2, bw = pw * 0.28;
              return <g key={c.year}>
                <rect x={bx} y={Math.min(y(0), y(c.marginM))} width={bw} height={Math.abs(y(0) - y(c.marginM))} fill="#34d399" rx={1} />
                <rect x={bx + bw + 2} y={y(0)} width={bw} height={Math.abs(y(0) - y(-c.rdM))} fill="#f87171" rx={1} opacity={0.9} />
                <text x={bx + bw} y={H - 6} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="ui-monospace, monospace">{String(c.year).slice(2)}</text>
              </g>; })}
            <polyline fill="none" stroke="#38bdf8" strokeWidth={1.8} points={cash.map((c, i) => `${L + i * pw + pw * 0.5},${y(c.cum)}`).join(" ")} />
            {cash.map((c, i) => <circle key={c.year} cx={L + i * pw + pw * 0.5} cy={y(c.cum)} r={2.2} fill="#38bdf8" />)}
          </svg>
          <p className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#34d399]" />Margin</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#f87171]" />R&D/NRE</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#38bdf8]" />Cumulative cash</span><span className="ml-auto tabular-nums text-slate-400">Yr-10 cash {usd(cash[YRS - 1]?.cum ?? 0)}</span></p>
        </div>
      )}
    </DashCard>
  );
}

function Dashboards({ projects, funded, availK, budgetOverrideK, cadence = "M", showUnfunded, onShowUnfunded, onSelect, allProjects, hierFilter, onScope }: { projects: Project[]; funded: Project[]; availK: number; budgetOverrideK: (level: HierKey, code: string) => number | undefined; cadence?: Cadence; showUnfunded: boolean; onShowUnfunded: (v: boolean) => void; onSelect: (id: string) => void;
  // X-2a · the Dashboards tab already RECEIVED scoped data and offered no control to change it, so a
  // director reading Allocation and ROI saw one BU and could not ask why. These three are the same thread
  // `GateRequirementsView` is handed at the call site — reuse, not invention.
  allProjects: Project[]; hierFilter: HierSel; onScope: (s: HierSel) => void }) {
  const { t } = useLexicon();
  const fundedSet = new Set(funded.map((p) => p.id));
  const buAlloc = nodeAllocation(projects, "bu", (id) => fundedSet.has(id), availK, budgetOverrideK);
  const kM = k; // $K → $M — single source (was a redundant re-impl of the global `k`); ROI stats moved into RoiVisuals
  const [expandedBus, setExpandedBus] = useState<Set<string>>(new Set()); // H2 — rollup default COLLAPSED
  const toggleBu = (name: string) => setExpandedBus((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  // Admin Business-Setup drives labels + base revenue (one source of truth for the rollup).
  const bizSetup = loadBizSetup();
  const sbuBaseOf = (c: string) => bizSetup.sbu.find((n) => n.code === c)?.baseM ?? 0;
  const buLabelOf = (c: string) => bizSetup.bu.find((n) => n.code === c)?.label ?? BU_LABEL[c] ?? "BU";
  const sbuLabelOf = (c: string) => bizSetup.sbu.find((n) => n.code === c)?.label ?? SBU_LABEL[c] ?? "SBU";
  const roll = companyRollup(projects, { sbuBase: sbuBaseOf });

  return (
    <div className="space-y-4">
      {/* Allocation & UPSIDE per BU — always-on metric: budget → allocated → unallocated (upside) + $/min.
          The full editable per-node view (SBU / Alpha Group too) is in the Budget popup. */}
      <DashCard title="Allocation & upside · by BU" tag="Spend">
        <div className="grid gap-2 sm:grid-cols-3">
          {buAlloc.map((n) => {
            // W-8 · THREE FIGURES, AND THE THIRD IS WHICHEVER ONE IS REAL (operator, with a phone
            // screenshot: "remember if OVER (red), don't show UPSIDE"). `allocHeadroom` picks it; the model
            // has made the pair mutually exclusive since A1, so the fourth figure was always a guaranteed $0.
            const head = allocHeadroom(n);
            // THE BAR IS THE TWO NUMBERS UNDERNEATH IT, not one block clamped at 100%. Clamped, DS at 190%
            // of budget looked identical to a BU at exactly 100% — the overage was invisible, which is the
            // opposite of what a funding board needs. Amber survives as the ALLOCATED segment's colour at
            // >=90% so the near-the-limit warning is not lost to the segmentation.
            const split = allocBarSplit(n);
            const firstTone = split.over ? "bg-slate-500" : n.utilPct >= 90 ? "bg-amber-500" : "bg-emerald-500";
            const secondTone = split.over ? "bg-rose-500" : "bg-cyan-500";
            return (
              <div key={n.code} className="rounded-lg border border-slate-800 bg-[#0b0f14] p-2.5">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-100">{n.code} <span className="font-normal text-slate-500">{n.label}</span></span>
                  <span className="text-[10px] tabular-nums text-amber-300">{fmtPerCadence(n.perMinUsd, cadence)}</span>
                </div>
                <div className="mb-1.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-800"
                     title={split.over ? `${n.utilPct}% of budget allocated — ${kM(n.budgetK)} budget + ${kM(n.overK)} over` : `${n.utilPct}% of budget allocated — ${kM(n.allocatedK)} allocated + ${kM(n.upsideK)} upside`}>
                  <div className={`h-full ${firstTone}`} style={{ width: `${split.firstPct}%` }} />
                  <div className={`h-full ${secondTone}`} style={{ width: `${split.secondPct}%` }} />
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 text-[10px] tabular-nums">
                  <span className="text-slate-500">{t("innovation.alloc.budget")} <b className="text-slate-300">{kM(n.budgetK)}</b></span>
                  <span className="text-slate-500">{t("innovation.alloc.allocatedShort")} <b className="text-slate-300">{kM(n.allocatedK)}</b></span>
                  {head.kind === "over"
                    ? <span className="text-rose-400">{t("innovation.alloc.over")} <b className="text-rose-300">{kM(head.k)}</b></span>
                    : <span className="text-cyan-400">◆ {t("innovation.alloc.upside")} <b className="text-cyan-300">{kM(head.k)}</b></span>}
                </div>
              </div>
            );
          })}
        </div>
      </DashCard>

      {/* W-6 · ROI VISUALS IS SECOND, DIRECTLY UNDER ALLOCATION & UPSIDE (operator, asked more than once:
          "place ROI Visual with default Financials by Gate below first section: Allocation & upside · by BU
          … Item to stay 2nd on list"). It used to render FOURTH — after the Financial Map and the Rollup
          table — so the panel whose default view is Pipeline by Gate sat two scrolls below the budget it
          allocates against.
          THIS ALSO CLOSES H3 WITHOUT H3'S SURGERY. That plan proposed EXTRACTING PipelineByGate out of
          RoiVisuals to render it standalone here, which would have reversed the deliberate consolidation
          recorded at :6802, cut the view selector from four options to three, and risked the same panel
          appearing twice. Pipeline is already RoiVisuals' DEFAULT view, so moving the whole panel up
          satisfies "Pipeline by Gate after Allocation & Upside" as a reorder, with nothing dismantled. */}
      <RoiVisuals projects={projects} funded={funded} showUnfunded={showUnfunded} onShowUnfunded={onShowUnfunded} onSelect={onSelect}
        allProjects={allProjects} hierFilter={hierFilter} onScope={onScope} />

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
              {roll.bus.map((bu) => {
                const open = expandedBus.has(bu.name);
                const buCol = BU_COLOR[bu.name] ?? "#64748b";
                // H2 — expanded BU: rows tinted (masked bg) across all metrics + a left edge in the BU Trinity color.
                const tint = open ? { background: `${buCol}1f`, boxShadow: `inset 3px 0 0 ${buCol}` } : undefined;
                return (
                <React.Fragment key={bu.name}>
                  <tr onClick={() => toggleBu(bu.name)} className="cursor-pointer border-b border-slate-900 bg-slate-900/40 hover:bg-slate-900/70" style={tint} title={open ? "Collapse" : "Expand"}>
                    <td className="px-2 py-1.5 pl-4 font-semibold text-slate-100">{open ? "▾" : "▸"} {bu.name} <span className="text-[10px] text-slate-500">{buLabelOf(bu.name)}</span></td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300">${bu.baseM}M</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-300">{kM(bu.spendK)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-emerald-400">{usd(bu.npvM)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-slate-400">{bu.count}</td>
                  </tr>
                  {open && bu.sbus.map((sbu) => (
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
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Base revenue anchors the do-nothing growth model per SBU. BU = Σ its SBUs · Company = Σ all BUs (700M).</p>
      </DashCard>

      {/* G6's ROI Visuals — selector-driven Pipeline · Metrics · Spend · Cash Flow — MOVED UP to second
          position by W-6. It renders directly under Allocation & upside now; this is where it used to sit. */}

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
// fill by BU (shared Trinity BU_COLOR from innovation-data — one color source) · arrows point to the primary dep.
function DependencyPanel({ projects, deps, onSelect }: { projects: Project[]; deps: DepEdge[]; onSelect: (id: string) => void }) {
  const { t } = useLexicon();
  const summary = dependencySummary(projects, deps);
  const kM = usd; // $M — single source (was a redundant re-impl of the global `usd`)
  // Bubble size is selectable (deck: NPV · Year-1 Rev · 3-Year Rev · 10-Year Rev).
  const [sizeMode, setSizeMode] = useState<"npv" | "y1" | "y3" | "y10">("npv");
  // Node color-mode (Slice 5) — funding · risk · value-contribution · Intelligence-Load overlay.
  const [colorMode, setColorMode] = useState<"division" | "funding" | "risk" | "value" | "load">("division");
  const divColor = (d: string): string => `hsl(${parseInt((d + "|hue").split("").reduce((h, c) => ((h * 31 + c.charCodeAt(0)) | 0), 7).toString().replace("-", ""), 10) % 360}, 62%, 60%)`;
  const nodeStroke = (p: Project): string => {
    if (colorMode === "division") return divColor(p.division);
    if (colorMode === "risk") { const r = riskBandOf(p); const w = [r.technical, r.commercial, r.dependency]; return w.includes("High") ? VIZ.rose : w.includes("Med") ? VIZ.amber : VIZ.emerald; }
    if (colorMode === "value") {
      // D3 · was `competitiveIndex`, which is 100 on every project — so this "value" colour mode painted all
      // 33 the SAME green and coloured nothing. Value-for-money gives 32 distinct values over the same 33;
      // the bands are the measured terciles, so the three colours are ~evenly populated (10 / 11 / 12).
      const v = valueForMoney(p, valueEquationOf(p).differentiationM);
      return v >= VFM_BANDS.high ? "#34d399" : v >= VFM_BANDS.low ? "#94a3b8" : "#fb7185";
    }
    if (colorMode === "load") { const m = Math.max(p.ai, p.si, p.hi); return m === p.ai ? VIZ.cyan : m === p.si ? VIZ.sunset : VIZ.hiViolet; }
    return npvM(p) >= 0 ? "#34d399" : "#fb7185"; // funding
  };
  // Risk-propagation (Slice 5) — a node inherits an amber halo when any project it depends on carries an open (high) risk.
  const inheritsRisk = (p: Project): boolean => dependsOn(deps, p.id).some((e) => { const up = projects.find((x) => x.id === e.to); return !!up && (up.tech === "high" || up.comm === "high"); });
  const sizeVal = (p: Project) => {
    if (sizeMode === "npv") return Math.abs(npvM(p));
    const s = projectRevSeries(p, { years: 10, funded: true });
    if (sizeMode === "y1") return s[0].total;
    if (sizeMode === "y3") return s.slice(0, 3).reduce((a, r) => a + r.total, 0);
    return p.fullRev10yM;
  };
  const SIZE_LABEL: Record<string, string> = { npv: "NPV", y1: "Year-1 Rev", y3: "3-Year Rev", y10: "10-Year Rev" };
  // Constellation — DETERMINISTIC force-directed layout (operator): seed by id hash, then drag / wheel-zoom / pan.
  const withDeps = projects.filter((p) => dependsOn(deps, p.id).length || dependentsOf(deps, p.id).length);
  const inDeg = (id: string) => dependentsOf(deps, id).length;
  const ranked = [...withDeps].sort((a, b) => inDeg(b.id) - inDeg(a.id) || npvM(b) - npvM(a));
  const rankOf = new Map(ranked.map((p, i) => [p.id, i + 1]));           // #1 = most depended-upon
  const W = 640, H = 400;
  const ids = withDeps.map((p) => p.id);
  const base = useMemo(() => constellationLayout(ids, deps.map((e) => ({ from: e.from, to: e.to })), { w: W, h: H }), [ids.join(","), deps]);
  const [drag, setDrag] = useState<Record<string, { x: number; y: number }>>({});
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const dragRef = useRef<{ id: string | null; pan: boolean }>({ id: null, pan: false });
  const svgRef = useRef<SVGSVGElement>(null);
  const maxSize = Math.max(...withDeps.map((p) => sizeVal(p)), 1);
  const posOf = (id: string) => drag[id] ?? base[id] ?? { x: W / 2, y: H / 2 };
  const rOf = (p: Project) => 7 + 15 * Math.sqrt(Math.max(0, sizeVal(p)) / maxSize);
  const toSvg = (cx: number, cy: number) => { const r = svgRef.current?.getBoundingClientRect(); if (!r) return { x: 0, y: 0 }; const sx = (cx - r.left) / r.width * W, sy = (cy - r.top) / r.height * H; return { x: (sx - view.tx) / view.s, y: (sy - view.ty) / view.s }; };
  const onDown = (e: React.PointerEvent, id: string | null) => { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); dragRef.current = { id, pan: id === null }; };
  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.id) { const pt = toSvg(e.clientX, e.clientY); setDrag((m) => ({ ...m, [d.id!]: { x: Math.max(14, Math.min(W - 14, pt.x)), y: Math.max(14, Math.min(H - 14, pt.y)) } })); }
    else if (d.pan) { const r = svgRef.current?.getBoundingClientRect(); if (!r) return; setView((v) => ({ ...v, tx: v.tx + e.movementX / r.width * W, ty: v.ty + e.movementY / r.height * H })); }
  };
  const onUp = () => { dragRef.current = { id: null, pan: false }; };
  const onWheel = (e: React.WheelEvent) => { setView((v) => ({ ...v, s: Math.max(0.5, Math.min(3, v.s * (e.deltaY < 0 ? 1.1 : 0.9))) })); };
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
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{t("innovation.dep.colorBy")}</span>
        <div className="flex overflow-hidden rounded-md border border-slate-700">
          {(["division", "funding", "risk", "value", "load"] as const).map((m) => (
            <button key={m} onClick={() => setColorMode(m)}
              className={`px-2 py-1 ${colorMode === m ? "bg-cyan-500 text-[#06202a] font-semibold" : "text-slate-300 hover:bg-slate-800"}`}>{m === "division" ? "Division" : t(`innovation.dep.${m}`)}</button>
          ))}
        </div>
        <button onClick={() => { setDrag({}); setView({ s: 1, tx: 0, ty: 0 }); }} className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-800">Reset layout</button>
        <span className="ml-auto text-[10px] text-slate-500">Force-directed · drag nodes · wheel-zoom · drag background to pan</span>
      </div>
      {/* Constellation graph — deterministic force layout with drag / zoom / pan */}
      <ChartFrame label="Dependency Constellations">
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0b0f14]">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" style={{ height: "auto", cursor: dragRef.current.pan ? "grabbing" : "default" }}
          onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onWheel={onWheel}>
          <defs>
            <marker id="dep-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
            </marker>
          </defs>
          {/* background hit area — drag to pan */}
          <rect x={0} y={0} width={W} height={H} fill="transparent" onPointerDown={(e) => onDown(e, null)} style={{ cursor: "grab" }} />
          <g transform={`translate(${view.tx},${view.ty}) scale(${view.s})`}>
          {deps.map((e, i) => {
            const a = posOf(e.from), b = posOf(e.to);
            if (!a || !b) return null;
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={e.critical ? "#fb7185" : "#475569"} strokeWidth={e.critical ? 1.6 : 1} strokeDasharray={e.acknowledged ? "" : "4 3"} markerEnd="url(#dep-arrow)" opacity={0.7} />;
          })}
          {withDeps.map((p) => {
            const pt = posOf(p.id), r = rOf(p);
            const rank = rankOf.get(p.id)!;
            const deg = inDeg(p.id);
            const stroke = nodeStroke(p);
            const sw = 2 + Math.min(4, p.segmentValueProps?.length ?? 0);
            const halo = inheritsRisk(p);
            return (
              <g key={p.id} className="cursor-pointer" onPointerDown={(e) => onDown(e, p.id)} onClick={() => onSelect(p.id)}>
                {halo && <circle cx={pt.x} cy={pt.y} r={r + 3.5} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="2 2" opacity={0.8} />}
                <circle cx={pt.x} cy={pt.y} r={r} fill={BU_COLOR[hierOf(p).bu] ?? VIZ.cyan} fillOpacity={0.25} stroke={stroke} strokeWidth={sw} />
                <text x={pt.x} y={pt.y + 3.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#e2e8f0" fontFamily="ui-monospace, monospace">{rank}</text>
                <text x={pt.x} y={pt.y - r - 12} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace, monospace">{p.division}{deg ? ` ·${deg}↓` : ""}</text>
                <text x={pt.x} y={pt.y - r - 3} textAnchor="middle" fontSize="9" fontWeight="600" fill="#e2e8f0">{p.name.length > 16 ? p.name.slice(0, 16) + "…" : p.name}</text>
                <text x={pt.x} y={pt.y + r + 9} textAnchor="middle" fontSize="8" fill="#cbd5e1" fontFamily="ui-monospace, monospace">{SIZE_LABEL[sizeMode]} {sizeMode === "npv" ? usd(npvM(p)) : usd(sizeVal(p))}</text>
              </g>
            );
          })}
          </g>
        </svg>
      </div>
      </ChartFrame>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="text-slate-400"><b>#1 = most-depended-upon (bottom)</b> · arrows point down · ·N↓ = dependents</span>
        <span>bubble ∝ NPV</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full ring-2 ring-emerald-400" />above line</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full ring-2 ring-rose-400" />below line</span>
        <span><span className="mr-1 text-rose-400">──</span>critical</span>
        <span><span className="mr-1 text-slate-500">– –</span>unacknowledged</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full ring-2 ring-amber-400" />{t("innovation.dep.haloNote")}</span>
        <span>thicker ring = more segments served</span>
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

// Lives INSIDE Project details (operator, 2026-07-29). It was on the main page taking a Project dropdown and
// listing every project's risks; sitting under one project it is scoped to THAT project — the dropdown had
// exactly one possible value and the PROJECT column repeated the heading on every row.
function RiskRegister({ risks, setRisks, p }: { risks: Risk[]; setRisks: (r: Risk[]) => void; p: Project }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<RiskCategory>("technical");
  const [sev, setSev] = useState(3);
  const [like, setLike] = useState(3);
  // The project is the one this panel is mounted under. No dropdown to keep in sync, and no way to log a
  // risk against the wrong project — the stale-default bug the dropdown needed an effect to work around
  // cannot exist any more.
  const pid = p.id;
  const ranked = useMemo(() => [...risks].filter((r) => r.projectId === p.id).sort((a, b) => riskPriority(b) - riskPriority(a)), [risks, p.id]);

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
        <h2 className="text-sm font-semibold">Risk Register · eXeL AI feedback session <span className="font-normal text-slate-500">· {p.name}</span></h2>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">Identify · Concur · De-risk</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Anyone identifies a risk; the team gives internal feedback by concurring (poll) — priority = severity × likelihood × status × concurrence. Actioned + correct predictions earn ♡ / 웃 / ◬ rewards.</p>

      {/* Add-a-risk form — anyone can document */}
      <div className="mt-3 flex flex-wrap items-end gap-2 text-[11px] text-slate-400">
        <label className="flex-1 min-w-[180px]">Risk
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Describe a risk anyone should know about…" className={`mt-0.5 block w-full ${sel}`} />
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
              <th className="w-1/2 px-2 py-1.5 text-left">Risk</th>
              <th className="px-2 py-1.5 text-center">S×L</th>
              <th className="px-2 py-1.5 text-center">Status</th>
              <th className="px-2 py-1.5 text-right">Priority</th>
              <th className="px-2 py-1.5 text-center">Concur</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r) => (
              <tr key={r.id} className="border-b border-slate-900 hover:bg-slate-800/40">
                <td className="w-1/2 px-2 py-1.5">
                  <div className="leading-tight">{r.title}</div>
                  <div className="text-[10px] text-slate-500">{r.category} · by {r.author}{r.mitigation ? ` · ${r.mitigation}` : ""}</div>
                </td>
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
