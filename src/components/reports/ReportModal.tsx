import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { EnrichedMemo } from "@/types/reports";
import { TopicDot, Label } from "./primitives";
import { ZWIAD } from "./tokens";

interface Props {
  report: EnrichedMemo | null;
  onClose: () => void;
}

export function ReportModal({ report, onClose }: Props) {
  useEffect(() => {
    if (!report) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [report, onClose]);

  if (!report) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 30, 25, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 640,
          width: "100%",
          background: ZWIAD.cream,
          border: `1px solid ${ZWIAD.rule}`,
          padding: "28px 32px",
          maxHeight: "80vh",
          overflow: "auto",
          fontFamily: "'EB Garamond', serif",
          color: ZWIAD.foreground,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TopicDot topic={report.topic} />
          <Label>
            {report.jurisdiction} · {report.topic} · {report.date}
          </Label>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: ZWIAD.muted,
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>
        <h2
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: 28,
            fontWeight: 600,
            margin: "12px 0 14px",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {report.title}
        </h2>
        <aside
          style={{
            borderLeft: `3px solid ${ZWIAD.topics[report.topic].color}`,
            background: ZWIAD.background,
            padding: "12px 16px",
            fontStyle: "italic",
            color: ZWIAD.muted,
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {report.summary}
        </aside>
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            color: ZWIAD.muted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Cluster: <span style={{ color: ZWIAD.topics[report.topic].color }}>{report.cluster_name}</span>
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <Link
            to={`/reports/${report.slug}`}
            onClick={onClose}
            style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: 14,
              fontWeight: 600,
              color: ZWIAD.primary,
              textDecoration: "none",
              padding: "6px 14px",
              border: `1px solid ${ZWIAD.primary}`,
              background: ZWIAD.background,
            }}
          >
            Read full report →
          </Link>
        </div>
      </div>
    </div>
  );
}
