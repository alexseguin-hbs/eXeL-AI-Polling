"use client";

/**
 * FITNESS-2525 · Command UX 1 — Security-2525 Mission PLANNING chrome:
 * top status strip + tab rail, and the left SESSIONS (ASSETS-style) rail.
 */
import type { CSSProperties } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ExelWordmark } from "@/components/exel-wordmark";
import type { FitDay, FitWorkout } from "@/lib/fitness-2525/types";
import { C, NAV, seedToday, type TabId } from "./ux-helpers";
import { sportIcon } from "./ux-widgets";

export function TopStrip({
  tab, setTab, user, owner, isLoading, linkLabel, linkColor, signIn, onSignOut, btnGhost, btnPrimary,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  user: { name?: string; email?: string } | undefined;
  owner: string | null;
  isLoading: boolean;
  linkLabel: string;
  linkColor: string;
  signIn: () => void;
  onSignOut: () => void;
  btnGhost: CSSProperties;
  btnPrimary: CSSProperties;
}) {
  return (
    <div className="shrink-0 border-b" style={{ borderColor: C.border, background: C.bg }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <a href="/main/" className="flex shrink-0 items-center gap-2 rounded p-1 hover:bg-white/5" title="Home">
          <ArrowLeft className="h-4 w-4" style={{ color: C.dim }} />
          <ExelWordmark exelClass="font-bold" exelStyle={{ color: C.cyan }} aiClass="font-light" aiStyle={{ color: C.dim }} />
        </a>
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto whitespace-nowrap"
          style={{ maskImage: "linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)" }}>
          <span className="text-[10px] tracking-widest" style={{ color: C.dim }}>AUTONOMOUS COMMAND NETWORK</span>
          <span className="rounded px-1.5 py-0.5 text-[9px]" style={{ background: "#1a2436", color: C.amber }}>PRELIMINARY</span>
          <span className="rounded border px-1.5 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.border, color: C.cyan }}>MIL-STD-2525</span>
          <span className="rounded border px-1.5 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.border, color: C.dim }}>eXeL-STD-2525</span>
          <span className="text-[10px] font-semibold tracking-wide" style={{ color: C.dim }}>
            CLEARANCE: <span style={{ color: C.gold }}>LEVEL 3</span>
          </span>
          <span className="text-[10px]" style={{ color: C.dim }}>OPERATOR: {user?.name ?? user?.email ?? "ATHLETE-1"}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] font-semibold" style={{ color: linkColor }}>{linkLabel}</span>
          {owner ? (
            <button type="button" style={btnGhost} onClick={onSignOut}>SIGN OUT</button>
          ) : (
            <button type="button" style={btnPrimary} disabled={isLoading} onClick={signIn}>SIGN IN</button>
          )}
        </div>
      </div>
      {/* Tab rail */}
      <div className="flex gap-1 overflow-x-auto border-t px-3 py-1.5" style={{ borderColor: C.border }}>
        {NAV.map(([id, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as TabId)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 text-[10px] tracking-wide transition-colors"
            style={{ background: tab === id ? "#152238" : "transparent", color: tab === id ? C.cyan : C.dim, boxShadow: tab === id ? `inset 0 -2px 0 ${C.cyan}` : undefined }}
          >
            <Icon className="h-3.5 w-3.5" />
            {id === "TODAY" ? "LIVE TODAY" : id}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SessionsRail({
  tab, setTab, day, selected, setSelectedId, syncOnce, applyDay, signedIn, onSignIn,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  day: FitDay;
  selected: FitWorkout | null;
  setSelectedId: (id: string | null) => void;
  syncOnce: () => Promise<boolean>;
  applyDay: (updater: (prev: FitDay) => FitDay) => void;
  signedIn: boolean;
  onSignIn: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex border-b text-[10px] font-semibold tracking-wider" style={{ borderColor: C.border }}>
        {(["SESSIONS", "FUEL"] as const).map((lb) => (
          <button
            key={lb}
            type="button"
            className="flex-1 px-2 py-2"
            style={{ color: (lb === "SESSIONS" && (tab === "PLANNING" || tab === "TODAY" || tab === "ENERGY" || tab === "COACH" || tab === "CONNECTIONS")) || (lb === "FUEL" && tab === "NUTRITION") ? C.cyan : C.dim, background: (lb === "FUEL" && tab === "NUTRITION") || (lb === "SESSIONS" && tab !== "NUTRITION") ? "#152238" : "transparent" }}
            onClick={() => setTab(lb === "FUEL" ? "NUTRITION" : "PLANNING")}
          >
            {lb}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {day.workouts.map((w) => {
          const active = (selected?.id ?? null) === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => { setSelectedId(w.id); setTab("PLANNING"); }}
              className="mb-1 flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-white/5"
              style={{ background: active ? "#152238" : "transparent", boxShadow: active ? `inset 0 0 0 1px ${C.cyan}` : undefined }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border" style={{ borderColor: C.border }}>
                {sportIcon(w.type, w.status === "completed" ? C.green : C.cyan)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold uppercase" style={{ color: C.text }}>{w.title || w.type}</span>
                <span className="block truncate text-[9px]" style={{ color: C.dim }}>
                  {w.type} · {w.status || "planned"}
                  {w.distance ? ` · ${w.distance.value}${w.distance.unit}` : ""}
                  {w.minutes != null ? ` · ${w.minutes}m` : ""}
                </span>
              </span>
              <span className="text-[10px] font-bold" style={{ color: w.status === "completed" ? C.green : C.amber }}>
                {w.status === "completed" ? "✓" : "○"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="shrink-0 space-y-1 border-t p-1.5" style={{ borderColor: C.border }}>
        <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Ironman Cozumel</div>
        <div className="text-[9px]" style={{ color: C.text }}>Lose ~10 lb by 2026-11-05 · vitamin-rich fueling</div>
        <div className="flex gap-1 pt-1">
          <button type="button" className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.border, color: C.cyan }} onClick={() => { if (!signedIn) { onSignIn(); return; } void syncOnce(); }}>
            <RefreshCw className="mr-0.5 inline h-3 w-3" /> SYNC
          </button>
          <button type="button" className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.border, color: signedIn ? C.dim : C.dim, opacity: signedIn ? 1 : 0.45 }} disabled={!signedIn} title={signedIn ? "Reset to seed plan" : "Sign in to edit plans"} onClick={() => signedIn && applyDay(() => seedToday())}>
            RESET SEED
          </button>
        </div>
      </div>
    </div>
  );
}
