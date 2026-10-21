# Drone-2525 r.221 — INTRODUCTORY ON THE CAPITAL LAWN: TRAIN DOWN writes the fourth number (2026-10-21)

**Artefact commit 5d58b85 · carried `drone-2525_r.221.html` sha256 d36f63ff28cfdf5cead11f5368aabb61c079c59f5ad0765a48317f87bb7578f9.**

## His words (verbatim, 2026-10-21)
> This revision is Introductory on the Capital Lawn only. One air track, on the lawn. No switch on the Range.
> Train Up stays infinite practice. No start, no timer, no run record. Train Down writes hits, misses, rounds, and
> time. No time means it does not count. Qual 40 stays on the Range. One track is not a 40-target qual. Leave the
> refusal. A person is never a target. The Capitol and its façades are not targets.

## What changed — one edit in the FREE `capIntroTick`
On a lawn TRAIN DOWN knockdown, `CTIME{mode:'stay',seat:'A1',ms,hits,misses}` gains **`rounds:(hits|0)+(misses|0)`**
— the fourth number. `rounds` = the HIT + MISS rows = rounds spent, and the magazine matches. So the run carries
hits · misses · rounds · time, and a run with no `CTIME` (no time) does not count.

## Unchanged, asserted by the gate
- TRAIN UP writes no CSTART/CTIME — infinite practice (no start, no timer, no run record).
- QUAL 40 is refused on the lawn (`QUAL 40 IS TRAINING · ON THE RANGE`) — one track is not a 40-target qual; the
  refusal stays.
- One air track; a person, the Capitol and its façades are not targets.
- The Range is untouched (r0.220): no toggle, no Range control; range-frozen 100 definitions, 0 moved; both Range
  play-throughs byte-identical.

## The gate, red first
`LAWN_TRAIN_DOWN_FOUR_NUMBERS`. On r.220 it is red (CTIME carries no rounds). On the cut it is green: CSTART; CTIME
{ms, hits, misses, rounds}; rounds = hits+misses = the magazine delta; QUAL 40 refused. `redfirst/r221.md`.

## Owed / later (stated)
Qual 40 on the lawn is NOT built (his instruction — it stays on the Range). The optional Range aerial toggle was
dropped from r.221 at his instruction. Intermediate / Advance / Real-World named-but-unbuilt; Real-World locked.
