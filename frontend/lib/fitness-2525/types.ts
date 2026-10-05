/**
 * Fitness-2525 · FitDay payload types.
 * Weight and calorie fields stay blank until the athlete sets them — never invent defaults.
 */

export type FitDistanceUnit = "m" | "mi" | "km" | "yd";
export type FitWeightUnit = "lb" | "kg";
export type FitWorkoutStatus = "planned" | "completed" | "skipped" | "adjusted";
export type FitCheckinChannel = "sms" | "ui" | "agent" | "device" | string;
export type FitSex = "male" | "female" | "unspecified";

export interface FitDistance {
  value: number;
  unit: FitDistanceUnit;
}

export interface FitWeight {
  value: number;
  unit: FitWeightUnit;
  at?: string;
}

/** Optional Garmin / device summary attached to a session. */
export interface FitGarminStats {
  start?: string; // HH:MM local
  end?: string;
  duration?: string; // e.g. 1:22:33
  pace?: string; // e.g. 1:37/100yd
  avg_hr?: number | null;
  zone?: string; // e.g. Base (Low Aerobic)
  kcal?: number | null;
  cal_per_min?: number | null;
  cal_per_sec?: number | null;
}

export interface FitWorkout {
  id: string;
  type: string;
  title?: string;
  status?: FitWorkoutStatus;
  minutes?: number | null;
  distance?: FitDistance | null;
  calories?: number | null;
  notes?: string;
  timing?: string;
  garmin?: FitGarminStats | null;
}

export interface FitCheckin {
  id: string;
  channel: FitCheckinChannel;
  prompt?: string;
  prompt_at?: string;
  reply?: string;
  reply_at?: string;
  parsed?: Record<string, unknown>;
}

export interface FitDay {
  v: 1;
  date: string;
  tz?: string;
  weight?: FitWeight | null;
  height_cm?: number | null;
  age_yr?: number | null;
  sex?: FitSex | null;
  steps?: number | null;
  calories_in?: number | null;
  calories_out?: number | null;
  sugar_out_g?: number | null;
  window_intake_kcal?: Record<string, number | null>;
  day_type?: string | null;
  workouts: FitWorkout[];
  checkins: FitCheckin[];
  deficit_note?: string;
  /** @deprecated Calories-only — leftover cloud field; UI ignores. */
  energy_cost_per_kcal?: number | null;
  coach_note?: string | null;
  source?: string;
  at: number;
}

export interface FitIndex {
  days: string[];
  at: number;
}

export function dayNamespace(date: string): string {
  return `fit-day-${date}`;
}

export const FIT_INDEX_NAME = "fit-index";

export function isDeficit(day: Pick<FitDay, "calories_in" | "calories_out">): boolean {
  const inn = day.calories_in;
  const out = day.calories_out;
  return typeof inn === "number" && typeof out === "number" && Number.isFinite(inn) && Number.isFinite(out) && inn < out;
}

export function deficitDelta(day: Pick<FitDay, "calories_in" | "calories_out">): number | null {
  const inn = day.calories_in;
  const out = day.calories_out;
  if (typeof inn !== "number" || typeof out !== "number" || !Number.isFinite(inn) || !Number.isFinite(out)) return null;
  return out - inn;
}
