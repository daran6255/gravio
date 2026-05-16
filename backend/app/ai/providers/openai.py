import httpx
import logging
from typing import AsyncGenerator
from app.core.config import settings
from app.ai.brain.exceptions import LLMAuthError, LLMProviderError, LLMRateLimitError
from app.ai.providers.base import LLMProvider, LLMResponse

logger = logging.getLogger(__name__)

class OpenAIProvider(LLMProvider):
    """OpenAI Adapter."""
    BASE_URL = "https://api.openai.com/v1/chat/completions"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._api_key = api_key or settings.OPENAI_API_KEY
        self._model = model or settings.AI_MODEL_OPENAI
        if not self._api_key:
            raise LLMAuthError("openai")

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._model

    async def complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> LLMResponse:
        headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(self.BASE_URL, json=payload, headers=headers)
            if not resp.is_success:
                raise LLMProviderError(f"OpenAI error: {resp.text}", provider="openai")
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return LLMResponse(content=content, raw_response=data)

    async def stream_complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> AsyncGenerator[str, None]:
        yield "Not implemented"
