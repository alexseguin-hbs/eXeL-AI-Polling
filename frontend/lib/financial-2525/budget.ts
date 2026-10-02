/**
 * Financial-2525 · the personal budget in $/min and $/sec (operator 2026-09-30, addendum 3, v.000_r.001).
 * ====================================================================================================
 * "For personal MoT financial pilot expenses are Income, Fixed / Variable, from there Home, Auto, Insurance, Utilities,
 *  Fitness, Fun, Groceries, Dining Out, and other basic budgeting items. This will allow personal budget to $/min, $/sec
 *  (using MoT that converts to Hour, Min, Second)."
 *
 * A budget line is an amount per MoT (the sheet's month = 33 days; the pay MoT = 30.333). Every line, and the net, is
 * re-expressed per day · hour · minute · second and per LTU unit (D · W · M33 · Q99 · Y365) — the sheet's
 * 144 $/D = 0.1 $/m · 1,008 $/W · 4,752 $/M33 · 14,256 $/Q99 ladder. The seed figures below are the operator's own sheet
 * (Home 700 F · Car 1,800 F · Insurance 200 F · Electric 150 V · Food 300 V · Fitness 50 F · Fun 200 V · Income 3,200 F),
 * kept as DATA the person edits, never as advice. Pure; no clock reads.
 */
import { perDay, perHour, perMin, perSec, perUnit, type LtuUnit } from "./mot";
import type { LadderLine } from "./ladder";

export type BudgetKind = "income" | "fixed" | "variable";
export type BudgetCategory = "Income" | "Home" | "Auto" | "Insurance" | "Utilities" | "Fitness" | "Fun" | "Groceries" | "Dining Out" | "Other";
export const BUDGET_CATEGORIES: readonly BudgetCategory[] = ["Income", "Home", "Auto", "Insurance", "Utilities", "Fitness", "Fun", "Groceries", "Dining Out", "Other"];
export interface BudgetLine { id: string; category: BudgetCategory; kind: BudgetKind; amountCents: number; label?: string }
/** The kind of every category (the sheet's F / V columns; Income is its own kind) — the dropdown on the transaction forms
 *  groups by it (addendum 16: "fixed · variable · income · Mortgage/Rent · Auto · Insurance · etc"). */
export const CATEGORY_KIND: Record<BudgetCategory, BudgetKind> = {
  Income: "income", Home: "fixed", Auto: "fixed", Insurance: "fixed", Fitness: "fixed",
  Utilities: "variable", Fun: "variable", Groceries: "variable", "Dining Out": "variable", Other: "variable",
};
export const BUDGET_KINDS: readonly BudgetKind[] = ["income", "fixed", "variable"];
/** The dropdown's groups, in the operator's order: income, then fixed, then variable. */
export const TRANSACTION_CATEGORIES: readonly { kind: BudgetKind; categories: BudgetCategory[] }[] =
  BUDGET_KINDS.map((kind) => ({ kind, categories: BUDGET_CATEGORIES.filter((c) => CATEGORY_KIND[c] === kind) }));

/** The operator's sheet, as seed data per 33-day month (F = fixed, V = variable). */
export const SHEET_BUDGET: readonly BudgetLine[] = [
  { id: "income", category: "Income", kind: "income", amountCents: 320000, label: "Income 3,200 F" },
  { id: "home", category: "Home", kind: "fixed", amountCents: 70000, label: "Home 700 F" },
  { id: "auto", category: "Auto", kind: "fixed", amountCents: 180000, label: "Car 1,800 F" },
  { id: "insurance", category: "Insurance", kind: "fixed", amountCents: 20000, label: "Insurance 200 F" },
  { id: "utilities", category: "Utilities", kind: "variable", amountCents: 15000, label: "Electric 150 V" },
  { id: "groceries", category: "Groceries", kind: "variable", amountCents: 30000, label: "Food 300 V" },
  { id: "fitness", category: "Fitness", kind: "fixed", amountCents: 5000, label: "Fitness 50 F" },
  { id: "fun", category: "Fun", kind: "variable", amountCents: 20000, label: "Fun 200 V" },
];
export const SHEET_MONTH_DAYS = 33;

export interface RateLadder { perDay: number; perHour: number; perMin: number; perSec: number; D: number; W: number; M: number; Q: number; Y: number }
/** One amount over `days`, on every rung of the ladder (cents). */
export function ladder(amountCents: number, days: number): RateLadder {
  const u = (x: LtuUnit) => perUnit(amountCents, days, x);
  return { perDay: perDay(amountCents, days), perHour: perHour(amountCents, days), perMin: perMin(amountCents, days), perSec: perSec(amountCents, days), D: u("D"), W: u("W"), M: u("M"), Q: u("Q"), Y: u("Y") };
}

export interface BudgetSummary {
  incomeCents: number; fixedCents: number; variableCents: number; expenseCents: number; netCents: number;
  income: RateLadder; expense: RateLadder; net: RateLadder; lines: (BudgetLine & { ladder: RateLadder })[];
}
/** The whole budget over its MoT (days): totals, net, and every line on the ladder — the sheet's "$/D: 144 → 138 → 137". */
export function summarize(lines: readonly BudgetLine[], days: number): BudgetSummary {
  const sum = (k: BudgetKind) => lines.filter((l) => l.kind === k).reduce((s, l) => s + Math.max(0, l.amountCents), 0);
  const incomeCents = sum("income"), fixedCents = sum("fixed"), variableCents = sum("variable");
  const expenseCents = fixedCents + variableCents, netCents = incomeCents - expenseCents;
  return {
    incomeCents, fixedCents, variableCents, expenseCents, netCents,
    income: ladder(incomeCents, days), expense: ladder(expenseCents, days), net: ladder(netCents, days),
    lines: lines.map((l) => ({ ...l, ladder: ladder(l.amountCents, days) })),
  };
}

/** r.012 (addendum 22): the sheet's eight lines on the A–U ladder — the one bridge from the r.001 categories to the brief's fields.
 *  Income → A.income_wages · Home → B.rent_mortgage · Car → C.auto_payment · Insurance → D.auto_renters_home · Electric →
 *  E.electric_gas · Food → F.groceries · Fitness → G.mental_physical · Fun → L.fun_hobbies_clothing; the old categories stay for
 *  the record's `category` (r.006–r.011 entries are never rewritten). */
export const CATEGORY_FIELD: Record<BudgetCategory, string> = {
  Income: "A.income_wages", Home: "B.rent_mortgage", Auto: "C.auto_payment", Insurance: "D.auto_renters_home", Utilities: "E.electric_gas",
  Fitness: "G.mental_physical", Fun: "L.fun_hobbies_clothing", Groceries: "F.groceries", "Dining Out": "F.dining_work", Other: "L.fun_hobbies_clothing",
};
/** The 30.3̅-day month the operator approved his budget in (r.020–r.045); a plan saved then is read through it (r.052). */
export const APPROVED_MONTH_DAYS = 91 / 3;
/** Dollars per 33 days → the dollars per month the operator approved (shown at the 30.3̅-day month). Kept unrounded, exactly as his
 *  screen computed them, so every line AND every total reads what he approved (Variable 597.47, Net −183.84 — addendum 103's
 *  screenshot), not a sum of rounded lines a cent away. Pure. */
export const approvedMonthly = (per33: number): number => (per33 * APPROVED_MONTH_DAYS) / 33;
/** The sheet as ladder lines, PER MONTH (r.052, addendum 103: "see fixed expenses I already approved amounts and reestablish. I
 *  asked to change rate of accrual from 30.3 to 30, . the dollar amount does not change"): the dollars he approved per month —
 *  Rent 643.43 · Car 1,654.55 · Insurance 183.84 · Fitness 45.96 · Electricity 137.88 · Groceries 275.76 · Fun 183.84 · Wages
 *  2,941.41 — are the 30-day month's dollars now; the month's length changed, the dollars did not. */
export const SHEET_LINES: readonly LadderLine[] = SHEET_BUDGET.map((l) => ({ fieldId: CATEGORY_FIELD[l.category], amountNative: approvedMonthly(l.amountCents / 100), nativePeriod: "month" as const }));
