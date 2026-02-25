import type { SectorStats } from "@/components/ftc/FTCIndustryTab";

interface Props {
  sectorStats: Record<string, SectorStats>;
  onSelectSector: (slug: string) => void;
  selectedSectors: Set<string>;
  onToggleSelect: (slug: string) => void;
  onCompare: () => void;
}

export default function SectorGrid({}: Props) {
  return (
    <div className="py-8 text-center text-muted-foreground font-garamond">
      Loading sector grid...
    </div>
  );
}
