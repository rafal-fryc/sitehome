import { useQuery } from "@tanstack/react-query";

export function useCaseFile(caseId: string | null) {
  return useQuery({
    queryKey: ["case-file", caseId],
    queryFn: async () => {
      const res = await fetch(`/data/ftc-files/${caseId}.json`);
      if (!res.ok) throw new Error("Failed to load case file");
      return res.json();
    },
    enabled: !!caseId,
    staleTime: Infinity,
  });
}
