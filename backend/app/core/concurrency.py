"""Shared concurrency utilities — per-session semaphore pools.

Used by Cube 3 (STT provider calls) and Cube 6 (AI Phase A summarization)
to limit parallel external API calls per session.

Pattern: Each session gets its own asyncio.Semaphore with a configurable max.
Prevents provider rate exhaustion while allowing concurrent processing.
"""

from __future__ import annotations

import asyncio
import uuid


class SessionSemaphorePool:
    """Per-session concurrency limiter with bounded size.

    Each session_id gets its own asyncio.Semaphore. Lazy initialization.
    Evicts oldest sessions when pool exceeds max_sessions to prevent memory leak.

    Usage:
        pool = SessionSemaphorePool(max_concurrent=20)
        sem = pool.get(session_id)
        async with sem:
            await call_external_api()
    """

    def __init__(self, max_concurrent: int, name: str = "default", max_sessions: int = 10_000):
        self.max_concurrent = max_concurrent
        self.name = name
        self.max_sessions = max_sessions
        self._semaphores: dict[str, asyncio.Semaphore] = {}

    def get(self, session_id: uuid.UUID) -> asyncio.Semaphore:
        """Get or create a semaphore for the given session."""
        key = str(session_id)
        if key not in self._semaphores:
            # Evict oldest if at capacity (FIFO)
            if len(self._semaphores) >= self.max_sessions:
                oldest = next(iter(self._semaphores))
                del self._semaphores[oldest]
            self._semaphores[key] = asyncio.Semaphore(self.max_concurrent)
        return self._semaphores[key]

    def remove(self, session_id: uuid.UUID) -> None:
        """Remove a session's semaphore (cleanup after session ends)."""
        self._semaphores.pop(str(session_id), None)

    @property
    def active_sessions(self) -> int:
        """Number of sessions with active semaphores."""
        return len(self._semaphores)
