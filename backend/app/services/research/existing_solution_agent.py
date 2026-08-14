import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

EXISTING_SOLUTION_SYSTEM_PROMPT = """You are an existing solution analysis AI. Research existing products, services, and approaches that attempt to solve a given problem.

For each existing solution, return:
- "name": product or approach name
- "category": type (e.g., "Mobile App", "SaaS", "Physical Product", "Open Source", "Browser Extension", "Manual Process")
- "description": brief description of what it does
- "strengths": what it does well (2-3 points)
- "weaknesses": where it falls short (2-3 points)
- "missing_features": features users want but don't get
- "user_sentiment": "positive", "mixed", or "negative"
- "source_url": URL where this information was found (if available, otherwise null)

Rules:
- Focus on the most significant/popular solutions
- Be specific about weaknesses and missing features
- Base analysis on evidence, not assumptions
- Include both digital and non-digital solutions
- Always return at least 3 solutions; never return an empty list
- Return ONLY valid JSON, no other text"""


async def run_existing_solution_analysis(
    problem_statement: str,
    evidence: list[dict],
) -> list[dict]:
    settings = get_settings()

    evidence_text = json.dumps([
        {"title": e.get("title", ""), "content": e.get("content", "")[:1200], "url": e.get("url", "")}
        for e in evidence[:20]
    ], indent=2)[:12000]

    response = await call_with_retry_and_fallback(
        provider_name=settings.llm_insights,
        prompt=f"Spark: \"{problem_statement}\"\n\nResearch Evidence:\n{evidence_text}\n\nIdentify and analyze existing solutions for this problem.",
        system_prompt=EXISTING_SOLUTION_SYSTEM_PROMPT,
        temperature=0.3,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    result = parse_llm_json(content, context="[Existing Solutions]")
    if result is not None:
        solutions = result if isinstance(result, list) else result.get("solutions", result.get("existing_solutions", []))
        logger.info(f"Existing solution agent found {len(solutions)} solutions")
        return solutions[:5]
    logger.error("Failed to parse existing solution output")
    return []
