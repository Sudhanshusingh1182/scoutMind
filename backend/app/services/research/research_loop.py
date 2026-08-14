import asyncio
import logging

from app.services.search.tavily_client import search_with_retry
from app.config import get_settings

logger = logging.getLogger(__name__)


def _evidence_is_sufficient(evidence: list[dict]) -> bool:
    settings = get_settings()
    if not settings.enable_early_stopping:
        return False
    threshold = settings.evidence_sufficiency_threshold
    min_rel = settings.evidence_relevance_min
    high_quality = [e for e in evidence if e.get("relevance_score", 0) >= min_rel]
    return len(high_quality) >= threshold


async def run_research_for_question(question: str) -> dict:
    settings = get_settings()
    results = await search_with_retry(question, max_results=settings.max_search_results)

    evidence_list = []
    for r in results:
        evidence_list.append({
            "title": r.title,
            "url": r.url,
            "content": r.content[:2000],
            "relevance_score": r.relevance_score,
        })

    return {
        "question": question,
        "status": "completed" if results else "failed",
        "evidence": evidence_list,
    }


async def run_research_loop(questions: list[str]) -> dict:
    settings = get_settings()
    all_evidence = []
    results = []

    question_tasks = []
    for q in questions:
        question_tasks.append(run_research_for_question(q))

    task_results = await asyncio.gather(*question_tasks, return_exceptions=True)

    for i, result in enumerate(task_results):
        if isinstance(result, Exception):
            logger.error(f"Research failed for question {i}: {result}")
            results.append({
                "question": questions[i],
                "status": "failed",
                "evidence": [],
            })
        else:
            results.append(result)
            all_evidence.extend(result.get("evidence", []))

    early_stopped = False
    if _evidence_is_sufficient(all_evidence):
        logger.info(f"[ResearchLoop] Evidence sufficient — {len(all_evidence)} items collected")
        early_stopped = True

    return {
        "research_results": results,
        "all_evidence": all_evidence,
        "early_stopped": early_stopped,
        "current_status": "analyzing",
    }
