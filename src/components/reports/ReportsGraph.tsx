import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReportsGraphTooltip from "./ReportsGraphTooltip";

export type GraphMemo = {
  slug: string;
  title: string;
  date: string;
  topic: string;
  jurisdiction: string;
  summary: string;
};

const VIEWBOX_W = 780;
const VIEWBOX_H = 280;

const TOPICS: Record<string, { cx: number; cy: number; radius: number; color: string; label: string }> = {
  privacy: { cx: 190, cy: 140, radius: 82, color: "#9a6b3f", label: "privacy" },
  cybersecurity: { cx: 420, cy: 80, radius: 60, color: "#2d5c5c", label: "cybersecurity" },
  "ai-law": { cx: 620, cy: 160, radius: 70, color: "#8a3a3a", label: "ai-law" },
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

type LaidOut = GraphMemo & { x: number; y: number; r: number; color: string };

type HoverState = {
  memo: GraphMemo;
  clientX: number;
  clientY: number;
} | null;

export default function ReportsGraph({ memos }: { memos: GraphMemo[] }) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState>(null);

  // Distribute memos on their topic's orbit by slug-hash, then count jurisdictional neighbors for size
  const nodes = useMemo<LaidOut[]>(() => {
    const byTopic: Record<string, GraphMemo[]> = {};
    for (const m of memos) {
      const key = TOPICS[m.topic] ? m.topic : "privacy";
      (byTopic[key] ||= []).push(m);
    }

    const jurCounts: Record<string, number> = {};
    for (const m of memos) {
      if (m.jurisdiction && m.jurisdiction !== "Unknown") {
        jurCounts[m.jurisdiction] = (jurCounts[m.jurisdiction] || 0) + 1;
      }
    }

    const out: LaidOut[] = [];
    for (const [topic, list] of Object.entries(byTopic)) {
      const cfg = TOPICS[topic];
      list.forEach((m, i) => {
        // Stable angle seeded by slug hash, plus small index-based jitter so same-hash collisions spread
        const hash = hashSlug(m.slug);
        const base = (hash % 360) * (Math.PI / 180);
        const offset = (i * 37) * (Math.PI / 180);
        const angle = base + offset;
        const x = cfg.cx + cfg.radius * Math.cos(angle);
        const y = cfg.cy + cfg.radius * Math.sin(angle);
        const neighbors = jurCounts[m.jurisdiction] || 1;
        const r = Math.max(5, Math.min(11, 4 + neighbors * 1.5));
        out.push({ ...m, x, y, r, color: cfg.color });
      });
    }
    return out;
  }, [memos]);

  // Edges: pairs sharing a non-Unknown jurisdiction
  const edges = useMemo(() => {
    const e: Array<{ a: LaidOut; b: LaidOut }> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (
          a.jurisdiction &&
          a.jurisdiction !== "Unknown" &&
          a.jurisdiction === b.jurisdiction
        ) {
          e.push({ a, b });
        }
      }
    }
    return e;
  }, [nodes]);

  function handleMove(e: React.MouseEvent<SVGCircleElement>, memo: GraphMemo) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHover({
      memo,
      clientX: e.clientX - rect.left,
      clientY: e.clientY - rect.top,
    });
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="w-full h-[320px] bg-cream border border-rule rounded"
        role="img"
        aria-label="Knowledge graph of regulatory research memos organized by topic and jurisdiction"
      >
        {/* Topic anchor glows */}
        {Object.entries(TOPICS).map(([k, cfg]) => (
          <g key={k}>
            <circle cx={cfg.cx} cy={cfg.cy} r={44} fill={cfg.color} opacity={0.14} />
            <circle cx={cfg.cx} cy={cfg.cy} r={22} fill={cfg.color} opacity={0.35} />
            <text
              x={cfg.cx}
              y={cfg.cy + 4}
              textAnchor="middle"
              fontSize="13"
              fontFamily="EB Garamond, serif"
              fill="hsl(var(--muted-foreground))"
            >
              {cfg.label}
            </text>
          </g>
        ))}

        {/* Orbit rings */}
        <g fill="none" stroke="#c9b88f" strokeWidth={0.6} opacity={0.7}>
          {Object.values(TOPICS).map((cfg, i) => (
            <circle key={i} cx={cfg.cx} cy={cfg.cy} r={cfg.radius} />
          ))}
        </g>

        {/* Jurisdictional edges */}
        <g stroke="#9a8b72" strokeWidth={0.8} opacity={0.55} strokeDasharray="2,2">
          {edges.map(({ a, b }, i) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          ))}
        </g>

        {/* Memo nodes */}
        <g>
          {nodes.map((n) => {
            const isHover = hover?.memo.slug === n.slug;
            return (
              <circle
                key={n.slug}
                cx={n.x}
                cy={n.y}
                r={isHover ? n.r + 2 : n.r}
                fill={n.color}
                stroke={isHover ? "hsl(var(--foreground))" : "none"}
                strokeWidth={isHover ? 1.5 : 0}
                style={{ cursor: "pointer", transition: "r 120ms, stroke-width 120ms" }}
                onMouseEnter={(e) => handleMove(e, n)}
                onMouseMove={(e) => handleMove(e, n)}
                onMouseLeave={() => setHover(null)}
                onClick={() => navigate(`/reports/${n.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/reports/${n.slug}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${n.title} — ${n.jurisdiction}, ${n.topic}, ${n.date}`}
              >
                <title>{n.title}</title>
              </circle>
            );
          })}
        </g>
      </svg>

      {hover && (
        <ReportsGraphTooltip
          x={hover.clientX}
          y={hover.clientY}
          title={hover.memo.title}
          topic={hover.memo.topic}
          jurisdiction={hover.memo.jurisdiction}
          date={hover.memo.date}
          summary={hover.memo.summary}
        />
      )}
    </div>
  );
}
