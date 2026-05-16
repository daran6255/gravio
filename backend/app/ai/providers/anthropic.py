import httpx
import logging
from typing import AsyncGenerator
from app.core.config import settings
from app.ai.brain.exceptions import LLMAuthError, LLMProviderError, LLMRateLimitError
from app.ai.providers.base import LLMProvider, LLMResponse

logger = logging.getLogger(__name__)

class AnthropicProvider(LLMProvider):
    """Anthropic Claude Adapter."""
    
    BASE_URL = "https://api.anthropic.com/v1/messages"
    API_VERSION = "2023-06-01"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._api_key = api_key or settings.ANTHROPIC_API_KEY
        self._model = model or settings.AI_MODEL_ANTHROPIC
        
        if not self._api_key:
            raise LLMAuthError("anthropic")

    @property
    def provider_name(self) -> str:
        return "anthropic"

    @property
    def model_name(self) -> str:
        return self._model

    async def complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> LLMResponse:
        headers = {
            "x-api-key": self._api_key,
            "anthropic-version": self.API_VERSION,
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                resp = await client.post(self.BASE_URL, json=payload, headers=headers)
                if resp.status_code == 429:
                    raise LLMRateLimitError(provider="anthropic")
                if not resp.is_success:
                    raise LLMProviderError(f"Anthropic error: {resp.text}", provider="anthropic")
                
                data = resp.json()
                content = data["content"][0]["text"]
                return LLMResponse(content=content, raw_response=data)
            except Exception as e:
                if isinstance(e, (LLMRateLimitError, LLMProviderError)):
                    raise e
                raise LLMProviderError(f"Failed to connect to Anthropic: {str(e)}", provider="anthropic")

    async def stream_complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> AsyncGenerator[str, None]:
        # Implementation for streaming
        yield "Streaming not implemented in this refactor yet."
