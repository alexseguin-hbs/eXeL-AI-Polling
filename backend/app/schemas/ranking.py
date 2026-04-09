import uuid
from datetime import datetime

from pydantic import BaseModel


class RankingSubmit(BaseModel):
    ranked_theme_ids: list[uuid.UUID]


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
