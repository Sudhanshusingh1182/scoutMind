import asyncio
import logging
import time
from typing import Optional, Callable, Awaitable, TypeVar

from app.providers.base_provider import BaseLLMProvider, LLMResponse
from app.providers.gemini_provider import GeminiProvider
from app.providers.groq_provider import GroqProvider
from app.providers.openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)

T = TypeVar("T")

MAX_RETRIES = 3
BASE_DELAY = 2.0

PROVIDER_FALLBACK_CHAIN: dict[str, list[str]] = {
    "openrouter": ["groq", "gemini"],
    "groq": ["openrouter", "gemini"],
    "gemini": ["groq", "openrouter"],
}

PROVIDER_MAP: dict[str, type[BaseLLMProvider]] = {
    "openrouter": OpenRouterProvider,
    "gemini": GeminiProvider,
    "groq": GroqProvider,
}


async def call_with_retry_and_fallback(
    provider_name: str,
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.5,
    max_tokens: int = 4096,
    max_retries: int = MAX_RETRIES,
) -> LLMResponse:
    fallback_chain = [provider_name] + PROVIDER_FALLBACK_CHAIN.get(provider_name, [])
    start_time = time.time()

    for fallback_idx, fallback_provider_name in enumerate(fallback_chain):
        provider_class = PROVIDER_MAP.get(fallback_provider_name)
        if not provider_class:
            logger.warning(f"Unknown provider '{fallback_provider_name}', skipping")
            continue

        provider = provider_class()

        for attempt in range(1, max_retries + 1):
            try:
                attempt_start = time.time()
                response = await provider.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                elapsed = time.time() - attempt_start
                logger.info(
                    f"Provider '{fallback_provider_name}' succeeded on attempt {attempt} ({elapsed:.2f}s)"
                )
                return response
            except Exception as e:
                elapsed = time.time() - start_time
                logger.warning(
                    f"Provider '{fallback_provider_name}' attempt {attempt}/{max_retries} "
                    f"failed after {elapsed:.2f}s: {e}"
                )
                if attempt < max_retries:
                    delay = BASE_DELAY * (2 ** (attempt - 1))
                    await asyncio.sleep(delay)

        logger.warning(
            f"Provider '{fallback_provider_name}' exhausted {max_retries} retries, "
            f"falling back to next provider"
        )

    total_elapsed = time.time() - start_time
    raise RuntimeError(
        f"All providers failed for prompt after {total_elapsed:.2f}s "
        f"(providers tried: {fallback_chain})"
    )


async def call_with_retry(
    func: Callable[[], Awaitable[T]],
    max_retries: int = MAX_RETRIES,
    context: str = "",
) -> T:
    last_error = None
    for attempt in range(1, max_retries + 1):
        start = time.time()
        try:
            result = await func()
            logger.info(f"{context} succeeded on attempt {attempt} ({time.time() - start:.2f}s)")
            return result
        except Exception as e:
            elapsed = time.time() - start
            logger.warning(f"{context} attempt {attempt}/{max_retries} failed after {elapsed:.2f}s: {e}")
            last_error = e
            if attempt < max_retries:
                delay = BASE_DELAY * (2 ** (attempt - 1))
                await asyncio.sleep(delay)

    raise RuntimeError(f"{context} failed after {max_retries} attempts") from last_error
