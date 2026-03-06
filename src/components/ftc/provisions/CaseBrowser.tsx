import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";
import CaseCard from "@/components/ftc/industry/CaseCard";
import CaseProvisionAccordion from "@/components/ftc/provisions/CaseProvisionAccordion";
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
import { getPageNumbers } from "@/lib/pagination";

interface Props {
  cases: EnhancedFTCCaseSummary[];
}

type SortKey = "date" | "company" | "provisions";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "company", label: "Company" },
  { key: "provisions", label: "Provisions" },
];

export default function CaseBrowser({ cases }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);

  // Only cases with classified provisions
  const casePool = useMemo(
    () => cases.filter((c) => c.num_provisions > 0),
    [cases]
  );

  // Search filtering (filter-as-you-type)
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return casePool;
    const q = searchQuery.toLowerCase();
    return casePool.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        c.docket_number.toLowerCase().includes(q) ||
        c.year.toString().includes(q)
    );
  }, [casePool, searchQuery]);

  // Sorting
  const sorted = useMemo(() => {
    const result = [...filtered];
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
  }, [filtered, sortKey, sortDir]);

  // Reset page on search/sort change
  const filterKey = `${searchQuery}|${sortKey}|${sortDir}`;
  const prevFilterRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterRef.current !== filterKey) {
      prevFilterRef.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const startIdx = (page - 1) * PAGE_SIZE;
  const displayed = sorted.slice(startIdx, startIdx + PAGE_SIZE);

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

  const handleToggleExpand = useCallback((caseId: string) => {
    setExpandedCaseId((prev) => (prev === caseId ? null : caseId));
  }, []);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by company, case title, or year..."
          className="w-full border border-rule bg-cream px-4 py-2.5 pl-9 text-sm font-garamond placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold/50"
        />
      </div>

      {/* Controls row: sort + result count */}
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

        {/* Result count */}
        <span className="text-sm text-muted-foreground font-garamond ml-auto">
          {sorted.length} enforcement action{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Case list */}
      {displayed.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground font-garamond">
            No cases match your search.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((caseData) => (
            <div key={caseData.id}>
              <CaseCard
                caseData={caseData}
                onViewProvisions={() => handleToggleExpand(caseData.id)}
              />
              {expandedCaseId === caseData.id && (
                <CaseProvisionAccordion
                  caseId={caseData.id}
                  ftcUrl={caseData.ftc_url}
                />
              )}
            </div>
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
