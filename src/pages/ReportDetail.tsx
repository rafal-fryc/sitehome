import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDocumentTitle } from "@/hooks/use-document-title";

type Memo = {
  slug: string;
  title: string;
  date: string;
  topic: string;
  jurisdiction: string;
  summary: string;
  body: string;
};

type ReportsData = { memos: Memo[] };

const TOPIC_DOT: Record<string, string> = {
  privacy: "#9a6b3f",
  cybersecurity: "#2d5c5c",
  "ai-law": "#8a3a3a",
};

function pickRelated(memo: Memo, all: Memo[], limit = 4): Memo[] {
  const others = all.filter((m) => m.slug !== memo.slug);
  const sameJur = others.filter(
    (m) => m.jurisdiction && m.jurisdiction !== "Unknown" && m.jurisdiction === memo.jurisdiction,
  );
  const sameTopic = others.filter(
    (m) => m.topic === memo.topic && !sameJur.includes(m),
  );
  const seen = new Set<string>();
  const pick = (list: Memo[]) =>
    list
      .filter((m) => !seen.has(m.slug) && (seen.add(m.slug), true))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  return [...pick(sameJur), ...pick(sameTopic)].slice(0, limit);
}

export default function ReportDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [related, setRelated] = useState<Memo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useDocumentTitle(
    memo ? `${memo.title} | Rafal's Portfolio` : "Memo | Rafal's Portfolio",
  );

  useEffect(() => {
    // Reset state so we don't show stale content or stale "not found" when
    // the slug changes (e.g., clicking a link in the Related memos list).
    setMemo(null);
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
        const found = data.memos.find((m) => m.slug === slug);
        if (!found) {
          setNotFound(true);
          return;
        }
        setMemo(found);
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
          ← All memos
        </Link>

        {error && <div className="text-destructive mt-6">Failed to load memo: {error}</div>}
        {notFound && <div className="mt-6 font-garamond">Memo not found.</div>}
        {!error && !notFound && !memo && (
          <div className="text-muted-foreground mt-6">Loading…</div>
        )}

        {memo && (
          <>
            <header className="mt-6 mb-8">
              <div className="text-[11px] uppercase tracking-widest text-primary font-garamond mb-3">
                {memo.jurisdiction && memo.jurisdiction !== "Unknown" && `${memo.jurisdiction} · `}
                {memo.topic} · {memo.date}
              </div>
              <h1 className="text-4xl leading-tight font-garamond font-semibold tracking-tight">
                {memo.title}
              </h1>
              <aside className="mt-6 bg-cream border-l-[3px] border-l-primary border border-rule rounded-r px-5 py-4 italic text-muted-foreground font-garamond leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {memo.summary}
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{memo.body}</ReactMarkdown>
            </article>

            {related.length > 0 && (
              <footer className="mt-16 pt-8 border-t border-rule">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-garamond mb-3">
                  Related memos
                </div>
                <ul className="bg-cream border border-rule rounded divide-y divide-rule">
                  {related.map((m) => (
                    <li key={m.slug}>
                      <Link
                        to={`/reports/${m.slug}`}
                        className="grid grid-cols-[16px_1fr_110px_70px] gap-3 items-center px-4 py-3 hover:bg-background transition"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: TOPIC_DOT[m.topic] || "#888" }}
                          aria-hidden
                        />
                        <span className="text-sm font-garamond leading-snug">{m.title}</span>
                        <span className="text-xs text-muted-foreground font-garamond truncate">
                          {m.jurisdiction}
                        </span>
                        <span className="text-xs text-muted-foreground font-garamond text-right">
                          {m.date}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </footer>
            )}

            <div className="mt-10">
              <Link to="/reports" className="text-sm text-muted-foreground hover:underline font-garamond">
                ← All memos
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
