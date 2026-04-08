"""Shared circuit breaker state machine — reusable by Cube 3 (STT) and Cube 6 (AI).

Tracks per-provider failure counts with configurable cooldown. When a provider
hits max_failures, it enters OPEN state (cooldown). After cooldown expires,
it transitions to HALF-OPEN (allows one attempt). Success resets to CLOSED.

States:
  CLOSED (normal) → failures < max_failures
  OPEN (cooldown) → failures >= max_failures AND elapsed < cooldown_seconds
  HALF-OPEN       → cooldown expired, allows one retry (failures = max-1)

Usage:
  from app.core.circuit_breaker import CircuitBreaker
  cb = CircuitBreaker(max_failures=3, cooldown_seconds=60)
  if cb.is_open("whisper"): skip_provider()
  try: result = await call_provider()
  except: cb.record_failure("whisper")
  else: cb.record_success("whisper")
"""

from __future__ import annotations

import time

import structlog

logger = structlog.get_logger(__name__)


class CircuitBreaker:
    """Per-provider circuit breaker with failure tracking + cooldown."""

    def __init__(
        self,
        max_failures: int = 3,
        cooldown_seconds: float = 60.0,
        name: str = "default",
    ):
        self.max_failures = max_failures
        self.cooldown_seconds = cooldown_seconds
        self.name = name
        # {provider_name: {"failures": int, "last_failure": float}}
        self._state: dict[str, dict] = {}

    def is_open(self, provider: str) -> bool:
        """Check if provider is in OPEN state (cooldown active, should skip)."""
        state = self._state.get(provider)
        if not state:
            return False
        if state["failures"] >= self.max_failures:
            elapsed = time.monotonic() - state["last_failure"]
            if elapsed < self.cooldown_seconds:
                return True  # OPEN — still in cooldown
            # Cooldown expired → HALF-OPEN: allow one attempt
            state["failures"] = self.max_failures - 1
        return False

    def record_failure(self, provider: str) -> None:
        """Record a provider failure. May transition to OPEN state."""
        state = self._state.get(provider, {"failures": 0, "last_failure": 0.0})
        state["failures"] = state.get("failures", 0) + 1
        state["last_failure"] = time.monotonic()
        self._state[provider] = state
        logger.warning(
            f"{self.name}.cb.failure_recorded",
            provider=provider,
            total_failures=state["failures"],
            cooldown_active=state["failures"] >= self.max_failures,
        )

    def record_success(self, provider: str) -> None:
        """Reset provider to CLOSED state on success."""
        if provider in self._state:
            self._state[provider] = {"failures": 0, "last_failure": 0.0}

    def get_state(self, provider: str) -> dict:
        """Return current state for observability/metrics."""
        return self._state.get(provider, {"failures": 0, "last_failure": 0.0})

    def reset(self, provider: str | None = None) -> None:
        """Reset state for one provider or all providers."""
        if provider:
            self._state.pop(provider, None)
        else:
            self._state.clear()
