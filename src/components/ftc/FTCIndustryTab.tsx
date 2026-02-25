import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { FTCDataPayload, EnhancedFTCCaseSummary } from "@/types/ftc";
import { getSectorLabel } from "@/components/ftc/industry/industry-utils";
import SectorGrid from "@/components/ftc/industry/SectorGrid";
import SectorDetail from "@/components/ftc/industry/SectorDetail";

interface Props {
  data: FTCDataPayload;
}

export interface SectorStats {
  cases: EnhancedFTCCaseSummary[];
  topicCounts: Record<string, number>;
  remedyCounts: Record<string, number>;
}

export default function FTCIndustryTab({ data }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectorParam = searchParams.get("sector");
  const compareParam = searchParams.get("compare");

  const cases = data.cases as EnhancedFTCCaseSummary[];

  const sectorStats = useMemo(() => {
    const stats: Record<string, SectorStats> = {};

    for (const c of cases) {
      for (const sector of c.industry_sectors) {
        if (!stats[sector]) {
          stats[sector] = { cases: [], topicCounts: {}, remedyCounts: {} };
        }
        stats[sector].cases.push(c);

        for (const topic of c.statutory_topics) {
          stats[sector].topicCounts[topic] =
            (stats[sector].topicCounts[topic] || 0) + 1;
        }

        for (const remedy of c.remedy_types) {
          stats[sector].remedyCounts[remedy] =
            (stats[sector].remedyCounts[remedy] || 0) + 1;
        }
      }
    }

    return stats;
  }, [cases]);

  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(
    new Set()
  );

  const handleSelectSector = useCallback(
    (slug: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "industries");
      newParams.set("sector", slug);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleToggleSelect = useCallback((slug: string) => {
    setSelectedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedSectors.size >= 2) {
      const newParams = new URLSearchParams();
      newParams.set("tab", "industries");
      newParams.set("compare", Array.from(selectedSectors).join(","));
      setSearchParams(newParams, { replace: true });
    }
  }, [selectedSectors, setSearchParams]);

  const handleBack = useCallback(() => {
    const newParams = new URLSearchParams();
    newParams.set("tab", "industries");
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams]);

  const handleViewProvisions = useCallback(
    (_caseData: EnhancedFTCCaseSummary) => {
      const newParams = new URLSearchParams();
      newParams.set("tab", "provisions");
      setSearchParams(newParams);
    },
    [setSearchParams]
  );

  // Get cases for the selected sector (lookup by label from slug)
  const sectorCases = useMemo(() => {
    if (!sectorParam) return [];
    const label = getSectorLabel(sectorParam);
    if (!label) return [];
    return sectorStats[label]?.cases ?? [];
  }, [sectorParam, sectorStats]);

  // Route between views based on URL params
  if (compareParam) {
    return (
      <div className="py-8 text-center text-muted-foreground font-garamond">
        Compare: {compareParam}
      </div>
    );
  }

  if (sectorParam) {
    return (
      <SectorDetail
        sectorSlug={sectorParam}
        cases={sectorCases}
        onBack={handleBack}
        onViewProvisions={handleViewProvisions}
      />
    );
  }

  return (
    <SectorGrid
      sectorStats={sectorStats}
      onSelectSector={handleSelectSector}
      selectedSectors={selectedSectors}
      onToggleSelect={handleToggleSelect}
      onCompare={handleCompare}
    />
  );
}
