import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface Props {
  provision: {
    provision_number: string;
    title: string;
    summary: string;
    remedy_types: string[];
    requirements: Array<{ quoted_text: string }>;
  };
}

export default function ProvisionRow({ provision }: Props) {
  const verbatimText = (provision.requirements || [])
    .map((r) => r.quoted_text || "")
    .filter(Boolean)
    .join("\n\n");

  const displayText = verbatimText || provision.summary;

  const badges = provision.remedy_types ?? [];
  const visibleBadges = badges.slice(0, 2);
  const overflowCount = badges.length - 2;

  return (
    <Collapsible className="border-b border-rule/50 last:border-b-0">
      <CollapsibleTrigger className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/50 rounded-sm transition-colors [&[data-state=open]>svg]:rotate-180">
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        <span className="font-garamond font-semibold truncate">
          {provision.title}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Part {provision.provision_number}
        </span>
        {visibleBadges.map((r) => (
          <Badge
            key={r}
            variant="outline"
            className="text-xs whitespace-nowrap"
          >
            {r}
          </Badge>
        ))}
        {overflowCount > 0 && (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            +{overflowCount}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        {displayText && (
          <div className="font-garamond whitespace-pre-line text-sm leading-relaxed text-foreground/90 mt-2 pl-6">
            {displayText}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
