import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";
import ReferenceTable from "@/components/ftc/analytics/ReferenceTable";

interface Props {
  cases: EnhancedFTCCaseSummary[];
  sectorLabel: string;
}

export default function SectorPatternCharts({ cases, sectorLabel }: Props) {
  const topicData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cases) {
      for (const topic of c.statutory_topics) {
        counts[topic] = (counts[topic] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [cases]);

  const remedyData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cases) {
      if (c.remedy_types) {
        for (const rt of c.remedy_types) {
          counts[rt] = (counts[rt] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [cases]);

  const topicTableRows = useMemo(
    () =>
      topicData.map((d) => ({
        key: d.name,
        cells: [d.name, String(d.count)],
      })),
    [topicData]
  );

  const remedyTableRows = useMemo(
    () =>
      remedyData.map((d) => ({
        key: d.name,
        cells: [d.name, String(d.count)],
      })),
    [remedyData]
  );

  const topicChartHeight = Math.max(250, topicData.length * 40);
  const remedyChartHeight = Math.max(250, remedyData.length * 40);

  return (
    <div className="space-y-8">
      {/* Enforcement Topics Chart */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-primary/80 font-garamond">
          Enforcement Topics in {sectorLabel}
        </h4>
        <div className="w-full" style={{ height: topicChartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicData} layout="vertical">
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
                width={200}
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
              <Bar dataKey="count" name="Cases">
                {topicData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i % 2 === 0
                        ? "hsl(158, 60%, 35%)"
                        : "hsl(45, 85%, 55%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ReferenceTable
          headers={["Topic", "Cases"]}
          rows={topicTableRows}
        />
      </div>

      {/* Remedy Types Chart */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-primary/80 font-garamond">
          Remedy Types in {sectorLabel}
        </h4>
        <div className="w-full" style={{ height: remedyChartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={remedyData} layout="vertical">
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
                width={200}
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
              <Bar dataKey="count" name="Cases">
                {remedyData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i % 2 === 0
                        ? "hsl(158, 60%, 35%)"
                        : "hsl(45, 85%, 55%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ReferenceTable
          headers={["Remedy Type", "Cases"]}
          rows={remedyTableRows}
        />
      </div>
    </div>
  );
}
