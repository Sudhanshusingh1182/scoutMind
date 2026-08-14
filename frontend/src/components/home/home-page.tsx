"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PIPELINE_STEPS, PIPELINE_STEP_LABELS } from "@/lib/types";
import Header from "@/components/layout/header";
import {
  Search,
  Target,
  Sliders,
  Trophy,
  Zap,
  FileText,
  AlertTriangle,
  GitBranch,
  BarChart3,
  Activity,
} from "lucide-react";

const EXAMPLE_SPARKS = [
  "Group food ordering is always chaotic",
  "Parents don't know what kids learn in school",
  "Finding good rentals is painful",
  "Gym memberships don't keep me motivated",
  "Freelancer invoice collection takes too long",
  "Restaurants waste fresh food every single night",
];

const FEATURES = [
  { icon: Search, title: "Deep Agentic Research", desc: "Autonomous AI agents scour forums, Reddit, Product Hunt, and news sources to find concrete evidence." },
  { icon: Target, title: "Root Cause Extraction", desc: "Drills past the symptoms to define why a problem exists, and who experiences it most." },
  { icon: Sliders, title: "Market Gap Detection", desc: "Identifies spaces where current solutions fall short and maps potential entry strategies." },
  { icon: Trophy, title: "Opportunity Architecture", desc: "Delivers complete, evidence-backed project recommendations ready to be built." },
];

const HOW_STEPS = [
  { num: "01", title: "Describe Your Annoyance", desc: "Type in any spark or real-world friction you face." },
  { num: "02", title: "Agents Investigate", desc: "The research swarm navigates across the web in real-time." },
  { num: "03", title: "Find Root Causes", desc: "We map out why the problem persists and who is affected." },
  { num: "04", title: "Define Gaps", desc: "Understand where competitors fall short." },
  { num: "05", title: "Build Opportunities", desc: "Get an evidence-backed roadmap with ranked ideas." },
];

/* ── High-performance Premium Particle Background ── */
function AmbientInvestigationBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    interface Particle {
      x: number; y: number; vx: number; vy: number; size: number; alpha: number; targetAlpha: number;
    }

    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.15 + 0.05,
      targetAlpha: Math.random() * 0.2 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        p.alpha += (p.targetAlpha - p.alpha) * 0.01;
        if (Math.abs(p.alpha - p.targetAlpha) < 0.01) {
          p.targetAlpha = Math.random() * 0.25 + 0.05;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 138, 0, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const lineAlpha = (1 - dist / 180) * 0.06;
            ctx.strokeStyle = `rgba(255, 138, 0, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [spark, setSpark] = useState("");
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % EXAMPLE_SPARKS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!spark.trim() || loading || transitioning) return;
      if (!user) {
        router.push("/login");
        return;
      }
      setLoading(true);
      try {
        const investigation = await api.createInvestigation({ problem_statement: spark.trim() });
        setTransitioning(true);
        setTimeout(() => router.push(`/investigation/${investigation.id}`), 600);
      } catch (err) {
        console.error("Failed to create investigation:", err);
        setLoading(false);
      }
    },
    [spark, loading, transitioning, router, user]
  );

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)]">
      <Header />

      {/* ── HERO SECTION ── */}
      <section className="hero relative z-10 flex flex-col items-center">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <AmbientInvestigationBg />
        </div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={transitioning ? { opacity: 0, y: -20, scale: 0.98 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            ⚡ Autonomous Research workspace
          </motion.div>

          <motion.h1
            className="hero-title font-display tracking-tight text-center leading-[1.1] max-w-[800px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Turn Everyday Annoyances into{" "}
            <span className="hero-title-orange block sm:inline">Projects Worth Building.</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle text-[var(--text-secondary)] text-center text-lg mt-6 max-w-[620px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            ScoutMind investigates real-world frustrations using autonomous AI agents
            and uncovers evidence-backed project opportunities.
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[620px] mx-auto mt-8"
          >
            <div className="spark-input-wrapper relative">
              <input
                type="text"
                value={spark}
                onChange={(e) => setSpark(e.target.value)}
                placeholder={EXAMPLE_SPARKS[placeholderIdx]}
                className="spark-input"
                disabled={loading}
                autoComplete="off"
              />
              <Search size={16} className="spark-input-icon" />
              <button
                type="submit"
                className="spark-submit"
                disabled={!spark.trim() || loading}
              >
                {loading ? "Investigating..." : "Investigate →"}
              </button>
            </div>
          </motion.form>

          <motion.div
            className="spark-examples flex flex-wrap justify-center gap-2 mt-6 text-sm text-[var(--text-muted)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <span className="mr-1 self-center">Try:</span>
            {EXAMPLE_SPARKS.slice(0, 3).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setSpark(ex)}
                className="spark-example"
              >
                {ex}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── LIVE INVESTIGATION DEMO FEED ── */}
      <AnimatePresence>
        {!transitioning && (
          <motion.section
            className="w-full max-w-[660px] mx-auto px-6 pb-24 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold text-[var(--brand-orange)] tracking-[0.1em] uppercase">
                Active Simulation Demo
              </span>
            </div>
            <HeroFeedDemo />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── FEATURES SECTION ── */}
      <section className="section border-t border-[var(--border-subtle)] relative z-10">
        <div className="section-label">◆ Engine Capabilities</div>
        <h2 className="section-title">
          Multi-Agent <span className="text-gradient-orange">Research Swarm</span>
        </h2>
        <p className="section-subtitle">
          Specialized autonomous researchers explore forums, trace evidence, and architecture opportunities.
        </p>

        <div className="features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="feature-card"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="feature-card-icon">
                  <Icon size={20} />
                </div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section border-t border-[var(--border-subtle)] relative z-10">
        <div className="section-label">◆ Process Framework</div>
        <h2 className="section-title">The Investigation Pipeline</h2>
        <p className="section-subtitle">
          Watch frustrations translate into tangible startup ideas in five sequential stages.
        </p>

        <div className="how-it-works">
          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="how-step"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              {i < HOW_STEPS.length - 1 && <div className="how-step-line" />}
              <div className="how-step-dot">{step.num}</div>
              <div className="how-step-content">
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer border-t border-[var(--border-subtle)]">
        <p className="footer-text">
          ScoutMind <span className="footer-orange">—</span> Investigate frustrations. Validate markets. Build with absolute evidence.
        </p>
      </footer>
    </div>
  );
}

/* ── Live Simulation Feed Component ── */
const STEP_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  planning: Zap,
  research: Search,
  pain_point_extraction: AlertTriangle,
  root_cause_analysis: GitBranch,
  solution_analysis: Activity,
  market_gap_detection: FileText,
  idea_generation: Trophy,
  evaluation: BarChart3,
  report_generation: Target,
};

const STEP_MESSAGES: Record<string, string> = {
  planning: "Formulating research strategy and target sources",
  research: "Navigating forums, social platforms, and discussion threads",
  pain_point_extraction: "Aggregated conversations matching target friction patterns",
  root_cause_analysis: "High severity pain point identified in user workflows",
  solution_analysis: "Existing solutions mapped — mostly enterprise-focused gaps",
  market_gap_detection: "Niche opportunity uncovered for underserved user segment",
  idea_generation: "Evidence-backed project concept generated",
  evaluation: "Idea scored across feasibility, market demand, and impact axes",
  report_generation: "Final recommendation compiled with supporting evidence",
};

const STEP_COLORS: Record<string, string> = {
  planning: "#FF8A00",
  research: "#3B82F6",
  pain_point_extraction: "#94a3b8",
  root_cause_analysis: "#F59E0B",
  solution_analysis: "#06b6d4",
  market_gap_detection: "#eab308",
  idea_generation: "#a855f7",
  evaluation: "#6366f1",
  report_generation: "#FF8A00",
};

const DEMO_STEPS = PIPELINE_STEPS.map((step) => ({
  step,
  label: PIPELINE_STEP_LABELS[step]?.title ?? step,
  message: STEP_MESSAGES[step] ?? "Processing...",
  icon: STEP_ICONS[step] ?? Activity,
  color: STEP_COLORS[step] ?? "#64748b",
}));

function HeroFeedDemo() {
  const [visible, setVisible] = useState(0);
  const [sparkIdx, setSparkIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible((v) => {
        if (v >= DEMO_STEPS.length) {
          setSparkIdx((s) => (s + 1) % EXAMPLE_SPARKS.length);
          return 0;
        }
        return v + 1;
      });
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-[rgba(15,15,15,0.7)] backdrop-blur-md border border-[var(--border)] rounded-2xl p-6 overflow-hidden shadow-xl">
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-orange)] animate-pulse" />
        <span className="text-xs font-mono text-[var(--text-secondary)] font-semibold tracking-wider">
          SIMULATION WORKSPACE:
        </span>
        <span className="text-xs font-mono text-[var(--brand-orange)] font-bold truncate">
          &quot;{EXAMPLE_SPARKS[sparkIdx]}&quot;
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {DEMO_STEPS.slice(0, visible).map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={`${sparkIdx}-${i}`}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-4 p-3 bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] rounded-lg border border-[var(--border-subtle)] transition-all duration-200"
              style={{ borderLeft: `3px solid ${step.color}` }}
            >
              <div className="text-base p-1.5 rounded bg-[rgba(255,255,255,0.03)]" style={{ color: step.color }}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: step.color }}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Stage 0{i + 1}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                  {step.message}
                </p>
              </div>
              {i === visible - 1 && (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] self-center ml-auto"
                />
              )}
            </motion.div>
          );
        })}
      </div>
      {visible > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
          <span>PIPELINE ANALYSIS STATUS</span>
          <span>{visible} / {DEMO_STEPS.length} PROCESS STAGES RESOLVED</span>
        </div>
      )}
    </div>
  );
}
