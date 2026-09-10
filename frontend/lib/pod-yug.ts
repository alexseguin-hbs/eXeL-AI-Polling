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
 *   3. THE MULTIPLE IS THE ROUTE TO THE CEILING, not the country. A higher band reaches 9,999 in fewer hours
 *      (unit.multiples). Reach — how many people can achieve 9,999 — is the goal the operator named.
 *
 * OPERATOR RULING, 2026-09-10, second (docs/asks/2026-09-10_financial_section_settles_the_coefficient.md):
 *   "read the financial section of Vision•2525 and this will be clear to you Master of Thought"
 * It is. The financial section fixes the mint coefficient and I had it wrong by 4.807×:
 *   fund.return — the Seed is 1/7 of an hour and "the same quantity expressed in 웃 is 0.6867, AT 4.807 PER HOUR".
 *   unit.mintsettle — MINT `웃 = hours × (9,999 ÷ 2,080)`, SETTLE `$ = 웃 ÷ 4.807 × stamped rate`, and the identity is
 *   LOCKED: "one full-time year lands exactly on 9,999". Defect 15 was opened for a coefficient that broke it.
 * This file previously minted one 웃 per hour at base, which put the ceiling 9,999 hours away at 1× — 4.8 full-time
 * years to fill a single year's payout. That is a treadmill, not the lifelong stability the operator asked for, and it
 * made 4.807 look like a band when it is the BASE COEFFICIENT that had been mistaken for one.
 */

/** The annual PAYOUT ceiling per natural person. Not an earning cap (unit.ceiling, Immutable). */
export const YUG_CEILING = 9999;
/** A full-time year, identical in all 103 jurisdictions — the denominator of reach (unit.reach). */
export const FTE_HOURS = 2080;
/** Coverage stops at the edge of a lifetime: a reservation may not extend past the 99th year (unit.carry). */
export const MAX_SECURED_YEARS = 99;
/**
 * The mint coefficient — 웃 per hour of qualified time at 1×. DERIVED, never written as a literal: unit.mintsettle
 * closed defect 15 by deriving it precisely so "the identity cannot drift, and a test asserts it rather than a comment
 * claiming it". The identity is that one full-time year at base lands EXACTLY on 9,999. Cross-check from the other end:
 * the Seed is 1/7 hour and fund.return prices it at 0.6867 웃 — 0.142857 × 4.807115… = 0.6867. The two agree.
 */
export const YUG_PER_HOUR = YUG_CEILING / FTE_HOURS;

/**
 * The published bands (unit.multiples). Higher multiples never raise the ceiling — they only shorten the hours to reach it:
 * "The multiple recognises scarcity. The ceiling firmly refuses to convert scarcity into power."
 * unit.guard: bands are published in advance and changed PROSPECTIVELY only, never retroactively reclassified.
 */
export interface Band { m: number; label: string }
/**
 * The published multiples are kept exactly as published — unit.guard forbids retroactive reclassification, so a band is
 * never quietly withdrawn even when, as with 4.807, it turns out to duplicate the base coefficient. What is NOT stored
 * is the hours-to-ceiling: that is derived, because a stored copy is how the old wrong figures survived.
 */
export const BANDS: Band[] = [
  { m: 1, label: "1× — one full-time year reaches the ceiling" },
  { m: 2, label: "2×" }, { m: 3, label: "3×" },
  { m: 4.807, label: "4.807×" },
  { m: 6, label: "6×" }, { m: 8, label: "8×" }, { m: 10, label: "10×" },
];
export const isBand = (m: number): boolean => BANDS.some((b) => b.m === m);
/** Hours still needed to reach 9,999 at this band — what a person actually wants to know (unit.reach). */
export const hoursToCeiling = (m: number, already = 0): number =>
  m > 0 ? Math.max(0, YUG_CEILING - already) / (YUG_PER_HOUR * m) : Infinity;

/**
 * 웃 = hours × (9,999 ÷ 2,080) × M. Currency-free, and the ONLY mint in the pod.
 * The multiple raises the RATE, which is what the operator asked for — "that way someone can earn at higher rates" —
 * because settlement then works out to hours × M × the local floor: three times the floor per hour at 3×, and the
 * ceiling reached in a third of the year.
 */
export const mint = (hours: number, m: number): number =>
  hours > 0 && m > 0 ? hours * YUG_PER_HOUR * m : 0;

/**
 * Settlement — `$ = 웃 ÷ 4.807 × stamped rate` (unit.mintsettle). It reads a STAMPED rate, never a live lookup, which
 * is what closed the arbitrage: an hour earned in Lagos can no longer be redeemed at a Seattle rate.
 *
 * It has no call site in the pod, and that is deliberate rather than a gap: the pod is the mint, and the mint is
 * currency-free. Settlement happens on the settlement rail, which knows a jurisdiction; the pod never does.
 */
export const settle = (yug: number, stampedRate: number): number =>
  yug > 0 && stampedRate > 0 ? (yug / YUG_PER_HOUR) * stampedRate : 0;

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
