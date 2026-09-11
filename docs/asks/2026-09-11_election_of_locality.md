# Operator ruling — 2026-09-11 · the rate is the contributor's, not the pod's

## Verbatim

> incorporate min wage table and ensure optimized and includes election of locality and regional min wage

Sent with the consolidated rate table for the third time.

## The table is not what was missing

It was incorporated at `ca32d1c` (`frontend/lib/pod-rates.ts`, generated from
`docs/asks/2026-09-10_minimum_wage_rate_table.psv`). The second send was re-transcribed independently and
diffed byte-for-byte against the committed copy — identical, sha256 `68b8c175f21ed24d` both ways. This third
send was checked on the figures that move money: all **29 published rates identical**, no mismatch. The
committed file is unchanged.

So the instruction is the other two clauses, and both name real gaps.

## 1 · Election of locality — the gap

The pod holds **one region for the whole pod**. The paper does not work that way.

- `unit.denom` — *"1 웃 (base) = one hour at 1× **the contributor's** local minimum wage."*
- `unit.regional` — *"a qualified hour earns the same recognition in every region — what differs is only the
  currency that recognition settles in, **at each region's own lawful floor**."*
- `coin.family` puts Austin, Lagos and Manila in a single week.
- `human.story` settles the same 5,400 웃 at $1,836 in Lagos and $39,150 in Austin.

A pod is three people who may be in three localities. **Each contributor elects their own locality; nobody
elects it for them.** The roster protocol is already shaped for this: `{ kind: "member", from, seat, patch }`
is marked *"own seat only"* (`pod-roster.ts:47`) and enforced, so a locality election is self-sovereign for
free and the sim's existing hostile-peer tests already cover the abuse case.

## 2 · "Optimized" — the picker asks for a language in order to give a wage

Counted from the table itself:

| | |
|---|---|
| rows | 114 |
| distinct jurisdictions | **106** |
| distinct countries | 103 |
| rows naming a locality (`Country — Locality`) | **13** |
| countries offering a genuine **locality** choice | **2** |
| countries repeated as the same jurisdiction under different languages | **6** |

The 13 locality rows: United States — Austin, Texas · Canada — Federal · Cameroon — Yaoundé ·
China — Beijing · Japan — Tokyo · Pakistan — Punjab · Thailand — Bangkok · Vietnam — Region I ·
Indonesia — Jakarta · Philippines — Metro Manila · Canada — Québec · India — West Bengal · India — Punjab.

The 2 genuine locality elections: **Canada** (Federal 18.150 CAD · Québec NULL) and **India** (national ·
West Bengal · Punjab).

The 6 language-repeats: Switzerland ×3 (French, German, Italian), Belgium ×2, Democratic Republic of the
Congo ×2, Cyprus ×2, Finland ×2, Singapore ×2 — every one of them the same jurisdiction with the same rate.
A person in Switzerland is currently offered three identical entries and has to pick a language to get a
wage floor. **You elect a place, not a language.** The app already carries a 33-language selector.

Also to be optimized, and measured rather than assumed: `findRegion` is a 114-row linear scan building a
string per row on every render, and `REGION_RATES.filter(r => tierOf(r) === tier)` runs four times in two
places — 456 `tierOf` calls per render, per picker — both about to be multiplied by three once each member
elects.

## The ruling this establishes

**The minimum-wage rate belongs to the contributor, not to the pod.** The mint stays exactly as it is —
웃 = M × T, currency-free, the same 웃 for the same hours everywhere — and the locality decides only what that
person's 웃 settles as, in their own currency, stamped at the earning date (D9). Nothing is ever summed
across currencies, because no exchange rate is published and none will be invented.

A locality is never assumed for a person: a member who has not elected one inherits the pod's default and is
labelled as inheriting, not as having chosen.

## Provenance
Ruling received 2026-09-11. Persisted before any code, per PERSIST FIRST (AAR 2026-08-28).
