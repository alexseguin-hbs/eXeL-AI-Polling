import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TokenLedgerRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: str | None
    cube_id: str | None
    action_type: str
    delta_heart: float = Field(serialization_alias="♡")
    delta_person: float = Field(serialization_alias="웃")
    delta_triangle: float = Field(serialization_alias="◬")
    lifecycle_state: str
    reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class TokenDisputeCreate(BaseModel):
    ledger_entry_id: uuid.UUID
    reason: str
    evidence: str | None = None


class TokenDisputeRead(BaseModel):
    id: uuid.UUID
    ledger_entry_id: uuid.UUID
    flagged_by: str
    reason: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
