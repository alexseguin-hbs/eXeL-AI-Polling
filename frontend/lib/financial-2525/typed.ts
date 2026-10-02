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
/** Why a typed amount was refused: nothing above zero was typed, or it was not written as a figure. Pure. */
export const amountProblem = (text: string, marks: readonly string[] = []): "zero" | "form" | null => {
  if (parseAmountCents(text, marks) !== null) return null;
  const bare = unmarked(text, marks);
  return bare === "" || /^0*(\.0*)?$/.test(bare) ? "zero" : "form";
};
/** The pencil's length in days: blank = one time (0); otherwise a plain number ≥ 0. Returns null for anything else. Pure. */
export function parseDaysText(text: string): number | null {
  const s = String(text ?? "").trim();
  if (s === "") return 0;
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
