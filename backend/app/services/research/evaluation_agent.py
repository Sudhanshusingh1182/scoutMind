import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

EVALUATION_SYSTEM_PROMPT = """You are a project idea evaluation AI. Score each generated project idea across 8 dimensions.

For each idea, return an object with:
- "index": the idea index (0-based)
- "title": the exact title/name of the idea being rated (copy it verbatim from the input)
- "practical_usefulness": 1-10 (how practically useful is this project?)
- "originality": 1-10 (how original/novel is this approach?)
- "innovation": 1-10 (how innovative is the technical approach?)
- "technical_feasibility": 1-10 (how feasible is this to build? 10 = very easy)
- "portfolio_value": 1-10 (how impressive would this be in a portfolio?)
- "business_potential": 1-10 (how strong is the business model?)
- "development_effort": 1-10 (1 = minimal effort, 10 = massive undertaking)
- "market_demand": 1-10 (how strong is the market demand?)

Also include:
- "overall_score": calculated as the average of the 8 scores (rounded to 1 decimal)
- "rank_justification": 1 sentence explaining why this idea deserves its rank

Rules:
- Be honest and critical — not everything deserves a 9 or 10
- Consider both technical and business perspectives
- A 7+ score should mean genuinely strong
- A 5 should mean average/mediocre
- Always include the idea's title so each rating clearly identifies which idea it refers to
- Return a JSON array of evaluated ideas sorted by overall_score descending
- Return ONLY valid JSON, no other text"""


async def run_evaluation(project_ideas: list[dict]) -> list[dict]:
    if not project_ideas:
        return []

    settings = get_settings()

    ideas_for_eval = []
    for i, idea in enumerate(project_ideas):
        ideas_for_eval.append({
            "index": i,
            "title": idea.get("title", ""),
            "category": idea.get("category", ""),
            "elevator_pitch": idea.get("elevator_pitch", ""),
            "problem_solved": idea.get("problem_solved", ""),
            "technical_complexity": idea.get("technical_complexity", ""),
            "potential_impact": idea.get("potential_impact", ""),
            "business_potential": idea.get("business_potential", ""),
        })

    context_text = json.dumps(ideas_for_eval, indent=2)

    response = await call_with_retry_and_fallback(
        provider_name=settings.llm_startups,
        prompt=f"Evaluate and score these project ideas:\n\n{context_text}",
        system_prompt=EVALUATION_SYSTEM_PROMPT,
        temperature=0.2,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    evaluations = parse_llm_json(content, context="[Evaluation]")
    if isinstance(evaluations, list):
        title_by_index = {item["index"]: item["title"] for item in ideas_for_eval}
        for ev in evaluations:
            ev.setdefault("title", title_by_index.get(ev.get("index"), ""))
        evaluations.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
        logger.info(f"Evaluation agent scored {len(evaluations)} ideas")
        return evaluations
    logger.error("Failed to parse evaluation output")
    return []
