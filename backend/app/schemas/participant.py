import uuid
from datetime import datetime

from pydantic import BaseModel


class ParticipantJoin(BaseModel):
    display_name: str | None = None
    device_type: str | None = None


class ParticipantRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: str | None
    display_name: str | None
    device_type: str | None
    joined_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}
