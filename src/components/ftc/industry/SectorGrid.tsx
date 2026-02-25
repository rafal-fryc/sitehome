import { useMemo } from "react";
import type { SectorStats } from "@/components/ftc/FTCIndustryTab";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";
import {
  SECTOR_TAXONOMY,
  getSectorSlug,
  getTopTopics,
  classifySubsector,
} from "./industry-utils";
import SectorCard from "./SectorCard";

interface Props {
  sectorStats: Record<string, SectorStats>;
  onSelectSector: (slug: string) => void;
  selectedSectors: Set<string>;
  onToggleSelect: (slug: string) => void;
  onCompare: () => void;
}

function computeSubsectorCounts(
  sectorSlug: string,
  cases: EnhancedFTCCaseSummary[]
): { label: string; count: number }[] {
  const counts: Record<string, number> = {};

  for (const c of cases) {
    const subsector = classifySubsector(sectorSlug, c.company_name, c.categories);
    counts[subsector] = (counts[subsector] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

export default function SectorGrid({
  sectorStats,
  onSelectSector,
  selectedSectors,
  onToggleSelect,
  onCompare,
}: Props) {
  const sectorCards = useMemo(() => {
    return SECTOR_TAXONOMY.map((sector) => {
      const stats = sectorStats[sector.label];
      const cases = stats?.cases ?? [];
      const slug = getSectorSlug(sector.label);

      return {
        sector,
        slug,
        caseCount: cases.length,
        topTopics: getTopTopics(cases as EnhancedFTCCaseSummary[], 3),
        subsectorCounts: computeSubsectorCounts(
          slug,
          cases as EnhancedFTCCaseSummary[]
        ),
      };
    });
  }, [sectorStats]);

  return (
    <div className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-garamond font-semibold text-primary">
          Industry Sectors
        </h2>
        <p className="text-sm text-muted-foreground font-garamond mt-1">
          Browse FTC enforcement actions by industry. Select sectors to compare.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectorCards.map(
          ({ sector, slug, caseCount, topTopics, subsectorCounts }) => (
            <SectorCard
              key={slug}
              sector={sector}
              caseCount={caseCount}
              topTopics={topTopics}
              subsectorCounts={subsectorCounts}
              isSelected={selectedSectors.has(slug)}
              onSelect={() => onSelectSector(slug)}
              onToggleSelect={() => onToggleSelect(slug)}
            />
          )
        )}
      </div>

      {selectedSectors.size >= 2 && (
        <div className="sticky bottom-0 z-10 mt-6 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-rule flex items-center justify-between">
          <span className="text-sm font-garamond text-muted-foreground">
            {selectedSectors.size} sectors selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                for (const slug of selectedSectors) {
                  onToggleSelect(slug);
                }
              }}
              className="px-3 py-1.5 text-sm font-garamond text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onCompare}
              className="px-4 py-1.5 text-sm font-garamond font-medium bg-primary text-cream rounded hover:bg-primary/90 transition-colors"
            >
              Compare Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
