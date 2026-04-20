import type { Cluster, TopicKey } from "@/types/reports";
import { TOPIC_ANCHORS } from "./tokens";

export const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export const rand = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface HexPoint { x: number; y: number; d: number; }

export function hexPack(n: number, cx: number, cy: number, R: number, spacing: number): HexPoint[] {
  const pts: HexPoint[] = [];
  const rows = Math.ceil((R * 2) / (spacing * 0.866)) + 2;
  for (let row = -rows; row <= rows; row++) {
    const y = cy + row * spacing * 0.866;
    const xOff = row % 2 ? spacing / 2 : 0;
    const cols = Math.ceil((R * 2) / spacing) + 2;
    for (let col = -cols; col <= cols; col++) {
      const x = cx + col * spacing + xOff;
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= R * R) pts.push({ x, y, d: Math.sqrt(dx * dx + dy * dy) });
    }
  }
  pts.sort((a, b) => a.d - b.d);
  return pts.slice(0, n);
}

export interface LayoutEntry {
  topic: TopicKey;
  cx: number;
  cy: number;
  nr: number;
  focused: boolean;
  ring: number;
  rank: number;
}

export function layoutClusters(
  clusters: Cluster[],
  focusTopic: TopicKey | null
): Record<string, LayoutEntry> {
  const byTopic: Record<TopicKey, Cluster[]> = { privacy: [], cybersecurity: [], "ai-law": [] };
  clusters.forEach((c) => byTopic[c.topic]?.push(c));

  const layout: Record<string, LayoutEntry> = {};
  (Object.entries(byTopic) as [TopicKey, Cluster[]][]).forEach(([topic, list]) => {
    const anchor = TOPIC_ANCHORS[topic];
    const focused = focusTopic === topic;
    const sorted = [...list].sort((a, b) => b.reportCount - a.reportCount);

    const area = Math.PI * anchor.lobeR * anchor.lobeR;
    const targetCellArea = (area * 0.55) / Math.max(1, sorted.length);
    const spacing = Math.max(11, Math.sqrt(targetCellArea / 0.866));
    let pts = hexPack(sorted.length, anchor.cx, anchor.cy, anchor.lobeR, spacing);
    if (pts.length < sorted.length) {
      pts = hexPack(sorted.length, anchor.cx, anchor.cy, anchor.lobeR, Math.max(8, spacing - 2));
    }

    sorted.forEach((c, i) => {
      const p = pts[i] ?? { x: anchor.cx, y: anchor.cy, d: 0 };
      const nr = Math.max(3, Math.min(8, 2.8 + c.reportCount * 0.75));
      const seed = hash(c.slug);
      const r = rand(seed);
      const theta = r() * Math.PI * 2;
      const mag = (0.22 + r() * 0.55) * (pts[i] ? 6 : 0);
      const jx = Math.cos(theta) * mag;
      const jy = Math.sin(theta) * mag;
      const dx = p.x + jx - anchor.cx;
      const dy = p.y + jy - anchor.cy;
      const dist = Math.hypot(dx, dy);
      const maxR = anchor.lobeR - 3;
      const scale = dist > maxR ? maxR / dist : 1;
      layout[c.slug] = {
        topic,
        cx: anchor.cx + dx * scale,
        cy: anchor.cy + dy * scale,
        nr,
        focused,
        ring: 0,
        rank: i,
      };
    });
  });
  return layout;
}

export interface LaidNode {
  slug: string;
  name: string;
  topic: TopicKey;
  reportCount: number;
  x: number;
  y: number;
  nr: number;
  focused: boolean;
}

export interface LabelPlacement {
  text: string;
  x: number;
  y: number;
  preferLeft: boolean;
  fs: number;
  w: number;
  h: number;
}

export function pickLabels(
  nodes: LaidNode[],
  focused: boolean,
  matchSet: Set<string> | null,
  zoom = 1
): Map<string, LabelPlacement> {
  const picked = new Map<string, LabelPlacement>();
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const fs = Math.max(4.5, Math.min(11, 10 / zoom));
  const charW = fs * 0.58;
  const h = fs + 2;

  const tryPlace = (n: LaidNode, preferLeft = false, attempt = 0): LabelPlacement | null => {
    const text = n.name.length > 26 ? n.name.slice(0, 24) + "…" : n.name;
    const w = text.length * charW + 8;
    const x = preferLeft ? n.x - n.nr - 4 - w : n.x + n.nr + 4;
    const y = n.y - h / 2;
    for (const p of placed) {
      if (x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y) {
        if (!preferLeft && attempt === 0) return tryPlace(n, true, 1);
        return null;
      }
    }
    placed.push({ x, y, w, h });
    return { text, x, y, preferLeft, fs, w, h };
  };

  if (matchSet && matchSet.size > 0) {
    nodes.forEach((n) => {
      if (matchSet.has(n.slug)) {
        const res = tryPlace(n);
        if (res) picked.set(n.slug, res);
      }
    });
  }

  if (focused) {
    const focusedNodes = nodes.filter((n) => n.focused);
    const sorted = [...focusedNodes].sort((a, b) => b.reportCount - a.reportCount);
    for (const n of sorted) {
      if (picked.has(n.slug)) continue;
      const res = tryPlace(n);
      if (res) picked.set(n.slug, res);
    }
  } else {
    const byTopic: Record<string, LaidNode[]> = {};
    nodes.forEach((n) => {
      (byTopic[n.topic] ||= []).push(n);
    });
    const capPerTopic = Math.round(5 + (zoom - 1) * 18);
    Object.values(byTopic).forEach((list) => {
      const sorted = [...list]
        .sort((a, b) => b.reportCount - a.reportCount)
        .slice(0, Math.max(5, capPerTopic));
      for (const n of sorted) {
        if (picked.has(n.slug)) continue;
        const res = tryPlace(n);
        if (res) picked.set(n.slug, res);
      }
    });
  }

  return picked;
}
