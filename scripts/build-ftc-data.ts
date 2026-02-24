import * as fs from "fs";
import * as path from "path";

// Inline the types and constants to avoid path alias issues in tsx scripts

type ViolationType = "deceptive" | "unfair" | "both";

// Inline classification field types (pass-through strings, no need for full union types)
type StatutoryTopic = string;
type PracticeArea = string;
type IndustrySector = string;
type RemedyType = string;

interface FTCCaseSummary {
  id: string;
  docket_number: string;
  company_name: string;
  date_issued: string;
  year: number;
  administration: string;
  categories: string[];
  violation_type: ViolationType;
  complaint_counts: string[];
  legal_authority: string;
  commissioners: string[];
  ftc_url?: string;
  source_filename: string;
  num_provisions: number;
  num_requirements: number;
  order_duration_years: number | null;
  // Classification fields (populated from tagged source files)
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  industry_sectors: IndustrySector[];
  remedy_types: RemedyType[];
  provision_counts_by_topic: Record<string, number>;
}

interface GroupStats {
  key: string;
  label: string;
  count: number;
  violation_breakdown: { deceptive: number; unfair: number; both: number };
  top_categories?: string[];
  top_companies?: string[];
}

interface FTCDataPayload {
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

// Administration ranges
const ADMINISTRATIONS = [
  { label: "Clinton", start: "1993-01-20", end: "2001-01-20" },
  { label: "G.W. Bush", start: "2001-01-20", end: "2009-01-20" },
  { label: "Obama", start: "2009-01-20", end: "2017-01-20" },
  { label: "Trump (1st)", start: "2017-01-20", end: "2021-01-20" },
  { label: "Biden", start: "2021-01-20", end: "2025-01-20" },
  { label: "Trump (2nd)", start: "2025-01-20", end: "2029-01-20" },
];

function getAdministration(dateStr: string): string {
  for (const admin of ADMINISTRATIONS) {
    if (dateStr >= admin.start && dateStr < admin.end) return admin.label;
  }
  return "Unknown";
}

// Category rules
const CATEGORY_RULES = [
  { label: "COPPA / Children's Privacy", keywords: ["coppa", "children's online privacy", "child-directed", "children's privacy", "child's personal information"] },
  { label: "Data Security", keywords: ["data security", "security breach", "safeguards", "information security", "security practices", "unauthorized access", "security program"] },
  { label: "Privacy / Deceptive Privacy Practices", keywords: ["privacy", "privacy policy", "deceptive privacy", "privacy misrepresentation", "personal information", "tracking"] },
  { label: "Health Data", keywords: ["health data", "medical", "health breach", "health information", "hipaa", "reproductive"] },
  { label: "Location / Geolocation Data", keywords: ["location data", "geolocation", "geofenc", "precise location", "gps"] },
  { label: "Fair Credit Reporting (FCRA)", keywords: ["fair credit reporting", "fcra", "consumer report", "credit report", "background check"] },
  { label: "Gramm-Leach-Bliley", keywords: ["gramm-leach-bliley", "glba", "financial privacy", "safeguards rule"] },
  { label: "AI / Algorithmic / Facial Recognition", keywords: ["algorithm", "artificial intelligence", "facial recognition", "biometric", "machine learning", "automated", "ai-powered"] },
  { label: "Telemarketing / Do-Not-Call", keywords: ["telemarketing", "do-not-call", "robocall", "telephone", "tsr"] },
];

function classifyCategories(countTitles: string[], legalAuthority: string, factualBackground: string): string[] {
  const searchText = [...countTitles, legalAuthority, factualBackground].join(" ").toLowerCase();
  const matched: string[] = [];
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => searchText.includes(kw))) {
      matched.push(rule.label);
    }
  }
  return matched.length > 0 ? matched : ["Other"];
}

// --- Main ---

const FTC_SOURCE = path.resolve("C:/Users/rafst/Documents/projectas/FTC/output_v2");
const OUT_DIR = path.resolve("public/data");
const FILES_DIR = path.resolve("public/data/ftc-files");

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function parseDateFromFilename(filename: string): string | null {
  // Pattern: MM.YY, ...
  const match = filename.match(/^(\d{2})\.(\d{2}),/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const yearShort = parseInt(match[2], 10);
  // 97-99 => 1997-1999, 00-96 => 2000-2096
  const year = yearShort >= 90 ? 1900 + yearShort : 2000 + yearShort;
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}-15`; // mid-month fallback
}

function processFile(filepath: string): FTCCaseSummary | null {
  const filename = path.basename(filepath);
  let raw: any;
  try {
    raw = JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    console.warn(`  Skipping (parse error): ${filename}`);
    return null;
  }

  const caseInfo = raw.case_info;
  if (!caseInfo) {
    console.warn(`  Skipping (no case_info): ${filename}`);
    return null;
  }

  // Resolve date
  let dateIssued = caseInfo.date_issued || "";
  if (!dateIssued || dateIssued.length < 7) {
    const fallback = parseDateFromFilename(filename);
    if (fallback) dateIssued = fallback;
    else {
      console.warn(`  Skipping (no date): ${filename}`);
      return null;
    }
  }

  const year = parseInt(dateIssued.substring(0, 4), 10);
  if (isNaN(year)) return null;

  const violationType = (caseInfo.violation_type || "deceptive") as ViolationType;
  const countTitles = (raw.complaint?.counts || []).map((c: any) => c.title || "");
  const factualBackground = raw.complaint?.factual_background || "";
  const legalAuthority = caseInfo.legal_authority || "";
  const categories = classifyCategories(countTitles, legalAuthority, factualBackground);

  const provisions = raw.order?.provisions || [];
  const numRequirements = provisions.reduce(
    (sum: number, p: any) => sum + (p.requirements?.length || 0),
    0
  );

  const sanitizedId = sanitizeFilename(filename.replace(/\.json$/, ""));

  // Read classification tags from the ftc-files copy (if already classified)
  const classifiedFilePath = path.join(FILES_DIR, sanitizedId + ".json");
  let classifiedData: any = null;
  try {
    if (fs.existsSync(classifiedFilePath)) {
      classifiedData = JSON.parse(fs.readFileSync(classifiedFilePath, "utf-8"));
    }
  } catch {
    // If the classified file can't be read, proceed without classification tags
  }

  // Extract classification fields from the classified source file
  const statutory_topics: StatutoryTopic[] = classifiedData?.case_info?.statutory_topics ?? [];
  const practice_areas: PracticeArea[] = classifiedData?.case_info?.practice_areas ?? [];
  const industry_sectors: IndustrySector[] = classifiedData?.case_info?.industry_sectors ?? [];

  // Compute remedy_types: collect all unique remedy_types from all provisions
  const classifiedProvisions = classifiedData?.order?.provisions ?? [];
  const remedySet = new Set<string>();
  for (const prov of classifiedProvisions) {
    const provRemedies: string[] = prov.remedy_types ?? [];
    for (const r of provRemedies) {
      remedySet.add(r);
    }
  }
  const remedy_types: RemedyType[] = [...remedySet];

  // Compute provision_counts_by_topic: for each statutory topic, count how many
  // provisions in this case have that topic in their statutory_topics array
  const provision_counts_by_topic: Record<string, number> = {};
  for (const topic of statutory_topics) {
    let count = 0;
    for (const prov of classifiedProvisions) {
      const provTopics: string[] = prov.statutory_topics ?? [];
      if (provTopics.includes(topic)) {
        count++;
      }
    }
    provision_counts_by_topic[topic] = count;
  }

  return {
    id: sanitizedId,
    docket_number: caseInfo.docket_number || "",
    company_name: caseInfo.company?.name || "",
    date_issued: dateIssued,
    year,
    administration: getAdministration(dateIssued),
    categories,
    violation_type: violationType,
    complaint_counts: countTitles,
    legal_authority: legalAuthority,
    commissioners: caseInfo.commissioners || [],
    ftc_url: caseInfo.ftc_url || undefined,
    source_filename: filename,
    num_provisions: provisions.length,
    num_requirements: numRequirements,
    order_duration_years: raw.order?.duration?.duration_years ?? null,
    statutory_topics,
    practice_areas,
    industry_sectors,
    remedy_types,
    provision_counts_by_topic,
  };
}

function computeGroupStats(cases: FTCCaseSummary[], keyFn: (c: FTCCaseSummary) => string[]): GroupStats[] {
  const groups = new Map<string, FTCCaseSummary[]>();
  for (const c of cases) {
    for (const key of keyFn(c)) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
  }

  return Array.from(groups.entries()).map(([key, members]) => {
    const breakdown = { deceptive: 0, unfair: 0, both: 0 };
    const catCount = new Map<string, number>();
    const companyCount = new Map<string, number>();

    for (const m of members) {
      breakdown[m.violation_type] = (breakdown[m.violation_type] || 0) + 1;
      for (const cat of m.categories) {
        catCount.set(cat, (catCount.get(cat) || 0) + 1);
      }
      companyCount.set(m.company_name, (companyCount.get(m.company_name) || 0) + 1);
    }

    const topCategories = [...catCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
    const topCompanies = [...companyCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    return {
      key,
      label: key,
      count: members.length,
      violation_breakdown: breakdown,
      top_categories: topCategories,
      top_companies: topCompanies,
    };
  });
}

function generateAnalysis(
  groupings: FTCDataPayload["groupings"]
): FTCDataPayload["analysis"] {
  const analysis: FTCDataPayload["analysis"] = {};

  for (const [dimension, groups] of Object.entries(groupings) as [string, GroupStats[]][]) {
    analysis[dimension] = {};
    for (const g of groups) {
      const total = g.count;
      const dominant =
        g.violation_breakdown.deceptive >= g.violation_breakdown.unfair &&
        g.violation_breakdown.deceptive >= g.violation_breakdown.both
          ? "deceptive"
          : g.violation_breakdown.unfair >= g.violation_breakdown.both
          ? "unfair"
          : "both";

      const topCatsStr = g.top_categories?.slice(0, 3).join(", ") || "various areas";

      analysis[dimension][g.key] = {
        title: g.label,
        summary: `${total} enforcement action${total !== 1 ? "s" : ""}, primarily ${dominant} violations.`,
        narrative: `The FTC brought ${total} enforcement action${total !== 1 ? "s" : ""} in this group, with the majority involving ${dominant} practices. Key focus areas included ${topCatsStr}.`,
      };
    }
  }

  return analysis;
}

// --- Execute ---

console.log("Building FTC data...");
console.log(`Source: ${FTC_SOURCE}`);

const jsonFiles = fs.readdirSync(FTC_SOURCE).filter((f) => f.endsWith(".json"));
console.log(`Found ${jsonFiles.length} JSON files`);

// Process all files
const allCases: FTCCaseSummary[] = [];
for (const file of jsonFiles) {
  const result = processFile(path.join(FTC_SOURCE, file));
  if (result) allCases.push(result);
}
console.log(`Processed ${allCases.length} cases`);

// Deduplicate by docket_number (keep longer filename = more detail)
const byDocket = new Map<string, FTCCaseSummary>();
for (const c of allCases) {
  const existing = byDocket.get(c.docket_number);
  if (!existing || c.source_filename.length > existing.source_filename.length) {
    byDocket.set(c.docket_number, c);
  }
}
const dedupedCases = [...byDocket.values()].sort(
  (a, b) => a.date_issued.localeCompare(b.date_issued)
);
console.log(`After dedup: ${dedupedCases.length} unique cases`);

// Compute groupings
const byYear = computeGroupStats(dedupedCases, (c) => [String(c.year)]).sort(
  (a, b) => a.key.localeCompare(b.key)
);
const byAdmin = computeGroupStats(dedupedCases, (c) => [c.administration]);
// Sort administrations chronologically
const adminOrder = ADMINISTRATIONS.map((a) => a.label);
byAdmin.sort(
  (a, b) => adminOrder.indexOf(a.key) - adminOrder.indexOf(b.key)
);
const byCategory = computeGroupStats(dedupedCases, (c) => c.categories).sort(
  (a, b) => b.count - a.count
);

const groupings = {
  by_year: byYear,
  by_administration: byAdmin,
  by_category: byCategory,
};

const analysis = generateAnalysis(groupings);

const payload: FTCDataPayload = {
  generated_at: new Date().toISOString(),
  total_cases: dedupedCases.length,
  cases: dedupedCases,
  groupings,
  analysis,
};

// Write output
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(FILES_DIR, { recursive: true });

fs.writeFileSync(
  path.join(OUT_DIR, "ftc-cases.json"),
  JSON.stringify(payload, null, 2)
);
console.log(`Wrote ${path.join(OUT_DIR, "ftc-cases.json")}`);

// Copy individual files
let copied = 0;
for (const c of dedupedCases) {
  const src = path.join(FTC_SOURCE, c.source_filename);
  const dest = path.join(FILES_DIR, c.id + ".json");
  try {
    fs.copyFileSync(src, dest);
    copied++;
  } catch (e) {
    console.warn(`  Failed to copy: ${c.source_filename}`);
  }
}
console.log(`Copied ${copied} files to ${FILES_DIR}`);

// Print enhanced summary
const withStatutoryTopics = dedupedCases.filter((c) => c.statutory_topics.length > 0).length;
const withIndustrySectors = dedupedCases.filter((c) => c.industry_sectors.length > 0).length;
console.log(
  `Enhanced ftc-cases.json: ${dedupedCases.length} cases, ${withStatutoryTopics} with statutory topics, ${withIndustrySectors} with industry sectors`
);
console.log("Done!");
