"""Phase Cube-1 · CRS-04.03 stretch — static-poll timer auto-close (first taste of autonomy).

Locks: the pure static_poll_expired predicate + close_expired_static_polls batch
(polling → ranking, exactly like a manual Stop Polling; idempotent; only expired ones).

Run: cd backend && python -m pytest tests/cube1/test_static_poll_autoclose.py -v --tb=short
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_session

NOW = datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc)


def _static(*, status="polling", ends_at=None, mode="static_poll"):
    s = make_session(status=status)
    s.polling_mode_type = mode
    s.ends_at = ends_at
    s.can_transition_to = MagicMock(return_value=True)
    s.closed_at = None
    return s


class TestStaticPollExpiredPredicate:
    def test_expired_static_poll_true(self):
        from app.cubes.cube1_session.service import static_poll_expired

        s = _static(ends_at=NOW - timedelta(minutes=1))
        assert static_poll_expired(s, NOW) is True

    def test_not_yet_expired_false(self):
        from app.cubes.cube1_session.service import static_poll_expired

        s = _static(ends_at=NOW + timedelta(minutes=1))
        assert static_poll_expired(s, NOW) is False

    def test_live_interactive_never_expires_here(self):
        from app.cubes.cube1_session.service import static_poll_expired

        s = _static(ends_at=NOW - timedelta(minutes=5), mode="live_interactive")
        assert static_poll_expired(s, NOW) is False

    def test_not_polling_false(self):
        from app.cubes.cube1_session.service import static_poll_expired

        s = _static(status="ranking", ends_at=NOW - timedelta(minutes=5))
        assert static_poll_expired(s, NOW) is False

    def test_no_ends_at_false(self):
        from app.cubes.cube1_session.service import static_poll_expired

        assert static_poll_expired(_static(ends_at=None), NOW) is False


class TestCloseExpiredStaticPolls:
    @pytest.mark.asyncio
    async def test_transitions_expired_to_ranking(self):
        from app.cubes.cube1_session.service import close_expired_static_polls

        s1 = _static(ends_at=NOW - timedelta(minutes=2))
        s2 = _static(ends_at=NOW - timedelta(minutes=5))
        db = AsyncMock()
        r = MagicMock(); r.scalars.return_value.all.return_value = [s1, s2]
        db.execute = AsyncMock(return_value=r)
        db.add = MagicMock(); db.commit = AsyncMock(); db.refresh = AsyncMock()

        with patch("app.cubes.cube1_session.service._log_audit", new=AsyncMock()):
            closed = await close_expired_static_polls(db, now=NOW)

        assert len(closed) == 2
        assert s1.status == "ranking" and s2.status == "ranking"

    @pytest.mark.asyncio
    async def test_none_expired_returns_empty(self):
        from app.cubes.cube1_session.service import close_expired_static_polls

        db = AsyncMock()
        r = MagicMock(); r.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=r)
        closed = await close_expired_static_polls(db, now=NOW)
        assert closed == []

    @pytest.mark.asyncio
    async def test_auto_timer_transition_audited_as_system_not_moderator(self):
        """CC-3: the autonomous auto-timer close must be attributed to actor_role
        'system' in the audit trail, not falsely to 'moderator'."""
        from app.cubes.cube1_session.service import close_expired_static_polls

        s1 = _static(ends_at=NOW - timedelta(minutes=2))
        db = AsyncMock()
        r = MagicMock(); r.scalars.return_value.all.return_value = [s1]
        db.execute = AsyncMock(return_value=r)
        db.add = MagicMock(); db.commit = AsyncMock(); db.refresh = AsyncMock()

        audit = AsyncMock()
        with patch("app.cubes.cube1_session.service._log_audit", new=audit):
            await close_expired_static_polls(db, now=NOW)

        assert audit.await_count == 1
        kwargs = audit.await_args.kwargs
        assert kwargs["actor_id"] == "system:auto-timer"
        assert kwargs["actor_role"] == "system"
