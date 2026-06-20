import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.ai.brain.exceptions import LLMProviderError
from app.ai.providers.base import LLMProvider

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

async def get_llm_provider(db: AsyncSession, override: str | None = None) -> LLMProvider:
    provider_name = override or settings.AI_PROVIDER
    provider_name = provider_name.lower().strip()
    registry = get_provider_registry()

    if provider_name not in registry:
        raise LLMProviderError(
            f"Unknown AI provider '{provider_name}'.",
            provider=provider_name,
        )

    provider_class = registry[provider_name]
    
    # Fetch API key and model configurations from env settings directly
    api_key = getattr(settings, f"{provider_name.upper()}_API_KEY", None)
    model_override = getattr(settings, f"AI_MODEL_{provider_name.upper()}", None)
    
    return provider_class(api_key=api_key, model=model_override)

def get_provider_info() -> list[dict]:
    """
    Returns metadata about all supported providers.
    Used by the /ai/health endpoint.
    """
    registry = get_provider_registry()
    supported = list(registry.keys())
    
    provider_key_map = {
        "gemini":    ("GEMINI_API_KEY", settings.GEMINI_API_KEY),
        "openai":    ("OPENAI_API_KEY", settings.OPENAI_API_KEY),
        "anthropic": ("ANTHROPIC_API_KEY", settings.ANTHROPIC_API_KEY),
        "groq":      ("GROQ_API_KEY", settings.GROQ_API_KEY),
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
            "configured": bool(key_value),
            "model": model_map.get(name, "unknown"),
            "key_env_var": key_name,
        })
    return result

SUPPORTED_PROVIDERS = ["gemini", "openai", "anthropic", "groq", "mistral", "together", "cohere", "ollama"]
