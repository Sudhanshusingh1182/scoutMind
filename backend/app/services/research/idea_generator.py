import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

IDEA_SYSTEM_PROMPT = """You are a project idea generation AI. Given a researched real-world frustration and all the analysis, generate diverse, practical project ideas.

Every idea MUST reference specific evidence that supports it.

Categories to consider (pick the most appropriate for each idea):
- "AI Agent" — autonomous AI that handles a task
- "Portfolio Project" — impressive project for job applications
- "Mobile App" — iOS/Android application
- "SaaS" — web-based software as a service
- "Chrome Extension" — browser extension
- "Open Source Project" — community-driven tool
- "Automation Tool" — workflow/process automation
- "Developer Tool" — tool for developers
- "Startup Opportunity" — full business venture
- "Desktop Application" — native desktop software

For each idea, return:
- "title": project name (creative, memorable)
- "category": one of the categories above
- "elevator_pitch": one-line summary (max 15 words)
- "problem_solved": specific problem this addresses (2-3 sentences)
- "target_users": who benefits and why
- "why_now": why this opportunity exists NOW
- "supporting_evidence": list of objects with {"index": evidence_index, "title": source_title, "url": source_url, "snippet": brief quote}
- "technical_complexity": "low", "medium", or "high"
- "potential_impact": "low", "medium", or "high"
- "business_potential": "low", "medium", or "high"
- "mvp_outline": brief MVP description (2-3 sentences)
- "future_expansion": how this could grow (2-3 sentences)

Rules:
- Every idea MUST have at least 1-2 supporting evidence references
- Ideas should be diverse in category and approach
- Avoid generic CRUD SaaS ideas
- Ideas should feel realistic and buildable
- Each idea should address a different gap or angle
- Return ONLY valid JSON, no other text"""


async def run_idea_generation(
    problem_statement: str,
    pain_points: list[dict],
    root_causes: list[dict],
    existing_solutions: list[dict],
    market_gaps: list[dict],
    evidence: list[dict],
) -> list[dict]:
    settings = get_settings()
    max_ideas = settings.max_project_ideas

    context = {
        "problem_statement": problem_statement,
        "pain_points": [{"description": pp.get("description", ""), "severity": pp.get("severity", "")} for pp in pain_points[:5]],
        "root_causes": [{"root_cause": rc.get("root_cause", ""), "explanation": rc.get("explanation", "")} for rc in root_causes[:5]],
        "existing_solutions": [{"name": s.get("name", ""), "weaknesses": s.get("weaknesses", [])} for s in existing_solutions[:5]],
        "market_gaps": [{"description": g.get("description", ""), "opportunity_type": g.get("opportunity_type", "")} for g in market_gaps[:5]],
        "evidence_with_index": [{"index": i, "title": e.get("title", ""), "url": e.get("url", ""), "content": e.get("content", "")[:500]} for i, e in enumerate(evidence[:20])],
    }
    context_text = json.dumps(context, indent=2)[:15000]

    response = await call_with_retry_and_fallback(
        provider_name=settings.llm_startups,
        prompt=f"Generate up to {max_ideas} diverse project ideas for this investigated spark:\n\n{context_text}",
        system_prompt=IDEA_SYSTEM_PROMPT,
        temperature=0.6,
        max_tokens=8192,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    ideas = parse_llm_json(content, context="[Idea Generator]")
    if isinstance(ideas, list):
        logger.info(f"Idea generator created {len(ideas)} project ideas")
        return ideas[:max_ideas]
    logger.error("Failed to parse idea generator output")
    return []
