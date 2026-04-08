"""Cube 2 — Response schemas for text submission, listing, and detail views.

Token fields use Unicode symbols (♡, ◬) as serialization aliases per spec.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Create / Submit
# ---------------------------------------------------------------------------


class ResponseCreate(BaseModel):
    question_id: uuid.UUID
    participant_id: uuid.UUID
    raw_text: str = Field(..., min_length=1, max_length=3333)
    language_code: str = Field(default="en", min_length=2, max_length=10)


# ---------------------------------------------------------------------------
# Shared base for read models
# ---------------------------------------------------------------------------


class ResponseBase(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID
    participant_id: uuid.UUID | None = None  # CRS-05: None in anonymous mode
    source: str
    char_count: int
    language_code: str
    submitted_at: datetime
    is_flagged: bool
    pii_detected: bool = False
    profanity_detected: bool = False

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Read (returned after submission — includes immediate token display)
# ---------------------------------------------------------------------------


class ResponseRead(ResponseBase):
    clean_text: str | None = None

    # CRS-09.07 / Task A4: AI-generated 33-word English summary from Cube 6 Phase A.
    # None at submit time (Phase A is async); real value arrives via summary_ready broadcast.
    summary_33: str | None = None

    # CRS-08: Integrity hash
    response_hash: str | None = None

    # Immediate token display after submission (♡ and ◬)
    heart_tokens_earned: float = Field(default=0.0)
    unity_tokens_earned: float = Field(default=0.0)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Detail (moderator view — includes PII/profanity metadata)
# ---------------------------------------------------------------------------


class TextResponseDetail(ResponseRead):
    pii_types: list[dict] | None = None
    pii_scrubbed_text: str | None = None
    profanity_words: list[dict] | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# List / Pagination
# ---------------------------------------------------------------------------


class ResponseListItem(ResponseBase):
    summary_33: str | None = None


class PaginatedResponseList(BaseModel):
    items: list[ResponseListItem]
    total: int
    page: int
    page_size: int
    pages: int
