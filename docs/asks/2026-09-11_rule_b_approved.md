# Operator approval — 2026-09-11 · Rule B

## Verbatim (the option chosen)

> Rule B — 102 rows, 77 countries (Recommended)
> Load every NEW or FILL row that has a figure, where both researchers independently agreed, at high or medium
> confidence. Includes DC, Puerto Rico, Guam, USVI and CNMI. Disputed, low-confidence, single-sourced, cross-check and
> D1/D2-blocked rows stay on the sheet, unloaded, for a session that can verify sources live. Duplicates from Thor's
> sweep are collapsed to the regional researcher's row.

## The rule, exactly as applied

From `docs/asks/2026-09-11_minimum_wage_rate_table_FLEET_PROPOSAL.psv`, a row loads iff:
`section ∈ {new, fill}` AND `Hourly Wage Rate ≠ NULL` AND `agents_agreed = A=B` AND `confidence ∈ {high, medium}`.
Where the same (country code, jurisdiction) appears from two regions, the regional researcher's row is kept and Thor's
sweep row is dropped; if both are regional, the higher confidence wins, then the earlier as-of is NOT preferred — the
later one is. The five US territories carry their own ISO codes on the sheet; in the record they are localities of the
United States (country code US, the ISO code kept in the note), so a US contributor elects them under one place.

## What stays unloaded, on the sheet
Disputed (75), low-confidence (137), single-sourced (87), cross-checks beside the operator's rates (37), rows blocked
until D1/D2 are ruled (46), and every NULL row — awaiting a session that can verify each instrument live.

## Provenance
Approval given 2026-09-11 in answer to the load question. Persisted before the load (PERSIST FIRST, AAR 2026-08-28).
Every loaded row remains `verified = no` in its provenance; the operator approved the rule, not the sources.
