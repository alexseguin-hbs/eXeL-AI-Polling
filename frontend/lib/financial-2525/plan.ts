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
import { fieldOf, toPeriod, lengthDays, RECURRENCES, LENGTH_UNITS, type LadderLine, type Period, type Recurrence, type LengthUnit } from "./ladder";

/** EVERY LINE CARRIES ITS OWN MoT (r.021, operator addendum 35 "on input of transaction or budget, must be able to specify time (MoT
 *  of transaction)"): a line keeps the amount the person typed and the length it covers — the transaction form's presets, One time
 *  excepted (a budget line is a rate), with Other as a number in years · days · hours · minutes — e.g. Insurance $1,200 Yearly. The
 *  ladder still reads the line on the 33-day base (amountNative), so every table, group and Net is unchanged in kind. */
export interface PlanLine extends LadderLine { amount?: number; rec?: Recurrence; otherN?: number; otherUnit?: LengthUnit }
export interface LineSpec { amount: number; rec: Recurrence; otherN: number; otherUnit: LengthUnit }
export const BUDGET_RECURRENCES: readonly Recurrence[] = RECURRENCES.filter((r) => r !== "once");
const specDays = (s: LineSpec) => lengthDays(s.rec, s.otherN, s.otherUnit);
const specOk = (s: LineSpec) => Number.isFinite(s.amount) && s.amount >= 0 && BUDGET_RECURRENCES.includes(s.rec) && LENGTH_UNITS.includes(s.otherUnit) && Number.isFinite(specDays(s)) && specDays(s) > 0;
/** The line as the person typed it; a line with no spec (the sheet, an r.016–r.020 copy) reads as its 33-day figure, every 33 days. */
export function lineSpec(l: PlanLine): LineSpec {
  const s: LineSpec = { amount: Number(l.amount), rec: l.rec as Recurrence, otherN: Number(l.otherN ?? 0), otherUnit: (l.otherUnit ?? "days") as LengthUnit };
  if (l.rec !== undefined && specOk(s)) return s;
  return { amount: Math.round(toPeriod(l.amountNative, l.nativePeriod, "days33") * 100) / 100, rec: "days33", otherN: 0, otherUnit: "days" };
}
/** Set a line from what the person typed — its amount and its MoT; kept as typed, read on the 33-day base. A negative or non-number
 *  amount, One time, or a zero-length Other changes nothing (a refusal, never a wrong rate written by accident). */
export function setLineSpec(lines: readonly PlanLine[], fieldId: string, spec: LineSpec): PlanLine[] {
  if (!specOk(spec)) return [...lines];
  const base = (spec.amount * 33) / specDays(spec);
  return lines.map((l) => (l.fieldId === fieldId ? { ...l, amountNative: base, nativePeriod: BASE, amount: spec.amount, rec: spec.rec, otherN: spec.otherN, otherUnit: spec.otherUnit } : l));
}

const PREFIX = "fin-plan-";
const cleanSpec = (l: PlanLine): PlanLine => { if (l.rec === undefined) return l; const s = { amount: Number(l.amount), rec: l.rec, otherN: Number(l.otherN ?? 0), otherUnit: (l.otherUnit ?? "days") as LengthUnit }; if (specOk(s)) return l; const { amount: _a, rec: _r, otherN: _n, otherUnit: _u, ...bare } = l; return bare; };
export const planKey = (owner: string) => `${PREFIX}${owner}`;
export const BASE: Period = "days33";

/** The person's saved plan, or null when the device holds none (then the sheet is the plan). A malformed copy reads as none. */
export function loadPlan(owner: string): PlanLine[] | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(planKey(owner)) : null;
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return null;
    const lines = v.filter((l): l is LadderLine => !!l && typeof l === "object" && typeof (l as LadderLine).fieldId === "string" && Number.isFinite((l as LadderLine).amountNative) && (l as LadderLine).nativePeriod === BASE && !!fieldOf((l as LadderLine).fieldId)).map((l) => cleanSpec(l as PlanLine));
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
/** Add a FLOW field (A–M) — with its amount and MoT when given (r.021), else a zero amount; one line per field; N–T and unknown ids
 *  are refused (unchanged copy). */
export function addLine(lines: readonly PlanLine[], fieldId: string, spec?: LineSpec): PlanLine[] {
  const f = fieldOf(fieldId);
  if (!f || f.plane !== "flow" || lines.some((l) => l.fieldId === fieldId)) return [...lines];
  const added: PlanLine[] = [...lines, { fieldId, amountNative: 0, nativePeriod: BASE }];
  return spec && specOk(spec) ? setLineSpec(added, fieldId, spec) : added;
}
export function removeLine(lines: readonly LadderLine[], fieldId: string): LadderLine[] { return lines.filter((l) => l.fieldId !== fieldId); }
/** What a line reads in the unit on the glass (the inverse of setLineAmount, to the cent). */
export const lineInUnit = (l: LadderLine, unit: Period): number => Math.round(toPeriod(l.amountNative, l.nativePeriod, unit) * 100) / 100;
