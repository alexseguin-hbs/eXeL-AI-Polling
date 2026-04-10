"""Cube 1 — Session Service Tests.

Tests:
  - Session creation (with/without seed)
  - Short code generation + collision retry
  - Session retrieval (by ID, by short_code)
  - Session update (draft only)
  - State machine transitions (valid + invalid)
  - Participant join flow (new + rejoin, anonymous, expired, wrong state)
  - Participant listing
  - QR code generation (PNG, base64)
  - Session ownership verification
  - QR access validation (expired/closed blocking)
  - Question management (add, list, get)
  - In-memory presence tracking
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.auth import CurrentUser
from app.core.exceptions import SessionExpiredError, SessionNotFoundError, SessionStateError

from tests.conftest import make_participant, make_question, make_session


# ---------------------------------------------------------------------------
# Session Creation
# ---------------------------------------------------------------------------


class TestCreateSession:
    @pytest.mark.asyncio
    async def test_create_session_basic(self):
        """Create a session with default settings."""
        with patch("app.cubes.cube1_session.service._generate_unique_short_code", new_callable=AsyncMock) as mock_code:
            mock_code.return_value = "TestC0d3"
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
                    title="My Poll",
                    created_by="auth0|mod_001",
                )

            mock_db.add.assert_called_once()
            mock_db.commit.assert_awaited_once()
            mock_db.refresh.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_session_with_seed_deterministic_id(self):
        """Seeded session should generate UUID5 deterministic ID."""
        seed = "test_seed"
        title = "Deterministic Poll"
        expected_id = uuid.uuid5(uuid.NAMESPACE_URL, f"exel:{seed}:{title}")

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()
        # No existing session with this ID
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        with (
            patch("app.cubes.cube1_session.service._generate_unique_short_code", new_callable=AsyncMock, return_value="SeedCode"),
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

        # Session.id should be set to the deterministic UUID5
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.id == expected_id

    @pytest.mark.asyncio
    async def test_create_session_with_seed_returns_existing(self):
        """Re-creating with same seed+title returns existing session (idempotent)."""
        existing_session = make_session(title="Existing")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing_session
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch("app.cubes.cube1_session.service.settings") as mock_settings:
            mock_settings.session_seed = None

            from app.cubes.cube1_session.service import create_session
            result = await create_session(
                mock_db,
                title="Existing",
                created_by="auth0|mod_001",
                seed="same_seed",
            )

        assert result == existing_session
        mock_db.add.assert_not_called()


# ---------------------------------------------------------------------------
# Short Code Generation
# ---------------------------------------------------------------------------


class TestShortCodeGeneration:
    def test_short_code_format(self):
        """Short code should be 8 chars from safe alphabet."""
        from app.cubes.cube1_session.service import _generate_short_code

        code = _generate_short_code()
        assert len(code) == 8
        # Should not contain ambiguous characters
        for c in code:
            assert c not in "0O1lI"

    @pytest.mark.asyncio
    async def test_short_code_collision_retry(self):
        """Should retry on collision up to 5 times."""
        mock_db = AsyncMock()
        # First 4 calls return existing session (collision), 5th returns None (success)
        existing = MagicMock()
        existing.scalar_one_or_none.return_value = "exists"
        success = MagicMock()
        success.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(
            side_effect=[existing, existing, existing, existing, success]
        )

        from app.cubes.cube1_session.service import _generate_unique_short_code
        code = await _generate_unique_short_code(mock_db)
        assert len(code) == 8
        assert mock_db.execute.call_count == 5


# ---------------------------------------------------------------------------
# Session Retrieval
# ---------------------------------------------------------------------------


class TestGetSession:
    @pytest.mark.asyncio
    async def test_get_session_by_id_found(self):
        """Should return session when found by ID."""
        session = make_session()
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import get_session_by_id
        result = await get_session_by_id(mock_db, session.id)
        assert result == session

    @pytest.mark.asyncio
    async def test_get_session_by_id_not_found(self):
        """Should raise SessionNotFoundError when not found."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import get_session_by_id
        with pytest.raises(SessionNotFoundError):
            await get_session_by_id(mock_db, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_get_session_by_short_code_found(self):
        """Should return session when found by short_code."""
        session = make_session(short_code="TestC0de")
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import get_session_by_short_code
        result = await get_session_by_short_code(mock_db, "TestC0de")
        assert result == session

    @pytest.mark.asyncio
    async def test_get_session_by_short_code_not_found(self):
        """Should raise SessionNotFoundError when code not found."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import get_session_by_short_code
        with pytest.raises(SessionNotFoundError):
            await get_session_by_short_code(mock_db, "NOTEXIST")


# ---------------------------------------------------------------------------
# Session Update
# ---------------------------------------------------------------------------


class TestUpdateSession:
    @pytest.mark.asyncio
    async def test_update_session_draft_ok(self):
        """Should allow updates in draft state."""
        session = make_session(status="draft")

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import update_session
        result = await update_session(mock_db, session, title="New Title")
        assert session.title == "New Title"

    @pytest.mark.asyncio
    async def test_update_session_non_draft_raises(self):
        """Should reject updates when session is not in draft state."""
        session = make_session(status="open")

        mock_db = AsyncMock()

        from app.cubes.cube1_session.service import update_session
        with pytest.raises(SessionStateError):
            await update_session(mock_db, session, title="Fail")

    @pytest.mark.asyncio
    async def test_update_ignores_disallowed_fields(self):
        """Should not update fields not in the allowed set."""
        session = make_session(status="draft")
        original_status = session.status

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import update_session
        await update_session(mock_db, session, status="open", title="OK")
        # status should NOT change via update_session
        assert session.status == original_status


# ---------------------------------------------------------------------------
# State Machine Transitions
# ---------------------------------------------------------------------------


class TestStateTransitions:
    @pytest.mark.asyncio
    async def test_valid_transition_draft_to_open(self):
        """draft → open should succeed and set opened_at."""
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
    async def test_valid_transition_open_to_closed_sets_closed_at(self):
        """Closing a session should set closed_at timestamp."""
        session = make_session(status="open")
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import transition_session
        await transition_session(mock_db, session, "closed")
        assert session.status == "closed"
        assert session.closed_at is not None

    @pytest.mark.asyncio
    async def test_invalid_transition_raises(self):
        """Invalid state transition should raise SessionStateError."""
        session = make_session(status="draft")
        session.can_transition_to = MagicMock(return_value=False)

        mock_db = AsyncMock()

        from app.cubes.cube1_session.service import transition_session
        with pytest.raises(SessionStateError):
            await transition_session(mock_db, session, "closed")

    @pytest.mark.asyncio
    async def test_archive_clears_presence(self):
        """Archiving should clear in-memory presence data."""
        session = make_session(status="closed")
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.core.presence import _presence, set_presence
        from app.cubes.cube1_session.service import transition_session
        # Seed presence data
        await set_presence(session.id, uuid.uuid4())
        assert str(session.id) in _presence

        await transition_session(mock_db, session, "archived")
        # Presence should be cleared
        assert str(session.id) not in _presence


# ---------------------------------------------------------------------------
# Participant Join
# ---------------------------------------------------------------------------


class TestJoinSession:
    @pytest.mark.asyncio
    async def test_join_expired_session_raises(self):
        """Joining an expired session should raise SessionExpiredError."""
        session = make_session(status="open")
        session.is_expired = True

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import join_session
        with pytest.raises(SessionExpiredError):
            await join_session(mock_db, short_code="TestC0de")

    @pytest.mark.asyncio
    async def test_join_wrong_state_raises(self):
        """Joining a session not in open/polling raises SessionStateError."""
        session = make_session(status="draft")
        session.is_expired = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube1_session.service import join_session
        with pytest.raises(SessionStateError):
            await join_session(mock_db, short_code="TestC0de")


# ---------------------------------------------------------------------------
# QR Code Generation
# ---------------------------------------------------------------------------


class TestQRGeneration:
    def test_qr_png_returns_bytes(self):
        """QR PNG should return non-empty bytes."""
        from app.cubes.cube1_session.service import generate_qr_png
        result = generate_qr_png("http://localhost:3000/join/TestC0de")
        assert isinstance(result, bytes)
        assert len(result) > 100
        # PNG magic bytes
        assert result[:4] == b"\x89PNG"

    def test_qr_base64_returns_data_uri(self):
        """QR base64 should return data URI string."""
        from app.cubes.cube1_session.service import generate_qr_base64
        result = generate_qr_base64("http://localhost:3000/join/TestC0de")
        assert result.startswith("data:image/png;base64,")


# ---------------------------------------------------------------------------
# Ownership Verification
# ---------------------------------------------------------------------------


class TestOwnershipVerification:
    def test_owner_passes(self):
        """Session owner should pass verification."""
        session = make_session(created_by="auth0|mod_001")
        user = CurrentUser(user_id="auth0|mod_001", email="m@t.com", role="moderator", permissions=[])

        from app.cubes.cube1_session.service import verify_session_owner
        # Should not raise
        verify_session_owner(session, user)

    def test_non_owner_raises_403(self):
        """Non-owner should get 403."""
        session = make_session(created_by="auth0|mod_001")
        user = CurrentUser(user_id="auth0|other", email="o@t.com", role="moderator", permissions=[])

        from fastapi import HTTPException
        from app.cubes.cube1_session.service import verify_session_owner
        with pytest.raises(HTTPException) as exc_info:
            verify_session_owner(session, user)
        assert exc_info.value.status_code == 403

    def test_admin_bypasses_ownership(self):
        """Admin should bypass ownership check."""
        session = make_session(created_by="auth0|mod_001")
        admin = CurrentUser(user_id="auth0|admin", email="a@t.com", role="admin", permissions=[])

        from app.cubes.cube1_session.service import verify_session_owner
        # Should not raise
        verify_session_owner(session, admin)


# ---------------------------------------------------------------------------
# QR Access Validation
# ---------------------------------------------------------------------------


class TestQRAccessValidation:
    def test_expired_session_blocks_qr(self):
        """Expired session should block QR access."""
        session = make_session()
        session.is_expired = True

        from app.cubes.cube1_session.service import validate_qr_accessible
        with pytest.raises(SessionExpiredError):
            validate_qr_accessible(session)

    def test_closed_session_blocks_qr(self):
        """Closed session should block QR access."""
        session = make_session(status="closed")
        session.is_expired = False

        from app.cubes.cube1_session.service import validate_qr_accessible
        with pytest.raises(SessionStateError):
            validate_qr_accessible(session)

    def test_archived_session_blocks_qr(self):
        """Archived session should block QR access."""
        session = make_session(status="archived")
        session.is_expired = False

        from app.cubes.cube1_session.service import validate_qr_accessible
        with pytest.raises(SessionStateError):
            validate_qr_accessible(session)

    def test_open_session_allows_qr(self):
        """Open session should allow QR access."""
        session = make_session(status="open")
        session.is_expired = False

        from app.cubes.cube1_session.service import validate_qr_accessible
        validate_qr_accessible(session)


# ---------------------------------------------------------------------------
# Question Management
# ---------------------------------------------------------------------------


class TestQuestionManagement:
    @pytest.mark.asyncio
    async def test_add_question_draft_ok(self):
        """Should allow adding question in draft state."""
        session = make_session(status="draft")

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        from app.cubes.cube1_session.service import add_question
        await add_question(mock_db, session, question_text="What do you think?")
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_question_open_ok(self):
        """Should allow adding question in open state."""
        session = make_session(status="open")

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        from app.cubes.cube1_session.service import add_question
        await add_question(mock_db, session, question_text="New question?")
        mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_question_polling_raises(self):
        """Should reject adding question during polling state."""
        session = make_session(status="polling")
        mock_db = AsyncMock()

        from app.cubes.cube1_session.service import add_question
        with pytest.raises(SessionStateError):
            await add_question(mock_db, session, question_text="Too late?")


# ---------------------------------------------------------------------------
# In-Memory Presence
# ---------------------------------------------------------------------------


class TestPresence:
    @pytest.mark.asyncio
    async def test_get_presence_returns_structure(self):
        """get_presence should return session_id, active_count, participants."""
        from app.core.presence import set_presence, _presence
        from app.cubes.cube1_session.service import get_presence

        sid = uuid.uuid4()
        await set_presence(sid, uuid.uuid4())
        await set_presence(sid, uuid.uuid4())

        result = await get_presence(sid)
        assert result["session_id"] == str(sid)
        assert result["active_count"] == 2
        assert len(result["participants"]) == 2
        _presence.pop(str(sid), None)  # cleanup

    @pytest.mark.asyncio
    async def test_get_presence_empty_session(self):
        """Empty session should return 0 count."""
        from app.cubes.cube1_session.service import get_presence
        result = await get_presence(uuid.uuid4())
        assert result["active_count"] == 0
        assert result["participants"] == []


# ---------------------------------------------------------------------------
# Static Poll Countdown
# ---------------------------------------------------------------------------


class TestStaticPollCountdown:
    @pytest.mark.asyncio
    async def test_create_session_with_static_poll_fields(self):
        """Static poll fields (polling_mode_type, duration, timer_display) should be persisted."""
        with patch("app.cubes.cube1_session.service._generate_unique_short_code", new_callable=AsyncMock) as mock_code:
            mock_code.return_value = "StatC0d3"
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
                    title="Static Poll Test",
                    created_by="auth0|mod_001",
                    polling_mode_type="static_poll",
                    static_poll_duration_days=3,
                    timer_display_mode="both",
                )

            added_obj = mock_db.add.call_args[0][0]
            assert added_obj.polling_mode_type == "static_poll"
            assert added_obj.static_poll_duration_days == 3
            assert added_obj.timer_display_mode == "both"

    @pytest.mark.asyncio
    async def test_transition_to_polling_computes_ends_at(self):
        """Static poll transition to polling should compute ends_at = now + N days."""
        session = make_session(
            status="open",
            polling_mode_type="static_poll",
            static_poll_duration_days=3,
        )
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import transition_session
        await transition_session(mock_db, session, "polling")

        assert session.ends_at is not None
        # ends_at should be roughly 3 days from now
        delta = session.ends_at - datetime.now(timezone.utc)
        assert 2.9 < delta.total_seconds() / 86400 < 3.1

    @pytest.mark.asyncio
    async def test_transition_to_polling_no_ends_at_for_live(self):
        """Live interactive poll should NOT set ends_at on polling transition."""
        session = make_session(
            status="open",
            polling_mode_type="live_interactive",
        )
        session.can_transition_to = MagicMock(return_value=True)

        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube1_session.service import transition_session
        await transition_session(mock_db, session, "polling")

        assert session.ends_at is None

    @pytest.mark.asyncio
    async def test_create_session_default_timer_display_mode(self):
        """Default timer_display_mode should be 'flex'."""
        with patch("app.cubes.cube1_session.service._generate_unique_short_code", new_callable=AsyncMock) as mock_code:
            mock_code.return_value = "DfltC0d3"
            from app.cubes.cube1_session.service import create_session

            mock_db = AsyncMock()
            mock_db.commit = AsyncMock()
            mock_db.refresh = AsyncMock()
            mock_db.add = MagicMock()

            with patch("app.cubes.cube1_session.service.settings") as mock_settings:
                mock_settings.frontend_url = "http://localhost:3000"
                mock_settings.session_seed = None
                mock_settings.default_session_expiry_hours = 24

                await create_session(
                    mock_db,
                    title="Default Timer Test",
                    created_by="auth0|mod_001",
                )

            added_obj = mock_db.add.call_args[0][0]
            assert added_obj.timer_display_mode == "flex"
            assert added_obj.polling_mode_type == "live_interactive"
            assert added_obj.static_poll_duration_days is None
