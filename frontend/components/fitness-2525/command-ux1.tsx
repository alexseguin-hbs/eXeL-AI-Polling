"use client";

/**
 * FITNESS-2525 · Command UX 1
 * ===========================
 * Chrome/layout: Security-2525 Mission PLANNING (dark tactical command network —
 * top status strip, tab rail, left ASSETS-style rail, center stage, right ACTIVE ITEMS,
 * footer PLAN · DRAFT / SHARE / SUBMIT, MIL/eXeL-STD-2525 badges).
 * Energy methodology: Financial Accrual Units hero + REAL-TIME chart pattern
 * (fuel≈income / burn≈expenses / deficit≈net; MoT toggle cal/min · cal/sec · cal/hr).
 * Calories only — no $/kcal pricing. Energy budget: BMR + NEAT + MET workouts;
 * ACSM/ISSN carb windows; WHO/AHA sugar cap; ~10 lb/mo deficit with safety floor.
 * Cloud: innovation_state via fit2525: owner key · fit-day-* · fit-index.
 * AI coach: Worker /api/ai task=draft (OpenAI / Grok / Gemini / Claude).
 * Never invent calorie or weight defaults — leave blank until the athlete sets them.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ComponentType, type ReactNode } from "react";
import {
  Activity, ArrowLeft, Bike, Check, Cloud, CloudOff, Droplets, Footprints,
  LayoutDashboard, Map, Moon, Plus, RefreshCw, Settings, Waves, Zap,
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { ExelWordmark } from "@/components/exel-wordmark";
import {
  ownerKeyFor, cloudRead, mergeFitDays, mergeFitIndex, putDay, putIndex,
  nextStamp, PUSH_EVERY_MS, LAST_PUSH_KEY, DEVICE_DAY_KEY, DEVICE_INDEX_KEY,
  type CloudState,
} from "@/lib/fitness-2525/cloud";
import {
  type FitCheckin, type FitDay, type FitIndex, type FitWorkout,
  FIT_INDEX_NAME, dayNamespace, isDeficit, deficitDelta,
} from "@/lib/fitness-2525/types";
import {
  type EnergyRateUnit, intakeDayRates, burnDayRates, workoutBurnRates,
  pickRate, formatCalRate, ratesFromKcal,
} from "@/lib/fitness-2525/energy";
import {
  buildDayBudget, weightToKg, rideFuelingNote, EXAMPLE_ANTHRO, EXAMPLE_STEPS, EXAMPLE_SUGAR_G,
  EXAMPLE_CALORIES_IN, EXAMPLE_CALORIES_OUT, EXAMPLE_WINDOW_INTAKE,
  type OverrunLevel, type WindowBudget, type Anthropometrics,
} from "@/lib/fitness-2525/budget";
import { requestCoachFeedback, aiStatus, anyAi } from "@/lib/fitness-2525/ai";
import styles from "./fitness-2525.module.css";

/** Security-2525 Mission Planning palette (exact). */
const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400", magenta: "#d946ef",
};

const ROUTE = "/Fitness-2525";
const TODAY = "2026-10-05";
const TZ = "America/Chicago";

const NAV: [string, ComponentType<{ className?: string; style?: CSSProperties }>][] = [
  ["TODAY", LayoutDashboard],
  ["ENERGY", Zap],
  ["PLANNING", Map],
  ["NUTRITION", Droplets],
  ["COACH", Activity],
];

type TabId = "TODAY" | "ENERGY" | "PLANNING" | "NUTRITION" | "COACH";
type PlanStatus = "draft" | "pending" | "synced";

function Panel({ title, children, accent, right }: { title: string; children: ReactNode; accent?: string; right?: ReactNode }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: C.panel, borderColor: C.border }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent ?? C.dim }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}


function overrunClass(level: OverrunLevel): string {
  if (level === "over") return styles.budgetOver;
  if (level === "near") return styles.budgetNear;
  if (level === "ok") return styles.budgetOk;
  return styles.budgetUnknown;
}

function BudgetBar({ w }: { w: WindowBudget }) {
  const pct =
    w.planned != null && w.planned > 0 && w.logged != null
      ? Math.min(140, Math.round((w.logged / w.planned) * 100))
      : null;
  const alert =
    w.overrun === "over" ? "OVERRUN" : w.overrun === "near" ? "NEAR LIMIT" : null;
  const alertColor = w.overrun === "over" ? C.red : C.amber;
  return (
    <div className="mb-2 rounded border p-2" style={{ borderColor: C.border, background: "#0b1119" }}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase" style={{ color: C.text }}>{w.label}</div>
          <div className={`text-[9px] ${styles.mono}`} style={{ color: C.dim }}>
            planned {w.planned != null ? `${w.planned} ${w.unit}` : "—"}
            {" · "}
            logged {w.logged != null ? `${w.logged} ${w.unit}` : "—"}
            {w.burnKcal != null ? ` · burn ${w.burnKcal} kcal` : ""}
            {w.burnRates?.perMin != null ? ` · ${formatCalRate(w.burnRates.perMin, "per_min")} / ${formatCalRate(w.burnRates.perSec, "per_sec")}` : ""}
          </div>
        </div>
        {alert && (
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wide" style={{ color: alertColor, background: `${alertColor}22`, border: `1px solid ${alertColor}66` }}>
            {alert}
          </span>
        )}
      </div>
      <div className={styles.budgetTrack}>
        <div
          className={`${styles.budgetFill} ${overrunClass(w.overrun)}`}
          style={{ width: pct != null ? `${pct}%` : "0%" }}
        />
      </div>
      {w.note && <div className="mt-1 text-[8px]" style={{ color: C.dim }}>{w.note}</div>}
    </div>
  );
}

function seedToday(now = Date.now()): FitDay {
  return {
    v: 1,
    date: TODAY,
    tz: TZ,
    weight: null,
    height_cm: null,
    age_yr: null,
    sex: null,
    steps: null,
    calories_in: null,
    /** Logged so far from Garmin swim — real. */
    calories_out: 672,
    sugar_out_g: null,
    window_intake_kcal: {},
    day_type: "work",
    coach_note: null,
    workouts: [
      {
        id: "w-2026-10-05-swim",
        type: "swim",
        title: "Pool swim 4050 yd",
        status: "completed",
        minutes: 83, // 1:22:33
        distanc
