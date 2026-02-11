from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://polling:polling@localhost:5432/polling_db"
    mongodb_uri: str = "mongodb://polling:polling@localhost:27017/polling_raw?authSource=admin"
    redis_url: str = "redis://localhost:6379/0"

    # Auth0
    auth0_domain: str = ""
    auth0_api_audience: str = ""
    auth0_client_id: str = ""
    auth0_client_secret: str = ""

    # AI Providers (launch: OpenAI, Grok/xAI, Gemini/Google)
    openai_api_key: str = ""
    xai_api_key: str = ""
    gemini_api_key: str = ""
    default_ai_provider: str = "openai"  # openai | grok | gemini

    # Security
    encryption_key: str = ""
    session_secret: str = ""

    # App
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    log_level: str = "INFO"

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    # Session defaults
    default_session_expiry_hours: int = 24

    # Token defaults (SoI Trinity: ♡ SI, 웃 HI, ◬ AI)
    login_si_tokens: float = 1.0          # ♡ SI awarded on session join (1 min default)
    hi_default: float = 0.0               # 웃 HI = 0 until paid incentives assigned
    ai_si_multiplier: float = 5.0         # ◬ AI = 5x SI as default

    # Free tier limits
    free_tier_max_participants: int = 50

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
