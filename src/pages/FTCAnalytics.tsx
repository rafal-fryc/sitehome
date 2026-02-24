import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useFTCData } from "@/hooks/use-ftc-data";
import type { GroupingMode } from "@/types/ftc";
import FTCHeader from "@/components/ftc/FTCHeader";
import FTCMissingCasesNotice from "@/components/ftc/FTCMissingCasesNotice";
import FTCOverviewStats from "@/components/ftc/FTCOverviewStats";
import FTCGroupingSelector from "@/components/ftc/FTCGroupingSelector";
import FTCGroupChart, { ViolationDonut } from "@/components/ftc/FTCGroupChart";
import FTCGroupList from "@/components/ftc/FTCGroupList";
import FTCGroupDetail from "@/components/ftc/FTCGroupDetail";

export default function FTCAnalytics() {
  const { data, isLoading, error } = useFTCData();
  const [searchParams, setSearchParams] = useSearchParams();

  const modeParam = searchParams.get("mode") as GroupingMode | null;
  const groupParam = searchParams.get("group");

  const [groupingMode, setGroupingMode] = useState<GroupingMode>(
    modeParam && ["year", "administration", "category"].includes(modeParam)
      ? modeParam
      : "year"
  );
  const [selectedGroup, setSelectedGroup] = useState<string | null>(groupParam);

  const handleModeChange = useCallback(
    (mode: GroupingMode) => {
      setGroupingMode(mode);
      setSelectedGroup(null);
      setSearchParams({ mode });
    },
    [setSearchParams]
  );

  const handleGroupSelect = useCallback(
    (key: string) => {
      const newKey = selectedGroup === key ? null : key;
      setSelectedGroup(newKey);
      if (newKey) {
        setSearchParams({ mode: groupingMode, group: newKey });
      } else {
        setSearchParams({ mode: groupingMode });
      }
    },
    [selectedGroup, groupingMode, setSearchParams]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading enforcement data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Failed to load data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FTCHeader />

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        <FTCMissingCasesNotice />

        {/* Overview stats + donut */}
        <section className="space-y-6">
          <FTCOverviewStats data={data} />
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <h3 className="text-center text-sm font-medium text-muted-foreground mb-2">
                Violation Type Breakdown
              </h3>
              <ViolationDonut data={data} />
            </div>
          </div>
        </section>

        {/* Grouping controls */}
        <section className="space-y-6">
          <FTCGroupingSelector mode={groupingMode} onModeChange={handleModeChange} />
          <FTCGroupChart data={data} mode={groupingMode} onBarClick={handleGroupSelect} />
          <FTCGroupList
            data={data}
            mode={groupingMode}
            selectedGroup={selectedGroup}
            onSelectGroup={handleGroupSelect}
          />
        </section>

        {/* Group detail */}
        {selectedGroup && (
          <section>
            <FTCGroupDetail data={data} mode={groupingMode} groupKey={selectedGroup} />
          </section>
        )}
      </main>
    </div>
  );
}
