/**
 * Fitness-2525 · cloud copy via innovation_state_* RPCs (same store as Financial-2525).
 *
 * Owner key: SHA-256 hex of `fit2525:` + Auth0 user.sub (mirrors fin2525:).
 * Namespaces: fit-day-YYYY-MM-DD · fit-index.
 * Never throws; no Supabase env → "offline", the device copy stands.
 * Merges: scalars from the newest `at` win; workouts[] / checkins[] are unioned by id — nothing is deleted.
 */
import { supabase } from "../supabase";
import type { FitCheckin, FitDay, FitIndex, FitWorkout } from "./types";
import { FIT_INDEX_NAME, dayNamespace } from "./types";

export type CloudState = "off" | "saving" | "saved" | "offline" | "error";
export const PUSH_EVERY_MS = 12 * 3600 * 1000;
export const LAST_PUSH_KEY = "fit-cloud-last";
export const DEVICE_DAY_KEY = "fit2525-day";
export const DEVICE_INDEX_KEY = "fit2525-index";

export async function ownerKeyFor(accountId: string): Promise<string | null> {
  try {
    if (!accountId || typeof crypto === "undefined" || !crypto.subtle) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`fit2525:${accountId}`));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

export async function cloudPut(owner: string, name: string, payload: unknown): Promise<CloudState> {
  if (!supabase) return "offline";
  try {
    const { error } = await supabase.rpc("innovation_state_put", { p_owner: owner, p_name: name, p_payload: payload });
    return error ? "error" : "saved";
  } catch {
    return "offline";
  }
}

export async function cloudGet<T>(owner: string, name: string): Promise<T | null> {
  return (await cloudRead<T>(owner, name)).data;
}

/** A read that says whether it was READ: "ok" with the row (null when none), or "offline" / "error". */
export async function cloudRead<T>(
  owner: string,
  name: string,
): Promise<{ state: "ok" | "off" | "offline" | "error"; data: T | null }> {
  if (!supabase) return { state: "off", data: null };
  try {
    const { data, error } = await supabase.rpc("innovation_state_get", { p_owner: owner, p_name: name });
    return error ? { state: "error", data: null } : { state: "ok", data: (data ?? null) as T | null };
  } catch {
    return { state: "offline", data: null };
  }
}

export const nextStamp = (seen: number, now: number): number => Math.max(now, (Number.isFinite(seen) ? seen : 0) + 1);

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items) {
    if (it && typeof it.id === "string" && it.id) m.set(it.id, it);
  }
  return m;
}

/** Union workouts/checkins by id (both sides kept); scalars from the newer `at` win. Pure. */
export function mergeFitDays(a: FitDay, b: FitDay | null): FitDay {
  if (!b) return a;
  const newer = (a.at ?? 0) >= (b.at ?? 0) ? a : b;
  const older = newer === a ? b : a;
  const workouts = byId<FitWorkout>([...(older.workouts ?? []), ...(newer.workouts ?? [])]);
  const checkins = byId<FitCheckin>([...(older.checkins ?? []), ...(newer.checkins ?? [])]);
  return {
    v: 1,
    date: newer.date || older.date,
    tz: newer.tz ?? older.tz,
    weight: newer.weight !== undefined ? newer.weight : older.weight,
    steps: newer.steps !== undefined && newer.steps !== null ? newer.steps : older.steps ?? null,
    calories_in:
      newer.calories_in !== undefined ? newer.calories_in : older.calories_in ?? null,
    calories_out:
      newer.calories_out !== undefined ? newer.calories_out : older.calories_out ?? null,
    workouts: Array.from(workouts.values()),
    checkins: Array.from(checkins.values()),
    deficit_note: newer.deficit_note ?? older.deficit_note,
    energy_cost_per_kcal: newer.energy_cost_per_kcal !== undefined ? newer.energy_cost_per_kcal : older.energy_cost_per_kcal ?? null,
    height_cm: newer.height_cm !== undefined ? newer.height_cm : older.height_cm ?? null,
    age_yr: newer.age_yr !== undefined ? newer.age_yr : older.age_yr ?? null,
    sex: newer.sex !== undefined ? newer.sex : older.sex ?? null,
    sugar_out_g: newer.sugar_out_g !== undefined ? newer.sugar_out_g : older.sugar_out_g ?? null,
    window_intake_kcal: { ...(older.window_intake_kcal ?? {}), ...(newer.window_intake_kcal ?? {}) },
    day_type: newer.day_type !== undefined ? newer.day_type : older.day_type ?? null,
    coach_note: newer.coach_note !== undefined ? newer.coach_note : older.coach_note ?? null,
    source: newer.source ?? older.source,
    at: Math.max(a.at ?? 0, b.at ?? 0),
  };
}

export function mergeFitIndex(local: FitIndex, remote: FitIndex | null): FitIndex {
  const set = new Set<string>([...(local.days ?? []), ...((remote?.days) ?? [])]);
  const days = Array.from(set).filter(Boolean).sort();
  return { days, at: Math.max(local.at ?? 0, remote?.at ?? 0) };
}

export async function readDay(owner: string, date: string) {
  return cloudRead<FitDay>(owner, dayNamespace(date));
}

export async function readIndex(owner: string) {
  return cloudRead<FitIndex>(owner, FIT_INDEX_NAME);
}

export async function putDay(owner: string, day: FitDay): Promise<CloudState> {
  return cloudPut(owner, dayNamespace(day.date), day);
}

export async function putIndex(owner: string, index: FitIndex): Promise<CloudState> {
  return cloudPut(owner, FIT_INDEX_NAME, index);
}
