import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";
import { getSectorBySlug } from "@/components/ftc/industry/industry-utils";
import SectorPatternCharts from "@/components/ftc/industry/SectorPatternCharts";
import CaseCardList from "@/components/ftc/industry/CaseCardList";

interface Props {
  sectorSlug: string;
  cases: EnhancedFTCCaseSummary[];
  onBack: () => void;
  onViewProvisions: (caseData: EnhancedFTCCaseSummary) => void;
}

export default function SectorDetail({
  sectorSlug,
  cases,
  onBack,
  onViewProvisions,
}: Props) {
  const sector = getSectorBySlug(sectorSlug);

  if (!sector) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground font-garamond">
          Sector not found. Please return to the industry grid.
        </p>
        <button
          onClick={onBack}
          className="mt-4 text-sm text-gold hover:text-gold/80 font-garamond"
        >
          Back to Industries
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer font-garamond"
                onClick={onBack}
              >
                Industries
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-garamond">
                {sector.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Sector header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-garamond font-semibold text-primary">
            {sector.label}
          </h2>
          <Badge variant="secondary">
            {cases.length} enforcement action{cases.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground font-garamond mt-1">
          Some cases appear in multiple sectors and are counted in each.
        </p>
      </div>

      {/* Pattern charts */}
      <SectorPatternCharts cases={cases} sectorLabel={sector.label} />

      {/* Divider */}
      <div className="border-t border-rule my-8" />

      {/* Case card list */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-primary font-garamond">
          Enforcement Actions
        </h3>
        <CaseCardList cases={cases} onViewProvisions={onViewProvisions} />
      </div>
    </div>
  );
}
