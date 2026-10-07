"""One Postgres database per test run, so two runs on one host never wipe each other.

The real-database proofs (tests/live_db, the SQL-tally parity and ballot-cycle proofs) drop or truncate their own
database before every test. With one fixed default name, two runs on the same Postgres (parallel reviewers, a
local run beside a CI shard) destroyed each other's data mid-test and failed on unrelated cases (Thor, Odin, Enlil,
AsM round 9). So when the DSN comes from the default (no env var), the database name carries this process id and
is dropped when the session ends (tests/conftest.py pytest_sessionfinish). An explicit DSN (CI sets both) is used
exactly as given and never dropped here.
"""
from __future__ import annotations

import asyncio
import os
from urllib.parse import urlsplit, urlunsplit

_OWNED: list[tuple[str, str]] = []  # (admin DSN, database name) created under a per-run name


def own_dsn(env_var: str, default: str) -> str:
    """The DSN from env_var verbatim, else the default with a per-process database name."""
    if os.environ.get(env_var):
        return os.environ[env_var]
    parts = urlsplit(default)
    name = f"{parts.path.lstrip('/')}_{os.getpid()}"
    _OWNED.append((urlunsplit(parts._replace(path="/postgres")), name))
    return urlunsplit(parts._replace(path=f"/{name}"))


def drop_owned() -> None:
    """Drop every per-run database this process named (a no-op when the proofs skipped or used an explicit DSN)."""
    async def run():
        import asyncpg

        for admin_dsn, name in _OWNED:
            try:
                c = await asyncpg.connect(admin_dsn, timeout=2)
            except Exception:
                return  # no Postgres: nothing was created
            try:
                await c.execute(f'drop database if exists "{name}" with (force)')
            finally:
                await c.close()

    if _OWNED:
        asyncio.run(run())
