"""SoI Polling Tool — FastAPI Application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.exceptions import generic_exception_handler
from app.core.logging import setup_logging
from app.core.middleware import (
    CacheControlMiddleware,
    CloudflareProxyMiddleware,
    RequestIdMiddleware,
    SecurityHeadersMiddleware,
    TimingMiddleware,
)
from app.core.rate_limit import limiter
from app.cubes.cube1_session.router import router as session_router
from app.cubes.cube2_text.router import router as text_router
from app.cubes.cube3_voice.router import router as voice_router
from app.cubes.cube4_collector.router import router as collector_router
from app.cubes.cube5_gateway.router import router as gateway_router
from app.cubes.cube6_ai.router import router as ai_router
from app.cubes.cube7_ranking.router import router as ranking_router
from app.cubes.cube8_tokens.router import router as tokens_router
from app.cubes.cube9_reports.router import router as reports_router
from app.db.mongo import close_mongo, init_mongo
from app.db.postgres import close_postgres
from app.db.redis import close_redis, init_redis
from app.schemas.common import HealthResponse

# OpenAPI tags for all 9 cubes + health
openapi_tags = [
    {"name": "Health", "description": "Application health checks"},
    {"name": "Cube 1 — Sessions", "description": "Session CRUD, state machine, QR, join flow"},
    {"name": "Cube 2 — Text Input", "description": "Text submission, validation, PII detection"},
    {"name": "Cube 3 — Voice", "description": "Voice-to-text STT engine (MVP2)"},
    {"name": "Cube 4 — Collector", "description": "Response aggregation, presence tracking"},
    {"name": "Cube 5 — Gateway", "description": "Time tracking, orchestration, token calculation"},
    {"name": "Cube 6 — AI Theming", "description": "Embeddings, marble sampling, theme clustering"},
    {"name": "Cube 7 — Ranking", "description": "Voting, aggregation, governance compression"},
    {"name": "Cube 8 — Tokens", "description": "SoI Trinity token ledger, 웃 rates, disputes"},
    {"name": "Cube 9 — Reports", "description": "CSV/PDF export, analytics, insights"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle for database connections."""
    setup_logging()
    # Startup
    await init_mongo()
    await init_redis()
    # Auto-create all tables (safe to run repeatedly — skips existing)
    from app.db.base import Base
    from app.db.postgres import engine
    import app.models  # noqa: F401 — registers all models with Base.metadata

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await close_postgres()
    await close_mongo()
    await close_redis()


app = FastAPI(
    title="SoI Polling Tool API",
    description="Fast, secure, large-group polling with AI theming and prioritization",
    version="0.1.0",
    lifespan=lifespan,
    openapi_tags=openapi_tags,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware (Starlette executes in reverse registration order, so last-added runs first)
# Build dynamic CORS origins
origins = [settings.frontend_url, "http://localhost:3000"]
if settings.allowed_origins:
    origins.extend(o.strip() for o in settings.allowed_origins.split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.pages\.dev",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CacheControlMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(CloudflareProxyMiddleware)
app.add_middleware(TimingMiddleware)

# Exception handlers
app.add_exception_handler(Exception, generic_exception_handler)

# Register all cube routers under /api/v1
PREFIX = "/api/v1"
app.include_router(session_router, prefix=PREFIX)
app.include_router(text_router, prefix=PREFIX)
app.include_router(voice_router, prefix=PREFIX)
app.include_router(collector_router, prefix=PREFIX)
app.include_router(gateway_router, prefix=PREFIX)
app.include_router(ai_router, prefix=PREFIX)
app.include_router(ranking_router, prefix=PREFIX)
app.include_router(tokens_router, prefix=PREFIX)
app.include_router(reports_router, prefix=PREFIX)


@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse()
