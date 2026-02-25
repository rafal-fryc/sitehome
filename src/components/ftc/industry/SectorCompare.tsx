import { useMemo } from "react";
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
import type { SectorStats } from "@/components/ftc/FTCIndustryTab";

interface Props {
  sectorSlugs: string[];
  sectorStats: Record<string, SectorStats>;
  onBack: () => void;
}

function getTopCompanies(
  cases: EnhancedFTCCaseSummary[],
  limit: number
): { name: string; provisions: number }[] {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const provisions = c.num_provisions ?? 0;
    counts[c.company_name] = (counts[c.company_name] || 0) + provisions;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, provisions]) => ({ name, provisions }));
}

export default function SectorCompare({
  sectorSlugs,
  sectorStats,
  onBack,
}: Props) {
  const validSectors = useMemo(() => {
    return sectorSlugs
      .map((slug) => {
        const def = getSectorBySlug(slug);
        if (!def) return null;
        const stats = sectorStats[def.label];
        return { slug, def, cases: stats?.cases ?? [] };
      })
      .filter(
        (
          s
        ): s is {
          slug: string;
          def: NonNullable<ReturnType<typeof getSectorBySlug>>;
          cases: EnhancedFTCCaseSummary[];
        } => s !== null
      );
  }, [sectorSlugs, sectorStats]);

  if (validSectors.length < 2) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground font-garamond">
          Select at least 2 sectors to compare.
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
                Compare
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-garamond font-semibold text-primary">
          Sector Comparison
        </h2>
        <p className="text-sm text-muted-foreground font-garamond mt-1">
          Some cases appear in multiple sectors and are counted in each.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {validSectors.map((s) => (
            <Badge key={s.slug} variant="secondary">
              {s.def.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Multi-column comparison grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {validSectors.map((s) => {
          const topCompanies = getTopCompanies(s.cases, 5);

          return (
            <div
              key={s.slug}
              className="border border-rule p-4 bg-cream/20"
            >
              {/* Column header */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-garamond text-lg font-semibold text-primary">
                  {s.def.label}
                </h3>
                <Badge variant="secondary">
                  {s.cases.length} case{s.cases.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Pattern charts */}
              <SectorPatternCharts
                cases={s.cases}
                sectorLabel={s.def.label}
              />

              {/* Top 5 companies */}
              {topCompanies.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-primary/80 font-garamond mb-2">
                    Top Companies by Provisions
                  </h4>
                  <ol className="space-y-1 text-sm font-garamond list-decimal list-inside">
                    {topCompanies.map((company, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="text-foreground">
                          {company.name}
                        </span>{" "}
                        <span className="text-xs tabular-nums">
                          ({company.provisions} provisions)
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
