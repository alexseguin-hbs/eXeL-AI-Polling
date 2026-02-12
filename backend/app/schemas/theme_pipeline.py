"""Schemas for the AI theme pipeline (Cube 6)."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PipelineRunRequest(BaseModel):
    """Request to trigger the full AI theme pipeline."""
    seed: str | None = None
    sample_count: int | None = None
    sample_size: int | None = None


class PipelineStatus(BaseModel):
    """Status response for a running or completed pipeline."""
    session_id: uuid.UUID
    status: Literal["queued", "running", "completed", "failed"]
    current_step: str | None = None
    total_steps: int = 9
    completed_steps: int = 0
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class ThemeSampleRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    theme01_label: str
    sample_index: int
    response_ids: list[str]
    secondary_theme: str
    confidence: float
    theme_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReducedTheme(BaseModel):
    label: str
    description: str
    confidence: float


class ThemePipelineResult(BaseModel):
    session_id: uuid.UUID
    total_responses: int
    bins: dict[str, int]
    themes_9: dict[str, list[ReducedTheme]]
    themes_6: dict[str, list[ReducedTheme]]
    themes_3: dict[str, list[ReducedTheme]]
    replay_hash: str | None = None
