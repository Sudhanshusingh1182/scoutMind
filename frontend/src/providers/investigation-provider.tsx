"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  InvestigationEvent,
  InvestigationStep,
  InvestigationStatus,
  InvestigationSummary,
  ReportData,
  StepStatus,
} from "@/lib/types";
import { api } from "@/lib/api";

interface InvestigationContextValue {
  events: InvestigationEvent[];
  steps: InvestigationStep[];
  status: InvestigationStatus;
  problemStatement: string;
  connected: boolean;
  progress: number;
  summary: InvestigationSummary;
  report: ReportData | null;
  reportSections: Record<string, unknown>;
}

const InvestigationContext = createContext<InvestigationContextValue | null>(null);

export function useInvestigation() {
  const ctx = useContext(InvestigationContext);
  if (!ctx) throw new Error("useInvestigation must be used within InvestigationProvider");
  return ctx;
}

interface InvestigationProviderProps {
  investigationId: string;
  children: ReactNode;
}

export function InvestigationProvider({
  investigationId,
  children,
}: InvestigationProviderProps) {
  const [events, setEvents] = useState<InvestigationEvent[]>([]);
  const [steps, setSteps] = useState<InvestigationStep[]>([]);
  const [status, setStatus] = useState<InvestigationStatus>("pending");
  const [problemStatement, setProblemStatement] = useState("");
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<InvestigationSummary>({
    sources: 0,
    pain_points: 0,
    root_causes: 0,
    solutions: 0,
    market_gaps: 0,
    project_ideas: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportSections, setReportSections] = useState<Record<string, unknown>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventIdRef = useRef(0);
  const statusRef = useRef<InvestigationStatus>("pending");

  const addEvent = useCallback((eventType: string, message: string, metadata?: Record<string, unknown>) => {
    eventIdRef.current += 1;
    const newEvent: InvestigationEvent = {
      id: eventIdRef.current,
      investigation_id: investigationId,
      event_type: eventType as InvestigationEvent["event_type"],
      message,
      metadata: metadata || null,
    };
    setEvents((prev) => [...prev, newEvent]);
  }, [investigationId]);

  const handleStepUpdate = useCallback((stepData: { step_name: string; status: StepStatus; execution_time?: number; db_id?: number }) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.step_name === stepData.step_name);
      const now = new Date().toISOString();
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status: stepData.status,
          execution_time: stepData.execution_time ?? updated[idx].execution_time,
          completed_at: stepData.status === "COMPLETED" ? now : updated[idx].completed_at,
          started_at: stepData.status === "PROCESSING" && !updated[idx].started_at ? now : updated[idx].started_at,
        };
        return updated;
      } else {
        return [...prev, {
          id: stepData.db_id || prev.length + 1,
          step_name: stepData.step_name,
          status: stepData.status,
          execution_time: stepData.execution_time || null,
          started_at: stepData.status === "PROCESSING" ? now : null,
          completed_at: stepData.status === "COMPLETED" ? now : null,
          error_message: null,
          output_json: null,
          input_json: null,
          metadata_json: null,
        }];
      }
    });
  }, []);

  const connect = useCallback(() => {
    const ws = api.connectWebSocket(investigationId);
    if (!ws) return;

    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === "step_update") {
          handleStepUpdate(data.step);
        } else if (data.type === "event") {
          addEvent(data.event.event_type, data.event.message, data.event.metadata);
        } else if (data.type === "status") {
          const incomingStatus = data.status as InvestigationStatus;
          setStatus(incomingStatus);
          statusRef.current = incomingStatus;
          if (data.progress !== null && data.progress !== undefined) {
            setProgress(data.progress);
          }
        } else if (data.type === "summary") {
          setSummary(data.summary);
        } else if (data.type === "artifact_count") {
          const { artifact_type, count } = data;
          setSummary((s) => ({ ...s, [artifact_type]: count }));
        } else if (data.type === "report_section") {
          setReportSections((prev) => ({
            ...prev,
            [data.section_key]: data.section_data,
          }));
        } else if (data.type === "pong") {
          // heartbeat
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      const currentStatus = statusRef.current;
      if (currentStatus !== "completed" && currentStatus !== "failed" && currentStatus !== "COMPLETED" && currentStatus !== "FAILED") {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      setConnected(false);
    };
  }, [investigationId, addEvent, handleStepUpdate]);

  useEffect(() => {
    let cancelled = false;

    api.getInvestigation(investigationId).then((inv) => {
      if (cancelled) return;
      setProblemStatement(inv.problem_statement);
      const isCompleted = inv.status === "completed" || inv.status === "COMPLETED";
      setStatus(inv.status as InvestigationStatus);
      statusRef.current = inv.status as InvestigationStatus;

      api.getSteps(investigationId).then((stepsData) => {
        if (cancelled) return;
        setSteps(stepsData);
        const total = stepsData.length || 9;
        const completedCount = stepsData.filter((s) => s.status === "COMPLETED").length;
        setProgress(Math.round((completedCount / total) * 100));
      }).catch(() => {});

      api.getArtifactCounts(investigationId).then((counts) => {
        if (cancelled) return;
        setSummary(counts);
      }).catch(() => {});

      if (!isCompleted) {
        connect();
      }
    }).catch(() => {});

    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30000);

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(heartbeat);
      if (wsRef.current) wsRef.current.close();
    };
  }, [investigationId, connect]);

  return (
    <InvestigationContext.Provider
      value={{
        events,
        steps,
        status,
        problemStatement,
        connected,
        progress,
        summary,
        report,
        reportSections,
      }}
    >
      {children}
    </InvestigationContext.Provider>
  );
}
