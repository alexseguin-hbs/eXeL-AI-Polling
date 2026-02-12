import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    anonymity_mode: Literal["identified", "anonymous", "pseudonymous"] = "identified"
    cycle_mode: Literal["single", "multi"] = "single"
    max_cycles: int = Field(1, ge=1, le=100)
    ranking_mode: Literal["auto", "manual"] = "auto"
    language: str = Field("en", min_length=2, max_length=10)
    max_response_length: int = Field(500, ge=50, le=5000)
    ai_provider: Literal["openai", "grok", "gemini"] = "openai"
    seed: str | None = None


class SessionUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    anonymity_mode: Literal["identified", "anonymous", "pseudonymous"] | None = None
    ranking_mode: Literal["auto", "manual"] | None = None
    max_response_length: int | None = Field(None, ge=50, le=5000)
    ai_provider: Literal["openai", "grok", "gemini"] | None = None


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
    ai_provider: str
    seed: str | None = None
    replay_hash: str | None = None
    qr_url: str | None
    join_url: str | None
    is_paid: bool
    opened_at: datetime | None
    closed_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    participant_count: int = 0

    model_config = {"from_attributes": True}


class SessionJoinRequest(BaseModel):
    """Payload when a participant joins via short_code."""
    display_name: str | None = None
    device_type: str | None = None


class SessionJoinResponse(BaseModel):
    session_id: uuid.UUID
    participant_id: uuid.UUID
    short_code: str
    title: str
    status: str
    display_name: str | None


class PresenceEntry(BaseModel):
    participant_id: str
    joined_at: str | None = None


class SessionPresence(BaseModel):
    session_id: uuid.UUID
    active_count: int
    participants: list[PresenceEntry]


class QrJsonResponse(BaseModel):
    qr_base64: str
    join_url: str
