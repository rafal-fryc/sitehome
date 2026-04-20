import type { CSSProperties, ReactNode } from "react";
import type { EnrichedMemo, FilterKey, TopicKey } from "@/types/reports";
import { ZWIAD } from "./tokens";

export const TopicDot = ({ topic, size = 8 }: { topic: TopicKey; size?: number }) => (
  <span
    aria-hidden
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background: ZWIAD.topics[topic]?.color ?? "#888",
      flexShrink: 0,
    }}
  />
);

interface TopicChipProps {
  topic: FilterKey;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export const TopicChip = ({ topic, active, onClick, count }: TopicChipProps) => {
  const isAll = topic === "all";
  const meta = isAll ? null : ZWIAD.topics[topic];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 12px",
        fontSize: 12,
        fontFamily: "'EB Garamond', serif",
        border: `1px solid ${active ? ZWIAD.foreground : ZWIAD.rule}`,
        borderRadius: 999,
        background: active ? ZWIAD.foreground : ZWIAD.background,
        color: active ? ZWIAD.background : ZWIAD.foreground,
        cursor: "pointer",
        transition: "background 120ms, color 120ms, border-color 120ms",
      }}
    >
      {!isAll && <TopicDot topic={topic as TopicKey} size={7} />}
      <span>{isAll ? "all" : meta?.label}</span>
      {typeof count === "number" && (
        <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 2 }}>{count}</span>
      )}
    </button>
  );
};

interface StatCardProps {
  big: ReactNode;
  label: string;
  accent?: string;
}

export const StatCard = ({ big, label, accent = ZWIAD.primary }: StatCardProps) => (
  <div
    style={{
      background: ZWIAD.cream,
      border: `1px solid ${ZWIAD.rule}`,
      borderLeft: `3px solid ${accent}`,
      padding: "14px 16px",
    }}
  >
    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 28, lineHeight: 1, color: ZWIAD.foreground }}>
      {big}
    </div>
    <div
      style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: ZWIAD.muted,
        marginTop: 6,
        fontFamily: "'EB Garamond', serif",
      }}
    >
      {label}
    </div>
  </div>
);

export const Label = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: ZWIAD.muted,
      fontFamily: "'EB Garamond', serif",
      ...style,
    }}
  >
    {children}
  </div>
);

interface ReportRowProps {
  report: EnrichedMemo;
  onClick: () => void;
  showCluster?: boolean;
  dense?: boolean;
}

export const ReportRow = ({ report, onClick, showCluster = false, dense = false }: ReportRowProps) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "grid",
      gridTemplateColumns: showCluster ? "14px 1fr 140px 110px 76px" : "14px 1fr 110px 76px",
      gap: 14,
      alignItems: "center",
      padding: dense ? "7px 16px" : "11px 16px",
      width: "100%",
      textAlign: "left",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: ZWIAD.foreground,
      fontFamily: "'EB Garamond', serif",
      transition: "background 120ms",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = ZWIAD.background)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <TopicDot topic={report.topic} />
    <span style={{ fontSize: 14.5, lineHeight: 1.35 }}>{report.title}</span>
    {showCluster && (
      <span
        style={{
          fontSize: 11.5,
          color: ZWIAD.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {report.cluster_name}
      </span>
    )}
    <span
      style={{
        fontSize: 12,
        color: ZWIAD.muted,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {report.jurisdiction}
    </span>
    <span style={{ fontSize: 12, color: ZWIAD.muted, textAlign: "right" }}>{report.date}</span>
  </button>
);
