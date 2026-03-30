"""Cube 7 — Prioritization & Voting: Ranking UI backend, aggregation."""

from fastapi import APIRouter

from app.schemas.ranking import AggregatedRankingRead, RankingRead, RankingSubmit

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 7 — Ranking"])


@router.post("/rankings", response_model=RankingRead, status_code=201)
async def submit_ranking(session_id: str, payload: RankingSubmit):
    """CRS-11: User ranks themes after poll closes."""
    raise NotImplementedError("Cube 7: submit_ranking — not yet implemented")


@router.get("/rankings/aggregate", response_model=list[AggregatedRankingRead])
async def get_aggregated_rankings(session_id: str):
    """CRS-12: Get deterministic aggregated rankings (one row per theme, ordered by rank_position)."""
    raise NotImplementedError("Cube 7: get_aggregated_rankings — not yet implemented")


@router.post("/override", status_code=200)
async def override_ranking(session_id: str):
    """CRS-22: Lead/Developer overrides rankings with justification (MVP3)."""
    raise NotImplementedError("Cube 7: override_ranking — not yet implemented")
