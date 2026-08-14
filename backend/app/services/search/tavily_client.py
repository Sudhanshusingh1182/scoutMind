import asyncio
import logging
from typing import Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

TAVILY_BASE_URL = "https://api.tavily.com"


class TavilySearchResult:
    def __init__(self, title: str, url: str, content: str, relevance_score: float = 0.0, snippets: Optional[list[str]] = None):
        self.title = title
        self.url = url
        self.content = content
        self.relevance_score = relevance_score
        self.snippets = snippets or []

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "content": self.content,
            "relevance_score": self.relevance_score,
            "snippets": self.snippets,
        }


class TavilyClient:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.tavily_api_key
        if not self.api_key:
            raise RuntimeError("TAVILY_API_KEY is not set in environment")

    async def search(self, query: str, max_results: int = 5) -> list[TavilySearchResult]:
        url = f"{TAVILY_BASE_URL}/search"
        payload = {
            "api_key": self.api_key,
            "query": query,
            "max_results": max_results,
            "include_answer": False,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)

        if response.status_code != 200:
            raise RuntimeError(f"Tavily API error {response.status_code}: {response.text}")

        data = response.json()
        results = []
        for item in data.get("results", []):
            results.append(TavilySearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                content=item.get("content", ""),
                relevance_score=item.get("score", 0.0),
                snippets=item.get("snippets", []),
            ))
        return results


async def search_with_retry(query: str, max_retries: int = 3, max_results: int = 5) -> list[TavilySearchResult]:
    client = TavilyClient()
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            return await client.search(query, max_results=max_results)
        except Exception as e:
            logger.warning(f"Tavily search attempt {attempt}/{max_retries} failed for '{query}': {e}")
            last_error = e
            if attempt < max_retries:
                delay = 2.0 * (2 ** (attempt - 1))
                await asyncio.sleep(delay)

    logger.error(f"Tavily search failed for '{query}' after {max_retries} attempts")
    return []
