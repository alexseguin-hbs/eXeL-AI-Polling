"""Cube 2 — Text Submission Service.

Validates, processes (PII + profanity detection), stores, and publishes
text responses. Integrates with Cube 5 for token tracking and Redis
pub/sub for Cube 6 downstream consumption.

PII Pipeline:
  1. Transformer NER (Davlan/xlm-roberta-large-ner-hrl) — multilingual
     PER/LOC/ORG entity detection across 33 languages
  2. Regex fallback — catches structured PII (email, phone, SSN, CC, IP)
     that NER may miss
  3. Scrubbing — replaces detected spans with [TYPE_REDACTED] placeholders

Profanity Pipeline (non-blocking):
  1. Query profanity_filters table for active patterns by language
  2. Regex match against submitted text
  3. Store raw + clean versions (raw download = paid feature)
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import math
import re
import uuid
from datetime import datetime, timezone
from typing import Any

import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ParticipantNotFoundError,
    QuestionNotFoundError,
    ResponseValidationError,
    SessionNotFoundError,
    SessionNotPollingError,
)
from app.models.participant import Participant
from app.models.profanity_filter import ProfanityFilter
from app.models.question import Question
from app.models.response_meta import ResponseMeta
from app.models.session import Session
from app.models.text_response import TextResponse

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# NER Pipeline (lazy-loaded singleton)
# ---------------------------------------------------------------------------

_ner_pipeline: Any = None
_ner_lock = asyncio.Lock()


async def _get_ner_pipeline() -> Any:
    """Lazy-load the multilingual NER transformer pipeline.

    Uses Davlan/xlm-roberta-large-ner-hrl for PER/LOC/ORG detection
    across 33+ languages. Loaded once, cached for process lifetime.
    Runs in a thread to avoid blocking the event loop.
    """
    global _ner_pipeline
    if _ner_pipeline is not None:
        return _ner_pipeline

    async with _ner_lock:
        # Double-check after acquiring lock
        if _ner_pipeline is not None:
            return _ner_pipeline

        def _load():
            from transformers import pipeline
            return pipeline(
                "ner",
                model="Davlan/xlm-roberta-large-ner-hrl",
                aggregation_strategy="simple",
            )

        logger.info("cube2.ner_pipeline.loading", model="Davlan/xlm-roberta-large-ner-hrl")
        _ner_pipeline = await asyncio.to_thread(_load)
        logger.info("cube2.ner_pipeline.loaded")
        return _ner_pipeline


# ---------------------------------------------------------------------------
# Regex PII Patterns (structured data NER may miss)
# ---------------------------------------------------------------------------

_PII_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("EMAIL", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")),
    ("PHONE", re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b")),
    ("SSN", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("CREDIT_CARD", re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")),
    ("IP_ADDRESS", re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")),
]


# ---------------------------------------------------------------------------
# 1. Validation Functions
# ---------------------------------------------------------------------------


async def validate_session_for_submission(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> Session:
    """Validate session exists and is in 'polling' state."""
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise SessionNotFoundError(str(session_id))
    if session.status != "polling":
        raise SessionNotPollingError(str(session_id), session.status)
    return session


async def validate_question(
    db: AsyncSession,
    question_id: uuid.UUID,
    session_id: uuid.UUID,
) -> Question:
    """Validate question exists and belongs to the session."""
    result = await db.execute(
        select(Question).where(
            Question.id == question_id,
            Question.session_id == session_id,
        )
    )
    question = result.scalar_one_or_none()
    if question is None:
        raise QuestionNotFoundError(str(question_id))
    return question


async def validate_participant(
    db: AsyncSession,
    participant_id: uuid.UUID,
    session_id: uuid.UUID,
) -> Participant:
    """Validate participant exists, is active, and belongs to the session."""
    result = await db.execute(
        select(Participant).where(
            Participant.id == participant_id,
            Participant.session_id == session_id,
            Participant.is_active.is_(True),
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        raise ParticipantNotFoundError(str(participant_id))
    return participant


def validate_text_input(raw_text: str, max_length: int) -> str:
    """Validate text is non-empty and within Unicode-aware length limit.

    Returns stripped text on success, raises ResponseValidationError otherwise.
    """
    text = raw_text.strip()
    if not text:
        raise ResponseValidationError("Response text cannot be empty")
    if len(text) > max_length:
        raise ResponseValidationError(
            f"Response exceeds maximum length of {max_length} characters "
            f"(submitted: {len(text)})"
        )
    return text


# ---------------------------------------------------------------------------
# 2. PII Detection & Scrubbing
# ---------------------------------------------------------------------------


async def detect_pii(text: str) -> list[dict]:
    """Detect PII using transformer NER + regex patterns.

    Returns list of detected PII spans:
      [{"type": "PER"|"LOC"|"ORG"|"EMAIL"|..., "start": int, "end": int, "text": str}]
    """
    detections: list[dict] = []

    # --- Transformer NER (multilingual) ---
    try:
        ner = await _get_ner_pipeline()
        ner_results = await asyncio.to_thread(ner, text)
        for entity in ner_results:
            detections.append({
                "type": entity["entity_group"],  # PER, LOC, ORG
                "start": entity["start"],
                "end": entity["end"],
                "text": text[entity["start"]:entity["end"]],
                "score": round(float(entity["score"]), 4),
            })
    except Exception as e:
        logger.warning("cube2.ner_pipeline.error", error=str(e))
        # NER failure is non-fatal; regex still runs

    # --- Regex fallback (structured PII) ---
    for pii_type, pattern in _PII_PATTERNS:
        for match in pattern.finditer(text):
            # Avoid duplicate detections (check overlap with NER results)
            overlap = any(
                d["start"] <= match.start() < d["end"] or
                d["start"] < match.end() <= d["end"]
                for d in detections
            )
            if not overlap:
                detections.append({
                    "type": pii_type,
                    "start": match.start(),
                    "end": match.end(),
                    "text": match.group(),
                })

    # Sort by position for consistent scrubbing
    detections.sort(key=lambda d: d["start"])
    return detections


def _scrub_spans(
    text: str,
    spans: list[dict],
    *,
    start_key: str,
    end_key: str,
    replacement_fn: callable,
) -> str:
    """Replace text spans in reverse order to preserve character positions."""
    if not spans:
        return text
    result = list(text)
    for span in sorted(spans, key=lambda x: x[start_key], reverse=True):
        repl = replacement_fn(span)
        result[span[start_key]:span[end_key]] = list(repl)
    return "".join(result)


def scrub_pii(text: str, detections: list[dict]) -> str:
    """Replace PII spans with [TYPE_REDACTED] placeholders."""
    return _scrub_spans(
        text, detections,
        start_key="start", end_key="end",
        replacement_fn=lambda d: f"[{d['type']}_REDACTED]",
    )


# ---------------------------------------------------------------------------
# 3. Profanity Detection & Scrubbing
# ---------------------------------------------------------------------------


async def detect_profanity(
    db: AsyncSession,
    text: str,
    language_code: str,
) -> list[dict]:
    """Query profanity_filters table and regex-match against text.

    Non-blocking: profanity is flagged but submission goes through.
    Returns list of matched profanity entries with positions.
    """
    result = await db.execute(
        select(ProfanityFilter).where(
            ProfanityFilter.language_code == language_code,
            ProfanityFilter.is_active.is_(True),
        )
    )
    filters = list(result.scalars().all())

    matches: list[dict] = []
    for pf in filters:
        try:
            pattern = re.compile(pf.pattern, re.IGNORECASE)
            for match in pattern.finditer(text):
                matches.append({
                    "word": match.group(),
                    "severity": pf.severity,
                    "position": match.start(),
                    "replacement": pf.replacement,
                    "filter_id": str(pf.id),
                })
        except re.error:
            logger.warning(
                "cube2.profanity_filter.invalid_regex",
                filter_id=str(pf.id),
                pattern=pf.pattern,
            )
    return matches


def scrub_profanity(text: str, matches: list[dict]) -> str:
    """Generate clean_text by replacing profanity with configured replacements."""
    # Convert profanity matches to span format compatible with _scrub_spans
    spans = [
        {**m, "end": m["position"] + len(m["word"])}
        for m in matches
    ]
    return _scrub_spans(
        text, spans,
        start_key="position", end_key="end",
        replacement_fn=lambda m: m.get("replacement", "***"),
    )


# ---------------------------------------------------------------------------
# 3b. Language Detection (sanity check)
# ---------------------------------------------------------------------------

# Unicode script ranges for language plausibility check
_SCRIPT_RANGES: dict[str, list[tuple[int, int]]] = {
    "ar": [(0x0600, 0x06FF), (0x0750, 0x077F), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF)],
    "he": [(0x0590, 0x05FF), (0xFB1D, 0xFB4F)],
    "zh": [(0x4E00, 0x9FFF), (0x3400, 0x4DBF), (0x2E80, 0x2EFF)],
    "ja": [(0x3040, 0x309F), (0x30A0, 0x30FF), (0x4E00, 0x9FFF)],
    "ko": [(0xAC00, 0xD7AF), (0x1100, 0x11FF), (0x3130, 0x318F)],
    "hi": [(0x0900, 0x097F)],
    "bn": [(0x0980, 0x09FF)],
    "pa": [(0x0A00, 0x0A7F)],
    "th": [(0x0E00, 0x0E7F)],
    "ne": [(0x0900, 0x097F)],
    "ru": [(0x0400, 0x04FF)],
    "uk": [(0x0400, 0x04FF)],
    "el": [(0x0370, 0x03FF)],
}


def detect_language(text: str, declared_code: str) -> bool:
    """Sanity-check that text plausibly matches declared language.

    Uses Unicode script detection for non-Latin scripts.
    Latin-script languages (en, fr, es, de, etc.) always pass.
    Returns True if plausible match, False if likely mismatch.
    Non-blocking: mismatch is logged but doesn't reject submission.
    """
    if declared_code not in _SCRIPT_RANGES:
        # Latin-script languages — always plausible
        return True

    ranges = _SCRIPT_RANGES[declared_code]
    script_chars = sum(
        1 for ch in text
        if any(lo <= ord(ch) <= hi for lo, hi in ranges)
    )
    # Require at least 10% of non-space characters to be in the expected script
    non_space = sum(1 for ch in text if not ch.isspace())
    if non_space == 0:
        return True
    ratio = script_chars / non_space
    return ratio >= 0.1


# ---------------------------------------------------------------------------
# 3c. Anonymization (CRS-05)
# ---------------------------------------------------------------------------


def anonymize_response(
    participant_id: uuid.UUID,
    anonymity_mode: str,
) -> tuple[uuid.UUID | None, str | None]:
    """CRS-05: Anonymize participant identity when session is anonymous.

    Returns (effective_participant_id, anon_hash).
    - identified: (participant_id, None)
    - anonymous: (None, SHA-256 hash prefix)
    - pseudonymous: (participant_id, SHA-256 hash prefix)
    """
    if anonymity_mode == "identified":
        return participant_id, None

    anon_hash = hashlib.sha256(str(participant_id).encode()).hexdigest()[:16]

    if anonymity_mode == "anonymous":
        return None, anon_hash
    else:  # pseudonymous
        return participant_id, anon_hash


# ---------------------------------------------------------------------------
# 4. Storage
# ---------------------------------------------------------------------------


async def store_response(
    db: AsyncSession,
    mongo: AsyncIOMotorDatabase,
    *,
    session_id: uuid.UUID,
    question_id: uuid.UUID,
    participant_id: uuid.UUID | None,
    cycle_id: int,
    raw_text: str,
    language_code: str,
    is_anonymous: bool,
    anon_hash: str | None,
    pii_detected: bool,
    pii_types: list[dict] | None,
    pii_scrubbed_text: str | None,
    profanity_detected: bool,
    profanity_words: list[dict] | None,
    clean_text: str,
) -> tuple[ResponseMeta, str]:
    """Store response in MongoDB (raw) + Postgres (ResponseMeta + TextResponse).

    CRS-05: In anonymous mode, participant_id is None and anon_hash is stored.
    Returns (ResponseMeta, response_hash) tuple.
    """
    now = datetime.now(timezone.utc)

    # --- MongoDB: raw text storage ---
    mongo_doc: dict[str, Any] = {
        "session_id": str(session_id),
        "question_id": str(question_id),
        "raw_text": raw_text,
        "language_code": language_code,
        "submitted_at": now,
    }
    # CRS-05: Store participant_id or anon_hash based on anonymity mode
    if participant_id is not None:
        mongo_doc["participant_id"] = str(participant_id)
    if anon_hash is not None:
        mongo_doc["anon_hash"] = anon_hash
    mongo_result = await mongo.responses.insert_one(mongo_doc)
    mongo_ref = str(mongo_result.inserted_id)

    # --- Postgres: ResponseMeta ---
    response_meta = ResponseMeta(
        session_id=session_id,
        question_id=question_id,
        participant_id=participant_id,
        cycle_id=cycle_id,
        source="text",
        mongo_ref=mongo_ref,
        char_count=len(raw_text),
        submitted_at=now,
        is_flagged=False,
    )
    db.add(response_meta)
    await db.flush()  # Get ID before creating TextResponse

    # --- Postgres: TextResponse (1:1 with ResponseMeta) ---
    response_hash = hashlib.sha256(raw_text.encode()).hexdigest()

    text_response = TextResponse(
        response_meta_id=response_meta.id,
        language_code=language_code,
        is_anonymous=is_anonymous,
        pii_detected=pii_detected,
        pii_types=pii_types,
        pii_scrubbed_text=pii_scrubbed_text,
        profanity_detected=profanity_detected,
        profanity_words=profanity_words,
        clean_text=clean_text,
        response_hash=response_hash,
    )
    db.add(text_response)
    await db.commit()
    await db.refresh(response_meta)

    return response_meta, response_hash


# ---------------------------------------------------------------------------
# 5. Redis Pub/Sub
# ---------------------------------------------------------------------------


async def publish_submission_event(
    redis: Redis,
    session_id: uuid.UUID,
    response_meta_id: uuid.UUID,
    language_code: str,
    char_count: int,
) -> None:
    """Publish response submission event to Redis channel.

    Channel: session:{session_id}:responses
    Consumed by Cube 6 (AI theming) for live feed + theme pipeline.
    """
    channel = f"session:{session_id}:responses"
    payload = json.dumps({
        "event": "response_submitted",
        "response_id": str(response_meta_id),
        "session_id": str(session_id),
        "language_code": language_code,
        "char_count": char_count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    try:
        await redis.publish(channel, payload)
        logger.debug("cube2.redis.published", channel=channel, response_id=str(response_meta_id))
    except Exception as e:
        # Redis publish failure is non-fatal
        logger.warning("cube2.redis.publish_error", channel=channel, error=str(e))


# ---------------------------------------------------------------------------
# 6. Main Orchestrator
# ---------------------------------------------------------------------------


async def submit_text_response(
    db: AsyncSession,
    mongo: AsyncIOMotorDatabase,
    redis: Redis,
    *,
    session_id: uuid.UUID,
    question_id: uuid.UUID,
    participant_id: uuid.UUID,
    raw_text: str,
    language_code: str = "en",
) -> dict:
    """Main orchestrator: validate, process, store, and return response with tokens.

    Flow:
      1. Validate session (polling?), question, participant
      2. Validate text (length, Unicode)
      3. Start time tracking (Cube 5)
      4. Detect + scrub PII (NER + regex)
      5. Detect + scrub profanity (DB patterns)
      6. Store: MongoDB (raw) + Postgres (ResponseMeta + TextResponse)
      7. Stop time tracking, calculate tokens
      8. Publish Redis event for Cube 6
      9. Return response with immediate token display
    """
    # --- 1. Validate session, question, participant ---
    session = await validate_session_for_submission(db, session_id)
    await validate_question(db, question_id, session_id)
    participant = await validate_participant(db, participant_id, session_id)

    # --- 2. Validate text input ---
    text = validate_text_input(raw_text, session.max_response_length)

    # --- 2b. Language sanity check (non-blocking) ---
    if not detect_language(text, language_code):
        logger.warning(
            "cube2.language_mismatch",
            declared=language_code,
            session_id=str(session_id),
            participant_id=str(participant_id),
            text_preview=text[:50],
        )

    # --- 3. Start time tracking (Cube 5) ---
    from app.cubes.cube5_gateway.service import start_time_tracking, stop_time_tracking

    time_entry = await start_time_tracking(
        db,
        session_id=session_id,
        participant_id=participant_id,
        action_type="responding",
        reference_id=str(question_id),
        cube_id="cube2",
    )

    # --- 4. PII detection + scrubbing ---
    pii_detections = await detect_pii(text)
    pii_detected = len(pii_detections) > 0
    pii_scrubbed = scrub_pii(text, pii_detections) if pii_detected else text
    # Strip actual text from PII metadata before storing
    pii_types_safe = [
        {"type": d["type"], "start": d["start"], "end": d["end"]}
        for d in pii_detections
    ] if pii_detected else None

    # --- 5. Profanity detection + scrubbing ---
    profanity_matches = await detect_profanity(db, pii_scrubbed, language_code)
    profanity_detected = len(profanity_matches) > 0
    clean_text = scrub_profanity(pii_scrubbed, profanity_matches) if profanity_detected else pii_scrubbed
    profanity_words_safe = [
        {"word": m["word"], "severity": m["severity"], "position": m["position"]}
        for m in profanity_matches
    ] if profanity_detected else None

    # --- 6. Anonymize + Store (CRS-05) ---
    is_anonymous = session.anonymity_mode == "anonymous"
    effective_pid, anon_hash = anonymize_response(participant_id, session.anonymity_mode)
    response_meta, response_hash = await store_response(
        db, mongo,
        session_id=session_id,
        question_id=question_id,
        participant_id=effective_pid,
        cycle_id=session.current_cycle,
        raw_text=text,
        language_code=language_code,
        is_anonymous=is_anonymous,
        anon_hash=anon_hash,
        pii_detected=pii_detected,
        pii_types=pii_types_safe,
        pii_scrubbed_text=pii_scrubbed if pii_detected else None,
        profanity_detected=profanity_detected,
        profanity_words=profanity_words_safe,
        clean_text=clean_text,
    )

    # --- 7. Stop time tracking, calculate tokens ---
    time_entry = await stop_time_tracking(
        db,
        time_entry_id=time_entry.id,
    )
    heart_earned = time_entry.heart_tokens_earned
    unity_earned = time_entry.unity_tokens_earned

    # --- 8. Publish Redis event ---
    await publish_submission_event(
        redis, session_id, response_meta.id, language_code, len(text),
    )

    # --- 9. Return composite result ---
    logger.info(
        "cube2.response.submitted",
        session_id=str(session_id),
        response_id=str(response_meta.id),
        language=language_code,
        char_count=len(text),
        pii_detected=pii_detected,
        profanity_detected=profanity_detected,
        heart_tokens=heart_earned,
        unity_tokens=unity_earned,
    )

    return {
        "id": response_meta.id,
        "session_id": session_id,
        "question_id": question_id,
        "participant_id": effective_pid,
        "source": "text",
        "char_count": len(text),
        "language_code": language_code,
        "submitted_at": response_meta.submitted_at,
        "is_flagged": False,
        "pii_detected": pii_detected,
        "profanity_detected": profanity_detected,
        "clean_text": clean_text,
        "response_hash": response_hash,
        "heart_tokens_earned": heart_earned,
        "unity_tokens_earned": unity_earned,
    }


# ---------------------------------------------------------------------------
# 7. Query Functions
# ---------------------------------------------------------------------------


async def get_responses(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    """Paginated list of responses for a session (JOIN ResponseMeta + TextResponse)."""
    offset = (page - 1) * page_size

    # Count total
    count_result = await db.execute(
        select(func.count(ResponseMeta.id)).where(
            ResponseMeta.session_id == session_id,
        )
    )
    total = count_result.scalar() or 0
    pages = math.ceil(total / page_size) if total > 0 else 0

    # Fetch page
    result = await db.execute(
        select(ResponseMeta, TextResponse)
        .outerjoin(TextResponse, TextResponse.response_meta_id == ResponseMeta.id)
        .where(ResponseMeta.session_id == session_id)
        .order_by(ResponseMeta.submitted_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = result.all()

    items = []
    for meta, text_resp in rows:
        item = {
            "id": meta.id,
            "session_id": meta.session_id,
            "question_id": meta.question_id,
            "participant_id": meta.participant_id,
            "source": meta.source,
            "char_count": meta.char_count,
            "language_code": text_resp.language_code if text_resp else "en",
            "submitted_at": meta.submitted_at,
            "is_flagged": meta.is_flagged,
            "pii_detected": text_resp.pii_detected if text_resp else False,
            "profanity_detected": text_resp.profanity_detected if text_resp else False,
        }
        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


async def get_response_by_id(
    db: AsyncSession,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
) -> dict | None:
    """Single response lookup with full text response detail."""
    result = await db.execute(
        select(ResponseMeta, TextResponse)
        .outerjoin(TextResponse, TextResponse.response_meta_id == ResponseMeta.id)
        .where(
            ResponseMeta.id == response_id,
            ResponseMeta.session_id == session_id,
        )
    )
    row = result.one_or_none()
    if row is None:
        return None

    meta, text_resp = row
    return {
        "id": meta.id,
        "session_id": meta.session_id,
        "question_id": meta.question_id,
        "participant_id": meta.participant_id,
        "source": meta.source,
        "char_count": meta.char_count,
        "language_code": text_resp.language_code if text_resp else "en",
        "submitted_at": meta.submitted_at,
        "is_flagged": meta.is_flagged,
        "pii_detected": text_resp.pii_detected if text_resp else False,
        "profanity_detected": text_resp.profanity_detected if text_resp else False,
        "clean_text": text_resp.clean_text if text_resp else None,
        "pii_types": text_resp.pii_types if text_resp else None,
        "pii_scrubbed_text": text_resp.pii_scrubbed_text if text_resp else None,
        "profanity_words": text_resp.profanity_words if text_resp else None,
    }
