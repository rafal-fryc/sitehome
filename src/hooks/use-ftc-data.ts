import { useQuery } from "@tanstack/react-query";
import type { FTCDataPayload } from "@/types/ftc";

export function useFTCData() {
  return useQuery<FTCDataPayload>({
    queryKey: ["ftc-data"],
    queryFn: async () => {
      const res = await fetch("/data/ftc-cases.json");
      if (!res.ok) throw new Error("Failed to load FTC data");
      return res.json();
    },
    staleTime: Infinity,
  });
}
