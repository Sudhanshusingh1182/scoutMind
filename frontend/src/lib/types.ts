export type InvestigationStatus =
  | "pending"
  | "researching"
  | "completed"
  | "failed"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type StepStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export interface Investigation {
  id: string;
  problem_statement: string;
  status: InvestigationStatus;
  event_count: number;
}

export interface InvestigationListItem {
  id: number;
  problem_statement: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  idea_count: number;
  source_count: number;
}

export type EventType =
  | "investigation_started"
  | "questions_generated"
  | "research_question"
  | "search_completed"
  | "sources_found"
  | "search_failed"
  | "pain_points_extracted"
  | "pain_point_found"
  | "root_causes_discovered"
  | "root_cause_found"
  | "existing_solutions_found"
  | "existing_solution_found"
  | "market_gaps_identified"
  | "market_gap_found"
  | "project_ideas_generated"
  | "project_idea"
  | "evaluation_complete"
  | "report_generated"
  | "investigation_completed"
  | "investigation_failed"
  | "planning_started"
  | "planning_completed"
  | "research_started"
  | "research_completed"
  | "pain_point_extraction_started"
  | "pain_point_extraction_completed"
  | "root_cause_analysis_started"
  | "root_cause_analysis_completed"
  | "solution_analysis_started"
  | "solution_analysis_completed"
  | "market_gap_detection_started"
  | "market_gap_detection_completed"
  | "idea_generation_started"
  | "idea_generation_completed"
  | "evaluation_started"
  | "evaluation_completed"
  | "report_generation_started"
  | "report_generation_completed"
  | "step_failed";

export interface InvestigationEvent {
  id: number;
  investigation_id: string;
  event_type: EventType;
  message: string;
  metadata: Record<string, unknown> | null;
}

export interface InvestigationStep {
  id: number;
  step_name: string;
  status: StepStatus;
  input_json: string | null;
  output_json: string | null;
  metadata_json: string | null;
  error_message: string | null;
  execution_time: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface InvestigationSummary {
  sources: number;
  pain_points: number;
  root_causes: number;
  solutions: number;
  market_gaps: number;
  project_ideas: number;
}

export interface ProjectIdea {
  title: string;
  category: string;
  elevator_pitch: string;
  problem_solved: string;
  target_users: string;
  why_now: string;
  supporting_evidence: Array<{ title: string; url: string; snippet: string }>;
  technical_complexity: string;
  potential_impact: string;
  business_potential: string;
  mvp_outline: string;
  future_expansion: string;
  differentiation: string;
  pricing_model: string;
  practical_usefulness: number;
  originality: number;
  innovation: number;
  technical_feasibility: number;
  portfolio_value: number;
  business_potential_score: number;
  development_effort: number;
  market_demand: number;
  overall_score: number;
}

export interface ReportData {
  investigation_id: string;
  spark_summary: string | null;
  research_findings: string[] | null;
  key_pain_points: Array<{
    description: string;
    severity: string;
    frequency: string;
    affected_users: string;
  }> | null;
  root_cause_analysis: Array<{
    root_cause: string;
    depth: number;
    explanation: string;
  }> | null;
  existing_solutions: Array<{
    name: string;
    category: string;
    strengths: string;
    weaknesses: string;
    missing_features: string;
  }> | null;
  market_gaps: Array<{
    description: string;
    underserved_users: string;
    opportunity_type: string;
    potential: string;
    why_now: string;
  }> | null;
  recommended_project: string | null;
  suggested_mvp: string | null;
  future_expansion: string | null;
  risks: string[] | null;
  references: Array<{ title: string; url: string }> | null;
  project_ideas: ProjectIdea[];
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  researching: "Investigating",
  completed: "Completed",
  failed: "Failed",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const STEP_LABELS: Record<string, string> = {
  planning: "Planning Research",
  research: "Gathering Evidence",
  pain_point_extraction: "Pain Point Analysis",
  root_cause_analysis: "Root Cause Analysis",
  solution_analysis: "Solution Analysis",
  market_gap_detection: "Market Gap Detection",
  idea_generation: "Idea Generation",
  evaluation: "Evaluation",
  report_generation: "Report Generation",
};

export const STEP_STATUS_COLORS: Record<StepStatus, string> = {
  PENDING: "#475569",
  QUEUED: "#64748b",
  PROCESSING: "#f59e0b",
  COMPLETED: "#FF8A00",
  FAILED: "#ef4444",
  SKIPPED: "#64748b",
};

export const EVENT_LABELS: Record<EventType, string> = {
  investigation_started: "Investigation Started",
  questions_generated: "Questions Generated",
  research_question: "Research Question",
  search_completed: "Search Completed",
  sources_found: "Sources Found",
  search_failed: "Search Failed",
  pain_points_extracted: "Pain Points Extracted",
  pain_point_found: "Pain Point",
  root_causes_discovered: "Root Causes Discovered",
  root_cause_found: "Root Cause",
  existing_solutions_found: "Solutions Found",
  existing_solution_found: "Existing Solution",
  market_gaps_identified: "Market Gaps Identified",
  market_gap_found: "Market Gap",
  project_ideas_generated: "Project Ideas Generated",
  project_idea: "Project Idea",
  evaluation_complete: "Evaluation Complete",
  report_generated: "Report Generated",
  investigation_completed: "Investigation Complete",
  investigation_failed: "Investigation Failed",
  planning_started: "Planning Started",
  planning_completed: "Planning Complete",
  research_started: "Research Started",
  research_completed: "Research Complete",
  pain_point_extraction_started: "Pain Point Analysis Started",
  pain_point_extraction_completed: "Pain Point Analysis Complete",
  root_cause_analysis_started: "Root Cause Analysis Started",
  root_cause_analysis_completed: "Root Cause Analysis Complete",
  solution_analysis_started: "Solution Analysis Started",
  solution_analysis_completed: "Solution Analysis Complete",
  market_gap_detection_started: "Market Gap Detection Started",
  market_gap_detection_completed: "Market Gap Detection Complete",
  idea_generation_started: "Idea Generation Started",
  idea_generation_completed: "Idea Generation Complete",
  evaluation_started: "Evaluation Started",
  evaluation_completed: "Evaluation Complete",
  report_generation_started: "Report Generation Started",
  report_generation_completed: "Report Generation Complete",
  step_failed: "Step Failed",
};

export const EVENT_ICONS: Record<EventType, string> = {
  investigation_started: ">",
  questions_generated: "?",
  research_question: "?",
  search_completed: "ok",
  sources_found: "+",
  search_failed: "x",
  pain_points_extracted: "!",
  pain_point_found: "!",
  root_causes_discovered: ">>",
  root_cause_found: ">>",
  existing_solutions_found: "<>",
  existing_solution_found: "<>",
  market_gaps_identified: "??",
  market_gap_found: "??",
  project_ideas_generated: "**",
  project_idea: "**",
  evaluation_complete: "##",
  report_generated: "@@",
  investigation_completed: "done",
  investigation_failed: "fail",
  planning_started: ">",
  planning_completed: "ok",
  research_started: ">",
  research_completed: "ok",
  pain_point_extraction_started: ">",
  pain_point_extraction_completed: "ok",
  root_cause_analysis_started: ">",
  root_cause_analysis_completed: "ok",
  solution_analysis_started: ">",
  solution_analysis_completed: "ok",
  market_gap_detection_started: ">",
  market_gap_detection_completed: "ok",
  idea_generation_started: ">",
  idea_generation_completed: "ok",
  evaluation_started: ">",
  evaluation_completed: "ok",
  report_generation_started: ">",
  report_generation_completed: "ok",
  step_failed: "x",
};

export const EVENT_COLORS: Record<EventType, string> = {
  investigation_started: "#60a5fa",
  questions_generated: "#8b5cf6",
  research_question: "#8b5cf6",
  search_completed: "#f59e0b",
  sources_found: "#94a3b8",
  search_failed: "#ef4444",
  pain_points_extracted: "#f97316",
  pain_point_found: "#f97316",
  root_causes_discovered: "#ef4444",
  root_cause_found: "#ef4444",
  existing_solutions_found: "#06b6d4",
  existing_solution_found: "#06b6d4",
  market_gaps_identified: "#eab308",
  market_gap_found: "#eab308",
  project_ideas_generated: "#f59e0b",
  project_idea: "#f59e0b",
  evaluation_complete: "#a855f7",
  report_generated: "#60a5fa",
  investigation_completed: "#f59e0b",
  investigation_failed: "#ef4444",
  planning_started: "#8b5cf6",
  planning_completed: "#8b5cf6",
  research_started: "#f59e0b",
  research_completed: "#f59e0b",
  pain_point_extraction_started: "#f97316",
  pain_point_extraction_completed: "#f97316",
  root_cause_analysis_started: "#ef4444",
  root_cause_analysis_completed: "#ef4444",
  solution_analysis_started: "#06b6d4",
  solution_analysis_completed: "#06b6d4",
  market_gap_detection_started: "#eab308",
  market_gap_detection_completed: "#eab308",
  idea_generation_started: "#f59e0b",
  idea_generation_completed: "#f59e0b",
  evaluation_started: "#a855f7",
  evaluation_completed: "#a855f7",
  report_generation_started: "#60a5fa",
  report_generation_completed: "#60a5fa",
  step_failed: "#ef4444",
};

export const PIPELINE_STEPS = [
  "planning",
  "research",
  "pain_point_extraction",
  "root_cause_analysis",
  "solution_analysis",
  "market_gap_detection",
  "idea_generation",
  "evaluation",
  "report_generation",
] as const;

export const PIPELINE_STEP_LABELS: Record<string, { title: string; subtitle: string }> = {
  planning: { title: "Spark", subtitle: "Planning research strategy" },
  research: { title: "Research", subtitle: "Gathering information" },
  pain_point_extraction: { title: "Sources", subtitle: "Sources discovered" },
  root_cause_analysis: { title: "Pain Points", subtitle: "Pain points identified" },
  solution_analysis: { title: "Root Causes", subtitle: "Root causes analyzed" },
  market_gap_detection: { title: "Solutions", subtitle: "Solutions evaluated" },
  idea_generation: { title: "Market Gaps", subtitle: "Market gaps detected" },
  evaluation: { title: "Project Ideas", subtitle: "Ideas generated & scored" },
  report_generation: { title: "Recommendation", subtitle: "Final recommendation" },
};

export const EVENT_TYPE_TO_ICONS: Record<string, string> = {
  investigation_started: "Play",
  questions_generated: "Search",
  research_question: "Search",
  search_completed: "Search",
  sources_found: "FileText",
  search_failed: "AlertTriangle",
  pain_points_extracted: "AlertTriangle",
  pain_point_found: "AlertTriangle",
  root_causes_discovered: "GitBranch",
  root_cause_found: "GitBranch",
  existing_solutions_found: "TrendingUp",
  existing_solution_found: "TrendingUp",
  market_gaps_identified: "Compass",
  market_gap_found: "Compass",
  project_ideas_generated: "Trophy",
  project_idea: "Trophy",
  evaluation_complete: "BarChart3",
  report_generated: "FileText",
  investigation_completed: "CheckCircle",
  investigation_failed: "XCircle",
  planning_started: "Brain",
  planning_completed: "Brain",
  research_started: "Search",
  research_completed: "Search",
  pain_point_extraction_started: "AlertTriangle",
  pain_point_extraction_completed: "AlertTriangle",
  root_cause_analysis_started: "GitBranch",
  root_cause_analysis_completed: "GitBranch",
  solution_analysis_started: "TrendingUp",
  solution_analysis_completed: "TrendingUp",
  market_gap_detection_started: "Compass",
  market_gap_detection_completed: "Compass",
  idea_generation_started: "Lightbulb",
  idea_generation_completed: "Lightbulb",
  evaluation_started: "BarChart3",
  evaluation_completed: "BarChart3",
  report_generation_started: "FileText",
  report_generation_completed: "FileText",
  step_failed: "XCircle",
};
