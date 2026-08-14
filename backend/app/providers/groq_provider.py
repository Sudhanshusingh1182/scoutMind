import json
import logging
from typing import Optional
import httpx

from app.providers.base_provider import BaseLLMProvider, LLMResponse
from app.config import get_settings

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(BaseLLMProvider):
    name = "groq"

    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        settings = get_settings()
        self.api_key = settings.groq_api_key
        self.model = model

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
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(GROQ_BASE_URL, json=payload, headers=headers)

        if response.status_code != 200:
            raise RuntimeError(f"Groq API error {response.status_code}: {response.text}")

        data = response.json()
        choice = data["choices"][0]
        content = choice["message"]["content"]
        return LLMResponse(content=content, model=self.model)
