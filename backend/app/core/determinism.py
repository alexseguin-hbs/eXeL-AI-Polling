"""Determinism verification — replay hash computation and verification.

The replay hash is a SHA-256 digest of all deterministic inputs to the pipeline:
session seed, response IDs, config parameters, and AI provider settings.
Two runs with identical inputs MUST produce the same replay hash.
"""

import hashlib
import json
from typing import Any


def compute_replay_hash(
    inputs: dict[str, Any],
    config: dict[str, Any],
    seeds: dict[str, Any],
) -> str:
    """Compute SHA-256 replay hash from deterministic inputs.

    Args:
        inputs: Response data identifiers (IDs, counts).
        config: Pipeline configuration (sample_count, sample_size, etc.).
        seeds: Seed values used for RNG and UUID generation.

    Returns:
        64-char hex SHA-256 digest.
    """
    payload = {
        "inputs": inputs,
        "config": config,
        "seeds": seeds,
    }
    canonical = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def verify_replay_hash(expected: str, **kwargs: Any) -> bool:
    """Verify that recomputed hash matches expected.

    Pass the same inputs/config/seeds as keyword arguments.
    """
    actual = compute_replay_hash(
        inputs=kwargs.get("inputs", {}),
        config=kwargs.get("config", {}),
        seeds=kwargs.get("seeds", {}),
    )
    return actual == expected
