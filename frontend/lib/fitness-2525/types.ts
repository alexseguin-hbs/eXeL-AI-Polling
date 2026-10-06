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

/**
 * One leg of a multi-leg window (e.g. Ironman swim 2.4 mi · bike 112 mi · run 26.2 mi).
 * Burn is modeled per leg from Compendium METs × profile weight × duration unless the device logged kcal.
 * Intake plan fields are optional and only filled from a fueling plan — never invented.
 */
export interface FitWorkoutLeg {
  id: string;
  sport: string; // swim | bike | run | transition …
  minutes?: number | null;
  distance?: FitDistance | null;
  met?: number | null; // override the Compendium MET for this leg
  calories?: number | null; // device kcal for this leg (subtotal)
  carb_g_per_hr?: number | null; // planned CHO rate (ACSM/ISSN ranges)
  fluid_ml_per_hr?: number | null;
  sodium_mg_per_hr?: number | null;
  consumed_kcal?: number | null; // logged intake during the leg
  status?: FitWorkoutStatus;
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
  /** Multi-leg window (race / brick). When present, burn and fueling are accrued per leg. */
  legs?: FitWorkoutLeg[] | null;
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
  /** Daily weigh-ins (never prefilled). Trend uses MORNING only. */
  weigh_ins?: FitWeighIns | null;
  /** Post-workout recovery + hydration log keyed by workout id. */
  recovery?: Record<string, FitRecovery>;
  /** Sleep hours (logged the next morning). */
  sleep_hrs?: number | null;
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

// ── Athlete profile (fit-profile record) ────────────────────────────────
export type FitUnitSystem = "imperial" | "metric";
export type FitRateUnitSetting = "per_hr" | "per_min" | "per_sec";
export type FitFluidUnit = "oz" | "ml";

export interface FitFluid {
  value: number;
  unit: FitFluidUnit;
}

export interface FitProfileSettings {
  rate_unit?: FitRateUnitSetting;
  show_all_rates?: boolean;
}

export interface FitProfile {
  v: 1;
  name?: string | null;
  sex?: FitSex | null;
  age_yr?: number | null;
  /** Height in the profile unit system: inches (imperial) or cm (metric). */
  height?: number | null;
  units: FitUnitSystem;
  resting_hr?: number | null;
  /** Goal weight in profile units (lb or kg). */
  goal_weight?: number | null;
  goal_date?: string | null;
  settings?: FitProfileSettings;
  at: number;
}

export const FIT_PROFILE_NAME = "fit-profile";

export interface FitWeighIns {
  /** Fasted morning weight — the ONLY weight used for the goal trend + BMR. */
  morning?: FitWeight | null;
  evening?: FitWeight | null;
}

export interface FitRecovery {
  session_id: string;
  pre_weight?: FitWeight | null;
  post_weight?: FitWeight | null;
  fluids?: FitFluid | null;
  rpe?: number | null;
  soreness?: number | null;
  feel?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fuel_done?: boolean;
  notes?: string;
  at: number;
}
