"""Application middleware.

# CRS-26: Accessibility — WCAG compliance enforced via frontend (semantic HTML, ARIA)
"""

import re
import time
import uuid

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.config import settings


class CloudflareProxyMiddleware(BaseHTTPMiddleware):
    """Extract real client IP when running behind Cloudflare proxy."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = self._get_client_ip(request)
        request.state.client_ip = client_ip
        structlog.contextvars.bind_contextvars(client_ip=client_ip)
        return await call_next(request)

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        if settings.behind_cloudflare:
            cf_ip = request.headers.get("CF-Connecting-IP")
            if cf_ip:
                return cf_ip
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[0].strip()
        return request.client.host if request.client else "127.0.0.1"


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        # Bind request_id to structlog context for all log entries in this request
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
        return response


def _embed_origins() -> list[str]:
    """Configured origins allowed to iframe the app (Full-Embed mode). Empty by default."""
    return [o.strip() for o in (settings.embed_allowed_origins or "").split(",") if o.strip()]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject standard security headers into every response.

    Framing (embed) policy is allowlist-driven and default-safe:
      * No `EMBED_ALLOWED_ORIGINS` configured → `X-Frame-Options: DENY` + CSP
        `frame-ancestors 'none'` (unchanged behavior — no site may iframe the app).
      * Origins configured → drop X-Frame-Options (it can't express a multi-origin
        allowlist) and emit CSP `frame-ancestors 'self' <origins…>`, so ONLY those
        origins may embed. Clickjacking stays blocked for everyone else.
    """

    _base_headers = {
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
    }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        for key, value in self._base_headers.items():
            response.headers[key] = value

        origins = _embed_origins()
        if origins:
            # Modern allowlist mechanism; X-Frame-Options is intentionally omitted so the
            # single-origin ALLOW-FROM legacy can't silently override the CSP.
            response.headers["Content-Security-Policy"] = (
                "frame-ancestors 'self' " + " ".join(origins)
            )
        else:
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"

        if settings.behind_cloudflare:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Set Cache-Control headers based on route pattern and HTTP method."""

    # (compiled_regex, cache_control_value)
    _route_cache_rules: list[tuple[re.Pattern[str], str]] = [
        (re.compile(r"^/api/v1/health$"), "public, max-age=10"),
        (re.compile(r"^/api/v1/sessions/[^/]+/qr$"), "public, max-age=3600"),
        (re.compile(r"^/api/v1/sessions/[^/]+/qr-json$"), "public, max-age=3600"),
        (re.compile(r"^/api/v1/sessions/[^/]+/themes$"), "public, max-age=300, stale-while-revalidate=60"),
        (re.compile(r"^/api/v1/sessions/[^/]+/export/csv$"), "no-store"),
        (re.compile(r"^/api/v1/tokens/rates"), "public, max-age=86400"),
    ]

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Skip if handler already set Cache-Control
        if "Cache-Control" in response.headers:
            return response

        method = request.method.upper()
        if method in ("POST", "PATCH", "DELETE"):
            response.headers["Cache-Control"] = "no-store"
            return response

        if method == "GET":
            path = request.url.path
            for pattern, cache_value in self._route_cache_rules:
                if pattern.match(path):
                    response.headers["Cache-Control"] = cache_value
                    return response
            response.headers["Cache-Control"] = "private, no-cache"

        return response
