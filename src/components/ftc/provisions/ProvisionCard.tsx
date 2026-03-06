import { ExternalLink } from "lucide-react";
import type { DeduplicatedProvision, MergedCase } from "@/components/ftc/provisions/ProvisionsContent";
import HighlightText from "@/components/ftc/provisions/HighlightText";

interface Props {
  provision: DeduplicatedProvision;
  searchQuery?: string;
}

export default function ProvisionCard({ provision, searchQuery }: Props) {
  const displayText = provision.verbatim_text || provision.summary;
  const isFallback = !provision.verbatim_text && provision.summary;
  const mergedCases = provision.merged_cases;

  return (
    <article className="border border-rule bg-cream/30 mb-4">
      {/* Context header bar */}
      <header className="bg-primary/5 border-b border-rule px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {mergedCases ? (
          <MergedCaseHeader cases={mergedCases} />
        ) : (
          <>
            <span className="font-semibold text-primary font-garamond">
              {provision.company_name}
            </span>
            <span className="text-sm text-muted-foreground">
              {provision.year}
            </span>
            <span className="text-sm text-muted-foreground">
              {provision.docket_number}
            </span>
          </>
        )}
        <span className="text-sm font-medium text-gold-dark">
          Part {provision.provision_number}
        </span>
        {provision.violation_type && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide-label">
            {provision.violation_type}
          </span>
        )}
        {!mergedCases && provision.ftc_url && (
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

/** Render merged case names grouped by company, showing years. */
function MergedCaseHeader({ cases }: { cases: MergedCase[] }) {
  // Group by company_name, collect unique years
  const byCompany = new Map<string, { years: Set<number>; urls: string[] }>();
  for (const c of cases) {
    const existing = byCompany.get(c.company_name);
    if (existing) {
      existing.years.add(c.year);
      if (c.ftc_url) existing.urls.push(c.ftc_url);
    } else {
      byCompany.set(c.company_name, {
        years: new Set([c.year]),
        urls: c.ftc_url ? [c.ftc_url] : [],
      });
    }
  }

  const entries = [...byCompany.entries()];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {entries.map(([name, { years, urls }], idx) => {
        const sortedYears = [...years].sort();
        return (
          <span key={name} className="inline-flex items-center gap-1.5">
            <span className="font-semibold text-primary font-garamond">
              {name}
            </span>
            <span className="text-sm text-muted-foreground">
              ({sortedYears.join(", ")})
            </span>
            {urls.length > 0 && (
              <a
                href={urls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-dark"
                title="View on FTC.gov"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {idx < entries.length - 1 && (
              <span className="text-muted-foreground mx-0.5">&middot;</span>
            )}
          </span>
        );
      })}
      <span className="text-xs text-muted-foreground italic">
        ({cases.length} cases)
      </span>
    </div>
  );
}
