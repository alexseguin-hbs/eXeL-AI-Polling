from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"


class ErrorResponse(BaseModel):
    detail: str


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
