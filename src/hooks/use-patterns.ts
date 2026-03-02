import { useQuery } from "@tanstack/react-query";
import type { PatternsFile, BehavioralPatternsFile } from "@/types/ftc";

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

export function useBehavioralPatterns() {
  return useQuery<BehavioralPatternsFile>({
    queryKey: ["ftc-behavioral-patterns"],
    queryFn: async () => {
      const res = await fetch("/data/ftc-behavioral-patterns.json");
      if (!res.ok) throw new Error("Failed to load behavioral patterns data");
      return res.json();
    },
    staleTime: Infinity,
  });
}
