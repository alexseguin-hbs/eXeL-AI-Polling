from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database — Supabase/PostgreSQL only
    database_url: str = "postgresql+asyncpg://polling:polling@localhost:5432/polling_db"

    # Auth0
    auth0_domain: str = ""
    auth0_api_audience: str = ""
    auth0_client_id: str = ""
    auth0_client_secret: str = ""

    # AI Providers (launch: OpenAI, Grok/xAI, Gemini/Google, Claude/Anthropic)
    openai_api_key: str = ""
    xai_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    default_ai_provider: str = "openai"  # openai | gemini | grok | claude

    # Real-time STT (Cube 3 — paid feature: Azure primary, AWS fallback)
    azure_speech_key: str = ""
    azure_speech_region: str = "eastus"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # Security
    encryption_key: str = ""
    session_secret: str = ""

    # App
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    log_level: str = "INFO"

    # Stripe (3 tiers: Free max 19, Moderator Paid, Cost Split)
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_restricted_key: str = ""      # For frontend-safe operations
    stripe_webhook_secret: str = ""      # Set after creating webhook endpoint in Stripe Dashboard
    stripe_live_secret_key: str = ""     # Production Stripe keys
    stripe_live_publishable_key: str = ""
    stripe_live_restricted_key: str = ""

    # Session defaults
    default_session_expiry_hours: int = 24

    # Determinism
    session_seed: str | None = None       # Optional global seed for deterministic session_id

    # AI pipeline / sampling (moved from magic numbers)
    batch_size: int = 2048                # Embedding batch size
    sample_count: int = 100               # Number of marble draws per Theme01 bin
    sample_size: int = 10                 # Items per marble draw (matches monolith: groups of 10)
    max_sampling_workers: int = 32        # ThreadPoolExecutor workers
    themes_per_sample: int = 3            # Secondary themes generated per sample (matches monolith)

    # Token defaults (SoI Trinity: ♡, 웃, ◬)
    login_heart_tokens: float = 1.0       # ♡ awarded on session join (1 min default)
    unity_heart_multiplier: float = 5.0  # ◬ = 5x ♡ as default

    # 웃 — compensated skilled time (global talent at local min wage)
    # Set human_enabled=True + human_hourly_rate to activate. Rate anchored to
    # jurisdiction minimum wage (e.g., Texas 7.25/hr, federal 7.25/hr).
    # 웃 per minute = human_hourly_rate / 60. Redeemable against treasury only.
    # 웃 format: #.### (3 decimal places, no currency symbol)
    human_enabled: bool = False          # Flip to True when treasury funded
    human_hourly_rate: float = 7.25      # Per-hour — default US federal min wage
    human_currency: str = "USD"          # Reference currency for rate table

    # Cloudflare deployment
    behind_cloudflare: bool = False          # Enable CF-Connecting-IP extraction
    allowed_origins: str = ""                # Comma-separated extra CORS origins
    cloudflare_turnstile_secret: str = ""    # Turnstile bot protection secret
    cloudflare_turnstile_site_key: str = ""  # Turnstile site key (sent to frontend)

    # Free tier limits
    free_tier_max_participants: int = 19

    # Cube 10: Simulation Engine access codes (change via .env)
    cube10_admin_code: str = "96541230"
    cube10_challenger_code: str = "366999"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
