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
    algorithm: str
    results: list | dict | None
    participant_count: int
    computed_at: datetime
    is_final: bool
    override_by: str | None
    override_reason: str | None

    model_config = {"from_attributes": True}
