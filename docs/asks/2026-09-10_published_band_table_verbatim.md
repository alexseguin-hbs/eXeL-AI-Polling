# Operator ruling — 2026-09-10 · "STOP MAKING UP MATH"

## Verbatim

> and STOP MAKING UP MATH. You have Vision 2525 in your memory.
> heres Vision-2525 elements, which you contradicted

### unit.multiples — the published band table, verbatim

| MULTIPLE M | HOURS TO REACH 9,999 | IN FULL-TIME YEARS | WHAT THIS BAND IS FOR |
|---|---|---|---|
| 1x | 9,999 | 4.81 | Unreachable in a year. The floor of the scale, not a working band. |
| 2x | 5,000 | 2.40 | Entry contribution; part-time and learning participation. |
| 3x | 3,333 | 1.60 | Sustained competent contribution. |
| 4.807x | 2,080 | 1.00 | The reference multiple. One full-time year lands exactly on the ceiling. |
| 6x | 1,666 | 0.80 | Scarce skill, or responsibility carried. |
| 8x | 1,250 | 0.60 | Rare expertise; the band where part-year work still reaches the ceiling. |
| 10x+ | ≤1,000 | ≤0.48 | Exceptional contribution. Permitted, published, and still capped at 9,999. |

### unit.ceiling — the ceiling, and why it is hard

> 9,999 웃 per natural person per year: the Texas vintage settles at $72,492.75, though that dollar value
> tracks each contributor's local minimum wage and is not universal. Not per role, account, or organisation,
> but per person. The figure is the governing default under current policy, amendable through governance, and
> not a fixed constant.

**THE DENOMINATION, AND WHAT 9,999 COUNTS**

> 1 웃 (base) = one hour at 1× the contributor's local minimum wage. A multiple M applies for qualified
> contribution, so 웃 earned = M × hours: 100 qualified hours at M = 2.5 earn 250 웃, while actual time worked
> stays 100 hours. The local hour is the anchor; 웃 has one denomination, not two. **M is unbounded**, but the
> annual 웃 PAYMENT is bound at 9,999 with excess rolling forward; higher leverage reaches a stable year
> sooner, focusing on stability first.
>
> Actual time is recorded separately, minute by minute, by Measurement of Time (MoT). So 9,999 웃 per year is
> the annual settlement boundary under operating policy (recognition itself is unbounded), not 9,999 hours
> worked, nor a limit on contribution history. MoT and Replay preserve every recorded minute and
> contribution; nothing earned or evidenced is erased. Record, policy, and legal settlement are three
> separate things, and applicable law controls when pay is due.

**HI MAX, AND THE ACCRUAL LEDGER**

> 9,999 웃/year is the maximum; across 525,600 minutes that is 0.0190239726 웃/min, shown in the A.B..C grammar
> as 0.0068..1751 (Base-3600) and viewable over a 91-day or 365-day window in 웃/min → \$/min → local
> currency/min. Every accrual carries a Measurement-of-Time triple: (unit, Start, Duration): the \$ amount, the
> Start (day/time/minute), and the Duration in N.mmmm..ssss. The same amount settles real-time over 24h or
> over a 1/3/5-year term — the rate changes, the amount does not — and the annual accrual never exceeds
> 9,999 웃 before rolling forward.
>
> The figure is chosen rather than derived: 9999 웃 settles in Texas at \$72,492.75, which is a reasonable
> salary there and a long way above the poverty line. That is precisely what the unit was always for.

| YEAR | CEILING ARRIVING | TEXAS | BRAZIL | NIGERIA |
|---|---|---|---|---|
| Year 1 | full ceiling | \$72,492.75 | \$15,798.42 | \$3,399.66 |
| Year 2 | full ceiling | \$72,492.75 | \$15,798.42 | \$3,399.66 |
| Year 3 | full ceiling | \$72,492.75 | \$15,798.42 | \$3,399.66 |
| Year 4 | full ceiling | \$72,492.75 | \$15,798.42 | \$3,399.66 |
| Year 5 | full ceiling | \$72,492.75 | \$15,798.42 | \$3,399.66 |
| Year 6 | overflow | the forward flow, still capped at 9999 웃 | | |

> **Each annual figure IS the ceiling settled at the local rate — not a fifth of it.** Five years of accrual
> buys five years of the same figure at the longest election, and year six holds whatever was earned beyond
> that. The local numbers differ because the local floors differ; the slice of a life is identical everywhere.
>
> Two properties follow, and both are the point rather than side effects.
>
> **It is a floor, not a sudden windfall.** A contributor at the ceiling knows what the next four years hold
> even if they never contribute again. That is what "continuity" means in the locked definition, and it is the
> whole difference between being paid and being truly secure.
>
> **It is an accruing balance, not a sum anybody hands over.** The figures above are strictly annual CAPS on
> what may be drawn, not cheques that arrive on a fixed date. Recognition accrues continuously as \$/min into
> escrow against the ring-fenced reserve; the real-time election draws that balance as it fills (the shape of
> a driver taking instant pay several times a day rather than waiting for Friday) while an elected term
> spreads the same balance over guaranteed instalments. The ceiling governs the year; the timing itself
> belongs to the person.
>
> **It converts recognition into lasting stability instead of into leverage.** Five times \$72,492.75 arriving
> at once is capital, and capital naturally seeks influence. The same accrual drawn against an annual ceiling
> is a salary. The ceiling stops all accumulation across people; the elected horizon (at most five years)
> stops it across time; and the annual cap stops a large balance becoming a large payment.

## What I contradicted — specifically, and with the numbers

**1 · I derived the band hours instead of reading the published table, and shipped a wrong number.**
In `174047f` I made `hoursToCeiling` derived rather than stored and called that discipline. It is not
discipline when the figures are **published**. `Math.round(9999 / 6)` is **1,667** in JavaScript
(`Math.round` rounds .5 away from zero). **The published table says 1,666.** The band picker on the live site
renders 1,667 for the 6× row. That is a number I invented against a number he published.

The other rows survive the derivation by luck, not by method: 2× → 4,999.5 rounds to 5,000; 4.807× → 2,080.09
to 2,080; 8× → 1,249.875 to 1,250; 10× → 999.9 to 1,000. Getting six of seven right by rounding is not the
same as reading the table.

**2 · My gate asserted 1,667.** `pod-invariant.test.mjs` contained
`ok(Math.round(Y.hoursToCeiling(6)) === 1667, …)`. The gate that exists to stop drift was itself asserting the
drift.

**3 · `isBand()` refuses any multiple outside the seven, and unit.ceiling says "M is unbounded".**
The table's own last row is **10x+**, "Permitted, published, and still capped at 9,999". A hard whitelist of
seven values contradicts both.

**4 · I wrote my own band descriptions.** The "WHAT THIS BAND IS FOR" column is published text. I paraphrased
it. The published words go in.

**5 · The "IN FULL-TIME YEARS" column is published and the pod does not show it at all.**

## The rule this establishes

**A published figure is read, never re-derived.** Derivation is for what the paper does not publish — how much
further *this* person has to go from where they already stand. The table itself is data, quoted, with the
paper's own rounding, and the gate compares the pod to the table rather than to my arithmetic.

## Provenance
Ruling received 2026-09-10. Persisted before any analysis or code, per PERSIST FIRST (AAR 2026-08-28).
