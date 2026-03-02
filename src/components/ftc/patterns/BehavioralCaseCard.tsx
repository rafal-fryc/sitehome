import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BehavioralCase } from "@/types/ftc";

interface Props {
  caseData: BehavioralCase;
  onToggle: () => void;
}

export default function BehavioralCaseCard({ caseData, onToggle }: Props) {
  return (
    <div className="p-4 bg-cream border border-rule">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        <span className="font-semibold text-primary font-garamond">
          {caseData.company_name}
        </span>
        <span className="text-sm text-muted-foreground">
          {caseData.date_issued}
        </span>
        <span className="text-sm text-muted-foreground">
          {caseData.docket_number}
        </span>
        {caseData.ftc_url && (
          <a
            href={caseData.ftc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold hover:text-gold-dark ml-auto inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Takeaway text */}
      <p className="font-garamond text-foreground leading-relaxed">
        {caseData.takeaway_brief}
      </p>

      {/* Footer: topic badges + view provisions */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {caseData.statutory_topics.map((topic) => (
          <Badge
            key={topic}
            variant="secondary"
            className="bg-muted text-muted-foreground text-xs"
          >
            {topic}
          </Badge>
        ))}
        <button
          onClick={onToggle}
          className="ml-auto text-sm text-gold hover:text-gold-dark font-medium font-garamond"
        >
          View action
        </button>
      </div>
    </div>
  );
}
