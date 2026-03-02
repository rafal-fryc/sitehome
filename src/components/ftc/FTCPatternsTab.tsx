import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePatterns, useBehavioralPatterns } from "@/hooks/use-patterns";
import PatternList from "@/components/ftc/patterns/PatternList";
import BehavioralPatternList from "@/components/ftc/patterns/BehavioralPatternList";

type PatternsView = "behavioral" | "remedy";

export default function FTCPatternsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: remedyData, isLoading: remedyLoading, isError: remedyError } = usePatterns();
  const { data: behavioralData, isLoading: behavioralLoading, isError: behavioralError } = useBehavioralPatterns();

  // Sub-tab state from URL — default to "behavioral"
  const viewParam = searchParams.get("view") as PatternsView | null;
  const activeView: PatternsView =
    viewParam === "remedy" ? "remedy" : "behavioral";

  const handleViewChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === "behavioral") {
        newParams.delete("view");
      } else {
        newParams.set("view", value);
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const isLoading = remedyLoading || behavioralLoading;
  const isError = remedyError || behavioralError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground font-garamond">
            Loading patterns...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !remedyData || !behavioralData) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-muted-foreground font-garamond">
          Failed to load patterns data.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-garamond font-semibold text-primary mb-1">
          Cross-Case Patterns
        </h2>
        <p className="text-sm text-muted-foreground font-garamond">
          {behavioralData.total_patterns} behavioral patterns &middot;{" "}
          {remedyData.total_patterns} remedy patterns across{" "}
          {remedyData.total_variants.toLocaleString()} provision variants
        </p>
      </div>

      <Tabs value={activeView} onValueChange={handleViewChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="behavioral">Behavioral Patterns</TabsTrigger>
          <TabsTrigger value="remedy">Remedy Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="behavioral">
          <BehavioralPatternList patterns={behavioralData.patterns} />
        </TabsContent>

        <TabsContent value="remedy">
          <PatternList patterns={remedyData.patterns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
