"use client";

/** FITNESS-2525 · Command UX 1 — right ACTIVE ITEMS rail + footer PLAN · SHARE / SUBMIT. */
import type { CSSProperties } from "react";
import { Check, Cloud, CloudOff, Plus } from "lucide-react";
import type { CloudState } from "@/lib/fitness-2525/cloud";
import type { FitDay, FitWorkout } from "@/lib/fitness-2525/types";
import styles from "./fitness-2525.module.css";
import { C, ROUTE, type PlanStatus } from "./ux-helpers";
import { AuthGate } from "./auth-gate";

export function ActiveItemsRail({
  day, selected, setSelectedId, toggleWorkout, checkinDraft, setCheckinDraft, addCheckin,
  owner, planStatus, statusColor, shareMsg, cloudState, completed, onShare, onSubmit, inputStyle,
  onSignIn, authLoading,
}: {
  day: FitDay;
  selected: FitWorkout | null;
  setSelectedId: (id: string | null) => void;
  toggleWorkout: (id: string) => void;
  checkinDraft: string;
  setCheckinDraft: (s: string) => void;
  addCheckin: () => void;
  owner: string | null;
  planStatus: PlanStatus;
  statusColor: string;
  shareMsg: string;
  cloudState: CloudState;
  completed: number;
  onShare: () => void;
  onSubmit: () => void;
  inputStyle: CSSProperties;
  onSignIn: () => void;
  authLoading?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border" style={{ background: C.panel, borderColor: C.border }}>
      <div className="border-b px-2 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: C.border, color: C.dim }}>
        ACTIVE ITEMS — {day.workouts.length + day.checkins.length}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {day.workouts.map((w: FitWorkout) => (
          <div
            key={w.id}
            className="mb-1 flex items-center gap-1 rounded px-1 py-1 text-[9px] hover:bg-white/5"
            style={{ background: selected?.id === w.id ? "#152238" : "transparent" }}
          >
            <button type="button" className="flex min-w-0 flex-1 items-center justify-between gap-1 text-left" onClick={() => setSelectedId(w.id)}>
              <span style={{ color: w.status === "completed" ? C.green : C.text }}>{(w.title || w.type).slice(0, 22)}{w.status === "completed" ? "" : ""}</span>
              <span className={`font-mono ${styles.mono}`} style={{ color: C.gold }}>{w.timing || w.type}</span>
            </button>
            <button type="button" title={owner ? "Toggle done" : "Sign in to edit"} disabled={!owner} onClick={() => owner && toggleWorkout(w.id)} className="shrink-0 p-0.5 opacity-70 hover:opacity-100">
              {w.status === "completed" ? <Check className="h-3 w-3" style={{ color: C.green }} /> : <span style={{ color: C.dim }}>○</span>}
            </button>
          </div>
        ))}
        {day.checkins.map((c) => (
          <div key={c.id} className="mb-1 rounded px-1 py-1 text-[9px]" style={{ background: "#0b1119" }}>
            <div className="flex justify-between gap-1">
              <span style={{ color: C.cyan }}>{c.channel}</span>
              <span className="font-mono" style={{ color: C.gold }}>{(c.reply_at || "").slice(0, 16)}</span>
            </div>
            <div className="mt-0.5 truncate" style={{ color: C.text }}>{c.reply}</div>
          </div>
        ))}
        {day.workouts.length + day.checkins.length === 0 && (
          <div className="p-2 text-[10px]" style={{ color: C.dim }}>No active items</div>
        )}
      </div>
      <div className="shrink-0 space-y-1 border-t p-1.5" style={{ borderColor: C.border }}>
        {owner ? (
          <>
            <input
              style={inputStyle}
              placeholder="Quick check-in…"
              value={checkinDraft}
              onChange={(e) => setCheckinDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCheckin(); }}
            />
            <button type="button" className="w-full rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.border, color: C.cyan }} onClick={() => addCheckin()} disabled={!checkinDraft.trim()}>
              <Plus className="mr-0.5 inline h-3 w-3" /> LOG CHECK-IN
            </button>
          </>
        ) : (
          <AuthGate compact onSignIn={onSignIn} isLoading={authLoading}
            message="Sign in with Auth0 to log check-ins and mark workouts done." />
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Plan</span>
          <span className="rounded px-1 text-[8px] font-bold uppercase" style={{ color: statusColor, background: `${statusColor}18` }}>{planStatus}</span>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={onShare} className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.border, color: C.cyan }}>SHARE</button>
          <button type="button" onClick={onSubmit} disabled={!owner || planStatus === "pending"} className="flex-1 rounded border px-1 py-1 text-[8px] font-semibold" style={{ borderColor: C.amber, color: owner ? C.amber : C.dim, opacity: owner ? 1 : 0.5 }}>SUBMIT ▶</button>
        </div>
        <div className="text-[7px]" style={{ color: statusColor }}>
          {shareMsg || (owner
            ? (planStatus === "synced" ? "Cloud synced — human authority retained"
              : planStatus === "pending" ? "Awaiting cloud write"
              : "Draft on device — Submit pushes fit-day-*")
            : "Sign in with Auth0 to save plans and workouts to your account")}
        </div>
        <div className="flex items-center gap-1 text-[8px]" style={{ color: C.dim }}>
          {owner && cloudState === "saved" ? <Cloud className="h-3 w-3" style={{ color: C.green }} /> : <CloudOff className="h-3 w-3" />}
          <span>{completed}/{day.workouts.length} sessions · {day.date}</span>
        </div>
        <div className="pt-1 text-center">
          <a
            href={`${ROUTE}/privacy-policy`}
            className="text-[8px] font-semibold uppercase tracking-wider hover:underline"
            style={{ color: C.dim }}
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
