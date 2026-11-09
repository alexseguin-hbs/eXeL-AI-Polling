# Provider fee weekly refresh (REVIEW — not activated)

## Purpose
Server-side weekly reaffirmation/lookup of provider fee catalog used by
Moderator Settings → Cost Estimate and the session cost ledger.

## Supported schedulers (pick one at deploy time)
1. **Cloudflare Workers Cron Triggers** — add to `wrangler.toml` (example, NOT applied):
   ```toml
   [triggers]
   crons = ["0 14 * * 1"]  # Mondays 14:00 UTC
   ```
   Handler should POST/invoke backend `POST /api/v1/payments/provider-fees/refresh`
   with an admin/service credential (not built into this PR's production config).

2. **Fly.io / Railway / Cloud Run scheduler** — cron hitting the same admin endpoint.

3. **Systemd timer / GitHub Actions** — only for non-production reaffirmation.

## What the job must do
- Call `fee_catalog.mark_weekly_check(persist=True)` (or HTTP refresh).
- Retain `prior_versions` (last 12).
- Never overwrite `manual_override` entries.
- Never write Stripe Price/Product objects.
- Never treat unknown rates as $0.
- Record `change_evidence`.

## Activation status
**NOT PERFORMED in this PR.** Config/docs only. Operator must enable cron + secrets.
