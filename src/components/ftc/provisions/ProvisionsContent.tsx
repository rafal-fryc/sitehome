import { useEffect, useMemo, useRef, useState } from "react";
import { useProvisionShard } from "@/hooks/use-provisions";
import ProvisionCard from "@/components/ftc/provisions/ProvisionCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { ProvisionsManifest } from "@/types/ftc";

interface Props {
  topic: string;
  manifest: ProvisionsManifest;
}

const PAGE_SIZE = 50;

export default function ProvisionsContent({ topic, manifest }: Props) {
  const topicMeta = manifest.topics[topic];
  const { data: shard, isLoading, error } = useProvisionShard(topicMeta?.shard ?? null);
  const [page, setPage] = useState(1);

  // Reset page when topic changes
  const prevTopicRef = useRef(topic);
  useEffect(() => {
    if (prevTopicRef.current !== topic) {
      prevTopicRef.current = topic;
      setPage(1);
    }
  }, [topic]);

  // Sort by date descending (most recent first)
  const sorted = useMemo(() => {
    if (!shard) return [];
    return [...shard.provisions].sort(
      (a, b) => new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime()
    );
  }, [shard]);

  // Unique cases count
  const uniqueCases = useMemo(() => {
    if (!shard) return 0;
    return new Set(shard.provisions.map((p) => p.case_id)).size;
  }, [shard]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const startIdx = (page - 1) * PAGE_SIZE;
  const displayed = sorted.slice(startIdx, startIdx + PAGE_SIZE);

  if (!topicMeta) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground font-garamond">
          Topic not found. Please select a topic from the sidebar.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground font-garamond text-sm">
            Loading provisions...
          </p>
        </div>
      </div>
    );
  }

  if (error || !shard) {
    return (
      <div className="py-16 text-center">
        <p className="text-destructive font-garamond">
          Failed to load provisions. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Topic header */}
      <div className="mb-4">
        <h2 className="text-2xl font-garamond font-semibold text-primary">
          {topicMeta.label}
        </h2>
      </div>

      {/* Disclaimer banner */}
      <div className="border border-rule bg-cream/50 p-4 text-sm text-muted-foreground mb-6">
        <span className="font-semibold text-foreground">Note:</span> Provision
        text is extracted from consent order PDFs using automated processing and
        should be verified against the original source documents available on the
        FTC website.
      </div>

      {/* Provision count */}
      <p className="text-sm text-muted-foreground font-garamond mb-4">
        Showing {startIdx + 1}&ndash;{Math.min(startIdx + PAGE_SIZE, sorted.length)}{" "}
        of {sorted.length.toLocaleString()} provisions from{" "}
        {uniqueCases.toLocaleString()} cases
      </p>

      {/* Provision cards */}
      <div>
        {displayed.map((provision, idx) => (
          <ProvisionCard
            key={`${provision.case_id}__${provision.provision_number}__${idx}`}
            provision={provision}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6 mb-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {getPageNumbers(page, totalPages).map((pageNum, idx) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={page === pageNum}
                      onClick={() => setPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

/**
 * Generate page number array with ellipsis for pagination display.
 * Shows first, last, and neighbors of current page.
 */
function getPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  // Show neighbors
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  pages.push(total);

  return pages;
}
