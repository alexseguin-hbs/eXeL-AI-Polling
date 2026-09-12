# Operator instructions — 2026-09-12 · the traceable dataset, GPS as a supplement, local currency with a USA equivalent

## Verbatim

> use this traceable data set: `exel_ai_global_minimum_wage_master_2026.csv`
> once complete test deployment of code for AI SI Hi POD session test via white paper attached again.
> USE GPS LOCATION as a supplement to manual (agreed to POD location).
> ensure all can be local currency and also be shown in USA equivalent

## The dataset, persisted

`docs/asks/2026-09-12_exel_ai_global_minimum_wage_master_2026.csv` — sha256 `5a56300aa48e7c688684230a563cfb678a561fdb5d9d404ccf1cf695da38c44b` — copied byte-for-byte from the
upload before it was read. 308 lines.

## What the three instructions establish

1. **The traceable dataset is the source of floors.** It supersedes the fleet's researched proposal wherever it speaks
   (the fleet's rows were `verified = no`; this dataset is the operator's traceable record). Loaded through the same
   generator, reconciled by the same gate, nothing typed by hand.
2. **GPS is a supplement, never the election.** The agreed pod location is the manual election (the pod's default,
   and each member's own); GPS — the browser's `navigator.geolocation`, with the person's permission — only SUGGESTS a
   place, beside the existing IP-based suggestion. Q2 and D9 stand: no floor is assumed for a person.
3. **Every settlement shows local currency AND a USA equivalent.** The paper publishes no exchange rates; the USA
   equivalent must therefore come from a traceable column in the dataset (to be confirmed on reading it), shown beside
   the local figure and labelled with its date — never computed from an invented rate.
4. **Then the full AI · SI · HI pod session test**, against the white paper re-attached (v.19).

## Provenance
Received 2026-09-12. Persisted before the dataset was read (PERSIST FIRST, AAR 2026-08-28).

## What was built on reading the dataset (2026-09-12, commits 9b7315e and the showcase commit after it)

**The rule, one sentence:** *the dataset governs every place it names; his 114 rows and the 90 approved rows attach to
those places as history and settle only a place the dataset does not name.* Enforced by `tests/pod-invariant.test.mjs`
(398 assertions), which re-parses the CSV independently and reconciles every row field for field.

| Measured | Value |
|---|---|
| Dataset rows loaded | 307 (249 countries · 57 US states by scope · DC), all 19 columns, sha256 `5a56300aa48e7c68…` |
| Places a person can elect | 347 · 245 countries · United States offers 65 (federal, 50 states — NY ×2, OR ×3, MT/NJ/OH/OK ×2 by scope — DC, Austin, five territories) |
| Places that settle | **120** — 83 dataset floors + 37 places the dataset does not name (Austin, Beijing, Tokyo, Geneva, 12 Canadian provinces, French overseas departments …) |
| Candidates shown, never settled | 53 (`candidate_hourly_rate`, secondary source) — his own Nigeria row is one |
| History figures that no longer settle | 60 places (e.g. Nigeria 402.739 NGN, Puerto Rico 10.50 USD, Cambodia 1.01 USD): the dataset marks them candidate or "verification pending"; each is printed beside the place as history |
| Dataset figure over a history figure | e.g. Brazil 7.37 BRL governs 9.326; DC 18.40 governs 17.95; Ireland 14.15 EUR fills his NULL; California 16.90 with hi_rates.py 16.00 beside |

**USA equivalent** — shown beside every local figure (plan preview, pod settlement, each member's settlement, each
receipt line) by a traceable route only: same currency · a dated, sourced row of `docs/asks/2026-09-12_fx_to_usd.psv` ·
hi_rates.py's own USD floor × 웃, named as a second floor. Otherwise: *"USD equivalent: awaiting a dated exchange-rate
source for this currency."* The FX file holds one row (USD identity) because neither the dataset nor the paper publishes
an exchange rate.

**GPS** — a seat carries its own browser position fix (lat, lon, ±m, time), taken with permission on that person's seat
only, replicated, never erased, printed on the settlement and the receipt as "a supplement to the elected place". It never
sets an election; no country is inferred from coordinates.

**Showcase** — `docs/assessments/pod-live-run-2026-09-12/` (90 steps, 0 failures, three emulated phones over the local
relay): pod default New York · Remainder of state (16.00 USD, a scope election); Ana elects Brazil (7.37 BRL) and adds a
São Paulo GPS fix; Bo elects Metro Manila (86.875 PHP); the receipt shows $ for Lea, a hi_rates.py USD floor for Ana, and
the words "awaiting a dated exchange-rate source" for Bo. Two mobile-width defects found and fixed on the way (the scope
labels stretched the page to 702px and the seat cards to 670px on a 375px phone) — both now gated.

## What remains the operator's (residual gaps)

1. **A dated exchange-rate source.** One file, four columns (`Currency|Units per USD|As of|Source`), loads through the same
   generator and every non-USD receipt line then shows a figure. Without it, 150 currencies read "awaiting".
2. **The 60 demoted history figures.** If any should settle, the row belongs in the dataset with a verified source (or the
   dataset's `effective_floor_hourly` for that row); nothing in code decides it.
3. **The 53 candidates** — the same: a verified row promotes them.
4. **D1 / D2** remain open (27 places "no single national rate", 15 "no official rate").
5. Cambodia's currency: his approved row said USD, the dataset says KHR — the dataset stands; flagged.
