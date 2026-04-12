---
name: Monetization — 3 pricing tiers with donation model
description: Free (max 19, donation), Moderator Paid ($11.11 min + donation), Cost Split (50/50 + donation) — Stripe
type: project
---

3 pricing tiers confirmed by user on 2026-03-30 with donation-based upsell:

## Tier 1: Free (max 19 participants)
- No upfront payment required
- Moderator AND Users prompted to donate **after receiving results** (CSV polling + theming data)
- Donation is optional — results delivered regardless
- Hard cap: 19 participants

## Tier 2: Moderator Paid
- Moderator pays minimum **$11.11 USD** upfront to create session
- Anything above $11.11 is optional (donation)
- After results delivered: both Moderator and Users prompted to donate
- UX shows **cost estimation** to encourage donations matching actual compute cost
- No participant cap (paid tier)

## Tier 3: Cost Split (50/50)
- System estimates cost based on **# of users** and **# of responses**
- **50% paid by Moderator**
- **50% split equally among N users** (each user pays: 50% of total / N)
- Above the estimated cost: Moderator and Users asked to donate
- UX shows cost estimation breakdown

## Common Patterns
- Donation prompt appears **after results are delivered** (not before)
- UX shows cost estimation to anchor donation amounts
- All payments via Stripe (test keys configured 2026-03-30)
- Stripe keys in `.env` (gitignored): secret, publishable, restricted

**Why:** User specified exact split formula and $11.11 minimum on 2026-03-30.
**How to apply:** Moderator Paid minimum = $11.11 (1111 cents). Cost Split formula = estimate / 2 for Moderator, estimate / 2 / N for each user. Donation prompt on results screen for all tiers.
