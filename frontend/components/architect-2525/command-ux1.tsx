"use client";

/**
 * ARCHITECT-2525 · Command UX1 — Vision 2525 Construction Coordination shell.
 * ========================================================================
 * Level-3 Domain Play sibling of SECURITY-2525's command shell (see
 * components/security-2525/command-ux1.tsx). Same self-contained dark-theme
 * pattern: NAV:[label,Icon][], activeTab from initialTab, sticky top bar, inline
 * gear settings popover (FPS), R-CORE badges, "wiring pending" placeholders.
 * Spec: docs/architecture-2525/MASTER_SPEC.md · "Innovation at the Speed of Thought".
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, X, Gauge, LayoutDashboard, PencilRuler, Hammer, Boxes,
  Users, Building2, MoreHorizontal, Search, Play, Bell,
} from "lucide-react";
import { Expander as CoreExpander } from "@/components/2525-core/expander";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { FpsMeter } from "@/components/security-2525/fps-meter";
import { ExelWordmark } from "@/components/exel-wordmark";
import { getFpsCap, setFpsCap, initFpsCap } from "@/components/security-2525/fps-governor";
import { computeEconomy, allocate, fmtUsd, DEFAULT_RATE_PER_HR, type AllocationMode } from "./architect-economy";
import { ArchitectDesign, type DesignMetrics } from "./architect-design";
import { DesignWorkspace } from "./architect-design-workspace";
import { LayerTree } from "./layer-tree";
import { ArchitectBuild } from "./architect-build";
import { ArchitectSkySun } from "./architect-skysun";
import { ArchitectSoI } from "./architect-soi";
import { ArchitectEstimate } from "./architect-estimate";
import { ArchitectForecast } from "./architect-forecast";
import { ArchitectFraming } from "./architect-framing";
import { IteratePanel, SharePanel, QualifyPanel } from "./architect-panels";
import { SimulatePanel, ReviewPanel, TwinPanel, ReplayPanel } from "./architect-panels2";

// Self-contained theme (Architect = violet Trinity accent; mirrors Security's inline C object).
const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400",
};

const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE;
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME?.replace(":", ".").replace(" ", "");
const EXEL_VERSION = BUILD_DATE && BUILD_TIME ? `v0.001-${BUILD_DATE}-${BUILD_TIME}` : "v0.001-dev";

// Vision 2525 UI Standard v3.0 — 7 permanent tabs (Replay is universal, not a tab). Label · icon.
const NAV: [string, React.ComponentType<{ className?: string }>][] = [
  ["Overview", LayoutDashboard],
  ["Design", PencilRuler],
  ["Simulate", Boxes],
  ["Review", Users],
  ["Build", Hammer],
  ["Lifecycle", Building2],
  ["More", MoreHorizontal],
];
// Inner (secondary) tabs per primary tab — where the former 12 panels now live.
const SUBNAV: Record<string, string[]> = {
  Design: ["Model", "Site", "Sky", "Compare"], // 4-tab visualization engine (Sky = celestial map + Moon-over-window)
  Review: ["Reviews", "Qualification", "Contributions"],
  Build: ["Build 4D", "Framing", "Estimate", "Forecast", "Cost·Time"],
  Lifecycle: ["Twin", "Replay"],
};
// Per-tab "•••" advanced menu (Security-2525 "•••" method) — a persisted expander on every major tab.
const ADV_MENU: Record<string, [string, string][]> = {
  Overview: [["Health", "SSSES · SPIRAL · R-CORE"], ["Readiness", "Gates · Human Authority"], ["Activity", "Feed · Notifications"], ["Digital Twin", "Live model · Sensors"]],
  Design: [["Layers", "Systems · MEP · Structure"], ["Compare", "Variants · Diff"], ["Coordinate", "MGRS · UCRS · Site"], ["Import", "IFC · DWG · GIS"]],
  Simulate: [["Analysis", "Energy · Structural · CFD"], ["Validation", "Clash · Code check"], ["Twin", "Live vs model"], ["Confidence", "Cone · AACE class"]],
  Review: [["Decisions", "Log · Approvals"], ["Issues", "Punch · RFI"], ["Approvals", "Gov · Edu · Innovation"], ["Contributions", "SoI · MoT · Trinity"]],
  Build: [["Permits", "Submittals · Inspections"], ["Procurement", "Bids · POs"], ["Field", "Daily logs · Safety"], ["Cost", "Cone · Forecast · $/min"]],
  Lifecycle: [["Assets", "Registry · Warranty"], ["Maintenance", "Schedule · Work orders"], ["Insurance", "Policy · Claims"], ["History", "Replay · Actuals"]],
};
// Route/deep-link aliases: old tab name → [primary, subtab?] so nothing 404s.
const TAB_ALIAS: Record<string, [string, string?]> = {
  OVERVIEW: ["Overview"], DESIGN: ["Design", "Model"], "SUN·SKY": ["Design", "Site"],
  ITERATE: ["Design", "Compare"], SIMULATE: ["Simulate"], REVIEW: ["Review", "Reviews"],
  QUALIFY: ["Review", "Qualification"], SHARE: ["Review", "Contributions"],
  BUILD: ["Build", "Build 4D"], "COST·TIME": ["Build", "Cost·Time"],
  TWIN: ["Lifecycle", "Twin"], REPLAY: ["Lifecycle", "Replay"], MORE: ["More"],
};
const resolveTab = (init: string): [string, string | undefined] => {
  if (NAV.some((n) => n[0] === init)) return [init, undefined];
  const a = TAB_ALIAS[init]; return a ? [a[0], a[1]] : ["Overview", undefined];
};

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
      <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.dim }}>{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums" style={{ color: color ?? C.text }}>{value}</div>
      {sub && <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>{sub}</div>}
    </div>
  );
}

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px]" style={{ color: C.text }}>
      <span>{label}</span>
      <input type="number" value={value} step={step} min={0}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="w-24 rounded border bg-transparent px-2 py-0.5 text-right tabular-nums"
        style={{ borderColor: C.border, color: C.text }} />
    </label>
  );
}

// Architect binding of the shared 2525-core Expander (collapsed by default; persists arch2525.exp.<id>).
const EXP_COLORS = { border: C.border, panel: C.panel, accent: C.violet, dim: C.dim };
const Expander = (p: { id: string; title: string; sub?: string; defaultOpen?: boolean; children: React.ReactNode }) =>
  <CoreExpander {...p} colors={EXP_COLORS} storagePrefix="arch2525.exp" />;

export function ArchitectCommandUX1({ initialTab = "OVERVIEW" }: { initialTab?: string } = {}) {
  const { setVisionView, exitSimulationMode, simulationMode } = useEasterEgg();
  const router = useRouter();
  const directLink = !simulationMode;
  const [initTab, initSub] = resolveTab(initialTab);
  const [activeTab, setActiveTab] = useState(initTab);
  const [subTab, setSubTab] = useState<Record<string, string>>(initSub ? { [initTab]: initSub } : {});
  const sub = (tab: string) => subTab[tab] ?? SUBNAV[tab]?.[0] ?? "";
  const setSub = (tab: string, s: string) => setSubTab((m) => ({ ...m, [tab]: s }));
  // Layer Tree selection — the canonical "what exists" pointer, lifted to the shell so every workspace
  // references it (Vision 2525 Digital Twin Standard v1.0). Drives the RIGHT Context panel (C5).
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFps, setShowFps] = useState(() => { try { return localStorage.getItem("arch2525.fps") === "1"; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem("arch2525.fps", showFps ? "1" : "0"); } catch {} }, [showFps]);
  const [fpsCap, setFpsCapState] = useState(0);
  useEffect(() => { initFpsCap(); setFpsCapState(getFpsCap()); }, []);
  const applyCap = (n: number) => { setFpsCap(n); setFpsCapState(n); };

  // $/min economy inputs (live client-side; seeded with a representative custom-home project).
  const [laborMin, setLaborMin] = useState(48000);   // ~800 labor-hours
  const [reviewMin, setReviewMin] = useState(1200);  // 20 architect-review hours
  const [donatedMin, setDonatedMin] = useState(600); // 10 donated/learning hours
  const [ratePerHr, setRatePerHr] = useState(DEFAULT_RATE_PER_HR);
  const [materialsUsd, setMaterialsUsd] = useState(320000);
  const [days, setDays] = useState(120);
  const [allocMode, setAllocMode] = useState<AllocationMode>("spread");
  const econ = computeEconomy({ laborMin, reviewMin, donatedMin, ratePerHr, materialsUsd, aiMultiplier: 5, impact: 1.2, quality: 1.1 }); // ◬ = ♡ × 5 (SoI: 1 min SI = 5 ◬, 5× time acceleration)
  const perDay = allocate(econ.totalUsd, days, allocMode);
  const iteration = 20; // current iteration in the 20-33 loop (demo)
  const [designMetrics, setDesignMetrics] = useState<DesignMetrics | null>(null);

  const goHome = () => { if (directLink) router.push("/"); else { exitSimulationMode(); setVisionView("launcher"); } };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-auto" style={{ background: C.bg, color: C.text }}>
      <div className="sticky top-0 z-40" style={{ background: C.bg }}>
        {/* TOP BAR */}
        <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: C.border }}>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={goHome} className="p-1 rounded hover:bg-white/5" title="Back to Vision 2525">
              <ArrowLeft className="h-4 w-4" style={{ color: C.dim }} />
            </button>
            <ExelWordmark exelStyle={{ color: C.cyan }} aiClass="font-light" aiStyle={{ color: C.dim }} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
            <span className="shrink-0 whitespace-nowrap text-[11px] font-bold tracking-widest" style={{ color: C.violet }}>Architect-2525</span>
            <span className="shrink-0 whitespace-nowrap text-[9px]" style={{ color: C.dim }}>Building Lifecycle Coordination · Vision 2525</span>
            {/* persistent header: global search + replay controls (universal) + notifications */}
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <button title="Search (⌘K)" className="rounded p-1 hover:bg-white/5"><Search className="h-3.5 w-3.5" style={{ color: C.dim }} /></button>
              <div className="flex items-center gap-0.5 rounded border px-1 py-0.5" style={{ borderColor: C.border }} title="Replay (universal)">
                <Play className="h-3 w-3" style={{ color: C.cyan }} />
                <span className="text-[8px] font-bold tracking-wider" style={{ color: C.dim }}>REPLAY</span>
              </div>
              <button title="Notifications" className="rounded p-1 hover:bg-white/5"><Bell className="h-3.5 w-3.5" style={{ color: C.dim }} /></button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="whitespace-nowrap text-[10px]" style={{ color: C.green }}>LINK: SECURE</span>
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="p-1.5 rounded hover:bg-white/5" title="Settings">
                <Gauge className="h-4 w-4" style={{ color: menuOpen ? C.violet : C.dim }} />
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full z-[93] -translate-x-1/2 -translate-y-1/2"><FpsMeter show={showFps} /></div>
              {menuOpen && <div className="fixed inset-0 z-[94]" onClick={() => setMenuOpen(false)} aria-hidden />}
              {menuOpen && (
                <div className="absolute right-0 top-9 z-[95] w-56 rounded border p-2 shadow-xl" style={{ background: C.panel, borderColor: C.border }}>
                  <div className="mb-1.5 text-[9px] font-bold tracking-wider" style={{ color: C.dim }}>SETTINGS · ALL TABS</div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span>FPS counter</span>
                    <button onClick={() => setShowFps((v) => !v)} className="rounded border px-2 py-0.5 text-[10px] font-bold"
                      style={{ borderColor: C.border, color: showFps ? C.green : C.dim }}>{showFps ? "ON" : "OFF"}</button>
                  </div>
                  <div className="mt-1 text-[9px] font-bold tracking-wider" style={{ color: C.dim }}>TARGET FPS · EDGE</div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[3, 6, 9, 33, 0].map((n) => (
                      <button key={n} onClick={() => applyCap(n)} className="rounded border px-2 py-0.5 text-[10px]"
                        style={{ borderColor: C.border, color: fpsCap === n ? C.violet : C.dim, background: fpsCap === n ? "#1a1030" : "transparent" }}>
                        {n === 0 ? "MAX" : n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={goHome} className="p-1 rounded hover:bg-white/5" title="Exit">
              <X className="h-4 w-4" style={{ color: C.dim }} />
            </button>
          </div>
        </div>
        {/* NAV TABS */}
        <div className="flex gap-1 overflow-x-auto border-b px-4 py-1.5" style={{ borderColor: C.border }}>
          {NAV.map(([tab, Icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold tracking-wide transition-colors"
              style={{ background: tab === activeTab ? "#221833" : "transparent", color: tab === activeTab ? C.violet : C.dim }}>
              <Icon className="h-3.5 w-3.5" />
              {tab}
            </button>
          ))}
        </div>
        {/* PROJECT RIBBON — always visible below the nav (v3.0) */}
        <div data-arch-ribbon className="flex items-center gap-x-4 gap-y-0.5 overflow-x-auto border-b px-4 py-1 text-[9px] whitespace-nowrap" style={{ borderColor: C.border }}>
          <span style={{ color: C.dim }}>PROJECT <span style={{ color: C.text }}>V2525-000842</span></span>
          <span style={{ color: C.dim }}>Stage Gate <span style={{ color: C.gold }}>G6</span></span>
          <span style={{ color: C.dim }}>Iteration <span style={{ color: C.cyan }}>{iteration} / 33</span></span>
          <span style={{ color: C.dim }}>SSSES <span style={{ color: C.green }}>—</span></span>
          <span style={{ color: C.dim }}>SPIRAL <span style={{ color: C.green }}>green</span></span>
          <span style={{ color: C.dim }}>R-CORE <span style={{ color: C.cyan }}>SYNC</span></span>
          <span style={{ color: C.dim }}>Human Authority <span style={{ color: C.violet }}>Homeowner</span></span>
          <span style={{ color: C.dim }}>Replay <span style={{ color: C.green }}>ready</span></span>
        </div>
        {/* SUBNAV — inner (secondary) tabs for the active primary tab */}
        {SUBNAV[activeTab] && (
          <div data-arch-subnav className="flex gap-1 overflow-x-auto border-b px-4 py-1" style={{ borderColor: C.border }}>
            {SUBNAV[activeTab].map((s) => (
              <button key={s} onClick={() => setSub(activeTab, s)} className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold transition-colors"
                style={{ background: sub(activeTab) === s ? "#221833" : "transparent", color: sub(activeTab) === s ? C.violet : C.dim }}>{s}</button>
            ))}
          </div>
        )}
        {/* R-CORE lanes moved OFF the shell (declutter) → into the map's own scrollable control row
            (Security-2525 map-control method). R-CORE status also stays in the project ribbon above. */}
      </div>

      {/* TAB CONTENT — the DESIGN tab is a Security-2525-style 3-column workspace (LEFT Layer Tree · CENTER
          4-tab visualization engine · RIGHT Context). Kept always-mounted so the Model survives tab switches. */}
      <div className="p-4">
        <div data-arch-tab={activeTab === "Design" ? "Design" : undefined} style={activeTab === "Design" ? undefined : { display: "none" }}>
          <DesignWorkspace leftRail={<LayerTree selectedId={selectedLayerId} onSelect={setSelectedLayerId} />}>
            {/* MODEL kept mounted (display:none when another engine view is active) so wireframe state persists. */}
            <div style={sub("Design") === "Model" ? undefined : { display: "none" }}>
              <ArchitectDesign onMetrics={setDesignMetrics} />
            </div>
            {sub("Design") === "Site" ? <ArchitectSkySun /> : null}
            {sub("Design") === "Sky" ? <ArchitectSkySun forceView="solar" /> : null}
            {sub("Design") === "Compare" ? <IteratePanel /> : null}
          </DesignWorkspace>
        </div>
        {activeTab !== "Design" && (
        <div data-arch-tab={activeTab}>
        {activeTab === "Overview" ? (
          <div className="space-y-3">
            <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>
              OBSERVABILITY · PROJECT HEALTH <span style={{ color: C.dim }}>· V2525-000842 · Custom Residence</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <Tile label="Iteration" value={`${iteration} / 33`} sub="20–33 loop" color={C.cyan} />
              <Tile label="Build-Ready" value="—" sub="qualify to unlock" color={C.amber} />
              <Tile label="Risk" value="LOW" sub="30–50% lower" color={C.green} />
              <Tile label="Project Cost" value={fmtUsd(econ.totalUsd)} sub={`${fmtUsd(econ.perMin)}/min`} color={C.text} />
              <Tile label="Time Donated" value={`${Math.round(donatedMin / 60)} h`} sub={`${econ.learningPoints} learning pts`} color={C.violet} />
              <Tile label="Time Capital" value={fmtUsd(econ.timeCapitalUsd)} sub="MoT × $/min" color={C.gold} />
              <Tile label="◬ ♡ 웃" value={`${econ.trinity.unity} · ${econ.trinity.heart} · ${fmtUsd(econ.trinity.human)}`} sub="Trinity ledger" color={C.cyan} />
              <Tile label="Fee" value={fmtUsd(econ.feeUsd)} sub="transparent · fair" color={C.green} />
              <Tile label="Model" value={designMetrics ? `${designMetrics.walls} walls` : "—"} sub={designMetrics ? `${designMetrics.studs} studs · ${designMetrics.linearFt} ft` : "open DESIGN"} color={C.cyan} />
            </div>
            <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>SSSES</div>
            <div className="grid grid-cols-5 gap-2">
              {["Security", "Stability", "Scalability", "Efficiency", "Succinctness"].map((p) => (
                <Tile key={p} label={p} value="—" sub="pending" color={C.dim} />
              ))}
            </div>
            <Expander id="kg" title="Knowledge Graph" sub="every project improves the next">
              <div className="rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel, color: C.dim }}>
                Foundation → Concrete → Climate → Drainage → Best Practices → Future Recommendations. <span style={{ color: C.dim }}>(wiring pending)</span>
              </div>
            </Expander>
            <Expander id="soi" title="System of Intelligence · Tri-Coin" sub="incentive framework — tap to expand">
              <ArchitectSoI econ={econ} />
            </Expander>
          </div>
        ) : activeTab === "Build" && sub("Build") === "Cost·Time" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
              <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>$/min ECONOMY · INPUTS</div>
              <NumField label="Labor (min)" value={laborMin} onChange={setLaborMin} step={60} />
              <NumField label="Expert review (min)" value={reviewMin} onChange={setReviewMin} step={30} />
              <NumField label="Donated / learning (min)" value={donatedMin} onChange={setDonatedMin} step={30} />
              <NumField label="Rate ($/hr)" value={ratePerHr} onChange={setRatePerHr} step={0.25} />
              <NumField label="Materials ($)" value={materialsUsd} onChange={setMaterialsUsd} step={1000} />
              <NumField label="Project days" value={days} onChange={(n) => setDays(Math.max(1, Math.round(n)))} step={1} />
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                <span>Allocation</span>
                <div className="flex gap-1">
                  {(["single", "spread"] as AllocationMode[]).map((m) => (
                    <button key={m} onClick={() => setAllocMode(m)} className="rounded border px-2 py-0.5 text-[10px]"
                      style={{ borderColor: C.border, color: allocMode === m ? C.violet : C.dim, background: allocMode === m ? "#221833" : "transparent" }}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Tile label="Labor" value={fmtUsd(econ.laborUsd)} color={C.text} />
                <Tile label="Review" value={fmtUsd(econ.reviewUsd)} color={C.text} />
                <Tile label="Donated (value)" value={fmtUsd(econ.donatedUsd)} sub="in-kind" color={C.violet} />
                <Tile label="Materials" value={fmtUsd(econ.materialsUsd)} color={C.text} />
                <Tile label="Total (billed)" value={fmtUsd(econ.totalUsd)} sub={`${fmtUsd(econ.perMin)}/min`} color={C.gold} />
                <Tile label={allocMode === "single" ? "Day 1" : "Per day"} value={fmtUsd(perDay[0])} sub={`${perDay.length} day(s)`} color={C.cyan} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Tile label="◬ AI" value={String(econ.trinity.unity)} color={C.cyan} />
                <Tile label="♡ SI" value={String(econ.trinity.heart)} color={C.red} />
                <Tile label="웃 HI" value={fmtUsd(econ.trinity.human)} color={C.green} />
              </div>
              <div className="rounded-lg border p-2 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>
                Time Capital <span style={{ color: C.gold }}>{fmtUsd(econ.timeCapitalUsd)}</span> · Learning points <span style={{ color: C.violet }}>{econ.learningPoints}</span>. Client preview reconciles to the Cube 5/8 ledger on sync.
              </div>
            </div>
          </div>
        ) : activeTab === "Build" && sub("Build") === "Framing" ? (
          <ArchitectFraming />
        ) : activeTab === "Build" && sub("Build") === "Estimate" ? (
          <ArchitectEstimate />
        ) : activeTab === "Build" && sub("Build") === "Forecast" ? (
          <ArchitectForecast />
        ) : activeTab === "Build" && sub("Build") === "Build 4D" ? (
          <ArchitectBuild />
        ) : activeTab === "Review" && sub("Review") === "Contributions" ? (
          <SharePanel />
        ) : activeTab === "Review" && sub("Review") === "Qualification" ? (
          <QualifyPanel />
        ) : activeTab === "Simulate" ? (
          <SimulatePanel />
        ) : activeTab === "Review" ? (
          <ReviewPanel />
        ) : activeTab === "Lifecycle" && sub("Lifecycle") === "Replay" ? (
          <ReplayPanel />
        ) : activeTab === "Lifecycle" ? (
          <TwinPanel />
        ) : activeTab === "More" ? (
          <div className="space-y-3">
            <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>••• MORE · ADVANCED CAPABILITIES</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Coordination", "Participants · Tasks · Votes · Risks"],
                ["Governance", "SSSES · SPIRAL · R-CORE · Human Authority"],
                ["Intelligence", "AI Agents · Knowledge Graph · Patterns"],
                ["Economy", "MoT · Time Capital · Trinity · Reputation"],
                ["Data", "IFC · DWG · GIS · Import · Export"],
                ["Administration", "Settings · Team · Permissions · Audit"],
                ["Tools", "Clash · Compare · Snapshot · A11y"],
                ["Help", "Docs · Tutorials · Glossary · Tour"],
              ].map(([g, items]) => (
                <div key={g} data-more-group className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
                  <div className="text-[10px] font-bold" style={{ color: C.cyan }}>{g}</div>
                  <div className="mt-1 text-[9px]" style={{ color: C.dim }}>{items}</div>
                </div>
              ))}
            </div>
            <div className="text-[9px]" style={{ color: C.dim }}>Reuses the Security-2525 {"“•••”"} expansion method · content wiring per Sprint 2+.</div>
          </div>
        ) : (
          <div className="flex min-h-[55vh] flex-col items-center justify-center gap-2 text-center">
            <span className="text-sm font-semibold tracking-wide" style={{ color: C.violet }}>{activeTab}{SUBNAV[activeTab] ? ` · ${sub(activeTab)}` : ""}</span>
            <span className="text-xs" style={{ color: C.dim }}>Architect-2525 · wiring pending</span>
            <span className="max-w-md text-[11px]" style={{ color: C.dim }}>See docs/architecture-2525/MASTER_SPEC.md.</span>
          </div>
        )}
        </div>
        )}
        {/* "•••" ADVANCED — a persisted expander on EVERY major tab (outside the Model/other split so it always
            shows, incl. Design→Model); reuses the Security-2525 "•••" method. Hidden on the More tab (which IS advanced). */}
        {activeTab !== "More" && (
          <div className="mt-3" data-adv-tab={activeTab}>
            <Expander id={`adv.${activeTab}`} title="••• Advanced" sub={activeTab}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(ADV_MENU[activeTab] ?? []).map(([g, items]) => (
                  <div key={g} data-adv-group className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
                    <div className="text-[10px] font-bold" style={{ color: C.cyan }}>{g}</div>
                    <div className="mt-1 text-[9px]" style={{ color: C.dim }}>{items}</div>
                  </div>
                ))}
              </div>
            </Expander>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
        <span>◬ · ♡ · 웃 — Where Shared Intention moves at the Speed of Thought</span>
        <span>ARCHITECT-2525 · {EXEL_VERSION} · {GIT_SHA.slice(0, 7)}</span>
      </div>
    </div>
  );
}
