import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { BehavioralPattern } from "@/types/ftc";
import BehavioralCaseCard from "@/components/ftc/patterns/BehavioralCaseCard";
import CaseProvisionAccordion from "@/components/ftc/provisions/CaseProvisionAccordion";

const INITIAL_DISPLAY_COUNT = 15;

interface Props {
  pattern: BehavioralPattern;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function BehavioralPatternRow({ pattern, isExpanded, onToggle }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  // Group cases by year for timeline
  const casesByYear = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of pattern.cases) {
      map.set(c.year, (map.get(c.year) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [pattern.cases]);

  const maxCount = Math.max(...casesByYear.map(([, c]) => c));

  const sortedCases = useMemo(
    () => [...pattern.cases].sort((a, b) => b.year - a.year),
    [pattern.cases]
  );
  const displayedCases = showAll
    ? sortedCases
    : sortedCases.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = pattern.cases.length > INITIAL_DISPLAY_COUNT;

  const handleToggleCase = (caseId: string) => {
    setExpandedCaseId((prev) => (prev === caseId ? null : caseId));
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="cursor-pointer hover:bg-cream/50 transition-colors border-b border-rule py-3 px-4 flex items-center justify-between gap-4">
          {/* Left side: name */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-garamond font-semibold text-primary truncate">
              {pattern.name}
            </span>
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
          {/* Description */}
          <p className="text-sm text-muted-foreground font-garamond mt-3 mb-4">
            {pattern.description}
          </p>

          {/* Enforcement topic badges */}
          {pattern.enforcement_topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {pattern.enforcement_topics.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="bg-muted text-muted-foreground text-xs"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Year timeline */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Cases by Year
            </h4>
            <div className="space-y-0.5">
              {casesByYear.map(([year, count]) => (
                <div key={year} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-right text-muted-foreground tabular-nums">
                    {year}
                  </span>
                  <div
                    className="h-4 bg-gold/60 rounded"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      minWidth: "8px",
                    }}
                  />
                  <span className="text-muted-foreground text-xs">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Case cards */}
          <div className="space-y-2">
            {displayedCases.map((c) => (
              <div key={c.case_id}>
                <BehavioralCaseCard
                  caseData={c}
                  onToggle={() => handleToggleCase(c.case_id)}
                />
                {expandedCaseId === c.case_id && (
                  <CaseProvisionAccordion
                    caseId={c.case_id}
                    ftcUrl={c.ftc_url}
                  />
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-sm text-gold hover:text-gold-dark font-medium"
            >
              {showAll
                ? "Show fewer cases"
                : `Show all ${pattern.cases.length} cases`}
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
