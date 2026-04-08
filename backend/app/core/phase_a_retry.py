"""Shared Phase A retry logic — used by Cube 2 (text) and Cube 3 (voice).

Handles:
  - <33-word auto-fallback (MoT-2): if clean_text <= 33 words, summary_33 = clean_text (skip AI)
  - Exponential backoff retry (1s, 2s, 4s) with max_retries
  - Fallback marker on exhaustion: "[Summary unavailable]"
  - Live feed broadcast via Supabase after successful summarization (Task A5)
  - Own db session (avoids request-scoped session reuse in background tasks)
"""

from __future__ import annotations

import asyncio
import uuid

import structlog

from app.db.postgres import async_session_factory
from app.models.response_summary import ResponseSummary

logger = structlog.get_logger(__name__)


async def run_phase_a_with_retry(
    *,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    clean_text: str,
    language_code: str,
    ai_provider: str,
    session_short_code: str = "",
    live_feed_enabled: bool = True,
    source: str = "text",
    max_retries: int = 3,
) -> None:
    """Phase A summarization with retry, <33-word fallback, and live feed broadcast.

    Creates its own db session to safely run as a background task.

    Args:
        session_id: Session UUID.
        response_id: ResponseMeta UUID.
        clean_text: PII-safe text to summarize.
        language_code: ISO language code.
        ai_provider: AI provider name (openai/grok/gemini).
        session_short_code: Session short code for broadcast channel.
        live_feed_enabled: A5.02 — only broadcast when moderator enabled live feed.
        source: "text" or "voice" — for log context.
        max_retries: Max retry attempts before fallback.
    """
    from app.cubes.cube6_ai.service import summarize_single_response

    # CRS-08.02: Guard against empty/whitespace text reaching summarization
    if not clean_text or not clean_text.strip():
        logger.warning(
            "core.phase_a.empty_text_skipped",
            response_id=str(response_id),
            session_id=str(session_id),
            source=source,
        )
        return

    # MoT-2: <33-word auto-fallback — skip AI call if text is already short enough
    word_count = len(clean_text.split())
    if word_count <= 33:
        logger.info(
            "core.phase_a.short_circuit",
            response_id=str(response_id),
            word_count=word_count,
            source=source,
        )
        async with async_session_factory() as bg_db:
            await _store_summary(
                bg_db,
                response_id=response_id,
                session_id=session_id,
                summary_33=clean_text,
                summary_111=clean_text,
                summary_333=clean_text,
            )
        if live_feed_enabled:
            await _broadcast_summary(session_short_code, response_id, clean_text)
        return

    # Standard path: call Cube 6 AI summarization with retry
    async with async_session_factory() as bg_db:
        for attempt in range(max_retries):
            try:
                await summarize_single_response(
                    bg_db,
                    session_id=session_id,
                    response_id=response_id,
                    raw_text=clean_text,
                    language_code=language_code,
                    ai_provider=ai_provider,
                    session_short_code=session_short_code,
                )
                # Task A5: broadcast summary_ready after successful summarization
                # Fetch the summary_33 that was just stored
                from sqlalchemy import select
                result = await bg_db.execute(
                    select(ResponseSummary.summary_33).where(
                        ResponseSummary.response_meta_id == response_id,
                    )
                )
                summary_33 = result.scalar_one_or_none() or ""
                if live_feed_enabled:
                    await _broadcast_summary(session_short_code, response_id, summary_33)
                return
            except Exception as exc:
                wait = 2 ** attempt
                logger.warning(
                    f"{source}.phase_a.retry",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    wait_seconds=wait,
                    error=str(exc),
                    response_id=str(response_id),
                    source=source,
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(wait)

        # All retries exhausted — store fallback marker
        logger.error(
            f"{source}.phase_a.exhausted",
            response_id=str(response_id),
            session_id=str(session_id),
        )
        await _store_summary(
            bg_db,
            response_id=response_id,
            session_id=session_id,
            summary_33="[Summary unavailable]",
            summary_111="[Summary unavailable]",
            summary_333="[Summary unavailable]",
        )


async def _store_summary(
    db,
    *,
    response_id: uuid.UUID,
    session_id: uuid.UUID,
    summary_33: str,
    summary_111: str,
    summary_333: str,
) -> None:
    """Upsert summary into response_summaries table."""
    try:
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        stmt = pg_insert(ResponseSummary).values(
            response_meta_id=response_id,
            session_id=session_id,
            summary_33=summary_33,
            summary_111=summary_111,
            summary_333=summary_333,
        ).on_conflict_do_update(
            index_elements=["response_meta_id"],
            set_={
                "summary_33": summary_33,
                "summary_111": summary_111,
                "summary_333": summary_333,
            },
        )
        await db.execute(stmt)
        await db.commit()
    except Exception as e:
        logger.warning("core.phase_a.store_summary_failed", error=str(e))  # Best-effort


async def _broadcast_summary(
    session_short_code: str,
    response_id: uuid.UUID,
    summary_33: str,
) -> None:
    """Task A5: Broadcast summary_ready via Supabase Realtime for moderator live feed."""
    if not session_short_code:
        return
    try:
        from app.core.supabase_broadcast import broadcast_event
        await broadcast_event(
            channel=f"session:{session_short_code}",
            event="summary_ready",
            payload={
                "response_id": str(response_id),
                "summary_33": summary_33,
            },
        )
    except Exception as e:
        logger.warning("core.phase_a.broadcast_failed", error=str(e))
