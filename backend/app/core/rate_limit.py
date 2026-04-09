"""Rate limiting via slowapi — avoids circular imports by isolating the limiter."""

from fastapi import Request
from slowapi import Limiter

from app.config import settings


def get_real_client_ip(request: Request) -> str:
    """Extract the real client IP, accounting for Cloudflare and reverse proxies."""
    if settings.behind_cloudflare:
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


limiter = Limiter(
    key_func=get_real_client_ip,
    storage_uri="memory://",  # In-memory rate limiting (no Redis dependency)
)
