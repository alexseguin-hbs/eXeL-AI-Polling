/**
 * Financial-2525 · THE PERSON'S PLAN (r.016, operator addendum 28 "add edit mode and icon on budget mode").
 * ------------------------------------------------------------------------------------------------------
 * The budget on the ladder starts as the sheet (budget.ts SHEET_LINES). In EDIT mode the person makes it theirs: an amount per
 * line entered in the unit they have picked and STORED ON THE 33-DAY BASE (the sheet's period, FD-25's fixed factors), a line
 * removed, a line added on any FLOW field A–M (one line per field; N–T never — they live on the Balance view, never per period).
 * The plan is saved on the device under the person's own key (the record's scope, FD-18 — the cloud copy follows the login);
 * Reset returns to the sheet. Pure: no React, no clock; the surface reads these and nothing else decides a figure.
 */
import { SHEET_LINES } from "./budget";
import { fieldOf, toPeriod, type LadderLine, type Period } from "./ladder";

const PREFIX = "fin-plan-";
export const planKey = (owner: string) => `${PREFIX}${owner}`;
export const BASE: Period = "days33";

/** The person's saved plan, or null when the device holds none (then the sheet is the plan). A malformed copy reads as none. */
export function loadPlan(owner: string): LadderLine[] | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(planKey(owner)) : null;
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return null;
    const lines = v.filter((l): l is LadderLine => !!l && typeof l === "object" && typeof (l as LadderLine).fieldId === "string" && Number.isFinite((l as LadderLine).amountNative) && (l as LadderLine).nativePeriod === BASE && !!fieldOf((l as LadderLine).fieldId));
    return lines;
  } catch { return null; }
}
export function savePlan(owner: string, lines: readonly LadderLine[]): boolean {
  try { if (typeof localStorage === "undefined") return false; localStorage.setItem(planKey(owner), JSON.stringify(lines)); return true; } catch { return false; }
}
export function clearPlan(owner: string): void { try { localStorage.removeItem(planKey(owner)); } catch { /* nothing to clear */ } }
/** The sheet as a fresh, editable plan (never the shared constant). */
export const sheetPlan = (): LadderLine[] => SHEET_LINES.map((l) => ({ ...l }));
export const planOrSheet = (saved: LadderLine[] | null): LadderLine[] => (saved && saved.length ? saved : sheetPlan());

/** A line's amount, set from a figure typed in the unit on the glass; stored on the 33-day base. NaN or a negative figure
 *  changes nothing (a refusal, never a zero written by accident). */
export function setLineAmount(lines: readonly LadderLine[], fieldId: string, amountInUnit: number, unit: Period): LadderLine[] {
  if (!Number.isFinite(amountInUnit) || amountInUnit < 0) return [...lines];
  const base = toPeriod(amountInUnit, unit, BASE);
  return lines.map((l) => (l.fieldId === fieldId ? { ...l, amountNative: base, nativePeriod: BASE } : l));
}
/** Add a FLOW field (A–M) with a zero amount; one line per field; N–T and unknown ids are refused (unchanged copy). */
export function addLine(lines: readonly LadderLine[], fieldId: string): LadderLine[] {
  const f = fieldOf(fieldId);
  if (!f || f.plane !== "flow" || lines.some((l) => l.fieldId === fieldId)) return [...lines];
  return [...lines, { fieldId, amountNative: 0, nativePeriod: BASE }];
}
export function removeLine(lines: readonly LadderLine[], fieldId: string): LadderLine[] { return lines.filter((l) => l.fieldId !== fieldId); }
/** What a line reads in the unit on the glass (the inverse of setLineAmount, to the cent). */
export const lineInUnit = (l: LadderLine, unit: Period): number => Math.round(toPeriod(l.amountNative, l.nativePeriod, unit) * 100) / 100;
