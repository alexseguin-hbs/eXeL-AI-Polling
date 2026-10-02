/**
 * Financial-2525 · PUT BACK THE OPERATOR'S ENTRIES (r.053, addenda 106 · 110: "Where are my inputted transactions" · "now enter my
 * transactions back in"). His record lived only on one browser's storage and he lost sight of it (a private tab, a sign-out). These
 * are his two deposits exactly as his Transaction Record showed them (addendum 89, his pasted table); the −250.66 withdrawal's day,
 * time and length were never on a screen he sent, so it is not invented here — the form opens with its amount and field for him to
 * finish. Offered only to his signed-in account and only while his record on this device is empty; appending never removes anything.
 * Pure: no React, no clock.
 */
import type { FinTx } from "./accrual";
import { parseStampCST } from "./mot";

export const OPERATOR_EMAIL = "explore@exel-ai.com";
export const isOperator = (email: string | null | undefined): boolean => (email ?? "").trim().toLowerCase() === OPERATOR_EMAIL;

/** His two deposits, as recorded (Monthly = the 30-day month at replay, the month law). */
export function operatorDeposits(): FinTx[] {
  const d1 = parseStampCST("2026.09.30_19.54..35"), d2 = parseStampCST("2026.09.30_19.56..04");
  if (d1 === null || d2 === null) return [];
  return [
    { id: `d-${d1}-360449-1`, kind: "deposit", amountCents: 360449, atMs: d1, motDays: 30, memo: "State of Texas", field: "A.income_wages", recurrence: "paymot" },
    { id: `d-${d2}-32000-2`, kind: "deposit", amountCents: 32000, atMs: d2, motDays: 30, memo: "PROMISSORY NOTE", field: "A.upside", recurrence: "paymot" },
  ];
}
/** The withdrawal he recorded, as far as his screens showed it: the form is prefilled with these; the day, time and length are his. */
export const OPERATOR_WITHDRAWAL = { amount: "250.66", section: "D", field: "D.auto_renters_home" } as const;
