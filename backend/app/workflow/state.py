from typing import TypedDict, Optional


class EvidenceItem(TypedDict):
    title: str
    url: str
    content: str
    relevance_score: float


class ResearchQuestionResult(TypedDict):
    question: str
    status: str
    evidence: list[EvidenceItem]


class InvestigationState(TypedDict):
    investigation_id: int
    problem_statement: str

    research_questions: list[str]
    research_results: list[ResearchQuestionResult]
    all_evidence: list[EvidenceItem]

    pain_points: list[dict]
    root_causes: list[dict]
    existing_solutions: list[dict]
    market_gaps: list[dict]

    insights: list[dict]
    competitors: list[dict]
    opportunities: list[dict]

    project_ideas: list[dict]
    evaluations: list[dict]

    report: dict
    errors: list[str]
    current_status: str
