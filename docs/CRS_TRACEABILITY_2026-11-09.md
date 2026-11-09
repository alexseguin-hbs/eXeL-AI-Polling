# CRS Traceability Delta — Original Polling Design Rounds + Scale / Voice / Transparency

> **Date added:** 2026-11-09 (America/Chicago)  
> **Scope:** Docs-only. Captures CRS rows added from the operator's original pre-AI polling sketches (Round 1–3 + Pay to View) plus steered scale, moderator-transparency, and dual-role live voice items.  
> **Status rule:** **Planned** or **In progress** only — never **Implemented** in this delta.  
> **Canonical numbering:** `Requirements.txt`. Cube specs: `docs/CUBES_1-3.md`, `docs/CUBES_4-6.md`, `docs/CUBES_7-9.md`.  
> **Does not modify** `docs/CRS_TRACEABILITY_2026-07-03.md` (pre-existing delta remains as-is).  
> **Does not touch** `docs/traceability/*.ledger.json` (pre-existing release-ancestor failures on main are unchanged by this PR).

## Ownership

| CRS | Cube | Title | Status |
|-----|------|-------|--------|
| CRS-09.08 | Cube 6 (theming) / Cube 7 (prioritization) | 1M live theming+prioritization; Theme02 <3s; metrics shown | Planned |
| CRS-15.09 | Cube 3 | Live voice-to-text for Moderator **and** Participants | Planned |
| CRS-22.04 | Cube 7 | Moderator final decision transparency (show group #1 + reason) | Planned |
| CRS-36 | Cube 7 | Round 1 variable auto-select (e.g. 40% · 4/10) | Planned |
| CRS-36.01–.03 | Cube 7 | Auto-select config / ballot subset / replay hash | Planned |
| CRS-37 | Cube 7 | Round 2 top-3 · 3/2/1 (`top3_points`) | **In progress** |
| CRS-37.01–.04 | Cube 7 | Subset ballot / per-category / aggregate / impl track | **In progress** |
| CRS-38 | Cube 7 | Round 3 Expert Opinion (3 experts → AI 1-pager) | Planned |
| CRS-38.01–.03 | Cube 7 | Expert UI / AI 1-pager / audit | Planned |
| CRS-39 | Cube 9 | Pay to View details 1 / 2 / 3 | **In progress** (2026-11-09, see Implementation evidence) |
| CRS-39.01 | Cube 9 | Detail 1/2/3 tier map (pricing decision) | Planned |
| CRS-39.02 | Cube 9 / Cube 8 | Unify gates: one server rule for drawer / ranked / export | **In progress** — code + local tests (14fdbfa6f) |
| CRS-39.03 | Cube 8 | No live charges in test | **In progress** — tests patch Stripe create calls (14fdbfa6f) |

## Numbering note

Polling Requirements.txt continues CRS-01…35 with **CRS-36…39** for original-design rounds. Vision Innovation Project ids in `frontend/lib/innovation-data.ts` (CRS-36→93) are a **separate product surface** and are not these rows. Design matrix after CRS-35 historically jumped to CRS-94.* for Vision R-CORE; this delta inserts polling CRS-36…39 before that Vision block in `frontend/lib/crs-matrix-data.ts`.

## Sources (no secrets)

- Operator sketches under `/workspace/original-polling-design/` (Round 1 auto-select; Round 2 top-3 3/2/1 Support/Concerns/Neutral; Round 3 Expert Opinion; Pay to View 1/2/3).
- Workflow map `/workspace/fleet/exel-ai-quality/map.md` (main vs original design gaps).
- Sandbox `.txt` / zip may contain a historical API key — **never copy or repeat it** in repo docs.

## Existing coverage (why sub-items, not duplicates)

| Need | Existing CRS | Action |
|------|--------------|--------|
| Live STT capability | CRS-15.03 (paid realtime); Cube 3 also defines CRS-15.04–.08 for CB/semaphore/WS | **Add CRS-15.09** for explicit Moderator+Participant input-path coverage |
| Lead override + justification | CRS-22 / .01 / .02 | **Add CRS-22.04** so participants still see group #1 + reason when #1 is not adopted |
| 1M / theming budgets | Requirements burst 1M; Cube 6 `scale_pipeline.py` 60s budget | **Add CRS-09.08** for Theme02 **<3s** + **metrics shown** (stronger/clearer than 60s full pipeline) |
| Full-set Borda ranking | CRS-11 / CRS-12 | **Add CRS-36/37** for original Round 1–2 ballot shape (`top3_points`) without changing Borda claims |
| Export / paid depth | CRS-14.* content tiers | **Add CRS-39** for original Pay to View Detail 1/2/3 unification |

## Cube last-updated stamps touched

| Cube | Doc | Stamp |
|------|-----|-------|
| 3 | `docs/CUBES_1-3.md` | CRS-15.09 added 2026-11-09 |
| 6 | `docs/CUBES_4-6.md` | CRS-09.08 planned 2026-11-09 |
| 7 | `docs/CUBES_7-9.md` | original-design rounds added 2026-11-09 |
| 9 | `docs/CUBES_7-9.md` | Pay-to-View CRS-39 added 2026-11-09 |

## Implementation evidence (payments / Pay to View) — updated 2026-11-09

Status is recorded **only as verified**. "Local" = run on the build box, not CI or production.

| CRS | Change | Commit | Tests (verified) | Evidence | Status |
|-----|--------|--------|------------------|----------|--------|
| CRS-39.02 | 333 / Original unlock = Stripe **webhook-confirmed** payment (completed + `stripe_event_id`, amount mismatches excluded), never the creation tier. One rule `backend/app/cubes/cube8_tokens/view_entitlement.py`; server APIs `GET /sessions/{id}/view-entitlement`, `GET /sessions/{id}/drilldown` (333/Original returned as null unless paid); CSV ladder `resolve_export_tier` counts confirmed only; dashboard + drawer read server entitlement; expand no longer reveals Original | 14fdbfa6f | `backend/tests/cube8/test_view_entitlement.py` 18 passed (local); `frontend/tests/view-entitlement.test.mjs` 18 passed (local) | `/workspace/research-exel/artifacts/payments-live/PROGRESS.md` | In progress (merge / deploy / live pending) |
| CRS-39.02 | Donations carry `session_id` / `poll_id` / `participant_id` (edge `/api/donate`, API `/payments/divinity-donate`); webhook validates poll + participant, scopes the row → ladder reachable | 14fdbfa6f | `test_view_entitlement.py` donation cases; `frontend/tests/donate-core.test.mjs` donate-scope 6 passed (local) | same | In progress |
| CRS-14.05 | Results gate: cost-split export 402 waived only when the quote says no participant share is due | 14fdbfa6f | `backend/tests/cube8`, `cube9` suites (local; 3 pre-existing failures also on origin/main 56c24257f: 59-jurisdiction rate tests) | same | In progress |
| CRS-01.01 | Cost Split participant share priced by the creator's pricing path (`cost_split_quote` → frozen creator quote or `poll_pricing.quote_for_session`); margin stays single `PRICING_MARGIN_MULTIPLIER` (1.5); share < $0.50 → 409, no minimum over-charge | 14fdbfa6f | `test_view_entitlement.py` cost-split cases; `test_payment_stripe.py::TestAmountPrecision` (local) | same | In progress |
| CRS-39.03 | No live charges from tests: Stripe create calls patched; real-SQL ledger tests on in-memory SQLite | 14fdbfa6f | as above | same | In progress |
