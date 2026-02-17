"""Cube 3 — Metrics (System / User / Outcome).

Three metric categories for Cube 10 simulation comparison:
  System  — STT latency, transcription throughput, provider performance
  User    — voice submission patterns, language distribution, confidence scores
  Outcome — transcription quality, token distribution, provider reliability

All metrics computed from Postgres tables (ResponseMeta, VoiceResponse,
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
from app.models.voice_response import VoiceResponse


async def get_system_metrics(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """System metrics: STT latency and throughput indicators.

    Metrics:
      - avg_transcription_latency_s: Avg time for voice_responding time entries
      - max_transcription_latency_s: Peak transcription processing time
      - total_voice_responses: Total voice response count
      - voice_responses_per_minute: Throughput (RPM)
      - avg_audio_duration_sec: Average audio recording length
      - total_audio_duration_sec: Total audio processed
    """
    # Transcription latency from time_entries (cube3, action=voice_responding)
    latency_result = await db.execute(
        select(
            func.avg(TimeEntry.duration_seconds).label("avg_latency"),
            func.max(TimeEntry.duration_seconds).label("max_latency"),
            func.count(TimeEntry.id).label("count"),
        ).where(
            TimeEntry.session_id == session_id,
            TimeEntry.cube_id == "cube3",
            TimeEntry.action_type == "voice_responding",
            TimeEntry.stopped_at.isnot(None),
        )
    )
    latency_row = latency_result.one()

    # Total voice responses
    count_result = await db.execute(
        select(func.count(ResponseMeta.id)).where(
            ResponseMeta.session_id == session_id,
            ResponseMeta.source == "voice",
        )
    )
    total = count_result.scalar() or 0

    # Throughput (RPM)
    span_result = await db.execute(
        select(
            func.min(ResponseMeta.submitted_at).label("first"),
            func.max(ResponseMeta.submitted_at).label("last"),
        ).where(
            ResponseMeta.session_id == session_id,
            ResponseMeta.source == "voice",
        )
    )
    span_row = span_result.one()
    rpm = 0.0
    if span_row.first and span_row.last and span_row.first != span_row.last:
        span_minutes = (span_row.last - span_row.first).total_seconds() / 60.0
        rpm = total / span_minutes if span_minutes > 0 else 0.0

    # Audio duration stats
    audio_result = await db.execute(
        select(
            func.avg(VoiceResponse.audio_duration_sec).label("avg_dur"),
            func.sum(VoiceResponse.audio_duration_sec).label("total_dur"),
        ).where(
            VoiceResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(
                    ResponseMeta.session_id == session_id,
                    ResponseMeta.source == "voice",
                )
            )
        )
    )
    audio_row = audio_result.one()

    return {
        "avg_transcription_latency_s": round(float(latency_row.avg_latency or 0), 4),
        "max_transcription_latency_s": round(float(latency_row.max_latency or 0), 4),
        "total_voice_responses": total,
        "voice_responses_per_minute": round(rpm, 2),
        "avg_audio_duration_sec": round(float(audio_row.avg_dur or 0), 2),
        "total_audio_duration_sec": round(float(audio_row.total_dur or 0), 2),
    }


async def get_user_metrics(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """User metrics: voice submission patterns and STT quality.

    Metrics:
      - language_distribution: Count per language code
      - provider_distribution: Count per STT provider used
      - avg_transcript_confidence: Average STT confidence score
      - low_confidence_rate_pct: % of transcripts below 0.65 confidence
      - avg_transcript_length: Average character count of transcripts
      - unique_voice_participants: Distinct participants who used voice
    """
    # Language distribution
    lang_result = await db.execute(
        select(
            VoiceResponse.language_code,
            func.count(VoiceResponse.id).label("count"),
        )
        .where(
            VoiceResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(
                    ResponseMeta.session_id == session_id,
                    ResponseMeta.source == "voice",
                )
            )
        )
        .group_by(VoiceResponse.language_code)
    )
    language_distribution = {row.language_code: row.count for row in lang_result.all()}

    # Provider distribution
    provider_result = await db.execute(
        select(
            VoiceResponse.stt_provider,
            func.count(VoiceResponse.id).label("count"),
        )
        .where(
            VoiceResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(
                    ResponseMeta.session_id == session_id,
                    ResponseMeta.source == "voice",
                )
            )
        )
        .group_by(VoiceResponse.stt_provider)
    )
    provider_distribution = {row.stt_provider: row.count for row in provider_result.all()}

    # Confidence stats
    conf_result = await db.execute(
        select(
            func.avg(VoiceResponse.transcript_confidence).label("avg_conf"),
            func.count(VoiceResponse.id).label("total"),
            func.sum(
                case((VoiceResponse.transcript_confidence < 0.65, 1), else_=0)
            ).label("low_conf_count"),
        ).where(
            VoiceResponse.response_meta_id.in_(
                select(ResponseMeta.id).where(
                    ResponseMeta.session_id == session_id,
                    ResponseMeta.source == "voice",
                )
            )
        )
    )
    conf_row = conf_result.one()
    total = conf_row.total or 0
    low_rate = (conf_row.low_conf_count or 0) / total * 100 if total > 0 else 0.0

    # Transcript length + unique participants
    participant_result = await db.execute(
        select(
            func.avg(ResponseMeta.char_count).label("avg_len"),
            func.count(func.distinct(ResponseMeta.participant_id)).label("unique"),
        ).where(
            ResponseMeta.session_id == session_id,
            ResponseMeta.source == "voice",
        )
    )
    part_row = participant_result.one()

    return {
        "language_distribution": language_distribution,
        "provider_distribution": provider_distribution,
        "avg_transcript_confidence": round(float(conf_row.avg_conf or 0), 4),
        "low_confidence_rate_pct": round(low_rate, 2),
        "avg_transcript_length": round(float(part_row.avg_len or 0), 1),
        "unique_voice_participants": part_row.unique or 0,
    }


async def get_outcome_metrics(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Outcome / Business metrics: quality and token indicators.

    Metrics:
      - clean_transcript_ratio_pct: % with no PII and no profanity
      - pii_detection_rate_pct: % of voice transcripts with PII detected
      - total_si_tokens_distributed: Total ♡ from voice submissions
      - total_ai_tokens_distributed: Total ◬ from voice submissions
      - avg_si_per_voice_response: Average ♡ per voice submission
      - stt_provider_success_rates: Success rate per provider
    """
    # Clean vs flagged ratio (from TextResponse linked to voice ResponseMeta)
    voice_meta_ids = select(ResponseMeta.id).where(
        ResponseMeta.session_id == session_id,
        ResponseMeta.source == "voice",
    )

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
            func.sum(case((TextResponse.pii_detected.is_(True), 1), else_=0)).label("pii_count"),
        ).where(TextResponse.response_meta_id.in_(voice_meta_ids))
    )
    q_row = quality_result.one()
    total = q_row.total or 0
    clean_ratio = (q_row.clean_count or 0) / total * 100 if total > 0 else 0.0
    pii_rate = (q_row.pii_count or 0) / total * 100 if total > 0 else 0.0

    # Token distribution from Cube 3 time entries
    token_result = await db.execute(
        select(
            func.sum(TimeEntry.si_tokens_earned).label("total_si"),
            func.sum(TimeEntry.ai_tokens_earned).label("total_ai"),
            func.count(TimeEntry.id).label("entry_count"),
        ).where(
            TimeEntry.session_id == session_id,
            TimeEntry.cube_id == "cube3",
            TimeEntry.action_type == "voice_responding",
        )
    )
    t_row = token_result.one()
    total_si = float(t_row.total_si or 0)
    total_ai = float(t_row.total_ai or 0)
    entry_count = t_row.entry_count or 0
    avg_si = total_si / entry_count if entry_count > 0 else 0.0

    return {
        "clean_transcript_ratio_pct": round(clean_ratio, 2),
        "pii_detection_rate_pct": round(pii_rate, 2),
        "total_si_tokens_distributed": round(total_si, 4),
        "total_ai_tokens_distributed": round(total_ai, 4),
        "avg_si_per_voice_response": round(avg_si, 4),
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
        "cube": "cube3_voice",
        "session_id": str(session_id),
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "system": system,
        "user": user,
        "outcome": outcome,
    }
