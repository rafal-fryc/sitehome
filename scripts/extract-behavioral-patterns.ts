import * as fs from "fs";
import * as path from "path";

// Inline types to avoid tsx path alias issues (same pattern as build-patterns.ts)

interface CaseRecord {
  id: string;
  docket_number: string;
  company_name: string;
  date_issued: string;
  year: number;
  categories: string[];
  ftc_url?: string;
  takeaway_brief?: string;
  statutory_topics?: string[];
  practice_areas?: string[];
  industry_sectors?: string[];
  remedy_types?: string[];
}

interface CasesFile {
  cases: CaseRecord[];
}

// --- Review file types ---

interface ReviewSampleCase {
  case_id: string;
  company_name: string;
  takeaway_brief: string;
}

interface ReviewCategory {
  id: string;
  name: string;
  description: string;
  keywords_used: string[];
  case_count: number;
  sample_cases: ReviewSampleCase[];
  all_case_ids: string[];
}

interface ReviewFile {
  generated_at: string;
  mode: string;
  total_cases: number;
  categories: ReviewCategory[];
  uncategorized_cases: ReviewSampleCase[];
}

// --- Output types ---

interface BehavioralCase {
  case_id: string;
  company_name: string;
  date_issued: string;
  year: number;
  takeaway_brief: string;
  docket_number: string;
  ftc_url?: string;
  statutory_topics: string[];
  categories: string[];
}

interface BehavioralPattern {
  id: string;
  name: string;
  description: string;
  case_count: number;
  year_range: [number, number];
  most_recent_year: number;
  most_recent_date?: string;
  enforcement_topics: string[];
  cases: BehavioralCase[];
}

interface BehavioralPatternsFile {
  generated_at: string;
  total_patterns: number;
  total_cases_categorized: number;
  patterns: BehavioralPattern[];
}

// --- Helpers ---

function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // validate before writing
  fs.writeFileSync(tmp, serialized, "utf-8");
  fs.renameSync(tmp, filePath);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Category definitions with keyword matching ---

interface CategoryDef {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

const CATEGORY_DEFINITIONS: CategoryDef[] = [
  {
    id: "deceptive-marketing-claims",
    name: "Deceptive Marketing Claims",
    description:
      "Companies making false or misleading advertising claims about products or services",
    keywords: [
      "false claim",
      "falsely claim",
      "falsely advertis",
      "falsely certif",
      "falsely promis",
      "falsely represent",
      "falsely stat",
      "false advertising",
      "misleading",
      "misrepresent",
      "deceptive claim",
      "deceptive advertising",
      "deceptive marketing",
      "unsubstantiated",
      "false endorsement",
      "fake review",
      "fake testimonial",
      "fabricated",
      "baseless claim",
      "false efficacy",
      "fake certification",
      "bogus",
      "sham",
      "false seal",
      "certification mark",
      "certification seal",
      "phony",
      "false promise",
      "guarantee",
      "false guarantee",
      "marketed",
      "suppressed",
      "false representation",
      "false malware",
      "fake document",
      "fake pay stub",
      "fake bank statement",
      "fake financial",
      "fake diagnostic",
      "falsely positive",
      "false finding",
      "self-created",
      "implying",
    ],
  },
  {
    id: "unauthorized-data-collection",
    name: "Unauthorized Data Collection",
    description:
      "Collecting personal data without consent, beyond stated purposes, or through deceptive means",
    keywords: [
      "collected personal",
      "collecting personal",
      "collected data without",
      "collecting data without",
      "without consent",
      "without notice",
      "without knowledge",
      "without permission",
      "harvested data",
      "harvesting data",
      "scraped data",
      "intercepted",
      "surreptitiously",
      "covertly collected",
      "secretly collected",
      "secretly gathered",
      "undisclosed collection",
      "obtained personal information",
      "gathered personal",
      "exfiltrat",
      "secretly used",
      "secretly install",
      "secretly transmit",
      "pretext",
      "comprehensive health information",
      "health information from",
      "collect consumers",
      "sensitive consumer data",
      "without adequate disclosure",
    ],
  },
  {
    id: "inadequate-data-security",
    name: "Inadequate Data Security",
    description:
      "Failure to protect consumer data, security breaches, or inadequate security practices",
    keywords: [
      "data breach",
      "security breach",
      "inadequate security",
      "failed to protect",
      "failure to protect",
      "unprotected",
      "unencrypted",
      "clear text",
      "plaintext",
      "no encryption",
      "weak security",
      "poor security",
      "lax security",
      "security vulnerabilit",
      "exposed data",
      "data exposure",
      "compromised",
      "hacked",
      "unauthorized access",
      "failed to secure",
      "failure to secure",
      "reasonable security",
      "sql injection",
      "inadequate safeguard",
      "failed to implement",
      "unsecured",
      "disposed",
      "discarded",
      "dumpster",
      "trash container",
      "ssl certificate",
      "certificate validation",
      "credential",
      "hard-coded",
      "backdoor",
      "command injection",
      "peer-to-peer",
      "p2p",
      "cloud storage misconfiguration",
      "misconfigur",
      "publicly shared",
      "insecure",
      "github repositor",
      "security control",
      "security vetting",
      "vulnerable",
      "data compromise",
      "incident response",
      "untested code",
      "inadequately tested",
    ],
  },
  {
    id: "childrens-privacy-violations",
    name: "Children's Privacy Violations",
    description:
      "COPPA violations, collecting data from minors without parental consent",
    keywords: [
      "child",
      "children",
      "minor",
      "coppa",
      "parental consent",
      "parental notice",
      "under 13",
      "under age",
      "underage",
      "kid",
      "teen",
      "young user",
    ],
  },
  {
    id: "unfair-billing-practices",
    name: "Unfair Billing Practices",
    description:
      "Unauthorized charges, deceptive pricing, hidden fees, or difficulty canceling",
    keywords: [
      "unauthorized charge",
      "hidden fee",
      "deceptive pricing",
      "overbill",
      "overcharge",
      "cramming",
      "phantom charge",
      "billed without",
      "charged without",
      "billing fraud",
      "unfair billing",
      "negative option",
      "automatic renewal",
      "auto-renewal",
      "hard to cancel",
      "difficult to cancel",
      "cancel",
      "subscription trap",
      "advance fee",
      "upfront fee",
      "refund",
      "unauthorized fee",
      "unauthorized debit",
      "charged victims",
      "charged fee",
      "coerce repayment",
      "repair service",
      "required disclosure",
      "risk-based pricing",
      "unnecessary repair",
      "payday lender",
    ],
  },
  {
    id: "privacy-policy-deception",
    name: "Privacy Policy Deception",
    description:
      "False privacy promises, undisclosed data sharing, or violating stated privacy policies",
    keywords: [
      "privacy policy",
      "privacy promise",
      "privacy practice",
      "privacy pledge",
      "broke promise",
      "breaking promise",
      "broken promise",
      "violated its own",
      "contrary to",
      "despite claiming",
      "despite promising",
      "despite stating",
      "safe harbor",
      "privacy shield",
      "eu-u.s.",
      "swiss-u.s.",
      "certification had lapsed",
      "certification lapsed",
      "self-regulatory",
      "despite repeatedly promising",
      "promised not to share",
      "promised never",
      "privacy-protection",
      "while describing",
      "while actually",
      "while leaving",
      "while secretly",
      "privacy notices",
      "gramm-leach-bliley",
      "glb",
      "security promise",
      "describing it as",
    ],
  },
  {
    id: "illegal-telemarketing",
    name: "Illegal Telemarketing",
    description:
      "Do Not Call violations, robocalls, TSR violations, and deceptive telemarketing",
    keywords: [
      "telemarketing",
      "robocall",
      "do not call",
      "do-not-call",
      "tsr",
      "telemarketing sales rule",
      "prerecorded",
      "pre-recorded",
      "autodialed",
      "auto-dialed",
      "unsolicited call",
      "cold call",
      "phone scam",
      "caller id",
      "spoofed",
    ],
  },
  {
    id: "credit-reporting-violations",
    name: "Credit Reporting Violations",
    description:
      "FCRA violations, inaccurate credit reporting, failing to investigate disputes",
    keywords: [
      "credit report",
      "credit score",
      "consumer report",
      "fcra",
      "fair credit",
      "credit bureau",
      "credit monitoring",
      "adverse action",
      "dispute",
      "reinvestigat",
      "credit piggybacking",
      "fico",
      "credit repair",
      "background check",
      "furnish",
      "tenant screening",
      "screening report",
      "inaccurate information",
      "inaccurate criminal",
      "obsolete record",
      "background report",
      "eviction",
      "sealed record",
    ],
  },
  {
    id: "surveillance-and-tracking",
    name: "Surveillance & Tracking",
    description:
      "Undisclosed monitoring, location tracking, spyware, or stalkerware",
    keywords: [
      "surveillance",
      "tracking",
      "location data",
      "location tracking",
      "geolocation",
      "geofen",
      "spyware",
      "stalkerware",
      "monitored",
      "monitoring",
      "webcam",
      "keylog",
      "keystroke",
      "screen capture",
      "wiretap",
      "eavesdrop",
      "listen",
      "man-in-the-middle",
      "tracked nearly all",
      "tracked all",
      "browsing histor",
      "browsing activity",
      "internet activity",
      "online activity",
      "intimate image",
      "revenge porn",
    ],
  },
  {
    id: "dark-patterns-deceptive-design",
    name: "Dark Patterns & Deceptive Design",
    description:
      "Trick interfaces, manipulative UX, hard-to-cancel subscriptions, or deceptive enrollment",
    keywords: [
      "dark pattern",
      "deceptive design",
      "trick",
      "manipulat",
      "confusing interface",
      "auto-enroll",
      "automatically enrolled",
      "opt-out",
      "opt out",
      "pre-checked",
      "prechecked",
      "buried",
      "hidden option",
      "obscured",
      "nudge",
      "forced action",
    ],
  },
  {
    id: "unauthorized-data-sharing",
    name: "Unauthorized Data Sharing",
    description:
      "Selling or sharing consumer data with third parties without adequate consent or disclosure",
    keywords: [
      "sold data",
      "sold personal",
      "selling data",
      "selling personal",
      "shared data",
      "shared personal",
      "sharing data",
      "sharing personal",
      "disclosed data",
      "disclosed personal",
      "third party",
      "third-party",
      "data broker",
      "data trafficking",
      "data sale",
      "transferred data",
      "provided data to",
      "monetiz",
      "sold it to",
      "sold them to",
      "resold",
      "gave its parent company",
      "harvest and sell",
      "transmitted",
      "secretly disclosed",
      "secretly shared",
      "secretly giving",
      "disclosed it to",
      "shared it",
      "prescreened",
      "sensitive loan application",
    ],
  },
  {
    id: "identity-theft-facilitation",
    name: "Identity Theft Facilitation",
    description:
      "Enabling or failing to prevent identity theft, or fraudulently obtaining personal information",
    keywords: [
      "identity theft",
      "identity fraud",
      "impersonat",
      "pretexting",
      "social engineering",
      "fraudulently obtain",
      "phone record",
      "account takeover",
      "stolen identity",
      "personal information was used",
      "financial record",
      "failed to verify the identit",
      "fraudulent actor",
    ],
  },
  {
    id: "algorithmic-harm",
    name: "Algorithmic Harm",
    description:
      "Biased or deceptive AI/automated decision-making, or algorithmic discrimination",
    keywords: [
      "algorithm",
      "artificial intelligence",
      "automated decision",
      "machine learning",
      "ai-powered",
      "ai system",
      "bias",
      "discriminat",
      "facial recognition",
      "deepfake",
      "generative ai",
      "chatbot",
      "automated system",
    ],
  },
];

// --- Mode: --propose ---

function runPropose(): void {
  console.log("=== Behavioral Pattern Extraction: PROPOSE mode ===\n");

  const casesPath = path.resolve("public/data/ftc-cases.json");
  const reviewPath = path.resolve("scripts/behavioral-categories-review.json");

  if (!fs.existsSync(casesPath)) {
    console.error(`ERROR: Cases file not found: ${casesPath}`);
    process.exit(1);
  }

  const casesData: CasesFile = JSON.parse(fs.readFileSync(casesPath, "utf-8"));
  const cases = casesData.cases.filter((c) => c.takeaway_brief);

  console.log(`Loaded ${cases.length} cases with takeaway_brief\n`);

  // Track which cases match each category
  const categoryMatches = new Map<string, Set<string>>();
  const categorizedCaseIds = new Set<string>();

  for (const catDef of CATEGORY_DEFINITIONS) {
    categoryMatches.set(catDef.id, new Set());
  }

  // Match cases against categories using keyword matching
  for (const c of cases) {
    const text = (c.takeaway_brief || "").toLowerCase();

    for (const catDef of CATEGORY_DEFINITIONS) {
      const matched = catDef.keywords.some((kw) => text.includes(kw.toLowerCase()));
      if (matched) {
        categoryMatches.get(catDef.id)!.add(c.id);
        categorizedCaseIds.add(c.id);
      }
    }
  }

  // Build case lookup
  const caseLookup = new Map<string, CaseRecord>();
  for (const c of cases) {
    caseLookup.set(c.id, c);
  }

  // Build review categories
  const reviewCategories: ReviewCategory[] = [];

  for (const catDef of CATEGORY_DEFINITIONS) {
    const matchedIds = categoryMatches.get(catDef.id)!;
    if (matchedIds.size === 0) continue;

    const allCaseIds = [...matchedIds].sort();
    const sampleCases: ReviewSampleCase[] = allCaseIds.slice(0, 5).map((id) => {
      const c = caseLookup.get(id)!;
      return {
        case_id: c.id,
        company_name: c.company_name,
        takeaway_brief: c.takeaway_brief || "",
      };
    });

    reviewCategories.push({
      id: catDef.id,
      name: catDef.name,
      description: catDef.description,
      keywords_used: catDef.keywords,
      case_count: matchedIds.size,
      sample_cases: sampleCases,
      all_case_ids: allCaseIds,
    });

    console.log(`  ${catDef.name}: ${matchedIds.size} cases`);
  }

  // Sort categories by case count descending
  reviewCategories.sort((a, b) => b.case_count - a.case_count);

  // Find uncategorized cases
  const uncategorized: ReviewSampleCase[] = cases
    .filter((c) => !categorizedCaseIds.has(c.id))
    .map((c) => ({
      case_id: c.id,
      company_name: c.company_name,
      takeaway_brief: c.takeaway_brief || "",
    }));

  console.log(`\nUncategorized cases: ${uncategorized.length}`);

  // Build review file
  const reviewFile: ReviewFile = {
    generated_at: new Date().toISOString(),
    mode: "proposed",
    total_cases: cases.length,
    categories: reviewCategories,
    uncategorized_cases: uncategorized,
  };

  writeJSONSafe(reviewPath, reviewFile);

  console.log(`\n${"=".repeat(60)}`);
  console.log("PROPOSAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total categories: ${reviewCategories.length}`);
  console.log(`Total cases: ${cases.length}`);
  console.log(`Categorized: ${categorizedCaseIds.size}`);
  console.log(`Uncategorized: ${uncategorized.length}`);
  console.log(`\nReview file: ${reviewPath}`);
  console.log(
    "\nNext step: Review the file, edit as needed, then run with --finalize"
  );
}

// --- Mode: --finalize ---

function runFinalize(): void {
  console.log("=== Behavioral Pattern Extraction: FINALIZE mode ===\n");

  const reviewPath = path.resolve("scripts/behavioral-categories-review.json");
  const casesPath = path.resolve("public/data/ftc-cases.json");
  const outPath = path.resolve("public/data/ftc-behavioral-patterns.json");

  if (!fs.existsSync(reviewPath)) {
    console.error(`ERROR: Review file not found: ${reviewPath}`);
    console.error("Run with --propose first, then review, then --finalize");
    process.exit(1);
  }

  const reviewData: ReviewFile = JSON.parse(
    fs.readFileSync(reviewPath, "utf-8")
  );
  const casesData: CasesFile = JSON.parse(fs.readFileSync(casesPath, "utf-8"));

  // Build case lookup
  const caseLookup = new Map<string, CaseRecord>();
  for (const c of casesData.cases) {
    caseLookup.set(c.id, c);
  }

  console.log(
    `Loaded review: ${reviewData.categories.length} categories, ${casesData.cases.length} cases\n`
  );

  const allCategorizedIds = new Set<string>();
  const patterns: BehavioralPattern[] = [];

  for (const cat of reviewData.categories) {
    // Look up full case metadata for each case ID
    const behavioralCases: BehavioralCase[] = [];

    for (const caseId of cat.all_case_ids) {
      const c = caseLookup.get(caseId);
      if (!c) {
        console.warn(`  WARN: Case ${caseId} not found in cases data`);
        continue;
      }

      allCategorizedIds.add(caseId);

      behavioralCases.push({
        case_id: c.id,
        company_name: c.company_name,
        date_issued: c.date_issued,
        year: c.year,
        takeaway_brief: c.takeaway_brief || "",
        docket_number: c.docket_number,
        ftc_url: c.ftc_url,
        statutory_topics: c.statutory_topics || [],
        categories: c.categories || [],
      });
    }

    if (behavioralCases.length === 0) {
      console.warn(`  WARN: Category "${cat.name}" has no valid cases, skipping`);
      continue;
    }

    // Sort cases chronologically
    behavioralCases.sort((a, b) => a.date_issued.localeCompare(b.date_issued));

    // Compute stats
    const years = behavioralCases.map((c) => c.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Compute most_recent_date
    const mostRecentDate = behavioralCases.reduce(
      (max, c) => (c.date_issued > max ? c.date_issued : max),
      "0000-00-00"
    );

    // Collect enforcement topics (union of all case statutory_topics)
    const topicsSet = new Set<string>();
    for (const c of behavioralCases) {
      for (const t of c.statutory_topics) {
        topicsSet.add(t);
      }
    }

    const pattern: BehavioralPattern = {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      case_count: behavioralCases.length,
      year_range: [minYear, maxYear],
      most_recent_year: maxYear,
      most_recent_date: mostRecentDate,
      enforcement_topics: [...topicsSet].sort(),
      cases: behavioralCases,
    };

    patterns.push(pattern);
    console.log(
      `  ${cat.name}: ${behavioralCases.length} cases (${minYear}-${maxYear})`
    );
  }

  // Sort patterns by most_recent_date descending
  patterns.sort((a, b) => {
    const dateA = a.most_recent_date || String(a.most_recent_year);
    const dateB = b.most_recent_date || String(b.most_recent_year);
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return b.case_count - a.case_count;
  });

  const output: BehavioralPatternsFile = {
    generated_at: new Date().toISOString(),
    total_patterns: patterns.length,
    total_cases_categorized: allCategorizedIds.size,
    patterns,
  };

  writeJSONSafe(outPath, output);

  const fileSizeKB = (
    Buffer.byteLength(JSON.stringify(output, null, 2), "utf-8") / 1024
  ).toFixed(1);

  console.log(`\n${"=".repeat(60)}`);
  console.log("FINALIZATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total patterns: ${patterns.length}`);
  console.log(`Total cases categorized: ${allCategorizedIds.size}`);
  console.log(`Output file: ${outPath}`);
  console.log(`Output size: ${fileSizeKB} KB`);

  console.log("\nTop 5 patterns by case count:");
  console.log("-".repeat(60));
  const top5 = [...patterns]
    .sort((a, b) => b.case_count - a.case_count)
    .slice(0, 5);
  for (const p of top5) {
    console.log(
      `  ${String(p.case_count).padStart(3)} cases | ${p.year_range[0]}-${p.year_range[1]} | ${p.name}`
    );
  }

  console.log("\nDone!");
}

// --- Entry point ---

const mode = process.argv[2];

if (mode === "--propose") {
  runPropose();
} else if (mode === "--finalize") {
  runFinalize();
} else {
  console.error("Usage: npx tsx scripts/extract-behavioral-patterns.ts [--propose | --finalize]");
  process.exit(1);
}
