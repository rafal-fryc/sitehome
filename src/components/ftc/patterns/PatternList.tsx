import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PatternGroup } from "@/types/ftc";
import PatternRow from "@/components/ftc/patterns/PatternRow";

interface Props {
  patterns: PatternGroup[];
}

type SortBy = "recency" | "cases" | "name";

export default function PatternList({ patterns }: Props) {
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("recency");

  // Collect unique enforcement topics across all patterns
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    for (const p of patterns) {
      for (const t of p.enforcement_topics) {
        topics.add(t);
      }
    }
    return [...topics].sort();
  }, [patterns]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = patterns;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Topic filter
    if (topicFilter) {
      result = result.filter((p) =>
        p.enforcement_topics.includes(topicFilter)
      );
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case "recency":
        sorted.sort(
          (a, b) =>
            b.most_recent_year - a.most_recent_year ||
            b.case_count - a.case_count
        );
        break;
      case "cases":
        sorted.sort((a, b) => b.case_count - a.case_count);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [patterns, searchQuery, topicFilter, sortBy]);

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Topic filter */}
        <Select
          value={topicFilter || "all"}
          onValueChange={(v) => setTopicFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {allTopics.map((topic) => (
              <SelectItem key={topic} value={topic}>
                {topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recency">Most Recent</SelectItem>
            <SelectItem value="cases">Most Cases</SelectItem>
            <SelectItem value="name">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary line */}
      <p className="text-sm text-muted-foreground mb-3 font-garamond">
        {filtered.length} pattern{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Pattern list */}
      <div className="border-t border-rule">
        {filtered.map((pattern) => (
          <PatternRow
            key={pattern.id}
            pattern={pattern}
            isExpanded={expandedPatternId === pattern.id}
            onToggle={() =>
              setExpandedPatternId(
                expandedPatternId === pattern.id ? null : pattern.id
              )
            }
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground font-garamond">
            No patterns match your search criteria.
          </p>
        )}
      </div>
    </div>
  );
}
