import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useReportsData } from "@/hooks/useReportsData";
import { ConstellationView } from "@/components/reports/ConstellationView";
import { ReportModal } from "@/components/reports/ReportModal";
import { StatCard, TopicChip } from "@/components/reports/primitives";
import { ZWIAD } from "@/components/reports/tokens";
import type { EnrichedMemo, FilterKey } from "@/types/reports";

const TOPIC_ORDER: FilterKey[] = ["all", "privacy", "cybersecurity", "ai-law"];

export default function ReportsIndex() {
  useDocumentTitle("Zwiad Regulatory Monitoring | Rafal's Portfolio");
  const { data, isLoading, error } = useReportsData();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [openReport, setOpenReport] = useState<EnrichedMemo | null>(null);

  const topicCounts = useMemo(() => {
    const out: Record<FilterKey, number> = { all: 0, privacy: 0, cybersecurity: 0, "ai-law": 0 };
    if (!data) return out;
    out.all = data.memos.length;
    for (const m of data.memos) out[m.topic] = (out[m.topic] ?? 0) + 1;
    return out;
  }, [data]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: ZWIAD.background,
        color: ZWIAD.foreground,
        fontFamily: "'EB Garamond', serif",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{ marginBottom: 18 }}>
          <Link
            to="/"
            style={{
              fontSize: 13,
              color: ZWIAD.muted,
              textDecoration: "none",
            }}
          >
            ← Home
          </Link>
          <h1
            style={{
              fontFamily: "'EB Garamond', serif",
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: "-0.015em",
              margin: "14px 0 6px",
              color: ZWIAD.foreground,
              lineHeight: 1.1,
            }}
          >
            Zwiad Regulatory Monitoring
          </h1>
          <p style={{ color: ZWIAD.muted, margin: 0, fontSize: 16 }}>
            Privacy, cybersecurity, and AI-law developments across US state and federal jurisdictions.
          </p>
        </div>

        {isLoading && (
          <div style={{ padding: 60, textAlign: "center", color: ZWIAD.muted }}>
            Loading reports…
          </div>
        )}
        {error && (
          <div style={{ padding: 60, textAlign: "center", color: ZWIAD.destructive }}>
            Failed to load reports data.
          </div>
        )}

        {data && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <StatCard big={data.stats.reports} label="reports" />
              <StatCard big={data.stats.topics} label="topics" />
              <StatCard big={data.stats.clusters} label="clusters" />
              <StatCard big={data.stats.jurisdictions} label="jurisdictions" />
              <StatCard
                big={data.stats.latestFormatted}
                label="latest"
                accent={ZWIAD.topics.privacy.color}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              {TOPIC_ORDER.map((t) => (
                <TopicChip
                  key={t}
                  topic={t}
                  active={filter === t}
                  onClick={() => setFilter(t)}
                  count={topicCounts[t]}
                />
              ))}
              <input
                type="search"
                placeholder="Search clusters and reports…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 220,
                  fontFamily: "'EB Garamond', serif",
                  fontSize: 14,
                  background: ZWIAD.background,
                  border: `1px solid ${ZWIAD.rule}`,
                  padding: "4px 12px",
                  borderRadius: 999,
                  color: ZWIAD.foreground,
                }}
              />
            </div>

            <ConstellationView
              memos={data.memos}
              clusters={data.clusters}
              filter={filter}
              query={query}
              onOpenReport={setOpenReport}
              bgStyle="map"
              edgeMode="hover"
            />

            <footer
              style={{
                marginTop: 48,
                paddingTop: 18,
                borderTop: `1px solid ${ZWIAD.rule}`,
                color: ZWIAD.muted,
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span>Zwiad Regulatory Monitoring</span>
              <span>
                Data through {data.stats.latestFormatted} · {data.stats.reports} reports
              </span>
            </footer>
          </>
        )}
      </div>

      <ReportModal report={openReport} onClose={() => setOpenReport(null)} />
    </div>
  );
}
