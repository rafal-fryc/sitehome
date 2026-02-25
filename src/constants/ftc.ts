import type { RemedyType } from "@/types/ftc";

export const DATE_PRESETS = [
  { label: "Last 5 years", start: "2021-01-01", end: "2026-12-31" },
  { label: "Obama era", start: "2009-01-20", end: "2017-01-20" },
  { label: "Trump era", start: "2017-01-20", end: "2021-01-20" },
  { label: "Biden era", start: "2021-01-20", end: "2025-01-20" },
] as const;

export const REMEDY_TYPE_OPTIONS: RemedyType[] = [
  "Monetary Penalty",
  "Data Deletion",
  "Comprehensive Security Program",
  "Third-Party Assessment",
  "Algorithmic Destruction",
  "Biometric Ban",
  "Compliance Monitoring",
  "Recordkeeping",
  "Prohibition",
  "Other",
];

export const ADMINISTRATIONS: { label: string; start: string; end: string }[] = [
  { label: "Clinton", start: "1993-01-20", end: "2001-01-20" },
  { label: "G.W. Bush", start: "2001-01-20", end: "2009-01-20" },
  { label: "Obama", start: "2009-01-20", end: "2017-01-20" },
  { label: "Trump (1st)", start: "2017-01-20", end: "2021-01-20" },
  { label: "Biden", start: "2021-01-20", end: "2025-01-20" },
  { label: "Trump (2nd)", start: "2025-01-20", end: "2029-01-20" },
];

export function getAdministration(dateStr: string): string {
  for (const admin of ADMINISTRATIONS) {
    if (dateStr >= admin.start && dateStr < admin.end) return admin.label;
  }
  return "Unknown";
}

export interface CategoryRule {
  label: string;
  keywords: string[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    label: "COPPA / Children's Privacy",
    keywords: ["coppa", "children's online privacy", "child-directed", "children's privacy", "child's personal information"],
  },
  {
    label: "Data Security",
    keywords: ["data security", "security breach", "safeguards", "information security", "security practices", "unauthorized access", "security program"],
  },
  {
    label: "Privacy / Deceptive Privacy Practices",
    keywords: ["privacy", "privacy policy", "deceptive privacy", "privacy misrepresentation", "personal information", "tracking"],
  },
  {
    label: "Health Data",
    keywords: ["health data", "medical", "health breach", "health information", "hipaa", "reproductive"],
  },
  {
    label: "Location / Geolocation Data",
    keywords: ["location data", "geolocation", "geofenc", "precise location", "gps"],
  },
  {
    label: "Fair Credit Reporting (FCRA)",
    keywords: ["fair credit reporting", "fcra", "consumer report", "credit report", "background check"],
  },
  {
    label: "Gramm-Leach-Bliley",
    keywords: ["gramm-leach-bliley", "glba", "financial privacy", "safeguards rule"],
  },
  {
    label: "AI / Algorithmic / Facial Recognition",
    keywords: ["algorithm", "artificial intelligence", "facial recognition", "biometric", "machine learning", "automated", "ai-powered"],
  },
  {
    label: "Telemarketing / Do-Not-Call",
    keywords: ["telemarketing", "do-not-call", "robocall", "telephone", "tsr"],
  },
];

export function classifyCategories(countTitles: string[], legalAuthority: string, factualBackground: string): string[] {
  const searchText = [...countTitles, legalAuthority, factualBackground].join(" ").toLowerCase();
  const matched: string[] = [];
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => searchText.includes(kw))) {
      matched.push(rule.label);
    }
  }
  return matched.length > 0 ? matched : ["Other"];
}
