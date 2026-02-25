import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DATE_PRESETS, REMEDY_TYPE_OPTIONS } from "@/constants/ftc";
import CompanyAutocomplete from "@/components/ftc/provisions/CompanyAutocomplete";
import FilterChips, {
  type FilterChip,
} from "@/components/ftc/provisions/FilterChips";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  activeDateRange: string | null;
  onDateRange: (preset: string | null, start: string, end: string) => void;
  companies: string[];
  selectedCompany: string | null;
  onCompanyFilter: (company: string | null) => void;
  selectedRemedyTypes: string[];
  onRemedyTypeFilter: (types: string[]) => void;
  sortKey: "date" | "company" | "type";
  sortDir: "asc" | "desc";
  onSort: (key: "date" | "company" | "type") => void;
  resultCount: number;
  totalCount: number;
  caseCount: number;
  activeFilters: FilterChip[];
  onDismissFilter: (key: string) => void;
  onClearAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchScope: "topic" | "all";
  onSearchScopeChange: (scope: "topic" | "all") => void;
}

const SORT_OPTIONS: { key: "date" | "company" | "type"; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "company", label: "Company" },
  { key: "type", label: "Type" },
];

export default function ProvisionFilterBar({
  activeDateRange,
  onDateRange,
  companies,
  selectedCompany,
  onCompanyFilter,
  selectedRemedyTypes,
  onRemedyTypeFilter,
  sortKey,
  sortDir,
  onSort,
  resultCount,
  totalCount,
  caseCount,
  activeFilters,
  onDismissFilter,
  onClearAll,
  searchQuery,
  onSearchChange,
  searchScope,
  onSearchScopeChange,
}: Props) {
  const [remedyOpen, setRemedyOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Debounced search input
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when external searchQuery changes (e.g., URL param or clear)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchChange("");
  };

  const handleRemedyToggle = (remedyType: string) => {
    if (selectedRemedyTypes.includes(remedyType)) {
      onRemedyTypeFilter(
        selectedRemedyTypes.filter((rt) => rt !== remedyType)
      );
    } else {
      onRemedyTypeFilter([...selectedRemedyTypes, remedyType]);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-rule py-3 space-y-2">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search provisions..."
            className="w-full border border-rule pl-9 pr-8 py-1.5 text-sm font-garamond bg-cream focus:outline-none focus:border-primary/50 transition-colors"
          />
          {localSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Scope toggle */}
        <div className="flex border border-rule">
          <button
            onClick={() => onSearchScopeChange("topic")}
            className={cn(
              "text-xs px-2.5 py-1.5 font-garamond transition-colors",
              searchScope === "topic"
                ? "bg-primary text-primary-foreground"
                : "bg-cream hover:bg-gold/10"
            )}
          >
            This topic
          </button>
          <button
            onClick={() => onSearchScopeChange("all")}
            className={cn(
              "text-xs px-2.5 py-1.5 font-garamond transition-colors border-l border-rule",
              searchScope === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-cream hover:bg-gold/10"
            )}
          >
            All topics
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date range preset buttons */}
        <div className="flex gap-1">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                if (activeDateRange === preset.label) {
                  onDateRange(null, "", "");
                } else {
                  onDateRange(preset.label, preset.start, preset.end);
                }
              }}
              className={cn(
                "text-xs px-2 py-1 border border-rule font-garamond transition-colors",
                activeDateRange === preset.label
                  ? "bg-primary text-primary-foreground"
                  : "bg-cream hover:bg-gold/10"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Company autocomplete */}
        <CompanyAutocomplete
          companies={companies}
          selectedCompany={selectedCompany}
          onSelect={onCompanyFilter}
        />

        {/* Remedy type multi-select */}
        <Popover open={remedyOpen} onOpenChange={setRemedyOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 border border-rule px-3 py-1.5 text-sm font-garamond bg-cream hover:bg-gold/10 transition-colors",
                selectedRemedyTypes.length > 0 &&
                  "bg-primary/10 border-primary/30"
              )}
            >
              {selectedRemedyTypes.length > 0
                ? `Remedy (${selectedRemedyTypes.length})`
                : "Remedy type..."}
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              {REMEDY_TYPE_OPTIONS.map((rt) => (
                <label
                  key={rt}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm font-garamond hover:bg-accent rounded-sm cursor-pointer"
                >
                  <Checkbox
                    checked={selectedRemedyTypes.includes(rt)}
                    onCheckedChange={() => handleRemedyToggle(rt)}
                  />
                  {rt}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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
          <PopoverContent className="w-40 p-1" align="start">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onSort(option.key);
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
          Showing {resultCount.toLocaleString()} of{" "}
          {totalCount.toLocaleString()} provisions from{" "}
          {caseCount.toLocaleString()} cases
        </span>
      </div>

      {/* Active filter chips */}
      <FilterChips
        filters={activeFilters}
        onDismiss={onDismissFilter}
        onClearAll={onClearAll}
      />
    </div>
  );
}
