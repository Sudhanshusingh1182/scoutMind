"use client";

import React from "react";
import { useInvestigation } from "@/providers/investigation-provider";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

function asArray(v: unknown): Json[] {
  return Array.isArray(v) ? (v as Json[]) : [];
}
function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
function asStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="step-out-section">
      <div className="step-out-section-title">{title}</div>
      {children}
    </div>
  );
}

function Card({ title, chips, body, children }: {
  title?: string;
  chips?: string[];
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="step-out-card">
      {title && <div className="step-out-card-title">{title}</div>}
      {chips && chips.length > 0 && (
        <div className="step-out-chips">
          {chips.map((c, i) => (
            <span className="step-out-chip" key={i}>{c}</span>
          ))}
        </div>
      )}
      {body && <div className="step-out-card-body">{body}</div>}
      {children}
    </div>
  );
}

function clamp(text: string, n: number): string {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

function ResearchView({ data }: { data: Record<string, unknown> }) {
  const evidence = asArray(data.all_evidence).length
    ? asArray(data.all_evidence)
    : asArray(data.research_results)
        .flatMap((r) => asArray(asObj(r).evidence));
  const questions = asArray(data.research_questions);
  return (
    <>
      {questions.length > 0 && (
        <Section title="Research Questions">
          <div className="step-out-list">
            {questions.map((q, i) => (
              <div className="step-out-line" key={i}>{asStr(q)}</div>
            ))}
          </div>
        </Section>
      )}
      {evidence.length > 0 && (
        <Section title={`Sources & Evidence (${evidence.length})`}>
          <div className="step-out-grid">
            {evidence.map((e, i) => {
              const o = asObj(e);
              const score = o.relevance_score;
              const url = asStr(o.url);
              return (
                <Card
                  key={i}
                  title={asStr(o.title) || "Source"}
                  chips={score != null ? [`relevance ${asStr(score)}`] : []}
                  body={clamp(asStr(o.content || o.summary), 220)}
                >
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="step-out-source-link"
                    >
                      {url}
                    </a>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}

function ListCardsView({
  data,
  keyName,
  titleFn,
  chipFn,
  bodyFn,
  sectionLabel,
}: {
  data: Record<string, unknown>;
  keyName: string;
  titleFn: (o: Record<string, unknown>) => string;
  chipFn: (o: Record<string, unknown>) => string[];
  bodyFn: (o: Record<string, unknown>) => string;
  sectionLabel?: string;
}) {
  const items = asArray(data[keyName]);
  if (items.length === 0) return null;
  return (
    <Section title={sectionLabel || `${keyName} (${items.length})`}>
      <div className="step-out-grid">
        {items.map((it, i) => {
          const o = asObj(it);
          return (
            <Card
              key={i}
              title={titleFn(o)}
              chips={chipFn(o)}
              body={bodyFn(o)}
            />
          );
        })}
      </div>
    </Section>
  );
}

function ReportView({ data }: { data: Record<string, unknown> }) {
  const report = asObj(data.report);
  if (Object.keys(report).length === 0) return null;
  const text = (k: string) => asStr(report[k]);
  const list = (k: string) =>
    asArray(report[k]).map((x) => asObj(x));
  return (
    <>
      {text("spark_summary") && (
        <Section title="Summary">
          <div className="step-out-card-body">{text("spark_summary")}</div>
        </Section>
      )}
      {list("key_pain_points").length > 0 && (
        <Section title="Key Pain Points">
          <div className="step-out-grid">
            {list("key_pain_points").map((p, i) => (
              <Card
                key={i}
                title={asStr(p.description)}
                chips={[asStr(p.severity), asStr(p.frequency)].filter(Boolean)}
                body={asStr(p.affected_users)}
              />
            ) )}
          </div>
        </Section>
      )}
      {list("root_cause_analysis").length > 0 && (
        <Section title="Root Cause Analysis">
          <div className="step-out-grid">
            {list("root_cause_analysis").map((c, i) => (
              <Card
                key={i}
                title={asStr(c.root_cause)}
                chips={[`depth ${asStr(c.depth)}`].filter(Boolean)}
                body={asStr(c.explanation)}
              />
            ) )}
          </div>
        </Section>
      )}
      {list("existing_solutions").length > 0 && (
        <Section title="Existing Solutions">
          <div className="step-out-grid">
            {list("existing_solutions").map((s, i) => (
              <Card
                key={i}
                title={asStr(s.name)}
                chips={[asStr(s.category)].filter(Boolean)}
                body={[asStr(s.strengths), asStr(s.weaknesses), asStr(s.missing_features)]
                  .filter(Boolean)
                  .join("  •  ")}
              />
            ) )}
          </div>
        </Section>
      )}
      {list("market_gaps").length > 0 && (
        <Section title="Market Gaps">
          <div className="step-out-grid">
            {list("market_gaps").map((g, i) => (
              <Card
                key={i}
                title={asStr(g.description)}
                chips={[asStr(g.opportunity_type), asStr(g.potential)].filter(Boolean)}
                body={[asStr(g.underserved_users), asStr(g.why_now)]
                  .filter(Boolean)
                  .join("  •  ")}
              />
            ) )}
          </div>
        </Section>
      )}
      {text("recommended_project") && (
        <Section title="Recommended Project">
          <div className="step-out-card-body">{text("recommended_project")}</div>
        </Section>
      )}
      {text("suggested_mvp") && (
        <Section title="Suggested MVP">
          <div className="step-out-card-body">{text("suggested_mvp")}</div>
        </Section>
      )}
    </>
  );
}

function IdeaView({ data }: { data: Record<string, unknown> }) {
  const ideas = asArray(data.project_ideas);
  if (ideas.length === 0) return null;
  const scoreKeys = [
    "practical_usefulness_score", "originality_score", "innovation_score",
    "technical_feasibility_score", "portfolio_value_score", "business_potential_score",
    "development_effort_score", "market_demand_score", "overall_score",
  ];
  return (
    <Section title={`Project Ideas (${ideas.length})`}>
      <div className="step-out-grid">
        {ideas.map((it, i) => {
          const o = asObj(it);
          const scores = scoreKeys
            .filter((k) => o[k] != null)
            .map((k) => `${k.replace(/_score$/, "").replace(/_/g, " ")}: ${asStr(o[k])}`);
          return (
            <Card
              key={i}
              title={asStr(o.title)}
              chips={[asStr(o.category)].filter(Boolean)}
              body={[asStr(o.elevator_pitch), asStr(o.problem_solved)]
                .filter(Boolean)
                .join("  •  ")}
            >
              {scores.length > 0 && (
                <div className="step-out-scores">
                  {scores.map((s, j) => (
                    <span className="step-out-chip" key={j}>{s}</span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function GenericView({ data }: { data: Record<string, unknown> }) {
  return (
    <Section title="Output">
      <div className="step-out-grid">
        {Object.entries(data).map(([k, v]) => (
          <Card
            key={k}
            title={k.replace(/_/g, " ")}
            body={
              Array.isArray(v)
                ? `${v.length} item${v.length === 1 ? "" : "s"}`
                : clamp(asStr(v), 200)
            }
          />
        ))}
      </div>
    </Section>
  );
}

export default function StepOutput({
  stepName,
  json,
}: {
  stepName: string;
  json: string | null;
}) {
  const { steps } = useInvestigation();

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json || "{}");
  } catch {
    return <pre className="dash-detail-pre">{json || "—"}</pre>;
  }
  if (!data || Object.keys(data).length === 0) {
    return <div className="step-out-empty">No output recorded.</div>;
  }

  const ideaTitles: Record<number, string> = {};
  const ideaStep = steps.find((s) => s.step_name === "idea_generation");
  if (ideaStep?.output_json) {
    try {
      const ideaData = JSON.parse(ideaStep.output_json);
      asArray(ideaData.project_ideas).forEach((it, i) => {
        const t = asStr(asObj(it).title);
        if (t) ideaTitles[i] = t;
      });
    } catch {}
  }

  let view: React.ReactNode;
  switch (stepName) {
    case "planning":
      view = (
        <ListCardsView
          data={data}
          keyName="research_questions"
          sectionLabel={`Research Questions (${asArray(data.research_questions).length})`}
          titleFn={(o) => asStr(o) || "Question"}
          chipFn={() => []}
          bodyFn={() => ""}
        />
      );
      break;
    case "research":
      view = <ResearchView data={data} />;
      break;
    case "pain_point_extraction":
      view = (
        <ListCardsView
          data={data}
          keyName="pain_points"
          titleFn={(o) => asStr(o.description)}
          chipFn={(o) => [asStr(o.severity), asStr(o.frequency)].filter(Boolean)}
          bodyFn={(o) => asStr(o.affected_users)}
        />
      );
      break;
    case "root_cause_analysis":
      view = (
        <ListCardsView
          data={data}
          keyName="root_causes"
          titleFn={(o) => asStr(o.root_cause)}
          chipFn={(o) => [`depth ${asStr(o.depth)}`].filter(Boolean)}
          bodyFn={(o) => asStr(o.explanation)}
        />
      );
      break;
    case "solution_analysis":
    case "solution_comparison":
      view = (
        <ListCardsView
          data={data}
          keyName="existing_solutions"
          titleFn={(o) => asStr(o.name)}
          chipFn={(o) => [asStr(o.category)].filter(Boolean)}
          bodyFn={(o) =>
            [asStr(o.strengths), asStr(o.weaknesses), asStr(o.missing_features)]
              .filter(Boolean)
              .join("  •  ")
          }
        />
      );
      break;
    case "market_gap_detection":
      view = (
        <ListCardsView
          data={data}
          keyName="market_gaps"
          titleFn={(o) => asStr(o.description)}
          chipFn={(o) => [asStr(o.opportunity_type), asStr(o.potential)].filter(Boolean)}
          bodyFn={(o) =>
            [asStr(o.underserved_users), asStr(o.why_now)]
              .filter(Boolean)
              .join("  •  ")
          }
        />
      );
      break;
    case "idea_generation":
      view = <IdeaView data={data} />;
      break;
    case "evaluation":
      view = (
        <ListCardsView
          data={data}
          keyName="evaluations"
          titleFn={(o) =>
            asStr(o.title) ||
            ideaTitles[Number(o.index)] ||
            `Idea #${asStr(o.index) || "?"}`
          }
          chipFn={(o) =>
            [`overall ${asStr(o.overall_score)}`].filter(Boolean)
          }
          bodyFn={(o) => asStr(o.rank_justification || o.rationale)}
        />
      );
      break;
    case "report_generation":
      view = <ReportView data={data} />;
      break;
    default:
      view = <GenericView data={data} />;
  }

  return <div className="step-out">{view}</div>;
}
