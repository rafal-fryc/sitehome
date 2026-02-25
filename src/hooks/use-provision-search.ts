import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import MiniSearch from "minisearch";
import { useProvisionsManifest } from "@/hooks/use-provisions";
import type { ProvisionRecord, ProvisionShardFile } from "@/types/ftc";

export interface ProvisionSearchResult {
  id: string;
  score: number;
  match: Record<string, string[]>;
  case_id: string;
  company_name: string;
  provision_number: string;
  statutory_topics: string[];
  practice_areas: string[];
}

export function useProvisionSearch(provisions: ProvisionRecord[]) {
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<ProvisionRecord>({
      fields: ["title", "summary", "verbatim_text"],
      storeFields: [
        "case_id",
        "company_name",
        "provision_number",
        "statutory_topics",
        "practice_areas",
      ],
      idField: "id",
      searchOptions: {
        boost: { title: 2, verbatim_text: 1 },
        prefix: true,
        fuzzy: 0.2,
      },
    });

    // Add documents with composite IDs
    const docs = provisions.map((p) => ({
      ...p,
      id: `${p.case_id}__${p.provision_number}`,
    }));
    ms.addAll(docs);

    return ms;
  }, [provisions]);

  const search = useMemo(() => {
    return (
      query: string,
      topicFilter?: string
    ): ProvisionSearchResult[] => {
      if (!query.trim()) return [];

      const options = topicFilter
        ? {
            filter: (result: ProvisionSearchResult) => {
              const topics = [
                ...(result.statutory_topics || []),
                ...(result.practice_areas || []),
              ];
              return topics.some(
                (t) =>
                  t
                    .toLowerCase()
                    .replace(/[\s/]+/g, "-")
                    .replace(/[^a-z0-9-]/g, "") === topicFilter
              );
            },
          }
        : undefined;

      return miniSearch.search(query, options) as ProvisionSearchResult[];
    };
  }, [miniSearch]);

  return { search, miniSearch };
}

export function useAllProvisionsForSearch() {
  const { data: manifest } = useProvisionsManifest();

  const topicEntries = useMemo(() => {
    if (!manifest) return [];
    return Object.entries(manifest.topics);
  }, [manifest]);

  const queries = useQueries({
    queries: topicEntries.map(([topicSlug, topicMeta]) => ({
      queryKey: ["provisions", topicMeta.shard],
      queryFn: async (): Promise<{
        topicSlug: string;
        data: ProvisionShardFile;
      }> => {
        const res = await fetch(`/data/provisions/${topicMeta.shard}`);
        if (!res.ok) throw new Error(`Failed to load ${topicMeta.shard}`);
        const data: ProvisionShardFile = await res.json();
        return { topicSlug, data };
      },
      staleTime: Infinity,
      enabled: !!manifest,
    })),
  });

  const { allProvisions, isLoading, loadedCount, totalCount } = useMemo(() => {
    const total = topicEntries.length;
    let loaded = 0;
    const seen = new Set<string>();
    const provisions: (ProvisionRecord & { _shardTopic: string })[] = [];

    for (const query of queries) {
      if (query.isSuccess && query.data) {
        loaded++;
        const { topicSlug, data } = query.data;
        for (const p of data.provisions) {
          const compositeId = `${p.case_id}__${p.provision_number}`;
          if (!seen.has(compositeId)) {
            seen.add(compositeId);
            provisions.push({ ...p, _shardTopic: topicSlug });
          }
        }
      } else if (query.isLoading) {
        // still loading
      } else {
        loaded++; // count errors as loaded to avoid stuck state
      }
    }

    return {
      allProvisions: provisions,
      isLoading: loaded < total && total > 0,
      loadedCount: loaded,
      totalCount: total,
    };
  }, [queries, topicEntries.length]);

  return { allProvisions, isLoading, loadedCount, totalCount };
}
