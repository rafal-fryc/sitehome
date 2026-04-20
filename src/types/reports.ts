export type TopicKey = "privacy" | "cybersecurity" | "ai-law";

export interface Memo {
  slug: string;
  file: string;
  title: string;
  date: string;
  topic: TopicKey;
  jurisdiction: string;
  summary: string;
  cluster?: string;
  cluster_slug?: string;
  body: string;
}

export interface EnrichedMemo extends Memo {
  cluster_slug: string;
  cluster_name: string;
}

export interface Cluster {
  slug: string;
  name: string;
  topic: TopicKey;
  summary: string;
  reports: string[];
  dateRange: { first: string; latest: string };
  jurisdictions: string[];
  reportCount: number;
}

export interface ReportStats {
  reports: number;
  topics: number;
  clusters: number;
  jurisdictions: number;
  latest: string;
  latestFormatted: string;
}

export interface ReportsDataFile {
  memos: Memo[];
  clusters: Omit<Cluster, "reportCount">[];
}

export type BgStyle = "parchment" | "ledger" | "blueprint" | "map" | "dossier" | "marble";
export type EdgeMode = "none" | "jurisdiction" | "temporal" | "hover";
export type FilterKey = "all" | TopicKey;
