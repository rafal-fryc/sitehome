import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useCaseFile } from "@/hooks/use-case-file";
import ProvisionRow from "./ProvisionRow";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";

interface CaseProvisionsSheetProps {
  caseData: EnhancedFTCCaseSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CaseProvisionsSheet({
  caseData,
  open,
  onOpenChange,
}: CaseProvisionsSheetProps) {
  const { data, isLoading, isError } = useCaseFile(
    open ? (caseData?.id ?? null) : null
  );

  const provisions: Provision[] = data?.order?.provisions ?? [];

  const grouped = useMemo(() => groupByTopic(provisions), [provisions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[50vw] sm:max-w-2xl flex flex-col h-full"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="font-garamond">
            {caseData?.company_name}
          </SheetTitle>
          <SheetDescription className="font-garamond">
            <span>{caseData?.year}</span>
            <span className="mx-1.5">|</span>
            <span>{capitalize(caseData?.violation_type ?? "")}</span>
            <span className="mx-1.5">|</span>
            <span>
              {caseData?.num_provisions} provision
              {caseData?.num_provisions !== 1 ? "s" : ""}
            </span>
            {caseData?.ftc_url && (
              <>
                <span className="mx-1.5">|</span>
                <a
                  href={caseData.ftc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-gold/80 inline-flex items-center gap-1"
                >
                  View on FTC.gov
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="border-t border-rule mt-4" />

        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-3 py-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground font-garamond">
                Unable to load provisions for this case.
              </p>
            </div>
          )}

          {!isLoading && !isError && data && (
            <div>
              {Array.from(grouped.entries()).map(([topic, topicProvisions]) => (
                <div key={topic}>
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
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
