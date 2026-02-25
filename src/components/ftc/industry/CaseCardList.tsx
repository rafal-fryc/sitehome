import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown, Check, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";
import CaseCard from "@/components/ftc/industry/CaseCard";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface Props {
  cases: EnhancedFTCCaseSummary[];
  onViewProvisions: (caseData: EnhancedFTCCaseSummary) => void;
}

type SortKey = "date" | "company" | "provisions";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "company", label: "Company" },
  { key: "provisions", label: "Provisions" },
];

export default function CaseCardList({ cases, onViewProvisions }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);

  // All unique topics from cases
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    for (const c of cases) {
      for (const t of c.statutory_topics) {
        topics.add(t);
      }
    }
    return [...topics].sort();
  }, [cases]);

  // Reset page on sort/filter change
  const filterKey = `${sortKey}|${sortDir}|${selectedTopics.join(",")}`;
  const prevFilterRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterRef.current !== filterKey) {
      prevFilterRef.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  // Filter then sort
  const processed = useMemo(() => {
    let result = [...cases];

    // Topic filter
    if (selectedTopics.length > 0) {
      result = result.filter((c) =>
        c.statutory_topics.some((t) => selectedTopics.includes(t))
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = a.date_issued.localeCompare(b.date_issued);
          break;
        case "company":
          cmp = a.company_name.localeCompare(b.company_name);
          break;
        case "provisions":
          cmp = a.num_provisions - b.num_provisions;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [cases, selectedTopics, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(processed.length / PAGE_SIZE);
  const startIdx = (page - 1) * PAGE_SIZE;
  const displayed = processed.slice(startIdx, startIdx + PAGE_SIZE);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "date" ? "desc" : "asc");
      }
    },
    [sortKey]
  );

  const handleTopicToggle = useCallback(
    (topic: string) => {
      setSelectedTopics((prev) =>
        prev.includes(topic)
          ? prev.filter((t) => t !== topic)
          : [...prev, topic]
      );
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort control */}
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1.5 border border-rule px-3 py-1.5 text-sm font-garamond bg-cream hover:bg-gold/10 transition-colors">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort: {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
              <span className="text-xs opacity-60">
                {sortDir === "asc" ? "\u2191" : "\u2193"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  handleSort(option.key);
                  setSortOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 text-sm font-garamond hover:bg-accent rounded-sm",
                  sortKey === option.key && "font-semibold"
                )}
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5",
                    sortKey === option.key ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
                {sortKey === option.key && (
                  <span className="ml-auto text-xs opacity-60">
                    {sortDir === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Topic filter */}
        {allTopics.length > 0 && (
          <Popover open={topicOpen} onOpenChange={setTopicOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 border border-rule px-3 py-1.5 text-sm font-garamond bg-cream hover:bg-gold/10 transition-colors",
                  selectedTopics.length > 0 &&
                    "bg-primary/10 border-primary/30"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                {selectedTopics.length > 0
                  ? `Topics (${selectedTopics.length})`
                  : "Filter by topic..."}
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {allTopics.map((topic) => (
                  <label
                    key={topic}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm font-garamond hover:bg-accent rounded-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTopics.includes(topic)}
                      onCheckedChange={() => handleTopicToggle(topic)}
                    />
                    {topic}
                  </label>
                ))}
              </div>
              {selectedTopics.length > 0 && (
                <button
                  onClick={() => setSelectedTopics([])}
                  className="w-full mt-2 pt-2 border-t border-rule text-xs text-muted-foreground hover:text-foreground font-garamond"
                >
                  Clear all
                </button>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Result count */}
        <span className="text-sm text-muted-foreground font-garamond ml-auto">
          {processed.length} case{processed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Case card list */}
      {displayed.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground font-garamond">
            No cases match the current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((caseData) => (
            <CaseCard
              key={caseData.id}
              caseData={caseData}
              onViewProvisions={() => onViewProvisions(caseData)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 mb-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers(page, totalPages).map((pageNum, idx) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={page === pageNum}
                      onClick={() => setPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

/**
 * Generate page number array with ellipsis for pagination display.
 * Shows first, last, and neighbors of current page.
 */
function getPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  // Show neighbors
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  pages.push(total);

  return pages;
}
