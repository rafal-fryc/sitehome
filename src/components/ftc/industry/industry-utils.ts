import type { EnhancedFTCCaseSummary } from "@/types/ftc";

export interface SubsectorDefinition {
  label: string;
  keywords: string[];
}

export interface SectorDefinition {
  slug: string;
  label: string;
  icon?: string;
  subsectors: SubsectorDefinition[];
}

export const SECTOR_TAXONOMY: SectorDefinition[] = [
  {
    slug: "technology",
    label: "Technology",
    subsectors: [
      {
        label: "Software & Apps",
        keywords: ["software", "app", "mobile app", "platform"],
      },
      {
        label: "IoT & Connected Devices",
        keywords: ["iot", "connected", "smart", "wearable", "device"],
      },
      {
        label: "Ad Tech & Tracking",
        keywords: [
          "advertising",
          "ad tech",
          "tracking",
          "analytics",
          "data broker",
        ],
      },
      {
        label: "Cloud Services",
        keywords: ["cloud", "hosting", "saas"],
      },
      {
        label: "General Technology",
        keywords: [],
      },
    ],
  },
  {
    slug: "financial-services",
    label: "Financial Services",
    subsectors: [
      {
        label: "Banking & Lending",
        keywords: ["bank", "lending", "loan", "mortgage"],
      },
      {
        label: "Credit Reporting",
        keywords: ["credit report", "credit bureau", "credit score"],
      },
      {
        label: "Insurance",
        keywords: ["insurance"],
      },
      {
        label: "Payment Processing",
        keywords: ["payment", "fintech"],
      },
      {
        label: "General Financial Services",
        keywords: [],
      },
    ],
  },
  {
    slug: "retail",
    label: "Retail",
    subsectors: [
      {
        label: "E-Commerce",
        keywords: [
          "e-commerce",
          "ecommerce",
          "online retail",
          "online store",
          "marketplace",
        ],
      },
      {
        label: "Brick-and-Mortar",
        keywords: ["store", "retail chain", "retailer"],
      },
      {
        label: "General Retail",
        keywords: [],
      },
    ],
  },
  {
    slug: "healthcare",
    label: "Healthcare",
    subsectors: [
      {
        label: "Health Tech & Apps",
        keywords: ["health app", "fitness", "telehealth", "telemedicine"],
      },
      {
        label: "Health Services",
        keywords: ["hospital", "clinic", "medical"],
      },
      {
        label: "Pharma & Biotech",
        keywords: ["pharma", "biotech", "drug"],
      },
      {
        label: "General Healthcare",
        keywords: [],
      },
    ],
  },
  {
    slug: "social-media",
    label: "Social Media",
    subsectors: [
      {
        label: "Social Networks",
        keywords: ["social network", "social media"],
      },
      {
        label: "Online Communities",
        keywords: ["forum", "community", "messaging"],
      },
      {
        label: "General Social Media",
        keywords: [],
      },
    ],
  },
  {
    slug: "education",
    label: "Education",
    subsectors: [
      {
        label: "EdTech",
        keywords: [
          "edtech",
          "educational technology",
          "learning platform",
          "online learning",
        ],
      },
      {
        label: "Educational Institutions",
        keywords: ["school", "university", "college"],
      },
      {
        label: "General Education",
        keywords: [],
      },
    ],
  },
  {
    slug: "telecom",
    label: "Telecom",
    subsectors: [
      {
        label: "ISPs & Carriers",
        keywords: [
          "isp",
          "internet service",
          "carrier",
          "wireless",
          "broadband",
        ],
      },
      {
        label: "General Telecom",
        keywords: [],
      },
    ],
  },
  {
    slug: "other",
    label: "Other",
    subsectors: [
      {
        label: "General",
        keywords: [],
      },
    ],
  },
];

/**
 * Look up a sector definition by its URL slug.
 */
export function getSectorBySlug(slug: string): SectorDefinition | undefined {
  return SECTOR_TAXONOMY.find((s) => s.slug === slug);
}

/**
 * Convert an IndustrySector label (e.g. "Financial Services") to its slug ("financial-services").
 */
export function getSectorSlug(label: string): string {
  const sector = SECTOR_TAXONOMY.find((s) => s.label === label);
  return sector ? sector.slug : label.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Reverse lookup: slug to human-readable label.
 */
export function getSectorLabel(slug: string): string | undefined {
  return SECTOR_TAXONOMY.find((s) => s.slug === slug)?.label;
}

/**
 * Classify a case into a subsector within the given sector.
 *
 * Uses company_name and categories as keyword sources since business_description
 * is not available at runtime in ftc-cases.json.
 *
 * Returns the matched subsector label, or the fallback "General [Sector]" subsector.
 */
export function classifySubsector(
  sectorSlug: string,
  companyName: string,
  categories: string[]
): string {
  const sector = getSectorBySlug(sectorSlug);
  if (!sector) return "General";

  const searchText = [companyName, ...categories].join(" ").toLowerCase();

  for (const subsector of sector.subsectors) {
    if (subsector.keywords.length === 0) continue;
    for (const keyword of subsector.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return subsector.label;
      }
    }
  }

  // Fall back to the last subsector (conventionally the "General" one)
  const fallback = sector.subsectors[sector.subsectors.length - 1];
  return fallback ? fallback.label : "General";
}

/**
 * Count statutory_topics across an array of cases and return the top N by frequency.
 */
export function getTopTopics(
  cases: EnhancedFTCCaseSummary[],
  limit: number
): string[] {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    for (const topic of c.statutory_topics) {
      counts[topic] = (counts[topic] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic]) => topic);
}
