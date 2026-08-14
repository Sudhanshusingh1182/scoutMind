"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useInvestigation } from "@/providers/investigation-provider";
import { 
  Compass, 
  Search, 
  AlertTriangle, 
  Target, 
  Activity, 
  Lightbulb, 
  Trophy, 
  Cpu, 
  TrendingUp, 
  AlertOctagon, 
  Link as LinkIcon 
} from "lucide-react";

const REPORT_SECTIONS = [
  { key: "spark_summary", label: "Problem Summary", icon: Compass },
  { key: "research_findings", label: "Research Findings", icon: Search },
  { key: "key_pain_points", label: "Pain Points", icon: AlertTriangle },
  { key: "root_cause_analysis", label: "Root Causes", icon: Target },
  { key: "existing_solutions", label: "Existing Solutions", icon: Activity },
  { key: "market_gaps", label: "Market Gaps", icon: Lightbulb },
  { key: "recommended_project", label: "Recommended Project", icon: Trophy },
  { key: "suggested_mvp", label: "Suggested MVP", icon: Cpu },
  { key: "future_expansion", label: "Future Expansion", icon: TrendingUp },
  { key: "risks", label: "Risks", icon: AlertOctagon },
  { key: "references", label: "References", icon: LinkIcon },
];

function renderSectionValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    return <p className="report-section-text text-[11px] text-[var(--text-secondary)] leading-relaxed">{value}</p>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="report-section-text text-[11px] text-[var(--text-secondary)]">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;

    if (typeof value[0] === "string") {
      return (
        <ul className="report-section-list list-disc pl-4 text-[11px] text-[var(--text-secondary)] flex flex-col gap-1">
          {value.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      );
    }

    if (typeof value[0] === "object") {
      return (
        <div className="report-section-cards flex flex-col gap-2 mt-2">
          {value.slice(0, 4).map((item, i) => {
            const obj = item as Record<string, unknown>;
            const firstVal = Object.values(obj).find((v) => typeof v === "string" && v.length > 0) as string;
            return (
              <div key={i} className="report-section-card bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] p-2.5 rounded">
                {firstVal && <div className="report-section-card-title text-[10px] font-bold text-white mb-1">{firstVal}</div>}
                <div className="flex flex-col gap-1">
                  {Object.entries(obj).map(([k, v]) => (
                    <div key={k} className="report-section-card-field flex justify-between text-[9px] text-[var(--text-muted)] gap-2">
                      <span className="capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="text-right truncate max-w-[140px] text-[var(--text-secondary)]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  }

  return <p className="report-section-text text-[11px] text-[var(--text-secondary)]">{JSON.stringify(value).slice(0, 160)}</p>;
}

export default function ReportRevealPanel() {
  const router = useRouter();
  const params = useParams();
  const investigationId = params.id as string;
  const { reportSections, status } = useInvestigation();
  const isRunning = status === "researching" || status === "pending" || status === "RUNNING";
  const isCompleted = status === "completed" || status === "COMPLETED";

  const availableSections = useMemo(() => {
    return REPORT_SECTIONS.filter((s) => {
      const val = reportSections[s.key];
      if (val === undefined || val === null) return false;
      if (typeof val === "string" && val.trim() === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
      if (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0) return false;
      return true;
    });
  }, [reportSections]);

  if (availableSections.length === 0 && !isRunning) return null;
  if (availableSections.length === 0 && isRunning) {
    return (
      <div className="report-reveal-panel border-t border-[var(--border)] p-4">
        <div className="flex items-center justify-between">
          <span className="report-reveal-label font-display text-[9px] uppercase font-bold tracking-widest text-[var(--text-secondary)]">
            Report Swarm
          </span>
          <span className="text-[10px] text-[var(--brand-orange)] font-bold animate-pulse">
            Analyzing...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="report-reveal-panel border-t border-[var(--border)] bg-[rgba(255,255,255,0.01)]">
      <div className="report-reveal-header bg-[rgba(255,255,255,0.01)] border-b border-[var(--border-subtle)]">
        <span className="report-reveal-label font-display text-[9px] uppercase font-bold tracking-widest text-[var(--text-secondary)]">
          Artifact Reports
        </span>
        <span className="report-reveal-count font-mono text-[10px] text-[var(--text-muted)]">
          {availableSections.length} / {REPORT_SECTIONS.length} sections compiled
        </span>
      </div>
      
      <div className="report-reveal-sections max-h-[300px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {availableSections.map((section, idx) => {
            const value = reportSections[section.key];
            const Icon = section.icon;
            return (
              <motion.div
                key={section.key}
                className="report-reveal-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
              >
                <div className="report-section-header">
                  <span className="report-section-icon font-semibold">
                    <Icon size={12} />
                  </span>
                  <span className="report-section-label">{section.label}</span>
                </div>
                <div className="report-section-body">
                  {renderSectionValue(value)}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {isCompleted && availableSections.length > 0 && (
        <motion.div
          className="report-reveal-complete bg-[rgba(255,138,0,0.04)] border-t border-[rgba(255,138,0,0.2)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-[10px] font-bold text-[var(--brand-orange)] tracking-widest uppercase">
            Compilation Finished
          </span>
          <button
            className="report-reveal-view-btn font-semibold"
            onClick={() => router.push(`/report/${investigationId}`)}
          >
            Open Presentation Dashboard →
          </button>
        </motion.div>
      )}
    </div>
  );
}
