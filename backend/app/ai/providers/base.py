from typing import Any
from abc import ABC, abstractmethod
from typing import AsyncGenerator

class LLMResponse:
    """Structured response from any LLM provider."""
    def __init__(
        self,
        content: str,
        tokens_used: int | None = None,
        cost_usd: float | None = None,
        raw_response: Any = None,
    ):
        self.content = content
        self.tokens_used = tokens_used
        self.cost_usd = cost_usd
        self.raw_response = raw_response

class LLMProvider(ABC):
    """Abstract interface every LLM provider adapter must implement."""

    @abstractmethod
    async def complete(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        """Send a prompt and return a structured LLMResponse."""
        ...

    @abstractmethod
    async def stream_complete(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[str, None]:
        """Send a prompt and yield response tokens as they arrive."""
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Identifier: 'gemini', 'openai', 'anthropic', 'groq', etc."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Exact model version string logged in the task journal."""
        ...
