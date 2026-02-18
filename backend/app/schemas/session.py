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
    # Session type & polling mode
    session_type: Literal["polling", "peer_volunteer", "team_collaboration"] = "polling"
    polling_mode: Literal["single_round", "multi_round_deep_dive"] = "single_round"
    # Capacity & pricing
    pricing_tier: Literal["free", "moderator_paid", "cost_split"] = "free"
    max_participants: int | None = Field(None, ge=1, le=1000000)
    fee_amount_cents: int = Field(0, ge=0)
    cost_splitting_enabled: bool = False
    # Gamified reward
    reward_enabled: bool = False
    reward_amount_cents: int = Field(0, ge=0)
    cqs_weights: dict[str, float] | None = None
    # Theme voting
    theme2_voting_level: Literal["theme2_9", "theme2_6", "theme2_3"] = "theme2_9"
    # Live feed
    live_feed_enabled: bool = False
    # STT service settings (Moderator)
    stt_provider: Literal["openai", "grok", "gemini"] = "openai"
    realtime_stt_enabled: bool = False  # Paid: real-time word-by-word transcription
    realtime_stt_provider: Literal["azure", "aws"] = "azure"
    allow_user_stt_choice: bool = False  # Let users override STT provider
    # Appearance — cascades to all session participants
    theme_id: Literal[
        "exel-cyan", "ocean-blue", "emerald", "sunset",
        "red", "violet", "indigo", "coral", "custom"
    ] = "exel-cyan"
    custom_accent_color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class SessionUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    anonymity_mode: Literal["identified", "anonymous", "pseudonymous"] | None = None
    ranking_mode: Literal["auto", "manual"] | None = None
    max_response_length: int | None = Field(None, ge=50, le=5000)
    ai_provider: Literal["openai", "grok", "gemini"] | None = None
    stt_provider: Literal["openai", "grok", "gemini"] | None = None
    realtime_stt_enabled: bool | None = None
    realtime_stt_provider: Literal["azure", "aws"] | None = None
    allow_user_stt_choice: bool | None = None
    # Appearance — cascades to all session participants
    theme_id: Literal[
        "exel-cyan", "ocean-blue", "emerald", "sunset",
        "red", "violet", "indigo", "coral", "custom"
    ] | None = None
    custom_accent_color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


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
    # Session type & mode
    session_type: str = "polling"
    polling_mode: str = "single_round"
    # Capacity & pricing
    pricing_tier: str = "free"
    max_participants: int | None = None
    fee_amount_cents: int = 0
    cost_splitting_enabled: bool = False
    # Gamified reward
    reward_enabled: bool = False
    reward_amount_cents: int = 0
    cqs_weights: dict[str, float] | None = None
    # Theme voting
    theme2_voting_level: str = "theme2_9"
    # Live feed
    live_feed_enabled: bool = False
    # STT
    stt_provider: str = "openai"
    realtime_stt_enabled: bool = False
    realtime_stt_provider: str = "azure"
    allow_user_stt_choice: bool = False
    seed: str | None = None
    replay_hash: str | None = None
    qr_url: str | None
    join_url: str | None
    theme_id: str = "exel-cyan"
    custom_accent_color: str | None = None
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
    language_code: str = Field("en", min_length=2, max_length=10)
    results_opt_in: bool = False
    stt_provider_preference: Literal["openai", "grok", "gemini"] | None = None


class SessionJoinResponse(BaseModel):
    session_id: uuid.UUID
    participant_id: uuid.UUID
    short_code: str
    title: str
    status: str
    display_name: str | None
    theme_id: str = "exel-cyan"
    custom_accent_color: str | None = None


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
