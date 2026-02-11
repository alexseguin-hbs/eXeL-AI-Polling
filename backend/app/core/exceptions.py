"""Custom exceptions and FastAPI exception handlers."""

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class SessionNotFoundError(HTTPException):
    def __init__(self, session_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found",
        )


class SessionStateError(HTTPException):
    def __init__(self, current_state: str, attempted_action: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot {attempted_action} session in '{current_state}' state",
        )


class PaymentRequiredError(HTTPException):
    def __init__(self, detail: str = "Payment required"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)


class RateLimitError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
