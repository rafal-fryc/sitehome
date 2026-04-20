import { useQuery } from "@tanstack/react-query";
import type {
  Cluster,
  EnrichedMemo,
  Memo,
  ReportStats,
  ReportsDataFile,
  TopicKey,
} from "@/types/reports";

interface ReportsData {
  memos: EnrichedMemo[];
  clusters: Cluster[];
  stats: ReportStats;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

async function loadReportsData(): Promise<ReportsData> {
  const res = await fetch("/data/reports.json");
  if (!res.ok) throw new Error(`Failed to load reports.json: ${res.status}`);
  const file = (await res.json()) as ReportsDataFile;

  // Build memo → cluster_slug map (prefer memo.cluster_slug; fall back to
  // scanning cluster.reports for the memo slug).
  const memoToClusterSlug = new Map<string, string>();
  for (const m of file.memos) {
    if (m.cluster_slug) memoToClusterSlug.set(m.slug, m.cluster_slug);
  }
  const clusterBySlug = new Map<string, (typeof file.clusters)[number]>();
  for (const c of file.clusters) {
    clusterBySlug.set(c.slug, c);
    for (const memoSlug of c.reports) {
      if (!memoToClusterSlug.has(memoSlug)) memoToClusterSlug.set(memoSlug, c.slug);
    }
  }

  // Enrich memos with cluster_slug/name
  const memos: EnrichedMemo[] = file.memos
    .map((m: Memo): EnrichedMemo => {
      const cSlug = memoToClusterSlug.get(m.slug) ?? m.cluster_slug ?? "";
      const cName = cSlug ? clusterBySlug.get(cSlug)?.name ?? m.cluster ?? "" : m.cluster ?? "";
      return { ...m, cluster_slug: cSlug, cluster_name: cName };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Enrich clusters with reportCount
  const clusters: Cluster[] = file.clusters.map((c) => ({
    ...c,
    topic: c.topic as TopicKey,
    reportCount: c.reports.length,
  }));

  // Derived stats
  const topics = new Set(memos.map((m) => m.topic));
  const allJurisdictions = new Set<string>();
  for (const m of memos) {
    if (m.jurisdiction && m.jurisdiction !== "Unknown") allJurisdictions.add(m.jurisdiction);
  }
  const latest = memos.length > 0 ? memos[0].date : "";

  const stats: ReportStats = {
    reports: memos.length,
    topics: topics.size,
    clusters: clusters.length,
    jurisdictions: allJurisdictions.size,
    latest,
    latestFormatted: formatDate(latest),
  };

  return { memos, clusters, stats };
}

export function useReportsData() {
  return useQuery({
    queryKey: ["reports-data"],
    queryFn: loadReportsData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
