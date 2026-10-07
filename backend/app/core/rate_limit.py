"""Rate limiting via slowapi — avoids circular imports by isolating the limiter.

# CRS-32: Rate limiting — slowapi with in-memory storage, per-endpoint limits
"""

from fastapi import Request
from slowapi import Limiter

from app.config import settings


def get_real_client_ip(request: Request) -> str:
    """Extract the real client IP, accounting for Cloudflare and reverse proxies."""
    # Only a header our own edge sets is trusted. X-Forwarded-For is written by the client,
    # so keying on its leftmost value let anyone rotate past every limit.
    if settings.behind_cloudflare:
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
    return request.client.host if request.client else "127.0.0.1"


limiter = Limiter(
    key_func=get_real_client_ip,
    storage_uri="memory://",  # In-memory rate limiting
)
