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

## FASTEST PATH TO LIVE DONATIONS — the Worker (no separate backend)

The site ships as **Workers Static Assets** (`frontend/wrangler.jsonc` → `main: worker.js`).
Donations run through the Worker route `/api/donate` (`frontend/worker.js` → `donate-core.js`),
which creates the Stripe Checkout session at the edge. **Cloudflare Pages settings do not reach
this Worker** — the earlier Pages instructions in this file were stale (found 2026-09-07).

**One step to go live** — set a Worker **secret** (stored by Cloudflare, never in the repo):

```
cd frontend
npx wrangler secret put STRIPE_RESTRICTED_KEY      # preferred — the RAK needs "Checkout Sessions: write"
# or, if the RAK lacks that scope:
npx wrangler secret put STRIPE_SECRET_KEY
```

(Or Cloudflare dashboard → Workers & Pages → `exel-ai-polling` → Settings → Variables and
Secrets → **Add secret**.) The next deploy — or the secret's own save on a Worker — makes the
♡ Donate popup, the results prompt, and the Divinity Guide prompt redirect to a **real Stripe
Checkout**; a live $1.11 works immediately. No key → every popup shows the honest demo
acknowledgement instead of erroring, and the Divinity Guide never claims a donation it did not get.

Optional: `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, and `DONATE_ALLOWED_ORIGINS` (comma-separated
preview origins allowed to call the endpoint; the Worker's own origin is always allowed and every
other origin is refused — the endpoint is same-origin by design).

Verify from a real browser: open the site, tap ♡ Donate, pick $1.11 → a `checkout.stripe.com`
page must open. That is the only proof; `npm run status` reports Stripe as UNVERIFIED until then.

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


## Sign Doc — Worker secrets and bindings (2026-09-08)

| What | Where | Effect when set |
|---|---|---|
| `OPENAI_API_KEY` · `GEMINI_API_KEY` · `XAI_API_KEY` | Worker secrets (`wrangler secret put …`) | `/api/ai` answers; "AI: find my line" (Sign Doc) and "Draft with AI" (Create Doc) appear; provider Auto = first configured |
| KV namespace bound as `SIGN_FILES` | `wrangler.jsonc` → `kv_namespaces` (sample line in the file) | `/api/tmp` stores partly-signed PDFs for 24 h; the hand-off script carries a `?f=<token>` link |
| `RESEND_API_KEY` · `NOTIFY_FROM` | Worker secrets | "Send by e-mail" sends from eXeL (server-composed text, per-address throttle) |
| migration `036_sign_envelopes.sql` | Supabase SQL editor (Copy button in "Why can't I sign?") | two-signer hand-off links |
