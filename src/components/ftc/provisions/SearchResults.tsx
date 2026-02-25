import { useMemo } from "react";
import { Search } from "lucide-react";
import {
  useAllProvisionsForSearch,
  useProvisionSearch,
} from "@/hooks/use-provision-search";
import ProvisionCard from "@/components/ftc/provisions/ProvisionCard";
import type { ProvisionsManifest, ProvisionRecord } from "@/types/ftc";

interface Props {
  query: string;
  manifest: ProvisionsManifest;
  onSelectTopic: (topic: string) => void;
}

const MAX_PER_GROUP = 5;

export default function SearchResults({ query, manifest, onSelectTopic }: Props) {
  const { allProvisions, isLoading, loadedCount, totalCount } =
    useAllProvisionsForSearch();

  const { search } = useProvisionSearch(
    allProvisions as ProvisionRecord[]
  );

  // Run search
  const searchResults = useMemo(() => {
    if (!query.trim() || allProvisions.length === 0) return [];
    return search(query);
  }, [query, allProvisions, search]);

  // Build a lookup from composite ID to provision (with shard topic)
  const provisionById = useMemo(() => {
    const map = new Map<string, ProvisionRecord & { _shardTopic: string }>();
    for (const p of allProvisions as (ProvisionRecord & { _shardTopic: string })[]) {
      map.set(`${p.case_id}__${p.provision_number}`, p);
    }
    return map;
  }, [allProvisions]);

  // Group results by shard topic
  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      { provisions: ProvisionRecord[]; label: string; count: number }
    >();

    for (const result of searchResults) {
      const provision = provisionById.get(result.id);
      if (!provision) continue;

      const topicSlug = provision._shardTopic;
      const topicMeta = manifest.topics[topicSlug];
      if (!topicMeta) continue;

      if (!groups.has(topicSlug)) {
        groups.set(topicSlug, {
          provisions: [],
          label: topicMeta.label,
          count: 0,
        });
      }
      const group = groups.get(topicSlug)!;
      group.count++;
      if (group.provisions.length < MAX_PER_GROUP) {
        group.provisions.push(provision);
      }
    }

    // Sort groups by count descending
    return [...groups.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [searchResults, provisionById, manifest]);

  // Overall stats
  const totalMatches = searchResults.length;
  const uniqueCases = useMemo(() => {
    const caseIds = new Set<string>();
    for (const r of searchResults) {
      const p = provisionById.get(r.id);
      if (p) caseIds.add(p.case_id);
    }
    return caseIds.size;
  }, [searchResults, provisionById]);
  const topicCount = grouped.length;

  if (!query.trim()) {
    return (
      <div className="py-16 text-center">
        <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-garamond">
          Enter a search query to search across all topics.
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
            Loading provisions... ({loadedCount}/{totalCount} topics)
          </p>
        </div>
      </div>
    );
  }

  if (totalMatches === 0) {
    return (
      <div className="py-16 text-center">
        <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-garamond">
          No provisions match &ldquo;{query}&rdquo; across any topic.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary header */}
      <div className="mb-6">
        <h2 className="text-2xl font-garamond font-semibold text-primary mb-2">
          Search Results
        </h2>
        <p className="text-sm text-muted-foreground font-garamond">
          {totalMatches.toLocaleString()} matching provisions across{" "}
          {uniqueCases.toLocaleString()} cases in{" "}
          {topicCount.toLocaleString()} topics
        </p>
      </div>

      {/* Topic groups */}
      <div className="space-y-8">
        {grouped.map(([topicSlug, group]) => (
          <section key={topicSlug}>
            {/* Topic group header */}
            <div className="flex items-center gap-3 mb-3 border-b border-rule pb-2">
              <button
                onClick={() => onSelectTopic(topicSlug)}
                className="text-lg font-garamond font-semibold text-primary hover:text-gold-dark transition-colors"
              >
                {group.label}
              </button>
              <span className="text-sm text-muted-foreground font-garamond">
                ({group.count} {group.count === 1 ? "result" : "results"})
              </span>
            </div>

            {/* Top results in this topic */}
            <div>
              {group.provisions.map((provision, idx) => (
                <ProvisionCard
                  key={`${provision.case_id}__${provision.provision_number}__${idx}`}
                  provision={provision}
                  searchQuery={query}
                />
              ))}
            </div>

            {/* View all link */}
            {group.count > MAX_PER_GROUP && (
              <button
                onClick={() => onSelectTopic(topicSlug)}
                className="text-sm font-garamond text-gold hover:text-gold-dark transition-colors"
              >
                View all {group.count} in {group.label} &rarr;
              </button>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
