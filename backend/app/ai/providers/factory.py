import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.ai.brain.exceptions import LLMProviderError
from app.ai.providers.base import LLMProvider
from app.ai.providers.resilient import ResilientLLMProvider
from app.ai.providers.metering import MeteredLLMProvider

logger = logging.getLogger(__name__)

def get_provider_registry():
    from app.ai.providers.gemini import GeminiProvider
    from app.ai.providers.openai import OpenAIProvider
    from app.ai.providers.anthropic import AnthropicProvider
    from app.ai.providers.groq import GroqProvider
    from app.ai.providers.mistral import MistralProvider

    return {
        "gemini": GeminiProvider,
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "groq": GroqProvider,
        "mistral": MistralProvider,
    }

PROVIDER_REGISTRY = get_provider_registry()


def _build_provider(provider_name: str) -> LLMProvider:
    provider_name = provider_name.lower().strip()
    registry = get_provider_registry()

    if provider_name not in registry:
        raise LLMProviderError(
            f"Unknown AI provider '{provider_name}'.",
            provider=provider_name,
        )

    provider_class = registry[provider_name]
    api_key = getattr(settings, f"{provider_name.upper()}_API_KEY", None)
    model_override = getattr(settings, f"AI_MODEL_{provider_name.upper()}", None)
    return provider_class(api_key=api_key, model=model_override)


async def get_llm_provider(
    db: AsyncSession,
    org_id: int | None = None,
    user_id: int | None = None,
    override: str | None = None,
    action_type: str | None = None,
) -> LLMProvider:
    """Resolve the LLM provider to use for a call.

    Composes two decorators around the raw provider adapter:
      1. ResilientLLMProvider — retries once against AI_FALLBACK_PROVIDER if the primary
         (including its own internal key-pool retries, for providers like Groq) is unavailable.
      2. MeteredLLMProvider — pre-checks and deducts AI credits, only when `org_id` is given.

    `org_id`/`user_id` should be passed for every user-triggered call so it's metered;
    omit `org_id` only for system/superuser calls that must bypass credit accounting entirely
    (mirrors the superuser bypass already used for module gating elsewhere in the app).
    """
    provider_name = override or settings.AI_PROVIDER
    primary = _build_provider(provider_name)

    fallback_name = settings.AI_FALLBACK_PROVIDER
    fallback = None
    if fallback_name and fallback_name.lower().strip() != provider_name.lower().strip():
        try:
            fallback = _build_provider(fallback_name)
        except LLMProviderError as e:
            # Fallback provider misconfigured (e.g. no API key) — degrade to no-fallback rather
            # than fail every primary call outright.
            logger.warning("AI_FALLBACK_PROVIDER '%s' could not be built (%s); fallback disabled.", fallback_name, e)

    resilient = ResilientLLMProvider(primary, fallback)

    if org_id is None:
        return resilient

    return MeteredLLMProvider(resilient, db, org_id, user_id, action_type)


def get_provider_info() -> list[dict]:
    """
    Returns metadata about all supported providers.
    Used by the /ai/health endpoint.
    """
    registry = get_provider_registry()

    provider_key_map = {
        "gemini":    ("GEMINI_API_KEY", settings.GEMINI_API_KEY),
        "openai":    ("OPENAI_API_KEY", settings.OPENAI_API_KEY),
        "anthropic": ("ANTHROPIC_API_KEY", settings.ANTHROPIC_API_KEY),
        "groq":      ("GROQ_API_KEY_1/2/3", bool(settings.GROQ_API_KEY_1 or settings.GROQ_API_KEY_2 or settings.GROQ_API_KEY_3 or settings.GROQ_API_KEY)),
        "mistral":   ("MISTRAL_API_KEY", settings.MISTRAL_API_KEY),
        "together":  ("TOGETHER_API_KEY", settings.TOGETHER_API_KEY),
        "cohere":    ("COHERE_API_KEY", settings.COHERE_API_KEY),
        "ollama":    ("OLLAMA_BASE_URL", settings.OLLAMA_BASE_URL),
    }
    model_map = {
        "gemini":    settings.AI_MODEL_GEMINI,
        "openai":    settings.AI_MODEL_OPENAI,
        "anthropic": settings.AI_MODEL_ANTHROPIC,
        "groq":      settings.AI_MODEL_GROQ,
        "mistral":   settings.AI_MODEL_MISTRAL,
        "together":  settings.AI_MODEL_TOGETHER,
        "cohere":    settings.AI_MODEL_COHERE,
        "ollama":    settings.OLLAMA_MODEL,
    }

    result = []
    for name in SUPPORTED_PROVIDERS:
        key_name, key_value = provider_key_map.get(name, ("UNKNOWN", None))
        result.append({
            "name": name,
            "is_active": name == settings.AI_PROVIDER,
            "is_fallback": name == settings.AI_FALLBACK_PROVIDER,
            "configured": bool(key_value),
            "model": model_map.get(name, "unknown"),
            "available_models": settings.AI_AVAILABLE_MODELS.get(name, []),
            "key_env_var": key_name,
        })
    return result

SUPPORTED_PROVIDERS = ["gemini", "openai", "anthropic", "groq", "mistral", "together", "cohere", "ollama"]
