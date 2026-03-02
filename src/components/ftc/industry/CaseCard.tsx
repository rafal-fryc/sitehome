import type { EnhancedFTCCaseSummary } from "@/types/ftc";
import { Badge } from "@/components/ui/badge";

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
        {caseData.takeaway_brief ? (
          <div className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1.5">
            <span className="font-garamond leading-snug line-clamp-2">{caseData.takeaway_brief}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal text-muted-foreground/60 shrink-0 mt-0.5">
              AI-generated
            </Badge>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mt-0.5">
            {provisionCount} provision{provisionCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <button
        onClick={onViewProvisions}
        className="text-sm text-gold hover:text-gold/80 font-garamond shrink-0"
      >
        View provisions
      </button>
    </article>
  );
}
