"""Daily spend caps for anonymous routes that call a paid AI provider (Thor round 1 item 6).

The per-IP rate limit bounds one caller; rotating addresses bounded nothing. A DailyBudget is
a process-wide counter of paid calls per UTC day: once it is spent, the route refuses (429)
until the next UTC midnight. It is reserved BEFORE the provider is called, so concurrent
requests cannot overshoot it, and it is never refunded on a provider error (the provider may
already have billed).

Scope: one process. With N backend workers the ceiling is N × limit — still a hard bound,
not a global one. A global cap needs shared state (Postgres/Redis row, or KV/Durable Object on
the Worker side) and is recorded in the high-priority backlog as INFRA.
"""

from __future__ import annotations

import threading
from datetime import datetime, timedelta, timezone
from typing import Callable


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DailyBudget:
    def __init__(self, name: str, limit: Callable[[], int], clock: Callable[[], datetime] = _utc_now):
        self.name = name
        self._limit = limit
        self._clock = clock
        self._lock = threading.Lock()
        self._day = None
        self._spent = 0

    def _roll(self, now: datetime) -> None:
        if self._day != now.date():
            self._day, self._spent = now.date(), 0

    def try_spend(self, units: int = 1) -> bool:
        """Reserve `units` of today's budget. False (and nothing reserved) once it is spent."""
        with self._lock:
            now = self._clock()
            self._roll(now)
            if self._spent + units > max(0, int(self._limit())):
                return False
            self._spent += units
            return True

    def remaining(self) -> int:
        with self._lock:
            self._roll(self._clock())
            return max(0, int(self._limit()) - self._spent)

    def seconds_until_reset(self) -> int:
        now = self._clock()
        tomorrow = datetime.combine(now.date() + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        return max(1, int((tomorrow - now).total_seconds()))
