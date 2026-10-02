/**
 * Financial-2525 · WHAT A PERSON TYPES (r.073, round 1 of 33 — the reviewer lenses found the form and the pencil reading "Infinity",
 * "1e400" and "0x10" as money and refusing "1,234.56" and "$50"). ONE reader for the amount on every form, so a typed figure means
 * on the record exactly what it meant on the screen:
 *  · digits with at most two decimals ("50", "50.", "50.5", ".55"); thousands commas only where they group thousands ("1,234.56");
 *    the currency's own mark or "$" in front is allowed ("$50", "R$ 12.00");
 *  · never an exponent, a hex number, Infinity, a sign, or a comma that is not a thousands separator ("12,50" is refused — never
 *    read as 1,250);
 *  · above zero and below one trillion in the currency (a ceiling no person's budget reaches; every figure stays exact in cents).
 * Pure; returns cents, or null.
 */
export const MAX_AMOUNT_CENTS = 99_999_999_999_999;   // 999,999,999,999.99 — below one trillion
/** The typed text without the currency's mark (or "$") in front. */
const unmarked = (text: string, marks: readonly string[]): string => {
  const s = String(text ?? "").trim();
  for (const m of [...marks, "$"].filter(Boolean).sort((a, b) => b.length - a.length)) if (s.startsWith(m)) return s.slice(m.length).trim();
  return s;
};
export function parseAmountCents(text: string, marks: readonly string[] = []): number | null {
  let s = unmarked(text, marks);
  if (/^\d{1,3}(,\d{3})+(\.\d{0,2})?$/.test(s)) s = s.replace(/,/g, "");
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const cents = Number(whole || "0") * 100 + Number((frac + "00").slice(0, 2));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= MAX_AMOUNT_CENTS ? cents : null;
}
/** Why a typed amount was refused: nothing above zero was typed, it was not written as a figure, or (r.073 second pre-push review, Enki:
 *  a trillion was told "enter the amount in digits" although he had typed digits) it is a figure of one trillion or more. Pure. */
export const amountProblem = (text: string, marks: readonly string[] = []): "zero" | "form" | "large" | null => {
  if (parseAmountCents(text, marks) !== null) return null;
  const bare = unmarked(text, marks);
  if (bare === "" || /^0*(\.0*)?$/.test(bare)) return "zero";
  const plain = /^\d{1,3}(,\d{3})+(\.\d{0,2})?$/.test(bare) ? bare.replace(/,/g, "") : bare;
  return /^\d+(\.\d{0,2})?$/.test(plain) && Number(plain) >= 1e12 ? "large" : "form";
};
/** The pencil's length in days: blank = one time (0); otherwise a plain number ≥ 0 — thousands commas allowed where they group thousands,
 *  as in the amount ("1,000"; r.073 second pre-push review, Enki). Returns null for anything else. Pure. */
export function parseDaysText(text: string): number | null {
  let s = String(text ?? "").trim();
  if (s === "") return 0;
  if (/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) s = s.replace(/,/g, "");
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
/** A positive number typed for the form's Other length ("2", "1.5", ".5"); null for blank, zero, negative or anything else. Pure. */
export function parsePositive(text: string): number | null {
  const n = parseDaysText(text);
  return n !== null && n > 0 ? n : null;
}
/** A length the calendar can hold from its date: the end is a real date (r.071: "1e400 years" is refused, never saved as one time). Pure. */
export const lengthFits = (atMs: number, days: number): boolean => Number.isFinite(days) && days >= 0 && Math.abs(atMs + days * 86400000) <= 8.64e15;
/** A budget figure as typed (r.073 pre-push review, Enki: the budget used Number() — "0x10" set a line to 16.00, "1e3" to 1,000.00 and
 *  "1,234.56" was silently not applied): digits, thousands commas only where they group thousands, up to ten decimals (a line per
 *  second is a fraction of a cent — r.073 second review: the box shows as many as it takes to keep the line, see budgetFigure), zero
 *  allowed (an emptied line), below one trillion; the currency mark or "$" may lead. Dollars or null. */
export function parseBudgetAmount(text: string, marks: readonly string[] = []): number | null {
  let s = unmarked(text, marks);
  if (/^\d{1,3}(,\d{3})+(\.\d{0,10})?$/.test(s)) s = s.replace(/,/g, "");
  if (!/^(\d+(\.\d{0,10})?|\.\d{1,10})$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? n : null;
}
/** What a budget line's box shows in edit mode (r.026's rule — retyping the figure shown never moves the line — carried to the smallest
 *  units; r.073 second pre-push review, Enki: a line per second was shown to four decimals, so 0.000039 read "0" and retyping 0.0004 moved
 *  1,000.51 to 1,036.80). A dollar or more: as before (cents from 100, four decimals below). Under a dollar: enough decimals for five
 *  significant digits, at most ten, trailing zeros dropped — never an exponent ("1e-7" would not read back). Pure. */
export function budgetFigure(v: number): string {
  if (!Number.isFinite(v) || v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 100) return String(Math.round(v * 100) / 100);
  if (a >= 1) return String(Math.round(v * 10000) / 10000);
  const shown = v.toFixed(Math.min(10, Math.ceil(-Math.log10(a)) + 4)).replace(/0+$/, "").replace(/\.$/, "");
  return shown === "0" || shown === "-0" ? "0" : shown;
}
/** A budget figure under a dollar on the glass, out of edit mode: four decimals as before, more when four would read 0.0000 (Enki: the
 *  89.73 Subscriptions line read "0" per second) — two significant digits, at most eight decimals. The magnitude only; the caller signs it. */
export const smallDollars = (a: number): string => Math.abs(a).toFixed(Math.max(4, Math.min(8, Math.ceil(-Math.log10(Math.abs(a) || 1)) + 1)));
/** A card figure as typed (limit, levels, balance): an amount, or zero — blank reads as zero (the card form's rule); anything else NaN, which
 *  the card's own check refuses (never an Infinity card that reads 0 after a reload). Cents. */
export const parseCardCents = (text: string, marks: readonly string[] = []): number => {
  const s = unmarked(text, marks);
  return s === "" || /^0*(\.0*)?$/.test(s) ? 0 : parseAmountCents(text, marks) ?? NaN;
};
