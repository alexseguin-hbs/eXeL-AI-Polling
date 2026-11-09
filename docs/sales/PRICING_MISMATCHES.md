# Pricing / payment-options copy vs live Stripe + margin (verified 2026-11-09 America/New_York)

Evidence:
- Live Stripe products (acct_1TGqNOAiPbve9Sot livemode): fleet/sales/stripe-live-products-20261109.json + MCP GetProducts
- Live prices: MCP GetPrices
- Live quotes: fleet/sales/live-poll-quote-moderator.json, live-poll-quote-cost-split.json, live-poll-quote-cost-split-5k.json
- Code: backend/app/cubes/cube8_tokens/poll_pricing.py (PRICING_MARGIN_MULTIPLIER default 1.5), stripe_catalog.py, config.py product IDs
- UI: frontend/components/stripe-payment.tsx PricingTierSelector; frontend/lib/constants.ts PRICING_TIERS; lexicon cube8.pricing.*

## Matches (OK)
| Claim | Evidence |
|---|---|
| Three tiers: Free / Moderator Paid / Cost Split | constants.ts + PricingTierSelector + live products prod_VavRfQV5WrXfet, prod_VavRP8VVmVPxhe, prod_VavRscDoQJfvGJ |
| Margin = cost × 1.5 (cost + 50% markup) | Live poll-quote margin_multiplier="1.5", margin_label="cost + 50% markup (×1.5)"; poll_pricing.py default |
| Moderator Paid floor $11.11 | Live quote total_cents/creator_due_cents/floor_cents=1111; Stripe default price unit_amount=1111; product desc mentions min $11.11 |
| Config product IDs match live | config.py prod_VavR* == live GetProducts ids |
| Checkout uses dynamic price_data (not fixed catalog price) | payment_service + stripe_catalog.price_data; default Stripe prices are placeholders |
| Divinity / DeRisking / Community donation products live | prod_VavR1Xy18Cyu43, prod_VavRWTGbsPbrLx, prod_VavRF4QMRRsden; custom_unit_amount min 50¢ |

## Mismatches / nuances (document for sales; do not invent fixes beyond copy)
| # | Issue | Detail | Severity |
|---|---|---|---|
| 1 | PricingTierSelector hardcoded English | Tier name/desc/detail were NOT passed through t() despite lexicon keys cube8.pricing.free* / moderator_* / cost_split*. **WIP fix applied on branch** (wire to t()). Amount label also hardcoded → t("cube8.pricing.amount_label"). | Copy/i18n |
| 2 | Cost Split "50/50" vs floor behavior | UI: "50% you + 50% split among users". Live quote at N=100 and N=5000 (default options): computed_price_cents 35–196 < floor 1111 → total_cents=1111, creator_due=1111, **participant_share_cents=0**. Matches WORKFLOW_MAP rule (share <$0.50 → creator pays 100%), but card copy still says 50/50 without the floor caveat. | Copy honesty |
| 3 | Stripe default Cost Split moderator price $5.56 | price_1UZjat… unit_amount=556. Runtime Checkout uses quote (often $11.11 floor for creator). Default price is unused when price_data is sent — OK technically; confusing if someone reads Stripe Dashboard defaults as the charged amount. | Ops/docs |
| 4 | Stripe default participant share $0.50 | price_1UZjaw… unit_amount=50. Live small quotes charge participants $0 (share waived). Same caveat as #2. | Ops/docs |
| 5 | constants.ts PRICING_TIERS unused in UI | Descriptions differ slightly from lexicon ("Moderator pays min $11.11 — unlimited…" vs "Unlimited participants" / "You pay upfront…"). Only defined, not imported elsewhere — dead copy risk if re-used later. | Low |
| 6 | "50% margin" language | Owner rule = ×1.5. poll_pricing comments note ×1.5 = cost+50% markup ≈ 33.3% gross margin; ×2.0 = 50% gross. Live API correctly labels "cost + 50% markup (×1.5)". Sales must not say "50% gross margin" unless multiplier becomes 2.0. | Messaging |
| 7 | settings-ledger.gen.ts still says "owner decision pending" for 1.5 vs 2.0 | Stale vs standing rule (50% = ×1.5). Ledger/docs drift — not pricing UI. | Docs drift |

## Not changed (payments worker owns runtime payment paths)
- No Stripe product/price edits
- No real charges
- WORKFLOW_MAP.md left untouched
