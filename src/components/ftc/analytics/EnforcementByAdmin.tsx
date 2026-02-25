import { useMemo } from "react";
import {
  BarChart,
  Bar,
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

const COLORS = {
  deceptive: "hsl(35, 85%, 50%)",
  unfair: "hsl(0, 65%, 50%)",
  both: "hsl(158, 60%, 35%)",
};

interface Props {
  data: FTCDataPayload;
}

export default function EnforcementByAdmin({ data }: Props) {
  const adminGroups = data.groupings.by_administration;
  const cases = data.cases as EnhancedFTCCaseSummary[];

  const chartData = useMemo(
    () =>
      adminGroups.map((g) => ({
        name: g.label,
        deceptive: g.violation_breakdown.deceptive,
        unfair: g.violation_breakdown.unfair,
        both: g.violation_breakdown.both,
      })),
    [adminGroups]
  );

  const chartHeight = useMemo(
    () => Math.max(300, adminGroups.length * 60),
    [adminGroups]
  );

  const tableRows = useMemo(() => {
    return adminGroups.map((g) => {
      const vb = g.violation_breakdown;
      const adminCases = cases.filter((c) => c.administration === g.key);

      // Count statutory topics for this administration
      const topicCounts: Record<string, number> = {};
      for (const c of adminCases) {
        if (c.statutory_topics) {
          for (const topic of c.statutory_topics) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        }
      }

      // Get top 3 topics sorted by count descending
      const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic, count]) => `${topic} (${count})`)
        .join(", ") || "N/A";

      return {
        key: g.key,
        cells: [
          g.label,
          String(g.count),
          String(vb.deceptive),
          String(vb.unfair),
          String(vb.both),
          topTopics,
        ],
        expandedContent:
          adminCases.length > 0 ? (
            <ul className="space-y-1">
              {adminCases.map((c) => (
                <li
                  key={c.id}
                  className="flex items-baseline gap-3 text-sm"
                >
                  <span className="font-semibold text-foreground">
                    {c.company_name}
                  </span>
                  <span className="text-muted-foreground">{c.year}</span>
                  <span className="text-muted-foreground text-xs">
                    {c.violation_type}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {c.docket_number}
                  </span>
                </li>
              ))}
            </ul>
          ) : undefined,
      };
    });
  }, [adminGroups, cases]);

  return (
    <div id="enforcement-by-admin" className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-primary font-garamond">
          Enforcement by Presidential Administration
        </h3>
        <p className="text-sm text-muted-foreground font-garamond">
          Comparing enforcement patterns across {adminGroups.length}{" "}
          presidential administrations with violation type and statutory topic
          breakdowns.
        </p>
      </div>

      <div className="w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(50, 15%, 85%)"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(40, 50%, 98%)",
                border: "1px solid hsl(40, 25%, 80%)",
                borderRadius: 0,
                fontFamily: "EB Garamond, serif",
              }}
            />
            <Legend />
            <Bar
              dataKey="deceptive"
              stackId="a"
              fill={COLORS.deceptive}
              name="Deceptive"
            />
            <Bar
              dataKey="unfair"
              stackId="a"
              fill={COLORS.unfair}
              name="Unfair"
            />
            <Bar
              dataKey="both"
              stackId="a"
              fill={COLORS.both}
              name="Both"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ReferenceTable
        headers={[
          "Administration",
          "Cases",
          "Deceptive",
          "Unfair",
          "Both",
          "Top Topics",
        ]}
        rows={tableRows}
        caption="Click a row to see all enforcement actions for that administration"
      />
    </div>
  );
}
