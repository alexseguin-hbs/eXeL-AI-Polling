/**
 * Fitness-2525 · FitDay payload types (fit-day-YYYY-MM-DD namespaces on innovation_state).
 * Schema mirrors docs/fitness-2525 and /workspace/fitness-2525/exel-api-map.md.
 * Weight and calorie fields stay blank until the athlete sets them — never invent defaults.
 */

export type FitDistanceUnit = "m" | "mi" | "km" | "yd";
export type FitWeightUnit = "lb" | "kg";
export type FitWorkoutStatus = "planned" | "completed" | "skipped" | "adjusted";
export type FitCheckinChannel = "sms" | "ui" | "agent" | "device" | string;

export interface FitDistance {
  value: number;
  unit: FitDistanceUnit;
}

export interface FitWeight {
  value: number;
  unit: FitWeightUnit;
  at?: string;
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
  date: string; // YYYY-MM-DD
  tz?: string;
  weight?: FitWeight | null;
  /** Daily steps — blank/undefined until measured. */
  steps?: number | null;
  /** Calories in — blank until set. */
  calories_in?: number | null;
  /** Calories out / TDEE — blank until set. */
  calories_out?: number | null;
  workouts: FitWorkout[];
  checkins: FitCheckin[];
  /** Free-text deficit / fueling note (never invent numbers here). */
  deficit_note?: string;
  /** Optional $/kcal basis for energy methodology charts — blank until set. */
  energy_cost_per_kcal?: number | null;
  /** Latest editable AI coach note (also mirrored into checkins when saved). */
  coach_note?: string | null;
  source?: string;
  /** Epoch ms stamp for sync (newest scalar wins). */
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

/** True when both intake and burn are present and intake < burn. */
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
