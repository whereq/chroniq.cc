"""Application configuration management.

Settings are loaded from environment variables (or a local .env file).
Every value has a safe default so the app boots in development without a
fully-populated environment; production overrides come from Docker env.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ---- Database (shared whereq-db, database "chroniq") -------------------
    database_url: str = "postgresql+asyncpg://chroniq:chroniq@localhost:5432/chroniq"
    database_url_sync: str = "postgresql://chroniq:chroniq@localhost:5432/chroniq"

    # ---- API --------------------------------------------------------------
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    # Public base URL of the frontend — used to build booking/cancel links in emails.
    public_base_url: str = "http://localhost:5173"

    # ---- Keycloak / JWT (public SPA client) -------------------------------
    keycloak_url: str = "https://keytomarvel.com"
    keycloak_realm: str = "chroniq.cc"
    keycloak_client_id: str = "chroniq-spa"

    # ---- Keycloak Admin (confidential service account) --------------------
    # Create a confidential client "chroniq-backend" in Keycloak with Service
    # Accounts enabled and the "manage-users" realm role, so the backend can
    # assign ch-tier-* roles after a successful Stripe payment.
    keycloak_admin_client_id: str = "chroniq-backend"
    keycloak_admin_client_secret: str = ""

    # ---- Stripe -----------------------------------------------------------
    stripe_secret_key: str = ""       # sk_live_... or sk_test_...
    stripe_webhook_secret: str = ""   # whsec_...
    stripe_price_tier_1: str = ""     # price_... for tier 1
    stripe_price_tier_2: str = ""     # price_... for tier 2

    # ---- Email (transactional) --------------------------------------------
    # Provider-agnostic SMTP. Fill these in later; while empty the mailer runs
    # in "log only" mode (renders the message to logs, sends nothing).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    email_from: str = "chroniq.cc <no-reply@chroniq.cc>"

    # ---- Google Calendar OAuth --------------------------------------------
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/me/integrations/google/callback"

    # ---- Microsoft Graph OAuth --------------------------------------------
    ms_client_id: str = ""
    ms_client_secret: str = ""
    ms_tenant: str = "common"
    ms_redirect_uri: str = "http://localhost:8000/api/v1/me/integrations/microsoft/callback"

    # ---- SOL AI assistant (LLM, platform mode) ----------------------------
    # Provider-agnostic via LiteLLM. Set at least one *_api_key; optionally pin
    # platform_llm_provider (one of: openai, anthropic, google, deepseek, qwen,
    # minimax). chroniq reuses the shared whereq LLM keys (Anthropic default).
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_ai_api_key: str = ""
    deepseek_api_key: str = ""
    qwen_api_key: str = ""
    minimax_api_key: str = ""
    minimax_group_id: str = ""
    platform_llm_provider: str = ""

    # ---- Token encryption -------------------------------------------------
    # Fernet key (base64, 32 bytes) for encrypting stored OAuth tokens at rest.
    # Empty = tokens stored as-is (dev only; set this in production).
    token_encryption_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    """Return the cached settings instance."""
    return Settings()
