import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseISO, isWithinInterval } from "date-fns";
import { useProvisionShard } from "@/hooks/use-provisions";
import { useProvisionSearch } from "@/hooks/use-provision-search";
import ProvisionCard from "@/components/ftc/provisions/ProvisionCard";
import ProvisionFilterBar from "@/components/ftc/provisions/ProvisionFilterBar";
import type { FilterChip } from "@/components/ftc/provisions/FilterChips";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { ProvisionsManifest } from "@/types/ftc";

interface Props {
  topic: string;
  manifest: ProvisionsManifest;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchScope: "topic" | "all";
  onSearchScopeChange: (scope: "topic" | "all") => void;
}

const PAGE_SIZE = 50;

export default function ProvisionsContent({
  topic,
  manifest,
  searchQuery,
  onSearchChange,
  searchScope,
  onSearchScopeChange,
}: Props) {
  const topicMeta = manifest.topics[topic];
  const { data: shard, isLoading, error } = useProvisionShard(topicMeta?.shard ?? null);
  const [page, setPage] = useState(1);

  // Filter state
  const [activeDateRange, setActiveDateRange] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRemedyTypes, setSelectedRemedyTypes] = useState<string[]>([]);

  // Sort state
  const [sortKey, setSortKey] = useState<"date" | "company" | "type">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Search hook for in-topic search
  const shardProvisions = useMemo(() => shard?.provisions ?? [], [shard]);
  const { search } = useProvisionSearch(shardProvisions);

  // Reset page and filters when topic changes
  const prevTopicRef = useRef(topic);
  useEffect(() => {
    if (prevTopicRef.current !== topic) {
      prevTopicRef.current = topic;
      setPage(1);
      setActiveDateRange(null);
      setDateStart(null);
      setDateEnd(null);
      setSelectedCompany(null);
      setSelectedRemedyTypes([]);
      setSortKey("date");
      setSortDir("desc");
    }
  }, [topic]);

  // Reset page when any filter or search changes
  const filterKey = `${activeDateRange}|${selectedCompany}|${selectedRemedyTypes.join(",")}|${sortKey}|${sortDir}|${searchQuery}`;
  const prevFilterRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterRef.current !== filterKey) {
      prevFilterRef.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  // Sorted unique company names from the FULL shard data (not filtered)
  const companies = useMemo(() => {
    if (!shard) return [];
    const names = new Set(shard.provisions.map((p) => p.company_name));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [shard]);

  // Search result IDs (for in-topic search filtering)
  const searchMatchIds = useMemo(() => {
    if (!searchQuery.trim() || searchScope !== "topic") return null;
    const results = search(searchQuery);
    return new Set(results.map((r) => r.id));
  }, [searchQuery, searchScope, search]);

  // Filtered + sorted provisions
  const filtered = useMemo(() => {
    if (!shard) return [];
    let result = [...shard.provisions];

    // Search filter (PROV-09) — applied first so other filters narrow search results
    if (searchMatchIds) {
      result = result.filter(
        (p) => searchMatchIds.has(`${p.case_id}__${p.provision_number}`)
      );
    }

    // Date range filter (PROV-05)
    if (dateStart && dateEnd) {
      const interval = { start: parseISO(dateStart), end: parseISO(dateEnd) };
      result = result.filter((p) => {
        try {
          return isWithinInterval(parseISO(p.date_issued), interval);
        } catch {
          return false;
        }
      });
    }

    // Company filter (PROV-06)
    if (selectedCompany) {
      result = result.filter((p) => p.company_name === selectedCompany);
    }

    // Remedy type filter (PROV-07)
    if (selectedRemedyTypes.length > 0) {
      result = result.filter((p) =>
        p.remedy_types.some((rt) => selectedRemedyTypes.includes(rt))
      );
    }

    // Sort (PROV-08)
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          // ISO date strings: lexicographic comparison works
          cmp = a.date_issued.localeCompare(b.date_issued);
          break;
        case "company":
          cmp = a.company_name.localeCompare(b.company_name);
          break;
        case "type":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [shard, searchMatchIds, dateStart, dateEnd, selectedCompany, selectedRemedyTypes, sortKey, sortDir]);

  // Derived counts
  const resultCount = filtered.length;
  const totalCount = shard?.provisions.length ?? 0;
  const caseCount = useMemo(() => {
    return new Set(filtered.map((p) => p.case_id)).size;
  }, [filtered]);

  // Active filters array for FilterChips
  const activeFilters = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (searchQuery.trim()) {
      chips.push({ key: "search", label: "Search", value: searchQuery.trim() });
    }
    if (activeDateRange) {
      chips.push({ key: "dateRange", label: "Date Range", value: activeDateRange });
    }
    if (selectedCompany) {
      chips.push({ key: "company", label: "Company", value: selectedCompany });
    }
    for (const rt of selectedRemedyTypes) {
      chips.push({ key: `remedy:${rt}`, label: "Remedy Type", value: rt });
    }
    return chips;
  }, [searchQuery, activeDateRange, selectedCompany, selectedRemedyTypes]);

  // Filter callbacks
  const handleDateRange = useCallback(
    (preset: string | null, start: string, end: string) => {
      setActiveDateRange(preset);
      setDateStart(start || null);
      setDateEnd(end || null);
    },
    []
  );

  const handleSort = useCallback(
    (key: "date" | "company" | "type") => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "date" ? "desc" : "asc");
      }
    },
    [sortKey]
  );

  const handleDismissFilter = useCallback(
    (key: string) => {
      if (key === "search") {
        onSearchChange("");
      } else if (key === "dateRange") {
        setActiveDateRange(null);
        setDateStart(null);
        setDateEnd(null);
      } else if (key === "company") {
        setSelectedCompany(null);
      } else if (key.startsWith("remedy:")) {
        const rt = key.slice("remedy:".length);
        setSelectedRemedyTypes((prev) => prev.filter((t) => t !== rt));
      }
    },
    [onSearchChange]
  );

  const handleClearAll = useCallback(() => {
    onSearchChange("");
    setActiveDateRange(null);
    setDateStart(null);
    setDateEnd(null);
    setSelectedCompany(null);
    setSelectedRemedyTypes([]);
  }, [onSearchChange]);

  // Pagination on FILTERED results
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const startIdx = (page - 1) * PAGE_SIZE;
  const displayed = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const hasActiveFilters = activeFilters.length > 0;

  if (!topicMeta) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground font-garamond">
          Topic not found. Please select a topic from the sidebar.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground font-garamond text-sm">
            Loading provisions...
          </p>
        </div>
      </div>
    );
  }

  if (error || !shard) {
    return (
      <div className="py-16 text-center">
        <p className="text-destructive font-garamond">
          Failed to load provisions. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Topic header */}
      <div className="mb-4">
        <h2 className="text-2xl font-garamond font-semibold text-primary">
          {topicMeta.label}
        </h2>
      </div>

      {/* Disclaimer banner */}
      <div className="border border-rule bg-cream/50 p-4 text-sm text-muted-foreground mb-4">
        <span className="font-semibold text-foreground">Note:</span> Provision
        text is extracted from consent order PDFs using automated processing and
        should be verified against the original source documents available on the
        FTC website.
      </div>

      {/* Filter bar */}
      <ProvisionFilterBar
        activeDateRange={activeDateRange}
        onDateRange={handleDateRange}
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyFilter={setSelectedCompany}
        selectedRemedyTypes={selectedRemedyTypes}
        onRemedyTypeFilter={setSelectedRemedyTypes}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        resultCount={resultCount}
        totalCount={totalCount}
        caseCount={caseCount}
        activeFilters={activeFilters}
        onDismissFilter={handleDismissFilter}
        onClearAll={handleClearAll}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchScope={searchScope}
        onSearchScopeChange={onSearchScopeChange}
      />

      {/* Provision count with pagination range */}
      <p className="text-sm text-muted-foreground font-garamond my-4">
        Showing {filtered.length > 0 ? startIdx + 1 : 0}&ndash;
        {Math.min(startIdx + PAGE_SIZE, filtered.length)} of{" "}
        {filtered.length.toLocaleString()} provisions from{" "}
        {caseCount.toLocaleString()} cases
        {hasActiveFilters && (
          <span className="italic">
            {" "}
            (filtered from {totalCount.toLocaleString()} total)
          </span>
        )}
      </p>

      {/* Provision cards */}
      <div>
        {displayed.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground font-garamond">
              No provisions match the current filters.
            </p>
          </div>
        ) : (
          displayed.map((provision, idx) => (
            <ProvisionCard
              key={`${provision.case_id}__${provision.provision_number}__${idx}`}
              provision={provision}
              searchQuery={searchScope === "topic" ? searchQuery : undefined}
            />
          ))
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6 mb-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
