import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { GroupingMode, GroupStats, FTCDataPayload } from "@/types/ftc";

const COLORS = {
  deceptive: "hsl(35, 85%, 50%)",
  unfair: "hsl(0, 65%, 50%)",
  both: "hsl(158, 60%, 35%)",
};

interface Props {
  data: FTCDataPayload;
  mode: GroupingMode;
  onBarClick?: (key: string) => void;
}

export default function FTCGroupChart({ data, mode, onBarClick }: Props) {
  const groupMap: Record<GroupingMode, GroupStats[]> = {
    year: data.groupings.by_year,
    administration: data.groupings.by_administration,
    category: data.groupings.by_category,
  };
  const groups = groupMap[mode];

  if (mode === "year") {
    const chartData = groups.map((g) => ({
      name: g.key,
      deceptive: g.violation_breakdown.deceptive,
      unfair: g.violation_breakdown.unfair,
      both: g.violation_breakdown.both,
    }));

    return (
      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} onClick={(e) => {
            if (e?.activeLabel && onBarClick) onBarClick(e.activeLabel);
          }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(50, 15%, 85%)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(158, 20%, 35%)" }}
              interval={mode === "year" ? 1 : 0}
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
            <Bar dataKey="deceptive" stackId="a" fill={COLORS.deceptive} name="Deceptive" cursor="pointer" />
            <Bar dataKey="unfair" stackId="a" fill={COLORS.unfair} name="Unfair" cursor="pointer" />
            <Bar dataKey="both" stackId="a" fill={COLORS.both} name="Both" cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Horizontal bar chart for administration and category
  const chartData = groups.map((g) => ({
    name: g.label,
    count: g.count,
    key: g.key,
  }));

  return (
    <div className="w-full" style={{ height: Math.max(250, groups.length * 50) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          onClick={(e) => {
            if (e?.activeLabel && onBarClick) onBarClick(
              groups.find(g => g.label === e.activeLabel)?.key || e.activeLabel
            );
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(50, 15%, 85%)" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
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
          <Bar dataKey="count" fill="hsl(158, 60%, 35%)" name="Cases" cursor="pointer">
            {chartData.map((_, i) => (
              <Cell key={i} fill={i % 2 === 0 ? "hsl(158, 60%, 35%)" : "hsl(45, 85%, 55%)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ViolationDonut({ data }: { data: FTCDataPayload }) {
  const deceptive = data.cases.filter((c) => c.violation_type === "deceptive").length;
  const unfair = data.cases.filter((c) => c.violation_type === "unfair").length;
  const both = data.cases.filter((c) => c.violation_type === "both").length;

  const pieData = [
    { name: "Deceptive", value: deceptive, fill: COLORS.deceptive },
    { name: "Unfair", value: unfair, fill: COLORS.unfair },
    { name: "Both", value: both, fill: COLORS.both },
  ];

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
