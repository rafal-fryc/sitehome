import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDocumentTitle } from "@/hooks/use-document-title";

type Report = {
  slug: string;
  title: string;
  date: string;
  topic: string;
  jurisdiction: string;
  summary: string;
  body: string;
};

type ReportsData = { memos: Report[] };

const TOPIC_DOT: Record<string, string> = {
  privacy: "#9a6b3f",
  cybersecurity: "#2d5c5c",
  "ai-law": "#8a3a3a",
};

function pickRelated(report: Report, all: Report[], limit = 4): Report[] {
  const others = all.filter((r) => r.slug !== report.slug);
  const sameJur = others.filter(
    (r) => r.jurisdiction && r.jurisdiction !== "Unknown" && r.jurisdiction === report.jurisdiction,
  );
  const sameTopic = others.filter(
    (r) => r.topic === report.topic && !sameJur.includes(r),
  );
  const seen = new Set<string>();
  const pick = (list: Report[]) =>
    list
      .filter((r) => !seen.has(r.slug) && (seen.add(r.slug), true))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  return [...pick(sameJur), ...pick(sameTopic)].slice(0, limit);
}

export default function ReportDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [related, setRelated] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useDocumentTitle(
    report ? `${report.title} | Rafal's Portfolio` : "Report | Rafal's Portfolio",
  );

  useEffect(() => {
    // Reset state so we don't show stale content or stale "not found" when
    // the slug changes (e.g., clicking a link in the Related reports list).
    setReport(null);
    setRelated([]);
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
        const found = data.memos.find((r) => r.slug === slug);
        if (!found) {
          setNotFound(true);
          return;
        }
        setReport(found);
        setRelated(pickRelated(found, data.memos));
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <Link to="/reports" className="text-sm text-muted-foreground hover:underline font-garamond">
          ← All reports
        </Link>

        {error && <div className="text-destructive mt-6">Failed to load report: {error}</div>}
        {notFound && <div className="mt-6 font-garamond">Report not found.</div>}
        {!error && !notFound && !report && (
          <div className="text-muted-foreground mt-6">Loading…</div>
        )}

        {report && (
          <>
            <header className="mt-6 mb-8">
              <div className="text-[11px] uppercase tracking-widest text-primary font-garamond mb-3">
                {report.jurisdiction && report.jurisdiction !== "Unknown" && `${report.jurisdiction} · `}
                {report.topic} · {report.date}
              </div>
              <h1 className="text-4xl leading-tight font-garamond font-semibold tracking-tight">
                {report.title}
              </h1>
              <aside className="mt-6 bg-cream border-l-[3px] border-l-primary border border-rule rounded-r px-5 py-4 italic text-muted-foreground font-garamond leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.summary}
                </ReactMarkdown>
              </aside>
            </header>

            <article
              className="
                font-garamond text-[17px] leading-[1.7] text-foreground
                prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-garamond prose-headings:font-semibold prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-rule
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
                prose-p:my-4 prose-p:leading-[1.7]
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline hover:prose-a:decoration-gold
                prose-strong:text-foreground
                prose-blockquote:border-l-primary prose-blockquote:bg-cream prose-blockquote:py-1
                prose-code:text-primary prose-code:bg-cream prose-code:px-1 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
                prose-hr:border-rule
              "
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.body}</ReactMarkdown>
            </article>

            {related.length > 0 && (
              <footer className="mt-16 pt-8 border-t border-rule">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-garamond mb-3">
                  Related reports
                </div>
                <ul className="bg-cream border border-rule rounded divide-y divide-rule">
                  {related.map((r) => (
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
              </footer>
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
