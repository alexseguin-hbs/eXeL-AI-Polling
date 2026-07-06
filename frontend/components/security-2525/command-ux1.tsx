"use client";

/**
 * SECURITY-2525 · Command UX1 (preliminary build)
 * ===============================================
 * Static preliminary of the "eXeL AI — Autonomous Command Network" dashboard
 * (ref: docs/security-2525/reference/Security-UX1.png). Layout + reference data
 * only; live data-fusion wiring comes later. Self-contained tactical dark theme.
 * See docs/SECURITY_2525_FRAMEWORK.md §7.
 */
import { useState } from "react";
import {
  ArrowLeft, X, Cpu, LayoutDashboard, Radar, Crosshair, Swords,
  Package, Activity, Gamepad2, ClipboardList, AlertTriangle, Gauge, Target,
  Map, FlaskConical, Maximize2, Minimize2,
} from "lucide-react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import {
  AssetIcon, ASSET_ORDER, ASSET_LABELS, type IconStyle,
} from "@/components/security-2525/asset-icons";

const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", magenta: "#d946ef",
};

// eXeL version stamp — `v#.###-YYYY.MM.DD-HH.MMCST`, date/time ALWAYS in CST.
// Auto re-stamped at every release build from next.config.js env (SHA release):
// NEXT_PUBLIC_BUILD_DATE = YYYY.MM.DD · NEXT_PUBLIC_BUILD_TIME = "HH:MM CST".
// Keep v0.001 for now; bump manually on version milestones.
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE;
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME?.replace(":", ".").replace(" ", "");
const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
const EXEL_VERSION = BUILD_DATE && BUILD_TIME ? `v0.001-${BUILD_DATE}-${BUILD_TIME}` : "v0.001-dev";

const NAV: [string, React.ComponentType<{ className?: string }>][] = [
  ["OVERVIEW", LayoutDashboard],
  ["SENSORS", Radar],
  ["THREAT VIEW", Crosshair],
  ["PLANNING", Map],
  ["SIMULATION", FlaskConical],
  ["ENGAGEMENT", Swords],
  ["LOGISTICS", Package],
  ["MISSION HEALTH", Activity],
  ["TRAINING & VR", Gamepad2],
  ["AFTER ACTION", ClipboardList],
];

const COMPOSITION = [
  { k: "Cruise Missile", n: 2, c: C.red },
  { k: "X-Bat Swarm (UAS)", n: 14, c: C.red },
  { k: "Loitering Munition", n: 6, c: C.amber },
  { k: "Jamming / EW", n: 3, c: C.cyan },
];
const FUSION = [
  ["Radar", 98], ["EO/IR", 96], ["RF Detection", 94],
  ["Acoustic", 85], ["SIGINT", 91], ["LiDAR", 89],
] as const;
const KILL_CHAIN = [
  ["DETECT", "complete"], ["CLASSIFY", "complete"], ["TRACK", "active"],
  ["DECIDE", "pending"], ["ENGAGE", "pending"], ["ASSESS", "pending"],
] as const;
const DISTRIBUTION = [
  ["AIR", 61, C.red], ["GROUND", 26, C.amber], ["MARITIME", 9, C.cyan], ["CYBER / EW", 4, C.magenta],
] as const;
const WEAPONS = ["RF Jammer (Area)", "HPM System (Sweep)", "C-UAS Missile (Leader)", "Avenger (Sect 2)"];
const PRIORITY = [
  ["1", "X-Bat Swarm Group 1", "HIGH", C.red],
  ["2", "Cruise Missile", "HIGH", C.red],
  ["3", "Loitering Munitions", "MED", C.amber],
  ["4", "Jamming Source", "LOW", C.magenta],
] as const;

function Panel({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: C.panel, borderColor: C.border }}>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent ?? C.dim }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// 3-circle collapse toggle — hides the larger menus so the center goes full-screen.
function Toggle3({ onClick, title, horizontal }: { onClick: () => void; title: string; horizontal?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`flex ${horizontal ? "flex-row" : "flex-col"} items-center gap-[3px] rounded p-1 hover:bg-white/5`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: C.cyan }} />
      ))}
    </button>
  );
}

// Collapsed-rail chip: high-priority icon + number only (no full text).
function RailChip({ Icon, value, color }: { Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-4 w-4" style={{ color }} />
      <span className="text-[10px] font-bold" style={{ color: C.text }}>{value}</span>
    </div>
  );
}

// Critical-info chip sets — shared by the collapsed side rails AND the maximized map overlay.
function LeftRailChips() {
  return (
    <>
      <RailChip Icon={AlertTriangle} value="23" color={C.red} />
      <RailChip Icon={Swords} value="14" color={C.red} />
      <RailChip Icon={Radar} value="94%" color={C.green} />
      <RailChip Icon={Activity} value="18°" color={C.dim} />
    </>
  );
}

function RightRailChips() {
  return (
    <>
      <RailChip Icon={Crosshair} value="ENGAGE" color={C.amber} />
      <RailChip Icon={Gauge} value="15%" color={C.green} />
      <RailChip Icon={Target} value="85%" color={C.amber} />
    </>
  );
}

// Bottom critical strip — AI recommendation + confidence + P1 target + abort authority.
function CriticalStrip() {
  return (
    <>
      <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: C.text }}>
        <Cpu className="h-4 w-4" style={{ color: C.cyan }} /> NEUTRALIZE X-BAT SWARM
      </span>
      <span className="text-[10px] font-bold" style={{ color: C.green }}>86%</span>
      <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: C.red }}>
        <Target className="h-4 w-4" style={{ color: C.red }} /> P1 X-BAT SWARM GRP 1
      </span>
      <button className="rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide hover:bg-white/5"
        style={{ borderColor: `${C.red}44`, color: C.red }}>
        ABORT
      </button>
    </>
  );
}

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="w-20 text-[10px]" style={{ color: C.dim }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#0b1119" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.green }} />
      </div>
      <span className="w-8 text-right text-[10px]" style={{ color: C.text }}>{pct}%</span>
    </div>
  );
}

export function SecurityCommandUX1() {
  const { setVisionView, exitSimulationMode } = useEasterEgg();
  const [iconStyle, setIconStyle] = useState<IconStyle>("mil");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [mapMax, setMapMax] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-auto" style={{ background: C.bg, color: C.text }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2" style={{ background: C.bg, borderColor: C.border }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setVisionView("launcher")} className="p-1.5 rounded hover:bg-white/5" title="Back to Vision 2525">
            <ArrowLeft className="h-4 w-4" style={{ color: C.dim }} />
          </button>
          <span className="font-bold tracking-wider" style={{ color: C.cyan }}>eXeL AI</span>
          <span className="hidden sm:inline text-[10px] tracking-widest" style={{ color: C.dim }}>AUTONOMOUS COMMAND NETWORK</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#1a2436", color: C.amber }}>PRELIMINARY</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Iconology toggle: MIL-STD-2525 ⇄ eXeL-STD-2525 */}
          <div className="flex overflow-hidden rounded border text-[9px] font-semibold" style={{ borderColor: C.border }}>
            {(["mil", "exel"] as IconStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setIconStyle(s)}
                className="px-2 py-1 transition-colors"
                style={{
                  background: iconStyle === s ? "#152238" : "transparent",
                  color: iconStyle === s ? C.cyan : C.dim,
                }}
                title={s === "mil" ? "MIL-STD-2525 iconology" : "eXeL-STD-2525 iconology"}
              >
                {s === "mil" ? "MIL-STD-2525" : "eXeL-STD-2525"}
              </button>
            ))}
          </div>
          <span className="hidden md:inline text-[10px]" style={{ color: C.dim }}>OPERATOR: ALPHA-1</span>
          <span className="text-[10px]" style={{ color: C.green }}>LINK: SECURE</span>
          <button onClick={exitSimulationMode} className="p-1.5 rounded hover:bg-white/5" title="Exit">
            <X className="h-4 w-4" style={{ color: C.dim }} />
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 overflow-x-auto border-b px-4 py-1.5" style={{ borderColor: C.border }}>
        {NAV.map(([tab, Icon], i) => (
          <button key={tab} className="flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 text-[10px] tracking-wide transition-colors"
            style={{ background: i === 0 ? "#152238" : "transparent", color: i === 0 ? C.cyan : C.dim }}>
            <Icon className="h-3.5 w-3.5" />
            {tab}
          </button>
        ))}
      </div>

      {/* Body grid — side rails collapse (3-circle toggle) so the center fills the screen */}
      <div className="grid gap-3 p-3" style={{ gridTemplateColumns: `${leftOpen ? "260px" : "56px"} minmax(0,1fr) ${rightOpen ? "260px" : "56px"}` }}>
        {/* LEFT */}
        {leftOpen ? (
        <div className="space-y-3">
          <div className="flex justify-end"><Toggle3 onClick={() => setLeftOpen(false)} title="Collapse — show only critical info" /></div>
          <Panel title="Threat Summary">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" style={{ color: C.text }}>23</span>
              <span className="text-[10px]" style={{ color: C.dim }}>TOTAL THREATS</span>
            </div>
            <div className="mt-2 flex gap-3 text-[11px]">
              <span style={{ color: C.red }}>14 HIGH</span>
              <span style={{ color: C.amber }}>6 MED</span>
              <span style={{ color: C.green }}>3 LOW</span>
            </div>
          </Panel>
          <Panel title="Threat Composition">
            {COMPOSITION.map((c) => (
              <div key={c.k} className="flex items-center justify-between py-0.5">
                <span className="text-[11px]" style={{ color: c.c }}>{c.k}</span>
                <span className="text-[11px] font-mono" style={{ color: C.text }}>{c.n}</span>
              </div>
            ))}
          </Panel>
          <Panel title="Sensor Fusion Status">
            {FUSION.map(([l, p]) => <Bar key={l} label={l} pct={p} />)}
          </Panel>
          <Panel title="Environmental Conditions">
            <div className="grid grid-cols-2 gap-1 text-[10px]" style={{ color: C.dim }}>
              <span>Wind 12 kts</span><span>Temp 18°C</span>
              <span>Vis 8 km</span><span>Rain 10%</span>
            </div>
          </Panel>
          <Panel title={`Air Defense Assets · ${iconStyle === "mil" ? "MIL-STD-2525" : "eXeL-STD-2525"}`} accent={C.cyan}>
            <div className="mb-2 flex items-center gap-3 text-[9px]" style={{ color: C.dim }}>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "#38bdf8" }} /> FRIENDLY</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "#ef4444" }} /> ENEMY</span>
            </div>
            <div className="space-y-1.5">
              {ASSET_ORDER.map((asset) => (
                <div key={asset} className="flex items-center gap-2">
                  <AssetIcon asset={asset} style={iconStyle} affiliation="friendly" size={26} />
                  <AssetIcon asset={asset} style={iconStyle} affiliation="hostile" size={26} />
                  <span className="text-[11px]" style={{ color: C.text }}>{ASSET_LABELS[asset]}</span>
                </div>
              ))}
              {/* group/swarm variant — count > 1 reads differently at a glance */}
              <div className="flex items-center gap-2">
                <AssetIcon asset="xbat" style={iconStyle} affiliation="friendly" size={26} count={3} />
                <AssetIcon asset="xbat" style={iconStyle} affiliation="hostile" size={26} count={3} />
                <span className="text-[11px]" style={{ color: C.text }}>X-BAT SWARM ×3</span>
              </div>
            </div>
          </Panel>
        </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pt-1">
            <Toggle3 onClick={() => setLeftOpen(true)} title="Expand left panel" />
            <LeftRailChips />
          </div>
        )}

        {/* CENTER — 3D situational awareness placeholder (maximizes to full screen) */}
        <div className={mapMax ? "fixed inset-0 z-[80] flex flex-col p-3" : "rounded-lg border p-3"}
          style={mapMax ? { background: C.bg } : { background: C.panel, borderColor: C.border }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
              3D Situational Awareness — Real-Time Multi-Domain Fusion
            </span>
            <button onClick={() => setMapMax(!mapMax)} className="rounded p-1 hover:bg-white/5"
              title={mapMax ? "Minimize" : "Maximize — full screen"}>
              {mapMax
                ? <Minimize2 className="h-4 w-4" style={{ color: C.cyan }} />
                : <Maximize2 className="h-4 w-4" style={{ color: C.dim }} />}
            </button>
          </div>
          <div className={`relative flex items-center justify-center rounded-md overflow-hidden ${mapMax ? "flex-1" : "h-[300px] lg:h-[420px]"}`}
            style={{ background: "radial-gradient(ellipse at 50% 60%, #0f2033 0%, #070b12 70%)", border: `1px solid ${C.border}` }}>
            {/* stylized globe/grid */}
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            <div className="text-center z-10">
              <div className="mx-auto mb-3 h-24 w-24 rounded-full border-2" style={{ borderColor: `${C.cyan}55`, boxShadow: `0 0 40px ${C.cyan}33` }} />
              <p className="text-[11px]" style={{ color: C.dim }}>AIR · SEA · LAND · SPACE · CYBER · EW</p>
              <p className="mt-1 text-[10px]" style={{ color: C.dim }}>live fusion view — wiring pending</p>
            </div>
            {/* full-screen keeps the critical-info messaging — rails + bottom strip overlay the map */}
            {mapMax && (
              <>
                <div className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 rounded-md px-1.5 py-2" style={{ background: "#0a0f16cc" }}>
                  <LeftRailChips />
                </div>
                <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 rounded-md px-1.5 py-2" style={{ background: "#0a0f16cc" }}>
                  <RightRailChips />
                </div>
                <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-x-5 gap-y-1 rounded-md px-4 py-1.5" style={{ background: "#0a0f16cc" }}>
                  <CriticalStrip />
                </div>
              </>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[["Patriot Battery A", "6 msl · 360°", C.green], ["Avenger Section", "4 sys · low corridor", C.amber], ["M-SHORAD", "30mm / Stinger", C.green]].map(([n, s, c]) => (
              <div key={n} className="rounded border px-2 py-1" style={{ borderColor: C.border }}>
                <div className="text-[10px] font-semibold" style={{ color: c as string }}>{n}</div>
                <div className="text-[9px]" style={{ color: C.dim }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        {rightOpen ? (
        <div className="space-y-3">
          <div className="flex justify-start"><Toggle3 onClick={() => setRightOpen(false)} title="Collapse — show only critical info" /></div>
          <Panel title="Kill Chain Status" accent={C.cyan}>
            <div className="flex flex-wrap gap-1">
              {KILL_CHAIN.map(([stage, st]) => (
                <span key={stage} className="rounded px-1.5 py-0.5 text-[9px]"
                  style={{
                    background: st === "complete" ? "#0f2a1a" : st === "active" ? "#2a230f" : "#161d28",
                    color: st === "complete" ? C.green : st === "active" ? C.amber : C.dim,
                  }}>
                  {stage}
                </span>
              ))}
            </div>
          </Panel>
          <Panel title="Threat Distribution">
            {DISTRIBUTION.map(([l, p, c]) => (
              <div key={l as string} className="flex items-center gap-2 mb-1.5">
                <span className="w-20 text-[10px]" style={{ color: C.dim }}>{l}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "#0b1119" }}>
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: c as string }} />
                </div>
                <span className="w-8 text-right text-[10px]" style={{ color: C.text }}>{p}%</span>
              </div>
            ))}
          </Panel>
          <Panel title="Risk + Effect Assessment">
            <div className="flex justify-between">
              <div><div className="text-[9px]" style={{ color: C.dim }}>RISK</div><div className="text-lg font-bold" style={{ color: C.green }}>15%</div></div>
              <div><div className="text-[9px]" style={{ color: C.dim }}>EFFECT</div><div className="text-lg font-bold" style={{ color: C.amber }}>85%</div></div>
            </div>
          </Panel>
        </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pt-1">
            <Toggle3 onClick={() => setRightOpen(true)} title="Expand right panel" />
            <RightRailChips />
          </div>
        )}
      </div>

      {/* Bottom row — collapses (3-circle toggle) to a critical-info strip */}
      {bottomOpen ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-3 pb-3">
        <div className="md:col-span-3 -mb-2 flex justify-center">
          <Toggle3 horizontal onClick={() => setBottomOpen(false)} title="Collapse — show only critical info" />
        </div>
        <Panel title="AI Recommendation" accent={C.cyan}>
          <div className="flex items-start gap-2">
            <Cpu className="h-5 w-5 mt-0.5" style={{ color: C.cyan }} />
            <div>
              <div className="text-sm font-bold" style={{ color: C.text }}>NEUTRALIZE X-BAT SWARM</div>
              <p className="mt-1 text-[10px] leading-snug" style={{ color: C.dim }}>
                Disrupt swarm coordination with EW and precision engagements. Protect assets with layered defense.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px]" style={{ color: C.green }}>CONFIDENCE: HIGH</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "#0b1119" }}>
                  <div className="h-full rounded-full" style={{ width: "86%", background: C.green }} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-[9px] uppercase tracking-wider" style={{ color: C.dim }}>Recommended Weapons</div>
            {WEAPONS.map((w, i) => (
              <div key={w} className="text-[10px] py-0.5" style={{ color: C.dim }}>{i + 1}. {w}</div>
            ))}
          </div>
        </Panel>

        <Panel title="Engagement Priority">
          {PRIORITY.map(([r, name, lvl, c]) => (
            <div key={r as string} className="flex items-center gap-2 py-1 border-b" style={{ borderColor: C.border }}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: `${c as string}22`, color: c as string }}>{r}</span>
              <span className="flex-1 text-[11px]" style={{ color: C.text }}>{name}</span>
              <span className="text-[9px]" style={{ color: c as string }}>{lvl}</span>
            </div>
          ))}
        </Panel>

        <Panel title="Decision Support">
          {[["APPROVE PLAN", C.green], ["REVISE PLAN", C.dim], ["SIMULATE OUTCOME", C.cyan], ["REQUEST HUMAN REVIEW", C.amber], ["ABORT MISSION", C.red]].map(([label, c]) => (
            <button key={label as string} className="mb-1.5 w-full rounded border px-3 py-2 text-left text-[11px] font-semibold tracking-wide transition-colors hover:bg-white/5"
              style={{ borderColor: `${c as string}44`, color: c as string }}>
              {label}
            </button>
          ))}
        </Panel>
      </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-3 pb-3">
          <Toggle3 horizontal onClick={() => setBottomOpen(true)} title="Expand bottom panels" />
          <CriticalStrip />
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
        <span><span style={{ color: C.green }}>●</span> SYSTEM HEALTH — ALL SYSTEMS NOMINAL</span>
        <span>CLASSIFICATION: SECRET // REL TO USA, FVEY</span>
        <span>DATA FUSION ENGINE: eXeL {EXEL_VERSION} · {GIT_SHA}</span>
      </div>
    </div>
  );
}
