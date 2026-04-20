import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import type { BgStyle, Cluster, EdgeMode, EnrichedMemo, FilterKey, TopicKey } from "@/types/reports";
import { BG_PALETTES, TOPIC_ANCHORS, VBH, VBW, ZWIAD } from "./tokens";
import {
  easeOutCubic,
  hash,
  layoutClusters,
  lerp,
  pickLabels,
  type LaidNode,
} from "./layoutEngine";
import { BackgroundLayer } from "./BackgroundLayer";
import { HoverCard } from "./HoverCard";
import { RecentStrip } from "./RecentStrip";
import { TopicDot, Label, ReportRow } from "./primitives";

interface Props {
  memos: EnrichedMemo[];
  clusters: Cluster[];
  filter: FilterKey;
  query: string;
  onOpenReport: (memo: EnrichedMemo) => void;
  edgeMode?: EdgeMode;
  bgStyle?: BgStyle;
}

interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DragState {
  startClientX: number;
  startClientY: number;
  rectW: number;
  rectH: number;
  startView: View;
  moved: boolean;
  captureTarget: Element;
  pointerId: number;
  captured: boolean;
}

interface ViewTween {
  from: View;
  to: View;
  t0: number;
  ms: number;
}

const HOME: View = { x: 0, y: 0, w: VBW, h: VBH };
const TWEEN_MS = 450;

export function ConstellationView({
  memos,
  clusters,
  filter,
  query,
  onOpenReport,
  edgeMode = "hover",
  bgStyle = "map",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const [, force] = useState(0);

  const [focusTopic, setFocusTopic] = useState<TopicKey | null>(null);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [hoverCluster, setHoverCluster] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [view, setView] = useState<View>(HOME);
  const viewRef = useRef<View>(view);
  viewRef.current = view;
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    setView((v) => {
      const minW = 120;
      const maxW = VBW * 1.2;
      const w = Math.max(minW, Math.min(maxW, v.w * factor));
      const h = w * (VBH / VBW);
      const nx = px - (px - v.x) * (w / v.w);
      const ny = py - (py - v.y) * (h / v.h);
      return { x: nx, y: ny, w, h };
    });
  }, []);

  const tweenViewRef = useRef<ViewTween | null>(null);
  const animateView = useCallback((target: View, ms = 600) => {
    tweenViewRef.current = {
      from: viewRef.current,
      to: target,
      t0: performance.now(),
      ms,
    };
  }, []);

  const zoomToTopic = useCallback(
    (topic: TopicKey) => {
      const a = TOPIC_ANCHORS[topic];
      const pad = 60;
      const w = (a.lobeR + pad) * 2;
      const h = w * (VBH / VBW);
      animateView({ x: a.cx - w / 2, y: a.cy - h / 2, w, h });
    },
    [animateView]
  );

  const zoomHome = useCallback(() => animateView(HOME), [animateView]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const v = viewRef.current;
      const px = v.x + ((e.clientX - rect.left) / rect.width) * v.w;
      const py = v.y + ((e.clientY - rect.top) / rect.height) * v.h;
      const factor = Math.exp(e.deltaY * 0.0016);
      zoomAt(factor, px, py);
    },
    [zoomAt]
  );

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      rectW: rect.width,
      rectH: rect.height,
      startView: viewRef.current,
      moved: false,
      captureTarget: e.currentTarget,
      pointerId: e.pointerId,
      captured: false,
    };
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    if (!d.moved && Math.hypot(dx, dy) > 3) {
      d.moved = true;
      try {
        (d.captureTarget as Element & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(
          d.pointerId
        );
        d.captured = true;
      } catch {
        // ignore — capture isn't critical
      }
      setIsDragging(true);
    }
    if (!d.moved) return;
    const v = d.startView;
    const nx = v.x - (dx / d.rectW) * v.w;
    const ny = v.y - (dy / d.rectH) * v.h;
    setView({ x: nx, y: ny, w: v.w, h: v.h });
  }, []);

  const handlePointerUp = useCallback(() => {
    const d = dragRef.current;
    if (d && d.captured) {
      try {
        (d.captureTarget as Element & { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(
          d.pointerId
        );
      } catch {
        // ignore
      }
    }
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => handleWheel(e);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [handleWheel]);

  const q = query.trim().toLowerCase();
  const matchesQ = useCallback((txt: string) => !q || txt.toLowerCase().includes(q), [q]);

  const visibleClusters = useMemo(
    () => clusters.filter((c) => filter === "all" || c.topic === filter),
    [clusters, filter]
  );

  const matchSet = useMemo<Set<string> | null>(() => {
    if (!q) return null;
    const s = new Set<string>();
    clusters.forEach((c) => {
      if (matchesQ(c.name) || matchesQ(c.summary)) s.add(c.slug);
    });
    memos.forEach((m) => {
      if (matchesQ(m.title)) s.add(m.cluster_slug);
    });
    return s;
  }, [clusters, memos, q, matchesQ]);

  const newLayout = useMemo(
    () => layoutClusters(visibleClusters, focusTopic),
    [visibleClusters, focusTopic]
  );

  const prevLayoutRef = useRef(newLayout);
  const targetLayoutRef = useRef(newLayout);
  const tweenStartRef = useRef(performance.now());

  useEffect(() => {
    prevLayoutRef.current = targetLayoutRef.current;
    targetLayoutRef.current = newLayout;
    tweenStartRef.current = performance.now();
  }, [newLayout]);

  useEffect(() => {
    const tick = (now: number) => {
      tRef.current = now / 1000;
      const tv = tweenViewRef.current;
      if (tv) {
        const t = Math.min(1, (now - tv.t0) / tv.ms);
        const e = easeOutCubic(t);
        setView({
          x: lerp(tv.from.x, tv.to.x, e),
          y: lerp(tv.from.y, tv.to.y, e),
          w: lerp(tv.from.w, tv.to.w, e),
          h: lerp(tv.from.h, tv.to.h, e),
        });
        if (t >= 1) tweenViewRef.current = null;
      }
      force((x) => (x + 1) % 1000000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const now = performance.now();
  const tween = Math.min(1, (now - tweenStartRef.current) / TWEEN_MS);
  const eased = easeOutCubic(tween);

  type Node = LaidNode & Cluster & { topicColor: string };

  const laid: Node[] = visibleClusters
    .map((c) => {
      const tgt = targetLayoutRef.current[c.slug];
      const prev = prevLayoutRef.current[c.slug] ?? tgt;
      if (!tgt) return null;
      const seed = hash(c.slug);
      const phase = ((seed % 1000) / 1000) * Math.PI * 2;
      const breathe = 2.5 * Math.sin(tRef.current * 0.4 + phase);
      const breatheY = 1.8 * Math.cos(tRef.current * 0.33 + phase * 1.3);
      const x = lerp(prev.cx, tgt.cx, eased) + breathe;
      const y = lerp(prev.cy, tgt.cy, eased) + breatheY;
      const nr = lerp(prev.nr, tgt.nr, eased);
      return {
        ...c,
        x,
        y,
        nr,
        focused: tgt.focused,
        topicColor: ZWIAD.topics[c.topic].color,
      };
    })
    .filter((n): n is Node => n !== null);

  const edges = useMemo<[Node, Node][]>(() => {
    if (edgeMode === "none") return [];
    if (edgeMode === "jurisdiction") {
      const out: [Node, Node][] = [];
      for (let i = 0; i < laid.length; i++) {
        for (let j = i + 1; j < laid.length; j++) {
          const a = laid[i];
          const b = laid[j];
          if (a.topic !== b.topic) continue;
          const overlap = a.jurisdictions.some(
            (x) => x && x !== "Unknown" && b.jurisdictions.includes(x)
          );
          if (overlap) out.push([a, b]);
        }
      }
      return out;
    }
    if (edgeMode === "temporal") {
      const out: [Node, Node][] = [];
      for (let i = 0; i < laid.length; i++) {
        for (let j = i + 1; j < laid.length; j++) {
          const a = laid[i];
          const b = laid[j];
          const da = new Date(a.dateRange.latest).getTime();
          const db = new Date(b.dateRange.latest).getTime();
          if (!da || !db) continue;
          if (Math.abs(da - db) <= 7 * 86400 * 1000) out.push([a, b]);
        }
      }
      return out;
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeMode, visibleClusters, eased]);

  const hoverEdges = useMemo<[Node, Node][]>(() => {
    if (edgeMode !== "hover" || !hoverCluster) return [];
    const src = laid.find((n) => n.slug === hoverCluster);
    if (!src) return [];
    return laid.filter((n) => n.slug !== hoverCluster && n.topic === src.topic).map((n) => [src, n]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeMode, hoverCluster, visibleClusters, eased]);

  const zoom = VBW / Math.max(1, view.w);

  const labelSet = useMemo(
    () => pickLabels(laid, !!focusTopic, matchSet, zoom),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleClusters, focusTopic, matchSet, zoom, eased]
  );
  const P = BG_PALETTES[bgStyle];

  const active = activeCluster ? clusters.find((c) => c.slug === activeCluster) ?? null : null;
  const activeReports = active
    ? memos
        .filter((m) => m.cluster_slug === active.slug)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const hoveredCluster = hoverCluster ? clusters.find((c) => c.slug === hoverCluster) ?? null : null;
  const hoveredReports = hoverCluster
    ? memos.filter((m) => m.cluster_slug === hoverCluster).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const recent = useMemo(
    () => memos.filter((m) => filter === "all" || m.topic === filter).slice(0, 10),
    [memos, filter]
  );

  const handleNodeMouseMove = (e: ReactMouseEvent<SVGCircleElement>, slug: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHoverCluster(slug);
    const v = viewRef.current;
    setHoverPos({
      x: v.x + ((e.clientX - rect.left) / rect.width) * v.w,
      y: v.y + ((e.clientY - rect.top) / rect.height) * v.h,
    });
  };

  const hoverPxX = containerRef.current
    ? ((hoverPos.x - view.x) / view.w) * containerRef.current.getBoundingClientRect().width
    : 0;
  const hoverPxY = containerRef.current
    ? ((hoverPos.y - view.y) / view.h) * containerRef.current.getBoundingClientRect().height
    : 0;

  return (
    <div>
      <RecentStrip
        reports={recent}
        onHoverCluster={setHoverCluster}
        onClickReport={onOpenReport}
        topicColors={{
          privacy: ZWIAD.topics.privacy.color,
          cybersecurity: ZWIAD.topics.cybersecurity.color,
          "ai-law": ZWIAD.topics["ai-law"].color,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <Label>
          Constellation — {visibleClusters.length} clusters
          {focusTopic ? ` · focused on ${focusTopic}` : " · hover to preview, click to open"}
        </Label>
        <div style={{ flex: 1 }} />
        {q && <Label>{matchSet?.size ?? 0} clusters match "{q}"</Label>}
        {focusTopic && (
          <button
            onClick={() => {
              setFocusTopic(null);
              setActiveCluster(null);
              zoomHome();
            }}
            style={{
              fontSize: 11,
              fontFamily: "'EB Garamond', serif",
              border: `1px solid ${ZWIAD.rule}`,
              background: ZWIAD.cream,
              padding: "4px 10px",
              cursor: "pointer",
              color: ZWIAD.foreground,
            }}
          >
            ← zoom out
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: active ? "1fr 380px" : "1fr",
          border: `1px solid ${ZWIAD.rule}`,
          background: "#0b1118",
          transition: "grid-template-columns 300ms",
        }}
      >
        <div
          ref={containerRef}
          style={{
            position: "relative",
            borderRight: active ? `1px solid ${ZWIAD.rule}` : "none",
            background: "#0b1118",
            cursor: isDragging ? "grabbing" : "grab",
            overflow: "hidden",
            touchAction: "none",
            userSelect: "none",
          }}
          onMouseLeave={() => setHoverCluster(null)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={(e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const v = viewRef.current;
            const px = v.x + ((e.clientX - rect.left) / rect.width) * v.w;
            const py = v.y + ((e.clientY - rect.top) / rect.height) * v.h;
            zoomAt(0.5, px, py);
          }}
        >
          <svg
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: 560, display: "block" }}
            onMouseMove={(e) => {
              const t = e.target as SVGElement;
              if (!(t && t.tagName === "circle" && t.getAttribute("data-cluster"))) {
                setHoverCluster(null);
              }
            }}
          >
            <defs>
              <radialGradient id="lobe-privacy" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={ZWIAD.topics.privacy.color} stopOpacity={P.haloAlpha} />
                <stop offset="70%" stopColor={ZWIAD.topics.privacy.color} stopOpacity={P.haloAlpha * 0.28} />
                <stop offset="100%" stopColor={ZWIAD.topics.privacy.color} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lobe-ai-law" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={ZWIAD.topics["ai-law"].color} stopOpacity={P.haloAlpha} />
                <stop offset="70%" stopColor={ZWIAD.topics["ai-law"].color} stopOpacity={P.haloAlpha * 0.28} />
                <stop offset="100%" stopColor={ZWIAD.topics["ai-law"].color} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lobe-cybersecurity" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={ZWIAD.topics.cybersecurity.color} stopOpacity={P.haloAlpha} />
                <stop offset="70%" stopColor={ZWIAD.topics.cybersecurity.color} stopOpacity={P.haloAlpha * 0.28} />
                <stop offset="100%" stopColor={ZWIAD.topics.cybersecurity.color} stopOpacity="0" />
              </radialGradient>
            </defs>

            <BackgroundLayer bgStyle={bgStyle} />

            {(Object.entries(TOPIC_ANCHORS) as [TopicKey, (typeof TOPIC_ANCHORS)[TopicKey]][]).map(
              ([t, a]) => {
                const focused = focusTopic === t;
                const opacity = !focusTopic || focused ? 1 : 0.12;
                const center = focused ? { cx: VBW / 2, cy: VBH / 2 } : a;
                const lobeR = focused ? 540 : a.lobeR;
                const labelAbove = !focused && t === "cybersecurity";
                const labelY = labelAbove ? center.cy - lobeR - 16 : center.cy + lobeR + 14;
                return (
                  <g key={t} style={{ transition: "opacity 300ms" }} opacity={opacity}>
                    <circle cx={center.cx} cy={center.cy} r={lobeR + 60} fill={`url(#lobe-${t})`} />
                    <circle
                      cx={center.cx}
                      cy={center.cy}
                      r={lobeR + 6}
                      fill="none"
                      stroke={ZWIAD.topics[t].color}
                      strokeDasharray="2 5"
                      strokeWidth={0.8}
                      opacity={P.lobeDashAlpha * 0.7}
                    />
                    {!focused && (
                      <g
                        style={{ cursor: focusTopic ? "default" : "pointer" }}
                        onClick={() => {
                          if (dragRef.current?.moved) return;
                          if (!focusTopic) {
                            setFocusTopic(t);
                            zoomToTopic(t);
                          }
                        }}
                      >
                        <rect
                          x={center.cx - 54}
                          y={labelY}
                          width={108}
                          height={22}
                          fill={P.pill}
                          stroke={ZWIAD.topics[t].color}
                          strokeWidth={1}
                        />
                        <text
                          x={center.cx}
                          y={labelY + 15}
                          textAnchor="middle"
                          fontSize={12}
                          fontFamily="EB Garamond, serif"
                          fill={ZWIAD.topics[t].color}
                          style={{
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            pointerEvents: "none",
                          }}
                        >
                          {a.label}
                        </text>
                      </g>
                    )}
                    {focused && (
                      <text
                        x={center.cx}
                        y={center.cy - lobeR - 20}
                        textAnchor="middle"
                        fontSize={14}
                        fontFamily="EB Garamond, serif"
                        fill={ZWIAD.topics[t].color}
                        fontWeight={600}
                        style={{
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          pointerEvents: "none",
                        }}
                      >
                        {a.label}
                      </text>
                    )}
                  </g>
                );
              }
            )}

            <g>
              {edges.map(([a, b], i) => (
                <line
                  key={`e-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={ZWIAD.topics[a.topic].color}
                  strokeWidth={0.5}
                  opacity={0.18}
                />
              ))}
              {hoverEdges.map(([a, b], i) => (
                <line
                  key={`he-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={ZWIAD.topics[a.topic].color}
                  strokeWidth={0.7}
                  opacity={0.42}
                />
              ))}
            </g>

            <g>
              {laid.map((n) => {
                const isActive = activeCluster === n.slug;
                const isHover = hoverCluster === n.slug;
                const matched = !matchSet || matchSet.has(n.slug);
                const dimTopic = focusTopic && n.topic !== focusTopic;
                const dim = dimTopic || (matchSet && !matched);
                const opacity = dim ? 0.12 : 1;
                const lbl = labelSet.get(n.slug);
                const extraR =
                  matchSet && matched && q ? 3 + 1.5 * Math.sin(tRef.current * 4 + hash(n.slug)) : 0;
                return (
                  <g key={n.slug} opacity={opacity} style={{ transition: "opacity 260ms" }}>
                    {matched && q && (
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={n.nr + 6}
                        fill="none"
                        stroke={n.topicColor}
                        strokeWidth={1}
                        opacity={0.4}
                      />
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.nr + (isHover || isActive ? 2.5 : 0) + extraR}
                      fill={n.topicColor}
                      data-cluster={n.slug}
                      stroke={isActive ? P.ink : "transparent"}
                      strokeWidth={1.8}
                      style={{ cursor: "pointer" }}
                      onMouseMove={(e) => handleNodeMouseMove(e, n.slug)}
                      onMouseEnter={(e) => handleNodeMouseMove(e, n.slug)}
                      onMouseLeave={() => setHoverCluster(null)}
                      onClick={(e) => {
                        if (dragRef.current?.moved) return;
                        e.stopPropagation();
                        setActiveCluster(n.slug);
                      }}
                    />
                    {lbl && (
                      <g style={{ pointerEvents: "none" }}>
                        <rect
                          x={lbl.x - 3}
                          y={lbl.y - 1}
                          width={lbl.w}
                          height={lbl.h + 2}
                          rx={1.5}
                          fill={P.pill}
                          opacity={0.82}
                        />
                        <text
                          x={lbl.x}
                          y={lbl.y + lbl.fs - 1}
                          fontSize={lbl.fs}
                          fontFamily="EB Garamond, serif"
                          fill={P.ink}
                          opacity={0.96}
                        >
                          {lbl.text}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {hoverCluster && !activeCluster && (
            <HoverCard
              cluster={hoveredCluster}
              reports={hoveredReports}
              x={hoverPxX}
              y={hoverPxY}
              containerW={containerRef.current?.getBoundingClientRect().width ?? 800}
            />
          )}

          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontFamily: "'EB Garamond', serif",
            }}
          >
            {[
              {
                sym: "+",
                title: "Zoom in",
                act: () => zoomAt(0.7, view.x + view.w / 2, view.y + view.h / 2),
              },
              {
                sym: "−",
                title: "Zoom out",
                act: () => zoomAt(1.5, view.x + view.w / 2, view.y + view.h / 2),
              },
              { sym: "⌂", title: "Home", act: zoomHome },
            ].map(({ sym, title, act }) => (
              <button
                key={sym}
                title={title}
                onClick={act}
                style={{
                  width: 34,
                  height: 34,
                  background: P.isDark ? "rgba(11,17,24,0.72)" : "rgba(255,255,255,0.72)",
                  color: P.ink,
                  border: `1px solid ${P.rule}`,
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  backdropFilter: "blur(6px)",
                }}
              >
                {sym}
              </button>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 14,
              display: "flex",
              gap: 14,
              fontFamily: "'EB Garamond', serif",
              fontSize: 11,
              color: P.labelSubtle,
              pointerEvents: "none",
            }}
          >
            <span>drag to pan · scroll to zoom · dbl-click to zoom in</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>
              {edgeMode === "none"
                ? "no edges"
                : edgeMode === "jurisdiction"
                ? "edges: shared jurisdiction"
                : edgeMode === "temporal"
                ? "edges: active same week"
                : "edges on hover"}
            </span>
          </div>
        </div>

        {active && (
          <div
            style={{
              padding: "18px 22px",
              background: ZWIAD.cream,
              maxHeight: 700,
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TopicDot topic={active.topic} />
              <Label>
                {active.topic} · {activeReports.length} reports
                {active.dateRange.latest ? ` · ${active.dateRange.latest}` : ""}
              </Label>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setActiveCluster(null)}
                aria-label="Close cluster detail"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: ZWIAD.muted,
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <h3
              style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: 24,
                fontWeight: 600,
                margin: "12px 0 8px",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: ZWIAD.foreground,
              }}
            >
              {active.name}
            </h3>
            <aside
              style={{
                borderLeft: `3px solid ${ZWIAD.topics[active.topic].color}`,
                padding: "10px 14px",
                background: ZWIAD.background,
                fontStyle: "italic",
                color: ZWIAD.muted,
                fontSize: 14,
                lineHeight: 1.55,
                marginBottom: 14,
              }}
            >
              {active.summary}
            </aside>

            {active.jurisdictions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {active.jurisdictions.map((j) => (
                  <span
                    key={j}
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      padding: "3px 8px",
                      background: ZWIAD.background,
                      border: `1px solid ${ZWIAD.rule}`,
                      color: ZWIAD.muted,
                      fontFamily: "'EB Garamond', serif",
                    }}
                  >
                    {j}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              <Label>reports in this cluster</Label>
              <div style={{ flex: 1 }} />
              <Link
                to={`/reports/cluster/${active.slug}`}
                style={{
                  fontFamily: "'EB Garamond', serif",
                  fontSize: 11,
                  color: ZWIAD.primary,
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Open cluster page →
              </Link>
            </div>
            <div style={{ border: `1px solid ${ZWIAD.rule}`, background: ZWIAD.background }}>
              {activeReports.map((r, i) => (
                <div key={r.slug} style={{ borderTop: i === 0 ? "none" : `1px solid ${ZWIAD.rule}` }}>
                  <ReportRow report={r} onClick={() => onOpenReport(r)} dense />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
