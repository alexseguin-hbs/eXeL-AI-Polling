"""C2-4 lock: store_response retries TRANSIENT DB errors, fails fast on others."""

import asyncio
import uuid

import pytest
from sqlalchemy.exc import OperationalError

from app.cubes.cube2_text import service
from app.cubes.cube2_text.service import store_response


class _FlakyDB:
    """Async DB stub whose commit() raises `exc` the first `fail_times` calls."""

    def __init__(self, fail_times: int, exc: Exception):
        self.fail_times = fail_times
        self.exc = exc
        self.commit_calls = 0
        self.rollbacks = 0

    def add(self, _obj):
        pass

    async def flush(self):
        pass

    async def commit(self):
        self.commit_calls += 1
        if self.commit_calls <= self.fail_times:
            raise self.exc

    async def rollback(self):
        self.rollbacks += 1

    async def refresh(self, _obj):
        pass


def _kwargs():
    return dict(
        session_id=uuid.uuid4(), question_id=uuid.uuid4(), participant_id=None,
        cycle_id=1, raw_text="hello world", language_code="en", is_anonymous=True,
        anon_hash="x", pii_detected=False, pii_types=None, pii_scrubbed_text=None,
        profanity_detected=False, profanity_words=None, clean_text="hello world",
    )


def _run(coro):
    return asyncio.run(coro)


def _op_error():
    return OperationalError("commit", {}, Exception("connection reset by peer"))


def test_retries_transient_then_succeeds(monkeypatch):
    monkeypatch.setattr(service, "_STORE_RETRY_BACKOFF", 0.0, raising=False)
    db = _FlakyDB(fail_times=2, exc=_op_error())
    _meta, response_hash = _run(store_response(db, **_kwargs()))
    assert db.commit_calls == 3  # 2 transient failures + 1 success
    assert db.rollbacks == 2
    assert len(response_hash) == 64


def test_non_transient_fails_fast_no_retry():
    db = _FlakyDB(fail_times=1, exc=ValueError("integrity violation"))
    with pytest.raises(service.ResponseValidationError):
        _run(store_response(db, **_kwargs()))
    assert db.commit_calls == 1  # non-transient → no retry
    assert db.rollbacks == 1


def test_exhausts_retries_then_raises(monkeypatch):
    monkeypatch.setattr(service, "_STORE_RETRY_BACKOFF", 0.0, raising=False)
    db = _FlakyDB(fail_times=99, exc=_op_error())
    with pytest.raises(service.ResponseValidationError):
        _run(store_response(db, **_kwargs()))
    assert db.commit_calls == service._STORE_MAX_RETRIES  # bounded
