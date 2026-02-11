import uuid
from datetime import datetime

from pydantic import BaseModel


class SimulationRunRead(BaseModel):
    id: uuid.UUID
    cube_id: str
    initiated_by: str
    base_version: str
    proposed_version: str
    status: str
    metrics: dict | None
    results_summary: str | None
    pass_fail: bool | None
    created_at: datetime

    model_config = {"from_attributes": True}
