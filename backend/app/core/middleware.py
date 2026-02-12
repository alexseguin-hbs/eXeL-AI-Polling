"""Application middleware."""

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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject standard security headers into every response."""

    _headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
    }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        for key, value in self._headers.items():
            response.headers[key] = value
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
