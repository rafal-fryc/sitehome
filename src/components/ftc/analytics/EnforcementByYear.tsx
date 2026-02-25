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
import type { FTCDataPayload, EnhancedFTCCaseSummary } from "@/types/ftc";
import ReferenceTable from "./ReferenceTable";

const COLORS = {
  deceptive: "hsl(35, 85%, 50%)",
  unfair: "hsl(0, 65%, 50%)",
  both: "hsl(158, 60%, 35%)",
};

interface Props {
  data: FTCDataPayload;
}

export default function EnforcementByYear({ data }: Props) {
  const chartData = useMemo(
    () =>
      data.groupings.by_year.map((g) => ({
        name: g.key,
        deceptive: g.violation_breakdown.deceptive,
        unfair: g.violation_breakdown.unfair,
        both: g.violation_breakdown.both,
      })),
    [data]
  );

  const tableRows = useMemo(() => {
    const cases = data.cases as EnhancedFTCCaseSummary[];

    return data.groupings.by_year.map((g) => {
      const vb = g.violation_breakdown;
      const breakdownStr = `D:${vb.deceptive} U:${vb.unfair} B:${vb.both}`;
      const topCats = (g.top_categories ?? []).slice(0, 3).join(", ") || "N/A";

      const yearCases = cases.filter((c) => String(c.year) === g.key);

      return {
        key: g.key,
        cells: [g.key, String(g.count), breakdownStr, topCats],
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
                    {c.date_issued}
                  </span>
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
  }, [data]);

  return (
    <div id="enforcement-by-year" className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-primary font-garamond">
          Enforcement Actions by Year
        </h3>
        <p className="text-sm text-muted-foreground font-garamond">
          Annual enforcement volume with violation type breakdown across{" "}
          {data.groupings.by_year.length} years of FTC consent order activity.
        </p>
      </div>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(50, 15%, 85%)"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(158, 20%, 35%)" }}
              interval={1}
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
        headers={["Year", "Cases", "Violation Breakdown", "Top Categories"]}
        rows={tableRows}
        caption="Click a row to see all enforcement actions for that year"
      />
    </div>
  );
}
