import { useMemo } from "react";
import type { FTCDataPayload } from "@/types/ftc";

interface Props {
  data: FTCDataPayload;
}

export default function AnalyticsSummary({ data }: Props) {
  const stats = useMemo(() => {
    const totalCases = data.total_cases;

    const years = data.cases.map((c) => c.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    const totalProvisions = data.cases.reduce(
      (sum, c) => sum + c.num_provisions,
      0
    );

    const topicSet = new Set<string>();
    for (const c of data.cases) {
      for (const cat of c.categories) {
        topicSet.add(cat);
      }
    }
    const numTopics = topicSet.size;

    return { totalCases, minYear, maxYear, totalProvisions, numTopics };
  }, [data]);

  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-primary font-garamond">
        FTC Enforcement Analytics
      </h2>
      <p className="text-muted-foreground font-garamond">
        Analyzing {stats.totalCases} enforcement actions from {stats.minYear} to{" "}
        {stats.maxYear}, encompassing {stats.totalProvisions.toLocaleString()}{" "}
        consent order provisions across {stats.numTopics} statutory topics.
      </p>
    </div>
  );
}
