import type { BgStyle, TopicKey } from "@/types/reports";

export const ZWIAD = {
  background: "hsl(40 30% 94%)",
  cream: "hsl(40 50% 98%)",
  foreground: "hsl(158 40% 15%)",
  muted: "hsl(158 15% 45%)",
  rule: "hsl(40 25% 80%)",
  ruleDark: "hsl(40 20% 65%)",
  primary: "hsl(158 80% 15%)",
  gold: "hsl(45 85% 55%)",
  destructive: "hsl(0 55% 40%)",
  topics: {
    privacy: { label: "privacy", color: "#9a6b3f", soft: "rgba(154,107,63,0.12)" },
    cybersecurity: { label: "cybersecurity", color: "#2d5c5c", soft: "rgba(45,92,92,0.14)" },
    "ai-law": { label: "ai-law", color: "#8a3a3a", soft: "rgba(138,58,58,0.12)" },
  } as Record<TopicKey, { label: string; color: string; soft: string }>,
} as const;

export interface BgPalette {
  paper: string;
  ink: string;
  pill: string;
  accent: string;
  rule: string;
  labelSubtle: string;
  isDark: boolean;
  haloAlpha: number;
  lobeDashAlpha: number;
}

export const BG_PALETTES: Record<BgStyle, BgPalette> = {
  parchment: {
    paper: "#efe4cc", ink: "#2b2319", pill: "#efe4cc",
    accent: "#9a7a3b", rule: "rgba(43,35,25,0.28)",
    labelSubtle: "rgba(43,35,25,0.70)", isDark: false,
    haloAlpha: 0.24, lobeDashAlpha: 0.55,
  },
  ledger: {
    paper: "#f6efd9", ink: "#1d2935", pill: "#f6efd9",
    accent: "#b4292f", rule: "rgba(29,41,53,0.25)",
    labelSubtle: "rgba(29,41,53,0.72)", isDark: false,
    haloAlpha: 0.20, lobeDashAlpha: 0.55,
  },
  blueprint: {
    paper: "#0f3555", ink: "#dce9f7", pill: "#0f3555",
    accent: "#f1e8d1", rule: "rgba(220,233,247,0.35)",
    labelSubtle: "rgba(220,233,247,0.82)", isDark: true,
    haloAlpha: 0.26, lobeDashAlpha: 0.85,
  },
  map: {
    paper: "#f0e4c8", ink: "#2c2415", pill: "#f0e4c8",
    accent: "#8c6a2d", rule: "rgba(44,36,21,0.32)",
    labelSubtle: "rgba(44,36,21,0.72)", isDark: false,
    haloAlpha: 0.22, lobeDashAlpha: 0.55,
  },
  dossier: {
    paper: "#e7d2a0", ink: "#2a1d12", pill: "#e7d2a0",
    accent: "#a13a2a", rule: "rgba(42,29,18,0.35)",
    labelSubtle: "rgba(42,29,18,0.72)", isDark: false,
    haloAlpha: 0.22, lobeDashAlpha: 0.55,
  },
  marble: {
    paper: "#eae7df", ink: "#1f1d1a", pill: "#eae7df",
    accent: "#73655a", rule: "rgba(31,29,26,0.28)",
    labelSubtle: "rgba(31,29,26,0.70)", isDark: false,
    haloAlpha: 0.18, lobeDashAlpha: 0.55,
  },
};

export const VBW = 1000;
export const VBH = 580;

export const TOPIC_ANCHORS: Record<TopicKey, { cx: number; cy: number; label: string; lobeR: number }> = {
  privacy: { cx: 370, cy: 300, label: "privacy", lobeR: 170 },
  "ai-law": { cx: 640, cy: 310, label: "ai-law", lobeR: 170 },
  cybersecurity: { cx: 505, cy: 150, label: "cybersecurity", lobeR: 95 },
};
