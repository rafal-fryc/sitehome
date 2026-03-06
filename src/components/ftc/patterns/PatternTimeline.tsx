import { useState } from "react";
import type { PatternVariant } from "@/types/ftc";
import VariantCard from "@/components/ftc/patterns/VariantCard";

interface Props {
  variants: PatternVariant[];
}

const INITIAL_DISPLAY_COUNT = 15;

export default function PatternTimeline({ variants }: Props) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...variants].sort(
    (a, b) => new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime()
  );

  const displayedVariants =
    !showAll && sorted.length > INITIAL_DISPLAY_COUNT
      ? sorted.slice(0, INITIAL_DISPLAY_COUNT)
      : sorted;

  return (
    <div className="relative pl-8 border-l-2 border-rule ml-4 py-4">
      {displayedVariants.map((variant) => (
        <div
          key={`${variant.case_id}__${variant.provision_number}`}
          className="relative mb-6"
        >
          {/* Timeline dot */}
          <div className="absolute -left-[calc(2rem+5px)] top-1 w-3 h-3 rounded-full bg-gold border-2 border-cream" />
          {/* Year label */}
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            {variant.year}
          </span>
          <VariantCard variant={variant} />
        </div>
      ))}
      {!showAll && variants.length > INITIAL_DISPLAY_COUNT && (
        <button
          onClick={() => setShowAll(true)}
          className="ml-2 text-sm text-gold hover:text-gold-dark font-medium font-garamond"
        >
          Show all {variants.length} variants
        </button>
      )}
    </div>
  );
}
