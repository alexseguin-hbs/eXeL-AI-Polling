"""Cube 4 — Response Collector Service.

Aggregates text and voice responses into the standardized Web_Results format
(Q_Number, Question, User, Detailed_Results, Response_Language) plus extended
columns for summaries and theme assignments once Cube 6 processes them.

Key responsibilities:
- Aggregate from ResponseMeta (Postgres) + raw text (ResponseMeta.raw_text)
- Return in Web_Results.csv-compatible format with native language column
- Redis presence tracking for active participants
- Summary lookup from ResponseSummary (Postgres, populated by live summarization during polling)
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

import structlog
from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.submission_validators import validate_session_exists  # noqa: F401 — re-exported for router

from app.models.participant import Participant
from app.models.question import Question
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.session import Session
from app.models.text_response import TextResponse
from app.models.voice_response import VoiceResponse

logger = structlog.get_logger(__name__)


# NOTE: validate_session_exists() now in core/submission_validators.py (shared Cubes 2-4)

# ---------------------------------------------------------------------------
# 1. Collected Response Format (Web_Results-compatible)
# ---------------------------------------------------------------------------


async def get_collected_responses(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    include_summaries: bool = False,
    include_themes: bool = False,
    page: int = 1,
    page_size: int = 100,
) -> dict:
    """Aggregate all responses for a session in Web_Results format.

    Returns:
        {
            "items": [
                {
                    "q_number": "Q-0001",
                    "question": "...",
                    "user": "User_0001" or anon_hash,
                    "detailed_results": "raw text...",
                    "response_language": "English",
                    "native_language": "es",
                    # Optional (if include_summaries=True):
                    "summary_333": "...",
                    "summary_111": "...",
                    "summary_33": "...",
                    # Optional (if include_themes=True):
                    "theme01": "Risk & Concerns",
                    "theme01_confidence": "92%",
                    "theme2_9": "...", "theme2_9_confidence": "85%",
                    "theme2_6": "...", "theme2_6_confidence": "88%",
                    "theme2_3": "...", "theme2_3_confidence": "90%",
                }
            ],
            "total": int,
            "page": int,
            "page_size": int,
        }
    """
    offset = (page - 1) * page_size

    # Count total responses
    try:
        count_result = await db.execute(
            select(func.count(ResponseMeta.id)).where(
                ResponseMeta.session_id == session_id,
            )
        )
        total = count_result.scalar() or 0
    except Exception as e:
        logger.error("cube4.collected.count_error", session_id=str(session_id), error=str(e))
        return {"items": [], "total": 0, "page": page, "page_size": page_size}

    # Fetch paginated response metadata with question + participant info
    try:
        stmt = (
            select(ResponseMeta, Question, Participant)
            .outerjoin(Question, Question.id == ResponseMeta.question_id)
            .outerjoin(Participant, Participant.id == ResponseMeta.participant_id)
            .where(ResponseMeta.session_id == session_id)
            .order_by(ResponseMeta.submitted_at.asc())
            .offset(offset)
            .limit(page_size)
        )
        result = await db.execute(stmt)
        rows = result.all()
    except Exception as e:
        logger.error("cube4.collected.query_error", session_id=str(session_id), error=str(e))
        return {"items": [], "total": total, "page": page, "page_size": page_size}

    items = []
    for meta, question, participant in rows:
        # Get raw text from ResponseMeta.raw_text (PostgreSQL)
        raw_text = meta.raw_text or ""
        language = "English"
        native_language = "en"

        # For voice responses, get transcript from TextResponse via join
        if meta.source == "voice" and not raw_text:
            text_resp_result = await db.execute(
                select(TextResponse).where(
                    TextResponse.response_meta_id == meta.id
                )
            )
            text_resp = text_resp_result.scalar_one_or_none()
            if text_resp:
                raw_text = text_resp.clean_text or ""

        # Get participant language from participant record
        if participant and participant.language_code:
            native_language = participant.language_code

        # Build user identifier — CRS-09.01: SHA-256 anon_hash (collision-safe at scale)
        user_id = "Anonymous"
        if participant:
            anon_hash = hashlib.sha256(f"{participant.id}:{session_id}".encode()).hexdigest()[:12]
            user_id = participant.display_name or f"User_{anon_hash}"

        # Q_Number from question order_index
        q_number = f"Q-{(question.order_index + 1):04d}" if question else "Q-0001"
        question_text = question.question_text if question else ""

        item = {
            "q_number": q_number,
            "question": question_text,
            "user": user_id,
            "detailed_results": raw_text,
            "response_language": language,
            "native_language": native_language,
            "response_id": str(meta.id),
            "submitted_at": meta.submitted_at.isoformat() if meta.submitted_at else None,
            "source": meta.source,
        }

        # Optionally include summaries from PostgreSQL (ResponseSummary)
        if include_summaries or include_themes:
            summary_result = await db.execute(
                select(ResponseSummary).where(
                    ResponseSummary.response_meta_id == meta.id,
                )
            )
            summary_row = summary_result.scalar_one_or_none()

        if include_summaries:
            if summary_row:
                item["summary_333"] = summary_row.summary_333 or ""
                item["summary_111"] = summary_row.summary_111 or ""
                item["summary_33"] = summary_row.summary_33 or ""
            else:
                item["summary_333"] = ""
                item["summary_111"] = ""
                item["summary_33"] = ""

        # Optionally include theme assignments from PostgreSQL (ResponseSummary)
        if include_themes:
            if summary_row:
                item["theme01"] = summary_row.theme01 or ""
                item["theme01_confidence"] = summary_row.theme01_confidence or 0
                item["theme2_9"] = summary_row.theme2_9 or ""
                item["theme2_9_confidence"] = summary_row.theme2_9_confidence or 0
                item["theme2_6"] = summary_row.theme2_6 or ""
                item["theme2_6_confidence"] = summary_row.theme2_6_confidence or 0
                item["theme2_3"] = summary_row.theme2_3 or ""
                item["theme2_3_confidence"] = summary_row.theme2_3_confidence or 0
            else:
                for field in ("theme01", "theme2_9", "theme2_6", "theme2_3"):
                    item[field] = ""
                    item[f"{field}_confidence"] = 0

        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def get_single_response(
    db: AsyncSession,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
) -> dict | None:
    """Get a single collected response with all available data."""
    try:
        result = await db.execute(
            select(ResponseMeta, Question, Participant)
            .outerjoin(Question, Question.id == ResponseMeta.question_id)
            .outerjoin(Participant, Participant.id == ResponseMeta.participant_id)
            .where(
                ResponseMeta.id == response_id,
                ResponseMeta.session_id == session_id,
            )
        )
        row = result.one_or_none()
    except Exception as e:
        logger.error("cube4.single.query_error", response_id=str(response_id), error=str(e))
        return None
    if row is None:
        return None

    meta, question, participant = row

    # Raw text from PostgreSQL (ResponseMeta.raw_text)
    raw_text = meta.raw_text or ""
    language = "English"

    # Summaries from PostgreSQL (ResponseSummary)
    summary_result = await db.execute(
        select(ResponseSummary).where(
            ResponseSummary.response_meta_id == meta.id,
        )
    )
    summary_row = summary_result.scalar_one_or_none()

    user_id = "Anonymous"
    if participant:
        anon_hash = hashlib.sha256(f"{participant.id}:{session_id}".encode()).hexdigest()[:12]
        user_id = participant.display_name or f"User_{anon_hash}"

    q_number = f"Q-{(question.order_index + 1):04d}" if question else "Q-0001"

    item = {
        "q_number": q_number,
        "question": question.question_text if question else "",
        "user": user_id,
        "detailed_results": raw_text,
        "response_language": language,
        "native_language": participant.language_code if participant else "en",
        "response_id": str(meta.id),
        "submitted_at": meta.submitted_at.isoformat() if meta.submitted_at else None,
        "source": meta.source,
        "summary_333": summary_row.summary_333 or "" if summary_row else "",
        "summary_111": summary_row.summary_111 or "" if summary_row else "",
        "summary_33": summary_row.summary_33 or "" if summary_row else "",
        "theme01": summary_row.theme01 or "" if summary_row else "",
        "theme01_confidence": summary_row.theme01_confidence or 0 if summary_row else 0,
        "theme2_9": summary_row.theme2_9 or "" if summary_row else "",
        "theme2_9_confidence": summary_row.theme2_9_confidence or 0 if summary_row else 0,
        "theme2_6": summary_row.theme2_6 or "" if summary_row else "",
        "theme2_6_confidence": summary_row.theme2_6_confidence or 0 if summary_row else 0,
        "theme2_3": summary_row.theme2_3 or "" if summary_row else "",
        "theme2_3_confidence": summary_row.theme2_3_confidence or 0 if summary_row else 0,
    }

    return item


# ---------------------------------------------------------------------------
# 2. Response Count / Stats
# ---------------------------------------------------------------------------


async def get_response_count(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Return response counts by source type (text/voice) and total.

    Optimized: single query with conditional counting (3→1 DB round-trip).
    """
    from sqlalchemy import case

    result = await db.execute(
        select(
            func.count(ResponseMeta.id).label("total"),
            func.sum(case((ResponseMeta.source == "text", 1), else_=0)).label("text_count"),
            func.sum(case((ResponseMeta.source == "voice", 1), else_=0)).label("voice_count"),
        ).where(ResponseMeta.session_id == session_id)
    )
    row = result.one_or_none()

    return {
        "session_id": str(session_id),
        "total": (row.total or 0) if row else 0,
        "text_count": int(row.text_count or 0) if row else 0,
        "voice_count": int(row.voice_count or 0) if row else 0,
    }


async def get_response_languages(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> list[dict]:
    """Return breakdown of response languages for a session."""
    result = await db.execute(
        select(
            TextResponse.language_code,
            func.count(TextResponse.id).label("count"),
        )
        .join(ResponseMeta, ResponseMeta.id == TextResponse.response_meta_id)
        .where(ResponseMeta.session_id == session_id)
        .group_by(TextResponse.language_code)
    )
    rows = result.all()
    return [
        {"language_code": row.language_code, "count": row.count}
        for row in rows
    ]


# ---------------------------------------------------------------------------
# 3. Presence Tracking (Redis)
# ---------------------------------------------------------------------------


async def get_session_presence(
    redis: Redis,
    session_id: uuid.UUID,
) -> dict:
    """Return live presence data for a session from Redis."""
    key = f"session:{session_id}:presence"
    data = await redis.hgetall(key)
    participants = [
        {"participant_id": pid, "joined_at": ts}
        for pid, ts in data.items()
    ]
    return {
        "session_id": str(session_id),
        "active_count": len(participants),
        "participants": participants,
    }


async def update_presence(
    redis: Redis,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
) -> None:
    """Update participant presence timestamp in Redis."""
    key = f"session:{session_id}:presence"
    await redis.hset(key, str(participant_id), datetime.now(timezone.utc).isoformat())
    await redis.expire(key, 3600)


# ---------------------------------------------------------------------------
# 4. Summary Availability Check
# ---------------------------------------------------------------------------


async def get_summary_status(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Check how many responses have summaries generated."""
    total_result = await db.execute(
        select(func.count(ResponseSummary.id)).where(
            ResponseSummary.session_id == session_id,
        )
    )
    total = total_result.scalar() or 0

    with_33_result = await db.execute(
        select(func.count(ResponseSummary.id)).where(
            ResponseSummary.session_id == session_id,
            ResponseSummary.summary_33 != None,  # noqa: E711
            ResponseSummary.summary_33 != "",
        )
    )
    with_33 = with_33_result.scalar() or 0

    with_themes_result = await db.execute(
        select(func.count(ResponseSummary.id)).where(
            ResponseSummary.session_id == session_id,
            ResponseSummary.theme01 != None,  # noqa: E711
            ResponseSummary.theme01 != "",
        )
    )
    with_themes = with_themes_result.scalar() or 0

    return {
        "session_id": str(session_id),
        "total_summaries": total,
        "with_33_word_summary": with_33,
        "with_theme_assignment": with_themes,
    }


# ---------------------------------------------------------------------------
# 5. Desired Outcomes (CRS-10 — Methods 2 & 3)
# ---------------------------------------------------------------------------


async def create_desired_outcome(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    description: str,
    time_estimate_minutes: int = 0,
    created_by: uuid.UUID | None = None,
) -> "DesiredOutcome":
    """CRS-10.01: Create a desired outcome for a session.

    Called by moderator or designated participant to define what the group
    aims to achieve. Each session can have one active desired outcome.
    """
    from app.models.desired_outcome import DesiredOutcome

    outcome = DesiredOutcome(
        session_id=session_id,
        description=description,
        time_estimate_minutes=time_estimate_minutes,
        created_by=created_by,
        confirmed_by=[],
        all_confirmed=False,
        outcome_status="pending",
    )
    db.add(outcome)
    await db.commit()
    await db.refresh(outcome)

    logger.info(
        "cube4.desired_outcome.created",
        session_id=str(session_id),
        outcome_id=str(outcome.id),
        time_estimate=time_estimate_minutes,
    )
    return outcome


async def record_confirmation(
    db: AsyncSession,
    session_id: uuid.UUID,
    outcome_id: uuid.UUID,
    participant_id: uuid.UUID,
) -> dict:
    """CRS-10.01: Record a participant's confirmation of the desired outcome.

    Appends participant_id to confirmed_by JSONB array idempotently.
    Returns updated confirmation status.
    """
    from app.models.desired_outcome import DesiredOutcome

    result = await db.execute(
        select(DesiredOutcome).where(
            DesiredOutcome.id == outcome_id,
            DesiredOutcome.session_id == session_id,
        )
    )
    outcome = result.scalar_one_or_none()
    if outcome is None:
        from app.core.exceptions import ResponseNotFoundError
        raise ResponseNotFoundError(str(outcome_id))

    pid_str = str(participant_id)
    confirmed = list(outcome.confirmed_by or [])
    if pid_str not in confirmed:
        confirmed.append(pid_str)
        outcome.confirmed_by = confirmed

    await db.commit()
    await db.refresh(outcome)

    logger.info(
        "cube4.desired_outcome.confirmed",
        outcome_id=str(outcome_id),
        participant_id=pid_str,
        total_confirmed=len(confirmed),
    )
    return {
        "outcome_id": str(outcome.id),
        "confirmed_by": outcome.confirmed_by,
        "total_confirmed": len(outcome.confirmed_by),
        "all_confirmed": outcome.all_confirmed,
    }


async def check_all_confirmed(
    db: AsyncSession,
    session_id: uuid.UUID,
    outcome_id: uuid.UUID,
    required_count: int,
) -> bool:
    """CRS-10.02: Check if all required participants confirmed.

    When confirmed_by length >= required_count, sets all_confirmed=True
    and returns True (gate signal for Cube 5 timer start).
    """
    from app.models.desired_outcome import DesiredOutcome

    result = await db.execute(
        select(DesiredOutcome).where(
            DesiredOutcome.id == outcome_id,
            DesiredOutcome.session_id == session_id,
        )
    )
    outcome = result.scalar_one_or_none()
    if outcome is None:
        return False

    confirmed = outcome.confirmed_by or []
    if len(confirmed) >= required_count and not outcome.all_confirmed:
        outcome.all_confirmed = True
        await db.commit()
        logger.info(
            "cube4.desired_outcome.all_confirmed",
            outcome_id=str(outcome_id),
            confirmed_count=len(confirmed),
            required=required_count,
        )
    return outcome.all_confirmed


async def log_post_task_results(
    db: AsyncSession,
    session_id: uuid.UUID,
    outcome_id: uuid.UUID,
    *,
    results_log: str,
    outcome_status: str = "achieved",
    assessed_by: uuid.UUID | None = None,
) -> "DesiredOutcome":
    """CRS-10.03: Store post-task results and assessment.

    Called after the group completes their task. Records the outcome,
    status, and who assessed it.
    """
    from datetime import datetime, timezone
    from app.models.desired_outcome import DesiredOutcome

    result = await db.execute(
        select(DesiredOutcome).where(
            DesiredOutcome.id == outcome_id,
            DesiredOutcome.session_id == session_id,
        )
    )
    outcome = result.scalar_one_or_none()
    if outcome is None:
        from app.core.exceptions import ResponseNotFoundError
        raise ResponseNotFoundError(str(outcome_id))

    valid_statuses = {"pending", "achieved", "partially_achieved", "not_achieved"}
    if outcome_status not in valid_statuses:
        from app.core.exceptions import ResponseValidationError
        raise ResponseValidationError(
            f"Invalid outcome_status '{outcome_status}'. Must be one of: {', '.join(sorted(valid_statuses))}"
        )

    outcome.results_log = results_log
    outcome.outcome_status = outcome_status
    outcome.completed_at = datetime.now(timezone.utc)

    assessed = list(outcome.assessed_by or [])
    if assessed_by and str(assessed_by) not in assessed:
        assessed.append(str(assessed_by))
    outcome.assessed_by = assessed

    await db.commit()
    await db.refresh(outcome)

    logger.info(
        "cube4.desired_outcome.results_logged",
        outcome_id=str(outcome_id),
        status=outcome_status,
        assessed_count=len(assessed),
    )
    return outcome
