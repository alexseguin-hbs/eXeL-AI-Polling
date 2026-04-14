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
from app.core.realtime_ws import router as realtime_router
from app.cubes.cube8_tokens.webhook import router as stripe_webhook_router
from app.cubes.cube9_reports.router import router as reports_router
from app.cubes.cube10_simulation.router import router as simulation_router
from app.cubes.cube11_blockchain.router import router as blockchain_router
from app.cubes.cube12_divinity_nft.router import router as arx_router
from app.db.postgres import close_postgres
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
    {"name": "Cube 10 — Simulation", "description": "Self-evolving platform: feedback, submissions, voting, deployment"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle for database connections."""
    setup_logging()
    # Startup — Supabase/PostgreSQL only
    # Auto-create all tables (safe to run repeatedly — skips existing)
    from app.db.base import Base
    from app.db.postgres import engine
    import app.models  # noqa: F401 — registers all models with Base.metadata

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await close_postgres()


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
app.include_router(simulation_router, prefix=PREFIX)
app.include_router(blockchain_router, prefix=PREFIX)
app.include_router(arx_router, prefix=PREFIX)
app.include_router(stripe_webhook_router, prefix=PREFIX)
app.include_router(realtime_router)


@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse()


@app.get("/api/v1/cubes", tags=["Health"])
async def list_cubes():
    """SDK discovery: list all cubes with endpoints, events, and status."""
    from app.core.sdk import get_cube_registry

    registry = get_cube_registry()
    return {"cubes": registry, "total": len(registry), "version": "0.1.0"}


@app.post("/api/v1/compress/estimate", tags=["Health"])
async def estimate_compression(count: int = 1000):
    """Theme Compression Engine: estimate cost for N texts."""
    from app.core.theme_compression import estimate_compression_cost
    return estimate_compression_cost(count)


@app.post("/api/v1/compress/validate", tags=["Health"])
async def validate_compression(texts: list[str]):
    """Validate texts before compression — returns issues + cost estimate."""
    from app.core.theme_compression import validate_compression_request
    return validate_compression_request(texts)


@app.get("/api/v1/sdk", tags=["Health"])
async def list_sdk_functions():
    """SDK registry: 9 paid functions + 3 free internal APIs with pricing."""
    from app.core.sdk_functions import get_sdk_registry
    return get_sdk_registry()


@app.get("/api/v1/sdk/estimate", tags=["Health"])
async def estimate_sdk_cost(responses: int = 1000, voters: int = 100, recipients: int = 0):
    """Estimate ◬ token cost for a complete governance session via SDK."""
    from app.core.sdk_functions import estimate_session_api_cost
    return estimate_session_api_cost(responses, voters, recipients)


@app.get("/api/v1/functions", tags=["Health"])
async def list_functions(cube: int | None = None, category: str | None = None):
    """SDK discovery: list all universal functions with I/O contracts.

    Internal functions are identical to external API calls.
    SDK codegen uses this endpoint to generate typed client methods.
    """
    from app.core.universal import (
        get_registry, get_by_cube, get_by_category, FunctionCategory,
    )

    if cube is not None:
        funcs = get_by_cube(cube)
    elif category is not None:
        try:
            cat = FunctionCategory(category)
            funcs = get_by_category(cat)
        except ValueError:
            funcs = get_registry()
    else:
        funcs = get_registry()

    return {"functions": funcs, "total": len(funcs)}
