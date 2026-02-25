import { useQuery } from "@tanstack/react-query";
import type { ProvisionsManifest, ProvisionShardFile } from "@/types/ftc";

export function useProvisionsManifest() {
  return useQuery<ProvisionsManifest>({
    queryKey: ["provisions-manifest"],
    queryFn: async () => {
      const res = await fetch("/data/provisions/manifest.json");
      if (!res.ok) throw new Error("Failed to load provisions manifest");
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useProvisionShard(shardFilename: string | null) {
  return useQuery<ProvisionShardFile>({
    queryKey: ["provisions", shardFilename],
    queryFn: async () => {
      const res = await fetch(`/data/provisions/${shardFilename}`);
      if (!res.ok) throw new Error("Failed to load provisions");
      return res.json();
    },
    enabled: !!shardFilename,
    staleTime: Infinity,
  });
}
