from abc import ABC, abstractmethod
from typing import Optional


class LLMResponse:
    def __init__(self, content: str, model: str = "", usage: Optional[dict] = None):
        self.content = content
        self.model = model
        self.usage = usage or {}


class BaseLLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        ...
