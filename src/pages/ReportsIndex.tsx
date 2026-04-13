import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";

type MemoListing = {
  slug: string;
  title: string;
  date: string;
  topic: string;
  summary: string;
};

type ReportsData = { memos: MemoListing[] };

const TOPICS = ["all", "privacy", "cybersecurity", "ai-law"] as const;
type Topic = (typeof TOPICS)[number];

export default function ReportsIndex() {
  useDocumentTitle("Regulatory Research Memos | Rafal's Portfolio");
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Topic>("all");

  useEffect(() => {
    fetch("/data/reports.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const memos = data?.memos ?? [];
  const filtered = filter === "all" ? memos : memos.filter((m) => m.topic === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-4">Regulatory Research Memos</h1>
          <p className="text-muted-foreground mt-2">
            Privacy, cybersecurity, and AI-law developments from US state and federal jurisdictions.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 text-sm rounded-full border transition ${
                filter === t
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-red-600">Failed to load reports: {error}</div>
        )}
        {!error && !data && <div className="text-muted-foreground">Loading…</div>}
        {data && filtered.length === 0 && (
          <div className="text-muted-foreground">No memos in this topic yet.</div>
        )}

        <ul className="divide-y divide-border">
          {filtered.map((m) => (
            <li key={m.slug} className="py-4">
              <Link to={`/reports/${m.slug}`} className="block group">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-semibold group-hover:underline">{m.title}</h2>
                  <time className="text-sm text-muted-foreground whitespace-nowrap">{m.date}</time>
                </div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">
                  {m.topic}
                </div>
                <p className="text-sm mt-2 text-muted-foreground">{m.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
