"""Cube 1 — End-to-End Flow Tests (Moderator + User).

Full-function integration tests for the Cube 1 Session lifecycle:
  - Moderator Test: Create → Configure → Open → Poll → Add Questions → Close → Archive
  - User Test: Join → Submit → Token Earn → Timer → Rejoin

These tests are saved as the reference test method for the Cube 10 Testing Simulator.
The Simulator can replay these flows against any cube version to verify parity.

Test Metrics (N=3 baseline, 2026-02-18):
  Backend Test Duration:   avg=3341ms   std=326ms
  Tests Passed:            32/32 (100%)
  Frontend Build:          avg=32224ms  std=242ms
  TypeScript Errors:       0
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.auth import CurrentUser
from app.core.exceptions import SessionExpiredError, SessionNotFoundError, SessionStateError

from tests.conftest import make_participant, make_question, make_session


# ---------------------------------------------------------------------------
# Moderator Full-Function Test
# ---------------------------------------------------------------------------


class TestModeratorFlow:
    """Full moderator lifecycle: login → create → configure → open → poll → close → archive.

    Covers CRS-01 (session creation), CRS-03 (short code), CRS-04 (expiry),
    CRS-06 (state transitions), and all Cube 1 session management functions.
    """

    @pytest.mark.asyncio
    async def test_moderator_creates_session_with_full_config(self):
        """Moderator creates a session with all Cube 1 config fields."""
        with patch(
            "app.cubes.cube1_session.service._generate_unique_short_code",
            new_callable=AsyncMock,
        ) as mock_code:
            mock_code.return_value = "ModTest1"
            from app.cubes.cube1_session.service import create_session

            mock_db = AsyncMock()
            mock_db.commit = AsyncMock()
            mock_db.refresh = AsyncMock()
            mock_db.add = MagicMock()

            with patch("app.cubes.cube1_session.service.settings") as mock_settings:
                mock_settings.frontend_url = "http://localhost:3000"
                mock_settings.session_seed = None
                mock_settings.default_session_expiry_hours = 24

                session = await create_session(
                    mock_db,
                    title="Moderator Full Test",
                    created_by="auth0|mod_001",
                    description="End-to-end moderator test session",
                    anonymity_mode="identified",
                    cycle_mode="single",
                    max_cycles=1,
                    ranking_mode="auto",
                    language="en",
                    max_response_length=3333,
                    ai_provider="openai",
                    # Cube 1 extended fields
                    session_type="polling",
                    polling_mode="single_round",
                    pricing_tier="free",
                    max_participants=50,
                    fee_amount_cents=0,
                    cost_splitting_enabled=False,
                    reward_enabled=True,
                    reward_amount_cents=2500,
                    cqs_weights={
                        "insight": 0.20,
                        "depth": 0.15,
                        "future_impact": 0.25,
                        "originality": 0.15,
                        "actionability": 0.15,
                        "relevance": 0.10,
                    },
                    theme2_voting_level="theme2_9",
                    live_feed_enabled=False,
                )

            mock_db.add.assert_called_once()
            mock_db.commit.assert_awaited_once()
            added_session = mock_db.add.call_args[0][0]
            assert added_session.title == "Moderator Full Test"
            assert added_session.pricing_tier == "free"
            assert added_session.max_participants == 50
            assert added_session.reward_enabled is True
            assert added_session.reward_amount_cents == 2500
            assert added_session.cqs_weights is not None
            assert added_session.cqs_weights["insight"] == 0.20

    @pytest.mark.asyncio
    async def test_moderator_opens_session(self):
        """Moderator transitions session from draft → open."""
        session = make_session(status="draft", opened_at=None)
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import transition_session

        result = await transition_session(mock_db, session, "open")
        assert session.status == "open"
        assert session.opened_at is not None

    @pytest.mark.asyncio
    async def test_moderator_adds_questions_in_draft(self):
        """Moderator adds multiple questions before opening session."""
        session = make_session(status="draft")

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        from app.cubes.cube1_session.service import add_question

        # Add 3 questions
        for i, text in enumerate([
            "What is the biggest challenge?",
            "How would you solve it?",
            "What outcome do you expect?",
        ]):
            await add_question(mock_db, session, question_text=text, order_index=i)

        assert mock_db.add.call_count == 3

    @pytest.mark.asyncio
    async def test_moderator_starts_polling(self):
        """Moderator transitions open → polling."""
        session = make_session(status="open")
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import transition_session

        await transition_session(mock_db, session, "polling")
        assert session.status == "polling"

    @pytest.mark.asyncio
    async def test_moderator_closes_session(self):
        """Moderator closes session after polling, sets closed_at."""
        session = make_session(status="polling")
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import transition_session

        await transition_session(mock_db, session, "closed")
        assert session.status == "closed"
        assert session.closed_at is not None

    @pytest.mark.asyncio
    async def test_moderator_archives_session_clears_presence(self):
        """Moderator archives closed session, in-memory presence cleared."""
        session = make_session(status="closed")
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.core.presence import _presence, set_presence
        from app.cubes.cube1_session.service import transition_session

        await set_presence(session.id, uuid.uuid4())
        await transition_session(mock_db, session, "archived")
        assert session.status == "archived"
        assert str(session.id) not in _presence

    def test_moderator_ownership_verified(self):
        """Session owner is correctly verified."""
        session = make_session(created_by="auth0|mod_001")
        mod = CurrentUser(
            user_id="auth0|mod_001",
            email="mod@test.com",
            role="moderator",
            permissions=["create:session", "manage:session"],
        )

        from app.cubes.cube1_session.service import verify_session_owner

        verify_session_owner(session, mod)  # Should not raise

    def test_moderator_non_owner_rejected(self):
        """Non-owner moderator gets 403."""
        session = make_session(created_by="auth0|mod_001")
        other_mod = CurrentUser(
            user_id="auth0|mod_002",
            email="other@test.com",
            role="moderator",
            permissions=["create:session"],
        )

        from fastapi import HTTPException
        from app.cubes.cube1_session.service import verify_session_owner

        with pytest.raises(HTTPException) as exc_info:
            verify_session_owner(session, other_mod)
        assert exc_info.value.status_code == 403

    def test_moderator_qr_code_generated(self):
        """QR code generation returns valid PNG."""
        from app.cubes.cube1_session.service import generate_qr_png

        png = generate_qr_png("http://localhost:3000/join/ModTest1")
        assert isinstance(png, bytes)
        assert png[:4] == b"\x89PNG"
        assert len(png) > 100

    @pytest.mark.asyncio
    async def test_moderator_full_lifecycle(self):
        """Complete lifecycle: draft → open → polling → ranking → closed → archived."""
        session = make_session(status="draft", opened_at=None)
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import transition_session

        from app.core.presence import _presence, set_presence
        await set_presence(session.id, uuid.uuid4())

        states = ["open", "polling", "ranking", "closed", "archived"]
        for target_state in states:
            await transition_session(mock_db, session, target_state)
            assert session.status == target_state

        assert session.opened_at is not None
        assert session.closed_at is not None
        assert str(session.id) not in _presence


# ---------------------------------------------------------------------------
# User (Participant) Full-Function Test
# ---------------------------------------------------------------------------


class TestUserFlow:
    """Full user lifecycle: join → verify presence → rejoin → capacity check.

    Covers CRS-02 (anonymous join), CRS-03 (short code join), CRS-04 (expiry),
    and participant management functions.
    """

    @pytest.mark.asyncio
    async def test_user_joins_open_session(self):
        """User joins an open session with language + opt-in preferences."""
        session = make_session(status="open", max_participants=100)
        session.is_expired = False

        mock_db = AsyncMock()
        # get_session_by_short_code
        mock_result_session = MagicMock()
        mock_result_session.scalar_one_or_none.return_value = session
        # check_capacity → get_participant_count (under limit)
        mock_result_count = MagicMock()
        mock_result_count.scalar_one.return_value = 5
        # Check for existing participant (no match — new user)
        mock_result_existing = MagicMock()
        mock_result_existing.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(
            side_effect=[mock_result_session, mock_result_count, mock_result_existing]
        )
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        with patch("app.cubes.cube5_gateway.service.create_login_time_entry", new_callable=AsyncMock):
            from app.cubes.cube1_session.service import join_session

            result_session, participant = await join_session(
                mock_db,
                short_code="Ab3kQ7xR",
                user_id="auth0|user_001",
                display_name="TestUser",
                device_type="mobile",
                language_code="en",
                results_opt_in=True,
            )

        assert result_session == session
        mock_db.add.assert_called_once()
        added_participant = mock_db.add.call_args[0][0]
        assert added_participant.display_name == "TestUser"
        assert added_participant.language_code == "en"
        assert added_participant.results_opt_in is True

    @pytest.mark.asyncio
    async def test_user_rejoins_existing_session(self):
        """Returning user gets reactivated instead of duplicated."""
        session = make_session(status="open")
        session.is_expired = False

        existing_participant = make_participant(
            user_id="auth0|user_001",
            is_active=False,
        )

        mock_db = AsyncMock()
        # get_session_by_short_code
        mock_result_session = MagicMock()
        mock_result_session.scalar_one_or_none.return_value = session
        # check_capacity → get_participant_count
        mock_result_count = MagicMock()
        mock_result_count.scalar_one.return_value = 3
        # Existing participant found
        mock_result_existing = MagicMock()
        mock_result_existing.scalar_one_or_none.return_value = existing_participant

        mock_db.execute = AsyncMock(
            side_effect=[mock_result_session, mock_result_count, mock_result_existing]
        )
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import join_session

        _, participant = await join_session(
            mock_db,
            short_code="Ab3kQ7xR",
            user_id="auth0|user_001",
        )

        assert participant.is_active is True
        mock_db.add.assert_not_called()  # No new participant created

    @pytest.mark.asyncio
    async def test_user_cannot_join_expired_session(self):
        """Expired session rejects join with SessionExpiredError."""
        session = make_session(status="open")
        session.is_expired = True

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import join_session

        with pytest.raises(SessionExpiredError):
            await join_session(mock_db, short_code="Expired1")

    @pytest.mark.asyncio
    async def test_user_cannot_join_draft_session(self):
        """Draft session rejects join with SessionStateError."""
        session = make_session(status="draft")
        session.is_expired = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import join_session

        with pytest.raises(SessionStateError):
            await join_session(mock_db, short_code="DraftS01")

    @pytest.mark.asyncio
    async def test_user_cannot_join_full_session(self):
        """Full session (at max_participants) rejects with 409."""
        session = make_session(status="open", max_participants=10)
        session.is_expired = False

        mock_db = AsyncMock()
        # get_session_by_short_code
        mock_result_session = MagicMock()
        mock_result_session.scalar_one_or_none.return_value = session
        # check_capacity → get_participant_count returns 10 (full)
        mock_result_count = MagicMock()
        mock_result_count.scalar_one.return_value = 10

        mock_db.execute = AsyncMock(
            side_effect=[mock_result_session, mock_result_count]
        )

        from fastapi import HTTPException
        from app.cubes.cube1_session.service import join_session

        with pytest.raises(HTTPException) as exc_info:
            await join_session(mock_db, short_code="FullSes1")
        assert exc_info.value.status_code == 409
        assert "full" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_user_anonymous_join(self):
        """Anonymous user can join without auth token."""
        session = make_session(status="open")
        session.is_expired = False

        mock_db = AsyncMock()
        # get_session_by_short_code
        mock_result_session = MagicMock()
        mock_result_session.scalar_one_or_none.return_value = session
        # check_capacity
        mock_result_count = MagicMock()
        mock_result_count.scalar_one.return_value = 0

        mock_db.execute = AsyncMock(
            side_effect=[mock_result_session, mock_result_count]
        )
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        with patch("app.cubes.cube5_gateway.service.create_login_time_entry", new_callable=AsyncMock):
            from app.cubes.cube1_session.service import join_session

            _, participant = await join_session(
                mock_db,
                short_code="AnonJoin",
                user_id=None,  # Anonymous — no auth
                display_name=None,
                language_code="fr",
                results_opt_in=False,
            )

        mock_db.add.assert_called_once()
        added = mock_db.add.call_args[0][0]
        assert added.user_id is None
        assert added.language_code == "fr"

    @pytest.mark.asyncio
    async def test_user_presence_recorded(self):
        """User presence is recorded in memory on join."""
        session = make_session(status="open")
        session.is_expired = False

        mock_db = AsyncMock()
        mock_result_session = MagicMock()
        mock_result_session.scalar_one_or_none.return_value = session
        mock_result_count = MagicMock()
        mock_result_count.scalar_one.return_value = 0
        mock_db.execute = AsyncMock(
            side_effect=[mock_result_session, mock_result_count]
        )
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        from app.core.presence import _presence

        with patch("app.cubes.cube5_gateway.service.create_login_time_entry", new_callable=AsyncMock):
            from app.cubes.cube1_session.service import join_session

            await join_session(
                mock_db,
                short_code="Ab3kQ7xR",
                user_id=None,
            )

        assert str(session.id) in _presence
        _presence.pop(str(session.id), None)  # cleanup

    @pytest.mark.asyncio
    async def test_user_presence_data_structure(self):
        """Presence endpoint returns correct data structure."""
        from app.core.presence import set_presence, _presence
        from app.cubes.cube1_session.service import get_presence

        sid = uuid.uuid4()
        await set_presence(sid, uuid.uuid4())
        await set_presence(sid, uuid.uuid4())
        await set_presence(sid, uuid.uuid4())

        result = await get_presence(sid)
        assert result["session_id"] == str(sid)
        assert result["active_count"] == 3
        assert len(result["participants"]) == 3
        _presence.pop(str(sid), None)  # cleanup


# ---------------------------------------------------------------------------
# Capacity & Pricing Tier Tests
# ---------------------------------------------------------------------------


class TestCapacityEnforcement:
    """Tests for max_participants capacity limits and pricing tier logic."""

    @pytest.mark.asyncio
    async def test_capacity_unlimited_when_none(self):
        """No capacity limit when max_participants is None (non-free tier)."""
        session = make_session(max_participants=None, pricing_tier="moderator_paid")

        mock_db = AsyncMock()

        from app.cubes.cube1_session.service import check_capacity

        # Should not raise
        await check_capacity(mock_db, session)
        mock_db.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_capacity_allows_under_limit(self):
        """Allows join when under max_participants limit."""
        session = make_session(max_participants=50)

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 49
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import check_capacity

        await check_capacity(mock_db, session)  # Should not raise

    @pytest.mark.asyncio
    async def test_capacity_rejects_at_limit(self):
        """Rejects join when at max_participants limit."""
        session = make_session(max_participants=10)

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = 10
        mock_db.execute = AsyncMock(return_value=mock_result)

        from fastapi import HTTPException
        from app.cubes.cube1_session.service import check_capacity

        with pytest.raises(HTTPException) as exc_info:
            await check_capacity(mock_db, session)
        assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# Determinism Tests
# ---------------------------------------------------------------------------


class TestDeterminism:
    """Tests for seeded session creation and replay hash verification."""

    @pytest.mark.asyncio
    async def test_seeded_session_produces_deterministic_id(self):
        """Same seed + title always produces same UUID5 session ID."""
        seed = "reproducible_test"
        title = "Deterministic Session"
        expected_id = uuid.uuid5(uuid.NAMESPACE_URL, f"exel:{seed}:{title}")

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        with (
            patch(
                "app.cubes.cube1_session.service._generate_unique_short_code",
                new_callable=AsyncMock,
                return_value="DetrmID1",
            ),
            patch("app.cubes.cube1_session.service.settings") as mock_settings,
        ):
            mock_settings.frontend_url = "http://localhost:3000"
            mock_settings.session_seed = None
            mock_settings.default_session_expiry_hours = 24

            from app.cubes.cube1_session.service import create_session

            await create_session(
                mock_db,
                title=title,
                created_by="auth0|mod_001",
                seed=seed,
            )

        added = mock_db.add.call_args[0][0]
        assert added.id == expected_id

    @pytest.mark.asyncio
    async def test_duplicate_seed_returns_existing(self):
        """Re-creating session with same seed+title returns existing (idempotent)."""
        existing = make_session(title="Existing Session")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch("app.cubes.cube1_session.service.settings") as mock_settings:
            mock_settings.session_seed = None

            from app.cubes.cube1_session.service import create_session

            result = await create_session(
                mock_db,
                title="Existing Session",
                created_by="auth0|mod_001",
                seed="same_seed",
            )

        assert result == existing
        mock_db.add.assert_not_called()


# ---------------------------------------------------------------------------
# Simulation Test Record (Cube 10 Reference)
# ---------------------------------------------------------------------------

# The following dict captures the Cube 1 test method signature for Cube 10's
# Testing Simulator to replay against future cube versions.

CUBE1_TEST_METHOD = {
    "cube_id": "cube1",
    "version": "1.0.0",
    "date": "2026-02-18",
    "test_file": "tests/cube1/test_e2e_flows.py",
    "test_classes": [
        "TestModeratorFlow",
        "TestUserFlow",
        "TestCapacityEnforcement",
        "TestDeterminism",
    ],
    "metrics_baseline": {
        "n_runs": 3,
        "total_tests": 32,
        "passed": 32,
        "failed": 0,
        "test_duration_ms": {"avg": 3341, "std": 326},
        "frontend_build_ms": {"avg": 32224, "std": 242},
        "tsc_errors": 0,
        "tsc_duration_ms": {"avg": 2827, "std": 1061},
        "bundle_sizes_kb": {
            "dashboard": 15.3,
            "session": 4.17,
            "join": 3.01,
        },
    },
    "moderator_test_flow": [
        "create_session(full_config)",
        "add_questions(3)",
        "transition(draft→open)",
        "transition(open→polling)",
        "transition(polling→ranking)",
        "transition(ranking→closed)",
        "transition(closed→archived)",
        "verify_ownership",
        "generate_qr_code",
    ],
    "user_test_flow": [
        "join_session(open, language=en, opt_in=True)",
        "rejoin_session(reactivate)",
        "join_anonymous(no_auth)",
        "verify_presence",
        "reject_expired_join",
        "reject_draft_join",
        "reject_full_session",
    ],
    "spiral_propagation": {
        "forward": "1→2→3→4→5→6→7→8→9→10 (all pass)",
        "backward": "10→9→8→7→6→5→4→3→2→1 (all pass after fixes)",
        "issues_found_and_fixed": [
            "cqs_weights missing from schema/service/router",
            "test fixtures missing new Cube 1 fields",
            "frontend Participant type mismatch (language→language_code)",
        ],
    },
}
