import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GroupStats, GroupingMode, FTCDataPayload } from "@/types/ftc";

interface Props {
  data: FTCDataPayload;
  mode: GroupingMode;
  selectedGroup: string | null;
  onSelectGroup: (key: string) => void;
}

export default function FTCGroupList({ data, mode, selectedGroup, onSelectGroup }: Props) {
  const groupMap: Record<GroupingMode, GroupStats[]> = {
    year: data.groupings.by_year,
    administration: data.groupings.by_administration,
    category: data.groupings.by_category,
  };
  const groups = groupMap[mode];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {groups.map((g) => {
        const isSelected = selectedGroup === g.key;
        return (
          <Card
            key={g.key}
            className={`p-4 cursor-pointer transition-all duration-200 border ${
              isSelected
                ? "border-gold bg-gold/5 shadow-gold"
                : "border-transparent bg-gradient-to-br from-card to-accent/30 shadow-soft hover:shadow-elegant hover:border-gold/20"
            }`}
            onClick={() => onSelectGroup(g.key)}
          >
            <p className="font-semibold text-foreground text-sm truncate">
              {g.label}
            </p>
            <p className="text-2xl font-bold text-primary mt-1">{g.count}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {g.violation_breakdown.deceptive > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700">
                  {g.violation_breakdown.deceptive} dec
                </Badge>
              )}
              {g.violation_breakdown.unfair > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700">
                  {g.violation_breakdown.unfair} unf
                </Badge>
              )}
              {g.violation_breakdown.both > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800">
                  {g.violation_breakdown.both} both
                </Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
