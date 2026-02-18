import { useMemo } from "react";
import type { GroupingMode, FTCDataPayload } from "@/types/ftc";
import FTCAnalysisPanel from "./FTCAnalysisPanel";
import FTCCaseTable from "./FTCCaseTable";

interface Props {
  data: FTCDataPayload;
  mode: GroupingMode;
  groupKey: string;
}

export default function FTCGroupDetail({ data, mode, groupKey }: Props) {
  const filteredCases = useMemo(() => {
    return data.cases.filter((c) => {
      if (mode === "year") return String(c.year) === groupKey;
      if (mode === "administration") return c.administration === groupKey;
      if (mode === "category") return c.categories.includes(groupKey);
      return false;
    });
  }, [data.cases, mode, groupKey]);

  return (
    <div className="space-y-6">
      <FTCAnalysisPanel data={data} mode={mode} groupKey={groupKey} />
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Cases ({filteredCases.length})
        </h3>
        <FTCCaseTable cases={filteredCases} />
      </div>
    </div>
  );
}
