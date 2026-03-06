import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { PatternVariant } from "@/types/ftc";

interface Props {
  variant: PatternVariant;
}

export default function VariantCard({ variant }: Props) {
  const [showFull, setShowFull] = useState(false);

  const hasVerbatim = !!variant.verbatim_text;
  const hasLongText =
    hasVerbatim && variant.verbatim_text.length > variant.text_preview.length;

  const displayText = showFull
    ? variant.verbatim_text
    : variant.text_preview || variant.verbatim_text;

  return (
    <div className="p-4 bg-cream border border-rule mt-2">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
        <span className="font-semibold text-primary font-garamond">
          {variant.company_name}
        </span>
        <span className="text-sm text-muted-foreground">{variant.year}</span>
        <span className="text-sm text-muted-foreground">
          {variant.docket_number}
        </span>
        {variant.ftc_url && (
          <a
            href={variant.ftc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold hover:text-gold-dark ml-auto inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Text area */}
      <div className="font-garamond text-foreground leading-relaxed">
        <div className="whitespace-pre-line">
          {displayText}
          {!hasVerbatim && (
            <span className="text-xs text-muted-foreground italic ml-1">
              (preview only)
            </span>
          )}
        </div>
      </div>

      {/* Toggle buttons */}
      {hasLongText && (
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => setShowFull(!showFull)}
            className="text-xs text-gold hover:text-gold-dark font-medium"
          >
            {showFull ? "Show less" : "Show full text"}
          </button>
        </div>
      )}
    </div>
  );
}
