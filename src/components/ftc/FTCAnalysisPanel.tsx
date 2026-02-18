import { Badge } from "@/components/ui/badge";
import type { GroupStats, GroupingMode, FTCDataPayload } from "@/types/ftc";

interface Props {
  data: FTCDataPayload;
  mode: GroupingMode;
  groupKey: string;
}

export default function FTCAnalysisPanel({ data, mode, groupKey }: Props) {
  const dimension =
    mode === "year" ? "by_year" : mode === "administration" ? "by_administration" : "by_category";
  const analysisEntry = data.analysis[dimension]?.[groupKey];
  const groupMap: Record<GroupingMode, GroupStats[]> = {
    year: data.groupings.by_year,
    administration: data.groupings.by_administration,
    category: data.groupings.by_category,
  };
  const group = groupMap[mode].find((g) => g.key === groupKey);

  if (!analysisEntry || !group) return null;

  return (
    <div className="p-6 bg-cream border border-rule border-l-[3px] border-l-gold">
      <h3 className="text-xl font-bold text-foreground mb-2">
        {analysisEntry.title}
      </h3>
      <p className="text-muted-foreground mb-4">{analysisEntry.narrative}</p>

      {group.top_categories && group.top_categories.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide-label mb-1">Top Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {group.top_categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {group.top_companies && group.top_companies.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide-label mb-1">Notable Companies</p>
          <div className="flex flex-wrap gap-1.5">
            {group.top_companies.map((co) => (
              <Badge key={co} variant="outline" className="text-xs">
                {co}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
