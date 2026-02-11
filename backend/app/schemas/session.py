import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: str | None = None
    anonymity_mode: str = "identified"
    cycle_mode: str = "single"
    max_cycles: int = 1
    ranking_mode: str = "auto"
    language: str = "en"
    max_response_length: int = 500


class SessionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    anonymity_mode: str | None = None
    ranking_mode: str | None = None
    max_response_length: int | None = None


class SessionRead(BaseModel):
    id: uuid.UUID
    short_code: str
    created_by: str
    status: str
    title: str
    description: str | None
    anonymity_mode: str
    cycle_mode: str
    max_cycles: int
    current_cycle: int
    ranking_mode: str
    language: str
    max_response_length: int
    qr_url: str | None
    join_url: str | None
    is_paid: bool
    opened_at: datetime | None
    closed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    participant_count: int = 0

    model_config = {"from_attributes": True}
