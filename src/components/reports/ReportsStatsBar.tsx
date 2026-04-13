type Report = {
  slug: string;
  date: string;
  topic: string;
  jurisdiction: string;
};

type Props = {
  reports: Report[];
  clusterCount: number;
};

export default function ReportsStatsBar({ reports, clusterCount }: Props) {
  const topics = new Set(reports.map((r) => r.topic));
  const jurisdictions = new Set(reports.map((r) => r.jurisdiction).filter((j) => j && j !== "Unknown"));
  const latest = reports.reduce((max, r) => (r.date > max ? r.date : max), "");
  const latestFormatted = latest
    ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  const cards = [
    { big: reports.length.toString(), label: "reports" },
    { big: topics.size.toString(), label: "topics" },
    { big: clusterCount.toString(), label: "clusters" },
    { big: jurisdictions.size.toString(), label: "jurisdictions" },
    { big: latestFormatted, label: "latest" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
