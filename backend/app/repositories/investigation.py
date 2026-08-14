import json
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone
from typing import Optional

from app.models.investigation import Investigation, InvestigationStatus
from app.models.investigation_step import InvestigationStep, StepStatus
from app.models.research_question import ResearchQuestion
from app.models.evidence import Evidence
from app.models.pain_point import PainPoint
from app.models.root_cause import RootCause
from app.models.existing_solution import ExistingSolution
from app.models.market_gap import MarketGap
from app.models.project_idea import ProjectIdea


def _to_str(val) -> str:
    if isinstance(val, list):
        return json.dumps(val, ensure_ascii=False)
    if val is None:
        return ""
    return str(val)


class InvestigationRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, inv_id: int) -> Investigation | None:
        return self.session.query(Investigation).filter(Investigation.id == inv_id).first()

    def get_by_user_id(self, user_id: int, limit: int = 50, offset: int = 0, search: str | None = None):
        q = self.session.query(Investigation).filter(Investigation.user_id == user_id)
        if search:
            q = q.filter(Investigation.problem_statement.ilike(f"%{search}%"))
        q = q.order_by(desc(Investigation.created_at)).limit(limit).offset(offset)
        return q.all()

    def count_by_user(self, user_id: int, search: str | None = None) -> int:
        q = self.session.query(Investigation).filter(Investigation.user_id == user_id)
        if search:
            q = q.filter(Investigation.problem_statement.ilike(f"%{search}%"))
        return q.count()

    def create(self, user_id: int, problem_statement: str) -> Investigation:
        inv = Investigation(
            user_id=user_id,
            problem_statement=problem_statement,
            status=InvestigationStatus.RUNNING,
        )
        self.session.add(inv)
        self.session.flush()
        return inv

    def update_status(self, inv_id: int, status: InvestigationStatus):
        inv = self.get_by_id(inv_id)
        if inv:
            inv.status = status
            if status == InvestigationStatus.COMPLETED:
                inv.completed_at = datetime.now(timezone.utc)

    def delete(self, inv_id: int, user_id: int) -> bool:
        inv = self.session.query(Investigation).filter(
            Investigation.id == inv_id,
            Investigation.user_id == user_id,
        ).first()
        if not inv:
            return False
        self.session.delete(inv)
        return True

    def add_research_question(self, inv_id: int, question: str, order_index: int) -> ResearchQuestion:
        rq = ResearchQuestion(
            investigation_id=inv_id,
            question=question,
            order_index=order_index,
            status="pending",
        )
        self.session.add(rq)
        self.session.flush()
        return rq

    def add_evidence(self, inv_id: int, title: str, url: str, summary: str,
                     relevance_score: float, question_id: int | None = None) -> Evidence:
        ev = Evidence(
            investigation_id=inv_id,
            research_question_id=question_id,
            title=title,
            url=url,
            summary=summary,
            relevance_score=relevance_score,
        )
        self.session.add(ev)
        self.session.flush()
        return ev

    def add_project_idea(self, inv_id: int, title: str, category: str = "",
                         elevator_pitch: str = "", problem: str = "",
                         solution: str = "", target_customer: str = "",
                         why_now: str = "", differentiation: str = "",
                         mvp: str = "", pricing_model: str = "",
                         technical_complexity: str = "", potential_impact: str = "",
                         business_potential: str = "", future_expansion: str = "",
                         practical_usefulness_score: int = 0,
                         originality_score: int = 0,
                         innovation_score: int = 0,
                         technical_feasibility_score: int = 0,
                         portfolio_value_score: int = 0,
                         business_potential_score: int = 0,
                         development_effort_score: int = 0,
                         market_demand_score: int = 0,
                         overall_score: int = 0) -> ProjectIdea:
        idea = ProjectIdea(
            investigation_id=inv_id,
            title=title[:255],
            category=category,
            elevator_pitch=elevator_pitch[:1000],
            problem=problem[:2000],
            solution=solution[:2000],
            target_customer=target_customer[:500],
            why_now=why_now[:1000],
            differentiation=differentiation[:2000],
            mvp=mvp[:2000],
            pricing_model=pricing_model[:500],
            technical_complexity=technical_complexity,
            potential_impact=potential_impact,
            business_potential=business_potential,
            future_expansion=future_expansion[:2000],
            practical_usefulness_score=practical_usefulness_score,
            originality_score=originality_score,
            innovation_score=innovation_score,
            technical_feasibility_score=technical_feasibility_score,
            portfolio_value_score=portfolio_value_score,
            business_potential_score=business_potential_score,
            development_effort_score=development_effort_score,
            market_demand_score=market_demand_score,
            overall_score=overall_score,
        )
        self.session.add(idea)
        self.session.flush()
        return idea

    def update_project_idea_scores(self, inv_id: int, ideas_with_scores: list[dict]):
        existing = self.session.query(ProjectIdea).filter(
            ProjectIdea.investigation_id == inv_id
        ).order_by(ProjectIdea.id).all()

        for i, idea_db in enumerate(existing):
            if i >= len(ideas_with_scores):
                break
            ev = ideas_with_scores[i]
            idea_db.practical_usefulness_score = int(ev.get("practical_usefulness_score", 0) or 0)
            idea_db.originality_score = int(ev.get("originality_score", 0) or 0)
            idea_db.innovation_score = int(ev.get("innovation_score", 0) or 0)
            idea_db.technical_feasibility_score = int(ev.get("technical_feasibility_score", 0) or 0)
            idea_db.portfolio_value_score = int(ev.get("portfolio_value_score", 0) or 0)
            idea_db.business_potential_score = int(ev.get("business_potential_score", 0) or 0)
            idea_db.development_effort_score = int(ev.get("development_effort_score", 0) or 0)
            idea_db.market_demand_score = int(ev.get("market_demand_score", 0) or 0)
            idea_db.overall_score = int(ev.get("overall_score", 0) or 0)
        self.session.flush()

    def create_step(self, inv_id: int, step_name: str) -> InvestigationStep:
        step = InvestigationStep(
            investigation_id=inv_id,
            step_name=step_name,
            status=StepStatus.PENDING,
        )
        self.session.add(step)
        self.session.flush()
        return step

    def get_steps(self, inv_id: int) -> list[InvestigationStep]:
        return self.session.query(InvestigationStep).filter(
            InvestigationStep.investigation_id == inv_id
        ).order_by(InvestigationStep.id).all()

    def get_step_by_name(self, inv_id: int, step_name: str) -> InvestigationStep | None:
        return self.session.query(InvestigationStep).filter(
            InvestigationStep.investigation_id == inv_id,
            InvestigationStep.step_name == step_name,
        ).first()

    def get_last_completed_step(self, inv_id: int) -> InvestigationStep | None:
        return self.session.query(InvestigationStep).filter(
            InvestigationStep.investigation_id == inv_id,
            InvestigationStep.status == StepStatus.COMPLETED,
        ).order_by(desc(InvestigationStep.id)).first()

    def update_step_status(
        self,
        step_id: int,
        status: StepStatus,
        input_json: str | None = None,
        output_json: str | None = None,
        metadata_json: str | None = None,
        error_message: str | None = None,
        execution_time: int | None = None,
    ):
        step = self.session.query(InvestigationStep).filter(InvestigationStep.id == step_id).first()
        if not step:
            return
        step.status = status
        if status == StepStatus.PROCESSING and not step.started_at:
            step.started_at = datetime.now(timezone.utc)
        if status in (StepStatus.COMPLETED, StepStatus.FAILED):
            step.completed_at = datetime.now(timezone.utc)
        if input_json is not None:
            step.input_json = input_json
        if output_json is not None:
            step.output_json = output_json
        if metadata_json is not None:
            step.metadata_json = metadata_json
        if error_message is not None:
            step.error_message = error_message
        if execution_time is not None:
            step.execution_time = execution_time
        self.session.flush()

    def add_pain_point(self, inv_id: int, description: str, severity: str = "",
                       frequency: str = "", affected_users: str = "") -> PainPoint:
        pp = PainPoint(
            investigation_id=inv_id,
            description=description[:2000],
            severity=severity[:50] if severity else "",
            frequency=frequency[:50] if frequency else "",
            affected_users=_to_str(affected_users)[:500],
        )
        self.session.add(pp)
        self.session.flush()
        return pp

    def add_root_cause(self, inv_id: int, root_cause: str, depth: int | None = None,
                       explanation: str = "") -> RootCause:
        rc = RootCause(
            investigation_id=inv_id,
            root_cause=root_cause[:2000],
            depth=depth,
            explanation=_to_str(explanation)[:2000],
        )
        self.session.add(rc)
        self.session.flush()
        return rc

    def add_existing_solution(self, inv_id: int, name: str, category: str = "",
                              strengths: str = "", weaknesses: str = "",
                              missing_features: str = "") -> ExistingSolution:
        sol = ExistingSolution(
            investigation_id=inv_id,
            name=name[:255],
            category=category[:100] if category else "",
            strengths=_to_str(strengths)[:2000],
            weaknesses=_to_str(weaknesses)[:2000],
            missing_features=_to_str(missing_features)[:2000],
        )
        self.session.add(sol)
        self.session.flush()
        return sol

    def add_market_gap(self, inv_id: int, description: str, underserved_users: str = "",
                       opportunity_type: str = "", potential: str = "",
                       why_now: str = "") -> MarketGap:
        gap = MarketGap(
            investigation_id=inv_id,
            description=description[:2000],
            underserved_users=_to_str(underserved_users)[:500],
            opportunity_type=opportunity_type[:100] if opportunity_type else "",
            potential=potential[:100] if potential else "",
            why_now=_to_str(why_now)[:2000],
        )
        self.session.add(gap)
        self.session.flush()
        return gap

    def get_artifact_counts(self, inv_id: int) -> dict:
        return {
            "sources": self.session.query(Evidence).filter(Evidence.investigation_id == inv_id).count(),
            "pain_points": self.session.query(PainPoint).filter(PainPoint.investigation_id == inv_id).count(),
            "root_causes": self.session.query(RootCause).filter(RootCause.investigation_id == inv_id).count(),
            "solutions": self.session.query(ExistingSolution).filter(ExistingSolution.investigation_id == inv_id).count(),
            "market_gaps": self.session.query(MarketGap).filter(MarketGap.investigation_id == inv_id).count(),
            "project_ideas": self.session.query(ProjectIdea).filter(ProjectIdea.investigation_id == inv_id).count(),
            "events": self.session.query(InvestigationStep).filter(
                InvestigationStep.investigation_id == inv_id,
                InvestigationStep.status == StepStatus.COMPLETED,
            ).count(),
        }
