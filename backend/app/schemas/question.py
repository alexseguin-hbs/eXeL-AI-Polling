import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class QuestionCreate(BaseModel):
    question_text: str = Field(..., max_length=500)
    order_index: int = 0


class QuestionRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    cycle_id: int
    question_text: str
    order_index: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
