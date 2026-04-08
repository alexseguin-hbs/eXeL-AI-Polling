"""Shared cryptographic utilities — hash functions used across Cubes 1-6.

Centralizes SHA-256 patterns for consistency and auditability.
Every hash in the system flows through this module.

CRS-03: Replay hash (deterministic session verification)
CRS-05: Anon hash (privacy-preserving participant ID)
CRS-08: Response hash (integrity verification on clean_text)
"""

from __future__ import annotations

import hashlib
import json
import uuid


def compute_response_hash(clean_text: str) -> str:
    """CRS-08: SHA-256 integrity hash of clean response text.

    Used by Cube 2 (text) and Cube 3 (voice) to verify response integrity.
    64-char hex string. Deterministic: same text → same hash.
    """
    return hashlib.sha256(clean_text.encode()).hexdigest()


def compute_anon_hash(
    participant_id: uuid.UUID,
    session_id: uuid.UUID | None = None,
    truncate: int = 12,
) -> str:
    """CRS-05: SHA-256 anonymization hash for participant display.

    Session-scoped: same participant gets different hash in different sessions.
    12-char hex by default — collision-safe at 100M+ users (2^48 combinations).

    Args:
        participant_id: Participant UUID.
        session_id: Optional session UUID for scoping (recommended).
        truncate: Number of hex chars to keep (default 12).
    """
    if session_id:
        payload = f"{participant_id}:{session_id}"
    else:
        payload = str(participant_id)
    return hashlib.sha256(payload.encode()).hexdigest()[:truncate]


def compute_replay_hash(
    seed: str,
    ai_provider: str,
    response_ids: list[str],
) -> str:
    """CRS-03: Deterministic replay hash for session verification.

    Inputs: seed + provider + sorted response IDs → SHA-256.
    Identical inputs MUST yield identical hash (determinism requirement).
    """
    hash_input = {
        "seed": seed,
        "ai_provider": ai_provider,
        "response_ids": sorted(response_ids),
    }
    return hashlib.sha256(
        json.dumps(hash_input, sort_keys=True).encode()
    ).hexdigest()


def compute_theme_hash(
    seed: str,
    theme_data: dict,
) -> str:
    """Cube 6: Deterministic hash for theme pipeline verification."""
    hash_input = {"seed": seed, **theme_data}
    return hashlib.sha256(
        json.dumps(hash_input, sort_keys=True).encode()
    ).hexdigest()
