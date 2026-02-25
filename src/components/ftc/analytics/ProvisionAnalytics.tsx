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
import type { FTCDataPayload, EnhancedFTCCaseSummary } from "@/types/ftc";
import ReferenceTable from "./ReferenceTable";

interface Props {
  data: FTCDataPayload;
}

export default function ProvisionAnalytics({ data }: Props) {
  const cases = data.cases as EnhancedFTCCaseSummary[];

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

  const topicProvisionData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cases) {
      if (c.provision_counts_by_topic) {
        for (const [topic, count] of Object.entries(
          c.provision_counts_by_topic
        )) {
          counts[topic] = (counts[topic] || 0) + count;
        }
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [cases]);

  const remedyTableRows = useMemo(
    () =>
      remedyData.map((d) => ({
        key: d.name,
        cells: [d.name, String(d.count)],
      })),
    [remedyData]
  );

  const topicTableRows = useMemo(
    () =>
      topicProvisionData.map((d) => ({
        key: d.name,
        cells: [d.name, String(d.count)],
      })),
    [topicProvisionData]
  );

  const remedyChartHeight = Math.max(250, remedyData.length * 40);
  const topicChartHeight = Math.max(250, topicProvisionData.length * 40);

  return (
    <div id="provision-analytics" className="space-y-8">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-primary font-garamond">
          Provision-Level Analytics
        </h3>
        <p className="text-sm text-muted-foreground font-garamond">
          Distribution of consent order provisions by remedy type and topic.
        </p>
      </div>

      {/* Remedy Type Chart */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-primary/80 font-garamond">
          Cases by Remedy Type
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

      {/* Provisions by Topic Chart */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-primary/80 font-garamond">
          Provisions by Statutory Topic
        </h4>
        <div className="w-full" style={{ height: topicChartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicProvisionData} layout="vertical">
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
              <Bar dataKey="count" name="Provisions">
                {topicProvisionData.map((_, i) => (
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
          headers={["Topic", "Provisions"]}
          rows={topicTableRows}
        />
      </div>
    </div>
  );
}
