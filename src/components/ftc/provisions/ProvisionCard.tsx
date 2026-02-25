import { ExternalLink } from "lucide-react";
import type { ProvisionRecord } from "@/types/ftc";
import HighlightText from "@/components/ftc/provisions/HighlightText";

interface Props {
  provision: ProvisionRecord;
  searchQuery?: string;
}

export default function ProvisionCard({ provision, searchQuery }: Props) {
  const displayText = provision.verbatim_text || provision.summary;
  const isFallback = !provision.verbatim_text && provision.summary;

  return (
    <article className="border border-rule bg-cream/30 mb-4">
      {/* Context header bar */}
      <header className="bg-primary/5 border-b border-rule px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-primary font-garamond">
          {provision.company_name}
        </span>
        <span className="text-sm text-muted-foreground">
          {provision.year}
        </span>
        <span className="text-sm text-muted-foreground">
          {provision.docket_number}
        </span>
        <span className="text-sm font-medium text-gold-dark">
          Part {provision.provision_number}
        </span>
        {provision.violation_type && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide-label">
            {provision.violation_type}
          </span>
        )}
        {provision.ftc_url && (
          <a
            href={provision.ftc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold hover:text-gold-dark ml-auto inline-flex items-center gap-1"
          >
            View on FTC.gov
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </header>

      {/* Provision text */}
      <div className="px-4 py-4 font-garamond text-foreground leading-relaxed">
        <h4 className="font-semibold mb-2">
          <HighlightText text={provision.title} query={searchQuery} />
        </h4>
        {isFallback && (
          <span className="text-xs text-muted-foreground italic mb-1 block">
            (summary)
          </span>
        )}
        <div className="whitespace-pre-line">
          <HighlightText text={displayText} query={searchQuery} />
        </div>
      </div>
    </article>
  );
}
