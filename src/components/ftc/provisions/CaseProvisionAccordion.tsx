import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCaseFile } from "@/hooks/use-case-file";
import ProvisionRow from "@/components/ftc/industry/ProvisionRow";

interface Props {
  caseId: string;
  ftcUrl?: string;
}

interface Provision {
  provision_number: string;
  title: string;
  summary: string;
  statutory_topics: string[];
  remedy_types: string[];
  requirements: Array<{ quoted_text: string }>;
}

function groupByTopic(provisions: Provision[]): Map<string, Provision[]> {
  const groups = new Map<string, Provision[]>();
  for (const prov of provisions) {
    const topics = prov.statutory_topics ?? [];
    if (topics.length === 0) {
      const key = "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(prov);
    } else {
      for (const topic of topics) {
        if (!groups.has(topic)) groups.set(topic, []);
        groups.get(topic)!.push(prov);
      }
    }
  }
  return groups;
}

export default function CaseProvisionAccordion({ caseId, ftcUrl }: Props) {
  const { data, isLoading, isError } = useCaseFile(caseId);

  const provisions: Provision[] = data?.order?.provisions ?? [];
  const grouped = useMemo(() => groupByTopic(provisions), [provisions]);

  if (isLoading) {
    return (
      <div className="border border-rule border-t-0 bg-cream/20 px-4 py-3">
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-3 py-3 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-rule border-t-0 bg-cream/20 px-4 py-3">
        <p className="text-sm text-muted-foreground font-garamond text-center py-4">
          Unable to load provisions for this case.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-rule border-t-0 bg-cream/20 px-4 py-3">
      {/* FTC.gov link */}
      {ftcUrl && (
        <div className="mb-3">
          <a
            href={ftcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold hover:text-gold/80 inline-flex items-center gap-1 font-garamond"
          >
            View on FTC.gov
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Takeaway */}
      {data?.takeaway_full && (
        <div className="mb-4 border border-rule/50 bg-cream/40 px-3 py-2.5 rounded-sm">
          <p className="text-sm text-foreground font-garamond leading-relaxed">
            {data.takeaway_full}
          </p>
          <p className="text-xs text-muted-foreground italic font-garamond mt-1">
            AI-generated from structured case data
          </p>
        </div>
      )}

      {/* Provisions grouped by topic */}
      {Array.from(grouped.entries()).map(([topic, topicProvisions]) => (
        <div key={topic} className="mb-2 last:mb-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-rule">
            <h3 className="text-sm font-semibold font-garamond text-primary uppercase tracking-wide-label">
              {topic}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {topicProvisions.length}
            </Badge>
          </div>
          {topicProvisions.map((prov) => (
            <ProvisionRow
              key={`${topic}-${prov.provision_number}`}
              provision={prov}
            />
          ))}
        </div>
      ))}

      {provisions.length === 0 && (
        <p className="text-sm text-muted-foreground font-garamond text-center py-4">
          No classified provisions available for this case.
        </p>
      )}
    </div>
  );
}
