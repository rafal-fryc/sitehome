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

// Phase 1: Data Pipeline — Classification taxonomy types

export type StatutoryTopic =
  | "COPPA"
  | "FCRA"
  | "GLBA"
  | "Health Breach Notification"
  | "CAN-SPAM"
  | "TCPA"
  | "TSR"
  | "Section 5 Only";

export type PracticeArea =
  | "Privacy"
  | "Data Security"
  | "Deceptive Design / Dark Patterns"
  | "AI / Automated Decision-Making"
  | "Surveillance"
  | "Financial Practices"
  | "Telemarketing"
  | "Other";

export type RemedyType =
  | "Monetary Penalty"
  | "Data Deletion"
  | "Comprehensive Security Program"
  | "Third-Party Assessment"
  | "Algorithmic Destruction"
  | "Biometric Ban"
  | "Compliance Monitoring"
  | "Recordkeeping"
  | "Prohibition"
  | "Other";

export type IndustrySector =
  | "Technology"
  | "Healthcare"
  | "Financial Services"
  | "Retail"
  | "Telecom"
  | "Education"
  | "Social Media"
  | "Other";

// Phase 1: Data Pipeline — Classification interfaces

// Written into public/data/ftc-files/ source JSON by classify-provisions.ts
export interface ClassifiedProvision {
  provision_number: string;
  title: string;
  category: string;
  summary: string;
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  remedy_types: RemedyType[];
}

// Extends case_info in source files with classification tags
export interface ClassifiedCaseInfo {
  id: string;
  docket_number: string;
  company_name: string;
  date_issued: string;
  year: number;
  administration: string;
  legal_authority: string;
  ftc_url?: string;
  source_filename: string;
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  industry_sectors: IndustrySector[];
}

// Denormalized provision in topic-sharded output files under public/data/provisions/
export interface ProvisionRecord {
  provision_number: string;
  title: string;
  category: string;
  summary: string;
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  remedy_types: RemedyType[];
  case_id: string;
  company_name: string;
  date_issued: string;
  year: number;
  administration: string;
  legal_authority: string;
  ftc_url?: string;
  docket_number: string;
}

// public/data/provisions/[topic]-provisions.json
export interface ProvisionShardFile {
  topic: string;
  generated_at: string;
  total_provisions: number;
  provisions: ProvisionRecord[];
}

// Enhanced case summary in ftc-cases.json — keeps categories for backward compat
export interface EnhancedFTCCaseSummary extends FTCCaseSummary {
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  industry_sectors: IndustrySector[];
  remedy_types: RemedyType[];
  provision_counts_by_topic: Record<string, number>;
}
