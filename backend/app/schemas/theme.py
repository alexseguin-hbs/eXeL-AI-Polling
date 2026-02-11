import uuid
from datetime import datetime

from pydantic import BaseModel


class ThemeRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    cycle_id: int
    label: str
    summary: str
    confidence: float
    response_count: int
    ai_provider: str
    ai_model: str
    created_at: datetime

    model_config = {"from_attributes": True}
