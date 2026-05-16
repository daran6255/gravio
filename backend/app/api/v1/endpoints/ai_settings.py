"""
AI Engine — Settings Management Endpoints
==========================================

Dedicated endpoints for managing AI provider configuration at runtime.
Keys are stored in system_settings table (is_secret=True for API keys).
This allows admins to configure the AI engine without touching .env files.

Keys used in system_settings table:
  AI_ENABLED         → "true" | "false"
  AI_PROVIDER        → "gemini" | "openai" | "anthropic" | "groq" | ...
  AI_MODEL_OVERRIDE  → Optional model name override for the active provider
  GEMINI_API_KEY     → secret
  OPENAI_API_KEY     → secret
  ANTHROPIC_API_KEY  → secret
  GROQ_API_KEY       → secret
  MISTRAL_API_KEY    → secret
  TOGETHER_API_KEY   → secret
  COHERE_API_KEY     → secret
  OLLAMA_BASE_URL    → not secret
  OLLAMA_MODEL       → not secret
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.ai.providers import SUPPORTED_PROVIDERS, get_provider_info, get_llm_provider
from app.ai.brain.exceptions import LLMAuthError, LLMProviderError
from app.core.config import settings
from app.models.user import User, UserRole
from app.repositories.system_setting_repository import SystemSettingRepository
from app.schemas.ai_settings import (
    AISettingItem,
    AISettingsResponse,
    AISettingsSaveRequest,
    AIConnectionTestRequest,
    AIConnectionTestResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Key definitions ────────────────────────────────────────────────────────────

# Maps setting key → (description, is_secret, default_value)
AI_SETTING_DEFINITIONS: dict[str, tuple[str, bool, str]] = {
    "AI_ENABLED":        ("Enable or disable the AI Engine", False, "false"),
    "AI_PROVIDER":       ("Active LLM provider", False, "gemini"),
    "AI_MODEL_OVERRIDE": ("Override the default model for the active provider (optional)", False, ""),
    "GEMINI_API_KEY":    ("Google Gemini API Key", True, ""),
    "OPENAI_API_KEY":    ("OpenAI API Key (ChatGPT)", True, ""),
    "ANTHROPIC_API_KEY": ("Anthropic API Key (Claude)", True, ""),
    "GROQ_API_KEY":      ("Groq API Key (ultra-fast inference)", True, ""),
    "MISTRAL_API_KEY":   ("Mistral AI API Key", True, ""),
    "TOGETHER_API_KEY":  ("Together AI API Key", True, ""),
    "COHERE_API_KEY":    ("Cohere API Key", True, ""),
    "OLLAMA_BASE_URL":   ("Ollama server base URL (for local models)", False, "http://localhost:11434"),
    "OLLAMA_MODEL":      ("Ollama model name (e.g. llama3.1)", False, "llama3.1"),
}

SECRET_MASK = "••••••••"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=AISettingsResponse,
    summary="Get AI Engine settings",
)
async def get_ai_settings(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> AISettingsResponse:
    """
    Returns current AI engine configuration.
    API keys are masked (shown as ••••••••) if set.
    """
    repo = SystemSettingRepository(db)
    all_settings = await repo.get_all_settings()
    settings_map = {s.key: s for s in all_settings}

    items = []
    for key, (description, is_secret, default) in AI_SETTING_DEFINITIONS.items():
        stored = settings_map.get(key)
        raw_value = stored.value if stored else None
        is_set = bool(raw_value and raw_value.strip())

        # Mask secrets
        display_value = SECRET_MASK if (is_secret and is_set) else raw_value

        items.append(AISettingItem(
            key=key,
            value=display_value,
            description=description,
            is_secret=is_secret,
            is_set=is_set,
        ))

    # Active provider: prefer DB, fall back to env
    provider_setting = settings_map.get("AI_PROVIDER")
    active_provider = (provider_setting.value if provider_setting and provider_setting.value
                       else settings.AI_PROVIDER)

    return AISettingsResponse(
        settings=items,
        active_provider=active_provider,
        providers=get_provider_info(),
        supported_providers=SUPPORTED_PROVIDERS,
    )


@router.put(
    "",
    summary="Save AI Engine settings",
    status_code=status.HTTP_200_OK,
)
async def save_ai_settings(
    body: AISettingsSaveRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> dict:
    """
    Upserts AI engine configuration into the system_settings table.
    Only fields that are explicitly provided are updated.
    Blank strings clear (unset) a setting.
    Masked values (••••••••) are ignored and NOT overwritten.
    """
    _require_admin(current_user)

    repo = SystemSettingRepository(db)
    all_settings = await repo.get_all_settings()
    settings_map = {s.key: s for s in all_settings}

    updates = body.model_dump(exclude_none=True)
    saved_keys = []

    for key, value in updates.items():
        if key not in AI_SETTING_DEFINITIONS:
            continue

        # Skip masked values — user didn't change the secret
        if value == SECRET_MASK or value == "••••••••":
            continue

        description, is_secret, _ = AI_SETTING_DEFINITIONS[key]

        if key in settings_map:
            existing = settings_map[key]
            # Only skip writing if it's the same (non-secret) value
            if not is_secret and existing.value == value:
                continue
            existing.value = value
            await db.flush()
        else:
            # Create new setting
            from app.models.system_setting import SystemSetting
            new_s = SystemSetting(key=key, value=value, description=description, is_secret=is_secret)
            db.add(new_s)
            await db.flush()

        saved_keys.append(key)

    await db.commit()
    logger.info("AI settings saved by user %d: %s", current_user.id, saved_keys)

    return {
        "message": f"Saved {len(saved_keys)} setting(s) successfully.",
        "saved_keys": saved_keys,
    }


@router.post(
    "/test-connection",
    response_model=AIConnectionTestResponse,
    summary="Test LLM provider connection",
)
async def test_connection(
    body: AIConnectionTestRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> AIConnectionTestResponse:
    """
    Send a minimal test prompt to the specified LLM provider
    to verify the API key and connectivity.
    """
    import time
    import time
    from app.ai.providers import PROVIDER_REGISTRY

    provider_name = body.provider.lower()

    if provider_name not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown provider '{provider_name}'. Supported: {', '.join(SUPPORTED_PROVIDERS)}",
        )

    # If a key was passed in the request body, temporarily override the setting
    if body.api_key and body.api_key not in (SECRET_MASK, "••••••••"):
        _apply_temp_key(provider_name, body.api_key)
    else:
        # Try to use the saved DB key
        repo = SystemSettingRepository(db)
        key_field = f"{provider_name.upper()}_API_KEY"
        stored = await repo.get_by_key(key_field)
        if stored and stored.value:
            _apply_temp_key(provider_name, stored.value)

    try:
        # Use the standard factory to get the provider (async)
        # We pass the override to force the provider being tested
        provider = await get_llm_provider(db, override=provider_name)

        start = time.monotonic()
        response = await provider.complete(
            system_prompt="You are a test assistant. Reply with valid JSON only.",
            user_message='{"test": true}',
            temperature=0,
            max_tokens=20,
        )
        latency = int((time.monotonic() - start) * 1000)

        return AIConnectionTestResponse(
            success=True,
            provider=provider_name,
            model=provider.model_name,
            message=f"Connection successful. Model responded in {latency}ms.",
            latency_ms=latency,
        )

    except LLMAuthError:
        return AIConnectionTestResponse(
            success=False,
            provider=provider_name,
            model="",
            message="Authentication failed. Please check your API key.",
        )
    except LLMProviderError as e:
        return AIConnectionTestResponse(
            success=False,
            provider=provider_name,
            model="",
            message=f"Connection failed: {e.message}",
        )
    except Exception as e:
        return AIConnectionTestResponse(
            success=False,
            provider=provider_name,
            model="",
            message=f"Unexpected error: {str(e)[:200]}",
        )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_admin(user: User) -> None:
    """Raise 403 if user is not an admin or superuser."""
    if user.role != UserRole.ADMIN and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify AI engine settings.",
        )


def _apply_temp_key(provider_name: str, api_key: str) -> None:
    """Temporarily override the in-memory setting for this request."""
    key_attr_map = {
        "gemini":    "GEMINI_API_KEY",
        "openai":    "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "groq":      "GROQ_API_KEY",
        "mistral":   "MISTRAL_API_KEY",
        "together":  "TOGETHER_API_KEY",
        "cohere":    "COHERE_API_KEY",
    }
    attr = key_attr_map.get(provider_name)
    if attr:
        setattr(settings, attr, api_key)
