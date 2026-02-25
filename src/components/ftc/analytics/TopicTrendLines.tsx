import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type {
  FTCDataPayload,
  EnhancedFTCCaseSummary,
  StatutoryTopic,
} from "@/types/ftc";
import ReferenceTable from "./ReferenceTable";

const TOPIC_COLORS: Record<string, string> = {
  COPPA: "hsl(158, 80%, 25%)",
  FCRA: "hsl(45, 85%, 45%)",
  GLBA: "hsl(158, 60%, 40%)",
  "Health Breach Notification": "hsl(20, 70%, 50%)",
  "Section 5 Only": "hsl(158, 30%, 55%)",
  TSR: "hsl(45, 60%, 60%)",
  "CAN-SPAM": "hsl(200, 40%, 45%)",
  TCPA: "hsl(340, 50%, 45%)",
};

const TOPICS: StatutoryTopic[] = [
  "COPPA",
  "FCRA",
  "GLBA",
  "Health Breach Notification",
  "Section 5 Only",
  "TSR",
  "CAN-SPAM",
  "TCPA",
];

interface Props {
  data: FTCDataPayload;
}

export default function TopicTrendLines({ data }: Props) {
  const cases = data.cases as EnhancedFTCCaseSummary[];

  const chartData = useMemo(() => {
    const yearSet = new Set<number>();
    for (const c of cases) {
      yearSet.add(c.year);
    }
    const years = Array.from(yearSet).sort((a, b) => a - b);

    return years.map((year) => {
      const yearCases = cases.filter((c) => c.year === year);
      const point: Record<string, string | number> = { year: String(year) };

      for (const topic of TOPICS) {
        point[topic] = yearCases.filter(
          (c) => c.statutory_topics && c.statutory_topics.includes(topic)
        ).length;
      }

      return point;
    });
  }, [cases]);

  const tableRows = useMemo(() => {
    const yearSet = new Set<number>();
    for (const c of cases) {
      yearSet.add(c.year);
    }
    const years = Array.from(yearSet).sort((a, b) => a - b);

    return years.map((year) => {
      const yearCases = cases.filter((c) => c.year === year);

      const topicCounts = TOPICS.map((topic) =>
        String(
          yearCases.filter(
            (c) => c.statutory_topics && c.statutory_topics.includes(topic)
          ).length
        )
      );

      return {
        key: String(year),
        cells: [String(year), ...topicCounts],
        expandedContent:
          yearCases.length > 0 ? (
            <ul className="space-y-1">
              {yearCases.map((c) => (
                <li
                  key={c.id}
                  className="flex items-baseline gap-3 text-sm"
                >
                  <span className="font-semibold text-foreground">
                    {c.company_name}
                  </span>
                  <span className="text-muted-foreground">
                    {(c.statutory_topics ?? []).join(", ")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {c.violation_type}
                  </span>
                </li>
              ))}
            </ul>
          ) : undefined,
      };
    });
  }, [cases]);

  return (
    <div id="topic-trends" className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-primary font-garamond">
          Enforcement Focus by Statutory Topic
        </h3>
        <p className="text-sm text-muted-foreground font-garamond">
          How enforcement attention has shifted across statutory topics over
          time.
        </p>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(50, 15%, 85%)"
            />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "hsl(158, 20%, 35%)" }}
              interval={2}
            />
            <YAxis tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(40, 50%, 98%)",
                border: "1px solid hsl(40, 25%, 80%)",
                borderRadius: 0,
                fontFamily: "EB Garamond, serif",
              }}
            />
            <Legend />
            {TOPICS.map((topic) => (
              <Line
                key={topic}
                type="monotone"
                dataKey={topic}
                stroke={TOPIC_COLORS[topic]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <ReferenceTable
          headers={["Year", ...TOPICS]}
          rows={tableRows}
          caption="Click a row to see all enforcement actions for that year with their statutory topics"
        />
      </div>
    </div>
  );
}
