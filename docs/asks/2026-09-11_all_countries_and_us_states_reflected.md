# Operator ask — 2026-09-11 · are all official country locations and US states' minimum wages reflected?

## Verbatim

> are all official country locations and UsA states min wage. reflected?

## The answer, measured from the shipped record (`lib/pod-rates.ts`)

| | In the record | Missing |
|---|---|---|
| US states | 50 of 50 (`hi_rates.py`) | the District of Columbia; Puerto Rico, Guam, U.S. Virgin Islands, American Samoa, Northern Mariana Islands |
| Countries | 104 (the operator's 103 + Cambodia) | ~91 UN member states |
| Places that can settle today | 80 of 157 | 36 "rate exists, not loaded" · 29 Tier-2 (D1) · 12 Tier-3 (D2) |

**No** — not all.

## The decision

Asked how the missing floors should enter the record, the operator chose: **"Fleet researches, you approve."**

## A fact that governs the work

From this environment every official source is unreachable — dol.gov, ilo.org, Eurostat, the World Bank and gov.uk all
refuse the connection (probed 2026-09-11). The fleet can research from what it knows and name the statutory instrument
and its URL, but cannot verify one figure live. Therefore: every proposed row carries `verified = no`; the proposal is a
sheet in the operator's own format with provenance columns beside it; **nothing enters `pod-rates.ts` until the operator
approves**; the operator's 114 rows are never changed. A figure without a named instrument and a date is not a figure.

## Provenance
Question and decision 2026-09-11. Persisted before the fleet was launched (PERSIST FIRST, AAR 2026-08-28).
