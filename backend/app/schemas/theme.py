import uuid
from datetime import datetime

from pydantic import BaseModel


class ThemeRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    cycle_id: int
    label: str
    summary: str
    confidence: float
    response_count: int
    ai_provider: str
    ai_model: str
    created_at: datetime
    # Enrichment fields — resolved from parent Theme label + cluster_metadata.
    # Enable Cube 7 to filter/rank by category (Risk/Support/Neutral) and level (3/6/9)
    # without re-joining. Both None for Theme 01 parent rows themselves.
    theme01_category: str | None = None
    theme_level: str | None = None
    parent_theme_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}
