import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

REPORT_SYSTEM_PROMPT = """You are a report generation AI. Given a complete investigation of a real-world frustration (a "spark"), generate a polished final report.

Return a JSON object with:
- "spark_summary": 2-3 paragraph summary of the spark and what was investigated
- "research_findings": list of the most important findings from the research
- "key_pain_points": list of objects with "description", "severity", "frequency", "affected_users"
- "root_cause_analysis": list of objects with "root_cause", "depth" (1-3), "explanation"
- "existing_solutions": list of objects with "name", "category", "strengths", "weaknesses", "missing_features"
- "market_gaps": list of objects with "description", "underserved_users", "opportunity_type", "potential", "why_now"
- "recommended_project": the single best project idea to build, with brief justification (2-3 sentences)
- "suggested_mvp": brief MVP description for the recommended project (3-4 sentences)
- "future_expansion": how the recommended project could grow (2-3 sentences)
- "risks": list of risks or challenges to consider
- "references": list of objects with "title" and "url" for all sources used

Rules:
- Every recommendation must be supported by evidence from the investigation
- Be specific and actionable, not generic
- The report should tell a coherent story: problem → understanding → opportunity → recommendation
- Return ONLY valid JSON, no other text"""


async def run_report_generator(
    problem_statement: str,
    pain_points: list[dict],
    root_causes: list[dict],
    existing_solutions: list[dict],
    market_gaps: list[dict],
    project_ideas: list[dict],
    evidence: list[dict],
) -> dict:
    context = {
        "problem_statement": problem_statement,
        "pain_points": pain_points,
        "root_causes": root_causes,
        "existing_solutions": existing_solutions,
        "market_gaps": market_gaps,
        "project_ideas": [
            {"title": idea.get("title", ""), "category": idea.get("category", ""), "elevator_pitch": idea.get("elevator_pitch", ""), "problem_solved": idea.get("problem_solved", "")}
            for idea in project_ideas
        ],
        "evidence_summary": [
            {"title": e.get("title", ""), "url": e.get("url", "")}
            for e in evidence[:30]
        ],
    }
    context_text = json.dumps(context, indent=2)[:15000]

    settings = get_settings()
    provider = settings.llm_report

    response = await call_with_retry_and_fallback(
        provider_name=provider,
        prompt=f"Generate a final investigation report for this spark:\n\n{context_text}",
        system_prompt=REPORT_SYSTEM_PROMPT,
        temperature=0.4,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    report = parse_llm_json(content, context="[Report Generator]")
    if report is not None:
        logger.info("Report generated successfully")
        return report
    logger.error("Failed to parse report output")
    return {
        "spark_summary": f"Investigation of \"{problem_statement[:100]}\" completed with {len(pain_points)} pain points and {len(project_ideas)} project ideas.",
        "research_findings": [pp.get("description", "") for pp in pain_points[:5]],
        "key_pain_points": pain_points,
        "root_cause_analysis": root_causes,
        "existing_solutions": existing_solutions,
        "market_gaps": market_gaps,
        "recommended_project": project_ideas[0].get("title", "") if project_ideas else "",
        "suggested_mvp": "",
        "future_expansion": "",
        "risks": [],
        "references": [{"title": e.get("title", ""), "url": e.get("url", "")} for e in evidence[:20]],
    }
