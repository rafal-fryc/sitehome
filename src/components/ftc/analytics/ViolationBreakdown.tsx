import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FTCDataPayload } from "@/types/ftc";
import ReferenceTable from "./ReferenceTable";

const COLORS = {
  deceptive: "hsl(35, 85%, 50%)",
  unfair: "hsl(0, 65%, 50%)",
  both: "hsl(158, 60%, 35%)",
};

interface Props {
  data: FTCDataPayload;
}

export default function ViolationBreakdown({ data }: Props) {
  const stats = useMemo(() => {
    const deceptive = data.cases.filter(
      (c) => c.violation_type === "deceptive"
    ).length;
    const unfair = data.cases.filter(
      (c) => c.violation_type === "unfair"
    ).length;
    const both = data.cases.filter(
      (c) => c.violation_type === "both"
    ).length;
    const total = deceptive + unfair + both;

    return { deceptive, unfair, both, total };
  }, [data]);

  const pieData = useMemo(
    () => [
      { name: "Deceptive", value: stats.deceptive, fill: COLORS.deceptive },
      { name: "Unfair", value: stats.unfair, fill: COLORS.unfair },
      { name: "Both", value: stats.both, fill: COLORS.both },
    ],
    [stats]
  );

  const tableRows = useMemo(() => {
    const pct = (n: number) =>
      stats.total > 0 ? ((n / stats.total) * 100).toFixed(1) + "%" : "0%";

    return [
      {
        key: "deceptive",
        cells: ["Deceptive", String(stats.deceptive), pct(stats.deceptive)],
      },
      {
        key: "unfair",
        cells: ["Unfair", String(stats.unfair), pct(stats.unfair)],
      },
      {
        key: "both",
        cells: ["Both", String(stats.both), pct(stats.both)],
      },
    ];
  }, [stats]);

  return (
    <div id="violation-breakdown" className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-primary font-garamond">
          Violation Type Breakdown
        </h3>
        <p className="text-sm text-muted-foreground font-garamond">
          Distribution of enforcement actions by violation type across{" "}
          {stats.total} cases.
        </p>
      </div>

      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(40, 50%, 98%)",
                border: "1px solid hsl(40, 25%, 80%)",
                borderRadius: 0,
                fontFamily: "EB Garamond, serif",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ReferenceTable
        headers={["Type", "Count", "Percentage"]}
        rows={tableRows}
      />
    </div>
  );
}
