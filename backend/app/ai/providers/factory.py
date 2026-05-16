import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.ai.brain.exceptions import LLMProviderError
from app.repositories.system_setting_repository import SystemSettingRepository
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
    repo = SystemSettingRepository(db)
    
    provider_name = override
    if not provider_name:
        stored_provider = await repo.get_by_key("AI_PROVIDER")
        provider_name = stored_provider.value if stored_provider and stored_provider.value else settings.AI_PROVIDER
    
    provider_name = provider_name.lower().strip()
    registry = get_provider_registry()

    if provider_name not in registry:
        raise LLMProviderError(
            f"Unknown AI provider '{provider_name}'.",
            provider=provider_name,
        )

    provider_class = registry[provider_name]
    
    # Fetch API key from DB if it exists
    key_field = f"{provider_name.upper()}_API_KEY"
    stored_key = await repo.get_by_key(key_field)
    api_key = stored_key.value.strip() if stored_key and stored_key.value else None
    
    # Fetch model override
    # 1. Try provider-specific override first (e.g. AI_MODEL_GROQ_OVERRIDE)
    provider_override_key = f"AI_MODEL_{provider_name.upper()}_OVERRIDE"
    stored_provider_model = await repo.get_by_key(provider_override_key)
    
    if stored_provider_model and stored_provider_model.value:
        model_override = stored_provider_model.value
    else:
        # 2. Fallback to global override (legacy / for convenience)
        stored_global_model = await repo.get_by_key("AI_MODEL_OVERRIDE")
        model_override = stored_global_model.value if stored_global_model and stored_global_model.value else None
    
    return provider_class(api_key=api_key, model=model_override)

def get_provider_info() -> list[dict]:
    """
    Returns metadata about all supported providers.
    Used by the /ai/health endpoint.
    """
    registry = get_provider_registry()
    supported = list(registry.keys())
    
    # Map of provider names to their settings (for health check)
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
