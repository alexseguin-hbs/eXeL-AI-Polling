"""Live-database harness: the real app, its lifespan and a real Postgres — no mocked DB, no mocked services.

The rest of the suite mocks the database. These tests exist so the claims "every operation answers without a 500"
and "the 38-step journey runs" are committed, repeatable proofs rather than scratch scripts (AsM round 1, Athena).

Database: LIVE_DB_DSN (default postgresql://polling:polling@localhost:5432/live_db_test_<pid>, see tests/own_db.py). Each test starts from a
freshly created database, so nothing leaks between tests or into any other database. When no Postgres is
reachable every test here SKIPS, exactly like tests/cube7/test_sql_tally_parity.py.

How the app is pointed at it: app.db.postgres builds its engine at import time from settings.database_url, and the
root conftest imports the app before this file runs. So the fixture swaps the module-level engine and session
factory (every place that holds a reference) for ones bound to the test database, and restores them afterwards.
AI and payment keys are blanked so the AI pipeline takes the deterministic OFFLINE provider: no cost, no network.
"""
from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass, field
from urllib.parse import urlsplit, urlunsplit

import pytest

from tests.own_db import own_dsn  # noqa: E402

DSN = own_dsn("LIVE_DB_DSN", "postgresql://polling:polling@localhost:5432/live_db_test")
DB_NAME = urlsplit(DSN).path.lstrip("/")
ADMIN_DSN = urlunsplit(urlsplit(DSN)._replace(path="/postgres"))
ASYNC_DSN = DSN.replace("postgresql://", "postgresql+asyncpg://", 1)

_reachable_cache: list[bool] = []


def live_db_reachable() -> bool:
    if not _reachable_cache:
        try:
            import asyncpg

            async def probe():
                c = await asyncpg.connect(ADMIN_DSN, timeout=2)
                await c.close()

            asyncio.run(probe())
            _reachable_cache.append(True)
        except Exception:
            _reachable_cache.append(False)
    return _reachable_cache[0]


@pytest.fixture(autouse=True)
def _require_live_db():
    if not live_db_reachable():
        pytest.skip(f"no local Postgres for the live-database proofs ({ADMIN_DSN.split('@')[-1]})")


@dataclass
class Who:
    """The caller the auth override reports; a test switches it between moderator and participants."""

    user: object = None
    history: list = field(default_factory=list)

    def be(self, user_id: str, role: str = "user", email: str | None = None):
        from app.core.auth import CurrentUser

        self.user = CurrentUser(user_id=user_id, email=email, role=role, permissions=[])
        return self.user

    def moderator(self):
        return self.be("auth0|live-db-moderator", role="admin", email="moderator@example.com")


async def _fresh_database() -> None:
    import asyncpg

    admin = await asyncpg.connect(ADMIN_DSN)
    try:
        await admin.execute(f'drop database if exists "{DB_NAME}" with (force)')
        await admin.execute(f'create database "{DB_NAME}"')
    finally:
        await admin.close()


@pytest.fixture
async def live(monkeypatch):
    """(client, who): an httpx client on the real app, inside its lifespan, on a fresh Postgres database."""
    import httpx
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.pool import NullPool

    import app.core.dependencies as deps
    import app.core.phase_a_retry as phase_a_retry
    import app.db.postgres as pg
    from app.config import settings
    from app.core.auth import get_current_principal, get_current_user, get_optional_current_user
    from app.core.rate_limit import limiter
    from app.main import app

    await _fresh_database()
    engine = create_async_engine(ASYNC_DSN, poolclass=NullPool)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr(pg, "engine", engine)
    monkeypatch.setattr(pg, "async_session_factory", factory)
    monkeypatch.setattr(deps, "async_session_factory", factory)
    monkeypatch.setattr(phase_a_retry, "async_session_factory", factory)
    for key in ("openai_api_key", "xai_api_key", "gemini_api_key", "anthropic_api_key",
                "stripe_secret_key", "stripe_restricted_key", "stripe_live_secret_key", "stripe_live_restricted_key"):
        monkeypatch.setattr(settings, key, "")
    limiter.reset()

    who = Who()
    who.moderator()

    async def _current():
        return who.user

    deps_overridden = (get_current_user, get_optional_current_user, get_current_principal)
    saved = {d: app.dependency_overrides.get(d) for d in deps_overridden}
    for d in deps_overridden:
        app.dependency_overrides[d] = _current
    try:
        async with app.router.lifespan_context(app):
            transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
            async with httpx.AsyncClient(transport=transport, base_url="http://live", timeout=120) as client:
                yield client, who
                # Background tasks (summaries, broadcasts) finish inside the lifespan, against this database. CQS runs
                # in the background after an aggregate: drain it so it never outlives this test's database (Enlil, r15).
                from app.cubes.cube5_gateway.service import drain_cqs_tasks

                await drain_cqs_tasks()
                await asyncio.sleep(2)
    finally:
        for d, prev in saved.items():
            if prev is None:
                app.dependency_overrides.pop(d, None)
            else:
                app.dependency_overrides[d] = prev
        await engine.dispose()
        limiter.reset()
