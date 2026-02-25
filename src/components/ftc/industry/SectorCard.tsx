import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectorDefinition } from "./industry-utils";

interface Props {
  sector: SectorDefinition;
  caseCount: number;
  topTopics: string[];
  subsectorCounts: { label: string; count: number }[];
  isSelected: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
}

export default function SectorCard({
  sector,
  caseCount,
  topTopics,
  subsectorCounts,
  isSelected,
  onSelect,
  onToggleSelect,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const nonZeroSubsectors = subsectorCounts.filter((s) => s.count > 0);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-gold/50",
        isSelected && "border-gold bg-gold/5"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold font-garamond text-primary">
              {sector.label}
            </h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {caseCount} {caseCount === 1 ? "case" : "cases"}
            </Badge>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect()}
              aria-label={`Select ${sector.label} for comparison`}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {topTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {topTopics.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="text-xs font-garamond"
              >
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {nonZeroSubsectors.length > 1 && (
          <Collapsible
            open={isExpanded}
            onOpenChange={setIsExpanded}
          >
            <CollapsibleTrigger
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-garamond">
                {nonZeroSubsectors.length} subsectors
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-2 space-y-1 pl-5">
                {nonZeroSubsectors.map((sub) => (
                  <li
                    key={sub.label}
                    className="flex items-center justify-between text-sm font-garamond"
                  >
                    <span className="text-muted-foreground">{sub.label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {sub.count}
                    </span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
