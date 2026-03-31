"""Product Feedback schemas — create and read."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    session_id: uuid.UUID | None = None
    feedback_text: str = Field(..., min_length=1, max_length=2000)
    screen: str = Field(default="unknown", max_length=50)
    category: str = Field(default="general", max_length=30)
    device_type: str | None = None
    language_code: str = Field(default="en", max_length=10)


class FeedbackRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID | None
    user_id: str | None
    role: str
    screen: str
    cube_id: int | None
    crs_id: str | None
    sub_crs_id: str | None
    feedback_text: str
    category: str
    priority: int
    is_resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackStats(BaseModel):
    total: int
    by_screen: dict[str, int]
    by_category: dict[str, int]
    unresolved: int
