import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import type { ProvisionsManifest, ManifestTopic } from "@/types/ftc";

interface Props {
  manifest: ProvisionsManifest;
  selectedTopic: string | null;
  onSelectTopic: (topicSlug: string) => void;
}

interface TopicEntry {
  slug: string;
  topic: ManifestTopic;
}

const CATEGORY_ORDER: { key: ManifestTopic["category"]; heading: string }[] = [
  { key: "statutory", heading: "Statutory Authority" },
  { key: "practice_area", heading: "Practice Area" },
  { key: "remedy_type", heading: "Remedy Type" },
];

export default function TopicSidebar({
  manifest,
  selectedTopic,
  onSelectTopic,
}: Props) {
  const grouped = useMemo(() => {
    const groups: Record<string, TopicEntry[]> = {
      statutory: [],
      practice_area: [],
      remedy_type: [],
    };

    for (const [slug, topic] of Object.entries(manifest.topics)) {
      groups[topic.category]?.push({ slug, topic });
    }

    // Sort alphabetically within each group
    for (const entries of Object.values(groups)) {
      entries.sort((a, b) => a.topic.label.localeCompare(b.topic.label));
    }

    return groups;
  }, [manifest]);

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block sticky top-24 w-60 shrink-0 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="space-y-5 pr-2">
            {CATEGORY_ORDER.map(({ key, heading }) => (
              <div key={key}>
                <h3 className="text-xs uppercase tracking-wide-label text-muted-foreground font-semibold mb-2 px-3">
                  {heading}
                </h3>
                <ul className="space-y-0.5">
                  {grouped[key]?.map(({ slug, topic }) => (
                    <li key={slug}>
                      <button
                        onClick={() => onSelectTopic(slug)}
                        className={cn(
                          "flex w-full items-center justify-between text-sm font-garamond px-3 py-1.5 border-l-2 transition-colors text-left",
                          selectedTopic === slug
                            ? "border-l-gold text-primary font-semibold bg-gold/5"
                            : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-cream/50"
                        )}
                      >
                        <span className="truncate mr-2">{topic.label}</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 shrink-0"
                        >
                          {topic.count}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
      </nav>

      {/* Mobile/tablet horizontal bar */}
      <nav className="lg:hidden sticky top-0 z-10 bg-background border-b border-rule overflow-x-auto">
        <div className="px-4 py-2">
          {CATEGORY_ORDER.map(({ key, heading }) => (
            <div key={key} className="mb-2 last:mb-0">
              <p className="text-[10px] uppercase tracking-wide-label text-muted-foreground font-semibold mb-1">
                {heading}
              </p>
              <div className="flex gap-2 min-w-max">
                {grouped[key]?.map(({ slug, topic }) => (
                  <button
                    key={slug}
                    onClick={() => onSelectTopic(slug)}
                    className={cn(
                      "text-xs font-garamond whitespace-nowrap px-2 py-1 border border-rule rounded-sm transition-colors",
                      selectedTopic === slug
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-cream/50"
                    )}
                  >
                    {topic.label}{" "}
                    <span className="opacity-70">({topic.count})</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
