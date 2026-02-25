import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProvisionsManifest } from "@/hooks/use-provisions";
import TopicSidebar from "@/components/ftc/provisions/TopicSidebar";
import ProvisionsLanding from "@/components/ftc/provisions/ProvisionsLanding";
import ProvisionsContent from "@/components/ftc/provisions/ProvisionsContent";

export default function FTCProvisionsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: manifest, isLoading, error } = useProvisionsManifest();

  const selectedTopic = searchParams.get("topic");

  const handleTopicSelect = useCallback(
    (topicSlug: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "provisions");
      newParams.set("topic", topicSlug);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

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
        selectedTopic={selectedTopic}
        onSelectTopic={handleTopicSelect}
      />
      <div className="flex-1 min-w-0">
        {selectedTopic ? (
          <ProvisionsContent topic={selectedTopic} manifest={manifest} />
        ) : (
          <ProvisionsLanding manifest={manifest} />
        )}
      </div>
    </div>
  );
}
