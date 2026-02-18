export type GroupingMode = "year" | "administration" | "category";

export interface FTCCaseSummary {
  id: string;
  docket_number: string;
  company_name: string;
  date_issued: string;
  year: number;
  administration: string;
  categories: string[];
  violation_type: "deceptive" | "unfair" | "both";
  complaint_counts: string[];
  legal_authority: string;
  commissioners: string[];
  ftc_url?: string;
  source_filename: string;
  num_provisions: number;
  num_requirements: number;
  order_duration_years: number | null;
}

export interface GroupStats {
  key: string;
  label: string;
  count: number;
  violation_breakdown: { deceptive: number; unfair: number; both: number };
  top_categories?: string[];
  top_companies?: string[];
}

export interface FTCDataPayload {
  generated_at: string;
  total_cases: number;
  cases: FTCCaseSummary[];
  groupings: {
    by_year: GroupStats[];
    by_administration: GroupStats[];
    by_category: GroupStats[];
  };
  analysis: Record<string, Record<string, { title: string; summary: string; narrative: string }>>;
}
