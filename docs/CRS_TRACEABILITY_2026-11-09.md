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
| CRS-15.09 | Cube 3 | Live voice-to-text for Moderator **and** Participants | **Implemented (code)** 2026-11-09 |
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
| CRS-39.02 | 333 / Original unlock = Stripe **webhook-confirmed** payment (completed + `stripe_event_id`, amount mismatches excluded), never the creation tier. One rule `backend/app/cubes/cube8_tokens/view_entitlement.py`; server APIs `GET /sessions/{id}/view-entitlement`, `GET /sessions/{id}/drilldown` (333/Original returned as null unless paid); CSV ladder `resolve_export_tier` counts confirmed only; dashboard + drawer read server entitlement; expand no longer reveals Original | 14fdbfa6f | `backend/tests/cube8/test_view_entitlement.py` 18 passed (local); `frontend/tests/view-entitlement.test.mjs` 18 passed (local) | `/workspace/research-exel/artifacts/payments-live/PROGRESS.md`; live `/workspace/research-exel/artifacts/payments-live/w2-unlock-verify.json` | In progress — merged PR #23 (937d1725e), API deployed api-v1p; live: anonymous entitlement locked, drilldown without auth 401 (2026-11-09 08:00 CST). Real paid unlock not yet exercised |
| CRS-39.02 | Donations carry `session_id` / `poll_id` / `participant_id` (edge `/api/donate`, API `/payments/divinity-donate`); webhook validates poll + participant, scopes the row → ladder reachable | 14fdbfa6f | `test_view_entitlement.py` donation cases; `frontend/tests/donate-core.test.mjs` donate-scope 6 passed (local) | `w2-unlock-verify.json` (API Checkout scoped, foreign participant 404, signed synthetic webhook → scoped row, replay duplicate); `w2-edge-donate-recheck.json` (edge Checkout scoped, 2026-11-09 08:05 CST); all Checkouts expired unpaid | In progress — merged #23, live-verified up to Checkout + signed synthetic webhook; no real payment yet |
| CRS-14.05 | Results gate: cost-split export 402 waived only when the quote says no participant share is due | 14fdbfa6f | `backend/tests/cube8`, `cube9` suites (local; 3 pre-existing failures also on origin/main 56c24257f: 59-jurisdiction rate tests) | same | In progress |
| CRS-01.01 | Cost Split participant share priced by the creator's pricing path (`cost_split_quote` → frozen creator quote or `poll_pricing.quote_for_session`); margin stays single `PRICING_MARGIN_MULTIPLIER` (1.5); share < $0.50 → 409, no minimum over-charge | 14fdbfa6f | `test_view_entitlement.py` cost-split cases; `test_payment_stripe.py::TestAmountPrecision` (local) | same | In progress |
| CRS-39.03 | No live charges from tests: Stripe create calls patched; real-SQL ledger tests on in-memory SQLite | 14fdbfa6f | as above | same | In progress |
| CRS-39.02 / CRS-14.05 | Paid-tier (Moderator Paid / Cost Split) creator CSV export returns the full tier only after the creator Checkout is webhook-confirmed (Cost Split can open unpaid); Free poll moderator export unchanged | 8c58371be | `test_view_entitlement.py::test_moderator_export_follows_creator_payment_on_paid_tiers` + cube8/cube9 suites (local) | `/workspace/fleet/payments-supabase/WORKFLOW_MAP.md` | In progress |
| CRS-39.02 / CRS-14.05 | Read APIs exposed by #27 now withhold `summary_333` unless `view_entitlement` grants it: `GET /sessions/{id}/themes`, cube2 response list/detail (`apply_response_paid_view_gate` wired), cube4 `/collected` list/single. 33/111 and moderator raw text unchanged (existing live-feed flow) | f96858755, 6c41f63a8 | `test_view_entitlement.py` 21 passed incl. `test_get_themes_withholds_theme_333_until_paid`, `test_collected_withholds_333_until_creator_paid`; `tests/cube2/test_summary_tiers_expose.py`; cube2/4/6/7/8/9 + contract gates 1166 passed, 3 pre-existing failures (local) | PR #29; live `/workspace/research-exel/artifacts/payments-live/w2-readgate-verify.json` | In progress — merged #29 (0b62f1496), API deployed api-v1q (Worker version 64c8f9bd); live 2026-11-09 08:19 CST: anonymous GET /themes returns no non-null summary_333, /responses and /collected 401 without auth. No production theme row has a stored 333 yet (read-only SQL), so redaction of a real value is shown by tests only |

## Implementation evidence (CRS-15.09 live voice) — updated 2026-11-09

| CRS | Change | Commit | Tests (verified) | Evidence | Status |
|-----|--------|--------|------------------|----------|--------|
| CRS-15.09 | LiveVoiceDictate (browser Web Speech + `/voice/transcribe` Whisper/Gemini/AWS fallback); mic on participant response, moderator create title/description, decision reason; STT cost/min → AICostLog `phase=stt`; rates from https://developers.openai.com/api/docs/pricing (Whisper $0.006/min, verified 2026-11-09). xAI STT still unavailable (403). | (pending PR merge) | `frontend/tests/live-voice-dictate.test.mjs`; `backend/tests/cube3/test_transcribe_only.py` | Browser Web Speech **unverifiable headless**; server path live-verified with short audio sample after deploy | In progress — code on branch |
