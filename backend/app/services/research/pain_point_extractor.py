import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

PAIN_POINT_SYSTEM_PROMPT = """You are a pain point extraction AI. Analyze the provided research evidence about a real-world frustration (a "spark").

Extract recurring complaints, user frustrations, missing features, unmet needs, and frequently mentioned problems.

For each pain point, return:
- "description": what the pain point is (concise, specific)
- "severity": "high", "medium", or "low"
- "frequency": "always", "often", or "sometimes"
- "affected_users": who experiences this pain point
- "evidence_refs": list of evidence item indices (0-based) that support this pain point

Rules:
- Only extract pain points that are clearly supported by multiple evidence items
- Prioritize concrete, specific complaints over vague generalizations
- Each pain point should be distinct from others
- Return ONLY valid JSON, no other text"""


async def run_pain_point_extraction(problem_statement: str, evidence: list[dict]) -> list[dict]:
    if not evidence:
        return []

    settings = get_settings()
    provider = settings.llm_insights
    max_pp = settings.max_pain_points

    evidence_with_index = []
    for i, e in enumerate(evidence):
        evidence_with_index.append({
            "index": i,
            "title": e.get("title", ""),
            "content": e.get("content", "")[:1500],
        })

    evidence_text = json.dumps(evidence_with_index, indent=2)[:12000]

    response = await call_with_retry_and_fallback(
        provider_name=provider,
        prompt=f"Spark: \"{problem_statement}\"\n\nResearch Evidence:\n{evidence_text}\n\nExtract up to {max_pp} distinct pain points from this evidence.",
        system_prompt=PAIN_POINT_SYSTEM_PROMPT,
        temperature=0.3,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    result = parse_llm_json(content, context="[Pain Points]")
    if result is not None:
        pain_points = result if isinstance(result, list) else result.get("pain_points", [])
        logger.info(f"Pain point extractor found {len(pain_points)} pain points")
        return pain_points[:max_pp]
    logger.error("Failed to parse pain point extraction output")
    return []
