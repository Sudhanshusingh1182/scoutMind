"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ReportData, Investigation, ProjectIdea } from "@/lib/types";
import Header from "@/components/layout/header";
import {
  IconFileText, IconArrowLeft, IconPlus, IconBulb, IconTarget,
  IconBuildingStore, IconUsers, IconStar, IconTrophy, IconAlertTriangle,
  IconCircleCheck, IconSearch,
} from "@tabler/icons-react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*?)$/gm, '<h4 class="report-h4">$1</h4>')
    .replace(/^## (.*?)$/gm, '<h3 class="report-h3">$1</h3>')
    .replace(/^# (.*?)$/gm, '<h2 class="report-h2">$1</h2>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/\n/g, "<br/>");
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  "AI Agent": "#8B5CF6",
  "Mobile App": "#06B6D4",
  "SaaS": "#10B981",
  "Chrome Extension": "#F59E0B",
  "Open Source Project": "#10B981",
  "Automation Tool": "#F97316",
  "Developer Tool": "#3B82F6",
  "Portfolio Project": "#A855F7",
  "Startup Opportunity": "#EF4444",
  "Desktop Application": "#94A3B8",
};

function ProjectIdeaCard({ idea, rank }: { idea: ProjectIdea; rank: number }) {
  const catColor = CATEGORY_COLORS[idea.category] || "#94A3B8";
  const scores = [
    { label: "Usefulness", value: idea.practical_usefulness, color: "#10B981" },
    { label: "Originality", value: idea.originality, color: "#06B6D4" },
    { label: "Innovation", value: idea.innovation, color: "#8B5CF6" },
    { label: "Feasibility", value: idea.technical_feasibility, color: "#F59E0B" },
    { label: "Portfolio Value", value: idea.portfolio_value, color: "#A855F7" },
    { label: "Business Opportunity", value: idea.business_potential_score, color: "#22C55E" },
    { label: "Development Effort", value: idea.development_effort, color: "#F97316" },
    { label: "Market Demand", value: idea.market_demand, color: "#EF4444" },
  ];

  return (
    <motion.div 
      className="project-card bg-[rgba(255,255,255,0.01)] border border-[var(--border)] rounded-xl"
      variants={itemVariants}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="project-card-rank font-display">#{rank}</div>
      <div className="project-card-body">
        <div className="project-card-header flex items-center justify-between gap-4">
          <h3 className="project-card-title text-white font-bold font-display text-lg">{idea.title}</h3>
          <div className="project-card-meta flex items-center gap-3">
            <span 
              className="project-card-category text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${catColor}12`, color: catColor, border: `1px solid ${catColor}30` }}
            >
              {idea.category}
            </span>
            <span className="project-card-score font-mono">{idea.overall_score.toFixed(1)}/10</span>
          </div>
        </div>

        <p className="project-card-elevator mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">{idea.elevator_pitch}</p>

        {idea.problem_solved && (
          <div className="project-card-section mt-4 text-xs text-[var(--text-secondary)]">
            <span className="font-bold text-white uppercase tracking-wider text-[9px] mr-1 block sm:inline">Problem Solved:</span> 
            {idea.problem_solved}
          </div>
        )}

        {idea.target_users && (
          <div className="project-card-tag mt-3 inline-flex items-center gap-1.5 bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] px-3 py-1 rounded-full font-medium">
            <IconUsers size={12} className="text-[var(--text-muted)]" />
            <span>Target Audience: {idea.target_users}</span>
          </div>
        )}

        {idea.why_now && (
          <div className="project-card-section mt-4 text-xs text-[var(--text-secondary)]">
            <span className="font-bold text-white uppercase tracking-wider text-[9px] mr-1 block sm:inline">Why Now:</span> 
            {idea.why_now}
          </div>
        )}

        {idea.supporting_evidence && idea.supporting_evidence.length > 0 && (
          <div className="project-card-evidence mt-4 border-t border-[var(--border-subtle)] pt-4">
            <span className="font-bold text-white uppercase tracking-wider text-[9px] block mb-2">Supporting Evidence Path</span>
            <ul className="flex flex-col gap-2 pl-4 list-disc text-xs text-[var(--text-secondary)]">
              {idea.supporting_evidence.map((ev, i) => (
                <li key={i} className="leading-relaxed">
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-orange)] hover:underline font-semibold mr-1 inline-flex items-center gap-1">
                    <span>{ev.title || "External Source"}</span>
                  </a>
                  {ev.snippet && <span className="text-[var(--text-muted)]">— {ev.snippet}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {idea.mvp_outline && (
          <div className="project-card-mvp mt-4 bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-3 rounded-lg text-xs leading-relaxed text-[var(--text-secondary)]">
            <span className="font-bold text-white uppercase tracking-wider text-[9px] block mb-1">MVP Scope:</span> 
            {idea.mvp_outline}
          </div>
        )}

        {idea.future_expansion && (
          <div className="project-card-section mt-4 text-xs text-[var(--text-secondary)]">
            <span className="font-bold text-white uppercase tracking-wider text-[9px] block mb-1">Future Scaling Scope:</span> 
            {idea.future_expansion}
          </div>
        )}

        {/* Dynamic Progress Score Bars */}
        <div className="project-card-scores border-t border-[var(--border-subtle)] pt-4 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {scores.map((s) => (
            <div key={s.label} className="score-bar-item flex flex-col">
              <span className="score-bar-label font-bold text-[8px] text-[var(--text-muted)] tracking-wider">{s.label}</span>
              <div className="score-bar-track bg-[rgba(255,255,255,0.03)] h-1 w-full rounded-full overflow-hidden mt-1.5">
                <div className="score-bar-fill h-full rounded-full" style={{ width: `${s.value * 10}%`, backgroundColor: s.color }} />
              </div>
              <span className="score-bar-value font-mono text-[10px] font-bold mt-1" style={{ color: s.color }}>{s.value}/10</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const investigationId = params.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("summary");
  const sectionRefs = useRef<Record<string, HTMLElement>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    Promise.all([
      api.getReport(investigationId),
      api.getInvestigation(investigationId),
    ])
      .then(([reportData, invData]) => {
        setReport(reportData);
        setInvestigation(invData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load report data");
        setLoading(false);
      });
  }, [investigationId, user, authLoading, router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [report]);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="loading-screen bg-[var(--bg-primary)]">
        <div className="loading-orb" />
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[var(--text-secondary)] text-sm font-mono animate-pulse"
        >
          Compiling final opportunity report...
        </motion.p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="report-page bg-[var(--bg-primary)] min-h-screen">
        <Header />
        <div className="report-error flex flex-col items-center justify-center pt-32 text-center">
          <h2 className="text-xl font-bold font-display text-white">Presentation Report Unfinished</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-2">
            {error || "This investigation is currently executing agent loops."}
          </p>
          <Link href={`/investigation/${investigationId}`} className="report-back-link mt-6">
            <IconArrowLeft size={16} />
            Workspace Feed
          </Link>
        </div>
      </div>
    );
  }

  const hasFindings = report.research_findings && report.research_findings.length > 0;
  const hasPainPoints = report.key_pain_points && report.key_pain_points.length > 0;
  const hasRootCauses = report.root_cause_analysis && report.root_cause_analysis.length > 0;
  const hasSolutions = report.existing_solutions && report.existing_solutions.length > 0;
  const hasGaps = report.market_gaps && report.market_gaps.length > 0;
  const hasIdeas = report.project_ideas && report.project_ideas.length > 0;
  const hasRisks = report.risks && report.risks.length > 0;
  const hasReferences = report.references && report.references.length > 0;

  return (
    <div className="report-page bg-dot-grid bg-[var(--bg-primary)] min-h-screen">
      <Header />

      <div className="report-layout max-w-[1240px] mx-auto px-6 pt-28 pb-20 relative flex gap-10">
        {/* ── STICKY TOC SIDEBAR ── */}
        <nav className="report-toc sticky top-28 self-start hidden lg:block w-[240px] border-r border-[var(--border-subtle)] pr-6">
          <div className="report-toc-title font-display text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">
            Report Chapters
          </div>
          <div className="report-toc-list flex flex-col gap-1.5">
            {report.spark_summary && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "summary" ? "active" : ""}`} 
                onClick={() => scrollToSection("summary")}
              >
                <IconFileText size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Executive Summary</span>
              </button>
            )}
            {hasFindings && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "findings" ? "active" : ""}`} 
                onClick={() => scrollToSection("findings")}
              >
                <IconSearch size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Research Evidence</span>
              </button>
            )}
            {hasPainPoints && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "pain-points" ? "active" : ""}`} 
                onClick={() => scrollToSection("pain-points")}
              >
                <IconAlertTriangle size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Extracted Pain Points</span>
              </button>
            )}
            {hasRootCauses && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "root-causes" ? "active" : ""}`} 
                onClick={() => scrollToSection("root-causes")}
              >
                <IconTarget size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Root Causes</span>
              </button>
            )}
            {hasSolutions && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "solutions" ? "active" : ""}`} 
                onClick={() => scrollToSection("solutions")}
              >
                <IconBuildingStore size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Competitor Audit</span>
              </button>
            )}
            {hasGaps && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "gaps" ? "active" : ""}`} 
                onClick={() => scrollToSection("gaps")}
              >
                <IconBulb size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Detected Market Gaps</span>
              </button>
            )}
            {(report.recommended_project || report.suggested_mvp) && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "recommendation" ? "active" : ""}`} 
                onClick={() => scrollToSection("recommendation")}
              >
                <IconCircleCheck size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Strategic Concept</span>
              </button>
            )}
            {hasIdeas && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "ideas" ? "active" : ""}`} 
                onClick={() => scrollToSection("ideas")}
              >
                <IconTrophy size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Ranked Opportunities</span>
              </button>
            )}
            {hasRisks && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "risks" ? "active" : ""}`} 
                onClick={() => scrollToSection("risks")}
              >
                <IconAlertTriangle size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>Identified Risks</span>
              </button>
            )}
            {hasReferences && (
              <button 
                className={`report-toc-item text-left w-full ${activeSection === "references" ? "active" : ""}`} 
                onClick={() => scrollToSection("references")}
              >
                <IconFileText size={15} className="report-toc-icon opacity-75 mr-2" />
                <span>References</span>
              </button>
            )}
          </div>
        </nav>

        {/* ── MAIN CONTENTS ── */}
        <motion.div
          className="report-main flex-1 max-w-[800px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="report-container">
            <motion.div className="report-header pb-8 border-b border-[var(--border-subtle)]" variants={itemVariants}>
              <div className="report-header-badge inline-flex items-center gap-2">
                <IconFileText size={12} />
                <span>Resolved Telemetry</span>
              </div>
              <h1 className="report-title font-display text-4xl font-extrabold text-white leading-tight">
                {investigation?.problem_statement}
              </h1>
              
              <div className="report-meta flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium mt-4">
                <span>{report.project_ideas?.length || 0} opportunity designs</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)]" />
                <span>{report.research_findings?.length || 0} telemetry paths</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)]" />
                <span>{report.existing_solutions?.length || 0} competitors resolved</span>
              </div>
            </motion.div>

            {/* Spark Summary */}
            {report.spark_summary && (
              <motion.section 
                className="report-section mt-8" 
                id="summary" 
                ref={(el) => { if (el) sectionRefs.current["summary"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconFileText size={18} className="text-[var(--brand-orange)] mr-2" />
                  Executive Summary
                </h2>
                <div className="report-summary-card bg-[rgba(255,138,0,0.02)] border border-[rgba(255,138,0,0.1)] rounded-xl p-6">
                  <div className="report-summary-content text-sm text-[var(--text-secondary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(report.spark_summary) }} />
                </div>
              </motion.section>
            )}

            {/* Research Findings */}
            {hasFindings && (
              <motion.section 
                className="report-section" 
                id="findings" 
                ref={(el) => { if (el) sectionRefs.current["findings"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconSearch size={18} className="text-[#3B82F6] mr-2" />
                  Research Telemetry
                </h2>
                <div className="findings-list flex flex-col gap-3">
                  {report.research_findings!.map((finding, i) => (
                    <div className="finding-item bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-4 rounded-lg text-sm text-[var(--text-secondary)]" key={i}>
                      <span className="finding-bullet mt-1.5" />
                      <span className="leading-relaxed">{typeof finding === "string" ? finding : JSON.stringify(finding)}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Key Pain Points */}
            {hasPainPoints && (
              <motion.section 
                className="report-section" 
                id="pain-points" 
                ref={(el) => { if (el) sectionRefs.current["pain-points"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconAlertTriangle size={18} className="text-[var(--brand-orange)] mr-2" />
                  Critical Pain Points
                </h2>
                <div className="pain-points-list flex flex-col gap-3">
                  {report.key_pain_points!.map((pp, i) => (
                    <div className="pain-point-card bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-5 rounded-lg" key={i}>
                      <div className="pain-point-header flex items-center justify-between mb-2">
                        <span className="pain-point-desc text-white font-semibold text-sm leading-snug">{pp.description}</span>
                        <span className={`severity-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider severity-${pp.severity}`}>{pp.severity}</span>
                      </div>
                      {pp.affected_users && (
                        <div className="pain-point-meta text-xs text-[var(--text-muted)] mt-2">Target Audience affected: {pp.affected_users}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Root Causes */}
            {hasRootCauses && (
              <motion.section 
                className="report-section" 
                id="root-causes" 
                ref={(el) => { if (el) sectionRefs.current["root-causes"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconTarget size={18} className="text-[#EF4444] mr-2" />
                  Root Causes
                </h2>
                <div className="root-causes-list flex flex-col gap-3">
                  {report.root_cause_analysis!.map((rc, i) => (
                    <div className="root-cause-card bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-5 rounded-lg" key={i}>
                      <div className="root-cause-header flex items-center justify-between mb-2">
                        <span className="root-cause-text text-white font-semibold text-sm leading-snug">{rc.root_cause}</span>
                        <span className="depth-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase">Depth {rc.depth}/3</span>
                      </div>
                      <p className="root-cause-explanation text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{rc.explanation}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Existing Solutions */}
            {hasSolutions && (
              <motion.section 
                className="report-section" 
                id="solutions" 
                ref={(el) => { if (el) sectionRefs.current["solutions"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconBuildingStore size={18} className="text-[#06B6D4] mr-2" />
                  Competitor Matrix
                </h2>
                <div className="solutions-list flex flex-col gap-3">
                  {report.existing_solutions!.map((sol, i) => (
                    <div className="solution-card bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-5 rounded-lg" key={i}>
                      <div className="solution-header flex items-center justify-between mb-2">
                        <span className="solution-name text-white font-bold text-sm">{sol.name}</span>
                        <span className="solution-category text-[10px] text-[var(--text-secondary)] uppercase font-semibold tracking-wider bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full">{sol.category}</span>
                      </div>
                      {sol.strengths && <div className="solution-strengths text-xs text-[var(--text-secondary)] mt-2"><span className="font-bold text-white text-[10px] uppercase tracking-wider block sm:inline mr-1">Strengths:</span> {sol.strengths}</div>}
                      {sol.weaknesses && <div className="solution-weaknesses text-xs text-[var(--text-secondary)] mt-2"><span className="font-bold text-white text-[10px] uppercase tracking-wider block sm:inline mr-1">Weaknesses:</span> {sol.weaknesses}</div>}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Market Gaps */}
            {hasGaps && (
              <motion.section 
                className="report-section" 
                id="gaps" 
                ref={(el) => { if (el) sectionRefs.current["gaps"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconBulb size={18} className="text-[#EAB308] mr-2" />
                  Open Market Gaps
                </h2>
                <div className="gaps-list flex flex-col gap-3">
                  {report.market_gaps!.map((gap, i) => (
                    <div className="gap-card bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-5 rounded-lg" key={i}>
                      <div className="gap-header flex items-center justify-between mb-2">
                        <span className="gap-desc text-white font-bold text-sm leading-snug">{gap.description}</span>
                        <span className={`potential-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase potential-${gap.potential}`}>{gap.potential}</span>
                      </div>
                      {gap.underserved_users && (
                        <div className="gap-meta text-xs text-[var(--text-muted)] mt-2">Underserved: {gap.underserved_users}</div>
                      )}
                      {gap.why_now && (
                        <div className="gap-why-now text-xs text-[var(--text-secondary)] mt-2 leading-relaxed"><span className="font-bold text-white text-[10px] uppercase tracking-wider mr-1 block sm:inline">Why Now:</span> {gap.why_now}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Strategic Recommendation */}
            {(report.recommended_project || report.suggested_mvp) && (
              <motion.section 
                className="report-section" 
                id="recommendation" 
                ref={(el) => { if (el) sectionRefs.current["recommendation"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconCircleCheck size={18} className="text-[#10B981] mr-2" />
                  Strategic Concept Formulation
                </h2>
                {report.recommended_project && (
                  <div className="recommendation-card bg-[rgba(16,185,129,0.02)] border border-[rgba(16,185,129,0.15)] p-6 rounded-lg text-sm text-[var(--text-secondary)] leading-relaxed">
                    {report.recommended_project}
                  </div>
                )}
                {report.suggested_mvp && (
                  <div className="report-summary-card bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-6 rounded-xl mt-4">
                    <div className="report-summary-content text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(report.suggested_mvp) }} />
                  </div>
                )}
              </motion.section>
            )}

            {/* Project Ideas */}
            {hasIdeas && (
              <motion.section 
                className="report-section" 
                id="ideas" 
                ref={(el) => { if (el) sectionRefs.current["ideas"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconTrophy size={18} className="text-[var(--brand-orange)] mr-2" />
                  Ranked Opportunities
                </h2>
                <div className="project-ideas-list flex flex-col gap-6">
                  {report.project_ideas!.map((idea, i) => (
                    <ProjectIdeaCard key={i} idea={idea} rank={i + 1} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Risks */}
            {hasRisks && (
              <motion.section 
                className="report-section" 
                id="risks" 
                ref={(el) => { if (el) sectionRefs.current["risks"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconAlertTriangle size={18} className="text-[#F59E0B] mr-2" />
                  Identified Project Risks
                </h2>
                <div className="findings-list flex flex-col gap-3">
                  {report.risks!.map((risk, i) => (
                    <div className="finding-item bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] p-4 rounded-lg text-sm text-[var(--text-secondary)] leading-relaxed" key={i}>
                      <span className="finding-bullet mt-1.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* References */}
            {hasReferences && (
              <motion.section 
                className="report-section" 
                id="references" 
                ref={(el) => { if (el) sectionRefs.current["references"] = el; }} 
                variants={itemVariants}
              >
                <h2 className="report-section-title font-display text-lg font-bold text-white mb-4">
                  <IconFileText size={18} className="text-[#94A3B8] mr-2" />
                  Source References
                </h2>
                <div className="references-list flex flex-col gap-2">
                  {report.references!.map((ref, i) => (
                    <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer" className="reference-item bg-[rgba(255,255,255,0.015)] hover:bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] p-3 rounded-lg text-xs font-semibold text-[var(--brand-orange)] transition-all duration-200">
                      {ref.title || ref.url}
                    </a>
                  ))}
                </div>
              </motion.section>
            )}

            <motion.div className="report-actions border border-[var(--border)] p-8 rounded-xl bg-[var(--bg-card)] mt-12" variants={itemVariants}>
              <div className="report-actions-header">
                <span className="report-actions-badge">Pipeline Actions</span>
                <p className="report-actions-desc text-sm text-[var(--text-secondary)] mt-2">
                  Return to the live workspace stream or launch another investigation.
                </p>
              </div>
              <div className="report-actions-buttons flex justify-center gap-4 mt-6">
                <Link href={`/investigation/${investigationId}`} className="report-btn-secondary flex items-center gap-2">
                  <IconArrowLeft size={16} />
                  <span>Workspace Stream</span>
                </Link>
                <Link href="/" className="report-btn-primary flex items-center gap-2">
                  <IconPlus size={16} />
                  <span>Start New Spark</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
