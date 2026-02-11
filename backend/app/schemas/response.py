import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ResponseCreate(BaseModel):
    question_id: uuid.UUID
    raw_text: str = Field(..., max_length=500)
    source: str = "text"


class ResponseRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID
    participant_id: uuid.UUID
    source: str
    char_count: int
    submitted_at: datetime
    is_flagged: bool

    model_config = {"from_attributes": True}
