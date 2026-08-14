const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import type {
  Investigation,
  InvestigationEvent,
  InvestigationStep,
  InvestigationSummary,
  ReportData,
} from "./types";

export interface CreateInvestigationInput {
  problem_statement: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("scoutmind_token");
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("scoutmind_token");
      window.location.href = "/login";
      throw new Error("Not authenticated");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createInvestigation(input: CreateInvestigationInput): Promise<Investigation> {
    return this.request<Investigation>("/api/investigations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getInvestigation(id: string): Promise<Investigation> {
    return this.request<Investigation>(`/api/investigations/${id}`);
  }

  async getEvents(id: string): Promise<InvestigationEvent[]> {
    return this.request<InvestigationEvent[]>(`/api/investigations/${id}/events`);
  }

  async getSteps(id: string): Promise<InvestigationStep[]> {
    return this.request<InvestigationStep[]>(`/api/investigations/${id}/steps`);
  }

  async getArtifactCounts(id: string): Promise<InvestigationSummary> {
    return this.request<InvestigationSummary>(`/api/investigations/${id}/artifact-counts`);
  }

  async getReport(id: string): Promise<ReportData> {
    return this.request<ReportData>(`/api/investigations/${id}/report`);
  }

  connectWebSocket(investigationId: string): WebSocket | null {
    if (typeof window === "undefined") return null;
    const token = getToken();
    if (!token) return null;

    const wsUrl = this.baseUrl.replace(/^http/, "ws");
    return new WebSocket(
      `${wsUrl}/ws/investigation/${investigationId}?token=${token}`
    );
  }
}

export const api = new ApiClient(API_BASE);
