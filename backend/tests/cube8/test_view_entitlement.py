"""Paid views (333 / Original) unlock ONLY on webhook-confirmed Stripe payment, enforced server-side;
poll-scoped donations reach the ladder; Cost Split participant share priced by the creator's pricing path.

Real SQL (in-memory SQLite via aiosqlite) for the ledger predicates — no mocked queries. No Stripe network:
stripe.*.create is patched; nothing is charged.
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.core.auth import CurrentUser  # noqa: E402
from app.cubes.cube8_tokens import poll_pricing  # noqa: E402
from app.cubes.cube8_tokens.payment_service import (  # noqa: E402
    cost_split_quote,
    create_cost_split_intent,
    create_divinity_donation_checkout,
    handle_payment_completed,
)
from app.cubes.cube8_tokens.view_entitlement import resolve_view_entitlement  # noqa: E402
from app.cubes.cube9_reports.service import TIER_333, TIER_FREE, TIER_FULL, resolve_export_tier  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.models.participant import Participant  # noqa: E402
from app.models.payment import PaymentTransaction  # noqa: E402
from app.models.question import Question  # noqa: E402
from app.models.response_meta import ResponseMeta  # noqa: E402
from app.models.response_summary import ResponseSummary  # noqa: E402
from app.models.text_response import TextResponse  # noqa: E402
from app.models.session import Session  # noqa: E402

NOW = datetime.now(timezone.utc)
CREATOR = CurrentUser(user_id="auth0|creator", email=None, role="moderator", permissions=[])
ALICE = CurrentUser(user_id="auth0|alice", email=None, role="user", permissions=[])
BOB = CurrentUser(user_id="auth0|bob", email=None, role="user", permissions=[])
STRANGER = CurrentUser(user_id="auth0|stranger", email=None, role="user", permissions=[])
ADMIN = CurrentUser(user_id="auth0|admin", email=None, role="admin", permissions=[])


from app.models.theme import Theme  # noqa: E402  (questions.parent_theme_id FK)

_TABLES = (Session, Theme, Question, Participant, PaymentTransaction, ResponseMeta, ResponseSummary, TextResponse)


async def _engine():
    """In-memory SQLite when aiosqlite is installed (dev), else a throwaway Postgres database (CI's service)."""
    try:
        import aiosqlite  # noqa: F401

        return create_async_engine("sqlite+aiosqlite:///:memory:"), None
    except ImportError:
        pass
    import asyncpg

    from tests.own_db import own_dsn

    dsn = own_dsn("VIEW_ENTITLEMENT_DSN", "postgresql://polling:polling@localhost:5432/view_entitlement_test")
    name = dsn.rsplit("/", 1)[1]
    admin = dsn.rsplit("/", 1)[0] + "/postgres"
    try:
        c = await asyncpg.connect(admin, timeout=3)
    except Exception:  # noqa: BLE001
        pytest.skip("no aiosqlite and no local Postgres for the real-SQL entitlement tests")
    await c.execute(f'DROP DATABASE IF EXISTS "{name}"')
    await c.execute(f'CREATE DATABASE "{name}"')
    await c.close()
    return create_async_engine(dsn.replace("postgresql://", "postgresql+asyncpg://", 1)), (admin, name)


@pytest.fixture
async def db():
    engine, pg = await _engine()
    tables = [t.__table__ for t in _TABLES]
    async with engine.begin() as c:
        await c.run_sync(lambda sc: Base.metadata.create_all(sc, tables=tables))
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as s:
        yield s
    await engine.dispose()
    if pg:
        import asyncpg

        c = await asyncpg.connect(pg[0], timeout=3)
        await c.execute(f'DROP DATABASE IF EXISTS "{pg[1]}" WITH (FORCE)')
        await c.close()


async def _poll(db, tier="moderator_paid", is_paid=False, max_participants=10):
    s = Session(short_code=uuid.uuid4().hex[:8], created_by=CREATOR.user_id, title="Q", pricing_tier=tier,
                is_paid=is_paid, max_participants=max_participants)
    db.add(s)
    await db.flush()
    a = Participant(session_id=s.id, user_id=ALICE.user_id, joined_at=NOW, results_opt_in=True)
    b = Participant(session_id=s.id, user_id=BOB.user_id, joined_at=NOW, results_opt_in=False)
    db.add_all([a, b])
    await db.commit()
    return s, a, b


def _tx(session, cents, *, ttype="donation", participant=None, status="completed", event="evt_x", reconcile="stripe_confirmed"):
    return PaymentTransaction(session_id=session.id, participant_id=participant.id if participant else None,
                              transaction_type=ttype, amount_cents=cents, currency="USD", status=status,
                              stripe_checkout_session_id=f"cs_test_{uuid.uuid4().hex[:12]}",
                              stripe_event_id=event, reconcile_status=reconcile)


# --------------------------------------------------------------------------- (1) unlock = confirmed payment
async def test_paid_tier_without_confirmed_payment_stays_locked(db):
    s, _, _ = await _poll(db, "moderator_paid")
    e = await resolve_view_entitlement(db, s, CREATOR)
    assert (e["summary_333"], e["original"]) == (False, False), "chosen tier alone must not unlock"
    db.add(_tx(s, 1111, ttype="moderator_fee", status="pending", event=None, reconcile="awaiting_webhook"))
    db.add(_tx(s, 1111, ttype="moderator_fee", status="expired", event="evt_exp"))
    await db.commit()
    e = await resolve_view_entitlement(db, s, CREATOR)
    assert (e["summary_333"], e["original"]) == (False, False), "pending / expired Checkout must not unlock"


async def test_is_paid_flag_without_ledger_evidence_is_not_enough(db):
    s, _, _ = await _poll(db, "moderator_paid", is_paid=True)
    e = await resolve_view_entitlement(db, s, CREATOR)
    assert e["original"] is False


async def test_completed_without_webhook_event_does_not_unlock(db):
    s, _, _ = await _poll(db, "moderator_paid")
    db.add(_tx(s, 1111, ttype="moderator_fee", event=None))
    await db.commit()
    assert (await resolve_view_entitlement(db, s, CREATOR))["original"] is False


async def test_webhook_confirmed_creator_payment_unlocks_both(db):
    s, _, _ = await _poll(db, "moderator_paid")
    db.add(_tx(s, 1111, ttype="moderator_fee"))
    await db.commit()
    e = await resolve_view_entitlement(db, s, CREATOR)
    assert e["basis"] == "poll_payment_confirmed" and e["summary_333"] and e["original"]


async def test_free_creator_donation_ladder_and_amount_mismatch_excluded(db):
    s, _, _ = await _poll(db, "free")
    db.add(_tx(s, 999))
    await db.commit()
    e = await resolve_view_entitlement(db, s, CREATOR)
    assert (e["summary_333"], e["original"]) == (True, False)
    db.add(_tx(s, 500, reconcile="amount_mismatch:stripe=1"))
    await db.commit()
    assert (await resolve_view_entitlement(db, s, CREATOR))["original"] is False
    db.add(_tx(s, 112))
    await db.commit()
    assert (await resolve_view_entitlement(db, s, CREATOR))["original"] is True


async def test_participant_ladder_is_per_payer(db):
    s, alice, bob = await _poll(db, "free")
    db.add(_tx(s, 1111, participant=alice))
    await db.commit()
    assert (await resolve_view_entitlement(db, s, ALICE))["original"] is True
    assert (await resolve_view_entitlement(db, s, BOB))["summary_333"] is False
    assert (await resolve_view_entitlement(db, s, CREATOR))["summary_333"] is False, "participant money is not the creator's"


async def test_outsiders_locked_operators_open(db):
    s, _, _ = await _poll(db, "free")
    assert (await resolve_view_entitlement(db, s, None))["viewer"] == "anonymous"
    assert (await resolve_view_entitlement(db, s, STRANGER))["viewer"] == "other"
    e = await resolve_view_entitlement(db, s, ADMIN)
    assert e["summary_333"] and e["original"]


async def test_export_ladder_counts_only_confirmed(db):
    s, alice, _ = await _poll(db, "free")
    db.add(_tx(s, 1111, participant=alice, event=None))
    await db.commit()
    assert await resolve_export_tier(db, s.id, ALICE.user_id, "user") == TIER_FREE
    db.add(_tx(s, 999, participant=alice))
    await db.commit()
    assert await resolve_export_tier(db, s.id, ALICE.user_id, "user") == TIER_333
    db.add(_tx(s, 200, participant=alice))
    await db.commit()
    assert await resolve_export_tier(db, s.id, ALICE.user_id, "user") == TIER_FULL


# --------------------------------------------------------------------------- (2) poll-scoped donations
def _cs_event(md, amount, cs="cs_test_scope1", eid="evt_scope1"):
    return {"id": eid, "type": "checkout.session.completed", "livemode": False,
            "data": {"object": {"id": cs, "payment_status": "paid", "amount_total": amount, "currency": "usd",
                                "payment_intent": "pi_scope1", "metadata": md}}}


async def test_edge_donation_with_poll_metadata_credits_ladder(db):
    s, alice, _ = await _poll(db, "free")
    md = {"transaction_type": "donation", "purpose": "community", "source": "edge_donate",
          "session_id": str(s.id), "poll_id": str(s.id), "participant_id": str(alice.id)}
    with patch("app.cubes.cube8_tokens.payment_service._fire_payment_received", new=_async_none):
        tx = await handle_payment_completed(db, _cs_event(md, 1111))
    row = (await db.execute(PaymentTransaction.__table__.select())).mappings().one()
    assert row["session_id"] == s.id and row["participant_id"] == alice.id
    assert row["status"] == "completed" and row["stripe_event_id"] == "evt_scope1"
    assert (await resolve_view_entitlement(db, s, ALICE))["original"] is True
    assert tx.session_id == s.id


async def test_donation_metadata_with_foreign_participant_is_dropped(db):
    s, _, _ = await _poll(db, "free")
    other, other_p, _ = await _poll(db, "free")
    md = {"transaction_type": "donation", "purpose": "community", "session_id": str(s.id), "participant_id": str(other_p.id)}
    with patch("app.cubes.cube8_tokens.payment_service._fire_payment_received", new=_async_none):
        await handle_payment_completed(db, _cs_event(md, 999, cs="cs_test_scope2", eid="evt_scope2"))
    row = (await db.execute(PaymentTransaction.__table__.select())).mappings().one()
    assert row["session_id"] == s.id and row["participant_id"] is None


async def test_donation_metadata_unknown_poll_is_unscoped(db):
    md = {"transaction_type": "donation", "purpose": "community", "session_id": str(uuid.uuid4())}
    with patch("app.cubes.cube8_tokens.payment_service._fire_payment_received", new=_async_none), \
         patch("app.cubes.cube8_tokens.service.record_contribution_receipt", new=_async_none):
        await handle_payment_completed(db, _cs_event(md, 333, cs="cs_test_scope3", eid="evt_scope3"))
    row = (await db.execute(PaymentTransaction.__table__.select())).mappings().one()
    assert row["session_id"] is None and row["status"] == "completed"


async def _async_none(*a, **k):
    return None


async def test_api_donation_checkout_carries_poll_scope(db):
    s, alice, _ = await _poll(db, "free")
    cs = MagicMock(id="cs_test_api1", url="https://checkout.stripe.com/c/pay/cs_test_api1")
    with patch("stripe.checkout.Session.create", return_value=cs) as create:
        await create_divinity_donation_checkout(db=db, amount_cents=999, purpose="community",
                                                session_id=s.id, participant_id=alice.id)
    md = create.call_args[1]["metadata"]
    assert md["session_id"] == str(s.id) and md["poll_id"] == str(s.id) and md["participant_id"] == str(alice.id)
    assert create.call_args[1]["payment_intent_data"]["metadata"]["participant_id"] == str(alice.id)
    row = (await db.execute(PaymentTransaction.__table__.select())).mappings().one()
    assert row["session_id"] == s.id and row["participant_id"] == alice.id and row["status"] == "pending"
    assert (await resolve_view_entitlement(db, s, ALICE))["summary_333"] is False, "pending donation unlocks nothing"


async def test_api_donation_rejects_participant_from_another_poll(db):
    from fastapi import HTTPException

    s, _, _ = await _poll(db, "free")
    _, other_p, _ = await _poll(db, "free")
    with patch("stripe.checkout.Session.create") as create, pytest.raises(HTTPException) as ei:
        await create_divinity_donation_checkout(db=db, amount_cents=999, purpose="community", session_id=s.id, participant_id=other_p.id)
    assert ei.value.status_code == 404
    create.assert_not_called()


# --------------------------------------------------------------------------- (3) Cost Split share pricing
async def test_cost_split_participant_share_uses_creator_quote(db, monkeypatch):
    monkeypatch.setattr(poll_pricing.settings, "pricing_margin_multiplier", "1.5", raising=False)
    s, alice, _ = await _poll(db, "cost_split", max_participants=10)
    creator_quote = poll_pricing.quote_for_session(s)
    tx = _tx(s, creator_quote["creator_due_cents"], ttype="cost_split")
    tx.metadata_json = json.dumps({"quote": creator_quote})
    db.add(tx)
    await db.commit()
    assert (await cost_split_quote(db, s)) == creator_quote
    intent = MagicMock(id="pi_test_cs1", client_secret="pi_test_cs1_secret_redacted")
    with patch("stripe.PaymentIntent.create", return_value=intent) as create:
        out = await create_cost_split_intent(db, s.id, alice.id, ALICE.user_id)
    assert out["amount_cents"] == creator_quote["participant_share_cents"] > 0
    kw = create.call_args[1]
    assert kw["amount"] == creator_quote["participant_share_cents"]
    assert kw["metadata"]["margin_multiplier"] == "1.5"
    assert kw["metadata"]["quote_total_cents"] == str(creator_quote["total_cents"])


async def test_cost_split_without_creator_row_prices_from_session(db):
    s, alice, _ = await _poll(db, "cost_split", max_participants=4)
    q = await cost_split_quote(db, s)
    assert q == poll_pricing.quote_for_session(s)


async def test_cost_split_no_share_due_is_409_not_a_minimum_charge(db):
    from fastapi import HTTPException

    s, alice, _ = await _poll(db, "cost_split", max_participants=1_000_000)
    big = poll_pricing.quote_poll(poll_pricing.PollQuoteInput(pricing_tier="cost_split", participants=1_000_000))
    tx = _tx(s, big["creator_due_cents"], ttype="cost_split")
    tx.metadata_json = json.dumps({"quote": big})
    db.add(tx)
    await db.commit()
    assert big["participant_share_cents"] == 0
    with patch("stripe.PaymentIntent.create") as create, pytest.raises(HTTPException) as ei:
        await create_cost_split_intent(db, s.id, alice.id, ALICE.user_id)
    assert ei.value.status_code == 409
    create.assert_not_called()


# --------------------------------------------------------------------------- server enforcement (drill-down API)
async def _seed_responses(db, s, participant):
    q = Question(session_id=s.id, question_text="Q?")
    db.add(q)
    await db.flush()
    rm = ResponseMeta(session_id=s.id, question_id=q.id, participant_id=participant.id, raw_text="ORIGINAL TEXT",
                      char_count=13, submitted_at=NOW - timedelta(minutes=1))
    db.add(rm)
    await db.flush()
    db.add(ResponseSummary(response_meta_id=rm.id, session_id=s.id, summary_33="S33", summary_111="S111",
                           summary_333="S333", theme01="Risk & Concerns", theme2_3="Cost", theme2_3_confidence=0.9))
    await db.commit()


@pytest.fixture
async def api(db):
    from httpx import ASGITransport, AsyncClient

    from app.core.auth import get_current_user, get_optional_current_user
    from app.core.dependencies import get_db
    from app.main import app

    who = {"user": CREATOR}

    async def _db():
        yield db

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = lambda: who["user"]
    app.dependency_overrides[get_optional_current_user] = lambda: who["user"]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c, who
    for dep in (get_db, get_current_user, get_optional_current_user):
        app.dependency_overrides.pop(dep, None)


async def test_drilldown_withholds_333_and_original_until_paid(db, api):
    c, who = api
    s, alice, _ = await _poll(db, "moderator_paid")
    await _seed_responses(db, s, alice)
    url = f"/api/v1/sessions/{s.id}/drilldown?level=3&theme=Cost&category=risk"
    r = await c.get(url)
    assert r.status_code == 200, r.text
    item = r.json()["items"][0]
    assert item["summary_33"] == "S33" and item["summary_111"] == "S111"
    assert item["summary_333"] is None and item["original"] is None, "server must withhold locked tiers"
    assert "ORIGINAL TEXT" not in r.text and "S333" not in r.text
    db.add(_tx(s, 1111, ttype="moderator_fee"))
    await db.commit()
    item = (await c.get(url)).json()["items"][0]
    assert item["summary_333"] == "S333" and item["original"] == "ORIGINAL TEXT"
    ent = (await c.get(f"/api/v1/sessions/{s.id}/view-entitlement")).json()
    assert ent["summary_333"] and ent["original"] and ent["basis"] == "poll_payment_confirmed"


async def test_drilldown_access_rules(db, api):
    c, who = api
    s, alice, _ = await _poll(db, "free")
    await _seed_responses(db, s, alice)
    url = f"/api/v1/sessions/{s.id}/drilldown?level=3&theme=Cost"
    who["user"] = STRANGER
    assert (await c.get(url)).status_code == 403
    who["user"] = BOB  # joined, but did not opt into results
    assert (await c.get(url)).status_code == 403
    who["user"] = ALICE
    body = (await c.get(url)).json()
    assert body["items"][0]["original"] is None and body["entitlement"]["viewer"] == "participant"
    assert body["items"][0]["participant_ref"] and str(alice.id)[:8] not in body["items"][0]["participant_ref"]
    assert (await c.get(f"/api/v1/sessions/{s.id}/drilldown?level=4&theme=Cost")).status_code == 400
    assert (await c.get(f"/api/v1/sessions/{uuid.uuid4()}/view-entitlement")).status_code == 404


async def test_moderator_export_follows_creator_payment_on_paid_tiers(db):
    from app.cubes.cube9_reports.service import TIER_TALENT

    split, _, _ = await _poll(db, "cost_split")  # cost_split can open unpaid → export must not be full until paid
    assert await resolve_export_tier(db, split.id, CREATOR.user_id, "moderator") == TIER_FREE
    db.add(_tx(split, 600, ttype="cost_split", status="pending", event=None, reconcile="awaiting_webhook"))
    await db.commit()
    assert await resolve_export_tier(db, split.id, CREATOR.user_id, "moderator") == TIER_FREE
    db.add(_tx(split, 600, ttype="cost_split"))
    await db.commit()
    assert await resolve_export_tier(db, split.id, CREATOR.user_id, "moderator") == TIER_TALENT
    free, _, _ = await _poll(db, "free")
    assert await resolve_export_tier(db, free.id, CREATOR.user_id, "moderator") == TIER_TALENT, "free flow unchanged"
    assert await resolve_export_tier(db, split.id, ADMIN.user_id, "admin") == TIER_TALENT


# --------------------------------------------------------------------------- CRS-39 list/detail/ThemeRead (same entitlement as drilldown)
async def _seed_text_and_theme(db, s, participant):
    q = Question(session_id=s.id, question_text="Q?")
    db.add(q)
    await db.flush()
    rm = ResponseMeta(
        session_id=s.id, question_id=q.id, participant_id=participant.id,
        raw_text="ORIGINAL TEXT", char_count=13, submitted_at=NOW - timedelta(minutes=1),
    )
    db.add(rm)
    await db.flush()
    db.add(TextResponse(
        response_meta_id=rm.id, clean_text="ORIGINAL TEXT",
        language_code="en", pii_detected=False, profanity_detected=False,
    ))
    db.add(ResponseSummary(
        response_meta_id=rm.id, session_id=s.id,
        summary_33="S33", summary_111="S111", summary_333="S333",
        theme01="Risk & Concerns", theme2_3="Cost", theme2_3_confidence=0.9,
    ))
    db.add(Theme(
        session_id=s.id, cycle_id=1, label="Cost", summary="theme33",
        confidence=0.9, response_count=1, ai_provider="openai", ai_model="x",
        theme_summary_33="theme33", theme_summary_111="theme111", theme_summary_333="theme333",
        cluster_metadata={"level": "3"},
    ))
    await db.commit()
    return rm


async def test_list_detail_withhold_333_and_original_until_paid(db, api):
    """CRS-39: Cube2 list/detail must match drilldown — unpaid free creator sees null 333/Original."""
    c, who = api
    s, alice, _ = await _poll(db, "free")
    rm = await _seed_text_and_theme(db, s, alice)
    list_url = f"/api/v1/sessions/{s.id}/responses"
    detail_url = f"/api/v1/sessions/{s.id}/responses/{rm.id}"

    body = (await c.get(list_url)).json()
    assert body["total"] >= 1
    item = body["items"][0]
    assert item["summary_33"] == "S33" and item["summary_111"] == "S111"
    assert item["summary_333"] is None, "list must redact summary_333 for unpaid"
    assert "S333" not in (await c.get(list_url)).text

    detail = (await c.get(detail_url)).json()
    assert detail["summary_33"] == "S33" and detail["summary_111"] == "S111"
    assert detail["summary_333"] is None and detail.get("clean_text") is None

    # Donation ladder: $9.99 → 333; $11.11 → Original
    db.add(_tx(s, 999, ttype="donation"))
    await db.commit()
    item = (await c.get(list_url)).json()["items"][0]
    assert item["summary_333"] == "S333"
    detail = (await c.get(detail_url)).json()
    assert detail["summary_333"] == "S333"
    assert detail.get("clean_text") is None, "Original still locked at $9.99"

    db.add(_tx(s, 112, ttype="donation", event="evt_full"))  # 999+112 >= 1111
    await db.commit()
    detail = (await c.get(detail_url)).json()
    assert detail["clean_text"] == "ORIGINAL TEXT"


async def test_themes_withhold_summary_333_until_paid(db, api):
    """CRS-39: ThemeRead summary_333 null unless entitled; summary/summary_111 stay."""
    c, who = api
    s, alice, _ = await _poll(db, "free")
    await _seed_text_and_theme(db, s, alice)
    url = f"/api/v1/sessions/{s.id}/themes"
    rows = (await c.get(url)).json()
    assert isinstance(rows, list) and rows
    # enriched prefers theme_summary_33 for summary
    assert any(r.get("summary_111") == "theme111" for r in rows)
    assert all(r.get("summary_333") is None for r in rows), "unpaid must not see theme summary_333"
    assert "theme333" not in (await c.get(url)).text

    db.add(_tx(s, 1111, ttype="donation"))
    await db.commit()
    rows = (await c.get(url)).json()
    assert any(r.get("summary_333") == "theme333" for r in rows)
