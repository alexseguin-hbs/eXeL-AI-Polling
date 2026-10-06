/**
 * Fitness-2525 · day-log edits (AsM #14): meals, manual workouts, deletions with tombstones.
 * Pure functions on FitDay. Never invent numbers: blank inputs stay null and do not count toward totals.
 */
import type { FitDay, FitMeal, FitWorkout } from "./types";

export const newId = (prefix: string): string => {
  const r = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${r}`;
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export interface MealTotals { kcal: number | null; carbs_g: number | null; sugar_g: number | null; protein_g: number | null; fat_g: number | null }

/** Sum each macro over meals that have it; a macro no meal logged stays null (not 0). */
export function mealTotals(meals: FitMeal[] | undefined): MealTotals {
  const out: MealTotals = { kcal: null, carbs_g: null, sugar_g: null, protein_g: null, fat_g: null };
  for (const m of meals ?? []) {
    for (const k of Object.keys(out) as (keyof MealTotals)[]) {
      const v = num(m[k]);
      if (v != null) out[k] = (out[k] ?? 0) + v;
    }
  }
  for (const k of Object.keys(out) as (keyof MealTotals)[]) if (out[k] != null) out[k] = Math.round(out[k]! * 10) / 10;
  return out;
}

/** Meals with kcal / sugar drive calories_in / sugar_out_g; with none logged the typed day values stand. */
export function withMealTotals(day: FitDay): FitDay {
  const t = mealTotals(day.meals);
  return {
    ...day,
    calories_in: t.kcal != null ? Math.round(t.kcal) : day.calories_in ?? null,
    sugar_out_g: t.sugar_g != null ? t.sugar_g : day.sugar_out_g ?? null,
  };
}

/** Remove tombstoned items (workouts, meals, check-ins). */
export function applyTombstones(day: FitDay): FitDay {
  const dead = day.deleted ?? {};
  if (!Object.keys(dead).length) return day;
  const alive = <T extends { id: string }>(xs: T[] | undefined) => (xs ?? []).filter((x) => !(x && dead[x.id]));
  const recovery = { ...(day.recovery ?? {}) };
  for (const id of Object.keys(dead)) delete recovery[id];
  return { ...day, workouts: alive(day.workouts), checkins: alive(day.checkins), meals: alive(day.meals), recovery };
}

export function addMeal(day: FitDay, meal: Omit<FitMeal, "id" | "at"> & { id?: string }, now = Date.now()): FitDay {
  const m: FitMeal = {
    id: meal.id || newId("meal"),
    name: meal.name?.trim() || undefined,
    time: meal.time || undefined,
    kcal: num(meal.kcal), carbs_g: num(meal.carbs_g), sugar_g: num(meal.sugar_g), protein_g: num(meal.protein_g), fat_g: num(meal.fat_g),
    at: now,
  };
  return withMealTotals({ ...day, meals: [...(day.meals ?? []), m] });
}

export function addWorkout(day: FitDay, w: Omit<FitWorkout, "id"> & { id?: string }): FitDay {
  const wk: FitWorkout = { ...w, id: w.id || newId("w"), status: w.status ?? "completed", calories: num(w.calories), minutes: num(w.minutes) };
  return { ...day, workouts: [...day.workouts, wk] };
}

/** Delete any workout / meal / check-in by id and leave a tombstone so a merge cannot resurrect it. */
export function deleteItem(day: FitDay, id: string, now = Date.now()): FitDay {
  const before = mealTotals(day.meals);
  const next = applyTombstones({ ...day, deleted: { ...(day.deleted ?? {}), [id]: now } });
  // Values that came from the meal log follow it (deleting the last kcal meal blanks calories in again).
  if (before.kcal != null && day.calories_in === Math.round(before.kcal)) next.calories_in = null;
  if (before.sugar_g != null && day.sugar_out_g === before.sugar_g) next.sugar_out_g = null;
  return withMealTotals(next);
}

export const clampRating = (n: number | null): number | null => (n == null ? null : Math.min(10, Math.max(1, Math.round(n))));
