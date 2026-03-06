import { Info } from "lucide-react";

const MISSING_CASE_NAMES = [
  "ByteDance, LTD., US v.",
  "Directors Desk LL",
  "Experian Information Solutions, Inc.",
  "GeoCities",
  "Hershey Foods Corporation",
  "Mrs. Fields Famous Brands, Inc. et al.",
  "The Ohio Art Company",
  "Altmeyer Home Stores, Inc.",
  "Rapp, James J. d/b/a Touch Tone Information",
  "Rennert, Sandra L., et al.",
  "Toysmart.com, LLC",
  "Trans Union Corporation (1998)",
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
  "Illuminate Education, Inc.",
  "Cash Today, Ltd.",
  "Asset Acceptance, LLC",
  "American United Mortgage Company",
  "Rite Aid Corporation (2010)",
];

export default function FTCMissingCasesNotice() {
  return (
    <div className="border border-rule bg-cream/50 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          The following {MISSING_CASE_NAMES.length} cases could not be parsed
          due to unavailable or incomplete documents:{" "}
          {MISSING_CASE_NAMES.join(", ")}. Additionally, pending cases may
          have incomplete data and are not included until fully resolved.
        </p>
      </div>
    </div>
  );
}
