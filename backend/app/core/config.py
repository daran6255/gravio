"""Application configuration using Pydantic Settings"""

import os
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, PostgresDsn, validator


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "CRM - WinVinaya"
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
    ANALYTICS_SECRET_KEY: str = "winvinaya-crm-analytics-secret-123" # Default for dev
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
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
    
    # Email (optional - for future use)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Email Recipients (Override in .env)
    SOURCING_EMAIL: str = "sourcing@winvinayafoundation.org"
    TIMESHEET_SUBMISSION_EMAIL: str = "timesheet.submission@winvinaya.com"

    # ── AI Engine ─────────────────────────────────────────────────────────────
    AI_ENABLED: bool = True

    # Active provider — one of the keys below
    # Supported: gemini | openai | anthropic | groq | mistral | together | cohere | ollama
    AI_PROVIDER: str = "gemini"

    # Provider API Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None     # Claude
    GROQ_API_KEY: Optional[str] = None          # Groq (blazing fast inference)
    MISTRAL_API_KEY: Optional[str] = None       # Mistral AI
    TOGETHER_API_KEY: Optional[str] = None      # Together AI (open-source models)
    COHERE_API_KEY: Optional[str] = None        # Cohere

    # Model Selection Per Provider (override in .env)
    AI_MODEL_GEMINI: str = "gemini-1.5-flash"
    AI_MODEL_OPENAI: str = "gpt-4o-mini"
    AI_MODEL_ANTHROPIC: str = "claude-3-5-haiku-20241022"  # Best value Claude model
    AI_MODEL_GROQ: str = "llama-3.1-8b-instant"           # Ultra-fast Groq model
    AI_MODEL_MISTRAL: str = "mistral-small-latest"
    AI_MODEL_TOGETHER: str = "meta-llama/Llama-3.1-8B-Instruct-Turbo"
    AI_MODEL_COHERE: str = "command-r"

    # Ollama (local/self-hosted)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"

    # Engine Behaviour
    AI_MAX_TOOL_CALLS_PER_RUN: int = 15     # Hard limit per task execution
    AI_TASK_TIMEOUT_SECONDS: int = 120      # Max time for a single task run
    AI_MAX_RETRIES: int = 3                 # Retry failed tool calls
    AI_APPROVAL_RECORD_THRESHOLD: int = 5   # Tasks touching >N records need approval
    AI_LOG_RETENTION_DAYS: int = 90         # How long to keep AI task journals
    
    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


# Global settings instance
settings = Settings()
