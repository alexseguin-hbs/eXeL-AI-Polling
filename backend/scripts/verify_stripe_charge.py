#!/usr/bin/env python
"""Verify Stripe charge capability end-to-end (run where api.stripe.com is reachable).

WHY THIS SCRIPT: the cloud dev sandbox blocks outbound to api.stripe.com (org egress
policy), so charging can't be verified from there. Run this from your machine, your
deployment, or any environment where Stripe is reachable.

KEYS: read from the environment ONLY — never hardcoded. Set a TEST key first:
    export STRIPE_SECRET_KEY=sk_test_...          # test mode (safe — no real money)
    # OR put stripe_secret_key=sk_test_... in backend/.env (git-ignored)
Then:
    cd backend && python scripts/verify_stripe_charge.py

It runs three checks and exits non-zero on any failure:
  1. AUTH      — Balance.retrieve() proves the key works + reports test/live mode.
  2. CHARGE    — PaymentIntent for $11.11 confirmed with the test Visa (pm_card_visa)
                 → status 'succeeded' proves a customer can actually be charged.
  3. CHECKOUT  — a hosted Checkout Session ($11.11) proves the Moderator-Paid surface.

NEVER run step 2/3 against a LIVE key unless you intend a real $11.11 charge.
"""
import os
import sys
from pathlib import Path

# Make `app` importable when run as `python scripts/verify_stripe_charge.py` from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.cubes.cube8_tokens.stripe_config import (  # noqa: E402
    StripeNotConfiguredError,
    get_stripe_client,
    stripe_config_status,
)


def main() -> int:
    status = stripe_config_status()
    print(f"Stripe config: configured={status['configured']} mode={status['mode']} "
          f"key={status['secret_key_masked'] or '(none)'}")
    if status["mode"] == "live":
        print("⚠  LIVE key detected — step 2 will create a REAL $11.11 charge. Ctrl-C to abort.")
    print("-" * 64)

    try:
        stripe = get_stripe_client()
    except StripeNotConfiguredError as e:
        print("NOT CONFIGURED:", e)
        return 2

    # 1) AUTH
    try:
        bal = stripe.Balance.retrieve()
        print(f"1. AUTH ok — account reachable · livemode={bal.get('livemode')}")
    except Exception as e:  # noqa: BLE001
        print("1. AUTH FAILED:", type(e).__name__, str(e)[:200])
        return 1

    # 2) CHARGE a customer (test card) — the real "can we charge" proof
    try:
        pi = stripe.PaymentIntent.create(
            amount=1111, currency="usd",
            payment_method="pm_card_visa",
            confirm=True,
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            description="eXeL AI Polling — charge-capability verification ($11.11)",
        )
        print(f"2. CHARGE {pi.status.upper()} — PaymentIntent {pi.id} · ${pi.amount / 100:.2f}")
        if pi.status != "succeeded":
            return 1
    except Exception as e:  # noqa: BLE001
        print("2. CHARGE FAILED:", type(e).__name__, str(e)[:300])
        return 1

    # 3) Hosted Checkout ($11.11 Moderator-Paid surface)
    try:
        cs = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{"price_data": {"currency": "usd",
                "product_data": {"name": "eXeL AI Polling — Moderator Paid"},
                "unit_amount": 1111}, "quantity": 1}],
            success_url="https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://example.com/cancel",
        )
        print(f"3. CHECKOUT ok — hosted URL: {cs.url}")
    except Exception as e:  # noqa: BLE001
        print("3. CHECKOUT FAILED:", type(e).__name__, str(e)[:300])
        return 1

    print("-" * 64)
    print("RESULT: ability to charge customers is VERIFIED ✅")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
