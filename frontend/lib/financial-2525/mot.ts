/**
 * Financial-2525 · MoT — Measure of Time, in A.B..C (operator 2026-09-30, v.000_r.003).
 * ====================================================================================================
 * "A.B..C IS earth length around sun · 1 revolution split to 3600 units · 3600 sub units · 3600 sub sub units"
 * (addendum 10) · "all is defaulted to A.B..C so MoT = 30.33 converted to 3600.3600..3600 from Celestial-2525 scale
 * (for earth), which will allow for financial system to convert to Mars and future planets" · "it is important A.B..C
 * is used for time and easily converted to Earth local time units LTU."
 *
 * THE LAW (corrected in r.003 — r.001/r.002 read a pay period as its own whole; the whole is the REVOLUTION):
 *   ONE REVOLUTION of the planet around its star — for Earth, perihelion to perihelion, the financial year — is split
 *   into 3600 A-units; each A into 3600 B sub-units; each B into 3600 C sub-sub-units. Exactly the celestial UCRS-2525
 *   orbit (lib/ucrs-2525.ts: HU 0 = perihelion, 3600 = a full orbit = 3600.3600..3600).
 *   · The A.B..C of an INSTANT is its position in the current revolution: 0.0000..0000 at perihelion, 3600.3600..3600
 *     at the next (lib/financial-2525/calendar.ts positionInYear — the sourced perihelion instants, so the year
 *     resets exactly when the operator said).
 *   · The A.B..C of a LENGTH (a MoT) is days ÷ revolution-days × 3600: the 30.333-day pay MoT is ≈ 298.97 A-units —
 *     "30.33 converted into the 3600.3600..3600 scale". One A ≈ 2.43 h, one B ≈ 2.43 s, one C ≈ 0.68 ms on Earth.
 *   · The scale never names a planet: on Mars the same functions take sols and the Martian revolution in sols.
 *   The three writings the sheet calls Equal — 3600.0000..0000 · 3600.3600..3600 · 3599.3599..3599 — all read FULL:
 *   a whole revolution. Pure, deterministic, no clock reads.
 *
 * Earth LTU here = seconds, minutes, hours, days (Austin, Texas — CST STANDARD, UTC−6, no daylight shift: the
 * operator's fixed rule; lib/ucrs-2525.ts:153 carries the same −6 for Pfield). Timestamps are written
 * YYYY.MM.DD_HH.MM..SS and durations 0000.00.DD_HH.MM..SS, exactly as the sheets write them. The glass defaults to
 * day · hour · minute; A.B..C is a reveal (addendum 8).
 */
import { toABC, fmtABC, abcToValue, type ABC } from "@/lib/abc-3600";

export const SUB = 3600;                                  // 3600 units · 3600 sub-units · 3600 sub-sub-units
export const CST_OFFSET_MIN = -360;                       // CST standard, never CDT (operator 2026-09-30)
export const SEC_PER_MIN = 60, MIN_PER_HOUR = 60, HOUR_PER_DAY = 24;
export const MIN_PER_DAY = MIN_PER_HOUR * HOUR_PER_DAY;   // 1,440 — the sheet's "1440 m/D"
export const SEC_PER_DAY = MIN_PER_DAY * SEC_PER_MIN;     // 86,400
export const MS_PER_DAY = SEC_PER_DAY * 1000;
/** Earth's mean revolution perihelion to perihelion — the anomalistic year, 365.259636 days (SOURCED: standard
 *  astronomical constant; an individual perihelion-to-perihelion interval swings ±~1 day with the Moon, which is why
 *  an INSTANT's position uses the sourced perihelion table in calendar.ts, and a LENGTH uses this mean). */
export const EARTH_REVOLUTION_DAYS = 365.259636;
/** Mars' revolution in sols (686.98 Earth days ÷ 1.02749 days per sol), for the planet-independence proof. */
export const MARS_REVOLUTION_SOLS = 668.5991;
/** The worked example: one third of a 91-day quarter — "pay check example is $ deposit, October 1, 2026 at 07:00, 30.333". */
export const MOT_PAY_MONTH_DAYS = 91 / 3;                 // 30.333…
/** The personal frame the sheets draw in: D · W = 7 · M = 33 · Q = 99 · Y = 365 ("Options – Time Frame", sheet 3). */
export const LTU_DAYS = { D: 1, W: 7, M: 33, Q: 99, Y: 365 } as const;
export type LtuUnit = keyof typeof LTU_DAYS;

export const FULL_ABC: ABC = { a: SUB, b: SUB, c: SUB };
export const FULL_MOT = "3600.3600..3600";

/** Seconds a length of `days` Earth days holds. */
export const motSeconds = (days: number): number => Math.max(0, days) * SEC_PER_DAY;

/** Position inside ONE REVOLUTION: `elapsedSec` since perihelion over a revolution of `revolutionSec` → A.B..C
 *  (0.0000..0000 at perihelion, FULL at the next). calendar.ts feeds it the sourced perihelion interval. */
export function motABC(elapsedSec: number, revolutionSec: number): ABC {
  if (!(revolutionSec > 0) || !isFinite(elapsedSec)) return { a: 0, b: 0, c: 0 };
  const f = Math.max(0, Math.min(1, elapsedSec / revolutionSec));
  if (f >= 1) return FULL_ABC;
  return toABC(f * SUB);
}
/** A LENGTH in A.B..C: `days` of a revolution of `revolutionDays` (Earth's mean by default; sols and a Martian
 *  revolution on Mars). The 30.333-day pay MoT → ≈ 298.97 A. Never clamped: a length may exceed one revolution. */
export function spanABC(days: number, revolutionDays: number = EARTH_REVOLUTION_DAYS): ABC {
  if (!(revolutionDays > 0) || !isFinite(days) || days <= 0) return { a: 0, b: 0, c: 0 };
  return toABC((days / revolutionDays) * SUB);
}
/** The inverse of spanABC: an A.B..C length back to days (or sols) of the given revolution. */
export const daysOfSpanABC = (abc: ABC, revolutionDays: number = EARTH_REVOLUTION_DAYS): number => (abcToValue(abc) / SUB) * revolutionDays;
/** "3600.0000..0000 · 3600.3600..3600 · 3599.3599..3599 } Equal" — every writing of a whole revolution reads FULL. */
export const isFull = (abc: ABC): boolean => abc.a >= SUB || (abc.a === SUB - 1 && abc.b === SUB - 1 && abc.c >= SUB - 1);
/** Canonical text: A unpadded, B and C four digits — the abc-3600 grammar; a whole revolution prints 3600.3600..3600. */
export const fmtMot = (abc: ABC): string => (isFull(abc) ? FULL_MOT : fmtABC(abc));
/** Fraction 0..1 of a revolution an A.B..C position stands for (the inverse of motABC). */
export const fractionOf = (abc: ABC): number => (isFull(abc) ? 1 : Math.max(0, Math.min(1, abcToValue(abc) / SUB)));
/** The Earth LTU seconds an A.B..C position stands for inside a revolution of `revolutionSec` — the conversion the operator asked for. */
export const ltuOfMotABC = (abc: ABC, revolutionSec: number): number => fractionOf(abc) * Math.max(0, revolutionSec);
/** The seconds ONE A, ONE B and ONE C hold in a revolution — Earth: A ≈ 8,766 s (2.43 h), B ≈ 2.43 s, C ≈ 0.68 ms. */
export const orbitUnits = (revolutionSec: number) => ({ aSec: revolutionSec / SUB, bSec: revolutionSec / SUB / SUB, cSec: revolutionSec / SUB / SUB / SUB });

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
