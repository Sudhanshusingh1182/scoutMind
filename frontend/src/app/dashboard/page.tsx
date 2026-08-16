"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api, CreateInvestigationInput } from "@/lib/api";
import Header from "@/components/layout/header";
import { Search, Plus, X, Trash2, Clock, Lightbulb, FileText, ExternalLink } from "lucide-react";

interface InvestigationItem {
  id: number;
  problem_statement: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  idea_count: number;
  source_count: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  RUNNING: { label: "Running", color: "var(--brand-orange)", bg: "rgba(255, 138, 0, 0.08)" },
  COMPLETED: { label: "Completed", color: "var(--brand-orange)", bg: "rgba(255, 138, 0, 0.08)" },
  FAILED: { label: "Failed", color: "var(--color-error)", bg: "rgba(239, 68, 68, 0.08)" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="modal-content glass-panel"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="font-display font-bold text-lg text-white">Delete Investigation</h3>
          <button className="modal-close" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal-body mt-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to permanently delete this investigation? This action cannot be undone.
          </p>
          <div className="mt-4 p-3 bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.15)] rounded-lg text-xs text-[var(--color-error)]">
            Warning: This deletes all research, sources, and ideas associated with this investigation.
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="modal-delete-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="dashboard-empty-state border border-[var(--border)] rounded-2xl p-12 bg-[var(--bg-card)] mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-state-icon mx-auto">
        <Lightbulb size={28} />
      </div>
      <h2 className="mt-6 text-xl font-bold font-display text-white">No Sparks Yet</h2>
      <p className="text-[var(--text-secondary)] text-sm max-w-[340px] mx-auto mt-2">
        Type in your first frustration and let autonomous agents map the opportunities.
      </p>
      <motion.button
        className="empty-state-btn mt-6"
        onClick={onStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus size={15} />
        Start Investigation
      </motion.button>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [spark, setSpark] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchInvestigations = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (q) params.set("search", q);
      const res = await api.request<{ investigations: InvestigationItem[]; total: number }>(
        `/api/investigations?${params}`
      );
      setInvestigations(res.investigations);
      setTotal(res.total);
    } catch {
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) fetchInvestigations();
  }, [user, authLoading, router, fetchInvestigations]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!spark.trim()) return;
    setCreating(true);
    try {
      const input: CreateInvestigationInput = { problem_statement: spark.trim() };
      const inv = await api.createInvestigation(input);
      router.push(`/investigation/${inv.id}`);
    } catch (err) {
      console.error("Failed to create investigation", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.request(`/api/investigations/${deleteTarget}`, { method: "DELETE" });
      setInvestigations((prev) => prev.filter((i) => i.id !== deleteTarget));
      setTotal((t) => t - 1);
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeleteTarget(null);
    }
  }

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-orb" />
        <p className="text-sm text-[var(--text-secondary)] font-mono">Authenticating...</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="dashboard-page bg-dot-grid bg-[var(--bg-primary)]">
      <Header />
      <main className="dashboard-main relative z-10">
        <div className="dashboard-header flex items-end justify-between border-b border-[var(--border-subtle)] pb-6 mb-8">
          <div>
            <h1 className="dashboard-title font-display tracking-tight text-3xl font-extrabold text-white">
              Workspace
            </h1>
            <p className="dashboard-subtitle text-[var(--text-secondary)] text-sm">
              {total} active validation project{total !== 1 && "s"}
            </p>
          </div>
          <motion.button
            className="dashboard-create-btn"
            onClick={() => setShowCreate(!showCreate)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {showCreate ? <X size={15} /> : <Plus size={15} />}
            {showCreate ? "Close Panel" : "New Investigation"}
          </motion.button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.form
              onSubmit={handleCreate}
              className="create-form bg-[rgba(15,15,15,0.7)] backdrop-blur-md border border-[var(--border)] rounded-xl p-5 mb-8"
              initial={{ opacity: 0, y: -15, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -15, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <input
                type="text"
                value={spark}
                onChange={(e) => setSpark(e.target.value)}
                placeholder="Type a frustration (e.g. Renting short term is filled with platform scams...)"
                className="create-input text-sm"
                autoFocus
                required
                minLength={3}
              />
              <button type="submit" className="create-submit" disabled={creating}>
                {creating ? "Launching..." : "Investigate"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="dashboard-search relative mb-8">
          <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchInvestigations(e.target.value);
            }}
            placeholder="Search active investigation streams..."
            className="text-sm w-full bg-transparent border-none outline-none"
          />
        </div>

        {loading ? (
          <div className="dashboard-loading flex justify-center py-20 text-[var(--text-secondary)] font-mono text-sm">
            <span className="animate-pulse">Accessing database files...</span>
          </div>
        ) : investigations.length === 0 ? (
          <EmptyState onStart={() => setShowCreate(true)} />
        ) : (
          <motion.div
            className="dashboard-cards"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {investigations.map((inv) => {
              const badge = STATUS_CONFIG[inv.status] || { label: inv.status, color: "var(--text-muted)", bg: "rgba(255,255,255,0.04)" };
              const duration = inv.completed_at
                ? Math.round((new Date(inv.completed_at).getTime() - new Date(inv.created_at).getTime()) / 1000)
                : null;

              return (
                <motion.div
                  key={inv.id}
                  className="inv-card hover:shadow-lg"
                  variants={itemVariants}
                >
                  <div
                    className="inv-card-main flex-1"
                    onClick={() => router.push(
                      inv.status === "COMPLETED" ? `/report/${inv.id}` : `/investigation/${inv.id}`
                    )}
                  >
                    <div className="inv-card-spark font-display text-base font-semibold leading-snug">
                      {inv.problem_statement}
                    </div>
                    
                    <div className="inv-card-meta flex items-center gap-3 text-xs mt-3 text-[var(--text-secondary)]">
                      <span 
                        className="inv-card-status px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider"
                        style={{ color: badge.color, backgroundColor: badge.bg }}
                      >
                        {badge.label}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
                      <span className="inv-card-date">{new Date(inv.created_at).toLocaleDateString()}</span>
                      {duration !== null && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
                          <div className="flex items-center gap-1 font-mono">
                            <Clock size={11} />
                            <span>{duration}s</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="inv-card-stats flex items-center gap-6 mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-medium">
                      <span className="inv-card-stat">
                        <FileText size={13} className="text-[var(--text-faint)]" />
                        {inv.source_count} source{inv.source_count !== 1 && "s"} verified
                      </span>
                      <span className="inv-card-stat">
                        <Lightbulb size={13} className="text-[var(--text-faint)]" />
                        {inv.idea_count} startup concept{inv.idea_count !== 1 && "s"} formulated
                      </span>
                    </div>
                  </div>

                  <div className="inv-card-actions">
                    {inv.status === "COMPLETED" && (
                      <Link href={`/report/${inv.id}`} className="inv-card-action">
                        <ExternalLink size={15} />
                      </Link>
                    )}
                    <button
                      className="inv-card-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(inv.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
