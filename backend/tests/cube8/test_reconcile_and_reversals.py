"""t193u: reconciliation compare() + refund/dispute ledger marking."""
import asyncio
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube8_tokens import payment_service
from app.cubes.cube8_tokens.reconcile import compare, kind


def test_kind_flags_contribution_vs_purchase():
    assert kind("donation") == "contribution" and kind("divinity_guide_donation") == "contribution"
    assert kind("moderator_fee") == "purchase" and kind("cost_split") == "purchase"


def test_compare_finds_every_mismatch_class():
    charges = [
        {"payment_intent": "pi_ok", "charge": "ch_1", "amount": 333},
        {"payment_intent": "pi_missing", "charge": "ch_2", "amount": 333},
        {"payment_intent": "pi_pending", "charge": "ch_3", "amount": 500},
        {"payment_intent": "pi_amt", "charge": "ch_4", "amount": 999},
        {"payment_intent": "pi_ref", "charge": "ch_5", "amount": 333, "refunded_amount": 333},
    ]
    rows = [
        {"id": 1, "stripe_payment_intent_id": "pi_ok", "amount_cents": 333, "status": "completed", "transaction_type": "donation"},
        {"id": 2, "stripe_payment_intent_id": "pi_pending", "amount_cents": 500, "status": "pending", "transaction_type": "moderator_fee"},
        {"id": 3, "stripe_payment_intent_id": "pi_amt", "amount_cents": 111, "status": "completed", "transaction_type": "cost_split"},
        {"id": 4, "stripe_payment_intent_id": "pi_ref", "amount_cents": 333, "status": "completed", "transaction_type": "donation"},
    ]
    issues = {(i["payment_intent"], i["issue"]) for i in compare(charges, rows)}
    assert issues == {("pi_missing", "missing_in_ledger"), ("pi_pending", "unconfirmed"),
                      ("pi_amt", "amount_mismatch"), ("pi_ref", "refund_not_recorded")}


def _db_with(tx):
    db = MagicMock()
    res = MagicMock(); res.scalar_one_or_none.return_value = tx
    db.execute = AsyncMock(return_value=res); db.commit = AsyncMock()
    return db


def test_full_refund_marks_refunded_partial_and_dispute_annotate():
    tx = MagicMock(status="completed", amount_cents=333, reconcile_status="stripe_confirmed", product_line="x")
    ev = {"id": "evt_r", "type": "charge.refunded", "data": {"object": {"payment_intent": "pi_1", "amount": 333, "amount_refunded": 333, "refunded": True}}}
    asyncio.run(payment_service.handle_charge_reversal(_db_with(tx), ev))
    assert tx.status == "refunded" and tx.reconcile_status == "refunded:333" and tx.stripe_event_id == "evt_r"

    tx2 = MagicMock(status="completed", amount_cents=333, reconcile_status=None, product_line="x")
    ev2 = {"id": "evt_p", "type": "charge.refunded", "data": {"object": {"payment_intent": "pi_2", "amount": 333, "amount_refunded": 100, "refunded": False}}}
    asyncio.run(payment_service.handle_charge_reversal(_db_with(tx2), ev2))
    assert tx2.status == "completed" and tx2.reconcile_status == "partially_refunded:100"

    tx3 = MagicMock(status="completed", amount_cents=333, reconcile_status=None, product_line="x")
    ev3 = {"id": "evt_d", "type": "charge.dispute.created", "data": {"object": {"payment_intent": "pi_3", "reason": "fraudulent"}}}
    asyncio.run(payment_service.handle_charge_reversal(_db_with(tx3), ev3))
    assert tx3.status == "completed" and tx3.reconcile_status == "disputed:fraudulent"


def test_reversal_without_row_is_a_no_op():
    ev = {"id": "evt_x", "type": "charge.refunded", "data": {"object": {"payment_intent": "pi_none", "amount": 1, "amount_refunded": 1}}}
    assert asyncio.run(payment_service.handle_charge_reversal(_db_with(None), ev)) is None
