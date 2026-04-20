import type { EnrichedMemo, TopicKey } from "@/types/reports";
import { ZWIAD } from "./tokens";

interface Props {
  reports: EnrichedMemo[];
  onHoverCluster?: (slug: string | null) => void;
  onClickReport?: (memo: EnrichedMemo) => void;
  topicColors: Record<TopicKey, string>;
}

export function RecentStrip({ reports, onHoverCluster, onClickReport, topicColors }: Props) {
  const top = reports.slice(0, 6);
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        border: `1px solid ${ZWIAD.rule}`,
        background: ZWIAD.cream,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderRight: `1px solid ${ZWIAD.rule}`,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: ZWIAD.muted,
          fontFamily: "'EB Garamond', serif",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          background: ZWIAD.background,
        }}
      >
        most
        <br />
        recent
      </div>
      <div style={{ display: "flex", overflowX: "auto", flex: 1 }}>
        {top.map((r, i) => (
          <button
            key={r.slug}
            onMouseEnter={() => onHoverCluster?.(r.cluster_slug)}
            onMouseLeave={() => onHoverCluster?.(null)}
            onClick={() => onClickReport?.(r)}
            style={{
              flexShrink: 0,
              minWidth: 220,
              maxWidth: 280,
              padding: "10px 14px",
              textAlign: "left",
              background: "transparent",
              border: "none",
              borderRight: i < top.length - 1 ? `1px solid ${ZWIAD.rule}` : "none",
              cursor: "pointer",
              color: ZWIAD.foreground,
              fontFamily: "'EB Garamond', serif",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = ZWIAD.background)}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: ZWIAD.muted,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: topicColors[r.topic],
                }}
              />
              <span>{r.date}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{r.jurisdiction}</span>
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {r.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
