"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  InvestigationProvider,
  useInvestigation,
} from "@/providers/investigation-provider";
import { useAuth } from "@/lib/auth-context";
import {
  PIPELINE_STEPS,
  STEP_STATUS_COLORS,
  STATUS_LABELS,
  type InvestigationStep,
} from "@/lib/types";
import {
  CheckCircle2,
  XCircle, Loader2, ListChecks, FileText, Activity,
} from "lucide-react";
import ScoutMindLogo from "@/components/layout/scoutmind-logo";
import StepOutput from "./StepOutput";
import LiveActivityFeed from "./LiveActivityFeed";

const STAGE_META: Record<string, { title: string }> = {
  planning: { title: "Planning" },
  research: { title: "Research" },
  pain_point_extraction: { title: "Pain Point Analysis" },
  root_cause_analysis: { title: "Root Cause Analysis" },
  solution_analysis: { title: "Solution Analysis" },
  market_gap_detection: { title: "Market Gap Detection" },
  idea_generation: { title: "Idea Generation" },
  evaluation: { title: "Evaluation" },
  report_generation: { title: "Report Generation" },
};

const AGENT_META: Record<string, string> = {
  planning: "Planner Agent",
  research: "Research Agent",
  pain_point_extraction: "Pain Point Agent",
  root_cause_analysis: "Root Cause Agent",
  solution_analysis: "Solution Analysis Agent",
  market_gap_detection: "Market Gap Agent",
  idea_generation: "Idea Generation Agent",
  evaluation: "Evaluation Agent",
  report_generation: "Report Agent",
};

const STEP_STATUS_TEXT: Record<string, string> = {
  PENDING: "Pending",
  QUEUED: "Queued",
  PROCESSING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
  SKIPPED: "Skipped",
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const totalSecs = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
  const s = String(totalSecs % 60).padStart(2, "0");
  const leftoverMs = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s}.${leftoverMs}`;
}

function getOutputCount(stepName: string, outputJson: string | null): number {
  if (!outputJson) return 0;
  try {
    const data = JSON.parse(outputJson);
    switch (stepName) {
      case "planning":
        return Array.isArray(data.research_questions) ? data.research_questions.length : 0;
      case "research":
        return Array.isArray(data.all_evidence)
          ? data.all_evidence.length
          : Array.isArray(data.research_results)
            ? data.research_results.length
            : 0;
      case "pain_point_extraction":
        return Array.isArray(data.pain_points) ? data.pain_points.length : 0;
      case "root_cause_analysis":
        return Array.isArray(data.root_causes) ? data.root_causes.length : 0;
      case "solution_analysis":
      case "solution_comparison":
        return Array.isArray(data.existing_solutions) ? data.existing_solutions.length : 0;
      case "market_gap_detection":
        return Array.isArray(data.market_gaps) ? data.market_gaps.length : 0;
      case "idea_generation":
        return Array.isArray(data.project_ideas) ? data.project_ideas.length : 0;
      case "evaluation":
        return Array.isArray(data.evaluations) ? data.evaluations.length : 0;
      case "report_generation":
        return Object.keys(data.report || {}).length;
      default:
        return 0;
    }
  } catch {
    return 0;
  }
}

function StepDetailModal({
  step,
  stepName,
  title,
  agent,
  onClose,
}: {
  step: InvestigationStep;
  stepName: string;
  title: string;
  agent: string;
  onClose: () => void;
}) {
  const outputCount = getOutputCount(stepName, step.output_json);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-title">{title}</span>
            <span className="modal-agent">{agent}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <XCircle size={14} />
          </button>
        </div>

        <div className="modal-stats">
          <div className="modal-stat">
            <span className="modal-stat-label">Results Generated</span>
            <span className="modal-stat-value">{outputCount}</span>
          </div>
          <div className="modal-stat">
            <span className="modal-stat-label">Execution Time</span>
            <span className="modal-stat-value">{formatDuration(step.execution_time)}</span>
          </div>
          <div className="modal-stat">
            <span className="modal-stat-label">Started</span>
            <span className="modal-stat-value">{formatTime(step.started_at)}</span>
          </div>
          <div className="modal-stat">
            <span className="modal-stat-label">Completed</span>
            <span className="modal-stat-value">{formatTime(step.completed_at)}</span>
          </div>
        </div>

        <div className="modal-body">
          {step.input_json && (
            <div className="modal-block">
              <span className="modal-block-label">Input</span>
              <pre className="modal-block-pre">
                {JSON.stringify(JSON.parse(step.input_json), null, 2)}
              </pre>
            </div>
          )}
          {step.output_json && (
            <div className="modal-block">
              <span className="modal-block-label">Output</span>
              <StepOutput stepName={stepName} json={step.output_json} />
            </div>
          )}
          {step.metadata_json && (
            <div className="modal-block">
              <span className="modal-block-label">Metadata</span>
              <pre className="modal-block-pre">
                {JSON.stringify(JSON.parse(step.metadata_json), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestigationContent({ investigationId }: { investigationId: string }) {
  const {
    status, connected, progress, problemStatement,
    steps,
  } = useInvestigation();
  const router = useRouter();

  const [modalStep, setModalStep] = useState<string | null>(null);

  const isCompleted = status === "completed" || status === "COMPLETED";

  const completedCount = useMemo(
    () => steps.filter((s) => s.status === "COMPLETED").length,
    [steps]
  );

  const progressPct = useMemo(() => {
    if (typeof progress === "number" && progress > 0) return progress;
    return Math.round((completedCount / PIPELINE_STEPS.length) * 100);
  }, [progress, completedCount]);

  const currentStage = useMemo(() => {
    const active = steps.find((s) => s.status === "PROCESSING");
    if (active) return STAGE_META[active.step_name]?.title ?? active.step_name;
    const lastCompleted = [...steps]
      .reverse()
      .find((s) => s.status === "COMPLETED");
    if (lastCompleted)
      return STAGE_META[lastCompleted.step_name]?.title ?? lastCompleted.step_name;
    return "—";
  }, [steps]);

  const stageData = useMemo(
    () =>
      PIPELINE_STEPS.map((stepName) => {
        const step = steps.find((s) => s.step_name === stepName);
        return {
          stepName,
          step,
          title: STAGE_META[stepName]?.title ?? stepName,
          status: (step?.status ?? "PENDING") as InvestigationStep["status"],
          agent: AGENT_META[stepName] ?? "Agent",
        };
      }),
    [steps]
  );

  const statusLabel = STATUS_LABELS[status] ?? status;
  const currentModalStep = modalStep
    ? stageData.find((s) => s.stepName === modalStep)
    : null;

  return (
    <div className="dash">
      <header className="dash-topbar">
        <div className="dash-brand">
          <Link href="/" className="header-logo">
            <ScoutMindLogo size={32} />
            <span>Scout<span className="text-gradient-orange">Mind</span></span>
          </Link>
        </div>
        <div className="dash-problem" title={problemStatement}>
          {problemStatement || "Investigation"}
        </div>
        <div className="dash-topbar-actions">
          {isCompleted && (
            <button
              className="dash-report-btn"
              onClick={() => router.push(`/report/${investigationId}`)}
            >
              <FileText size={13} /> View Report
            </button>
          )}
          <div className={`dash-statuspill ${connected ? "live" : ""}`}>
            <span className="dash-statuspill-dot" />
            {connected ? "Live" : "Offline"}
          </div>
        </div>
      </header>

      <section className="dash-progress">
        <div className="dash-progress-head">
          <span className="dash-section-label">Investigation Progress</span>
          <span className="dash-progress-pct">{progressPct}%</span>
        </div>
        <div className="dash-bar">
          <div className="dash-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="dash-meta">
          <div className="dash-meta-item">
            <span className="dash-meta-label">Current Stage</span>
            <span className="dash-meta-value">{currentStage}</span>
          </div>
          <div className="dash-meta-item">
            <span className="dash-meta-label">Status</span>
            <span className="dash-meta-value">{statusLabel}</span>
          </div>
        </div>
      </section>

      <main className={"dash-grid" + (isCompleted ? "" : " has-feed")}>
          <div className="dash-col dash-col-pipeline">
          <div className="dash-section-label">
            <ListChecks size={14} /> Investigation Pipeline
          </div>
          <div className="dash-pipeline">
            {stageData.map((sd, i) => {
              const isActive = sd.status === "PROCESSING";
              const isFailed = sd.status === "FAILED";
              const color = STEP_STATUS_COLORS[sd.status] ?? "#64748b";
              const canViewDetails =
                sd.status === "COMPLETED"
                  && !!sd.step?.output_json
                  && sd.stepName !== "planning"
                  && sd.stepName !== "report_generation";
              return (
                <React.Fragment key={sd.stepName}>
                  <div className={`dash-step status-${sd.status.toLowerCase()}`}>
                    <div className="dash-step-rail">
                      <span
                        className="dash-step-dot"
                        style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }}
                      >
                        {sd.status === "COMPLETED" && (
                          <CheckCircle2 size={12} color="#0a0a0a" />
                        )}
                        {sd.status === "FAILED" && (
                          <XCircle size={12} color="#0a0a0a" />
                        )}
                        {isActive && (
                          <Loader2 size={12} className="dash-spin" />
                        )}
                      </span>
                    </div>

                    <div className="dash-step-main">
                      <div className="dash-step-head">
                        <span className="dash-step-title">{sd.title}</span>
                        <span
                          className="dash-step-status"
                          style={{ color, borderColor: `${color}55`, background: `${color}14` }}
                        >
                          {STEP_STATUS_TEXT[sd.status] ?? sd.status}
                        </span>
                      </div>

                      <div className="dash-step-meta">
                        <span className="dash-step-agent">{sd.agent}</span>
                        {sd.step?.started_at && (
                          <>
                            <span className="dash-step-sep">·</span>
                            <span className="dash-step-time">
                              Started {formatTime(sd.step.started_at)}
                            </span>
                          </>
                        )}
                      </div>

                      {isFailed && sd.step?.error_message && (
                        <div className="dash-step-error">
                          {sd.step.error_message}
                        </div>
                      )}

                      {canViewDetails && (
                        <button
                          className="dash-step-toggle"
                          onClick={() => setModalStep(sd.stepName)}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>

                  {i < stageData.length - 1 && (
                    <div className="dash-step-connector" aria-hidden>
                      <span className="dash-step-connector-line" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          </div>

          {!isCompleted && (
            <div className="dash-col dash-col-feed">
              <div className="dash-section-label">
                <Activity size={14} /> Live Activity Stream
              </div>
              <LiveActivityFeed />
            </div>
          )}
        </main>

      {currentModalStep && currentModalStep.step && (
        <StepDetailModal
          step={currentModalStep.step}
          stepName={currentModalStep.stepName}
          title={currentModalStep.title}
          agent={currentModalStep.agent}
          onClose={() => setModalStep(null)}
        />
      )}
    </div>
  );
}

export default function InvestigationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const investigationId = params.id as string;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setLoaded(true);
  }, [authLoading, user, router]);

  if (authLoading || !loaded) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Initializing investigation…</span>
      </div>
    );
  }

  return (
    <InvestigationProvider investigationId={investigationId}>
      <InvestigationContent investigationId={investigationId} />
      </InvestigationProvider>
  );
}
