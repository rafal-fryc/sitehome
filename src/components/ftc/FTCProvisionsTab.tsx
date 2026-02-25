import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProvisionsManifest } from "@/hooks/use-provisions";
import TopicSidebar from "@/components/ftc/provisions/TopicSidebar";
import ProvisionsLanding from "@/components/ftc/provisions/ProvisionsLanding";
import ProvisionsContent from "@/components/ftc/provisions/ProvisionsContent";
import SearchResults from "@/components/ftc/provisions/SearchResults";

export default function FTCProvisionsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: manifest, isLoading, error } = useProvisionsManifest();

  const selectedTopic = searchParams.get("topic");
  const searchQuery = searchParams.get("q") ?? "";
  const searchScope = (searchParams.get("scope") as "topic" | "all") ?? "topic";

  const handleTopicSelect = useCallback(
    (topicSlug: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "provisions");
      newParams.set("topic", topicSlug);
      // Keep search query when navigating from cross-topic results but switch scope to topic
      if (searchQuery) {
        newParams.set("q", searchQuery);
        newParams.set("scope", "topic");
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams, searchQuery]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (query.trim()) {
        newParams.set("q", query);
      } else {
        newParams.delete("q");
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleSearchScopeChange = useCallback(
    (scope: "topic" | "all") => {
      const newParams = new URLSearchParams(searchParams);
      if (scope === "all") {
        newParams.set("scope", "all");
      } else {
        newParams.delete("scope");
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Show cross-topic search when scope is "all" and there's a query
  const showCrossTopicSearch =
    searchScope === "all" && searchQuery.trim().length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground font-garamond">
            Loading provisions library...
          </p>
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-destructive font-garamond">
          Failed to load provisions library. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 py-6">
      <TopicSidebar
        manifest={manifest}
        selectedTopic={showCrossTopicSearch ? null : selectedTopic}
        onSelectTopic={handleTopicSelect}
      />
      <div className="flex-1 min-w-0">
        {showCrossTopicSearch ? (
          <SearchResults
            query={searchQuery}
            manifest={manifest}
            onSelectTopic={handleTopicSelect}
          />
        ) : selectedTopic ? (
          <ProvisionsContent
            topic={selectedTopic}
            manifest={manifest}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchScope={searchScope}
            onSearchScopeChange={handleSearchScopeChange}
          />
        ) : (
          <ProvisionsLanding manifest={manifest} />
        )}
      </div>
    </div>
  );
}
