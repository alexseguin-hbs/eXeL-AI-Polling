# Cube 8 — Billing SECURE: definition and live proof (append-only)

Owner rule (t157u / t178u): a user gets the results of a paid feature only after paying, and billing is "secure" only when every
check below passes **live**. This file is append-only: new runs are added as new dated sections; earlier rows are never edited.
Linked from `docs/CUBES_7-9.md` → Cube 8 — CRS Traceability. CRS: CRS-01.01 (pricing), CRS-14.05 (results gate),
CRS-39.02 (paid views), CRS-39.03 (no live charges from tests).

## Definition — "billing secure" = all 7 checks pass live

| # | Check | Pass criterion (live) | How it is enforced in code |
|---|---|---|---|
| 1 | Stripe webhook signature verified | bad signature 400, no signature 400, stale timestamp 400, valid signature 200 | `cube8_tokens/webhook.py` → `stripe.Webhook.construct_event` with `STRIPE_WEBHOOK_SECRET` |
| 2 | Entitlements set only server-side from the verified webhook | unpaid Moderator Paid poll: `open` → 402; hitting the Checkout `success_url` changes nothing (`is_paid` false, entitlement locked) | `payment_service.handle_payment_completed` is the only writer of `status=completed` + `stripe_event_id`; `view_entitlement` counts only those rows |
| 3 | Paid content never returned to unpaid users | every read route probed as anonymous and as the unpaid creator on a poll with stored 333 summaries: no non-empty `summary_333` / `original`; owner routes 401 to anonymous | `view_entitlement` + PR #29 read-API gate + drill-down |
| 4 | Idempotent webhook handling | replay of the same signed event → 200 `duplicate: true`, no second write | `webhook.py` event-id de-dup + per-row `status != completed` guard |
| 5 | Price computed server-side, not client-tamperable | client sends `amount_cents=1` → Checkout still charges the server quote (≥ $11.11); quote shows margin 1.5 and floor 1111¢ | `poll_pricing.quote_poll` (cost × `PRICING_MARGIN_MULTIPLIER`=1.5 + Stripe fee, $11.11 floor); `create_moderator_checkout` uses `max(client, quote)` |
| 6 | All 3 options + Cost Split + donations work | Free: no Checkout (400), open/join OK. Moderator Paid: live Checkout ≥ $11.11, page 200. Cost Split: creator 50% Checkout, join after open, participant share Checkout from the creator's quote, anonymous seat 403. Donations: API + edge Checkout carry `poll_id`/`participant_id`; foreign participant 404; Divinity Guide $3.33 Checkout | PR #23, #38, #44 |
| 7 | Secret keys only in Worker env | API + frontend Workers hold Stripe keys as secrets (names only listed); no real key pattern in the repo at the deployed SHA | `stripe_config.resolve_secret_key` reads settings/env only |

All live runs use SIMULATED isolated polls on the token-gated proof instance. Checkout Sessions are created and opened, **never paid**, then expired.

## Run 2026-11-09 (CST) — API main `340a9a8e3`, Cloudflare API Worker version `3a35ad5f-0888-44f4-a491-89ae23ef792a` (api-v1w)

Deployed 15:59 CST from main `340a9a8e3` (contains #38 `46efc6b91`, #39 `0534b2f97`, #42 `c18942dac`, #41 `340a9a8e3`). Healthy 15:59:55 CST (`/payments/catalog` 200, mode live, margin 1.5).

| # | Check | Time (CST) | Result | Key evidence | Evidence file (box) |
|---|---|---|---|---|---|
| 1 | Webhook signature | 16:00 | **PASS** | bad sig 400 · no sig 400 · stale 400 · valid 200 (`no_matching_transaction`) | `research-exel/artifacts/payments-live/billing-secure-probe-20261109160002.json` |
| 2 | Server-side entitlement | 16:01 | **PASS** | Moderator Paid unpaid: open 402; success_url hit 200 → `is_paid` false; creator drill-down entitlement `donation_ladder`, 333/Original false, confirmed 0¢ | same + `billing-leak-probe-20261109160329.json` |
| 3 | No paid content to unpaid | 16:03 | **PASS** (one owner-decision exception below) | poll `4ffa0270…` (12 stored 333 summaries): anon `/themes` 200 no 333; anon `/responses`, `/collected`, `/drilldown` 401; unpaid creator `/themes`, `/responses` (12), `/collected` (12), `/drilldown` (8 rows, all with 111) → 0 non-empty 333/Original | `billing-leak-probe-20261109160329.json` |
| 4 | Idempotent webhook | 16:00 | **PASS** | replay → 200 `duplicate: true` | `billing-secure-probe-20261109160002.json` |
| 5 | Server-side price | 16:00 | **PASS** | client 1¢ → charged 1111¢; Stripe `amount_total` 1111; quote margin 1.5, floor 1111, computed 35¢ | same |
| 6 | 3 options + Cost Split + donations | 16:01–16:02 | **PASS** | Moderator Paid live Checkout 1111¢ `prod_VavRfQV5WrXfet` page 200 → expired; Free checkout refused 400, open 200, join 201; Cost Split creator Checkout, join on draft 409 → open 200 → join 201, anonymous seat share 403; signed-in seat share Checkout 56¢ (15:42 CST run, `w2-costsplit-verify.json`); API + edge donations carry `poll_id` + `participant_id`; foreign participant 404; Divinity Guide 333¢ Checkout | `billing-secure-probe-20261109160002.json`, `w2-costsplit-verify.json` |
| 7 | Secrets only in Worker env | 16:05 | **PASS** | API Worker secrets incl. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; frontend Worker `STRIPE_SECRET_KEY` (names only). Repo at `340a9a8e3`: 0 real key patterns (3 hits are fake `sk_live_ABCD…`/`DEAD…` redaction-test fixtures) | wrangler `secret list` (names), `git grep` |

Known exception (owner decision pending, not hidden): the poll **owner** sees each response's cleaned original text (`clean_text`) on the
live-feed routes (`/responses`, `/collected`) even on an unpaid poll. That is the existing moderator live-feed flow; the user asked to keep it
until they decide. Participants and anonymous users cannot reach it (401/403); the paid "Original" on the drill-down stays locked.

Not provable live without a real charge: the **positive** unlock (paid user sees 333/Original). Covered by real-SQL tests
`backend/tests/cube8/test_view_entitlement.py` (webhook-confirmed row unlocks; pending/expired/mismatch never unlock) and by the user's real
$3.33 Divinity Guide donation (steps in the payments report).

Ops incident during this run: API containers for api-v1u/v1s failed to boot (asyncpg connect TimeoutError) because idle DB sessions from
older API instances filled the 15-slot pooler. Idle `exel_api` backends were terminated and main redeployed as api-v1w (15:59 CST).
