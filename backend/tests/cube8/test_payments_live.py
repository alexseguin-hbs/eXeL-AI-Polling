"""Payments go-live (2026-11-08): poll option pricing, donation purposes, signed webhook, durable dedupe."""
import hashlib
import hmac
import json
import time
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.cubes.cube8_tokens import poll_pricing
from app.cubes.cube8_tokens.payment_service import handle_payment_completed, create_divinity_donation_checkout
from app.models.payment import PaymentTransaction


# ---------------------------------------------------------------- pricing
def test_quote_floor_and_margin_default_1_5(monkeypatch):
    monkeypatch.setattr(poll_pricing.settings, "pricing_margin_multiplier", "1.5", raising=False)
    q = poll_pricing.quote_poll(poll_pricing.PollQuoteInput(participants=100))
    assert q["margin_multiplier"] == "1.5"
    assert q["margin_decision_pending"] is True
    assert q["total_cents"] == poll_pricing.MODERATOR_MIN_FEE_CENTS  # tiny AI cost → $11.11 floor
    assert set(q["options"]) == set(poll_pricing.DEFAULT_OPTIONS)
    assert Decimal(q["tracked_cost_usd"]) > 0


def test_quote_large_poll_exceeds_floor_and_margin_2_costs_more(monkeypatch):
    big = poll_pricing.PollQuoteInput(participants=1_000_000, ai_provider="claude", options=poll_pricing.ALL_OPTIONS, voice_share=0.5)
    monkeypatch.setattr(poll_pricing.settings, "pricing_margin_multiplier", "1.5", raising=False)
    a = poll_pricing.quote_poll(big)
    monkeypatch.setattr(poll_pricing.settings, "pricing_margin_multiplier", "2.0", raising=False)
    b = poll_pricing.quote_poll(big)
    assert a["total_cents"] > poll_pricing.MODERATOR_MIN_FEE_CENTS
    assert b["total_cents"] > a["total_cents"]
    cost = Decimal(a["tracked_cost_usd"])
    # price nets cost × margin after Stripe's 2.9% + $0.30
    net = Decimal(a["total_cents"]) / 100 * (1 - Decimal("0.029")) - Decimal("0.30")
    assert net >= cost * Decimal("1.5") - Decimal("0.01")


def test_invalid_margin_never_prices_below_cost(monkeypatch):
    monkeypatch.setattr(poll_pricing.settings, "pricing_margin_multiplier", "0.5", raising=False)
    assert poll_pricing.margin_multiplier() == Decimal("1.5")
    monkeypatch.setattr(poll_pricing.settings, "pricing_margin_multiplier", "abc", raising=False)
    assert poll_pricing.margin_multiplier() == Decimal("1.5")


def test_cost_split_shares():
    q = poll_pricing.quote_poll(poll_pricing.PollQuoteInput(pricing_tier="cost_split", participants=10))
    assert q["creator_due_cents"] == -(-q["total_cents"] // 2)
    assert q["participant_share_cents"] >= 50
    # collected total never exceeds the price by more than rounding
    assert q["creator_due_cents"] + q["participant_share_cents"] * 10 - q["total_cents"] < 10


def test_cost_split_never_over_collects_when_share_below_stripe_min():
    q = poll_pricing.quote_poll(poll_pricing.PollQuoteInput(pricing_tier="cost_split", participants=1_000_000,
                                                            ai_provider="claude", options=poll_pricing.ALL_OPTIONS, voice_share=0.5))
    assert q["participant_share_cents"] == 0
    assert q["creator_due_cents"] == q["total_cents"]
    assert "split_note" in q


def test_options_change_cost():
    few = poll_pricing.quote_poll(poll_pricing.PollQuoteInput(participants=5000, options=("summaries_33",)))
    all_ = poll_pricing.quote_poll(poll_pricing.PollQuoteInput(participants=5000, options=poll_pricing.ALL_OPTIONS, voice_share=1))
    assert Decimal(all_["tracked_cost_usd"]) > Decimal(few["tracked_cost_usd"])
    assert [l["option"] for l in few["lines"]] == ["summaries_33"]


# ---------------------------------------------------------------- donations
@pytest.mark.asyncio
async def test_derisking_purpose_uses_its_product_line():
    cs = MagicMock(id="cs_test_d1", url="https://checkout.stripe.com/c/pay/cs_test_d1")
    with patch("stripe.checkout.Session.create", return_value=cs) as create:
        out = await create_divinity_donation_checkout(db=None, amount_cents=500, purpose="derisking_strategies")
    kw = create.call_args[1]
    assert kw["metadata"]["transaction_type"] == "derisking_strategies_donation"
    assert kw["submit_type"] == "donate"
    assert "{CHECKOUT_SESSION_ID}" in kw["success_url"]
    assert kw["idempotency_key"].startswith("exel_checkout_donation_")
    assert out["purpose"] == "derisking_strategies"


@pytest.mark.asyncio
async def test_live_key_attaches_live_product(monkeypatch):
    from app.cubes.cube8_tokens import stripe_catalog
    monkeypatch.setattr(stripe_catalog, "resolve_secret_key", lambda: "sk_live_x")
    pd = stripe_catalog.price_data("divinity_guide_donation", 333)
    assert pd == {"currency": "usd", "unit_amount": 333, "product": "prod_VavR1Xy18Cyu43"}
    monkeypatch.setattr(stripe_catalog, "resolve_secret_key", lambda: "sk_test_x")
    assert "product_data" in stripe_catalog.price_data("divinity_guide_donation", 333)


# ---------------------------------------------------------------- completion
def _db_returning(tx):
    db = AsyncMock()
    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=tx)
    db.execute = AsyncMock(return_value=res)
    db.add = MagicMock()
    db.begin_nested = MagicMock(return_value=AsyncMock())
    return db


def _cs_event(eid="evt_1", amount=500, md=None, cs="cs_live_x1"):
    return {"id": eid, "type": "checkout.session.completed", "livemode": True,
            "data": {"object": {"id": cs, "payment_status": "paid", "amount_total": amount, "currency": "usd",
                                "payment_intent": "pi_1", "metadata": md or {}}}}


@pytest.mark.asyncio
async def test_edge_donation_is_recorded_from_webhook():
    db = _db_returning(None)
    with patch("app.cubes.cube8_tokens.service.record_contribution_receipt", new=AsyncMock()):
        tx = await handle_payment_completed(db, _cs_event(md={"transaction_type": "donation", "purpose": "divinity_guide", "source": "edge_donate"}))
    added = db.add.call_args[0][0]
    assert isinstance(added, PaymentTransaction)
    assert added is tx
    assert tx.status == "completed"
    assert tx.transaction_type == "divinity_guide_donation"
    assert tx.amount_cents == 500
    assert tx.stripe_event_id == "evt_1"
    assert tx.stripe_payment_intent_id == "pi_1"


@pytest.mark.asyncio
async def test_completed_tx_is_not_reprocessed():
    tx = PaymentTransaction(transaction_type="moderator_fee", amount_cents=1111, status="completed",
                            stripe_checkout_session_id="cs_live_x1")
    db = _db_returning(tx)
    await handle_payment_completed(db, _cs_event(amount=1111))
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_amount_mismatch_is_flagged():
    tx = PaymentTransaction(transaction_type="donation", amount_cents=500, status="pending",
                            stripe_checkout_session_id="cs_live_x1", reconcile_status="awaiting_webhook")
    db = _db_returning(tx)
    with patch("app.cubes.cube8_tokens.service.record_contribution_receipt", new=AsyncMock()):
        await handle_payment_completed(db, _cs_event(amount=499))
    assert tx.status == "completed"
    assert tx.reconcile_status == "amount_mismatch:stripe=499"


@pytest.mark.asyncio
async def test_unrelated_checkout_is_ignored():
    db = _db_returning(None)
    out = await handle_payment_completed(db, _cs_event(md={"transaction_type": "something_else"}))
    assert out is None
    db.add.assert_not_called()


# ---------------------------------------------------------------- signed webhook route
def _sign(payload: bytes, secret: str, ts: int | None = None) -> str:
    ts = ts or int(time.time())
    sig = hmac.new(secret.encode(), f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"


@pytest.mark.asyncio
async def test_signed_webhook_processes_then_dedupes(client, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_unit_test")
    payload = json.dumps(_cs_event(eid="evt_signed_1")).encode()
    seen: set[str] = set()

    async def _seen(db, eid):
        return eid in seen

    async def _record(db, **kw):
        seen.add(kw["event_id"])
        return True

    with patch("app.cubes.cube8_tokens.payment_idempotency.event_already_processed", new=_seen), \
         patch("app.cubes.cube8_tokens.payment_idempotency.record_processed_event", new=_record), \
         patch("app.cubes.cube8_tokens.payment_service.handle_payment_completed", new=AsyncMock(return_value=MagicMock(id=uuid.uuid4(), session_id=None))) as h:
        r1 = await client.post("/api/v1/webhooks/stripe", content=payload, headers={"Stripe-Signature": _sign(payload, "whsec_unit_test"), "content-type": "application/json"})
        r2 = await client.post("/api/v1/webhooks/stripe", content=payload, headers={"Stripe-Signature": _sign(payload, "whsec_unit_test"), "content-type": "application/json"})
        bad = await client.post("/api/v1/webhooks/stripe", content=payload, headers={"Stripe-Signature": _sign(payload, "whsec_wrong"), "content-type": "application/json"})
    assert r1.status_code == 200 and r1.json()["outcome"] == "completed"
    assert r2.status_code == 200 and r2.json().get("duplicate") is True
    assert bad.status_code == 400
    assert h.await_count == 1
