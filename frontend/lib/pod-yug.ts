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
 * OPERATOR RULING, 2026-09-10, second (docs/asks/2026-09-10_yug_is_multiple_times_time.md):
 *   "Ensure the same nomenclature for global payment system is used
 *    HI token = 웃 = M*T
 *    where multiple is multiple of local min wage"
 *
 * THE MINT IS 웃 = M × T — Multiple × Time. Nothing else. The prose expansion, used by the paper and by the
 * repository's own CI gates, is "earned = M × hours".
 *
 * 4.807 IS A MULTIPLE, NEVER A COEFFICIENT — and this comment exists because I got that wrong for one release.
 * HISTORICAL: between 174047f and here this file minted `hours × (9,999 ÷ 2,080) × M`, from unit.mintsettle. The tell was
 * in the formula itself: IT HAS NO M IN IT. A mint with no multiple cannot be the general mint; it is the mint at the
 * one band where a full-time year lands on 9,999, which is 4.807×. unit.multiples and paper.s1 name it exactly that —
 * "the reference multiple … arrived at by division rather than by choice". Ten blocks say M × hours, including
 * front.locked (Immutable, Document 0) and exec.s1 at r280, the document's highest release; one block says otherwise.
 *
 * unit.mintsettle loses nothing that matters: its doctrine is that NO WAGE ENTERS THE MINT, and 웃 = M × T is
 * currency-free too — M is a dimensionless multiple, T is hours, and no currency appears until settlement.
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
export interface Band { m: number; label: string }
/**
 * The published multiples, kept exactly as published — unit.guard forbids retroactive reclassification. The labels are
 * unit.multiples' own words. What is NOT stored is the hours-to-ceiling: it is derived from 9,999 ÷ M, because a stored
 * copy is how a wrong figure survives a correction. Derived, the table reproduces the paper's exactly.
 */
export const BANDS: Band[] = [
  { m: 1, label: "1× — the floor of the scale, not a working band" },
  { m: 2, label: "2× — entry contribution" },
  { m: 3, label: "3× — sustained competent contribution" },
  { m: 4.807, label: "4.807× — the reference multiple: one full-time year lands exactly on the ceiling" },
  { m: 6, label: "6× — scarce skill, or responsibility carried" },
  { m: 8, label: "8× — rare expertise" },
  { m: 10, label: "10× — exceptional contribution, and still capped at 9,999" },
];
export const isBand = (m: number): boolean => BANDS.some((b) => b.m === m);
/** Hours still needed to reach 9,999 at this band — what a person actually wants to know (unit.reach). */
export const hoursToCeiling = (m: number, already = 0): number =>
  m > 0 ? Math.max(0, YUG_CEILING - already) / m : Infinity;

/**
 * 웃 = M × T. Multiple × Time. Currency-free, and the ONLY mint in the pod.
 * One 웃 is one hour at 1× the local minimum wage, so — unit.carry, verbatim — "the multiple is simply the 웃-per-hour
 * rate". That is what the operator asked for: a person at 3× earns three times the local floor for the same hour, and
 * reaches the ceiling on a third of the hours.
 */
export const mint = (hours: number, m: number): number =>
  hours > 0 && m > 0 ? hours * m : 0;

/**
 * Settlement — `$ = 웃 × stamped local minimum-wage rate`. One 웃 is one hour at 1× that floor, so the ceiling settles
 * at 9,999 × the rate: $72,492.75 in Texas, $3,399.66 in Nigeria (unit.settle, unit.payout, unit.example, human.story).
 * It reads a STAMPED rate, never a live lookup — that is what closed the arbitrage, and it is the half of
 * unit.mintsettle that was always right: an hour earned in Lagos cannot be redeemed at a Seattle rate.
 *
 * It has no call site in the pod, and that is deliberate rather than a gap: the pod is the mint, and the mint is
 * currency-free. Settlement happens on the settlement rail, which knows a jurisdiction; the pod never does.
 */
export const settle = (yug: number, stampedRate: number): number =>
  yug > 0 && stampedRate > 0 ? yug * stampedRate : 0;

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
