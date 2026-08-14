import json
import logging
from typing import Optional
import httpx

from app.providers.base_provider import BaseLLMProvider, LLMResponse
from app.config import get_settings

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterProvider(BaseLLMProvider):
    name = "openrouter"

    def __init__(self, model: str | None = None):
        settings = get_settings()
        self.api_key = settings.openrouter_api_key
        self.model = model or settings.openrouter_model

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://scoutmind.app",
            "X-Title": "ScoutMind",
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(OPENROUTER_BASE_URL, json=payload, headers=headers)

        if response.status_code != 200:
            raise RuntimeError(f"OpenRouter API error {response.status_code}: {response.text}")

        data = response.json()
        choice = data["choices"][0]
        content = choice["message"]["content"]
        return LLMResponse(content=content, model=self.model)
