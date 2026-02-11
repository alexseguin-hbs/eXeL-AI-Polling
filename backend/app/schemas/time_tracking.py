import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class TimeEntryStart(BaseModel):
    action_type: Literal["login", "responding", "ranking", "reviewing"]
    reference_id: str | None = None  # question_id or ranking context


class TimeEntryStop(BaseModel):
    time_entry_id: uuid.UUID


class TimeEntryRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    participant_id: uuid.UUID
    action_type: str
    reference_id: str | None
    started_at: datetime
    stopped_at: datetime | None
    duration_seconds: float | None
    si_tokens_earned: float
    hi_tokens_earned: float
    ai_tokens_earned: float

    model_config = {"from_attributes": True}


class ParticipantTimeSummary(BaseModel):
    participant_id: uuid.UUID
    session_id: uuid.UUID
    total_active_seconds: float
    total_si_tokens: float
    total_hi_tokens: float
    total_ai_tokens: float
    entries: list[TimeEntryRead]
