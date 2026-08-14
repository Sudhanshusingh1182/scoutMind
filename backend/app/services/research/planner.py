import json
import logging

from app.workflow.retry import call_with_retry_and_fallback
from app.config import get_settings
from app.services.research.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

PLANNER_SYSTEM_PROMPT = """You are a research planning AI. A user has described a real-world frustration called a "spark" — something that annoys them, wastes their time, or makes them think "there should be a better way."

Your job is to break this spark into 5-6 high-priority research questions that will help deeply understand the problem before any solutions are proposed.

Coverage rules — maximize insight per question:
1. Who experiences this and why (affected users, demographics, contexts)
2. Root causes of the frustration (why does this problem actually exist?)
3. Existing solutions and their limitations (what products/approaches already exist?)
4. User complaints and unmet needs (what do people actually say about this?)
5. Technology trends and opportunities (what new tech could address this?)
6. Market signals (is this a growing problem? are people searching for solutions?)

Return ONLY a JSON array of 5-6 concise research question strings, nothing else."""


async def run_planner(problem_statement: str) -> list[str]:
    settings = get_settings()
    provider = settings.llm_planner
    max_q = settings.max_research_questions

    response = await call_with_retry_and_fallback(
        provider_name=provider,
        prompt=f"Generate {max_q} high-priority research questions for investigating this spark:\n\n\"{problem_statement}\"",
        system_prompt=PLANNER_SYSTEM_PROMPT,
        temperature=0.4,
    )

    content = response.content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    questions = parse_llm_json(content, context="[Planner]")
    if isinstance(questions, list) and all(isinstance(q, str) for q in questions):
        logger.info(f"Planner generated {len(questions)} questions for spark: {problem_statement[:60]}")
        return questions[:max_q]
    lines = [line.strip().strip('"').strip("'") for line in content.split("\n") if line.strip().startswith('"')]
    if lines:
        return lines[:max_q]
    return [
        f"Who experiences the problem described in: {problem_statement[:100]}",
        f"What existing solutions address: {problem_statement[:100]}",
        f"Why does this problem persist despite available solutions?",
    ]
