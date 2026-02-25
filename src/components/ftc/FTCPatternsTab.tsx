import { usePatterns } from "@/hooks/use-patterns";
import PatternList from "@/components/ftc/patterns/PatternList";

export default function FTCPatternsTab() {
  const { data, isLoading, isError } = usePatterns();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-lg text-muted-foreground font-garamond">
          Loading patterns...
        </p>
      </div>
    );
  }

  if (isError || !data) {
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
          {data.total_patterns} recurring patterns across{" "}
          {data.total_variants.toLocaleString()} provision variants
        </p>
      </div>

      <PatternList patterns={data.patterns} />
    </div>
  );
}
