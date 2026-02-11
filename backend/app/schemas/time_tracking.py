import uuid
from datetime import datetime

from pydantic import BaseModel


class TimeEntryStart(BaseModel):
    action_type: str  # "responding", "ranking", "reviewing"
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

    model_config = {"from_attributes": True}


class ParticipantTimeSummary(BaseModel):
    participant_id: uuid.UUID
    session_id: uuid.UUID
    total_active_seconds: float
    total_si_tokens: float
    entries: list[TimeEntryRead]
