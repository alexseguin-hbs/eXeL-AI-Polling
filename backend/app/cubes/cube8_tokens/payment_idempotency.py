"""Idempotency helpers for Stripe creates + webhook event dedupe.

Stripe Idempotency-Key on create; webhook event id set for duplicate-event prevention.
Pure helpers — persistence is optional via a provided set/store.
"""

from __future__ import annotations

import hashlib
import uuid
from typing import MutableSet


def stripe_idempotency_key(
    *,
    action: str,
    session_id: str | None = None,
    participant_id: str | None = None,
    amount_cents: int | None = None,
    transaction_type: str | None = None,
    attempt: int = 1,
    nonce: str | None = None,
) -> str:
    """Deterministic key for a logical payment attempt (retries share attempt number intentionally
    only when caller bumps attempt). Max 255 chars for Stripe."""
    parts = [
        action,
        transaction_type or "",
        session_id or "",
        participant_id or "",
        str(amount_cents if amount_cents is not None else ""),
        f"a{attempt}",
        nonce or "",
    ]
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()[:32]
    return f"exel_{action}_{digest}"


def new_attempt_nonce() -> str:
    return uuid.uuid4().hex[:12]


class WebhookEventDedupe:
    """In-memory / injectable set of processed Stripe event ids.

    Production should persist to ``stripe_webhook_events`` (see migration 033 review file).
    """

    def __init__(self, store: MutableSet[str] | None = None):
        self._store: MutableSet[str] = store if store is not None else set()

    def already_processed(self, event_id: str) -> bool:
        return bool(event_id) and event_id in self._store

    def mark_processed(self, event_id: str) -> bool:
        """Return True if this is the first time (caller should process); False if duplicate."""
        if not event_id:
            return True  # cannot dedupe — allow process but caller should log
        if event_id in self._store:
            return False
        self._store.add(event_id)
        return True


# Process-global default for single-worker; tests inject their own.
DEFAULT_WEBHOOK_DEDUPE = WebhookEventDedupe()
