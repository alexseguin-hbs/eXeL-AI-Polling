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
  ArrowLeft, X, Gauge, LayoutDashboard, PencilRuler, Hammer, Sun, Boxes,
  DollarSign, RefreshCw, Share2, Users, ShieldCheck, Copy, History,
} from "lucide-react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { FpsMeter } from "@/components/security-2525/fps-meter";
import { ExelWordmark } from "@/components/exel-wordmark";
import { getFpsCap, setFpsCap, initFpsCap } from "@/components/security-2525/fps-governor";
import { RCORE_LANES } from "@/components/security-2525/rcore";
import { computeEconomy, allocate, fmtUsd, DEFAULT_RATE_PER_HR, type AllocationMode } from "./architect-economy";
import { ArchitectDesign, type DesignMetrics } from "./architect-design";

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

// The 12 Architect-2525 tabs (MASTER_SPEC §5). Label · icon.
const NAV: [string, React.ComponentType<{ className?: string }>][] = [
  ["OVERVIEW", LayoutDashboard],
  ["DESIGN", PencilRuler],
  ["BUILD", Hammer],
  ["SUN·SKY", Sun],
  ["SIMULATE", Boxes],
  ["COST·TIME", DollarSign],
  ["ITERATE", RefreshCw],
  ["SHARE", Share2],
  ["REVIEW", Users],
  ["QUALIFY", ShieldCheck],
  ["TWIN", Copy],
  ["REPLAY", History],
];

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

export function ArchitectCommandUX1({ initialTab = "OVERVIEW" }: { initialTab?: string } = {}) {
  const { setVisionView, exitSimulationMode, simulationMode } = useEasterEgg();
  const router = useRouter();
  const directLink = !simulationMode;
  const [activeTab, setActiveTab] = useState(initialTab);
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
  const econ = computeEconomy({ laborMin, reviewMin, donatedMin, ratePerHr, materialsUsd, aiMultiplier: 2, impact: 1.2, quality: 1.1 });
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
            <span className="shrink-0 whitespace-nowrap text-[10px] tracking-widest" style={{ color: C.violet }}>ARCHITECT · VISION 2525</span>
            <span className="shrink-0 whitespace-nowrap text-[9px]" style={{ color: C.dim }}>Innovation at the Speed of Thought</span>
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
        {/* R-CORE badge strip (reused contract) */}
        <div className="flex items-center gap-2 border-b px-4 py-0.5 text-[8px] font-bold tracking-wider" style={{ borderColor: C.border }}>
          <span style={{ color: C.dim }}>R-CORE</span>
          {RCORE_LANES.map((l) => (
            <span key={l.key} title={l.def} style={{ color: l.color }}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* TAB CONTENT — DESIGN kept mounted (model survives tab switches); OVERVIEW + COST·TIME live; others pending. */}
      <div className="p-4">
        <div data-arch-tab={activeTab === "DESIGN" ? "DESIGN" : undefined} style={activeTab === "DESIGN" ? undefined : { display: "none" }}>
          <ArchitectDesign onMetrics={setDesignMetrics} />
        </div>
        {activeTab !== "DESIGN" && (
        <div data-arch-tab={activeTab}>
        {activeTab === "OVERVIEW" ? (
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
            <div className="rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel, color: C.dim }}>
              <span style={{ color: C.violet }}>Knowledge Graph</span> — every project improves the next. Foundation → Concrete → Climate → Drainage → Best Practices → Future Recommendations. <span style={{ color: C.dim }}>(wiring pending)</span>
            </div>
          </div>
        ) : activeTab === "COST·TIME" ? (
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
        ) : (
          <div className="flex min-h-[55vh] flex-col items-center justify-center gap-2 text-center">
            <span className="text-sm font-semibold tracking-wide" style={{ color: C.violet }}>{activeTab}</span>
            <span className="text-xs" style={{ color: C.dim }}>Architect-2525 · wiring pending</span>
            <span className="max-w-md text-[11px]" style={{ color: C.dim }}>See docs/architecture-2525/MASTER_SPEC.md.</span>
          </div>
        )}
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
