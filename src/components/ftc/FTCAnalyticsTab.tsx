import type { FTCDataPayload } from "@/types/ftc";
import FTCMissingCasesNotice from "@/components/ftc/FTCMissingCasesNotice";
import FTCSectionSidebar from "@/components/ftc/FTCSectionSidebar";
import AnalyticsSummary from "@/components/ftc/analytics/AnalyticsSummary";
import EnforcementByYear from "@/components/ftc/analytics/EnforcementByYear";
import EnforcementByAdmin from "@/components/ftc/analytics/EnforcementByAdmin";
import TopicTrendLines from "@/components/ftc/analytics/TopicTrendLines";
import ViolationBreakdown from "@/components/ftc/analytics/ViolationBreakdown";
import ProvisionAnalytics from "@/components/ftc/analytics/ProvisionAnalytics";

const ANALYTICS_SECTIONS = [
  { id: "enforcement-by-year", label: "By Year" },
  { id: "enforcement-by-admin", label: "By Administration" },
  { id: "topic-trends", label: "Topic Trends" },
  { id: "violation-breakdown", label: "Violations" },
  { id: "provision-analytics", label: "Provisions" },
];

interface Props {
  data: FTCDataPayload;
}

export default function FTCAnalyticsTab({ data }: Props) {
  return (
    <main className="py-8 space-y-8">
      <FTCMissingCasesNotice />

      <AnalyticsSummary data={data} />

      <div className="flex gap-8">
        <FTCSectionSidebar sections={ANALYTICS_SECTIONS} />

        <div className="flex-1 min-w-0 space-y-12">
          <EnforcementByYear data={data} />
          <EnforcementByAdmin data={data} />
          <TopicTrendLines data={data} />
          <ViolationBreakdown data={data} />
          <ProvisionAnalytics data={data} />
        </div>
      </div>
    </main>
  );
}
