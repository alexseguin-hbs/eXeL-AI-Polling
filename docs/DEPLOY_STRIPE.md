# Stripe Activation Checklist

> **No key values live in this repo.** Every key is supplied at runtime as an environment
> variable in the deploy platform's secrets/vault. This file lists only the variable **names**
> and where each goes. Per Stripe's guidance: *"Don't put keys in source code or configuration
> files checked into version control."*

## Key types (Stripe)

| Key | Prefix | Safe to expose | Where it goes |
|-----|--------|:--:|---------------|
| Publishable | `pk_live_` / `pk_test_` | **Yes** (browser) | Frontend env (Cloudflare Pages) |
| Restricted (RAK) | `rk_live_` / `rk_test_` | **No** — server only | Backend env (host/VPS secrets) |
| Secret | `sk_live_` / `sk_test_` | **No** — server only | Backend env (host/VPS secrets) |
| Webhook signing secret | `whsec_` | **No** — server only | Backend env (host/VPS secrets) |

The backend **prefers the restricted key (RAK) over the unrestricted secret key** in each mode
(`app/cubes/cube8_tokens/stripe_config.resolve_secret_key`), per Stripe's "migrate to RAKs"
recommendation. Set either; the RAK wins when both are present.

## FASTEST PATH TO LIVE DONATIONS — edge function (no separate backend)

Donations run through a Cloudflare **Pages Function** at `/api/donate`
(`frontend/functions/api/donate.js`) that creates the Stripe Checkout server-side at the
edge. This works on the existing `workers.dev` deployment with **no FastAPI backend**.

**One step to go live** — in the Cloudflare Pages project → **Settings → Environment
variables → Production**, add an **encrypted** variable (this is a Pages *secret*, stored by
Cloudflare, never in the repo):

```
STRIPE_RESTRICTED_KEY = rk_live_…     # preferred — the RAK must have "Checkout Sessions: write"
# or, if the RAK lacks that scope:
STRIPE_SECRET_KEY     = sk_live_…
```

Redeploy (or it picks up on next deploy). Then the ♡ Donate popup and results prompt
redirect to a **real Stripe Checkout** — a live $1.11 works immediately. No key → the popup
shows the graceful "demo" acknowledgement instead of erroring.

Optional overrides: `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`.

## Frontend build var (Cloudflare Pages → Settings → Environment variables)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_…      # browser-safe; only needed for the
                                                     # embedded Elements flow, NOT the edge
                                                     # redirect donate (which is server-side)
```

## Backend (host/VPS environment or secrets vault — never the repo)

Production (`ENVIRONMENT=production`) uses the `*_LIVE_*` keys; otherwise the test keys are used.

```
ENVIRONMENT               = production
STRIPE_LIVE_RESTRICTED_KEY = rk_live_…              # preferred (scoped permissions)
STRIPE_LIVE_SECRET_KEY     = sk_live_…              # fallback if no RAK
STRIPE_LIVE_PUBLISHABLE_KEY = pk_live_…             # optional (frontend already has it)
STRIPE_WEBHOOK_SECRET      = whsec_…                # from Dashboard → Webhooks → your endpoint
```

Test mode uses the non-`LIVE` variants (`STRIPE_RESTRICTED_KEY`, `STRIPE_SECRET_KEY`, …).

## Go-live steps

1. Set the frontend var in Cloudflare Pages, redeploy the frontend.
2. Set the backend vars in the host secrets, restart the backend.
3. Register the webhook endpoint `POST /api/v1/webhooks/stripe` in the Stripe Dashboard,
   copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Verify with `backend/scripts/verify_stripe_charge.py` (needs `api.stripe.com` reachable).
5. Attach an **access policy** to each live key (Dashboard → API access policies) so only your
   servers can use it.

## If a key was ever shared over chat/email or committed

Rotate it: Dashboard → Developers → API keys → **Rotate** (7-day grace period, no downtime),
then set the fresh value in the deploy env. Publishable keys don't need rotation — they're public
by design. Restricted and secret keys **do**.
