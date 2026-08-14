"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useInvestigation } from "@/providers/investigation-provider";
import { 
  FileText, 
  Heart, 
  GitMerge, 
  Compass, 
  Trophy, 
  Clock 
} from "lucide-react";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const prev = prevRef.current;
    const diff = value - prev;
    if (diff === 0) return;

    const duration = 650;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(prev + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    prevRef.current = value;
  }, [value]);

  return <span className="text-xl font-bold text-white font-display">{display}</span>;
}

export default function SummaryPanel() {
  const { summary, status, steps } = useInvestigation();
  const [elapsed, setElapsed] = useState("00:00:00");

  const isRunning = status === "researching" || status === "pending" || status === "RUNNING";

  // Real-time elapsed timer logic when actively running
  useEffect(() => {
    if (!isRunning) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(secs / 3600)).padStart(2, "0");
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
      const s = String(secs % 60).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Compute actual total completed execution time from steps
  const completedDuration = useMemo(() => {
    if (isRunning) return elapsed;
    
    const totalMs = steps
      .filter((s) => s.status === "COMPLETED" && s.execution_time)
      .reduce((acc, s) => acc + (s.execution_time || 0), 0);

    if (totalMs > 0) {
      const totalSecs = Math.floor(totalMs / 1000);
      const h = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
      const s = String(totalSecs % 60).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }

    // Secondary fallback: difference between first started step and last completed step
    const startTimes = steps.map((s) => s.started_at).filter(Boolean).map((t) => new Date(t!).getTime());
    const endTimes = steps.map((s) => s.completed_at).filter(Boolean).map((t) => new Date(t!).getTime());
    if (startTimes.length > 0 && endTimes.length > 0) {
      const diff = Math.max(...endTimes) - Math.min(...startTimes);
      const totalSecs = Math.floor(diff / 1000);
      const h = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
      const s = String(totalSecs % 60).padStart(2, "0");
      return `${h}:${m}:${s}`;
    }

    return "00:00:15"; // default mock visual fallback
  }, [steps, isRunning, elapsed]);

  return (
    <div className="w-[240px] flex flex-col h-full bg-[rgba(10,10,10,0.5)] border-r border-[var(--border)] p-6 select-none">
      <div className="mb-8">
        <span className="text-xs font-mono font-bold tracking-widest text-[var(--text-muted)] block uppercase">
          ScoutMind
        </span>
        <h2 className="text-lg font-bold font-display text-white mt-1">
          Investigation Summary
        </h2>
      </div>

      <div className="flex-1 space-y-4">
        {/* Sources */}
        <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.05)] text-[#3B82F6] flex items-center justify-center">
            <FileText size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Sources</span>
            <AnimatedNumber value={summary.sources || 0} />
          </div>
        </div>

        {/* Pain Points */}
        <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.05)] text-[#F59E0B] flex items-center justify-center">
            <Heart size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Pain Points</span>
            <AnimatedNumber value={summary.pain_points || 0} />
          </div>
        </div>

        {/* Root Causes */}
        <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.05)] text-[#EF4444] flex items-center justify-center">
            <GitMerge size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Root Causes</span>
            <AnimatedNumber value={summary.root_causes || 0} />
          </div>
        </div>

        {/* Market Gaps */}
        <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.05)] text-[#8B5CF6] flex items-center justify-center">
            <Compass size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Market Gaps</span>
            <AnimatedNumber value={summary.market_gaps || 0} />
          </div>
        </div>

        {/* Project Ideas */}
        <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[rgba(255,138,0,0.05)] text-[var(--brand-orange)] flex items-center justify-center">
            <Trophy size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Project Ideas</span>
            <AnimatedNumber value={summary.project_ideas || 0} />
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] flex items-center justify-center">
            <Clock size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Duration</span>
            <span className="text-sm font-mono font-bold text-white mt-1">
              {completedDuration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
