import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFTCData } from "@/hooks/use-ftc-data";
import FTCAnalyticsTab from "@/components/ftc/FTCAnalyticsTab";
import FTCProvisionsTab from "@/components/ftc/FTCProvisionsTab";
import FTCPatternsTab from "@/components/ftc/FTCPatternsTab";

type FTCTab = "analytics" | "provisions" | "patterns";

const VALID_TABS: FTCTab[] = ["analytics", "provisions", "patterns"];

export default function FTCTabShell() {
  const { data, isLoading, error } = useFTCData();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") as FTCTab | null;
  const activeTab: FTCTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "analytics";

  const handleTabChange = useCallback(
    (value: string) => {
      // Clear ALL tab-specific params (mode, group) when switching tabs
      const newParams = new URLSearchParams();
      if (value !== "analytics") {
        newParams.set("tab", value);
      }
      // Default tab (analytics) keeps URL clean — no tab param
      setSearchParams(newParams, { replace: true });
    },
    [setSearchParams]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading enforcement data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-destructive">
          Failed to load data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 pt-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="provisions">Provisions Library</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <FTCAnalyticsTab data={data} />
        </TabsContent>

        <TabsContent value="provisions">
          <FTCProvisionsTab />
        </TabsContent>

        <TabsContent value="patterns">
          <FTCPatternsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
