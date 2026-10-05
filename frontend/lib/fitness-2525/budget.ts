/**
 * Fitness-2525 · energy budget model (calories only).
 * See docs/fitness-2525/ENERGY_MODEL.md.
 */
import type { FitDay, FitWeight, FitWorkout } from "./types";
import { ratesFromKcal, type EnergyRates } from "./energy";

export type FitSex = "male" | "female" | "unspecified";
export type OverrunLevel = "ok" | "near" | "over" | "unknown";

export interface Anthropometrics {
  weightKg: number | null;
  heightCm: number | null;
  ageYr: number | null;
  sex: FitSex;
}

export interface WindowBudget {
  id: string;
  label: string;
  kind: "workout" | "day_sugar" | "day_kcal";
  planned: number | null;
  logged: number | null;
  unit: "kcal" | "g";
  carbGPerHr?: number | null;
  minutes?: number | null;
  burnKcal?: number | null;
  burnRates?: EnergyRates;
  overrun: OverrunLevel;
  note?: string;
}

export interface DayEnergyBudget {
  anthropometrics: Anthropometrics;
  bmrKcal: number | null;
  neatKcal: number | null;
  workoutBurnKcal: number | null;
  totalBurnKcal: number | null;
  deficitTargetKcal: number | null;
  intakeTargetKcal: number | null;
  sugarCapG: number | null;
  noDeficitToday: boolean;
  dayClass: "work" | "key" | "long" | "rest" | "other";
  windows: WindowBudget[];
  example: boolean;
}

export const RAW_DAILY_DEFICIT = Math.round((10 * 3500) / 30);
export const MAX_DEFICIT_KCAL = 1000;
export const MAX_DEFICIT_FRACTION = 0.25;
export const NEAR_PCT = 0.85;
export const MET_BY_SPORT: Record<string, number> = {
  swim: 8.0, bike: 8.5, cycle: 8.5, run: 9.0, walk: 3.5, mobility: 2.5, strength: 5.0, yoga: 2.5, rest: 1.0,
};
export const SUGAR_CAP_G_FEMALE = 25;
export const SUGAR_CAP_G_MALE = 36;
export const SUGAR_CAP_G_DEFAULT = 30;

export function weightToKg(w: FitWeight | null | undefined): number | null {
  if (!w || typeof w.value !== "number" || !Number.isFinite(w.value) || w.value <= 0) return null;
  return w.unit === "kg" ? w.value : w.value * 0.45359237;
}

export function mifflinStJeorKcal(a: Anthropometrics): number | null {
  const { weightKg, heightCm, ageYr, sex } = a;
  if (weightKg == null || heightCm == null || ageYr == null) return null;
  if (!(weightKg > 0 && heightCm > 0 && ageYr > 0)) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYr;
  if (sex === "female") return Math.round(base - 161);
  if (sex === "male") return Math.round(base + 5);
  return Math.round(base - 78);
}

export function neatFromSteps(steps: number | null | undefined, weightKg: number | null): number | null {
  if (typeof steps !== "number" || !Number.isFinite(steps) || steps < 0) return null;
  if (weightKg == null || !(weightKg > 0)) return null;
  return Math.round(metKcal(3.5, weightKg, steps / 100));
}

export function metKcal(met: number, weightKg: number, minutes: number): number {
  return (met * 3.5 * weightKg * minutes) / 200;
}

export function metForSport(type: string): number {
  const t = type.toLowerCase();
  for (const [k, v] of Object.entries(MET_BY_SPORT)) if (t.includes(k)) return v;
  return 5.0;
}

export function intensityFactor(notes?: string | null, title?: string | null): number {
  const s = `${notes ?? ""} ${title ?? ""}`.toLowerCase();
  if (/\brecovery\b|\beasy\b|\bzone\s*1\b/.test(s)) return 0.75;
  if (/\btempo\b|\bsweet\s*spot\b|\bthreshold\b/.test(s)) return 1.0;
  if (/\brace\b|\bvo2\b/.test(s)) return 1.05;
  if (/\bmobility\b|\byoga\b/.test(s)) return 0.85;
  return 1.0;
}

export function estimateMinutes(w: FitWorkout): number | null {
  if (typeof w.minutes === "number" && w.minutes > 0) return w.minutes;
  if (w.distance && w.distance.value > 0) {
    const u = w.distance.unit;
    const m = u === "m" ? w.distance.value : u === "km" ? w.distance.value * 1000 : u === "yd" ? w.distance.value * 0.9144 : u === "mi" ? w.distance.value * 1609.34 : null;
    if (m != null && /swim/i.test(w.type)) return Math.round((m / 100) * 2);
  }
  return null;
}

export function workoutBurnKcal(w: FitWorkout, weightKg: number | null): number | null {
  if (typeof w.calories === "number" && Number.isFinite(w.calories) && w.calories >= 0) return Math.round(w.calories);
  if (w.garmin?.kcal != null && Number.isFinite(w.garmin.kcal)) return Math.round(w.garmin.kcal);
  if (weightKg == null) return null;
  const minutes = estimateMinutes(w);
  if (minutes == null) return null;
  return Math.round(metKcal(metForSport(w.type) * intensityFactor(w.notes, w.title), weightKg, minutes));
}

export function carbGPerHour(minutes: number | null | undefined): number | null {
  if (typeof minutes !== "number" || !(minutes > 0)) return null;
  if (minutes < 60) return 15;
  if (minutes <= 150) return 45;
  return 75;
}

export function workoutCarbBudgetG(minutes: number | null | undefined): number | null {
  const rate = carbGPerHour(minutes);
  if (rate == null || minutes == null) return null;
  return Math.round(rate * (minutes / 60));
}

export function carbKcal(g: number | null): number | null {
  return g == null ? null : Math.round(g * 4);
}

export function sugarCapG(sex: FitSex, dailyKcal: number | null): number | null {
  const aha = sex === "female" ? SUGAR_CAP_G_FEMALE : sex === "male" ? SUGAR_CAP_G_MALE : SUGAR_CAP_G_DEFAULT;
  if (dailyKcal != null && dailyKcal > 0) return Math.min(aha, Math.round((0.1 * dailyKcal) / 4));
  return aha;
}

export function classifyDay(dayType?: string | null, workouts: FitWorkout[] = []): DayEnergyBudget["dayClass"] {
  const t = (dayType ?? "").toLowerCase();
  if (t.includes("long")) return "long";
  if (t.includes("key") || t.includes("race")) return "key";
  if (workouts.some((w) => { const m = estimateMinutes(w); return m != null && m >= 150; })) return "long";
  if (t.includes("rest") || t.includes("off")) return "rest";
  if (t.includes("work")) return "work";
  return "other";
}

export function deficitTargetKcal(totalBurn: number | null, bmr: number | null, dayClass: DayEnergyBudget["dayClass"]) {
  const noDeficit = dayClass === "key" || dayClass === "long";
  if (noDeficit) return { deficit: 0, noDeficit: true as const };
  if (totalBurn == null || bmr == null) return { deficit: null, noDeficit: false as const };
  const capped = Math.min(RAW_DAILY_DEFICIT, MAX_DEFICIT_KCAL, Math.round(totalBurn * MAX_DEFICIT_FRACTION));
  return { deficit: Math.min(capped, Math.max(0, totalBurn - bmr)), noDeficit: false as const };
}

export function overrunLevel(planned: number | null, logged: number | null): OverrunLevel {
  if (planned == null || !(planned > 0) || logged == null) return "unknown";
  const r = logged / planned;
  if (r >= 1) return "over";
  if (r >= NEAR_PCT) return "near";
  return "ok";
}

/** Ride fueling: CHO only past 60 min (30–60 g/hr ACSM); water+electrolytes always. */
export function rideFuelingNote(minutes: number | null | undefined): string {
  if (minutes == null) return "Water + electrolytes. Carb rate sized once duration is known.";
  if (minutes <= 60) return "Water + electrolytes. CHO optional under 60 min (0–30 g/hr).";
  const g = carbGPerHour(minutes);
  return `Water + electrolytes. Past 60 min: ~${g} g CHO/hr (ACSM/ISSN 30–60 g/hr for 1–2.5 h).`;
}

export function buildDayBudget(opts: {
  day: FitDay;
  anthropometrics: Anthropometrics;
  dayType?: string | null;
  sugarLoggedG?: number | null;
  windowIntakeKcal?: Record<string, number | null | undefined>;
  example?: boolean;
}): DayEnergyBudget {
  const { day, anthropometrics: a, dayType, sugarLoggedG = null, windowIntakeKcal = {}, example = false } = opts;
  const bmr = mifflinStJeorKcal(a);
  const neat = neatFromSteps(day.steps, a.weightKg);
  const burns = day.workouts.map((w) => workoutBurnKcal(w, a.weightKg));
  const workoutBurn = burns.every((b) => b == null) ? null : burns.reduce<number>((s, b) => s + (b ?? 0), 0);
  const modeled =
    bmr == null && neat == null && workoutBurn == null ? null : (bmr ?? 0) + (neat ?? 0) + (workoutBurn ?? 0);
  const burnForPlan =
    typeof day.calories_out === "number" && Number.isFinite(day.calories_out) ? day.calories_out : modeled;
  const dayClass = classifyDay(dayType, day.workouts);
  const { deficit, noDeficit } = deficitTargetKcal(burnForPlan, bmr, dayClass);
  const intakeTarget = burnForPlan != null && deficit != null ? Math.round(burnForPlan - deficit) : null;
  // WHO 10% rule only against a full-day intake target — never a partial 'so far' burn.
  const sugarCap = sugarCapG(a.sex, intakeTarget);
  const windows: WindowBudget[] = [];
  for (const w of day.workouts) {
    const minutes = estimateMinutes(w);
    const carbRate = carbGPerHour(minutes);
    const carbG = workoutCarbBudgetG(minutes);
    const plannedKcal = carbKcal(carbG);
    const burn = workoutBurnKcal(w, a.weightKg);
    const logged = windowIntakeKcal[w.id];
    const loggedN = typeof logged === "number" && Number.isFinite(logged) ? logged : null;
    windows.push({
      id: w.id, label: w.title || w.type, kind: "workout",
      planned: plannedKcal, logged: loggedN, unit: "kcal", carbGPerHr: carbRate, minutes,
      burnKcal: burn, burnRates: ratesFromKcal(burn, minutes),
      overrun: overrunLevel(plannedKcal, loggedN),
      note: minutes == null ? "Duration unknown — carb window not sized"
        : `${carbRate} g CHO/hr × ${(minutes / 60).toFixed(1)} h ≈ ${carbG} g (${plannedKcal} kcal)`,
    });
  }
  windows.push({
    id: "day-sugar", label: "Added sugar (outside workout windows)", kind: "day_sugar",
    planned: sugarCap,
    logged: typeof sugarLoggedG === "number" && Number.isFinite(sugarLoggedG) ? sugarLoggedG : null,
    unit: "g", overrun: overrunLevel(sugarCap, typeof sugarLoggedG === "number" ? sugarLoggedG : null),
    note: "AHA 25–36 g/day · WHO <10% energy",
  });
  const intakeLogged = typeof day.calories_in === "number" && Number.isFinite(day.calories_in) ? day.calories_in : null;
  windows.push({
    id: "day-kcal", label: "Daily intake vs target", kind: "day_kcal",
    planned: intakeTarget, logged: intakeLogged, unit: "kcal",
    overrun: overrunLevel(intakeTarget, intakeLogged),
    note: noDeficit ? "No deficit on key/long day — fuel the work"
      : deficit != null ? `Deficit target ${deficit} kcal (≤ ~10 lb/mo, safety-capped)`
      : "Enter weight/height/age + steps/workouts to size target",
  });
  return {
    anthropometrics: a, bmrKcal: bmr, neatKcal: neat, workoutBurnKcal: workoutBurn,
    totalBurnKcal: burnForPlan, deficitTargetKcal: deficit, intakeTargetKcal: intakeTarget,
    sugarCapG: sugarCap, noDeficitToday: noDeficit, dayClass, windows, example,
  };
}

export const EXAMPLE_ANTHRO: Anthropometrics = { weightKg: 82, heightCm: 178, ageYr: 38, sex: "male" };
export const EXAMPLE_STEPS = 8500;
export const EXAMPLE_SUGAR_G = 28;
export const EXAMPLE_CALORIES_IN = 2400;
export const EXAMPLE_CALORIES_OUT = 2950;
export const EXAMPLE_WINDOW_INTAKE: Record<string, number> = {
  "w-2026-10-05-swim": 180,
  "w-2026-10-05-bike": 420,
  "w-2026-10-05-mobility": 40,
};
