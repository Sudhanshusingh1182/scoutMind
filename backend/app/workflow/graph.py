import logging
from langgraph.graph import StateGraph, START, END

from app.workflow.state import InvestigationState
from app.services.research.planner import run_planner
from app.services.research.research_loop import run_research_loop
from app.services.research.pain_point_extractor import run_pain_point_extraction
from app.services.research.root_cause_agent import run_root_cause_analysis
from app.services.research.existing_solution_agent import run_existing_solution_analysis
from app.services.research.market_gap_agent import run_market_gap_detection
from app.services.research.idea_generator import run_idea_generation
from app.services.research.evaluation_agent import run_evaluation
from app.services.research.report_generator import run_report_generator

logger = logging.getLogger(__name__)

NODE_STEP_MAP = {
    "planner": "planning",
    "research_loop": "research",
    "pain_point_extraction": "pain_point_extraction",
    "root_cause_analysis": "root_cause_analysis",
    "existing_solution_analysis": "solution_analysis",
    "market_gap_detection": "market_gap_detection",
    "project_idea_generation": "idea_generation",
    "evaluation": "evaluation",
    "report_generator": "report_generation",
}


async def planner_node(state: InvestigationState) -> dict:
    logger.info(f"[Planner] Breaking down spark: {state['problem_statement'][:80]}")
    questions = await run_planner(state["problem_statement"])
    return {"research_questions": questions, "current_status": "researching"}


async def research_loop_node(state: InvestigationState) -> dict:
    questions = state.get("research_questions", [])
    logger.info(f"[ResearchLoop] Processing {len(questions)} research questions")
    result = await run_research_loop(questions)
    if result.get("early_stopped"):
        logger.info("[ResearchLoop] Early stopping triggered — evidence sufficient")
    return result


async def pain_point_extraction_node(state: InvestigationState) -> dict:
    evidence = state.get("all_evidence", [])
    problem_statement = state["problem_statement"]
    logger.info(f"[PainPointExtractor] Analyzing {len(evidence)} evidence items")
    pain_points = await run_pain_point_extraction(problem_statement, evidence)
    return {"pain_points": pain_points, "current_status": "analyzing_pain_points"}


async def root_cause_node(state: InvestigationState) -> dict:
    pain_points = state.get("pain_points", [])
    evidence = state.get("all_evidence", [])
    problem_statement = state["problem_statement"]
    logger.info(f"[RootCause] Analyzing {len(pain_points)} pain points")
    root_causes = await run_root_cause_analysis(problem_statement, pain_points, evidence)
    return {"root_causes": root_causes, "current_status": "analyzing_root_causes"}


async def existing_solution_node(state: InvestigationState) -> dict:
    evidence = state.get("all_evidence", [])
    problem_statement = state["problem_statement"]
    logger.info(f"[ExistingSolution] Analyzing existing solutions from {len(evidence)} evidence items")
    solutions = await run_existing_solution_analysis(problem_statement, evidence)
    return {"existing_solutions": solutions, "current_status": "analyzing_solutions"}


async def market_gap_node(state: InvestigationState) -> dict:
    pain_points = state.get("pain_points", [])
    root_causes = state.get("root_causes", [])
    existing_solutions = state.get("existing_solutions", [])
    evidence = state.get("all_evidence", [])
    problem_statement = state["problem_statement"]
    logger.info(f"[MarketGap] Detecting gaps from {len(pain_points)} pain points, {len(root_causes)} root causes, {len(existing_solutions)} solutions")
    gaps = await run_market_gap_detection(problem_statement, pain_points, root_causes, existing_solutions, evidence)
    return {"market_gaps": gaps, "current_status": "detecting_gaps"}


async def idea_generation_node(state: InvestigationState) -> dict:
    pain_points = state.get("pain_points", [])
    root_causes = state.get("root_causes", [])
    existing_solutions = state.get("existing_solutions", [])
    market_gaps = state.get("market_gaps", [])
    evidence = state.get("all_evidence", [])
    problem_statement = state["problem_statement"]
    logger.info(f"[IdeaGenerator] Generating ideas from {len(market_gaps)} market gaps")
    ideas = await run_idea_generation(problem_statement, pain_points, root_causes, existing_solutions, market_gaps, evidence)
    return {"project_ideas": ideas, "current_status": "generating_ideas"}


async def evaluation_node(state: InvestigationState) -> dict:
    ideas = state.get("project_ideas", [])
    logger.info(f"[Evaluation] Scoring {len(ideas)} project ideas")
    evaluations = await run_evaluation(ideas)
    return {"evaluations": evaluations, "current_status": "evaluating"}


async def report_generator_node(state: InvestigationState) -> dict:
    problem_statement = state["problem_statement"]
    pain_points = state.get("pain_points", [])
    root_causes = state.get("root_causes", [])
    existing_solutions = state.get("existing_solutions", [])
    market_gaps = state.get("market_gaps", [])
    project_ideas = state.get("project_ideas", [])
    evidence = state.get("all_evidence", [])
    logger.info(f"[ReportGenerator] Generating final report")
    report = await run_report_generator(
        problem_statement, pain_points, root_causes,
        existing_solutions, market_gaps, project_ideas, evidence,
    )
    return {"report": report, "current_status": "completed"}


def build_investigation_graph():
    graph = StateGraph(InvestigationState)

    graph.add_node("planner", planner_node)
    graph.add_node("research_loop", research_loop_node)
    graph.add_node("pain_point_extraction", pain_point_extraction_node)
    graph.add_node("root_cause_analysis", root_cause_node)
    graph.add_node("existing_solution_analysis", existing_solution_node)
    graph.add_node("market_gap_detection", market_gap_node)
    graph.add_node("project_idea_generation", idea_generation_node)
    graph.add_node("evaluation", evaluation_node)
    graph.add_node("report_generator", report_generator_node)

    graph.add_edge(START, "planner")
    graph.add_edge("planner", "research_loop")
    graph.add_edge("research_loop", "pain_point_extraction")
    graph.add_edge("pain_point_extraction", "root_cause_analysis")
    graph.add_edge("root_cause_analysis", "existing_solution_analysis")
    graph.add_edge("existing_solution_analysis", "market_gap_detection")
    graph.add_edge("market_gap_detection", "project_idea_generation")
    graph.add_edge("project_idea_generation", "evaluation")
    graph.add_edge("evaluation", "report_generator")
    graph.add_edge("report_generator", END)

    compiled = graph.compile()
    return compiled


investigation_workflow = build_investigation_graph()
