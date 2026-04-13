import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Memo = {
  slug: string;
  title: string;
  date: string;
  topic: string;
  summary: string;
  body: string;
};

type ReportsData = { memos: Memo[] };

export default function ReportDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/data/reports.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ReportsData>;
      })
      .then((data) => {
        const found = data.memos.find((m) => m.slug === slug);
        if (!found) setNotFound(true);
        else setMemo(found);
      })
      .catch((e) => setError(String(e)));
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/reports" className="text-sm text-muted-foreground hover:underline">
          ← All memos
        </Link>

        {error && <div className="text-red-600 mt-6">Failed to load memo: {error}</div>}
        {notFound && <div className="mt-6">Memo not found.</div>}
        {!error && !notFound && !memo && (
          <div className="text-muted-foreground mt-6">Loading…</div>
        )}

        {memo && (
          <article className="mt-6">
            <header className="mb-8 pb-6 border-b border-border">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {memo.topic}
              </div>
              <h1 className="text-3xl font-bold mt-2">{memo.title}</h1>
              <time className="text-sm text-muted-foreground mt-2 block">{memo.date}</time>
            </header>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{memo.body}</ReactMarkdown>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
