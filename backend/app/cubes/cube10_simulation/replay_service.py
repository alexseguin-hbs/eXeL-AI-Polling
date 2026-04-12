"""Cube 10 — Simulation Replay Service (Pangu).

Re-run clustering with different parameters to explore "what if":
  - Different K (3/6/9 themes)
  - Different seed (alternative clustering arrangements)
  - Different sampling rate (more/fewer marble samples)

Returns comparison metrics vs. original run.
Gated behind $2.22 donation.

Architecture:
  1. Fetch original clustering config (seed, K, provider)
  2. Re-run MiniBatchKMeans with modified parameters
  3. Compare: theme overlap %, confidence shift, new themes discovered
  4. Return side-by-side comparison without persisting (ephemeral)
"""

import logging
import uuid
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.response_summary import ResponseSummary
from app.models.theme import Theme
from app.models.session import Session

logger = logging.getLogger("cube10.replay")

REPLAY_COST_CENTS = 222  # $2.22


@dataclass
class ReplayConfig:
    """Parameters for a simulation replay."""
    theme_count: int = 3          # K: 3, 6, or 9
    seed: int = 42                # Clustering seed
    sample_rate: float = 1.0      # 1.0 = all, 0.5 = 50% sample


@dataclass
class ReplayResult:
    """Side-by-side comparison of original vs. replay."""
    original_themes: list[str]
    replay_themes: list[str]
    overlap_count: int
    overlap_percent: float
    new_themes: list[str]
    lost_themes: list[str]
    config_used: dict


async def get_original_config(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Get the original clustering configuration for a session."""
    sess_result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = sess_result.scalar_one_or_none()

    theme_result = await db.execute(
        select(Theme).where(Theme.session_id == session_id)
    )
    themes = list(theme_result.scalars().all())

    # Get unique theme labels at each level
    for level in ["theme2_3", "theme2_6", "theme2_9"]:
        col = getattr(ResponseSummary, level, None)
        if col:
            label_result = await db.execute(
                select(col).where(
                    ResponseSummary.session_id == session_id,
                    col.isnot(None), col != "",
                ).distinct()
            )

    return {
        "session_id": str(session_id),
        "seed": session.seed if session else "42",
        "theme_count": len(themes),
        "themes": [
            {
                "label": t.label,
                "confidence": t.confidence,
                "response_count": t.response_count,
                "summary_33": t.theme_summary_33 or "",
            }
            for t in themes
        ],
        "ai_provider": themes[0].ai_provider if themes else "unknown",
    }


async def preview_replay(
    db: AsyncSession,
    session_id: uuid.UUID,
    config: ReplayConfig,
) -> dict:
    """Preview what a replay would produce (dry run — no AI calls).

    Shows:
      - Which responses would be included (based on sample_rate)
      - Expected output format
      - Estimated cost
    """
    input_result = await db.execute(
        select(func.count()).select_from(ResponseSummary).where(
            ResponseSummary.session_id == session_id
        )
    )
    total_responses = input_result.scalar() or 0
    sampled_count = int(total_responses * config.sample_rate)

    original = await get_original_config(db, session_id)

    return {
        "status": "preview",
        "session_id": str(session_id),
        "config": {
            "theme_count": config.theme_count,
            "seed": config.seed,
            "sample_rate": config.sample_rate,
        },
        "original": {
            "theme_count": original["theme_count"],
            "seed": original["seed"],
            "themes": [t["label"] for t in original["themes"]],
        },
        "preview": {
            "total_responses": total_responses,
            "sampled_responses": sampled_count,
            "expected_themes": config.theme_count,
            "cost_cents": REPLAY_COST_CENTS,
            "cost_tokens": f"{REPLAY_COST_CENTS / 100.0 / 7.25:.3f} 웃",
        },
        "changes_from_original": {
            "seed_changed": config.seed != int(original["seed"] or 42),
            "k_changed": config.theme_count != original["theme_count"],
            "sample_changed": config.sample_rate != 1.0,
        },
        "note": "Full replay requires AI provider. This is a dry-run preview.",
    }


async def list_replay_options(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """List available replay configurations for a session."""
    original = await get_original_config(db, session_id)

    return {
        "session_id": str(session_id),
        "original": original,
        "available_replays": [
            {
                "name": "Alternative Seed",
                "description": "Same K, different random arrangement",
                "config": {"theme_count": original["theme_count"], "seed": 123, "sample_rate": 1.0},
            },
            {
                "name": "Expand to 6 Themes",
                "description": "Split current themes into finer groups",
                "config": {"theme_count": 6, "seed": 42, "sample_rate": 1.0},
            },
            {
                "name": "Compress to 3 Themes",
                "description": "Merge themes into broader categories",
                "config": {"theme_count": 3, "seed": 42, "sample_rate": 1.0},
            },
            {
                "name": "Full Bloom (9 Themes)",
                "description": "Maximum granularity — every nuance surfaced",
                "config": {"theme_count": 9, "seed": 42, "sample_rate": 1.0},
            },
            {
                "name": "50% Sample",
                "description": "Half the data — how stable are themes?",
                "config": {"theme_count": original["theme_count"], "seed": 42, "sample_rate": 0.5},
            },
        ],
        "cost_per_replay_cents": REPLAY_COST_CENTS,
    }
