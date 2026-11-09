"""Active-input ♡ S.I. credit — CRS-19.09 / CRS-12.

Credits ♡ only for time the participant was actively typing or speaking.
Reuses Cube 5 ``calculate_tokens`` (♡ = ceil(active_minutes), ◬ = 5×♡).
Does NOT invent a new tokens-per-minute rate.

Anti-gaming (server):
  - active_ms capped by wall time (join/open → submit)
  - paste → typing credit 0
  - empty / whitespace → 0
  - inflated active_ms capped by text length × MAX_MS_PER_CHAR
  - voice_ms capped by claimed voice duration and remaining wall
  - one credit per response_id (unique ledger reference)
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# Rule version stamped on every ledger row for this credit path.
RULE_VERSION = "si-active-input-v1-2026-11-09"

# Idle cutoff the client should use (documented; server does not re-simulate keystrokes).
CLIENT_IDLE_CUTOFF_MS = 5_000

# Plausibility: at most this many ms of typing credit per character of submitted text.
# Stops "type one char, claim 30 minutes". Not a token rate.
MAX_MS_PER_CHAR = 2_000

# Absolute ceiling on credited active time per response (matches MAX_TIME_ENTRY_SECONDS spirit).
MAX_ACTIVE_MS = 3 * 3600 * 1000

ACTION_TYPE = "responding_active"


@dataclass(frozen=True)
class ActiveInputDecision:
    credited_ms: int
    heart: float
    unity: float
    human: float
    reason: str
    rule_version: str = RULE_VERSION


def validate_active_ms(
    *,
    claimed_ms: int | None,
    wall_ms: int,
    text_len: int,
    paste_detected: bool,
    voice_ms: int = 0,
    empty: bool = False,
) -> int:
    """Return the capped active_ms to credit (may be 0). Pure / side-effect free."""
    if empty or text_len <= 0:
        return 0

    wall_ms = max(0, int(wall_ms))
    claimed = max(0, int(claimed_ms or 0))
    voice = max(0, int(voice_ms or 0))

    # Typing portion: paste earns no typing credit (voice may still count).
    typing = 0 if paste_detected else claimed
    typing = min(typing, wall_ms, text_len * MAX_MS_PER_CHAR, MAX_ACTIVE_MS)

    # Voice portion: cannot exceed claimed voice duration or remaining wall.
    remaining_wall = max(0, wall_ms - typing)
    voice = min(voice, remaining_wall, MAX_ACTIVE_MS)

    total = min(typing + voice, wall_ms, MAX_ACTIVE_MS)
    return int(total)


def tokens_for_active_ms(active_ms: int) -> tuple[float, float, float]:
    """♡ 웃 ◬ via the same math as calculate_tokens (웃 stays 0 while human_enabled=False)."""
    from app.cubes.cube5_gateway.service import calculate_tokens

    if active_ms <= 0:
        return 0.0, 0.0, 0.0
    return calculate_tokens(active_ms / 1000.0, ACTION_TYPE)


def decide_active_input_credit(
    *,
    claimed_ms: int | None,
    wall_ms: int,
    text: str,
    paste_detected: bool = False,
    voice_ms: int = 0,
) -> ActiveInputDecision:
    stripped = (text or "").strip()
    credited = validate_active_ms(
        claimed_ms=claimed_ms,
        wall_ms=wall_ms,
        text_len=len(stripped),
        paste_detected=paste_detected,
        voice_ms=voice_ms,
        empty=not stripped,
    )
    heart, human, unity = tokens_for_active_ms(credited)
    reason = (
        f"{ACTION_TYPE} active_ms={credited} paste={bool(paste_detected)} "
        f"chars={len(stripped)} voice_ms={max(0, int(voice_ms or 0))} "
        f"rule={RULE_VERSION} — ♡{heart} 웃{human} ◬{unity}"
    )
    return ActiveInputDecision(
        credited_ms=credited,
        heart=float(heart),
        unity=float(unity),
        human=float(human),
        reason=reason,
    )
