import uuid
from datetime import datetime

from pydantic import BaseModel


class ParticipantJoin(BaseModel):
    display_name: str | None = None
    device_type: str | None = None
    language_code: str = "en"
    results_opt_in: bool = False


class ParticipantRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: str | None
    display_name: str | None
    device_type: str | None
    language_code: str = "en"
    results_opt_in: bool = False
    payment_status: str = "unpaid"
    joined_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}
