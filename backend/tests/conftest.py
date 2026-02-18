"""Shared test configuration, fixtures, and mocks for all cube test suites.

Provides:
  - Async FastAPI test client
  - Mock database sessions (Postgres, MongoDB, Redis)
  - Auth/user fixtures (moderator, user, admin, anonymous)
  - Session, participant, question factory fixtures
  - Common mock objects for Cube 5 time tracking
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.auth import CurrentUser
from app.main import app


# ---------------------------------------------------------------------------
# Test Client
# ---------------------------------------------------------------------------


@pytest.fixture
async def client():
    """Async test client for FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Mock Database Sessions
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_db():
    """Mock SQLAlchemy async session."""
    db = AsyncMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.execute = AsyncMock()
    db.add = MagicMock()
    return db


@pytest.fixture
def mock_mongo():
    """Mock MongoDB async database."""
    mongo = MagicMock()
    mongo.responses = MagicMock()
    mongo.responses.insert_one = AsyncMock(
        return_value=MagicMock(inserted_id="mongo_test_id_123")
    )
    mongo.audio_files = MagicMock()
    mongo.audio_files.insert_one = AsyncMock()
    return mongo


@pytest.fixture
def mock_redis():
    """Mock Redis async client."""
    redis = AsyncMock()
    redis.publish = AsyncMock()
    redis.hset = AsyncMock()
    redis.hgetall = AsyncMock(return_value={})
    redis.expire = AsyncMock()
    redis.delete = AsyncMock()
    return redis


# ---------------------------------------------------------------------------
# Auth Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def moderator_user():
    """Authenticated moderator user."""
    return CurrentUser(
        user_id="auth0|mod_001",
        email="moderator@test.com",
        role="moderator",
        permissions=["create:session", "manage:session"],
    )


@pytest.fixture
def regular_user():
    """Authenticated regular user (participant)."""
    return CurrentUser(
        user_id="auth0|user_001",
        email="user@test.com",
        role="user",
        permissions=[],
    )


@pytest.fixture
def admin_user():
    """Authenticated admin user."""
    return CurrentUser(
        user_id="auth0|admin_001",
        email="admin@test.com",
        role="admin",
        permissions=["admin:all"],
    )


@pytest.fixture
def lead_user():
    """Authenticated lead/developer user."""
    return CurrentUser(
        user_id="auth0|lead_001",
        email="lead@test.com",
        role="lead_developer",
        permissions=["view:results"],
    )


# ---------------------------------------------------------------------------
# Entity ID Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def session_id():
    return uuid.uuid4()


@pytest.fixture
def question_id():
    return uuid.uuid4()


@pytest.fixture
def participant_id():
    return uuid.uuid4()


@pytest.fixture
def response_id():
    return uuid.uuid4()


# ---------------------------------------------------------------------------
# Model Factories
# ---------------------------------------------------------------------------


def make_session(
    *,
    id: uuid.UUID | None = None,
    status: str = "polling",
    title: str = "Test Session",
    short_code: str = "Ab3kQ7xR",
    created_by: str = "auth0|mod_001",
    anonymity_mode: str = "identified",
    cycle_mode: str = "single",
    max_cycles: int = 1,
    current_cycle: int = 1,
    ranking_mode: str = "auto",
    language: str = "en",
    max_response_length: int = 500,
    ai_provider: str = "openai",
    stt_provider: str = "openai",
    realtime_stt_enabled: bool = False,
    realtime_stt_provider: str = "azure",
    allow_user_stt_choice: bool = False,
    is_paid: bool = False,
    seed: str | None = None,
    replay_hash: str | None = None,
    join_url: str | None = None,
    qr_url: str | None = None,
    opened_at: datetime | None = None,
    closed_at: datetime | None = None,
    expires_at: datetime | None = None,
) -> MagicMock:
    """Create a mock Session object."""
    session = MagicMock()
    session.id = id or uuid.uuid4()
    session.status = status
    session.title = title
    session.short_code = short_code
    session.created_by = created_by
    session.description = None
    session.anonymity_mode = anonymity_mode
    session.cycle_mode = cycle_mode
    session.max_cycles = max_cycles
    session.current_cycle = current_cycle
    session.ranking_mode = ranking_mode
    session.language = language
    session.max_response_length = max_response_length
    session.ai_provider = ai_provider
    session.stt_provider = stt_provider
    session.realtime_stt_enabled = realtime_stt_enabled
    session.realtime_stt_provider = realtime_stt_provider
    session.allow_user_stt_choice = allow_user_stt_choice
    session.is_paid = is_paid
    session.seed = seed
    session.replay_hash = replay_hash
    session.join_url = join_url or f"http://localhost:3000/join/{short_code}"
    session.qr_url = qr_url or session.join_url
    session.opened_at = opened_at
    session.closed_at = closed_at
    session.expires_at = expires_at or (datetime.now(timezone.utc) + timedelta(hours=24))
    session.is_expired = False
    session.stripe_session_id = None
    session.created_at = datetime.now(timezone.utc)
    session.updated_at = datetime.now(timezone.utc)
    session.can_transition_to = MagicMock(side_effect=lambda s: True)

    # Mock __table__.columns for _session_to_read
    columns = []
    for attr in [
        "id", "short_code", "created_by", "status", "title", "description",
        "anonymity_mode", "cycle_mode", "max_cycles", "current_cycle",
        "ranking_mode", "language", "max_response_length", "ai_provider",
        "stt_provider", "realtime_stt_enabled", "realtime_stt_provider",
        "allow_user_stt_choice", "seed", "replay_hash", "qr_url", "join_url",
        "opened_at", "closed_at", "expires_at", "is_paid",
        "stripe_session_id", "created_at", "updated_at",
    ]:
        col = MagicMock()
        col.key = attr
        columns.append(col)
    session.__table__ = MagicMock()
    session.__table__.columns = columns
    return session


def make_participant(
    *,
    id: uuid.UUID | None = None,
    session_id: uuid.UUID | None = None,
    user_id: str | None = "auth0|user_001",
    display_name: str = "TestParticipant",
    is_active: bool = True,
    stt_provider_preference: str | None = None,
) -> MagicMock:
    """Create a mock Participant object."""
    p = MagicMock()
    p.id = id or uuid.uuid4()
    p.session_id = session_id or uuid.uuid4()
    p.user_id = user_id
    p.display_name = display_name
    p.anon_hash = None
    p.device_type = "desktop"
    p.joined_at = datetime.now(timezone.utc)
    p.last_seen = None
    p.is_active = is_active
    p.stt_provider_preference = stt_provider_preference
    return p


def make_question(
    *,
    id: uuid.UUID | None = None,
    session_id: uuid.UUID | None = None,
    question_text: str = "What is your opinion?",
    order_index: int = 0,
    status: str = "draft",
) -> MagicMock:
    """Create a mock Question object."""
    q = MagicMock()
    q.id = id or uuid.uuid4()
    q.session_id = session_id or uuid.uuid4()
    q.cycle_id = 1
    q.question_text = question_text
    q.order_index = order_index
    q.status = status
    q.parent_theme_id = None
    return q


def make_time_entry(
    *,
    id: uuid.UUID | None = None,
    heart_tokens_earned: float = 0.0,
    person_tokens_earned: float = 0.0,
    triangle_tokens_earned: float = 0.0,
    duration_seconds: float | None = None,
) -> MagicMock:
    """Create a mock TimeEntry object."""
    entry = MagicMock()
    entry.id = id or uuid.uuid4()
    entry.heart_tokens_earned = heart_tokens_earned
    entry.person_tokens_earned = person_tokens_earned
    entry.triangle_tokens_earned = triangle_tokens_earned
    entry.duration_seconds = duration_seconds
    entry.started_at = datetime.now(timezone.utc)
    entry.stopped_at = None
    entry.session_id = uuid.uuid4()
    entry.participant_id = uuid.uuid4()
    entry.action_type = "responding"
    entry.cube_id = "cube2"
    return entry


def make_response_meta(
    *,
    id: uuid.UUID | None = None,
    session_id: uuid.UUID | None = None,
    question_id: uuid.UUID | None = None,
    participant_id: uuid.UUID | None = None,
    source: str = "text",
    char_count: int = 42,
) -> MagicMock:
    """Create a mock ResponseMeta object."""
    rm = MagicMock()
    rm.id = id or uuid.uuid4()
    rm.session_id = session_id or uuid.uuid4()
    rm.question_id = question_id or uuid.uuid4()
    rm.participant_id = participant_id or uuid.uuid4()
    rm.cycle_id = 1
    rm.source = source
    rm.mongo_ref = "mongo_ref_123"
    rm.char_count = char_count
    rm.submitted_at = datetime.now(timezone.utc)
    rm.is_flagged = False
    rm.flag_reason = None
    return rm


def make_token_ledger(
    *,
    id: uuid.UUID | None = None,
    session_id: uuid.UUID | None = None,
    delta_heart: float = 1.0,
    delta_person: float = 0.0,
    delta_triangle: float = 5.0,
    lifecycle_state: str = "pending",
) -> MagicMock:
    """Create a mock TokenLedger object."""
    tl = MagicMock()
    tl.id = id or uuid.uuid4()
    tl.session_id = session_id or uuid.uuid4()
    tl.user_id = "auth0|user_001"
    tl.anon_hash = None
    tl.cube_id = "cube5"
    tl.action_type = "responding"
    tl.delta_heart = delta_heart
    tl.delta_person = delta_person
    tl.delta_triangle = delta_triangle
    tl.lifecycle_state = lifecycle_state
    tl.reason = "test"
    tl.reference_id = None
    tl.created_at = datetime.now(timezone.utc)
    return tl
