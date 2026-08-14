"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigation } from "@/providers/investigation-provider";
import { 
  Activity, 
  Terminal,
  Play,
  HelpCircle,
  Search,
  Layers,
  AlertTriangle,
  Target,
  Lightbulb,
  Trophy,
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";
import ReportRevealPanel from "./ReportRevealPanel";

const EVENT_CONFIG: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
  investigation_started: { icon: Play, label: "Investigation Started", color: "var(--brand-orange)" },
  questions_generated: { icon: HelpCircle, label: "Questions Generated", color: "#8B5CF6" },
  search_completed: { icon: Search, label: "Search Complete", color: "#F59E0B" },
  sources_found: { icon: Layers, label: "Sources Gathered", color: "#3B82F6" },
  pain_point_found: { icon: AlertTriangle, label: "Pain Point Identified", color: "var(--brand-orange)" },
  root_cause_found: { icon: Target, label: "Root Cause Resolved", color: "#EF4444" },
  existing_solution_found: { icon: Activity, label: "Solution Mapped", color: "#06B6D4" },
  market_gap_found: { icon: Lightbulb, label: "Market Gap Found", color: "#F59E0B" },
  project_idea: { icon: Trophy, label: "Opportunity Generated", color: "var(--brand-orange)" },
  evaluation_complete: { icon: CheckCircle, label: "Evaluation Finished", color: "#F59E0B" },
  report_generated: { icon: FileText, label: "Report Compiled", color: "var(--brand-orange)" },
  investigation_completed: { icon: CheckCircle, label: "Task Completed", color: "#F59E0B" },
  investigation_failed: { icon: XCircle, label: "Session Halted", color: "#EF4444" },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function TimelinePanel() {
  const { events, status } = useInvestigation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRunning = status === "researching" || status === "pending" || status === "RUNNING";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="w-[260px] flex flex-col h-full bg-[rgba(10,10,10,0.5)] border-l border-[var(--border)] select-none pointer-events-auto">
      <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Terminal size={14} className="text-[var(--brand-orange)]" />
          <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider">
            Stream Log
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-[var(--brand-orange)] animate-pulse" : "bg-[var(--text-muted)]"}`} />
          <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold">
            Live
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const config = EVENT_CONFIG[event.event_type] || { icon: Play, label: event.event_type, color: "var(--text-secondary)" };
            const Icon = config.icon;

            return (
              <motion.div
                key={event.id}
                className="flex items-start gap-3 p-3 bg-[rgba(255,255,255,0.015)] border border-[var(--border-subtle)] rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ color: config.color, background: `${config.color}08` }}
                >
                  <Icon size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-white leading-none truncate">
                      {config.label}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--text-muted)] flex-shrink-0">
                      {formatTime(new Date())}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    {event.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity size={18} className="text-[var(--text-muted)] animate-pulse" />
            <span className="text-xs text-[var(--text-muted)] mt-3">
              Awaiting spark events...
            </span>
          </div>
        )}
      </div>

      {/* Progressive compilation reports below list */}
      <ReportRevealPanel />
    </div>
  );
}
