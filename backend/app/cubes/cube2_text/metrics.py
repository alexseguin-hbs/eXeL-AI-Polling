"""Cube 2 — Metrics (System / User / Outcome).

Three metric categories for Cube 10 simulation comparison:
  System  — latency, throughput, pipeline performance
  User    — submission patterns, language distribution, detection rates
  Outcome — quality indicators, token distribution, completion rates

All metrics are computed from existing Postgres tables (ResponseMeta,
TextResponse, TimeEntry) so Cube 10 can compare proposed changes
against production baselines.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.response_meta import ResponseMeta
from app.models.text_response import TextResponse
from app.models.time_tracking import TimeEntry


async def get_system_metrics(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """System metrics: latency and throughput indicators.

    Metrics:
      - avg_submission_latency_s: Avg time between time entry start→stop for responding
      - max_submission_latency_s: Max submission processing time
      - total_responses: Total response count for the session
      - responses_per_minute: Throughput (responses / session active minutes)
      - ner_pipeline_invocations: Count of responses with PII detection attempted
    """
    # Submission latency from time_entries (cube2, action=responding)
    latency_result = await db.execute(
        select(
            func.avg(TimeEntry.duration_seconds).label("avg_latency"),
            func.max(TimeEntry.duration_seconds).label("max_latency"),
            func.count(TimeEntry.id).label("count"),
        ).where(
            TimeEntry.session_id == session_id,
            TimeEntry.cube_id == "cube2",
            TimeEntry.action_type == "responding",
            TimeEntry.stopped_at.isnot(None),
        )
    )
    latency_row = latency_result.one()

    # Total responses
    count_result = await db.execute(
        select(func.count(ResponseMeta.id)).where(
            ResponseMeta.session_id == session_id,
        )
    )
    total_responses = count_result.scalar() or 0

    # Throughput: responses per minute (time span from first to last response)
    span_result = await db.execute(
        select(
            func.min(ResponseMeta.submitted_at).label("first"),
            func.max(ResponseMeta.submitted_at).label("last"),
        ).where(ResponseMeta.session_id == session_id)
    )
    span_row = span_result.one()
    rpm = 0.0
    if span_row.first and span_row.last and span_row.first != span_row.last:
        span_minutes = (span_row.last - span_row.first).total_seconds() / 60.0
        rpm = total_responses / span_minutes if span_minutes > 0 else 0.0

    # NER pipeline invocations (responses where PII detection ran)
    ner_count_result = await db.execute(
        select(func.count(TextResponse.id)).where(
            TextResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(ResponseMeta.session_id == session_id)
            )
        )
    )
    ner_invocations = ner_count_result.scalar() or 0

    return {
        "avg_submission_latency_s": round(float(latency_row.avg_latency or 0), 4),
        "max_submission_latency_s": round(float(latency_row.max_latency or 0), 4),
        "total_responses": total_responses,
        "responses_per_minute": round(rpm, 2),
        "ner_pipeline_invocations": ner_invocations,
    }


async def get_user_metrics(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """User metrics: submission patterns and detection rates.

    Metrics:
      - language_distribution: Count per language code
      - avg_response_length: Average char count
      - max_response_length: Max char count
      - pii_detection_rate: % of responses with PII detected
      - profanity_detection_rate: % of responses with profanity detected
      - unique_participants: Distinct participant count
      - responses_per_participant: Avg responses per participant
    """
    # Language distribution
    lang_result = await db.execute(
        select(
            TextResponse.language_code,
            func.count(TextResponse.id).label("count"),
        )
        .where(
            TextResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(ResponseMeta.session_id == session_id)
            )
        )
        .group_by(TextResponse.language_code)
    )
    language_distribution = {row.language_code: row.count for row in lang_result.all()}

    # Response length stats
    length_result = await db.execute(
        select(
            func.avg(ResponseMeta.char_count).label("avg_len"),
            func.max(ResponseMeta.char_count).label("max_len"),
        ).where(ResponseMeta.session_id == session_id)
    )
    length_row = length_result.one()

    # PII and profanity detection rates
    detection_result = await db.execute(
        select(
            func.count(TextResponse.id).label("total"),
            func.sum(case((TextResponse.pii_detected.is_(True), 1), else_=0)).label("pii_count"),
            func.sum(case((TextResponse.profanity_detected.is_(True), 1), else_=0)).label("prof_count"),
        ).where(
            TextResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(ResponseMeta.session_id == session_id)
            )
        )
    )
    det_row = detection_result.one()
    total = det_row.total or 0
    pii_rate = (det_row.pii_count or 0) / total * 100 if total > 0 else 0.0
    prof_rate = (det_row.prof_count or 0) / total * 100 if total > 0 else 0.0

    # Unique participants and responses per participant
    participant_result = await db.execute(
        select(
            func.count(func.distinct(ResponseMeta.participant_id)).label("unique"),
            func.count(ResponseMeta.id).label("total"),
        ).where(ResponseMeta.session_id == session_id)
    )
    part_row = participant_result.one()
    unique_participants = part_row.unique or 0
    rpp = (part_row.total or 0) / unique_participants if unique_participants > 0 else 0.0

    return {
        "language_distribution": language_distribution,
        "avg_response_length": round(float(length_row.avg_len or 0), 1),
        "max_response_length": int(length_row.max_len or 0),
        "pii_detection_rate_pct": round(pii_rate, 2),
        "profanity_detection_rate_pct": round(prof_rate, 2),
        "unique_participants": unique_participants,
        "responses_per_participant": round(rpp, 2),
    }


async def get_outcome_metrics(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Outcome / Business metrics: quality and token indicators.

    Metrics:
      - clean_response_ratio: % of responses with no PII and no profanity
      - flagged_response_count: Responses manually flagged
      - total_si_tokens_distributed: Total ♡ tokens from Cube 2 submissions
      - total_ai_tokens_distributed: Total ◬ tokens from Cube 2 submissions
      - avg_si_per_response: Average ♡ per submission
      - avg_ai_per_response: Average ◬ per submission
    """
    # Clean vs flagged ratio
    quality_result = await db.execute(
        select(
            func.count(TextResponse.id).label("total"),
            func.sum(
                case(
                    (
                        TextResponse.pii_detected.is_(False) & TextResponse.profanity_detected.is_(False),
                        1,
                    ),
                    else_=0,
                )
            ).label("clean_count"),
        ).where(
            TextResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(ResponseMeta.session_id == session_id)
            )
        )
    )
    q_row = quality_result.one()
    total = q_row.total or 0
    clean_ratio = (q_row.clean_count or 0) / total * 100 if total > 0 else 0.0

    # Flagged count
    flagged_result = await db.execute(
        select(func.count(ResponseMeta.id)).where(
            ResponseMeta.session_id == session_id,
            ResponseMeta.is_flagged.is_(True),
        )
    )
    flagged_count = flagged_result.scalar() or 0

    # Token distribution from Cube 2 time entries
    token_result = await db.execute(
        select(
            func.sum(TimeEntry.si_tokens_earned).label("total_si"),
            func.sum(TimeEntry.ai_tokens_earned).label("total_ai"),
            func.count(TimeEntry.id).label("entry_count"),
        ).where(
            TimeEntry.session_id == session_id,
            TimeEntry.cube_id == "cube2",
            TimeEntry.action_type == "responding",
        )
    )
    t_row = token_result.one()
    total_si = float(t_row.total_si or 0)
    total_ai = float(t_row.total_ai or 0)
    entry_count = t_row.entry_count or 0
    avg_si = total_si / entry_count if entry_count > 0 else 0.0
    avg_ai = total_ai / entry_count if entry_count > 0 else 0.0

    return {
        "clean_response_ratio_pct": round(clean_ratio, 2),
        "flagged_response_count": flagged_count,
        "total_si_tokens_distributed": round(total_si, 4),
        "total_ai_tokens_distributed": round(total_ai, 4),
        "avg_si_per_response": round(avg_si, 4),
        "avg_ai_per_response": round(avg_ai, 4),
    }


async def get_all_metrics(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Aggregate all three metric categories for Cube 10 simulation comparison."""
    system = await get_system_metrics(db, session_id)
    user = await get_user_metrics(db, session_id)
    outcome = await get_outcome_metrics(db, session_id)

    return {
        "cube": "cube2_text",
        "session_id": str(session_id),
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "system": system,
        "user": user,
        "outcome": outcome,
    }
