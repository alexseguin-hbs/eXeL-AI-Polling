from pydantic_settings import BaseSettings


DEV_OR_TEST_ENVIRONMENTS = frozenset({"development", "test"})


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
    # Fail closed: an UNSET environment is treated as production. Only an explicit
    # ENVIRONMENT=development or ENVIRONMENT=test unlocks the dev conveniences (mock auth
    # user, unsigned Stripe events, source-shipped Cube 10 codes, offline AI fallback).
    environment: str = "production"
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

    # Hexagonal Write Rotor (HWR) — 6-face write sharding for fast DB absorption.
    # OFF by default: writes degrade to the current single-table path until the
    # 6-partition ring migration (026_hex_write_ring.sql) is applied to Supabase.
    hwr_enabled: bool = False
    hwr_seed: str = "hwr"                 # rotor face-selection seed (replay-stable)

    # Cloudflare deployment
    behind_cloudflare: bool = False          # Enable CF-Connecting-IP extraction
    allowed_origins: str = ""                # Comma-separated extra CORS origins
    # Embed allowlist — comma-separated origins permitted to iframe the app (Full-Embed
    # mode). Empty (default) keeps X-Frame-Options: DENY + CSP frame-ancestors 'none'.
    embed_allowed_origins: str = ""
    cloudflare_turnstile_secret: str = ""    # Turnstile bot protection secret
    cloudflare_turnstile_site_key: str = ""  # Turnstile site key (sent to frontend)

    # Daily cap on paid AI calls from the anonymous POST /pod/synthesis (process-wide, per UTC
    # day; 429 once spent). Each call is one ~333-word completion. 0 turns the AI path off.
    pod_synthesis_daily_budget: int = 200

    # Free tier limits
    free_tier_max_participants: int = 19

    # Cube 10: Simulation Engine access codes (change via .env)
    cube10_admin_code: str = "96541230"
    cube10_challenger_code: str = "366999"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def is_dev_or_test(self) -> bool:
        """True ONLY for an explicit development or test environment.

        Every fail-closed guard asks this one question. Anything else — unset, "staging",
        "prod", a typo — is treated as production and keeps the guard shut.
        """
        return (self.environment or "").strip().lower() in DEV_OR_TEST_ENVIRONMENTS


def startup_config_errors(s: "Settings") -> list[str]:
    """What stops this deploy from starting safely. Empty in development/test.

    Outside dev/test the app refuses to start (main.lifespan) rather than run with a guard
    open:
      - AUTH0_DOMAIN missing → every request would be refused (503) — the deploy is broken,
        so say so at boot instead of at the first login.
      - SESSION_SECRET missing → participant tokens (HP-07) cannot be signed.
      - A Stripe API key without STRIPE_WEBHOOK_SECRET → payments are live but completion
        events cannot be verified. A deploy with NO Stripe key at all may start: payments are
        off, and the webhook still refuses every unsigned event at request time (503), so the
        missing secret opens nothing. Requiring it there would block payment-less deploys.
    """
    if s.is_dev_or_test:
        return []
    errors = []
    if not s.auth0_domain:
        errors.append("AUTH0_DOMAIN is not set")
    if not s.session_secret:
        errors.append("SESSION_SECRET is not set (participant tokens cannot be signed)")
    stripe_keys = (s.stripe_secret_key, s.stripe_restricted_key, s.stripe_live_secret_key, s.stripe_live_restricted_key)
    if any(stripe_keys) and not s.stripe_webhook_secret:
        errors.append("a Stripe API key is set but STRIPE_WEBHOOK_SECRET is not (payment events cannot be verified)")
    return errors


settings = Settings()
