import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";

type Report = {
  slug: string;
  title: string;
  date: string;
  topic: string;
  jurisdiction: string;
  summary: string;
  cluster_slug?: string;
};

type Cluster = {
  slug: string;
  name: string;
  topic: string;
  summary: string;
  reports: string[];
  dateRange: { first: string; latest: string };
  jurisdictions: string[];
};

type ReportsData = { memos: Report[]; clusters: Cluster[] };

const TOPIC_DOT: Record<string, string> = {
  privacy: "#9a6b3f",
  cybersecurity: "#2d5c5c",
  "ai-law": "#8a3a3a",
};

export default function ReportsCluster() {
  const { slug } = useParams<{ slug: string }>();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useDocumentTitle(
    cluster ? `${cluster.name} | Rafal's Portfolio` : "Cluster | Rafal's Portfolio",
  );

  useEffect(() => {
    setCluster(null);
    setReports([]);
    setNotFound(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    let cancelled = false;
    fetch("/data/reports.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ReportsData>;
      })
      .then((data) => {
        if (cancelled) return;
        const found = data.clusters.find((c) => c.slug === slug);
        if (!found) {
          setNotFound(true);
          return;
        }
        setCluster(found);
        const members = data.memos
          .filter((r) => found.reports.includes(r.slug))
          .sort((a, b) => (a.date < b.date ? 1 : -1));
        setReports(members);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const dateRangeLabel = useMemo(() => {
    if (!cluster) return "";
    const { first, latest } = cluster.dateRange;
    if (!first) return "";
    return first === latest ? first : `${first} – ${latest}`;
  }, [cluster]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <Link to="/reports" className="text-sm text-muted-foreground hover:underline font-garamond">
          ← All reports
        </Link>

        {error && <div className="text-destructive mt-6">Failed to load cluster: {error}</div>}
        {notFound && <div className="mt-6 font-garamond">Cluster not found.</div>}
        {!error && !notFound && !cluster && (
          <div className="text-muted-foreground mt-6">Loading…</div>
        )}

        {cluster && (
          <>
            <header className="mt-6 mb-8">
              <div className="text-[11px] uppercase tracking-widest text-primary font-garamond mb-3">
                {cluster.topic} · {reports.length} {reports.length === 1 ? "report" : "reports"}
                {dateRangeLabel && ` · ${dateRangeLabel}`}
              </div>
              <h1 className="text-4xl leading-tight font-garamond font-semibold tracking-tight">
                {cluster.name}
              </h1>
              {cluster.summary && (
                <aside className="mt-6 bg-cream border-l-[3px] border-l-primary border border-rule rounded-r px-5 py-4 italic text-muted-foreground font-garamond leading-relaxed">
                  {cluster.summary}
                </aside>
              )}
              {cluster.jurisdictions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {cluster.jurisdictions.map((j) => (
                    <span
                      key={j}
                      className="text-[10px] uppercase tracking-wider px-2 py-1 bg-cream border border-rule rounded font-garamond"
                    >
                      {j}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-garamond">
              Reports in this cluster
            </div>
            <ul className="bg-cream border border-rule rounded divide-y divide-rule">
              {reports.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/reports/${r.slug}`}
                    className="block px-4 py-4 hover:bg-background transition"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: TOPIC_DOT[r.topic] || "#888" }}
                          aria-hidden
                        />
                        <span className="text-sm font-garamond leading-snug">{r.title}</span>
                      </div>
                      <time className="text-xs text-muted-foreground font-garamond whitespace-nowrap">
                        {r.date}
                      </time>
                    </div>
                    <div className="text-xs text-muted-foreground font-garamond mt-1 ml-4">
                      {r.jurisdiction}
                    </div>
                    {r.summary && (
                      <div className="text-xs text-muted-foreground font-garamond mt-2 ml-4 line-clamp-2">
                        {r.summary}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {reports.length === 1 && (
              <p className="mt-4 text-xs text-muted-foreground font-garamond italic">
                Only report in this cluster. More coming as this subject develops.
              </p>
            )}

            <div className="mt-10">
              <Link to="/reports" className="text-sm text-muted-foreground hover:underline font-garamond">
                ← All reports
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
