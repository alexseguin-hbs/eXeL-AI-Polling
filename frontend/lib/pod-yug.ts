/**
 * 웃 — the common language, and the ceiling that carries.
 *
 * OPERATOR RULING, 2026-09-10 (docs/asks/2026-09-10_tokenomics_rulings_ceiling_is_payout.md):
 *   "Hours is always tracked. Multiples of min wage are HI token 웃. That way someone can earn at higher rates. That said
 *    max payout in year is 9999 웃, anything additional goes to next year, and the next, to allow someone to have lifelong
 *    stability."
 *   "…this allows for common language even if 0.34 nigeria min wage and 7.25 Texas min wage differ, so we can maximize 웃
 *    and how many people can achieve 9999 웃."
 *
 * Three rules follow, and this module exists to keep them from blurring:
 *   1. EARNING IS NEVER CAPPED. PAYOUT IS ALWAYS CAPPED, at 9,999 웃 a year. Everything above rolls to the next year, and
 *      the next — the carry is the point, not a leftover (unit.carry · unit.payout).
 *   2. THE MINT IS CURRENCY-FREE. No minimum wage may enter here. An hour mints identically in Lagos and in Austin; only
 *      settlement is local (unit.mintsettle). Getting this backwards is a published defect: the ceiling once demanded
 *      29,409 hours in Nigeria against 614 in Washington, a 47.9× spread. There is deliberately NO currency in this file.
 *   3. THE MULTIPLE IS THE ROUTE TO THE CEILING, not the country. 웃 = M × hours, and a higher band reaches 9,999 in fewer
 *      hours (unit.multiples). Reach — how many people can achieve 9,999 — is the goal the operator named.
 */

/** The annual PAYOUT ceiling per natural person. Not an earning cap (unit.ceiling, Immutable). */
export const YUG_CEILING = 9999;
/** A full-time year, identical in all 103 jurisdictions — the denominator of reach (unit.reach). */
export const FTE_HOURS = 2080;
/** Coverage stops at the edge of a lifetime: a reservation may not extend past the 99th year (unit.carry). */
export const MAX_SECURED_YEARS = 99;

/**
 * The published bands (unit.multiples). Higher multiples never raise the ceiling — they only shorten the hours to reach it:
 * "The multiple recognises scarcity. The ceiling firmly refuses to convert scarcity into power."
 * unit.guard: bands are published in advance and changed PROSPECTIVELY only, never retroactively reclassified.
 */
export interface Band { m: number; label: string; hoursToCeiling: number }
export const BANDS: Band[] = [
  { m: 1, label: "1×", hoursToCeiling: 9999 },
  { m: 2, label: "2×", hoursToCeiling: 5000 },
  { m: 3, label: "3×", hoursToCeiling: 3333 },
  { m: 4.807, label: "4.807× — one full-time year", hoursToCeiling: FTE_HOURS },
  { m: 6, label: "6×", hoursToCeiling: 1666 },
  { m: 8, label: "8×", hoursToCeiling: 1250 },
  { m: 10, label: "10×", hoursToCeiling: 1000 },
];
export const isBand = (m: number): boolean => BANDS.some((b) => b.m === m);
/** Hours still needed to reach 9,999 at this band — what a person actually wants to know (unit.reach). */
export const hoursToCeiling = (m: number, already = 0): number =>
  m > 0 ? Math.max(0, (YUG_CEILING - already) / m) : Infinity;

/** 웃 = M × hours. Currency-free, and the ONLY mint in the pod. */
export const mint = (hours: number, m: number): number =>
  hours > 0 && m > 0 ? hours * m : 0;

/**
 * The three numbers a person must be shown, and never blended into one.
 * `earned` is uncapped. `payableThisYear` is bounded at the ceiling. `carried` is the remainder, which is not lost —
 * it opens the next year, and the next.
 */
export interface Standing {
  earned: number;            // this session, uncapped
  cumulative: number;        // everything recognised so far, uncapped
  payableThisYear: number;   // bounded at 9,999
  carried: number;           // rolls forward; never expires within the horizon, never earns interest
  securedYears: number;      // whole years already covered
  remainderNextYear: number; // what starts the following year
  atHorizon: boolean;        // reservation reached the 99th year
}
export function standing(cumulativeBefore: number, earnedNow: number): Standing {
  const earned = Math.max(0, earnedNow);
  const cumulative = Math.max(0, cumulativeBefore) + earned;
  const payableThisYear = Math.min(cumulative, YUG_CEILING);
  const carried = Math.max(0, cumulative - payableThisYear);
  const whole = Math.floor(cumulative / YUG_CEILING);
  const securedYears = Math.min(whole, MAX_SECURED_YEARS);
  return {
    earned, cumulative, payableThisYear, carried, securedYears,
    remainderNextYear: cumulative - securedYears * YUG_CEILING,
    atHorizon: whole >= MAX_SECURED_YEARS,
  };
}

/**
 * The vintage stamp — decision D9. Written ONCE with the hours, the multiple and the local rate on the EARNING date, and
 * never revised. Deferral changes when a 웃 settles, never what it recorded. The rate is carried only so a later settlement
 * can read it; it takes no part in the mint above.
 */
export interface Vintage { hours: number; m: number; yug: number; rate: number | null; currency: string | null; earnedAt: string }
export function stamp(hours: number, m: number, earnedAt: string, rate: number | null = null, currency: string | null = null): Vintage {
  return { hours, m, yug: mint(hours, m), rate, currency, earnedAt };
}
