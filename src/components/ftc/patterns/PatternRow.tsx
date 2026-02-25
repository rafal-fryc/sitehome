import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PatternGroup } from "@/types/ftc";
import PatternTimeline from "@/components/ftc/patterns/PatternTimeline";

interface Props {
  pattern: PatternGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function PatternRow({ pattern, isExpanded, onToggle }: Props) {
  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="cursor-pointer hover:bg-cream/50 transition-colors border-b border-rule py-3 px-4 flex items-center justify-between gap-4">
          {/* Left side: name + badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-garamond font-semibold text-primary truncate">
              {pattern.name}
            </span>
            {pattern.is_structural && (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground text-xs shrink-0"
              >
                Structural
              </Badge>
            )}
          </div>

          {/* Right side: stats + chevron */}
          <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
            <span>{pattern.case_count} cases</span>
            <span>
              {pattern.year_range[0]}&ndash;{pattern.year_range[1]}
            </span>
            <ChevronIcon className="h-4 w-4" />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 bg-cream/20">
          <PatternTimeline variants={pattern.variants} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
