"""Cube 3 — Voice response schemas for submission, listing, and detail views.

Token fields use Unicode symbols (♡, ◬) as serialization aliases per spec.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Read (returned after voice submission — includes immediate token display)
# ---------------------------------------------------------------------------


class VoiceSubmissionRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID
    participant_id: uuid.UUID
    source: str = "voice"
    char_count: int
    language_code: str
    submitted_at: datetime
    is_flagged: bool = False

    # Voice-specific fields
    audio_duration_sec: float
    stt_provider: str
    transcript_text: str
    transcript_confidence: float

    # PII/profanity from Cube 2 pipeline
    pii_detected: bool = False
    profanity_detected: bool = False
    clean_text: str | None = None

    # Immediate token display after submission (♡ and ◬)
    heart_tokens_earned: float = Field(default=0.0, serialization_alias="\u2661")
    triangle_tokens_earned: float = Field(default=0.0, serialization_alias="\u25ec")

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------------------------------------------------------------------------
# Detail (moderator view — includes full PII/profanity + voice metadata)
# ---------------------------------------------------------------------------


class VoiceResponseDetail(VoiceSubmissionRead):
    audio_format: str = "webm"
    audio_size_bytes: int = 0
    pii_types: list[dict] | None = None
    pii_scrubbed_text: str | None = None
    profanity_words: list[dict] | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------------------------------------------------------------------------
# List / Pagination
# ---------------------------------------------------------------------------


class VoiceResponseListItem(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID
    participant_id: uuid.UUID
    source: str = "voice"
    char_count: int
    language_code: str
    submitted_at: datetime
    is_flagged: bool = False
    audio_duration_sec: float
    stt_provider: str
    transcript_confidence: float

    model_config = {"from_attributes": True}


class PaginatedVoiceResponseList(BaseModel):
    items: list[VoiceResponseListItem]
    total: int
    page: int
    page_size: int
    pages: int
