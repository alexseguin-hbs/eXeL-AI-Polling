/**
 * Fitness-2525 · energy methodology rates ($/min · $/sec).
 * Cost-of-energy framing: dollars of fuel cost per unit time for burn vs intake.
 * Pure — no invented athlete calories. Rates are null until the athlete supplies
 * both a calorie figure and a $/kcal basis (optional; blank by default).
 */

export type EnergyRateUnit = "per_min" | "per_sec";

export interface EnergyRates {
  /** $/min when both kcal and $/kcal are known; else null. */
  perMin: number | null;
  /** $/sec when both known; else null. */
  perSec: number | null;
  /** Underlying kcal/min when kcal + duration known (chart scaffolding). */
  kcalPerMin: number | null;
  kcalPerSec: number | null;
}

/** Spread `kcal` evenly over `minutes` (>0). Optional `usdPerKcal` yields $/min · $/sec. */
export function ratesFromKcal(
  kcal: number | null | undefined,
  minutes: number | null | undefined,
  usdPerKcal: number | null | undefined,
): EnergyRates {
  const empty: EnergyRates = { perMin: null, perSec: null, kcalPerMin: null, kcalPerSec: null };
  if (typeof kcal !== "number" || !Number.isFinite(kcal) || typeof minutes !== "number" || !(minutes > 0)) {
    return empty;
  }
  const kcalPerMin = kcal / minutes;
  const kcalPerSec = kcalPerMin / 60;
  const cost =
    typeof usdPerKcal === "number" && Number.isFinite(usdPerKcal) && usdPerKcal >= 0 ? usdPerKcal : null;
  return {
    kcalPerMin,
    kcalPerSec,
    perMin: cost != null ? kcalPerMin * cost : null,
    perSec: cost != null ? kcalPerSec * cost : null,
  };
}

/** Day-long intake rate: calories_in spread over 24 h (1440 min). */
export function intakeDayRates(
  caloriesIn: number | null | undefined,
  usdPerKcal: number | null | undefined,
): EnergyRates {
  return ratesFromKcal(caloriesIn, 1440, usdPerKcal);
}

/** Day-long expenditure rate: calories_out over 24 h. */
export function burnDayRates(
  caloriesOut: number | null | undefined,
  usdPerKcal: number | null | undefined,
): EnergyRates {
  return ratesFromKcal(caloriesOut, 1440, usdPerKcal);
}

/** Workout burn: prefer workout.calories over day calories_out; duration from minutes. */
export function workoutBurnRates(
  workoutCalories: number | null | undefined,
  minutes: number | null | undefined,
  usdPerKcal: number | null | undefined,
): EnergyRates {
  return ratesFromKcal(workoutCalories, minutes, usdPerKcal);
}

export function pickRate(r: EnergyRates, unit: EnergyRateUnit): number | null {
  return unit === "per_sec" ? r.perSec : r.perMin;
}

export function formatUsdRate(n: number | null, unit: EnergyRateUnit): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = unit === "per_sec" ? (abs < 0.01 ? 6 : 4) : abs < 0.1 ? 4 : 2;
  return `$${n.toFixed(digits)}/${unit === "per_sec" ? "sec" : "min"}`;
}

export function formatKcalRate(n: number | null, unit: EnergyRateUnit): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(unit === "per_sec" ? 4 : 2)} kcal/${unit === "per_sec" ? "sec" : "min"}`;
}
