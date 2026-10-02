/**
 * Financial-2525 · THE PERSON'S PLAN (r.016, operator addendum 28 "add edit mode and icon on budget mode").
 * ------------------------------------------------------------------------------------------------------
 * The budget on the ladder starts as the sheet (budget.ts SHEET_LINES). In EDIT mode the person makes it theirs: an amount per
 * line entered in the unit they have picked and STORED ON THE 33-DAY BASE (the sheet's period, FD-25's fixed factors), a line
 * removed, a line added on any FLOW field A–M (one line per field; N–T never — they live on the Balance view, never per period).
 * The plan is saved on the device under the person's own key (the record's scope, FD-18 — the cloud copy follows the login);
 * Reset returns to the sheet. Pure: no React, no clock; the surface reads these and nothing else decides a figure.
 *
 * r.024 (operator addenda 48 · 50 · 55: "don't change budget inplementetion; this is way too complicated and I never asked for it" ·
 * "use selects deop down once for budget in edit mode"): the r.021–r.022 per-line MoT (lineSpec · setLineSpec · switchRec ·
 * isValidSpec) is removed and this file is r.020's again — ONE shared unit, the amount typed in it. A copy saved by r.021–r.022
 * still loads: its amountNative is already on the 33-day base; the extra fields it carries are ignored.
 */
import { SHEET_LINES, approvedMonthly } from "./budget";
import { fieldOf, toPeriod, type LadderLine, type Period } from "./ladder";

const PREFIX = "fin-plan-";
export const planKey = (owner: string) => `${PREFIX}${owner}`;
/** r.052 (addendum 103 "wheres my edit button"): signed out, the plan is this phone's own. */
export const DEVICE_OWNER = "device";
/** r.052 (addendum 103): the plan is stored PER MONTH — the dollars the person typed for a month stay those dollars whatever the
 *  month's length becomes. A plan saved on the old 33-day base is read back as the per-month dollars it showed (the 30.3̅-day month). */
export const BASE: Period = "month";
const fromSaved = (l: LadderLine): LadderLine | null => (l.nativePeriod === BASE ? l : l.nativePeriod === "days33" ? { ...l, amountNative: approvedMonthly(l.amountNative), nativePeriod: BASE } : null);

/** The person's saved plan, or null when the device holds none (then the sheet is the plan). A malformed copy reads as none. */
export function loadPlan(owner: string): LadderLine[] | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(planKey(owner)) : null;
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return null;
    const lines = v.filter((l): l is LadderLine => !!l && typeof l === "object" && typeof (l as LadderLine).fieldId === "string" && Number.isFinite((l as LadderLine).amountNative) && !!fieldOf((l as LadderLine).fieldId)).map(fromSaved).filter((l): l is LadderLine => l !== null);
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
