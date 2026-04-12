"""Cube 9 — Governance Compression Ratio.

Master of Thought's differentiator:
  "47,000 voices → 3 priorities in 12 seconds"

The RATIO is always FREE — it's the hook.
The EXPLANATION (methodology, sampling, cost) is $2.22.

Compression formula:
  ratio = input_count / theme_count
  speed = processing_time_seconds
  headline = f"{input_count:,} voices → {theme_count} priorities in {speed:.1f}s"
"""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.theme import Theme
from app.models.session import Session

logger = logging.getLogger("cube9.compression")

# Gate threshold
COMPRESSION_EXPLAIN_CENTS = 222  # $2.22 to unlock methodology


async def build_compression_ratio(
    db: AsyncSession,
    session_id: uuid.UUID,
    include_explanation: bool = False,
) -> dict:
    """Build the governance compression ratio for a session.

    Always returns: headline, ratio, input_count, theme_count, speed.
    Only returns explanation if include_explanation=True (paid tier).
    """
    # Count inputs
    input_result = await db.execute(
        select(func.count()).select_from(ResponseMeta).where(
            ResponseMeta.session_id == session_id
        )
    )
    input_count = input_result.scalar() or 0

    # Count themes at each level
    theme_result = await db.execute(
        select(Theme).where(Theme.session_id == session_id)
    )
    themes = list(theme_result.scalars().all())
    theme_count = len(themes)

    # Get session timing
    sess_result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = sess_result.scalar_one_or_none()

    # Calculate processing time (closed_at - opened_at as proxy)
    processing_seconds = 0.0
    if session and session.opened_at and session.closed_at:
        delta = session.closed_at - session.opened_at
        processing_seconds = delta.total_seconds()

    # Theme level breakdown
    theme2_3_count = len(set(
        s.theme2_3 for s in
        (await db.execute(
            select(ResponseSummary.theme2_3).where(
                ResponseSummary.session_id == session_id,
                ResponseSummary.theme2_3.isnot(None),
            ).distinct()
        )).scalars().all() if s
    )) if input_count > 0 else 0

    theme2_6_count = len(set(
        s.theme2_6 for s in
        (await db.execute(
            select(ResponseSummary.theme2_6).where(
                ResponseSummary.session_id == session_id,
                ResponseSummary.theme2_6.isnot(None),
            ).distinct()
        )).scalars().all() if s
    )) if input_count > 0 else 0

    theme2_9_count = len(set(
        s.theme2_9 for s in
        (await db.execute(
            select(ResponseSummary.theme2_9).where(
                ResponseSummary.session_id == session_id,
                ResponseSummary.theme2_9.isnot(None),
            ).distinct()
        )).scalars().all() if s
    )) if input_count > 0 else 0

    # Compression ratios
    ratio_3 = round(input_count / max(theme2_3_count, 1), 1)
    ratio_6 = round(input_count / max(theme2_6_count, 1), 1)
    ratio_9 = round(input_count / max(theme2_9_count, 1), 1)

    # Headline (always FREE)
    if theme2_3_count > 0:
        headline = f"{input_count:,} voices → {theme2_3_count} priorities"
    else:
        headline = f"{input_count:,} voices collected"

    result = {
        "headline": headline,
        "input_count": input_count,
        "compression": {
            "level_3": {"themes": theme2_3_count, "ratio": ratio_3},
            "level_6": {"themes": theme2_6_count, "ratio": ratio_6},
            "level_9": {"themes": theme2_9_count, "ratio": ratio_9},
        },
        "cascade": f"{input_count} → {theme2_9_count} → {theme2_6_count} → {theme2_3_count}",
    }

    # Paid explanation ($2.22)
    if include_explanation:
        result["methodology"] = {
            "pipeline": [
                "1. Batch embedding: responses → vector space (provider-specific model)",
                "2. MiniBatchKMeans clustering: seeded (seed=42), deterministic ordering",
                "3. Marble sampling: K representative responses per cluster",
                "4. AI summarization cascade: 333 → 111 → 33 words per response",
                "5. Theme-level cascade: sample cluster summaries → 333 → 111 → 33 words",
                "6. Confidence scoring: cosine similarity to cluster centroid",
            ],
            "determinism": "Identical inputs + same seed = identical themes (SHA-256 verifiable)",
            "scale_strategy": "Streaming MiniBatchKMeans — O(batch_size), not O(N). 1M inputs processed in chunks of 1000.",
            "sampling": f"Max 50 representative summaries per cluster (of {input_count} total)",
            "cost_per_input": "~$0.00003 per response (embedding + summarization amortized)",
            "speed_factors": [
                "Batch embedding (not row-by-row API calls)",
                "Streaming clustering (no full-memory load)",
                "Parallel summarization (async worker fleet)",
            ],
        }
    else:
        result["methodology"] = "🔒"

    return result
