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

      {/* TAB CONTENT — placeholders this increment; OVERVIEW + COST·TIME built next. */}
      <div className="p-6">
        <div data-arch-tab={activeTab} className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
          <span className="text-sm font-semibold tracking-wide" style={{ color: C.violet }}>{activeTab}</span>
          <span className="text-xs" style={{ color: C.dim }}>Architect-2525 · wiring pending</span>
          <span className="max-w-md text-[11px]" style={{ color: C.dim }}>
            Vision 2525 construction coordination — simulate, review, qualify, and approve homes before construction. See
            docs/architecture-2525/MASTER_SPEC.md.
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
        <span>◬ · ♡ · 웃 — Where Shared Intention moves at the Speed of Thought</span>
        <span>ARCHITECT-2525 · {EXEL_VERSION} · {GIT_SHA.slice(0, 7)}</span>
      </div>
    </div>
  );
}
