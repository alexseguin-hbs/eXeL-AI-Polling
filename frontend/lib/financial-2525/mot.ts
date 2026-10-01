/**
 * Financial-2525 · MoT — Measure of Time, in A.B..C (operator 2026-09-30, v.000_r.007).
 * ====================================================================================================
 * "A.B..C IS earth length around sun · 1 revolution split to 3600 units · 3600 sub units · 3600 sub sub units"
 * (addendum 10) · "365 days is 3600.0000..0000 which can also be notated 3600. Half year is 365/2 days = 1800 …
 * we use this to translate to day/min/sec … if smaller time splits are needed we use A.B..C…D" (addendum 11,
 * clarified) · "remember 3600 units for mars from perihelion to perihelion… Standard units for all planets are A.B..C
 * · then we convert to hours for earth and LTU for Mars (for now it is hours minutes and seconds)" (addendum 12).
 *
 * THE LAW (r.003 made the whole the REVOLUTION; r.005 pins it — corrections on the record, never edits):
 *   ONE REVOLUTION of the planet around its star, perihelion to perihelion, is split into 3600 A-units; each A into
 *   3600 B; each B into 3600 C; and, below C, 3600 D (written A.BBBB..CCCC...DDDD — declared, not on the glass).
 *   Exactly the celestial UCRS-2525 orbit (lib/ucrs-2525.ts: HU 0 = perihelion, 3600 = a full orbit).
 *   · For EARTH the financial year is the EXACT revolution, 365.259636 days (the anomalistic year, SOURCED) = 3600 A
 *     (also written 3600); half a year, 182.629818 days, = 1800. So ONE A = 8,766.23 s (2 h 26 min), one B = 2.4351 s,
 *     one C = 0.6764 ms, one D = 0.18790 µs. r.007 (addendum 18, "365 should be exact amount 365.25 etc."): r.005 had
 *     pinned EXACTLY 365 days (8,760 s per A, the pay MoT 299.0641..0345) — superseded on the record; r.003's 298.97
 *     A for the pay MoT (91 ÷ 3 days) is the reading again: 298.3475..1826.
 *   · The day · hour · minute · second ladder is DERIVED from the scale (A_PER): one day = 3600 ÷ 365.259636 =
 *     9.3081..2196 A. "24 hr day is split to 3600.3600..3600" is that translation, never a second whole.
 *   · The A.B..C of an INSTANT is its position in the current year: elapsed ÷ 365.259636 d × 3600, NEVER clamped — a
 *     year that runs past the whole reads past 3600 and is flagged (calendar.ts pastFull) until the next perihelion.
 *   · The A.B..C of a LENGTH is days ÷ 365.259636 × 3600, never clamped: two years are 7200.0000..0000.
 *   · Every writing prints its TRUE A (365.259636 d → 3600.0000..0000). "3600.3600..3600 · 3600.0000..0000 · 3599.3599..3599
 *     } Equal" (the sheet) stays a predicate (isFull), never a print substitution.
 *   · The scale never names a planet: Mars' whole is ITS revolution (686.98 Earth days; 668.5991 sols is the same
 *     whole in sols) and its LTU is, FOR NOW, Earth hours · minutes · seconds (FD-16); the per-planet LTU table lives
 *     in the Admin panel (lib/planet-ltu.ts) so a change there adjusts every conversion.
 *
 * Earth LTU here = seconds, minutes, hours, days (Austin, Texas — CST STANDARD, UTC−6, no daylight shift: the
 * operator's fixed rule; lib/ucrs-2525.ts:153 carries the same −6 for Pfield). Timestamps are written
 * YYYY.MM.DD_HH.MM..SS and durations 0000.00.DD_HH.MM..SS, exactly as the sheets write them. The glass defaults to
 * day · hour · minute; A.B..C is a reveal (addendum 8) — the MoT-icon ⇄ Clock-icon toggle (addendum 13).
 * Pure, deterministic, no clock reads.
 */
import { toABC, fmtABC, abcToValue, type ABC } from "@/lib/abc-3600";

export const SUB = 3600;                                  // 3600 units · 3600 sub-units · 3600 sub-sub-units (· 3600 D)
export const CST_OFFSET_MIN = -360;                       // CST standard, never CDT (operator 2026-09-30)
export const SEC_PER_MIN = 60, MIN_PER_HOUR = 60, HOUR_PER_DAY = 24;
export const MIN_PER_DAY = MIN_PER_HOUR * HOUR_PER_DAY;   // 1,440 — the sheet's "1440 m/D"
export const SEC_PER_DAY = MIN_PER_DAY * SEC_PER_MIN;     // 86,400
export const MS_PER_DAY = SEC_PER_DAY * 1000;
/** THE WHOLE for Earth: the financial year is exactly 365 days = 3600 A (operator, addendum 11: "365 days is 3600"). */
/** Earth's mean revolution perihelion to perihelion — the anomalistic year, 365.259636 days (SOURCED: standard
 *  astronomical constant). r.007 (addendum 18, "365 should be exact amount 365.25 etc."): this IS the financial year's
 *  whole — r.005's exact-365 is superseded on the record; r.003 had measured on it. */
export const EARTH_REVOLUTION_DAYS = 365.259636;
export const FINANCIAL_YEAR_DAYS = EARTH_REVOLUTION_DAYS;             // 365.259636 d = 3600 A exactly — one primitive
export const FINANCIAL_YEAR_SEC = FINANCIAL_YEAR_DAYS * SEC_PER_DAY;   // 31,558,432.55 s → one A = 8,766.23 s
export const HALF_YEAR_DAYS = FINANCIAL_YEAR_DAYS / 2;                // 182.629818 d = 1800.0000..0000
/** Mars' revolution as the SAME whole: 686.98 Earth days (= lib/ucrs-2525.ts PLANETS mars.tDays — one primitive) with
 *  Earth hours · minutes · seconds as its LTU for now (FD-16); 668.5991 sols is the same revolution counted in sols
 *  (686.98 ÷ 1.02749), the future form once a 24-unit split of the sol is declared. */
export const MARS_REVOLUTION_EARTH_DAYS = 686.98;
export const MARS_REVOLUTION_SOLS = 668.5991;
export const SOL_SEC = 88775.244;                          // one Martian solar day in SI seconds (SOURCED: 24 h 39 m 35.244 s)
/** The worked example: one third of a 91-day quarter — "pay check example is $ deposit, October 1, 2026 at 07:00, 30.333". */
export const MOT_PAY_MONTH_DAYS = 91 / 3;                 // 30.333…
/** The personal frame the sheets draw in: D · W = 7 · M = 33 · Q = 99 · Y = 365 ("Options – Time Frame", sheet 3).
 *  The Admin panel's LTU table (Month 91 for now) is the ANALYSIS ladder — lib/planet-ltu.ts ltuDays(row). */
export const LTU_DAYS = { D: 1, W: 7, M: 33, Q: 99, Y: 365 } as const;
export type LtuUnit = keyof typeof LTU_DAYS;

export const FULL_ABC: ABC = { a: SUB, b: SUB, c: SUB };
/** The sheet's writing of a whole ("3600.3600..3600 } Equal 3600.0000..0000") — a predicate, never printed for it. */
export const FULL_MOT = "3600.3600..3600";
/** One A · B · C · D of the whole, as fractions of the whole — the derived ladder's own unit (A_PER below). */
export const A_PER = {
  day: SUB / FINANCIAL_YEAR_DAYS,                         // 9.8560 A per Earth day
  hour: SUB / FINANCIAL_YEAR_DAYS / HOUR_PER_DAY,         // 0.41067 A per hour
  min: SUB / FINANCIAL_YEAR_DAYS / MIN_PER_DAY,           // 0.0068445 A per minute
  sec: SUB / FINANCIAL_YEAR_DAYS / SEC_PER_DAY,           // 0.00011407 A per second (1,478 C)
} as const;

/** Seconds a length of `days` Earth days holds. */
export const motSeconds = (days: number): number => Math.max(0, days) * SEC_PER_DAY;

/** Position inside ONE WHOLE: `elapsedSec` since the whole opened over `revolutionSec` → A.B..C (0.0000..0000 at the
 *  start, 3600.0000..0000 at the end). NEVER clamped above: past the whole reads past 3600 (calendar.ts flags it). */
export function motABC(elapsedSec: number, revolutionSec: number): ABC {
  if (!(revolutionSec > 0) || !isFinite(elapsedSec)) return { a: 0, b: 0, c: 0 };
  const f = Math.max(0, elapsedSec / revolutionSec);
  return toABC(f * SUB);
}
/** A LENGTH in A.B..C: `days` of a whole of `revolutionDays` (Earth's 365-day financial year by default; Earth days of
 *  the Martian revolution on Mars). The 30.333-day pay MoT → 299.0641..0345 A. Never clamped. */
export function spanABC(days: number, revolutionDays: number = FINANCIAL_YEAR_DAYS): ABC {
  if (!(revolutionDays > 0) || !isFinite(days) || days <= 0) return { a: 0, b: 0, c: 0 };
  return toABC((days / revolutionDays) * SUB);
}
/** The inverse of spanABC: an A.B..C length back to days of the given whole. */
export const daysOfSpanABC = (abc: ABC, revolutionDays: number = FINANCIAL_YEAR_DAYS): number => (abcToValue(abc) / SUB) * revolutionDays;
/** "3600.0000..0000 · 3600.3600..3600 · 3599.3599..3599 } Equal" — every writing of a whole reads FULL (a predicate). */
export const isFull = (abc: ABC): boolean => abc.a >= SUB || (abc.a === SUB - 1 && abc.b === SUB - 1 && abc.c >= SUB - 1);
/** Canonical text: A unpadded, B and C four digits — the abc-3600 grammar. Always the TRUE A (r.005): a whole prints
 *  3600.0000..0000, two wholes 7200.0000..0000; r.003 substituted 3600.3600..3600 for anything ≥ 3600 — superseded. */
export const fmtMot = (abc: ABC): string => fmtABC(abc);
/** The sheet's three Equal writings of ONE whole — 3600.0000..0000 · 3600.3600..3600 · 3599.3599..3599 — read exactly 1. */
const isEqualWriting = (abc: ABC): boolean =>
  (abc.a === SUB && ((abc.b === 0 && abc.c === 0) || (abc.b >= SUB && abc.c >= SUB))) || (abc.a === SUB - 1 && abc.b === SUB - 1 && abc.c >= SUB - 1);
/** Fraction of a whole an A.B..C position stands for (the inverse of motABC); never clamped above (2 = two wholes). */
export const fractionOf = (abc: ABC): number => (isEqualWriting(abc) ? 1 : Math.max(0, abcToValue(abc) / SUB));
/** The LTU seconds an A.B..C position stands for inside a whole of `revolutionSec` — the conversion the operator asked for. */
export const ltuOfMotABC = (abc: ABC, revolutionSec: number): number => fractionOf(abc) * Math.max(0, revolutionSec);
/** The seconds ONE A, ONE B, ONE C and ONE D hold in a whole — Earth (365 d): A = 8,760 s (2 h 26 min), B = 2.4333 s,
 *  C = 0.6759 ms, D = 0.18776 µs. */
export const orbitUnits = (revolutionSec: number) => ({
  aSec: revolutionSec / SUB, bSec: revolutionSec / SUB / SUB, cSec: revolutionSec / SUB / SUB / SUB, dSec: revolutionSec / SUB / SUB / SUB / SUB,
});

// ── The fourth tier, D · A.BBBB..CCCC...DDDD ("if smaller time splits are needed we use A.B..C…D") ──────────────
export interface ABCD extends ABC { d: number }
const p4 = (n: number) => String(Math.max(0, Math.trunc(n))).padStart(4, "0");
/** Decompose a value into four Base-3600 tiers with its own carry (toABC rounds C, so it is not derived from it). */
export function toABCD(value: number): ABCD {
  if (!isFinite(value) || value <= 0) return { a: 0, b: 0, c: 0, d: 0 };
  let a = Math.trunc(value);
  const bf = (value - a) * SUB;
  let b = Math.trunc(bf);
  const cf = (bf - b) * SUB;
  let c = Math.trunc(cf);
  let d = Math.round((cf - c) * SUB);
  if (d >= SUB) { d -= SUB; c += 1; }
  if (c >= SUB) { c -= SUB; b += 1; }
  if (b >= SUB) { b -= SUB; a += 1; }
  return { a, b, c, d };
}
export const fmtABCD = (x: ABCD): string => `${fmtABC(x)}...${p4(x.d)}`;
export const abcdToValue = (x: ABCD): number => x.a + x.b / SUB + x.c / SUB / SUB + x.d / SUB / SUB / SUB;
/** A LENGTH in A.B..C...D of a whole of `revolutionDays` (Earth's 365 by default). */
export function spanABCD(days: number, revolutionDays: number = FINANCIAL_YEAR_DAYS): ABCD {
  if (!(revolutionDays > 0) || !isFinite(days) || days <= 0) return { a: 0, b: 0, c: 0, d: 0 };
  return toABCD((days / revolutionDays) * SUB);
}

// ── Rates: a MoT converts money to $/day · $/hour · $/min · $/sec (the sheet's "$/MoT" column) ──────────────────
export const perDay = (amount: number, days: number): number => (days > 0 ? amount / days : 0);
export const perHour = (amount: number, days: number): number => perDay(amount, days) / HOUR_PER_DAY;
export const perMin = (amount: number, days: number): number => (days > 0 ? amount / (days * MIN_PER_DAY) : 0);
export const perSec = (amount: number, days: number): number => perMin(amount, days) / SEC_PER_MIN;
/** The same amount re-expressed per LTU unit (D · W · M33 · Q99 · Y365) — the sheet's 144 $/D → 1,008 $/W → 4,752 $/M33 → 14,256 $/Q99. */
export const perUnit = (amount: number, days: number, unit: LtuUnit): number => perDay(amount, days) * LTU_DAYS[unit];

// ── CST timestamps · YYYY.MM.DD_HH.MM..SS ───────────────────────────────────────────────────────────────────────
export interface CstParts { y: number; mo: number; d: number; h: number; mi: number; s: number }
const p2 = (n: number) => String(n).padStart(2, "0");
/** Civil parts of an instant in CST standard (UTC−6, fixed). */
export function cstParts(ms: number): CstParts {
  const d = new Date(ms + CST_OFFSET_MIN * 60000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() };
}
/** An instant from CST civil parts — the deposit "day and time" a person types. */
export const cstMs = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0): number => Date.UTC(y, mo - 1, d, h, mi, s) - CST_OFFSET_MIN * 60000;
/** `2026.10.01_07.00..00` — the sheet's stamp, in CST. */
export function fmtStampCST(ms: number): string {
  const p = cstParts(ms);
  return `${p.y}.${p2(p.mo)}.${p2(p.d)}_${p2(p.h)}.${p2(p.mi)}..${p2(p.s)}`;
}
/** A day count written the way the operator writes it — repeating digits under a bar (U+0305, addendum 37: "show 33.3 with bar over
 *  using latex or basically any formatting to shown-repeating 3"; his answer: everywhere). 91 ÷ 3 → "30.3̅", 33 → "33", 30.25 →
 *  "30.25", 1/6 → "0.16̅". A count that is no small fraction (denominator ≤ 99, a repeat of ≤ 3 digits) prints at most three decimals. */
export function fmtDays(d: number): string {
  if (!Number.isFinite(d)) return "";
  const sign = d < 0 ? "-" : ""; const x = Math.abs(d);
  for (let den = 1; den <= 99; den++) {
    const num = Math.round(x * den);
    if (Math.abs(num / den - x) >= 1e-9) continue;
    const whole = Math.floor(num / den); let rem = num - whole * den;
    if (rem === 0) return sign + String(whole);
    const digits: number[] = []; const seen = new Map<number, number>();
    while (rem !== 0 && !seen.has(rem)) { seen.set(rem, digits.length); rem *= 10; digits.push(Math.floor(rem / den)); rem %= den; }
    if (rem === 0) return `${sign}${whole}.${digits.join("")}`;
    const start = seen.get(rem) ?? 0; const rep = digits.slice(start);
    if (rep.length > 3) break;
    return `${sign}${whole}.${digits.slice(0, start).join("")}${rep.map((g) => `${g}\u0305`).join("")}`;
  }
  return sign + String(Math.round(x * 1000) / 1000);
}
/** The chart's calendar axis (addendum 42): CST midnights from `fromMs` to `toMs`, every 1 · 2 · 3 · … days so at most `maxLabels`
 *  labels fit; CST standard has no daylight shift, so a day is always 24 h. */
export function dayTicks(fromMs: number, toMs: number, maxLabels: number): number[] {
  if (!(toMs > fromMs) || !(maxLabels >= 1)) return [];
  const p = cstParts(fromMs); let first = cstMs(p.y, p.mo, p.d); if (first < fromMs) first += MS_PER_DAY;
  const days = Math.floor((toMs - first) / MS_PER_DAY) + 1;
  if (days <= 0) return [];
  const step = [1, 2, 3, 4, 5, 7, 10, 14, 15, 30, 61, 91, 182, 365].find((n) => Math.ceil(days / n) <= maxLabels) ?? Math.ceil(days / maxLabels);
  const out: number[] = []; for (let t = first; t <= toMs; t += step * MS_PER_DAY) out.push(t);
  return out;
}
/** The three date formats the chart's gear offers (addendum 42): 2026.10.01 (the default) · 10.01 · the month named once over 01 02 03. */
export type DateFmt = "full" | "mmdd" | "month";
export const DATE_FMTS: readonly DateFmt[] = ["full", "mmdd", "month"];
export function dateLabel(ms: number, fmt: DateFmt): string { const s = fmtStampCST(ms); return fmt === "full" ? s.slice(0, 10) : fmt === "mmdd" ? s.slice(5, 10) : s.slice(8, 10); }
const STAMP_RE = /^(\d{4})\.(\d{2})\.(\d{2})_(\d{2})\.(\d{2})\.\.?(\d{2})$/;
/** Parse the sheet's stamp back to an instant (CST); null when malformed. */
export function parseStampCST(s: string): number | null {
  const m = STAMP_RE.exec(String(s).trim());
  if (!m) return null;
  const [y, mo, d, h, mi, sec] = m.slice(1).map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || sec > 59) return null;
  return cstMs(y, mo, d, h, mi, sec);
}

// ── Durations · 0000.00.DD_HH.MM..SS (a MoT length written the way the sheets write it) ─────────────────────────
/** `0000.00.33_00.00..00` = 33 days · `0000.00.16_12.00..00` = 16.5 days. Whole days in DD, the remainder in HH.MM..SS. */
export function fmtDurationDays(days: number): string {
  const totalSec = Math.round(Math.max(0, days) * SEC_PER_DAY);
  const dd = Math.floor(totalSec / SEC_PER_DAY), rem = totalSec - dd * SEC_PER_DAY;
  const h = Math.floor(rem / 3600), mi = Math.floor((rem % 3600) / 60), s = rem % 60;
  return `0000.00.${p2(dd)}_${p2(h)}.${p2(mi)}..${p2(s)}`;
}
const DUR_RE = /^(\d{4})\.(\d{2})\.(\d{2})_(\d{2})\.(\d{2})\.\.?(\d{2})$/;
/** Parse a sheet duration back to days (years → 365, months → 33 per the personal frame); null when malformed. */
export function parseDurationDays(s: string): number | null {
  const m = DUR_RE.exec(String(s).trim());
  if (!m) return null;
  const [yy, mm, dd, h, mi, sec] = m.slice(1).map(Number);
  return yy * LTU_DAYS.Y + mm * LTU_DAYS.M + dd + (h * 3600 + mi * 60 + sec) / SEC_PER_DAY;
}
