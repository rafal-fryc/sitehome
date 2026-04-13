import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReportsGraphTooltip from "./ReportsGraphTooltip";

export type GraphCluster = {
  slug: string;
  name: string;
  topic: string;
  summary: string;
  reports: string[];
  dateRange: { first: string; latest: string };
  jurisdictions: string[];
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

type LaidOut = GraphCluster & { x: number; y: number; r: number; color: string };

type HoverState = {
  cluster: GraphCluster;
  clientX: number;
  clientY: number;
} | null;

export default function ReportsGraph({ clusters }: { clusters: GraphCluster[] }) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState>(null);

  const nodes = useMemo<LaidOut[]>(() => {
    const byTopic: Record<string, GraphCluster[]> = {};
    for (const c of clusters) {
      const key = TOPICS[c.topic] ? c.topic : "privacy";
      (byTopic[key] ||= []).push(c);
    }

    const out: LaidOut[] = [];
    for (const [topic, list] of Object.entries(byTopic)) {
      const cfg = TOPICS[topic];
      list.forEach((c, i) => {
        const hash = hashSlug(c.slug);
        const base = (hash % 360) * (Math.PI / 180);
        const offset = (i * 37) * (Math.PI / 180);
        const angle = base + offset;
        const x = cfg.cx + cfg.radius * Math.cos(angle);
        const y = cfg.cy + cfg.radius * Math.sin(angle);
        const r = Math.max(6, Math.min(16, 5 + c.reports.length * 2.5));
        out.push({ ...c, x, y, r, color: cfg.color });
      });
    }
    return out;
  }, [clusters]);

  // Edges: clusters sharing any jurisdiction (excluding "Unknown")
  const edges = useMemo(() => {
    const e: Array<{ a: LaidOut; b: LaidOut }> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const overlap = a.jurisdictions.some(
          (j) => j && j !== "Unknown" && b.jurisdictions.includes(j),
        );
        if (overlap) e.push({ a, b });
      }
    }
    return e;
  }, [nodes]);

  function handleMove(e: React.MouseEvent<SVGCircleElement>, cluster: GraphCluster) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHover({
      cluster,
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
        aria-label="Knowledge graph of regulatory subject clusters"
      >
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

        <g fill="none" stroke="#c9b88f" strokeWidth={0.6} opacity={0.7}>
          {Object.values(TOPICS).map((cfg, i) => (
            <circle key={i} cx={cfg.cx} cy={cfg.cy} r={cfg.radius} />
          ))}
        </g>

        <g stroke="#9a8b72" strokeWidth={0.8} opacity={0.55} strokeDasharray="2,2">
          {edges.map(({ a, b }, i) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          ))}
        </g>

        {/* Cluster nodes */}
        <g>
          {nodes.map((n) => {
            const isHover = hover?.cluster.slug === n.slug;
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
                onClick={() => navigate(`/reports/cluster/${n.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/reports/cluster/${n.slug}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${n.name} cluster — ${n.reports.length} reports`}
              >
                <title>{n.name}</title>
              </circle>
            );
          })}
        </g>
      </svg>

      {hover && (
        <ReportsGraphTooltip
          x={hover.clientX}
          y={hover.clientY}
          name={hover.cluster.name}
          topic={hover.cluster.topic}
          reportCount={hover.cluster.reports.length}
          summary={hover.cluster.summary}
        />
      )}
    </div>
  );
}
