import type { Cluster, Memo } from "@/types/reports";
import { ZWIAD } from "./tokens";

interface Props {
  cluster: Cluster | null;
  reports: Memo[];
  x: number;
  y: number;
  containerW: number;
}

export function HoverCard({ cluster, reports, x, y, containerW }: Props) {
  if (!cluster) return null;
  const flip = x > containerW - 280;
  const left = flip ? x - 280 - 12 : x + 14;
  const topic = cluster.topic;
  const latest = reports[0];
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: Math.max(10, y - 50),
        width: 280,
        background: ZWIAD.cream,
        border: `1px solid ${ZWIAD.rule}`,
        borderLeft: `3px solid ${ZWIAD.topics[topic].color}`,
        padding: "10px 12px",
        pointerEvents: "none",
        zIndex: 4,
        boxShadow: "0 8px 16px -10px rgba(40,60,50,0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: ZWIAD.topics[topic].color,
          marginBottom: 6,
          fontFamily: "'EB Garamond', serif",
        }}
      >
        <span>{topic}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>
          {cluster.reportCount} report{cluster.reportCount === 1 ? "" : "s"}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'EB Garamond', serif",
          fontSize: 15,
          fontWeight: 600,
          color: ZWIAD.foreground,
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
          marginBottom: 6,
        }}
      >
        {cluster.name}
      </div>
      <div
        style={{
          fontFamily: "'EB Garamond', serif",
          fontSize: 12,
          lineHeight: 1.45,
          color: ZWIAD.muted,
          fontStyle: "italic",
          marginBottom: 8,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {cluster.summary}
      </div>
      {latest && (
        <div
          style={{
            fontSize: 11,
            color: ZWIAD.foreground,
            lineHeight: 1.3,
            borderTop: `1px dotted ${ZWIAD.rule}`,
            paddingTop: 6,
          }}
        >
          <div
            style={{
              color: ZWIAD.muted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: 9,
              marginBottom: 2,
            }}
          >
            latest · {latest.date}
          </div>
          {latest.title}
        </div>
      )}
    </div>
  );
}
