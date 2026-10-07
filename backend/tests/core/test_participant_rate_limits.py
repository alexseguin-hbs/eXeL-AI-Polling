"""Every per-address rate limit on a participant route is named in backlog HP-28 (Christo, AsM round 12).

A crowd behind one egress address (a hall, a campus, carrier-grade NAT) shares each per-address limit, so every such
limit is an operator decision recorded in HP-28. Round 11 added limits to ballots and time tracking without updating
it; this gate reads the limiter's own registry and fails when a participant route (one that takes the join-issued
participant token, or join itself) carries a limit HP-28 does not name.
"""
from __future__ import annotations

import importlib
import inspect
from pathlib import Path

from app.core.rate_limit import limiter
from app.main import app  # noqa: F401  (registers every router's limits)

BACKLOG = Path(__file__).resolve().parents[3] / "docs" / "backlog" / "2026.10.06_21.36..04_high_priority_backlog_1M_polling.md"


def _participant_limited() -> dict[str, list[str]]:
    out = {}
    for key, limits in limiter._route_limits.items():
        module, name = key.rsplit(".", 1)
        fn = inspect.unwrap(getattr(importlib.import_module(module), name))
        if "participant_token" in inspect.signature(fn).parameters or name == "join_session":
            out[name] = [str(lim.limit) for lim in limits]
    return out


def test_every_participant_limit_is_in_hp28():
    row = next(line for line in BACKLOG.read_text(encoding="utf-8").splitlines() if line.startswith("| HP-28 |"))
    limited = _participant_limited()
    assert len(limited) >= 6, f"the scan found only {sorted(limited)} — it no longer reads the limiter"
    missing = sorted(n for n in limited if f"`{n}`" not in row)
    assert not missing, f"participant routes with a per-address limit not named in HP-28: {missing} ({limited})"
