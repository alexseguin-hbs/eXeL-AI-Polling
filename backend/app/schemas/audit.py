import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID | None
    actor_id: str
    actor_role: str
    action_type: str
    object_type: str
    object_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
