"""Cube 6 — AI Theming Clusterer: Embeddings, clustering, summarization."""

from fastapi import APIRouter

from app.schemas.theme import ThemeRead

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 6 — AI Theming"])


@router.post("/ai/run", status_code=202)
async def run_ai_theming(session_id: str):
    """CRS-09: Trigger AI theme clustering after poll closes."""
    raise NotImplementedError("Cube 6: run_ai_theming — not yet implemented")


@router.get("/themes", response_model=list[ThemeRead])
async def get_themes(session_id: str):
    """CRS-10: Get generated themes for a session."""
    raise NotImplementedError("Cube 6: get_themes — not yet implemented")
