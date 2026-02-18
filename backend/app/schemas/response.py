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
    raw_text: str = Field(..., min_length=1, max_length=5000)
    language_code: str = Field(default="en", max_length=10)


# ---------------------------------------------------------------------------
# Read (returned after submission — includes immediate token display)
# ---------------------------------------------------------------------------


class ResponseRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID
    participant_id: uuid.UUID
    source: str
    char_count: int
    language_code: str
    submitted_at: datetime
    is_flagged: bool
    pii_detected: bool = False
    profanity_detected: bool = False
    clean_text: str | None = None

    # Immediate token display after submission (♡ and ◬)
    heart_tokens_earned: float = Field(default=0.0, serialization_alias="\u2661")
    triangle_tokens_earned: float = Field(default=0.0, serialization_alias="\u25ec")

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------------------------------------------------------------------------
# Detail (moderator view — includes PII/profanity metadata)
# ---------------------------------------------------------------------------


class TextResponseDetail(ResponseRead):
    pii_types: list[dict] | None = None
    pii_scrubbed_text: str | None = None
    profanity_words: list[dict] | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------------------------------------------------------------------------
# List / Pagination
# ---------------------------------------------------------------------------


class ResponseListItem(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID
    participant_id: uuid.UUID
    source: str
    char_count: int
    language_code: str
    submitted_at: datetime
    is_flagged: bool
    pii_detected: bool = False
    profanity_detected: bool = False

    model_config = {"from_attributes": True}


class PaginatedResponseList(BaseModel):
    items: list[ResponseListItem]
    total: int
    page: int
    page_size: int
    pages: int
