import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

MARKET_GAP_SYSTEM_PROMPT = """You are a market gap detection AI. Given a problem, its pain points, root causes, and existing solutions, identify gaps in the market where new solutions could succeed.

For each market gap, return:
- "description": what isn't being solved or who is being underserved
- "underserved_users": specific user groups that current solutions don't serve well
- "opportunity_type": one of ["technology_shift", "underserved_niche", "unmet_need", "emerging_trend", "integration_gap"]
- "potential": "high", "medium", or "low"
- "why_now": why this gap is exploitable now (technology, market, behavior changes)
- "evidence_refs": list of evidence item indices (0-based) supporting this gap

Rules:
- Each gap should represent a distinct opportunity
- Gaps must be supported by evidence (pain points, root causes, or research findings)
- Prioritize gaps where existing solutions have clear weaknesses
- Consider both underserved users AND unsolved aspects of the problem
- Return ONLY valid JSON, no other text"""


async def run_market_gap_detection(
    problem_statement: str,
    pain_points: list[dict],
    root_causes: list[dict],
    existing_solutions: list[dict],
    evidence: list[dict],
) -> list[dict]:
    settings = get_settings()

    context = {
        "problem_statement": problem_statement,
        "pain_points": [{"index": i, **pp} for i, pp in enumerate(pain_points[:5])],
        "root_causes": [{"index": i, **rc} for i, rc in enumerate(root_causes[:5])],
        "existing_solutions": [{"index": i, "name": s.get("name", ""), "weaknesses": s.get("weaknesses", []), "missing_features": s.get("missing_features", [])} for i, s in enumerate(existing_solutions[:5])],
    }
    context_text = json.dumps(context, indent=2)[:10000]

    response = await call_with_retry_and_fallback(
        provider_name=settings.llm_opportunities,
        prompt=f"Identify market gaps for this problem:\n\n{context_text}",
        system_prompt=MARKET_GAP_SYSTEM_PROMPT,
        temperature=0.4,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    result = parse_llm_json(content, context="[Market Gap]")
    if result is not None:
        gaps = result if isinstance(result, list) else result.get("market_gaps", result.get("gaps", []))
        logger.info(f"Market gap agent found {len(gaps)} gaps")
        return gaps[:5]
    logger.error("Failed to parse market gap output")
    return []
