import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { FTCDataPayload, GroupingMode } from "@/types/ftc";
import FTCMissingCasesNotice from "@/components/ftc/FTCMissingCasesNotice";
import FTCOverviewStats from "@/components/ftc/FTCOverviewStats";
import FTCGroupingSelector from "@/components/ftc/FTCGroupingSelector";
import FTCGroupChart, { ViolationDonut } from "@/components/ftc/FTCGroupChart";
import FTCGroupList from "@/components/ftc/FTCGroupList";
import FTCGroupDetail from "@/components/ftc/FTCGroupDetail";

interface Props {
  data: FTCDataPayload;
}

export default function FTCAnalyticsTab({ data }: Props) {
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
      // Merge with existing tab param
      const newParams = new URLSearchParams(searchParams);
      newParams.set("mode", mode);
      newParams.delete("group");
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleGroupSelect = useCallback(
    (key: string) => {
      const newKey = selectedGroup === key ? null : key;
      setSelectedGroup(newKey);
      // Merge with existing tab param
      const newParams = new URLSearchParams(searchParams);
      newParams.set("mode", groupingMode);
      if (newKey) {
        newParams.set("group", newKey);
      } else {
        newParams.delete("group");
      }
      setSearchParams(newParams, { replace: true });
    },
    [selectedGroup, groupingMode, searchParams, setSearchParams]
  );

  return (
    <main className="py-8 space-y-8">
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
  );
}
