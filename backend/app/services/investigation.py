import asyncio
import json
import logging
import time

from app.store import update_status, set_report, schedule_cleanup
from app.websocket_manager import ws_manager
from app.workflow.graph import investigation_workflow
from app.database.engine import SessionFactory
from app.repositories.investigation import InvestigationRepository
from app.repositories.report import ReportRepository
from app.models.investigation import InvestigationStatus
from app.models.investigation_step import StepStatus
from app.models.pain_point import PainPoint
from app.models.root_cause import RootCause
from app.models.existing_solution import ExistingSolution
from app.models.market_gap import MarketGap
from app.models.project_idea import ProjectIdea

logger = logging.getLogger(__name__)

PIPELINE_STEPS = [
    "planning",
    "research",
    "pain_point_extraction",
    "root_cause_analysis",
    "solution_analysis",
    "market_gap_detection",
    "idea_generation",
    "evaluation",
    "report_generation",
]

STEP_NODE_MAP = {
    "planning": "planner",
    "research": "research_loop",
    "pain_point_extraction": "pain_point_extraction",
    "root_cause_analysis": "root_cause_analysis",
    "solution_analysis": "existing_solution_analysis",
    "market_gap_detection": "market_gap_detection",
    "idea_generation": "project_idea_generation",
    "evaluation": "evaluation",
    "report_generation": "report_generator",
}

NODE_STEP_MAP = {v: k for k, v in STEP_NODE_MAP.items()}


async def run_investigation(inv_id: str, problem_statement: str, db_inv_id: int | None = None):
    start_time = time.time()
    try:
        await ws_manager.broadcast_event(inv_id, "investigation_started", f"Starting investigation: {problem_statement[:100]}")
        update_status(inv_id, "researching")
        await ws_manager.broadcast_status(inv_id, "running", 0)

        completed_steps: dict[str, dict] = {}
        step_db_ids: dict[str, int] = {}
        _all_project_ideas: list[dict] = []
        _all_evaluations: list[dict] = []

        initial_state = {
            "investigation_id": inv_id,
            "problem_statement": problem_statement,
            "research_questions": [],
            "research_results": [],
            "all_evidence": [],
            "pain_points": [],
            "root_causes": [],
            "existing_solutions": [],
            "market_gaps": [],
            "insights": [],
            "competitors": [],
            "opportunities": [],
            "project_ideas": [],
            "evaluations": [],
            "report": {},
            "errors": [],
            "current_status": "pending",
        }
        if db_inv_id:
            _init_steps_db(db_inv_id)
        graph_input = initial_state

        total_steps = len(PIPELINE_STEPS)
        _all_project_ideas: list[dict] = []
        _all_evaluations: list[dict] = []

        if db_inv_id:
            _init_steps_db(db_inv_id)

        current_step_name: str | None = None
        async for step_output in investigation_workflow.astream(
            graph_input,
            stream_mode="updates",
            config={"configurable": {"thread_id": inv_id}},
        ):
            for node_name, output in step_output.items():
                step_name = NODE_STEP_MAP.get(node_name)
                if not step_name:
                    continue

                current_step_name = step_name
                step_idx = PIPELINE_STEPS.index(step_name)
                progress = int(((step_idx + 1) / total_steps) * 100)
                step_db_id = step_db_ids.get(step_name)

                try:
                    await _broadcast_step_start(inv_id, step_name, step_db_id)
                    await _mark_step_started(db_inv_id, step_name)
                    await ws_manager.broadcast_status(inv_id, "running", progress)

                    step_start = time.time()
                    await _handle_step_events(inv_id, node_name, output, db_inv_id)
                    step_time = int((time.time() - step_start) * 1000)

                    has_results = any(output.values())
                    if not has_results:
                        error_msg = f"{step_name} returned 0 results"
                        logger.warning(f"[{inv_id}] {error_msg}")
                        _mark_step_failed(db_inv_id, step_name, error_msg)
                        _persist_step_output(db_inv_id, step_name, output, step_time)
                        await _broadcast_step_complete(inv_id, step_name, step_time, step_db_id)
                        await ws_manager.broadcast_step_update(inv_id, {
                            "step_name": step_name, "status": "FAILED",
                            "error_message": error_msg, "db_id": step_db_id,
                        })
                        await ws_manager.broadcast_status(inv_id, "failed", None)
                        await ws_manager.broadcast_event(inv_id, "investigation_failed", error_msg)
                        raise RuntimeError(error_msg)

                    completed_steps[step_name] = {
                        "node": node_name,
                        "output": output,
                        "time_ms": step_time,
                    }

                    await _broadcast_step_complete(inv_id, step_name, step_time, step_db_id)
                    await ws_manager.broadcast_status(inv_id, "running", progress)

                    if db_inv_id:
                        step_db_ids[step_name] = _get_step_db_id(db_inv_id, step_name)
                        _persist_step_output(db_inv_id, step_name, output, step_time)

                    if node_name == "project_idea_generation":
                        _all_project_ideas = output.get("project_ideas", []) if output else []
                    elif node_name == "evaluation":
                        _all_evaluations = output.get("evaluations", []) if output else []
                except Exception as step_err:
                    error_msg = f"{step_name} failed: {step_err}"
                    logger.error(f"[{inv_id}] {error_msg}", exc_info=True)
                    _mark_step_failed(db_inv_id, step_name, str(step_err)[:500])
                    await ws_manager.broadcast_step_update(inv_id, {
                        "step_name": step_name,
                        "status": "FAILED",
                        "error_message": str(step_err)[:300],
                        "db_id": step_db_id,
                    })
                    await ws_manager.broadcast_status(inv_id, "failed", None)
                    await ws_manager.broadcast_event(inv_id, "investigation_failed", error_msg[:300])
                    raise

        if not completed_steps:
            raise RuntimeError("Workflow did not produce any output")

        all_completed = set(completed_steps.keys()) == set(PIPELINE_STEPS)
        if not all_completed:
            missing = set(PIPELINE_STEPS) - set(completed_steps.keys())
            raise RuntimeError(f"Incomplete pipeline. Missing: {missing}")

        project_ideas_out = _build_project_ideas(_all_project_ideas, _all_evaluations)

        report_step = completed_steps.get("report_generation", {})
        report_data = report_step.get("output", {}).get("report", {}) if report_step else {}
        if report_data:
            set_report(inv_id, report_data, project_ideas_out)

        total_time = time.time() - start_time
        update_status(inv_id, "completed")
        await ws_manager.broadcast_status(inv_id, "completed", 100)
        await ws_manager.broadcast_event(inv_id, "investigation_completed", "Investigation completed successfully")

        _persist_to_db(db_inv_id, completed_steps, project_ideas_out, InvestigationStatus.COMPLETED)

        logger.info(f"[{inv_id}] Completed in {total_time:.2f}s")
        schedule_cleanup(inv_id)

    except asyncio.TimeoutError:
        if current_step_name:
            _mark_step_failed(db_inv_id, current_step_name, "Investigation timed out")
            await ws_manager.broadcast_step_update(inv_id, {
                "step_name": current_step_name,
                "status": "FAILED",
                "error_message": "Investigation timed out",
                "db_id": step_db_ids.get(current_step_name),
            })
        logger.error(f"[{inv_id}] Timed out after {time.time() - start_time:.2f}s")
        update_status(inv_id, "failed")
        await ws_manager.broadcast_status(inv_id, "failed", None)
        await ws_manager.broadcast_event(inv_id, "investigation_failed", "Investigation timed out")
        _persist_status_only(db_inv_id, InvestigationStatus.FAILED)
        schedule_cleanup(inv_id)
    except Exception as e:
        if current_step_name:
            _mark_step_failed(db_inv_id, current_step_name, str(e)[:500])
            await ws_manager.broadcast_step_update(inv_id, {
                "step_name": current_step_name,
                "status": "FAILED",
                "error_message": str(e)[:300],
                "db_id": step_db_ids.get(current_step_name),
            })
        logger.error(f"[{inv_id}] Failed after {time.time() - start_time:.2f}s: {e}", exc_info=True)
        update_status(inv_id, "failed")
        await ws_manager.broadcast_status(inv_id, "failed", None)
        await ws_manager.broadcast_event(inv_id, "investigation_failed", str(e)[:300])
        _persist_status_only(db_inv_id, InvestigationStatus.FAILED)
        schedule_cleanup(inv_id)


def _build_project_ideas(project_ideas: list[dict], evaluations: list[dict]) -> list[dict]:
    eval_by_index = {}
    for ev in evaluations:
        idx = ev.get("index")
        if idx is not None:
            eval_by_index[idx] = ev

    ideas_out = []
    for i, idea in enumerate(project_ideas):
        ev = eval_by_index.get(i, {})
        scores = {
            "practical_usefulness_score": ev.get("practical_usefulness", 0) or 0,
            "originality_score": ev.get("originality", 0) or 0,
            "innovation_score": ev.get("innovation", 0) or 0,
            "technical_feasibility_score": ev.get("technical_feasibility", 0) or 0,
            "portfolio_value_score": ev.get("portfolio_value", 0) or 0,
            "business_potential_score": ev.get("business_potential", 0) or 0,
            "development_effort_score": ev.get("development_effort", 0) or 0,
            "market_demand_score": ev.get("market_demand", 0) or 0,
        }
        overall = ev.get("overall_score", 0) or sum(scores.values()) / 8
        ideas_out.append({
            "title": idea.get("title", "Project Idea"),
            "category": idea.get("category", ""),
            "elevator_pitch": idea.get("elevator_pitch", ""),
            "problem_solved": idea.get("problem_solved", ""),
            "target_users": idea.get("target_users", ""),
            "why_now": idea.get("why_now", ""),
            "supporting_evidence": idea.get("supporting_evidence", []),
            "technical_complexity": idea.get("technical_complexity", ""),
            "potential_impact": idea.get("potential_impact", ""),
            "business_potential": idea.get("business_potential", ""),
            "mvp_outline": idea.get("mvp_outline", ""),
            "future_expansion": idea.get("future_expansion", ""),
            "differentiation": idea.get("differentiation", ""),
            "pricing_model": idea.get("pricing_model", ""),
            **scores,
            "overall_score": overall,
        })
    return ideas_out


async def _broadcast_step_start(inv_id: str, step_name: str, step_db_id: int | None = None):
    await ws_manager.broadcast_step_update(inv_id, {
        "step_name": step_name,
        "status": "PROCESSING",
        "db_id": step_db_id,
    })
    await ws_manager.broadcast_event(inv_id, f"{step_name}_started", f"Starting: {step_name.replace('_', ' ').title()}")


async def _mark_step_started(db_inv_id: int | None, step_name: str):
    if db_inv_id is None:
        return
    try:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)
        step = inv_repo.get_step_by_name(db_inv_id, step_name)
        if step:
            inv_repo.update_step_status(step.id, StepStatus.PROCESSING)
            session.commit()
    except Exception as e:
        logger.error(f"Failed to mark step {step_name} as started: {e}")
    finally:
        if "session" in locals():
            session.close()


async def _broadcast_step_complete(inv_id: str, step_name: str, time_ms: int, step_db_id: int | None = None):
    await ws_manager.broadcast_step_update(inv_id, {
        "step_name": step_name,
        "status": "COMPLETED",
        "execution_time": time_ms,
        "db_id": step_db_id,
    })
    await ws_manager.broadcast_event(inv_id, f"{step_name}_completed", f"Completed: {step_name.replace('_', ' ').title()} ({time_ms}ms)")


async def _handle_step_events(inv_id: str, node_name: str, output: dict, db_inv_id: int | None = None):
    session = None
    inv_repo = None
    if db_inv_id:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)

    try:
        if node_name == "planner":
            questions = output.get("research_questions", [])
            await ws_manager.broadcast_event(inv_id, "questions_generated", f"Generated {len(questions)} research questions")
            for q in questions:
                await ws_manager.broadcast_event(inv_id, "research_question", q, metadata={"question": q})

        elif node_name == "research_loop":
            results = output.get("research_results", [])
            evidence = output.get("all_evidence", [])
            early_stopped = output.get("early_stopped", False)
            source_count = 0
            if inv_repo:
                for ev in evidence:
                    inv_repo.add_evidence(
                        db_inv_id,
                        title=ev.get("title", "Source")[:500],
                        url=ev.get("url", "")[:2048],
                        summary=ev.get("content", "")[:2000],
                        relevance_score=ev.get("relevance_score", 0.0),
                    )
                    source_count += 1
                session.commit()
                counts = inv_repo.get_artifact_counts(db_inv_id)
                await ws_manager.broadcast_artifact_count(inv_id, "sources", counts["sources"])
            else:
                source_count = len(evidence)
                await ws_manager.broadcast_event(inv_id, "search_completed", f"Collected {len(evidence)} sources from {len(results)} questions")
            if early_stopped:
                await ws_manager.broadcast_event(inv_id, "search_completed", "Evidence sufficient - stopping research early")
            for result in results:
                q = result.get("question", "")[:80]
                ev_count = len(result.get("evidence", []))
                status = result.get("status", "completed")
                if status == "completed":
                    await ws_manager.broadcast_event(inv_id, "sources_found", f"Found {ev_count} sources for: {q}")
                else:
                    await ws_manager.broadcast_event(inv_id, "search_failed", f"Search failed for: {q}")

        elif node_name == "pain_point_extraction":
            pain_points = output.get("pain_points", [])
            if inv_repo:
                for pp in pain_points:
                    desc = pp.get("description", str(pp))[:2000] if isinstance(pp, dict) else str(pp)[:2000]
                    sev = pp.get("severity", "") if isinstance(pp, dict) else ""
                    freq = pp.get("frequency", "") if isinstance(pp, dict) else ""
                    affected = pp.get("affected_users", "") if isinstance(pp, dict) else ""
                    inv_repo.add_pain_point(db_inv_id, desc, sev, freq, affected)
                    await ws_manager.broadcast_artifact_count(
                        inv_id, "pain_points",
                        inv_repo.session.query(PainPoint).filter(PainPoint.investigation_id == db_inv_id).count(),
                        desc[:120],
                    )
                session.commit()
            else:
                await ws_manager.broadcast_event(inv_id, "pain_points_extracted", f"Extracted {len(pain_points)} pain points")
            for pp in pain_points[:5]:
                desc = pp.get("description", str(pp))[:120] if isinstance(pp, dict) else str(pp)[:120]
                severity = pp.get("severity", "") if isinstance(pp, dict) else ""
                await ws_manager.broadcast_event(inv_id, "pain_point_found", f"[{severity}] {desc}" if severity else desc)

        elif node_name == "root_cause_analysis":
            root_causes = output.get("root_causes", [])
            if inv_repo:
                for rc in root_causes:
                    cause = rc.get("root_cause", str(rc))[:2000] if isinstance(rc, dict) else str(rc)[:2000]
                    depth = rc.get("depth") if isinstance(rc, dict) else None
                    explanation = rc.get("explanation", "") if isinstance(rc, dict) else ""
                    inv_repo.add_root_cause(db_inv_id, cause, depth, explanation)
                    await ws_manager.broadcast_artifact_count(
                        inv_id, "root_causes",
                        inv_repo.session.query(RootCause).filter(RootCause.investigation_id == db_inv_id).count(),
                        cause[:120],
                    )
                session.commit()
            else:
                await ws_manager.broadcast_event(inv_id, "root_causes_discovered", f"Identified {len(root_causes)} root causes")
            for rc in root_causes[:5]:
                cause = rc.get("root_cause", str(rc))[:120] if isinstance(rc, dict) else str(rc)[:120]
                depth = rc.get("depth", "") if isinstance(rc, dict) else ""
                await ws_manager.broadcast_event(inv_id, "root_cause_found", f"[Depth {depth}] {cause}" if depth else cause)

        elif node_name == "existing_solution_analysis":
            solutions = output.get("existing_solutions", [])
            if inv_repo:
                for sol in solutions:
                    name = sol.get("name", "Unknown")[:255] if isinstance(sol, dict) else str(sol)[:255]
                    cat = sol.get("category", "") if isinstance(sol, dict) else ""
                    strengths = sol.get("strengths", "") if isinstance(sol, dict) else ""
                    weaknesses = sol.get("weaknesses", "") if isinstance(sol, dict) else ""
                    missing = sol.get("missing_features", "") if isinstance(sol, dict) else ""
                    inv_repo.add_existing_solution(db_inv_id, name, cat, strengths, weaknesses, missing)
                    await ws_manager.broadcast_artifact_count(
                        inv_id, "solutions",
                        inv_repo.session.query(ExistingSolution).filter(ExistingSolution.investigation_id == db_inv_id).count(),
                        name,
                    )
                session.commit()
            else:
                await ws_manager.broadcast_event(inv_id, "existing_solutions_found", f"Found {len(solutions)} existing solutions")
            for sol in solutions[:4]:
                name = sol.get("name", "Unknown") if isinstance(sol, dict) else str(sol)[:80]
                category = sol.get("category", "") if isinstance(sol, dict) else ""
                await ws_manager.broadcast_event(inv_id, "existing_solution_found", f"{name} ({category})" if category else name)

        elif node_name == "market_gap_detection":
            gaps = output.get("market_gaps", [])
            if inv_repo:
                for gap in gaps:
                    desc = gap.get("description", str(gap))[:2000] if isinstance(gap, dict) else str(gap)[:2000]
                    underserved = gap.get("underserved_users", "") if isinstance(gap, dict) else ""
                    opp_type = gap.get("opportunity_type", "") if isinstance(gap, dict) else ""
                    potential = gap.get("potential", "") if isinstance(gap, dict) else ""
                    why_now = gap.get("why_now", "") if isinstance(gap, dict) else ""
                    inv_repo.add_market_gap(db_inv_id, desc, underserved, opp_type, potential, why_now)
                    await ws_manager.broadcast_artifact_count(
                        inv_id, "market_gaps",
                        inv_repo.session.query(MarketGap).filter(MarketGap.investigation_id == db_inv_id).count(),
                        desc[:120],
                    )
                session.commit()
            else:
                await ws_manager.broadcast_event(inv_id, "market_gaps_identified", f"Detected {len(gaps)} market gaps")
            for gap in gaps[:4]:
                desc = gap.get("description", str(gap))[:120] if isinstance(gap, dict) else str(gap)[:120]
                potential = gap.get("potential", "") if isinstance(gap, dict) else ""
                await ws_manager.broadcast_event(inv_id, "market_gap_found", f"[{potential}] {desc}" if potential else desc)

        elif node_name == "project_idea_generation":
            ideas = output.get("project_ideas", [])
            if inv_repo:
                for idea in ideas:
                    if not isinstance(idea, dict):
                        continue
                    inv_repo.add_project_idea(
                        db_inv_id,
                        title=idea.get("title", "Project Idea")[:255],
                        category=idea.get("category", ""),
                        elevator_pitch=idea.get("elevator_pitch", ""),
                        problem=idea.get("problem_solved", ""),
                        solution=idea.get("mvp_outline", ""),
                        target_customer=idea.get("target_users", ""),
                        why_now=idea.get("why_now", ""),
                        differentiation=idea.get("differentiation", ""),
                        mvp=idea.get("mvp_outline", ""),
                        pricing_model=idea.get("pricing_model", ""),
                        technical_complexity=idea.get("technical_complexity", ""),
                        potential_impact=idea.get("potential_impact", ""),
                        business_potential=idea.get("business_potential", ""),
                        future_expansion=idea.get("future_expansion", ""),
                    )
                    title = idea.get("title", "Project Idea")[:80]
                    await ws_manager.broadcast_artifact_count(
                        inv_id, "project_ideas",
                        inv_repo.session.query(ProjectIdea).filter(ProjectIdea.investigation_id == db_inv_id).count(),
                        title,
                    )
                session.commit()
            else:
                await ws_manager.broadcast_event(inv_id, "project_ideas_generated", f"Generated {len(ideas)} project ideas")
            for idea in ideas[:5]:
                title = idea.get("title", "Project Idea") if isinstance(idea, dict) else str(idea)[:80]
                category = idea.get("category", "") if isinstance(idea, dict) else ""
                await ws_manager.broadcast_event(inv_id, "project_idea", f"{title} ({category})" if category else title)

        elif node_name == "evaluation":
            evaluations = output.get("evaluations", [])
            await ws_manager.broadcast_event(inv_id, "evaluation_complete", f"Evaluated {len(evaluations)} project ideas")

        elif node_name == "report_generator":
            report_data = output.get("report", {})
            if report_data:
                set_report(inv_id, report_data, [])
                for section_key in [
                    "spark_summary", "research_findings", "key_pain_points",
                    "root_cause_analysis", "existing_solutions", "market_gaps",
                    "recommended_project", "suggested_mvp", "future_expansion",
                    "risks", "references",
                ]:
                    section_val = report_data.get(section_key)
                    if section_val:
                        await ws_manager.broadcast_report_section(inv_id, section_key, section_val)
            if inv_repo and report_data:
                try:
                    report_repo = ReportRepository(session)
                    report_repo.upsert(db_inv_id, report_data)
                    session.flush()
                except Exception as e:
                    logger.error(f"Failed to persist report for {db_inv_id}: {e}")
            await ws_manager.broadcast_event(inv_id, "report_generated", "Final investigation report is ready")

    finally:
        if session:
            session.close()


def _init_steps_db(db_inv_id: int):
    try:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)
        for step_name in PIPELINE_STEPS:
            existing = inv_repo.get_step_by_name(db_inv_id, step_name)
            if not existing:
                inv_repo.create_step(db_inv_id, step_name)
        session.commit()
    except Exception as e:
        logger.error(f"Failed to init steps for {db_inv_id}: {e}")
    finally:
        session.close()


def _get_step_db_id(db_inv_id: int, step_name: str) -> int | None:
    try:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)
        step = inv_repo.get_step_by_name(db_inv_id, step_name)
        session.close()
        return step.id if step else None
    except Exception:
        return None


def _persist_step_output(db_inv_id: int, step_name: str, output: dict, time_ms: int):
    try:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)
        step = inv_repo.get_step_by_name(db_inv_id, step_name)
        if step:
            inv_repo.update_step_status(
                step.id,
                StepStatus.COMPLETED,
                output_json=json.dumps(output, default=str),
                execution_time=time_ms,
            )
        session.commit()
    except Exception as e:
        logger.error(f"Failed to persist step output for {db_inv_id}/{step_name}: {e}")
    finally:
        session.close()


def _persist_to_db(db_inv_id: int | None, completed_steps: dict, ideas_out: list[dict], status: InvestigationStatus):
    if db_inv_id is None:
        return
    try:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)
        report_repo = ReportRepository(session)

        inv_repo.update_status(db_inv_id, status)

        planning_output = completed_steps.get("planning", {}).get("output", {})

        for i, q in enumerate(planning_output.get("research_questions", [])):
            inv_repo.add_research_question(db_inv_id, q, i)

        if ideas_out:
            inv_repo.update_project_idea_scores(db_inv_id, ideas_out)

        report_output = completed_steps.get("report_generation", {}).get("output", {})
        if report_output:
            report_output["project_ideas"] = ideas_out
            report_repo.upsert(db_inv_id, report_output)

        session.commit()
        logger.info(f"Persisted investigation {db_inv_id} to database")
    except Exception as e:
        logger.error(f"Failed to persist investigation {db_inv_id}: {e}", exc_info=True)
    finally:
        session.close()


def _persist_status_only(db_inv_id: int | None, status: InvestigationStatus):
    if db_inv_id is None:
        return
    try:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)
        inv_repo.update_status(db_inv_id, status)
        session.commit()
    except Exception as e:
        logger.error(f"Failed to persist status for {db_inv_id}: {e}")
    finally:
        session.close()


def _mark_step_failed(db_inv_id: int | None, step_name: str | None, error_message: str):
    if db_inv_id is None or step_name is None:
        return
    try:
        session = SessionFactory()
        inv_repo = InvestigationRepository(session)
        step = inv_repo.get_step_by_name(db_inv_id, step_name)
        if step:
            inv_repo.update_step_status(
                step.id,
                StepStatus.FAILED,
                error_message=error_message,
            )
        session.commit()
    except Exception as e:
        logger.error(f"Failed to mark step {step_name} as FAILED: {e}")
    finally:
        session.close()
