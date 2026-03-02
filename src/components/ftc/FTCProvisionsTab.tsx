import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProvisionsManifest } from "@/hooks/use-provisions";
import { useFTCData } from "@/hooks/use-ftc-data";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";
import TopicSidebar from "@/components/ftc/provisions/TopicSidebar";
import ProvisionsContent from "@/components/ftc/provisions/ProvisionsContent";
import SearchResults from "@/components/ftc/provisions/SearchResults";
import CaseBrowser from "@/components/ftc/provisions/CaseBrowser";

type ProvisionsView = "topic" | "case";

export default function FTCProvisionsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: manifest, isLoading, error } = useProvisionsManifest();
  const { data: ftcData, isLoading: isCasesLoading } = useFTCData();
  const cases = (ftcData?.cases ?? []) as EnhancedFTCCaseSummary[];

  // Sub-tab state from URL — default to "case"
  const viewParam = searchParams.get("view") as ProvisionsView | null;
  const activeView: ProvisionsView =
    viewParam === "topic" || viewParam === "case" ? viewParam : "case";

  const selectedTopic = searchParams.get("topic");
  const searchQuery = searchParams.get("q") ?? "";
  const searchScope = (searchParams.get("scope") as "topic" | "all") ?? "topic";

  const handleViewChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === "case") {
        // Switch to case view — clear topic-specific params
        newParams.delete("view");
        newParams.delete("topic");
        newParams.delete("q");
        newParams.delete("scope");
      } else {
        newParams.set("view", value);
        // Clear any case-specific params when switching to topic
        newParams.delete("topic");
        newParams.delete("q");
        newParams.delete("scope");
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleTopicSelect = useCallback(
    (topicSlug: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "provisions");
      newParams.set("view", "topic");
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
    <Tabs value={activeView} onValueChange={handleViewChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="case">By Case</TabsTrigger>
        <TabsTrigger value="topic">By Topic</TabsTrigger>
      </TabsList>

      <TabsContent value="case">
        {isCasesLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground font-garamond">
                Loading cases...
              </p>
            </div>
          </div>
        ) : (
          <CaseBrowser cases={cases} />
        )}
      </TabsContent>

      <TabsContent value="topic">
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
              <div className="py-16 text-center">
                <p className="text-lg text-muted-foreground font-garamond max-w-xl mx-auto">
                  Select a topic from the sidebar to browse provisions by
                  statutory authority or remedy type.
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
