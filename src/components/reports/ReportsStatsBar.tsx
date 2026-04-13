type Memo = {
  slug: string;
  date: string;
  topic: string;
  jurisdiction: string;
};

export default function ReportsStatsBar({ memos }: { memos: Memo[] }) {
  const topics = new Set(memos.map((m) => m.topic));
  const jurisdictions = new Set(memos.map((m) => m.jurisdiction).filter((j) => j && j !== "Unknown"));
  const latest = memos.reduce((max, m) => (m.date > max ? m.date : max), "");
  const latestFormatted = latest
    ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  const cards = [
    { big: memos.length.toString(), label: "memos" },
    { big: topics.size.toString(), label: "topics" },
    { big: jurisdictions.size.toString(), label: "jurisdictions" },
    { big: latestFormatted, label: "latest" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-cream border border-rule border-l-[3px] border-l-primary rounded px-4 py-3"
        >
          <div className="text-2xl font-garamond leading-none">{c.big}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
