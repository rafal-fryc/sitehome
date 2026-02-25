import { ExternalLink } from "lucide-react";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";

interface Props {
  caseData: EnhancedFTCCaseSummary;
  onViewProvisions: () => void;
}

export default function CaseCard({ caseData, onViewProvisions }: Props) {
  const provisionCount = caseData.num_provisions;

  return (
    <article className="border border-rule bg-cream/30 px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold text-primary font-garamond truncate">
            {caseData.company_name}
          </span>
          <span className="text-sm text-muted-foreground">{caseData.year}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide-label">
            {caseData.violation_type}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {provisionCount} provision{provisionCount !== 1 ? "s" : ""}
        </div>
      </div>
      <button
        onClick={onViewProvisions}
        className="text-sm text-gold hover:text-gold/80 font-garamond inline-flex items-center gap-1 shrink-0"
      >
        View provisions
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
