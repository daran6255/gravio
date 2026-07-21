"""Application configuration using Pydantic Settings"""

import os
from typing import Dict, List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, PostgresDsn, validator


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "Gravit"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production
    FRONTEND_URL: Optional[str] = None
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        """Construct database URL from components"""
        if isinstance(v, str):
            return v
        return f"postgresql+asyncpg://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}:{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB')}"
    
    # Redis (for rate limiting and caching) - OPTIONAL
    # Rate limiting uses in-memory storage by default
    # Uncomment and configure these if you want to use Redis in production
    REDIS_HOST: Optional[str] = None
    REDIS_PORT: Optional[int] = None
    REDIS_DB: Optional[int] = None
    REDIS_PASSWORD: Optional[str] = None
    
    # Security
    SECRET_KEY: str
    ANALYTICS_SECRET_KEY: str = "gravit-analytics-secret-123" # Default for dev
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    INVITE_TOKEN_EXPIRE_DAYS: int = 7
    FIRST_SUPERUSER: str = "dharanidaran.a@taydens.com"
    FIRST_SUPERUSER_PASSWORD: str = "Testpass@123"

    @validator("SECRET_KEY")
    def warn_if_secret_key_is_weak(cls, v: str) -> str:
        """Warn (don't block startup) if SECRET_KEY is short enough to be brute-forced.

        JWTs signed with HS256 are only as strong as this key — a short or
        guessable key lets an attacker forge tokens offline without ever
        touching the server. 32 chars is a practical floor; generate a real one with:
            python -c "import secrets; print(secrets.token_urlsafe(64))"
        """
        if len(v) < 32:
            import warnings
            warnings.warn(
                f"SECRET_KEY is only {len(v)} characters — use at least 32 (ideally "
                "64+) random characters to resist brute-force/forgery attempts. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\"",
                stacklevel=2,
            )
        return v
    
    # CORS
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173"
    # BACKEND_CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000"
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from string or list"""
        if v is None or v == "":
            return ["*"]
        if isinstance(v, str):
            # Handle comma-separated string from .env
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return []
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    LOG_ROTATION: str = "500 MB"
    LOG_RETENTION: str = "30 days"
    LOG_FORMAT: str = "json"  # json or text
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # File uploads (shared across CRM entities - leads/deals/companies/contacts)
    MAX_UPLOAD_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_UPLOAD_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "text/plain",
        "application/zip",
    ]

    # CRM
    LEAD_STALE_DAYS: int = 14

    # Email (optional - for future use)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Email Recipients (Override in .env)
    SOURCING_EMAIL: str = "sourcing@gravit.com"
    TIMESHEET_SUBMISSION_EMAIL: str = "timesheet.submission@gravit.com"

    # ── AI Engine ─────────────────────────────────────────────────────────────
    AI_ENABLED: bool = True

    # Active provider — one of the keys below
    # Supported: gemini | openai | anthropic | groq | mistral | together | cohere | ollama
    AI_PROVIDER: str = "groq"

    # If the primary provider (and its own key pool, for providers that have one) is fully
    # unavailable, ResilientLLMProvider retries once against this provider before giving up.
    # Set to None/empty to disable cross-provider fallback entirely.
    AI_FALLBACK_PROVIDER: Optional[str] = "gemini"

    # Provider API Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None     # Claude
    GROQ_API_KEY: Optional[str] = None          # Groq (blazing fast inference) — legacy single-key
    # Groq key pool: up to 3 keys rotated on rate-limit so one provider never interrupts a user.
    # Any subset may be set; GROQ_API_KEY above is also folded into the pool if present.
    GROQ_API_KEY_1: Optional[str] = None
    GROQ_API_KEY_2: Optional[str] = None
    GROQ_API_KEY_3: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None       # Mistral AI
    TOGETHER_API_KEY: Optional[str] = None      # Together AI (open-source models)
    COHERE_API_KEY: Optional[str] = None        # Cohere

    # Model Selection Per Provider (override in .env) — each default is the first entry of
    # AI_AVAILABLE_MODELS below for that provider.
    AI_MODEL_GEMINI: str = "gemini-2.0-flash"
    AI_MODEL_OPENAI: str = "gpt-4o-mini"
    AI_MODEL_ANTHROPIC: str = "claude-haiku-4-5-20251001"  # Best value Claude model
    AI_MODEL_GROQ: str = "openai/gpt-oss-20b"             # Default Groq model
    AI_MODEL_MISTRAL: str = "mistral-small-latest"
    AI_MODEL_TOGETHER: str = "meta-llama/Llama-3.1-8B-Instruct-Turbo"
    AI_MODEL_COHERE: str = "command-r"

    # Selectable models per provider — a settings UI can offer these as a dropdown per provider
    # (first entry is that provider's default, matching AI_MODEL_<PROVIDER> above). Purely
    # informational for providers without an adapter yet (together/cohere/ollama).
    AI_AVAILABLE_MODELS: Dict[str, List[str]] = {
        "groq": ["openai/gpt-oss-20b", "llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
        "openai": ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini"],
        "anthropic": ["claude-haiku-4-5-20251001", "claude-sonnet-5", "claude-opus-4-8"],
        "gemini": ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
        "mistral": ["mistral-small-latest", "mistral-large-latest"],
        "together": ["meta-llama/Llama-3.1-8B-Instruct-Turbo"],
        "cohere": ["command-r"],
        "ollama": ["llama3.1"],
    }

    # Ollama (local/self-hosted)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"

    # Engine Behaviour
    AI_MAX_TOOL_CALLS_PER_RUN: int = 15     # Hard limit per task execution
    AI_TASK_TIMEOUT_SECONDS: int = 120      # Max time for a single task run
    AI_MAX_RETRIES: int = 3                 # Retry failed tool calls
    AI_APPROVAL_RECORD_THRESHOLD: int = 5   # Tasks touching >N records need approval
    AI_LOG_RETENTION_DAYS: int = 90         # How long to keep AI task journals

    # ── AI Credits ────────────────────────────────────────────────────────────
    # Token-weighted credit accounting: 1 credit = AI_CREDIT_TOKEN_RATIO tokens at a provider's
    # cost multiplier of 1.0. Cheaper/faster providers (Groq, Gemini) are charged at face value;
    # pricier providers cost proportionally more credits for the same token count.
    AI_CREDIT_TOKEN_RATIO: int = 1000
    AI_PROVIDER_COST_MULTIPLIER: Dict[str, float] = {
        "groq": 1.0,
        "gemini": 1.0,
        "mistral": 1.5,
        "openai": 3.0,
        "anthropic": 3.0,
    }

    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


# Global settings instance
settings = Settings()
