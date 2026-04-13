import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import ReportsStatsBar from "@/components/reports/ReportsStatsBar";
import ReportsGraph, { GraphCluster } from "@/components/reports/ReportsGraph";

type Report = {
  slug: string;
  title: string;
  date: string;
  topic: string;
  jurisdiction: string;
  summary: string;
  cluster?: string;
  cluster_slug?: string;
};

type ReportsData = { memos: Report[]; clusters: GraphCluster[] };

const TOPICS = ["all", "privacy", "cybersecurity", "ai-law"] as const;
type Topic = (typeof TOPICS)[number];

const TOPIC_DOT: Record<string, string> = {
  privacy: "#9a6b3f",
  cybersecurity: "#2d5c5c",
  "ai-law": "#8a3a3a",
};

export default function ReportsIndex() {
  useDocumentTitle("Zwiad Regulatory Monitoring | Rafal's Portfolio");
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/reports.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const allReports = data?.memos ?? [];
  const allClusters = data?.clusters ?? [];

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allReports.filter((r) => {
      if (topic !== "all" && r.topic !== topic) return false;
      if (q) {
        const haystack = `${r.title} ${r.summary} ${r.cluster || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allReports, topic, query]);

  const filteredClusters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allClusters.filter((c) => {
      if (topic !== "all" && c.topic !== topic) return false;
      if (q) {
        const haystack = `${c.name} ${c.summary}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allClusters, topic, query]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-4 font-garamond">Zwiad Regulatory Monitoring</h1>
          <p className="text-muted-foreground mt-2 font-garamond">
            Privacy, cybersecurity, and AI-law developments across US state and federal jurisdictions.
          </p>
        </div>

        {error && <div className="text-destructive mb-4">Failed to load reports: {error}</div>}

        {data && (
          <>
            <ReportsStatsBar reports={allReports} clusterCount={allClusters.length} />

            <div className="flex flex-wrap gap-2 mb-4 items-center">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  aria-pressed={topic === t}
                  className={`px-3 py-1 text-xs rounded-full border transition font-garamond ${
                    topic === t
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
              <input
                type="search"
                placeholder="Search clusters and reports…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-1 text-xs rounded-full border border-border bg-background font-garamond focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="hidden md:block mb-6">
              <ReportsGraph clusters={filteredClusters} />
            </div>

            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {topic === "all" ? "All reports" : `${topic} reports`}
                {query && ` matching "${query}"`}
              </div>
              <div className="text-[11px] text-muted-foreground">sorted by date ↓</div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-muted-foreground text-sm border border-rule rounded p-6 text-center">
                No reports match.
              </div>
            ) : (
              <ul className="bg-cream border border-rule rounded divide-y divide-rule">
                {filteredReports.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={`/reports/${r.slug}`}
                      className="grid grid-cols-[16px_1fr_110px_70px] gap-3 items-center px-4 py-3 hover:bg-background transition"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: TOPIC_DOT[r.topic] || "#888" }}
                        aria-hidden
                      />
                      <span className="text-sm font-garamond leading-snug">{r.title}</span>
                      <span className="text-xs text-muted-foreground font-garamond truncate">
                        {r.jurisdiction}
                      </span>
                      <span className="text-xs text-muted-foreground font-garamond text-right">
                        {r.date}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!error && !data && <div className="text-muted-foreground">Loading…</div>}
      </div>
    </div>
  );
}
