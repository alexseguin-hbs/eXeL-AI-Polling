"""Phase A — Cube 1 anonymous-by-default + results-gated login (CRS-05 + operator rule).

Locks the backend contract:
  1. anonymity_mode defaults to "anonymous" (schema + service signature) — moderator override intact.
  2. join_session sets a session-scoped anon_hash for anonymous / pseudonymous mode INCLUDING
     truly-anonymous joins (user_id=None → hash the fresh participant id); identified → None.
  3. Cube 9 results export gate: a participant receives results only if joined logged-in
     (matched user_id) AND opted in; remain-anonymous / opt-out → 403; cost_split unpaid → 402.

Run: cd backend && python -m pytest tests/cube1/test_anon_results_gate.py -v --tb=short
"""
import inspect
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_participant, make_session


# ── 1. Anonymous-by-default (CRS-05 / operator rule) ────────────────────────────────────────
class TestAnonymousByDefault:
    def test_schema_default_is_anonymous(self):
        from app.schemas.session import SessionCreate

        assert SessionCreate(title="Strategy Alignment").anonymity_mode == "anonymous"

    def test_service_signature_default_is_anonymous(self):
        from app.cubes.cube1_session.service import create_session

        assert inspect.signature(create_session).parameters["anonymity_mode"].default == "anonymous"

    def test_moderator_override_still_honored(self):
        from app.schemas.session import SessionCreate

        assert SessionCreate(title="x", anonymity_mode="identified").anonymity_mode == "identified"
        assert SessionCreate(title="x", anonymity_mode="pseudonymous").anonymity_mode == "pseudonymous"


# ── 2. anon_hash fires for TRULY anonymous joins (the A5 gap) ───────────────────────────────
def _join_mocks(session, *, user_id):
    """execute side-effects for join_session: get_session, capacity count,
    (+ existing-participant lookup only when user_id is truthy)."""
    mock_db = AsyncMock()
    r_session = MagicMock(); r_session.scalar_one_or_none.return_value = session
    r_count = MagicMock(); r_count.scalar_one.return_value = 1
    side = [r_session, r_count]
    if user_id:
        r_existing = MagicMock(); r_existing.scalar_one_or_none.return_value = None
        side.append(r_existing)
    mock_db.execute = AsyncMock(side_effect=side)
    mock_db.commit = AsyncMock(); mock_db.refresh = AsyncMock(); mock_db.add = MagicMock()
    return mock_db


async def _run_join(session, *, user_id):
    mock_db = _join_mocks(session, user_id=user_id)
    with patch("app.cubes.cube5_gateway.service.create_login_time_entry", new_callable=AsyncMock):
        from app.cubes.cube1_session.service import join_session

        await join_session(
            mock_db, short_code="Ab3kQ7xR", user_id=user_id,
            display_name="U", device_type="mobile", language_code="en", results_opt_in=False,
        )
    return mock_db.add.call_args[0][0]


class TestAnonHash:
    @pytest.mark.asyncio
    async def test_true_anonymous_join_still_hashed(self):
        """anonymous mode + user_id=None → anon_hash set (64-hex) from the participant id."""
        session = make_session(status="open", anonymity_mode="anonymous"); session.is_expired = False
        p = await _run_join(session, user_id=None)
        assert p.user_id is None
        assert p.anon_hash is not None and len(p.anon_hash) == 64

    @pytest.mark.asyncio
    async def test_anonymous_join_with_login_hashed_from_user(self):
        session = make_session(status="open", anonymity_mode="anonymous"); session.is_expired = False
        p = await _run_join(session, user_id="auth0|u1")
        assert p.anon_hash is not None and len(p.anon_hash) == 64

    @pytest.mark.asyncio
    async def test_pseudonymous_keeps_both(self):
        session = make_session(status="open", anonymity_mode="pseudonymous"); session.is_expired = False
        p = await _run_join(session, user_id="auth0|u1")
        assert p.user_id == "auth0|u1" and p.anon_hash is not None and len(p.anon_hash) == 64

    @pytest.mark.asyncio
    async def test_identified_has_no_anon_hash(self):
        session = make_session(status="open", anonymity_mode="identified"); session.is_expired = False
        p = await _run_join(session, user_id="auth0|u1")
        assert p.anon_hash is None

    @pytest.mark.asyncio
    async def test_anon_hash_deterministic_and_session_scoped(self):
        """Same seed + same session → same hash; different session salt → different hash."""
        from app.core.security import anonymize_user_id

        sid = str(uuid.uuid4())
        h1 = anonymize_user_id("auth0|u1", sid)
        h2 = anonymize_user_id("auth0|u1", sid)
        h3 = anonymize_user_id("auth0|u1", str(uuid.uuid4()))
        assert h1 == h2 and h1 != h3 and len(h1) == 64


# ── 3. Cube 9 results export gate (403 opt-out / 402 cost_split unpaid) ──────────────────────
def _export_mocks(session, participant):
    mock_db = AsyncMock()
    r_session = MagicMock(); r_session.scalar_one_or_none.return_value = session
    r_part = MagicMock(); r_part.scalar_one_or_none.return_value = participant
    mock_db.execute = AsyncMock(side_effect=[r_session, r_part])
    return mock_db


def _participant_user():
    u = MagicMock(); u.role = "user"; u.user_id = "auth0|u1"
    return u


class TestResultsExportGate:
    @pytest.mark.asyncio
    async def test_participant_without_optin_denied_403(self):
        from fastapi import HTTPException
        from app.cubes.cube9_reports.router import export_csv

        session = make_session(status="closed", pricing_tier="free")
        participant = make_participant(user_id="auth0|u1", results_opt_in=False)
        with pytest.raises(HTTPException) as exc:
            await export_csv(session.id, summary_tier="33", db=_export_mocks(session, participant), user=_participant_user())
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_anonymous_participant_no_row_denied_403(self):
        from fastapi import HTTPException
        from app.cubes.cube9_reports.router import export_csv

        session = make_session(status="closed", pricing_tier="free")
        with pytest.raises(HTTPException) as exc:
            await export_csv(session.id, summary_tier="33", db=_export_mocks(session, None), user=_participant_user())
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_cost_split_optin_but_unpaid_denied_402(self):
        from fastapi import HTTPException
        from app.cubes.cube9_reports.router import export_csv

        session = make_session(status="closed", pricing_tier="cost_split")
        participant = make_participant(user_id="auth0|u1", results_opt_in=True, payment_status="unpaid")
        with pytest.raises(HTTPException) as exc:
            await export_csv(session.id, summary_tier="33", db=_export_mocks(session, participant), user=_participant_user())
        assert exc.value.status_code == 402
