import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

ROOT_CAUSE_SYSTEM_PROMPT = """You are a root cause analysis AI. Given a real-world frustration and identified pain points, determine the underlying reasons WHY this problem exists.

Do not just restate symptoms. Dig deeper to find the fundamental causes.

  For each root cause, return:
  - "root_cause": the underlying reason (concise, specific)
  - "depth": a number from 1-3 (1 = surface level, 2 = intermediate, 3 = deeply fundamental)
  - "explanation": 2-3 sentences explaining why this root cause exists and persists
  - "related_pain_points": list of pain point indices (0-based) this root cause relates to
  - "evidence_refs": list of evidence item indices (0-based) supporting this analysis

Rules:
- Focus on WHY, not WHAT
- Each root cause should be distinct
- Prioritize deeper root causes (depth 3 is the most fundamental)
- Depth values are strictly limited to 1, 2, or 3 — never use 4 or 5
- Connect root causes to specific pain points and evidence
- Return ONLY valid JSON, no other text"""


async def run_root_cause_analysis(
    problem_statement: str,
    pain_points: list[dict],
    evidence: list[dict],
) -> list[dict]:
    if not pain_points:
        return []

    settings = get_settings()

    context = {
        "problem_statement": problem_statement,
        "pain_points": [
            {"index": i, **pp} for i, pp in enumerate(pain_points[:5])
        ],
        "evidence_summary": [
            {"index": i, "title": e.get("title", ""), "content": e.get("content", "")[:800]}
            for i, e in enumerate(evidence[:15])
        ],
    }
    context_text = json.dumps(context, indent=2)[:12000]

    response = await call_with_retry_and_fallback(
        provider_name=settings.llm_insights,
        prompt=f"Analyze the root causes of this problem:\n\n{context_text}",
        system_prompt=ROOT_CAUSE_SYSTEM_PROMPT,
        temperature=0.3,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    result = parse_llm_json(content, context="[Root Cause]")
    if result is not None:
        root_causes = result if isinstance(result, list) else result.get("root_causes", [])
        # Keep only meaningful depths (1-3). Depths 4/5 are arbitrary and add no value.
        root_causes = [
            rc for rc in root_causes
            if isinstance(rc, dict) and (rc.get("depth") is None or rc.get("depth") <= 3)
        ]
        logger.info(f"Root cause agent identified {len(root_causes)} root causes")
        return root_causes[:5]
    logger.error("Failed to parse root cause output")
    return []
