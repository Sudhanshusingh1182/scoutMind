import asyncio
import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.store import (
    create_investigation, get_investigation, get_events,
)
from app.services.investigation import run_investigation
from app.database.engine import get_session
from app.repositories.investigation import InvestigationRepository
from app.repositories.report import ReportRepository
from app.auth.dependencies import get_current_user_id
from app.auth.jwt import decode_access_token
from app.models.investigation import InvestigationStatus
from app.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


class CreateRequest(BaseModel):
    problem_statement: str = Field(..., min_length=3, max_length=500)


class CreateResponse(BaseModel):
    id: str
    problem_statement: str
    status: str


class StatusResponse(BaseModel):
    id: str
    problem_statement: str
    status: str
    event_count: int = 0


class EventOut(BaseModel):
    id: int
    investigation_id: str
    event_type: str
    message: str
    metadata: Optional[dict] = None


class ProjectIdeaOut(BaseModel):
    title: str
    category: str = ""
    elevator_pitch: str = ""
    problem_solved: str = ""
    target_users: str = ""
    why_now: str = ""
    supporting_evidence: list[dict] = []
    technical_complexity: str = ""
    potential_impact: str = ""
    business_potential: str = ""
    mvp_outline: str = ""
    future_expansion: str = ""
    differentiation: str = ""
    pricing_model: str = ""
    practical_usefulness: float = 0
    originality: float = 0
    innovation: float = 0
    technical_feasibility: float = 0
    portfolio_value: float = 0
    business_potential_score: float = 0
    development_effort: float = 0
    market_demand: float = 0
    overall_score: float = 0


class ReportResponse(BaseModel):
    investigation_id: str
    spark_summary: Optional[str] = None
    research_findings: Optional[list] = None
    key_pain_points: Optional[list[dict]] = None
    root_cause_analysis: Optional[list[dict]] = None
    existing_solutions: Optional[list[dict]] = None
    market_gaps: Optional[list[dict]] = None
    recommended_project: Optional[str] = None
    suggested_mvp: Optional[str] = None
    future_expansion: Optional[str] = None
    risks: Optional[list[str]] = None
    references: Optional[list[dict]] = None
    project_ideas: list[ProjectIdeaOut] = []


class InvestigationListItem(BaseModel):
    id: int
    problem_statement: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    idea_count: int = 0
    source_count: int = 0


class InvestigationListResponse(BaseModel):
    investigations: list[InvestigationListItem]
    total: int


class ArtifactCounts(BaseModel):
    sources: int = 0
    pain_points: int = 0
    root_causes: int = 0
    solutions: int = 0
    market_gaps: int = 0
    project_ideas: int = 0
    events: int = 0


class StepOut(BaseModel):
    id: int
    step_name: str
    status: str
    execution_time: Optional[int] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    output_json: Optional[str] = None


@router.post("", response_model=CreateResponse, status_code=201)
async def create_investigation_endpoint(
    body: CreateRequest,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    inv_repo = InvestigationRepository(session)
    db_inv = inv_repo.create(user_id=user_id, problem_statement=body.problem_statement)
    session.commit()

    inv_id = str(db_inv.id)
    create_investigation(inv_id, body.problem_statement)

    asyncio.create_task(run_investigation(inv_id, body.problem_statement, db_inv.id))

    return CreateResponse(id=inv_id, problem_statement=body.problem_statement, status="pending")


@router.get("", response_model=InvestigationListResponse)
def list_investigations(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    inv_repo = InvestigationRepository(session)
    investigations = inv_repo.get_by_user_id(user_id, limit=limit, offset=offset, search=search)
    total = inv_repo.count_by_user(user_id, search=search)

    items = []
    for inv in investigations:
        source_count = len(inv.evidence) if inv.evidence else 0
        items.append(InvestigationListItem(
            id=inv.id,
            problem_statement=inv.problem_statement,
            status=inv.status.value,
            created_at=inv.created_at.isoformat(),
            completed_at=inv.completed_at.isoformat() if inv.completed_at else None,
            idea_count=len(inv.project_ideas),
            source_count=source_count,
        ))

    return InvestigationListResponse(investigations=items, total=total)


@router.get("/{investigation_id}", response_model=StatusResponse)
async def get_investigation_status(
    investigation_id: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        db_id = int(investigation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid investigation ID")
    inv_repo = InvestigationRepository(session)
    db_inv = inv_repo.get_by_id(db_id)
    if not db_inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return StatusResponse(
        id=str(db_inv.id),
        problem_statement=db_inv.problem_statement,
        status=db_inv.status.value,
        event_count=len(db_inv.steps) if db_inv.steps else 0,
    )


@router.get("/{investigation_id}/events", response_model=list[EventOut])
async def get_investigation_events(
    investigation_id: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        db_id = int(investigation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid investigation ID")
    inv_repo = InvestigationRepository(session)
    db_inv = inv_repo.get_by_id(db_id)
    if not db_inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    events = []
    for i, step in enumerate(db_inv.steps or []):
        events.append(EventOut(
            id=step.id,
            investigation_id=investigation_id,
            event_type=f"{step.step_name}_completed" if step.status.value == "COMPLETED" else f"{step.step_name}_started",
            message=f"Step: {step.step_name} ({step.status.value})",
            metadata={"step_name": step.step_name, "status": step.status.value},
        ))
    return events


@router.get("/{investigation_id}/steps", response_model=list[StepOut])
async def get_investigation_steps(
    investigation_id: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        db_id = int(investigation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid investigation ID")
    inv_repo = InvestigationRepository(session)
    steps = inv_repo.get_steps(db_id)
    return [
        StepOut(
            id=s.id,
            step_name=s.step_name,
            status=s.status.value,
            execution_time=s.execution_time,
            started_at=s.started_at.isoformat() if s.started_at else None,
            completed_at=s.completed_at.isoformat() if s.completed_at else None,
            error_message=s.error_message,
            output_json=s.output_json,
        )
        for s in steps
    ]


@router.get("/{investigation_id}/artifact-counts", response_model=ArtifactCounts)
async def get_artifact_counts(
    investigation_id: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        db_id = int(investigation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid investigation ID")
    inv_repo = InvestigationRepository(session)
    counts = inv_repo.get_artifact_counts(db_id)
    return ArtifactCounts(**counts)


class DeleteResponse(BaseModel):
    deleted: bool


@router.delete("/{investigation_id}", response_model=DeleteResponse)
def delete_investigation(
    investigation_id: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        inv_id = int(investigation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid investigation ID")

    inv_repo = InvestigationRepository(session)
    deleted = inv_repo.delete(inv_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Investigation not found")
    session.commit()
    return DeleteResponse(deleted=True)


@router.get("/{investigation_id}/report", response_model=ReportResponse)
async def get_investigation_report_endpoint(
    investigation_id: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        inv_id = int(investigation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid investigation ID")

    inv_repo = InvestigationRepository(session)
    db_inv = inv_repo.get_by_id(inv_id)
    if not db_inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if db_inv.status != InvestigationStatus.COMPLETED:
        raise HTTPException(status_code=404, detail="Report not available")

    report_repo = ReportRepository(session)
    db_report = report_repo.get_by_investigation_id(inv_id)
    if not db_report:
        logger.error(f"Report missing for completed investigation {inv_id}")
        raise HTTPException(status_code=404, detail="Report not available")

    report_data = json.loads(db_report.report_json)

    project_ideas_out = []
    for idea in db_inv.project_ideas:
        project_ideas_out.append(ProjectIdeaOut(
            title=idea.title,
            category=idea.category or "",
            elevator_pitch=idea.elevator_pitch or "",
            problem_solved=idea.problem or "",
            target_users=idea.target_customer or "",
            why_now=idea.why_now or "",
            supporting_evidence=[],
            technical_complexity=idea.technical_complexity or "",
            potential_impact=idea.potential_impact or "",
            business_potential=idea.business_potential or "",
            mvp_outline=idea.mvp or "",
            future_expansion=idea.future_expansion or "",
            differentiation=idea.differentiation or "",
            pricing_model=idea.pricing_model or "",
            practical_usefulness=idea.practical_usefulness_score,
            originality=idea.originality_score,
            innovation=idea.innovation_score,
            technical_feasibility=idea.technical_feasibility_score,
            portfolio_value=idea.portfolio_value_score,
            business_potential_score=idea.business_potential_score,
            development_effort=idea.development_effort_score,
            market_demand=idea.market_demand_score,
            overall_score=idea.overall_score,
        ))

    return ReportResponse(
        investigation_id=investigation_id,
        spark_summary=report_data.get("spark_summary"),
        research_findings=report_data.get("research_findings"),
        key_pain_points=report_data.get("key_pain_points"),
        root_cause_analysis=report_data.get("root_cause_analysis"),
        existing_solutions=report_data.get("existing_solutions"),
        market_gaps=report_data.get("market_gaps"),
        recommended_project=report_data.get("recommended_project"),
        suggested_mvp=report_data.get("suggested_mvp"),
        future_expansion=report_data.get("future_expansion"),
        risks=report_data.get("risks"),
        references=report_data.get("references"),
        project_ideas=project_ideas_out,
    )
