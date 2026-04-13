"""Cube 4 — Desired Outcome schemas (Methods 2 & 3, CRS-10).

Covers create, read, confirmation, and post-task results logging.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class DesiredOutcomeCreate(BaseModel):
    """Create a desired outcome for a session."""
    description: str = Field(..., min_length=1, max_length=5000)
    time_estimate_minutes: int = Field(default=0, ge=0)


class DesiredOutcomeRead(BaseModel):
    """Full desired outcome with confirmation + results status."""
    id: uuid.UUID
    session_id: uuid.UUID
    description: str
    time_estimate_minutes: int
    created_by: uuid.UUID | None = None
    confirmed_by: list[str] = []
    all_confirmed: bool = False
    outcome_status: str = "pending"
    results_log: str | None = None
    assessed_by: list[str] | None = None
    completed_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConfirmationRequest(BaseModel):
    """Participant confirms the desired outcome."""
    participant_id: uuid.UUID


VALID_OUTCOME_STATUSES = ("achieved", "partially_achieved", "not_achieved")


class ResultsLogCreate(BaseModel):
    """Post-task results submission."""
    results_log: str = Field(..., min_length=1, max_length=10000)
    outcome_status: str = Field(default="achieved")  # achieved | partially_achieved | not_achieved
    assessed_by: uuid.UUID | None = None

    @field_validator("outcome_status")
    @classmethod
    def validate_outcome_status(cls, v: str) -> str:
        if v not in VALID_OUTCOME_STATUSES:
            raise ValueError(
                f"outcome_status must be one of: {', '.join(VALID_OUTCOME_STATUSES)}"
            )
        return v
