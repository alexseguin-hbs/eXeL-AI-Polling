/**
 * Fitness-2525 · energy rates (cal/min · cal/sec · cal/hr). Calories only — no $/kcal.
 * Rates are null until the athlete supplies a calorie figure (never invent defaults).
 */

export type EnergyRateUnit = "per_min" | "per_sec" | "per_hr";

export interface EnergyRates {
  perMin: number | null;
  perSec: number | null;
  perHr: number | null;
}

export function ratesFromKcal(
  kcal: number | null | undefined,
  minutes: number | null | undefined,
): EnergyRates {
  const empty: EnergyRates = { perMin: null, perSec: null, perHr: null };
  if (typeof kcal !== "number" || !Number.isFinite(kcal) || typeof minutes !== "number" || !(minutes > 0)) {
    return empty;
  }
  const perMin = kcal / minutes;
  return { perMin, perSec: perMin / 60, perHr: perMin * 60 };
}

export function intakeDayRates(caloriesIn: number | null | undefined): EnergyRates {
  return ratesFromKcal(caloriesIn, 1440);
}

export function burnDayRates(caloriesOut: number | null | undefined): EnergyRates {
  return ratesFromKcal(caloriesOut, 1440);
}

export function workoutBurnRates(
  workoutCalories: number | null | undefined,
  minutes: number | null | undefined,
): EnergyRates {
  return ratesFromKcal(workoutCalories, minutes);
}

export function pickRate(r: EnergyRates, unit: EnergyRateUnit): number | null {
  if (unit === "per_sec") return r.perSec;
  if (unit === "per_hr") return r.perHr;
  return r.perMin;
}

function unitSuffix(unit: EnergyRateUnit): string {
  if (unit === "per_sec") return "sec";
  if (unit === "per_hr") return "hr";
  return "min";
}

export function formatCalRate(n: number | null, unit: EnergyRateUnit): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = unit === "per_sec" ? (abs < 0.01 ? 4 : 3) : unit === "per_hr" ? (abs < 10 ? 2 : 1) : abs < 1 ? 3 : 2;
  return `${n.toFixed(digits)} cal/${unitSuffix(unit)}`;
}

export function formatKcalRate(n: number | null, unit: EnergyRateUnit): string {
  return formatCalRate(n, unit);
}
