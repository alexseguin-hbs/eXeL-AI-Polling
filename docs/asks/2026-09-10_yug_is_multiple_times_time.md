# Operator ruling — 2026-09-10 · 웃 = M × T

## Verbatim

> Ensure the same nomenclature for global payment system is used
>
> HI token = 웃 = M*T
>
> where multiple is multiple of local min wage

Delivered with the file `SOI_VISION2525_v.19_LIVING_DOCUMENT.html` (sha256 `52d10e5612d0e3962794720de6c6497809467aa5ac07e3062e106c3f26c1840c`).

## This reverses 174047f, shipped one hour earlier

Earlier today I flagged what looked like a contradiction between `unit.settle` and `unit.mintsettle`. He
declined to rule and said to read the financial section. I read `fund.return` ("0.6867 웃 … at 4.807 per
hour") and `unit.mintsettle` (`웃 = hours × (9,999 ÷ 2,080)`), concluded the mint carried a 4.807 웃/hour
coefficient, and changed the shipped mint to `hours × (9,999 ÷ 2,080) × M`.

**The tell was in the formula I copied: it contains no M.** A mint with no multiple cannot be the general
mint. I took a special case for the identity and then wrote a test asserting it.

## The evidence, swept

`웃 = M × hours` is the current text of roughly ten blocks, including the two that carry the most authority
in the document:

- **`front.locked` — Immutable, Document 0**: "웃 is denominated in multiples of local or regional minimum
  wage … It is a multiple of a local hour, and the multiple is where skill, scarcity and responsibility are
  properly expressed." It explicitly rejects a "free-floating abstraction".
- **`exec.s1` at r280 — the highest release in the document**: "HI earned = M × hours".
- `unit.denom`, `unit.ceiling`, `unit.ontology`, `unit.regional`, `coin.reach`, `fund.reward`,
  `legal.sovereign_ledger` ("one 웃 is still one hour at one times local minimum wage").
- `unit.carry`, decisively: "웃 = hours × multiple, **so the multiple is simply the 웃-per-hour rate**."

It is the only formula from which the document's two published tables and all five worked human examples can
be derived — `unit.multiples` (every row is 9,999 ÷ M), `unit.carry` (every row is 2,080 × M),
`coin.family` (two hours at 3× = 6 웃), `hi.floor.dignity` ("one 웃 for the hour itself, with no multiple
attached"), `human.story` (900 h at 6× = 5,400 웃), `human.cambodia` (400 h at 3× = 1,200 웃),
`unit.example` (37.241 웃 × $7.25 = $270).

`웃 = hours × 4.807` is the current text of **one** block, `unit.mintsettle`, with its coefficient echoed
once in `fund.return` and its settlement result echoed in `paper.s6`.

**The repository's own CI already enforced the ruling I broke.** `scripts/exec-summary-verify-all.mjs:13`
requires the verbatim string `HI earned = M × hours` across 33 languages; `scripts/qis-semantic-check.mjs:62`
and `scripts/replay-audit-vision2525.mjs:118` hard-assert `M × hours` in `unit.ceiling`.

## The reconciliation — 4.807 is a multiple, never a coefficient

`unit.mintsettle` mistook the **reference multiple** for a mint rate. 4.807 is the band at which one
full-time year lands exactly on 9,999, which is precisely how `unit.multiples` and `paper.s1` describe it:
"the reference multiple … arrived at by division rather than by choice."

Its real doctrine survives untouched: **no wage enters the mint.** `웃 = M × T` is currency-free too — M is
a dimensionless multiple, T is hours, and no currency appears until settlement.

## Canonical nomenclature

    MINT      웃 = M × T          H.I. token = Multiple × Time
                                  prose expansion: "earned = M × hours"
                                  M — the multiple of the local minimum wage the work qualifies for
                                  T — witnessed hours
                                  Currency-free: no wage, currency or jurisdiction enters the mint.

    SETTLE    $ = 웃 × stamped local minimum-wage rate
                                  One 웃 is one hour at 1× the local floor, so the multiple IS the
                                  웃-per-hour rate. Reads the rate stamped at mint, never a live lookup.

    CEILING   9,999 웃 payout per person per year; the excess carries forward, never lost.
              Hours to the ceiling = 9,999 ÷ M — which reproduces the published band table exactly.

## Scope he set

**POD ONLY.** Asked how far to take the unification and how to handle the document's own contradictions, he
answered "Pod only" and "Only update POD". The backend mint, the 32-language lexicon, the i18n JSON, the
legacy reference docs and the living document are out of scope; findings on them are recorded in the plan
and in `docs/VISION2525_LENS_FOR_POD.md`, not acted on.

## On the uploaded file

Not archived, deliberately. It is a strict subset of the repo's ledger: the same 169 block ids, no block and
no release the repo lacks, differing only by the 15 `exec.*` blocks (r284) the repo has and it does not,
plus whitespace. Committing a 7 MB duplicate would add bloat, not a record. Its hash is above.

## Provenance
Ruling received 2026-09-10. Persisted before any analysis or code, per PERSIST FIRST (AAR 2026-08-28).
