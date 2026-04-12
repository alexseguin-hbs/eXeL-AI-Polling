"""Cube 6 — Theme-Level Summary Cascade Generator.

Generates 333 → 111 → 33 word summaries for each theme cluster.
These explain what a 2-3 word theme label MEANS at scale.

Architecture (O(sample_size), NOT O(N)):
  1. For each theme cluster, sample K representative per-response 33-word summaries
  2. Feed sampled summaries to AI → generate 333-word theme summary (3 paragraphs)
  3. Compress 333 → 111 words (1 paragraph)
  4. Compress 111 → 33 words (1 sentence)

Scale: 1M responses → sample 50 per cluster → only 50 AI inputs, not 1M.

Pricing tiers:
  333 words = $3.33 (paid)
  111 words = $1.11 (paid)
  33 words  = FREE (included in all exports)
"""

import logging
import random
import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.response_summary import ResponseSummary
from app.models.theme import Theme

logger = logging.getLogger("cube6.theme_summarizer")

# Maximum per-response summaries to sample per theme cluster
MAX_SAMPLE_SIZE = 50

# Seed for deterministic sampling (reproducibility requirement)
SAMPLING_SEED = 42


async def sample_response_summaries(
    db: AsyncSession,
    session_id: uuid.UUID,
    theme_label: str,
    theme_level: str = "theme2_3",
    max_samples: int = MAX_SAMPLE_SIZE,
) -> list[str]:
    """Sample 33-word response summaries from a specific theme cluster.

    Returns up to max_samples summaries, deterministically sampled.
    Uses the per-response summary_33 field — never reads raw text.

    Args:
        theme_level: Column to match against — "theme2_3", "theme2_6", or "theme2_9"
    """
    # Build column reference dynamically
    theme_col = getattr(ResponseSummary, theme_level, None)
    if theme_col is None:
        logger.warning(f"Invalid theme_level: {theme_level}")
        return []

    result = await db.execute(
        select(ResponseSummary.summary_33)
        .where(
            ResponseSummary.session_id == session_id,
            theme_col == theme_label,
            ResponseSummary.summary_33.isnot(None),
            ResponseSummary.summary_33 != "",
        )
        .limit(max_samples * 3)  # Over-fetch for sampling pool
    )
    all_summaries = [row[0] for row in result.all() if row[0]]

    if not all_summaries:
        return []

    # Deterministic sample
    rng = random.Random(SAMPLING_SEED)
    if len(all_summaries) > max_samples:
        all_summaries = rng.sample(all_summaries, max_samples)

    return all_summaries


def build_theme_333_prompt(
    theme_label: str,
    sampled_summaries: list[str],
) -> str:
    """Build the AI prompt for generating a 333-word theme summary.

    Input: sampled 33-word response summaries from this cluster.
    Output: 3-paragraph, 333-word explanation of what this theme means.
    """
    summaries_text = "\n".join(f"- {s}" for s in sampled_summaries)

    return f"""You are analyzing responses grouped under the theme "{theme_label}".

Below are {len(sampled_summaries)} representative 33-word summaries from participants whose responses were clustered into this theme:

{summaries_text}

Write a 333-word summary (exactly 3 paragraphs) that explains:
1. What this theme represents — the core idea participants are expressing
2. The key patterns, concerns, or proposals within this theme
3. The implications and why this matters to decision-makers

Rules:
- Exactly 333 words (±10 words acceptable)
- 3 paragraphs, each roughly equal length
- Neutral, analytical tone — synthesize, don't advocate
- Reference specific participant perspectives without quoting verbatim
- Do not use the word "theme" — describe the substance directly"""


def build_theme_111_prompt(theme_label: str, summary_333: str) -> str:
    """Compress 333-word theme summary to 111 words (1 paragraph)."""
    return f"""Compress this 333-word analysis of "{theme_label}" into exactly 111 words (1 paragraph).

Preserve the core insight, key patterns, and implications. Remove examples and hedging.

333-WORD VERSION:
{summary_333}

Write exactly 111 words (±5 words acceptable). One paragraph. Analytical tone."""


def build_theme_33_prompt(theme_label: str, summary_111: str) -> str:
    """Compress 111-word theme summary to 33 words (1 sentence)."""
    return f"""Compress this 111-word analysis of "{theme_label}" into exactly 33 words (1-2 sentences).

Capture the single most important insight. Be specific, not vague.

111-WORD VERSION:
{summary_111}

Write exactly 33 words (±3 words acceptable). Maximum 2 sentences."""


async def generate_theme_summaries(
    db: AsyncSession,
    session_id: uuid.UUID,
    theme_level: str = "theme2_3",
    ai_provider_fn=None,
) -> list[dict]:
    """Generate 333 → 111 → 33 word summaries for all themes at a given level.

    Args:
        theme_level: "theme2_3" (3 themes), "theme2_6" (6), or "theme2_9" (9)
        ai_provider_fn: async callable(prompt: str) -> str — the AI completion function.
                        If None, generates prompts only (dry run).

    Returns:
        List of {theme_id, label, summary_333, summary_111, summary_33}
    """
    # Get all themes for this session
    result = await db.execute(
        select(Theme).where(Theme.session_id == session_id)
    )
    themes = list(result.scalars().all())

    if not themes:
        logger.info(f"No themes found for session {session_id}")
        return []

    # Get unique theme labels at the requested level
    theme_col = getattr(ResponseSummary, theme_level, None)
    if theme_col is None:
        return []

    labels_result = await db.execute(
        select(theme_col).where(
            ResponseSummary.session_id == session_id,
            theme_col.isnot(None),
            theme_col != "",
        ).distinct()
    )
    unique_labels = [row[0] for row in labels_result.all() if row[0]]

    results = []

    for label in unique_labels:
        # Step 1: Sample per-response summaries from this cluster
        samples = await sample_response_summaries(
            db, session_id, label, theme_level
        )

        if not samples:
            logger.warning(f"No samples for theme '{label}' at {theme_level}")
            continue

        logger.info(
            f"cube6.theme_summarizer.generating",
            extra={"theme": label, "samples": len(samples), "level": theme_level}
        )

        if ai_provider_fn is None:
            # Dry run: return prompts only
            results.append({
                "label": label,
                "sample_count": len(samples),
                "prompt_333": build_theme_333_prompt(label, samples),
            })
            continue

        # Step 2: Generate 333-word summary from sampled summaries
        prompt_333 = build_theme_333_prompt(label, samples)
        summary_333 = await ai_provider_fn(prompt_333)

        # Step 3: Compress 333 → 111 words
        prompt_111 = build_theme_111_prompt(label, summary_333)
        summary_111 = await ai_provider_fn(prompt_111)

        # Step 4: Compress 111 → 33 words
        prompt_33 = build_theme_33_prompt(label, summary_111)
        summary_33 = await ai_provider_fn(prompt_33)

        # Step 5: Find matching Theme record and update
        matching_theme = next(
            (t for t in themes if t.label == label), None
        )
        if matching_theme:
            matching_theme.theme_summary_333 = summary_333
            matching_theme.theme_summary_111 = summary_111
            matching_theme.theme_summary_33 = summary_33

        results.append({
            "theme_id": str(matching_theme.id) if matching_theme else None,
            "label": label,
            "sample_count": len(samples),
            "summary_333": summary_333,
            "summary_111": summary_111,
            "summary_33": summary_33,
        })

    if ai_provider_fn is not None:
        await db.commit()
        logger.info(
            f"cube6.theme_summarizer.complete",
            extra={"session_id": str(session_id), "themes": len(results), "level": theme_level}
        )

    return results


# ---------------------------------------------------------------------------
# Export Tier Thresholds (theme-level)
# ---------------------------------------------------------------------------

THEME_TIER_333_CENTS = 333  # $3.33 — unlocks 333-word theme summaries
THEME_TIER_111_CENTS = 111  # $1.11 — unlocks 111-word theme summaries
# 33-word theme summaries are always FREE
