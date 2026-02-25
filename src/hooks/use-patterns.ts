import { useQuery } from "@tanstack/react-query";
import type { PatternsFile } from "@/types/ftc";

export function usePatterns() {
  return useQuery<PatternsFile>({
    queryKey: ["ftc-patterns"],
    queryFn: async () => {
      const res = await fetch("/data/ftc-patterns.json");
      if (!res.ok) throw new Error("Failed to load patterns data");
      return res.json();
    },
    staleTime: Infinity,
  });
}
