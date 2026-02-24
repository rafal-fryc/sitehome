import { useState } from "react";
import { Info, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const MISSING_CASES = [
  { name: "ByteDance, LTD., US v.", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/bytedance-ltd-us-v" },
  { name: "Directors Desk LL", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/0923140-directors-desk-ll" },
  { name: "Experian Information Solutions, Inc.", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/experian-information-solutions-inc" },
  { name: "GeoCities", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/982-3015-geocities" },
  { name: "Hershey Foods Corporation", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/hershey-foods-corporation-us-ftc" },
  { name: "Mrs. Fields Famous Brands, Inc. et al.", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/mrs-fields-famous-brands-inc-mrs-fields-holding-company-inc-mrs-fields-original-cookies-inc-us-ftc" },
  { name: "The Ohio Art Company", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/022-3028-ohio-art-company" },
  { name: "Altmeyer Home Stores, Inc.", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/962-3063-altmeyer-home-stores-inc-matter" },
  { name: "Rapp, James J. d/b/a Touch Tone Information", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/rapp-james-j-regana-l-rapp-dba-touch-tone-information-inc" },
  { name: "Rennert, Sandra L., et al.", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/992-3245-rennert-sandra-l-et-al" },
  { name: "Toysmart.com, LLC", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/x000075-toysmartcom-llc-toysmartcom-inc" },
  { name: "Trans Union Corporation (1998)", url: "https://www.ftc.gov/legal-library/browse/cases-proceedings/trans-union-corporation-matter" },
];

const COMPLAINT_ONLY = [
  "Far West Credit, Inc.",
  "Bonzi Software",
  "First Advantage SafeRent, Inc., et al.",
  "Hill, Zachary Keith",
  "ValueClick, Inc., Hi-Speed Media, Inc., and E-Babylon, Inc.",
  "Credit Bureau Collection Services",
  "Eli Lilly And Company",
  "NCO Group",
  "77 Investigations, Inc. and Reginald Kimbro",
  "Corporate Marketing Solutions",
  "Imperial Palace, Inc., et al.",
  "Kochava (Pending)",
  "AT&T",
  "Sprint Corporation",
  "Iconic Hearts Holdings (Pending)",
];

export default function FTCMissingCasesNotice() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-rule bg-cream/50 p-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Data Coverage Note:</span> The FTC
            lists 327 privacy and data-security enforcement actions. This dataset
            includes 285 fully analyzed cases. 27 cases could not be included
            because the underlying complaint and/or order documents were
            unavailable from the FTC's public record at the time of collection.
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <>
                Hide details <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                View missing cases <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Completely Missing ({MISSING_CASES.length} cases)
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  No complaint or order PDFs available on the FTC website.
                </p>
                <ul className="space-y-1">
                  {MISSING_CASES.map((c) => (
                    <li key={c.name} className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">&mdash;</span>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {c.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Complaint Only ({COMPLAINT_ONLY.length} cases)
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Complaint PDF available but no matching order document — these
                  cases may be pending or settled without a published order.
                </p>
                <ul className="space-y-1">
                  {COMPLAINT_ONLY.map((name) => (
                    <li key={name} className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">&mdash;</span>
                      <span className="text-foreground">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
