"""Cube 6 Phase A — Live Per-Response Summarization (during polling).

Called by Cube 2 after each text/voice submission.
Generates 333 -> 111 -> 33 word English summaries immediately.
Stored in PostgreSQL (ResponseSummary) for instant moderator screen display.

Split from service.py for Succinctness (O7 gap fix, 2026-04-13).
"""
import asyncio
import hashlib
import html
import json
import logging
import math
import re
import uuid
from datetime import datetime, timezone

import numpy as np
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.cubes.cube6_ai.providers.base import EmbeddingProvider, SummarizationProvider
from app.cubes.cube6_ai.providers.factory import (
    get_embedding_provider,
    get_summarization_provider,
)
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.session import Session
from app.models.theme import Theme
from app.models.theme_sample import ThemeSample

logger = logging.getLogger(__name__)

# Theme01 categories (matches monolith)
THEME01_CATEGORIES = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]
_CONFIDENCE_THRESHOLD = 65  # <65% -> reclassify as Neutral (monolith line 127)

# --- Task A3: Per-session concurrency cap on Phase A ---
# Limits concurrent AI calls per session to prevent provider rate-limit cascade.
# Each worker enforces independently; Supabase-backed global cap deferred to production scaling.
# LRU eviction at 1000 sessions prevents unbounded memory growth (G3 gap fix, Stability +5).
_PHASE_A_MAX_CONCURRENT = 10
_PHASE_A_MAX_SESSIONS = 1000
_phase_a_semaphores: dict[uuid.UUID, asyncio.Semaphore] = {}


def _get_phase_a_semaphore(session_id: uuid.UUID) -> asyncio.Semaphore:
    """Return (or create) a per-session semaphore for Phase A concurrency.

    Evicts oldest entries when cache exceeds _PHASE_A_MAX_SESSIONS to prevent
    unbounded memory growth (N=99 gap G3).
    """
    if session_id not in _phase_a_semaphores:
        # Evict oldest entries if at capacity (FIFO — dict preserves insertion order in Python 3.7+)
        while len(_phase_a_semaphores) >= _PHASE_A_MAX_SESSIONS:
            oldest_key = next(iter(_phase_a_semaphores))
            del _phase_a_semaphores[oldest_key]
        _phase_a_semaphores[session_id] = asyncio.Semaphore(_PHASE_A_MAX_CONCURRENT)
    return _phase_a_semaphores[session_id]


def release_phase_a_semaphore(session_id: uuid.UUID) -> None:
    """Clean up semaphore when session leaves polling (e.g. ranking transition)."""
    _phase_a_semaphores.pop(session_id, None)


# ═══════════════════════════════════════════════════════════════════
# PHASE A — Live Per-Response Summarization
# ═══════════════════════════════════════════════════════════════════

_SUMMARIZE_INSTRUCTION = (
    "You are a summarizer. {translate}"
    "Condense the text to approximately {target} words, preserving key points "
    "and meaning. Ensure the final summary is in English."
)


_SINGLE_PROMPT_INSTRUCTION = (
    "You are a summarizer. {translate}"
    "Given the following text, produce three summaries at different lengths. "
    "Return ONLY valid JSON with exactly these three keys:\n"
    '{{"summary_333": "~333 word summary", "summary_111": "~111 word summary", "summary_33": "~33 word summary"}}\n'
    "All summaries must be in English. Preserve key points and meaning."
)


async def summarize_single_response(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    raw_text: str,
    language_code: str = "en",
    ai_provider: str = "openai",
    session_short_code: str = "",
) -> dict:
    """Generate 333 -> 111 -> 33 word summaries for a single response.

    Called by Cube 2 submit flow (fire-and-forget async task with retry).
    Stores summaries in PostgreSQL (response_summaries), then broadcasts
    summary_ready via Supabase.

    Task A0: Short-circuit if ≤33 words (BR-1).
    Task A1: Single structured prompt for all 3 tiers (<0.5s target).
    Task A5: Broadcast summary_ready after store.

    Returns: {"summary_333": str, "summary_111": str, "summary_33": str}
    """
    from app.core.supabase_broadcast import broadcast_event

    # --- Task A3: Per-session concurrency cap ---
    semaphore = _get_phase_a_semaphore(session_id)
    async with semaphore:
        return await _summarize_single_response_inner(
            db,
            session_id=session_id,
            response_id=response_id,
            raw_text=raw_text,
            language_code=language_code,
            ai_provider=ai_provider,
            session_short_code=session_short_code,
        )


async def _summarize_single_response_inner(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    raw_text: str,
    language_code: str = "en",
    ai_provider: str = "openai",
    session_short_code: str = "",
) -> dict:
    """Inner implementation — runs under per-session semaphore."""
    from app.core.supabase_broadcast import broadcast_event

    word_count = len(raw_text.split())

    # --- Task A0: Short-circuit ≤33 words (BR-1) ---
    # Text already at or below target summary length — no AI call needed.
    if word_count <= 33:
        summary_333 = raw_text
        summary_111 = raw_text
        summary_33 = raw_text
        logger.info(
            "cube6.phase_a.short_circuit",
            response_id=str(response_id),
            word_count=word_count,
        )
    else:
        # --- Task A1: Single structured prompt (2 round-trips max) ---
        summarizer = get_summarization_provider(ai_provider)

        translate = (
            "If the text is not in English, translate it to English first. "
            if language_code != "en"
            else ""
        )

        if word_count > 333:
            # Long text: first compress to ~333, then single prompt for 111+33
            summary_333 = await summarizer.summarize(
                [raw_text[:4000]],
                instruction=_SUMMARIZE_INSTRUCTION.format(translate=translate, target=333),
            )
            # Second call: 111 + 33 from the 333
            try:
                combined = await summarizer.summarize(
                    [summary_333],
                    instruction=_SINGLE_PROMPT_INSTRUCTION.format(translate=""),
                )
                parsed = json.loads(combined)
                summary_111 = parsed.get("summary_111", summary_333[:500])
                summary_33 = parsed.get("summary_33", " ".join(summary_333.split()[:33]))
            except (json.JSONDecodeError, TypeError):
                # Fallback: cascade if JSON parse fails
                summary_111 = await summarizer.summarize(
                    [summary_333],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate="", target=111),
                )
                summary_33 = await summarizer.summarize(
                    [summary_111],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate="", target=33),
                )
        else:
            # Medium text (34–333 words): single prompt for all 3 tiers
            try:
                combined = await summarizer.summarize(
                    [raw_text],
                    instruction=_SINGLE_PROMPT_INSTRUCTION.format(translate=translate),
                )
                parsed = json.loads(combined)
                summary_333 = parsed.get("summary_333", raw_text)
                summary_111 = parsed.get("summary_111", raw_text)
                summary_33 = parsed.get("summary_33", " ".join(raw_text.split()[:33]))
            except (json.JSONDecodeError, TypeError):
                # Fallback: cascade
                summary_333 = raw_text
                summary_111 = await summarizer.summarize(
                    [raw_text],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate=translate, target=111),
                )
                summary_33 = await summarizer.summarize(
                    [summary_111],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate="", target=33),
                )

    # Store in PostgreSQL (response_summaries) for immediate display
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from app.models.response_summary import ResponseSummary

    stmt = pg_insert(ResponseSummary).values(
        response_meta_id=response_id,
        session_id=session_id,
        provider=ai_provider,
        summary_333=summary_333,
        summary_111=summary_111,
        summary_33=summary_33,
    ).on_conflict_do_update(
        index_elements=["response_meta_id"],
        set_={
            "summary_333": summary_333,
            "summary_111": summary_111,
            "summary_33": summary_33,
            "provider": ai_provider,
        },
    )
    await db.execute(stmt)
    await db.commit()

    logger.info(
        "cube6.live_summary.completed",
        response_id=str(response_id),
        session_id=str(session_id),
        word_counts=f"333={len(summary_333.split())}, "
                     f"111={len(summary_111.split())}, "
                     f"33={len(summary_33.split())}",
    )

    # --- Task A5: Broadcast summary_ready via Supabase ---
    if session_short_code:
        await broadcast_event(
            channel=f"session:{session_short_code}",
            event="summary_ready",
            payload={
                "response_id": str(response_id),
                "summary_33": summary_33,
            },
        )

    return {
        "summary_333": summary_333,
        "summary_111": summary_111,
        "summary_33": summary_33,
    }


