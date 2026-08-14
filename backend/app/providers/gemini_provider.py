import asyncio
import json
import logging
from typing import Optional
import httpx

from app.providers.base_provider import BaseLLMProvider, LLMResponse
from app.config import get_settings

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1/models"


class GeminiProvider(BaseLLMProvider):
    name = "gemini"

    def __init__(self, model: str = "gemini-2.0-flash"):
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.model = model

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        url = f"{GEMINI_BASE_URL}/{self.model}:generateContent?key={self.api_key}"

        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"[System Instruction]\n{system_prompt}\n\n[User]\n{prompt}"}]})
        else:
            contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)

        if response.status_code != 200:
            raise RuntimeError(f"Gemini API error {response.status_code}: {response.text}")

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError(f"Gemini returned no candidates: {data}")

        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return LLMResponse(content=text, model=self.model)
