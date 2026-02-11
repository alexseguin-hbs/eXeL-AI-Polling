import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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
    si_tokens_earned: float = Field(serialization_alias="♡")
    hi_tokens_earned: float = Field(serialization_alias="웃")
    ai_tokens_earned: float = Field(serialization_alias="◬")

    model_config = {"from_attributes": True, "populate_by_name": True}


class ParticipantTimeSummary(BaseModel):
    participant_id: uuid.UUID
    session_id: uuid.UUID
    total_active_seconds: float
    total_si_tokens: float = Field(serialization_alias="♡")
    total_hi_tokens: float = Field(serialization_alias="웃")
    total_ai_tokens: float = Field(serialization_alias="◬")
    entries: list[TimeEntryRead]

    model_config = {"populate_by_name": True}
