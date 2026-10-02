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
/** THE OPERATOR'S OWN BUDGET (r.053, addenda 104–105: his 8:50 screenshot — "3924.24 is income plus 320; use that image" · "get
 *  numbers from revision before you update with out my knowledge"). Every line exactly as he typed it, the SAME dollars per month
 *  (addendum 103 "the dollar amount does not change"); his own corrections of 7:14 (addendum 111 "here are numbers on budget; I already
 *  fixed. HI IS BETTER"): Fitness & Health 270.00 · Subscriptions 89.73 — Income 3,924.49 · Fixed 1,310.39 · Variable 1,140.00 · Net 1,474.10. */
export const HIS_BUDGET: readonly { fieldId: string; dollars: number }[] = [
  { fieldId: "A.income_wages", dollars: 3604.49 }, { fieldId: "A.upside", dollars: 320.0 },
  { fieldId: "B.rent_mortgage", dollars: 700.0 }, { fieldId: "D.auto_renters_home", dollars: 250.66 }, { fieldId: "G.mental_physical", dollars: 270.0 }, { fieldId: "E.subscriptions_ai_cloud", dollars: 89.73 },
  { fieldId: "E.electric_gas", dollars: 150.0 }, { fieldId: "F.groceries", dollars: 500.0 }, { fieldId: "L.fun_hobbies_clothing", dollars: 100.0 }, { fieldId: "F.dining_work", dollars: 150.0 }, { fieldId: "L.gifts_holidays_travel", dollars: 240.0 },
];
/** A budget saved per 33 days reads back exactly as r.052 showed it — the screen he confirmed (addendum 116, 7:22: Fixed 1,671.37 ·
 *  Variable 1,140.00 · Net 1,113.12) under "STOP WORKING BUDGET (I FIXED ALREADY)" (addendum 114): no revision changes a figure he sees. */
export const SHOWN_MONTH_DAYS = 91 / 3;
export const shownMonthly = (per33: number): number => (per33 * SHOWN_MONTH_DAYS) / 33;
export const SHEET_LINES: readonly LadderLine[] = HIS_BUDGET.map((l) => ({ fieldId: l.fieldId, amountNative: l.dollars, nativePeriod: "month" as const }));
