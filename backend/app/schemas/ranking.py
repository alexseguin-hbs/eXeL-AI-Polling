import uuid
from datetime import datetime

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

# The largest Theme 02 slice a ballot can rank (level 9). The service then requires the exact valid set.
MAX_RANKED_THEMES = 9


# top3_points ballot (original design, Round 2): per Theme01 category, the participant's top 1–3 themes in order.
TOP3_MAX_PICKS = 3
Theme01Category = Literal["risk", "support", "neutral"]


class RankingSubmit(BaseModel):
    """A ballot. Borda sessions (default) send `ranked_theme_ids` (the full set, in order); `top3_points` sessions send
    `category_ballots` — for each Theme01 category voted, 1–3 distinct theme ids, best first (3/2/1 points)."""

    ranked_theme_ids: list[uuid.UUID] = Field(default_factory=list, max_length=MAX_RANKED_THEMES)
    category_ballots: dict[Theme01Category, list[uuid.UUID]] | None = None

    @field_validator("ranked_theme_ids")
    @classmethod
    def _unique(cls, v: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(v) != len(set(v)):
            raise ValueError("ranked_theme_ids must not repeat a theme")
        return v

    @field_validator("category_ballots")
    @classmethod
    def _top3_shape(cls, v: dict | None) -> dict | None:
        if v is None:
            return v
        if not v:
            raise ValueError("category_ballots must vote at least one category")
        seen: set[uuid.UUID] = set()
        for cat, ids in v.items():
            if not 1 <= len(ids) <= TOP3_MAX_PICKS:
                raise ValueError(f"category_ballots[{cat}] must pick 1–{TOP3_MAX_PICKS} themes")
            if len(ids) != len(set(ids)) or seen & set(ids):
                raise ValueError(f"category_ballots[{cat}] must not repeat a theme")
            seen |= set(ids)
        return v

    @model_validator(mode="after")
    def _one_shape(self):
        if not self.ranked_theme_ids and not self.category_ballots:
            raise ValueError("send ranked_theme_ids (full ranking) or category_ballots (top-3 per category)")
        if self.ranked_theme_ids and self.category_ballots:
            raise ValueError("send either ranked_theme_ids or category_ballots, not both")
        return self


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
    category_ballots: dict | None = None  # top3_points ballots only
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
