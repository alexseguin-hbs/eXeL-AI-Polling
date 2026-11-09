"""Daily Stripe ↔ ledger reconciliation (read-only). Usage:
  STRIPE_SECRET_KEY=… DATABASE_URL=… python scripts/reconcile_stripe_ledger.py [--days 2]
Exit 0 = clean, 2 = mismatches (printed as JSON: ids and cents only)."""
import argparse
import asyncio
import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


async def main(days: int) -> int:
    import stripe
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    from app.cubes.cube8_tokens.reconcile import compare, stripe_charges_since

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    charges = stripe_charges_since(stripe, int(time.time()) - days * 86400)
    eng = create_async_engine(os.environ["DATABASE_URL"])
    async with eng.connect() as c:
        res = await c.execute(text(
            "select id, stripe_payment_intent_id, amount_cents, status, reconcile_status, transaction_type "
            "from payment_transactions where stripe_payment_intent_id is not null"))
        rows = [dict(r._mapping) for r in res]
    await eng.dispose()
    issues = compare(charges, rows)
    print(json.dumps({"checked_charges": len(charges), "issues": issues}, default=str, indent=2))
    return 2 if issues else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=2)
    sys.exit(asyncio.run(main(ap.parse_args().days)))
