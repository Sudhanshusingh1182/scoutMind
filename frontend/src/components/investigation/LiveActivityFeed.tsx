"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useInvestigation } from "@/providers/investigation-provider";
import {
  EVENT_LABELS,
  EVENT_COLORS,
  EVENT_TYPE_TO_ICONS,
  type EventType,
} from "@/lib/types";
import {
  Play, Search, FileText, AlertTriangle, GitBranch,
  TrendingUp, Compass, Trophy, Lightbulb, BarChart3,
  CheckCircle, XCircle, Brain, Loader2, Activity,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Play, Search, FileText, AlertTriangle, GitBranch,
  TrendingUp, Compass, Trophy, Lightbulb, BarChart3,
  CheckCircle, XCircle, Brain, Loader2, Activity,
};

function getIcon(eventType: string): React.ComponentType<{ size?: number }> {
  const iconName = EVENT_TYPE_TO_ICONS[eventType] || "FileText";
  return ICON_MAP[iconName] || FileText;
}

function getColor(eventType: string): string {
  return EVENT_COLORS[eventType as EventType] || "#64748b";
}

function getLabel(eventType: string): string {
  return EVENT_LABELS[eventType as EventType] || eventType.replace(/_/g, " ");
}

export default function LiveActivityFeed() {
  const { events, status } = useInvestigation();
  const [eventTimes, setEventTimes] = useState<Record<number, string>>({});

  useEffect(() => {
    setEventTimes((prev) => {
      const updated = { ...prev };
      let changed = false;
      const now = new Date();
      events.forEach((e) => {
        if (!updated[e.id]) {
          const index = events.indexOf(e);
          const offsetSeconds = (events.length - 1 - index) * 4;
          const time = new Date(now.getTime() - offsetSeconds * 1000);
          updated[e.id] = time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [events]);

  const isRunning =
    status === "researching" || status === "pending" || status === "RUNNING";

  const ordered = useMemo(() => [...events].reverse(), [events]);

  return (
    <div className="dash-feed">
      {ordered.map((event) => {
        const Icon = getIcon(event.event_type);
        const color = getColor(event.event_type);
        const label = getLabel(event.event_type);
        const eventTime = eventTimes[event.id] || "00:00:00";
        const message = event.message || label;
        return (
          <div className="dash-feed-item" key={event.id}>
            <div
              className="dash-feed-icon"
              style={{ color, background: `${color}14`, borderColor: `${color}33` }}
            >
              <Icon size={13} />
            </div>
            <div className="dash-feed-body">
              <div className="dash-feed-top">
                <span className="dash-feed-title">{label}</span>
                <span className="dash-feed-time">{eventTime}</span>
              </div>
              <div className="dash-feed-desc">{message}</div>
            </div>
          </div>
        );
      })}

      {events.length === 0 && (
        <div className="dash-feed-empty">
          {isRunning ? "Waiting for events…" : "No activity yet"}
        </div>
      )}
    </div>
  );
}
