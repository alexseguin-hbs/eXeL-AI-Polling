"""Pipeline schemas — Cube 5 orchestrator request/response models."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PipelineTriggerRead(BaseModel):
    """Read schema for a single pipeline trigger record."""

    id: uuid.UUID
    session_id: uuid.UUID
    trigger_type: str
    status: str
    triggered_at: datetime
    completed_at: datetime | None = None
    error_message: str | None = None
    trigger_metadata: dict | None = None

    model_config = {"from_attributes": True}


class PipelineStatusResponse(BaseModel):
    """Aggregated pipeline status for a session."""

    session_id: uuid.UUID
    triggers: list[PipelineTriggerRead]
    total: int = 0
    has_pending: bool = False
    has_failed: bool = False
    all_completed: bool = False


class TriggerThemingRequest(BaseModel):
    """Request body for manually triggering the AI theming pipeline."""

    seed: str | None = Field(None, description="Optional determinism seed")
    use_embedding_assignment: bool = Field(
        False, description="Use embedding cosine similarity instead of LLM for theme assignment"
    )


class PipelineRetryResponse(BaseModel):
    """Response after retrying a failed pipeline trigger."""

    trigger_id: uuid.UUID
    new_status: str
    message: str
