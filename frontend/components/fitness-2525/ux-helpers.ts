/**
 * FITNESS-2525 · Command UX 1 — shared constants, seed day, device storage, styles.
 * Split out of command-ux1.tsx (no JSX here). Never invent calorie or weight defaults.
 */
import type { CSSProperties, ComponentType } from "react";
import { Activity, Droplets, LayoutDashboard, Link2, Map, User, Zap } from "lucide-react";
import { DEVICE_DAY_KEY, DEVICE_INDEX_KEY } from "@/lib/fitness-2525/cloud";
import type { FitDay, FitIndex, FitProfile } from "@/lib/fitness-2525/types";
import { buildDayBudget, weightToKg, type Anthropometrics } from "@/lib/fitness-2525/budget";
import { toKg, heightCm as profileHeightCm } from "@/lib/fitness-2525/profile";

/** Security-2525 Mission Planning palette (exact). */
export const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400", magenta: "#d946ef",
};

export const ROUTE = "/Fitness-2525";
export const TODAY = "2026-10-05";
export const TZ = "America/Chicago";

export const NAV: [string, ComponentType<{ className?: string; style?: CSSProperties }>][] = [
  ["TODAY", LayoutDashboard],
  ["ENERGY", Zap],
  ["PLANNING", Map],
  ["NUTRITION", Droplets],
  ["COACH", Activity],
  ["PROFILE", User],
  ["CONNECTIONS", Link2],
];

export type TabId = "TODAY" | "ENERGY" | "PLANNING" | "NUTRITION" | "COACH" | "PROFILE" | "CONNECTIONS";
export type PlanStatus = "draft" | "pending" | "synced";

export const TAB_IDS: readonly TabId[] = ["TODAY", "ENERGY", "PLANNING", "NUTRITION", "COACH", "PROFILE", "CONNECTIONS"];

/** Numeric day fields editable from the UI (blank → null). */
export type DayField = "steps" | "calories_in" | "calories_out" | "height_cm" | "age_yr" | "sugar_out_g";

export function seedToday(now = Date.now()): FitDay {
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
        distance: { value: 4050, unit: "yd" },
        calories: 672,
        notes: "COMPLETED 08:00–09:30 America/Chicago. Garmin Base (Low Aerobic).",
        timing: "08:00–09:30",
        garmin: {
          start: "08:00",
          end: "09:30",
          duration: "1:22:33",
          pace: "1:37/100yd",
          avg_hr: 132,
          zone: "Base (Low Aerobic)",
          kcal: 672,
          cal_per_min: 8.1,
          cal_per_sec: 0.136,
        },
      },
      {
        id: "w-2026-10-05-bike",
        type: "bike",
        title: "Bike trainer tempo 75–90 min",
        status: "planned",
        minutes: 90,
        distance: null,
        calories: null,
        notes: "NEXT · 3 × 12 min steady tempo. Pre-ride fueling: water + electrolytes; 30–60 g CHO/hr only past 60 min.",
        timing: "NEXT",
      },
      {
        id: "w-2026-10-05-mobility",
        type: "mobility",
        title: "Mobility only",
        status: "planned",
        minutes: 15,
        distance: null,
        calories: null,
        notes: "Evening mobility only — no second workout.",
        timing: "evening",
      },
    ],
    checkins: [],
    deficit_note: "Target: intake < burn once numbers are available. Do not invent weight or calorie figures.",
    source: "fitness-2525-seed",
    at: now,
  };
}

export function loadDeviceDay(date: string): FitDay | null {
  try {
    const raw = localStorage.getItem(`${DEVICE_DAY_KEY}:${date}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FitDay;
    if (parsed?.v === 1 && parsed.date === date) return parsed;
  } catch { /* ignore */ }
  return null;
}
export function saveDeviceDay(day: FitDay): void {
  try { localStorage.setItem(`${DEVICE_DAY_KEY}:${day.date}`, JSON.stringify(day)); } catch { /* ignore */ }
}
export function loadDeviceIndex(): FitIndex {
  try {
    const raw = localStorage.getItem(DEVICE_INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FitIndex;
      if (parsed && Array.isArray(parsed.days)) return parsed;
    }
  } catch { /* ignore */ }
  return { days: [TODAY], at: 0 };
}
export function saveDeviceIndex(index: FitIndex): void {
  try { localStorage.setItem(DEVICE_INDEX_KEY, JSON.stringify(index)); } catch { /* ignore */ }
}

export function blankNum(v: number | null | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
}
export function parseOptionalNum(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export const INPUT_STYLE: CSSProperties = {
  background: "#0b1119", border: `1px solid ${C.border}`, color: C.text,
  borderRadius: 4, padding: "6px 8px", fontSize: 12, width: "100%", outline: "none",
};
export const BTN_GHOST: CSSProperties = {
  border: `1px solid ${C.border}`, color: C.cyan, background: "transparent",
  borderRadius: 4, padding: "6px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
};
export const BTN_PRIMARY: CSSProperties = {
  border: `1px solid ${C.cyan}`, background: C.cyan, color: "#041016",
  borderRadius: 4, padding: "6px 12px", fontSize: 11, fontWeight: 700,
};

/** Morning (fasted) weigh-in + athlete profile feed BMR first; legacy day fields are the fallback. */
export function computeBudget(day: FitDay, profile: FitProfile, exampleMode: boolean) {
  const profSex = profile.sex ?? day.sex;
  const anthro: Anthropometrics = {
    weightKg: toKg(day.weigh_ins?.morning) ?? weightToKg(day.weight),
    heightCm: profileHeightCm(profile) ?? (typeof day.height_cm === "number" ? day.height_cm : null),
    ageYr: typeof profile.age_yr === "number" ? profile.age_yr : typeof day.age_yr === "number" ? day.age_yr : null,
    sex: profSex === "male" || profSex === "female" ? profSex : "unspecified",
  };
  const budget = buildDayBudget({
    day,
    anthropometrics: anthro,
    dayType: day.day_type,
    sugarLoggedG: day.sugar_out_g,
    windowIntakeKcal: day.window_intake_kcal,
    example: exampleMode,
  });
  return { anthro, budget };
}
