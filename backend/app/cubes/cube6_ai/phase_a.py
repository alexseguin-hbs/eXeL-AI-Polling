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

import structlog
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
    get_summarization_provider_or_offline,
    provider_for_session,
)
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.session import Session
from app.models.theme import Theme
from app.models.theme_sample import ThemeSample

logger = structlog.get_logger(__name__)  # keyword fields need structlog; stdlib raised TypeError

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


# --- Addendum 4: the provider a session may use (a simulation → OFFLINE unless an HI-approved estimate) ---
# Cached per session (bounded like the semaphores): session_type never changes after creation, and Phase A runs
# once per response, so a 1M-response poll must not pay one extra query per response.
_PHASE_A_PROVIDER_CACHE: dict[tuple[uuid.UUID, str], str] = {}


async def resolve_phase_a_provider(db: AsyncSession, session_id: uuid.UUID, requested: str) -> str:
    """The provider name Phase A may call for this session (`provider_for_session`, cached)."""
    key = (session_id, requested)
    if key in _PHASE_A_PROVIDER_CACHE:
        return _PHASE_A_PROVIDER_CACHE[key]
    try:
        session = (await db.execute(select(Session).where(Session.id == session_id))).scalar_one_or_none()
    except Exception as e:  # never fail a summary over the lookup (not cached, so the next response re-checks)
        logger.warning("cube6.phase_a.provider_lookup_failed", error=str(e), session_id=str(session_id))
        return requested
    name = provider_for_session(session, requested) if session is not None else requested
    while len(_PHASE_A_PROVIDER_CACHE) >= _PHASE_A_MAX_SESSIONS:
        del _PHASE_A_PROVIDER_CACHE[next(iter(_PHASE_A_PROVIDER_CACHE))]
    _PHASE_A_PROVIDER_CACHE[key] = name
    return name


def release_phase_a_semaphore(session_id: uuid.UUID) -> None:
    """Clean up semaphore when session leaves polling (e.g. ranking transition)."""
    _phase_a_semaphores.pop(session_id, None)


# ═══════════════════════════════════════════════════════════════════
# PHASE A — Live Per-Response Summarization
# ═══════════════════════════════════════════════════════════════════

_SUMMARIZE_INSTRUCTION = (
    "You are a summarizer. {translate}"
    "Condense the text to AT MOST {target} words (aim close to {target}), preserving key points "
    "and meaning. Ensure the final summary is in English. Output only the summary."
)

# Word-limit contract (shared with the frontend tokenizer `text.trim().split(/\s+/).filter(Boolean).length`):
# Python's str.split() with no argument is the same tokenizer. Tiers are upper bounds, enforced after the model.
SUMMARY_TIERS = (333, 111, 33)


def word_count(text: str) -> int:
    """Same count as the repo tokenizer: trim, split on any whitespace run, drop empties."""
    return len((text or "").split())


def cap_words(text: str, limit: int) -> str:
    """Hard upper bound: keep the first `limit` words (whitespace-normalised). Shorter text is returned unchanged."""
    words = (text or "").split()
    if len(words) <= limit:
        return (text or "").strip()
    return " ".join(words[:limit])


class _CostTracked:
    """Wraps a summarizer so each call's chars feed an AICostTracker (same ~4 chars/token estimate as Phase B)."""

    def __init__(self, inner, provider: str):
        from app.cubes.cube6_ai.providers.base import AICostTracker

        self._inner = inner
        self.tracker = AICostTracker(provider)

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        out = await self._inner.summarize(texts, instruction=instruction)
        self.tracker.log_call(len(instruction) + sum(len(t) for t in texts), len(out or ""))
        return out


def _parse_json_reply(reply: str) -> dict:
    """Models often wrap JSON in ```json fences; strip them before json.loads (raises JSONDecodeError/TypeError)."""
    t = (reply or "").strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t[3:]
        if t.rstrip().endswith("```"):
            t = t.rstrip()[:-3]
    start, end = t.find("{"), t.rfind("}")
    parsed = json.loads(t[start : end + 1] if start >= 0 and end > start else t)
    if not isinstance(parsed, dict):
        raise TypeError("summary reply is not a JSON object")
    return parsed


_SINGLE_PROMPT_INSTRUCTION = (
    "You are a summarizer. {translate}"
    "Given the following text, produce three summaries at different lengths. "
    "Return ONLY valid JSON with exactly these three keys:\n"
    '{{"summary_333": "at most 333 words", "summary_111": "at most 111 words", "summary_33": "at most 33 words"}}\n'
    "Each summary must not exceed its word limit. All summaries must be in English. Preserve key points and meaning."
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
    cost_tracked = None

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
        # C6-2: degrade to the deterministic OFFLINE provider on a missing key
        # in dev/test/CI so a single response never crashes Phase A (prod raises).
        # Addendum 4: a simulation session never silently reaches a paid provider.
        ai_provider = await resolve_phase_a_provider(db, session_id, ai_provider)
        summarizer = _CostTracked(get_summarization_provider_or_offline(ai_provider), ai_provider)
        cost_tracked = summarizer

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
                parsed = _parse_json_reply(combined)
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
                parsed = _parse_json_reply(combined)
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

    # Enforce the 333/111/33 upper bounds whatever the model returned (word_count == repo tokenizer).
    summary_333 = cap_words(str(summary_333), 333)
    summary_111 = cap_words(str(summary_111), 111)
    summary_33 = cap_words(str(summary_33), 33)

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
    # Per-session cost ledger: every paid Phase A call lands in ai_cost_logs (phase "phase_a"); the ≤33-word
    # short-circuit and the OFFLINE provider cost nothing and write no row.
    if cost_tracked is not None and cost_tracked.tracker.total_calls and ai_provider != "offline":
        from app.models.ai_cost_log import AICostLog

        t = cost_tracked.tracker
        db.add(AICostLog(
            session_id=session_id, phase="phase_a", provider=ai_provider, total_calls=t.total_calls,
            total_input_chars=t.total_input_chars, total_output_chars=t.total_output_chars,
            estimated_cost_usd=round(t.estimated_cost_usd, 6), response_count=1, duration_sec=0.0,
        ))
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


