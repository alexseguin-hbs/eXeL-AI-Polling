import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

# The largest Theme 02 slice a ballot can rank (level 9). The service then requires the exact valid set.
MAX_RANKED_THEMES = 9


class RankingSubmit(BaseModel):
    ranked_theme_ids: list[uuid.UUID] = Field(..., min_length=1, max_length=MAX_RANKED_THEMES)

    @field_validator("ranked_theme_ids")
    @classmethod
    def _unique(cls, v: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(v) != len(set(v)):
            raise ValueError("ranked_theme_ids must not repeat a theme")
        return v


class AggregateRequest(BaseModel):
    """Optional body of POST /rankings/aggregate. quadratic_borda needs each voter's stake (weight = sqrt(stake))."""

    participant_stakes: dict[uuid.UUID, float] | None = None

    @field_validator("participant_stakes")
    @classmethod
    def _non_negative(cls, v: dict[uuid.UUID, float] | None) -> dict[uuid.UUID, float] | None:
        if v and any(x < 0 for x in v.values()):
            raise ValueError("participant_stakes must be non-negative")
        return v


class RankingRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    cycle_id: int
    participant_id: uuid.UUID
    ranked_theme_ids: list
    submitted_at: datetime

    model_config = {"from_attributes": True}


class AggregatedRankingRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    cycle_id: int
    theme_id: uuid.UUID
    rank_position: int
    score: float
    vote_count: int
    is_top_theme2: bool
    confidence_avg: float = 0.0
    participant_count: int
    algorithm: str
    is_final: bool
    aggregated_at: datetime

    model_config = {"from_attributes": True}


class GovernanceOverrideSubmit(BaseModel):
    theme_id: uuid.UUID
    new_rank: int
    justification: str


class GovernanceOverrideRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    cycle_id: int
    theme_id: uuid.UUID
    original_rank: int
    new_rank: int
    overridden_by: str
    justification: str
    created_at: datetime

    model_config = {"from_attributes": True}
