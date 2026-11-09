"""Ensure Stripe create calls pass idempotency_key from stripe_idempotency_key helper.

Fixture-only — no live Stripe charges.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.cubes.cube8_tokens.payment_idempotency import stripe_idempotency_key


def test_stripe_idempotency_key_stable_shape():
    k = stripe_idempotency_key(
        action="intent_donation",
        session_id="s1",
        amount_cents=100,
        transaction_type="donation",
        nonce="abc",
    )
    assert k.startswith("exel_intent_donation_")
    assert len(k) < 255


def test_payment_service_passes_idempotency_key_on_creates():
    """Static source check + call-shape: each create site includes idempotency_key=."""
    from pathlib import Path

    src = Path(__file__).resolve().parents[2] / "app/cubes/cube8_tokens/payment_service.py"
    text = src.read_text()
    assert "from app.cubes.cube8_tokens.payment_idempotency import stripe_idempotency_key" in text
    # Five Stripe create call sites must pass the key
    assert text.count("idempotency_key=idem_key") == 5
    assert "stripe.PaymentIntent.create" in text
    assert "stripe.checkout.Session.create" in text


def test_donation_intent_create_receives_idempotency_key(monkeypatch):
    """Monkeypatch Stripe PaymentIntent.create — assert idempotency_key kwarg present."""
    import app.cubes.cube8_tokens.payment_service as ps
    import asyncio
    import uuid
    from unittest.mock import AsyncMock

    captured = {}

    class FakeIntent:
        id = "pi_test"
        client_secret = "sec_test"

    def fake_create(**kwargs):
        captured.update(kwargs)
        return FakeIntent()

    monkeypatch.setattr(ps.stripe.PaymentIntent, "create", fake_create)

    session = MagicMock()
    session.short_code = "ABCD"
    session.id = uuid.uuid4()

    async def fake_get_session(db, session_id):
        return session

    monkeypatch.setattr(ps, "_get_session", fake_get_session)

    db = MagicMock()
    db.add = MagicMock()
    db.commit = AsyncMock()

    async def run():
        return await ps.create_donation_intent(
            db, session.id, None, 500
        )

    out = asyncio.run(run())
    assert out["payment_intent_id"] == "pi_test"
    assert "idempotency_key" in captured
    assert str(captured["idempotency_key"]).startswith("exel_intent_donation_")
