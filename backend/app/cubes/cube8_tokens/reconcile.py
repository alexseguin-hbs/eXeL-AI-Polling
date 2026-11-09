"""t193u (6): daily Stripe ↔ ledger reconciliation (read-only; never charges, refunds or pays out).

compare() is pure and unit-tested. run() reads Stripe balance transactions (charges + refunds) for a window
and the payment_transactions rows, and returns mismatches:
  missing_in_ledger   — Stripe has a charge whose payment_intent has no ledger row (e.g. an edge Checkout)
  unconfirmed         — ledger row still pending/failed although Stripe captured the money (webhook missed)
  amount_mismatch     — Stripe gross ≠ ledger amount_cents
  refund_not_recorded — Stripe refunded but the ledger row is not refunded / partially_refunded
Each finding carries ids and cents only — no payer names or emails.
"""
from __future__ import annotations

DONATION_TYPES = {"donation", "divinity_guide_donation", "derisking_strategies_donation"}


def kind(transaction_type: str | None) -> str:
    """Donation-vs-purchase flag kept with every record (t193u (4))."""
    return "contribution" if (transaction_type or "") in DONATION_TYPES else "purchase"


def compare(stripe_charges: list[dict], ledger_rows: list[dict]) -> list[dict]:
    """stripe_charges: {payment_intent, charge, amount, refunded_amount, created}
    ledger_rows: {id, stripe_payment_intent_id, amount_cents, status, reconcile_status, transaction_type}"""
    by_pi = {r.get("stripe_payment_intent_id"): r for r in ledger_rows if r.get("stripe_payment_intent_id")}
    out: list[dict] = []
    for c in stripe_charges:
        pi = c.get("payment_intent")
        row = by_pi.get(pi)
        base = {"payment_intent": pi, "charge": c.get("charge"), "stripe_amount": c.get("amount"), "created": c.get("created")}
        if row is None:
            out.append({**base, "issue": "missing_in_ledger"})
            continue
        base.update({"ledger_id": str(row.get("id")), "kind": kind(row.get("transaction_type"))})
        if int(row.get("amount_cents") or 0) != int(c.get("amount") or 0):
            out.append({**base, "issue": "amount_mismatch", "ledger_amount": row.get("amount_cents")})
        refunded = int(c.get("refunded_amount") or 0)
        rs = str(row.get("reconcile_status") or "")
        if refunded and not (row.get("status") == "refunded" or rs.startswith("partially_refunded")):
            out.append({**base, "issue": "refund_not_recorded", "refunded_amount": refunded})
        elif not refunded and row.get("status") != "completed":
            out.append({**base, "issue": "unconfirmed", "ledger_status": row.get("status")})
    return out


def stripe_charges_since(stripe_mod, since_ts: int) -> list[dict]:
    """Read-only: succeeded charges created since `since_ts` (auto-paginated)."""
    rows = []
    for ch in stripe_mod.Charge.list(created={"gte": since_ts}, limit=100).auto_paging_iter():
        if ch.get("status") != "succeeded" or not ch.get("paid"):
            continue
        rows.append({"payment_intent": ch.get("payment_intent"), "charge": ch.get("id"), "amount": ch.get("amount"),
                     "refunded_amount": ch.get("amount_refunded") or 0, "created": ch.get("created")})
    return rows
