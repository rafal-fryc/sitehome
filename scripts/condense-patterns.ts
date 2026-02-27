import * as fs from "fs";
import * as path from "path";

// Inline types (same as build-patterns.ts, avoid tsx path alias issues)

interface PatternVariant {
  case_id: string;
  company_name: string;
  date_issued: string;
  year: number;
  provision_number: string;
  title: string;
  text_preview: string;
  verbatim_text: string;
  docket_number: string;
  ftc_url?: string;
  administration: string;
}

interface PatternGroup {
  id: string;
  name: string;
  is_structural: boolean;
  case_count: number;
  variant_count: number;
  year_range: [number, number];
  most_recent_year: number;
  enforcement_topics: string[];
  practice_areas: string[];
  variants: PatternVariant[];
}

interface PatternsFile {
  generated_at: string;
  total_patterns: number;
  total_variants: number;
  patterns: PatternGroup[];
}

// --- Merge config types ---

interface MergeGroupConfig {
  target_name: string;
  target_id: string;
  topic_area: string;
  source_patterns: string[];
  source_names: string[];
  estimated_unique_cases: number;
  variant_count: number;
  year_range: [number, number];
  rationale: string;
}

interface PruneEntry {
  pattern_id: string;
  pattern_name: string;
  case_count: number;
  most_recent_year: number;
  is_structural: boolean;
  reason: string;
}

interface PruneCriteria {
  description: string;
  case_count_threshold: number;
  recency_cutoff_year: number;
}

interface MergeConfigFile {
  generated_at: string;
  status: "proposed" | "approved";
  summary: {
    current_patterns: number;
    merge_groups: number;
    patterns_merged: number;
    patterns_pruned: number;
    projected_final: number;
  };
  merge_groups: MergeGroupConfig[];
  prune_list: PruneEntry[];
  prune_criteria: PruneCriteria;
}

// --- Helpers (reused from build-patterns.ts) ---

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // validate before writing
  fs.writeFileSync(tmp, serialized, "utf-8");
  fs.renameSync(tmp, filePath);
}

// --- Merge family definitions ---
// Each family defines matchers (name-based regex/substring) and grouping logic

interface FamilyDefinition {
  family_name: string;
  groups: FamilyGroup[];
}

interface FamilyGroup {
  target_name: string;
  topic_area: string;
  rationale: string;
  matchers: ((p: PatternGroup) => boolean)[];
}

function nameContains(substring: string): (p: PatternGroup) => boolean {
  const lower = substring.toLowerCase();
  return (p) => p.name.toLowerCase().includes(lower);
}

function nameMatches(regex: RegExp): (p: PatternGroup) => boolean {
  return (p) => regex.test(p.name);
}

function idEquals(id: string): (p: PatternGroup) => boolean {
  return (p) => p.id === id;
}

// Define all merge families with their groupings

const FAMILY_DEFINITIONS: FamilyDefinition[] = [
  // (a) Assessment family
  {
    family_name: "Assessment",
    groups: [
      {
        target_name: "Third-Party Security Assessments",
        topic_area: "security",
        rationale:
          "All are variants of third-party assessment requirements for information security, including biennial and covered business variants",
        matchers: [
          idEquals("third-party-security-assessments"),
          idEquals("biennial-third-party-security-assessments"),
          idEquals("information-security-assessments-by-a-third-party"),
          idEquals("third-party-information-security-assessments-for-covered-businesses"),
          idEquals("data-security-assessments-by-a-third-party"),
          idEquals("third-party-assessments"),
          idEquals("biennial-assessment-requirements"),
        ],
      },
      {
        target_name: "Third-Party Privacy Assessments",
        topic_area: "privacy",
        rationale:
          "Privacy-focused third-party assessment requirements, distinct from security assessments",
        matchers: [
          idEquals("privacy-assessments-by-a-third-party"),
          idEquals("third-party-privacy-assessments"),
        ],
      },
      {
        target_name: "Cooperation with Third-Party Assessor",
        topic_area: "security",
        rationale:
          "Requirements for cooperating with and providing access to third-party security assessors",
        matchers: [
          idEquals("cooperation-with-third-party-information-security-assessor"),
          idEquals("cooperation-with-assessor"),
        ],
      },
      // Supplier Assessment Program (3 cases, recent 2025) stays as-is -- too distinct
    ],
  },

  // (b) Acknowledgment family -- all merge into 1 group
  {
    family_name: "Acknowledgment",
    groups: [
      {
        target_name: "Order Acknowledgments",
        topic_area: "structural",
        rationale:
          "All are variants of the same structural requirement: respondent must acknowledge receipt of the order and distribute it within the organization",
        matchers: [
          idEquals("acknowledgments-of-the-order"),
          idEquals("order-acknowledgments"),
          idEquals("order-distribution-and-acknowledgment"),
          idEquals("order-acknowledgement"),
          idEquals("order-acknowledgements"),
          idEquals("order-acknowledgment"),
          idEquals("order-acknowledgment-and-delivery"),
          idEquals("order-delivery-and-acknowledgment"),
          idEquals("order-acknowledgment-and-distribution"),
          idEquals("acknowledgment-of-receipt-of-order"),
          idEquals("acknowledgment-of-receipt-of-order-by-defendants"),
        ],
      },
    ],
  },

  // (c) Misrepresentation family
  {
    family_name: "Misrepresentation",
    groups: [
      {
        target_name: "Prohibition Against Misrepresentations",
        topic_area: "general",
        rationale:
          "General prohibition against misrepresentations -- the broadest, most common variant covering all topics",
        matchers: [
          idEquals("prohibition-against-misrepresentations"),
          idEquals("prohibition-on-misrepresentations"),
          idEquals("prohibited-misrepresentations"),
          idEquals("prohibited-misleading-representations"),
        ],
      },
      {
        target_name: "Prohibition Against Privacy and Security Misrepresentations",
        topic_area: "privacy-security",
        rationale:
          "Misrepresentation prohibitions specifically about privacy and/or security practices and claims",
        matchers: [
          idEquals("prohibition-against-misrepresentations-about-privacy-and-security"),
          idEquals("prohibition-against-misrepresentations-about-security-and-privacy"),
          idEquals("prohibition-against-misrepresentations-about-security"),
          idEquals("no-misrepresentations-about-privacy"),
          idEquals("prohibition-against-privacy-misrepresentations"),
        ],
      },
      {
        target_name: "Prohibition Against Privacy/Security Program Misrepresentations",
        topic_area: "program-compliance",
        rationale:
          "Misrepresentation prohibitions specifically about participation in or compliance with privacy/security programs (e.g., Privacy Shield, Safe Harbor)",
        matchers: [
          idEquals("prohibition-against-misrepresentations-about-participation-in-or-compliance-with-privacy-programs"),
          idEquals("prohibition-against-misrepresentations-about-participation-in-privacy-or-security-programs"),
          idEquals("prohibition-against-misrepresentations-about-privacy-or-security-programs"),
          idEquals("prohibition-against-misrepresentations-about-privacy-and-security-programs"),
        ],
      },
    ],
  },

  // (d) Security/Privacy program family
  {
    family_name: "Security/Privacy Programs",
    groups: [
      {
        target_name: "Information Security Program",
        topic_area: "security",
        rationale:
          "All variants of mandated information security program requirements, including comprehensive and covered business variants",
        matchers: [
          idEquals("comprehensive-information-security-program"),
          idEquals("mandated-information-security-program"),
          idEquals("mandated-information-security-program-for-covered-businesses"),
          idEquals("mandated-data-security-program"),
          idEquals("information-security-program"),
          idEquals("comprehensive-security-program"),
        ],
      },
      {
        target_name: "Privacy Program",
        topic_area: "privacy",
        rationale:
          "Mandated privacy program requirements, distinct from security programs",
        matchers: [
          idEquals("mandated-privacy-program"),
          idEquals("comprehensive-privacy-program"),
        ],
      },
      {
        target_name: "Combined Privacy and Security Program",
        topic_area: "privacy-security",
        rationale:
          "Combined privacy and information security program mandates (emerging pattern)",
        matchers: [
          idEquals("mandated-privacy-and-information-security-program"),
        ],
      },
    ],
  },

  // (e) Recordkeeping family
  {
    family_name: "Recordkeeping",
    groups: [
      {
        target_name: "Recordkeeping",
        topic_area: "structural",
        rationale:
          "All variants of recordkeeping/record-keeping requirements including provisions and requirements variants",
        matchers: [
          idEquals("recordkeeping"),
          idEquals("recordkeeping-provisions"),
          idEquals("record-keeping"),
          idEquals("record-keeping-provisions"),
          idEquals("recordkeeping-requirements"),
        ],
      },
    ],
  },

  // (f) Compliance reporting family
  {
    family_name: "Compliance Reporting",
    groups: [
      {
        target_name: "Compliance Reporting",
        topic_area: "structural",
        rationale:
          "All variants of compliance reporting requirements, including defendant-specific variants",
        matchers: [
          idEquals("compliance-reporting"),
          idEquals("compliance-reporting-by-defendant"),
          idEquals("compliance-reporting-by-defendants"),
        ],
      },
      {
        target_name: "Compliance Reports and Notices",
        topic_area: "structural",
        rationale:
          "Combined compliance report and notices requirements (singular and plural variants)",
        matchers: [
          idEquals("compliance-reports-and-notices"),
          idEquals("compliance-report-and-notices"),
        ],
      },
    ],
  },

  // (g) Corporate changes / distribution family
  {
    family_name: "Corporate Changes / Distribution",
    groups: [
      {
        target_name: "Corporate Change Notification",
        topic_area: "structural",
        rationale:
          "All variants of corporate change/structure notification requirements",
        matchers: [
          idEquals("notification-of-corporate-changes"),
          idEquals("notice-of-corporate-changes"),
          idEquals("corporate-change-notification"),
          idEquals("change-in-corporate-structure-notification"),
          idEquals("compliance-notification-of-corporate-changes"),
          idEquals("notification-of-changes-affecting-compliance"),
        ],
      },
      {
        target_name: "Distribution of Order",
        topic_area: "structural",
        rationale:
          "Standalone distribution of order requirements (not combined with acknowledgment)",
        matchers: [
          idEquals("distribution-of-order"),
          idEquals("distribution-of-order-by-defendant"),
          idEquals("distribution-of-order-by-defendants"),
        ],
      },
    ],
  },

  // (h) Order duration / termination family
  {
    family_name: "Order Duration / Termination",
    groups: [
      {
        target_name: "Order Duration and Termination",
        topic_area: "structural",
        rationale:
          "All variants of order duration, termination, and effective dates/duration provisions",
        matchers: [
          idEquals("order-duration-and-termination"),
          idEquals("order-duration"),
          idEquals("order-effective-dates-and-duration"),
          idEquals("termination-of-order"),
          idEquals("order-termination"),
        ],
      },
    ],
  },

  // (i) COPPA / Children family
  {
    family_name: "COPPA / Children",
    groups: [
      {
        target_name: "COPPA Injunctions",
        topic_area: "coppa",
        rationale:
          "All injunctions concerning collection of personal information from children and COPPA violations",
        matchers: [
          idEquals("injunction-concerning-collection-of-personal-information-from-children"),
          idEquals("injunction-concerning-the-collection-of-personal-information-from-children"),
          idEquals("injunction-concerning-the-collection-of-personal-information"),
          idEquals("injunction-against-coppa-violations"),
          idEquals("injunction-against-coppa-rule-violations"),
        ],
      },
      {
        target_name: "Children's Data Deletion",
        topic_area: "coppa",
        rationale:
          "Requirements for deletion of children's personal information previously collected",
        matchers: [
          idEquals("deletion-of-childrens-personal-information"),
          idEquals("injunction-concerning-deletion-of-childrens-personal-information"),
          idEquals("injunction-concerning-childrens-personal-information-previously-collected"),
        ],
      },
    ],
  },

  // (j) Monetary family
  {
    family_name: "Monetary",
    groups: [
      {
        target_name: "Civil Penalty",
        topic_area: "monetary",
        rationale:
          "Civil penalty judgments and payment requirements",
        matchers: [
          idEquals("civil-penalty"),
          idEquals("civil-penalty-payment"),
          idEquals("monetary-judgment-for-civil-penalty"),
        ],
      },
      {
        target_name: "Monetary Relief and Judgment",
        topic_area: "monetary",
        rationale:
          "Monetary relief, judgment, and additional monetary provisions",
        matchers: [
          idEquals("monetary-relief"),
          idEquals("monetary-judgment"),
          idEquals("additional-monetary-provisions"),
        ],
      },
      {
        target_name: "Costs and Fees",
        topic_area: "monetary",
        rationale:
          "Attorney fees, costs, and related fee provisions",
        matchers: [
          idEquals("costs-and-attorneys-fees"),
          idEquals("fees-and-costs"),
        ],
      },
    ],
  },

  // (k) Deletion family (excluding children's deletion which is in COPPA group)
  {
    family_name: "Deletion",
    groups: [
      {
        target_name: "Data Deletion Requirements",
        topic_area: "data-handling",
        rationale:
          "General data deletion and required deletion of data provisions",
        matchers: [
          idEquals("data-deletion"),
          idEquals("deletion"),
          idEquals("required-deletion-of-data"),
        ],
      },
      // location-data-deletion-requests stays as-is (4 cases, 2024-2025, distinct concept)
      // deletion-of-covered-biometric-information stays as-is (3 cases, 2024, distinct concept)
    ],
  },
];

// --- Main ---

function propose(): void {
  const PATTERNS_PATH = path.resolve("public/data/ftc-patterns.json");
  const CONFIG_PATH = path.resolve("scripts/pattern-merge-config.json");

  if (!fs.existsSync(PATTERNS_PATH)) {
    console.error(`ERROR: Patterns file not found: ${PATTERNS_PATH}`);
    process.exit(1);
  }

  const patternsFile: PatternsFile = JSON.parse(
    fs.readFileSync(PATTERNS_PATH, "utf-8")
  );
  const patterns = patternsFile.patterns;

  console.log(`Loaded ${patterns.length} patterns from ${PATTERNS_PATH}`);
  console.log("");

  // Track which patterns are claimed by merge groups
  const claimedIds = new Set<string>();
  const mergeGroups: MergeGroupConfig[] = [];

  // Process each family definition
  for (const family of FAMILY_DEFINITIONS) {
    for (const group of family.groups) {
      // Find all patterns matching any of the group's matchers
      const sourcePatterns: PatternGroup[] = [];
      for (const pattern of patterns) {
        if (claimedIds.has(pattern.id)) continue; // Already claimed by another group
        for (const matcher of group.matchers) {
          if (matcher(pattern)) {
            sourcePatterns.push(pattern);
            break; // Only need one matcher to match
          }
        }
      }

      if (sourcePatterns.length < 2) {
        // Need at least 2 patterns to form a merge group
        continue;
      }

      // Compute stats by deduplicating across all variants
      const allCaseIds = new Set<string>();
      let totalVariants = 0;
      let minYear = Infinity;
      let maxYear = -Infinity;

      for (const sp of sourcePatterns) {
        totalVariants += sp.variant_count;
        for (const v of sp.variants) {
          allCaseIds.add(v.case_id);
          if (v.year < minYear) minYear = v.year;
          if (v.year > maxYear) maxYear = v.year;
        }
      }

      const targetId = slugify(group.target_name);

      mergeGroups.push({
        target_name: group.target_name,
        target_id: targetId,
        topic_area: group.topic_area,
        source_patterns: sourcePatterns.map((p) => p.id),
        source_names: sourcePatterns.map((p) => p.name),
        estimated_unique_cases: allCaseIds.size,
        variant_count: totalVariants,
        year_range: [minYear, maxYear],
        rationale: group.rationale,
      });

      // Mark these patterns as claimed
      for (const sp of sourcePatterns) {
        claimedIds.add(sp.id);
      }
    }
  }

  // Identify prune candidates: case_count < 5 AND most_recent_year < 2020
  const PRUNE_CASE_THRESHOLD = 5;
  const PRUNE_RECENCY_CUTOFF = 2020;

  const pruneList: PruneEntry[] = [];
  for (const pattern of patterns) {
    if (claimedIds.has(pattern.id)) continue; // Don't prune patterns being merged
    if (
      pattern.case_count < PRUNE_CASE_THRESHOLD &&
      pattern.most_recent_year < PRUNE_RECENCY_CUTOFF
    ) {
      pruneList.push({
        pattern_id: pattern.id,
        pattern_name: pattern.name,
        case_count: pattern.case_count,
        most_recent_year: pattern.most_recent_year,
        is_structural: pattern.is_structural,
        reason: `Below composite threshold: case_count (${pattern.case_count}) < ${PRUNE_CASE_THRESHOLD} AND most_recent_year (${pattern.most_recent_year}) < ${PRUNE_RECENCY_CUTOFF}`,
      });
    }
  }

  // Calculate summary
  const patternsMerged = claimedIds.size;
  const patternsPruned = pruneList.length;
  const pruneIds = new Set(pruneList.map((p) => p.pattern_id));
  const passthrough = patterns.filter(
    (p) => !claimedIds.has(p.id) && !pruneIds.has(p.id)
  );
  const projectedFinal = mergeGroups.length + passthrough.length;

  const config: MergeConfigFile = {
    generated_at: new Date().toISOString(),
    status: "proposed",
    summary: {
      current_patterns: patterns.length,
      merge_groups: mergeGroups.length,
      patterns_merged: patternsMerged,
      patterns_pruned: patternsPruned,
      projected_final: projectedFinal,
    },
    merge_groups: mergeGroups,
    prune_list: pruneList,
    prune_criteria: {
      description: `Pruned if case_count < ${PRUNE_CASE_THRESHOLD} AND most_recent_year < ${PRUNE_RECENCY_CUTOFF}`,
      case_count_threshold: PRUNE_CASE_THRESHOLD,
      recency_cutoff_year: PRUNE_RECENCY_CUTOFF,
    },
  };

  // Write config file
  writeJSONSafe(CONFIG_PATH, config);
  console.log(`Config written to: ${CONFIG_PATH}`);
  console.log("");

  // --- Print human-readable summary ---

  console.log("=".repeat(70));
  console.log("PATTERN CONDENSING PROPOSAL");
  console.log("=".repeat(70));
  console.log("");
  console.log(`Current patterns:    ${patterns.length}`);
  console.log(`Merge groups:        ${mergeGroups.length} (absorbing ${patternsMerged} source patterns)`);
  console.log(`Prune candidates:    ${patternsPruned}`);
  console.log(`Passthrough:         ${passthrough.length} (unchanged)`);
  console.log(`Projected final:     ${projectedFinal} patterns`);
  console.log(`Reduction:           ${patterns.length - projectedFinal} patterns removed (${((1 - projectedFinal / patterns.length) * 100).toFixed(1)}%)`);
  console.log("");

  // Merge groups table
  console.log("-".repeat(70));
  console.log("MERGE GROUPS");
  console.log("-".repeat(70));
  console.log("");

  for (let i = 0; i < mergeGroups.length; i++) {
    const mg = mergeGroups[i];
    console.log(
      `${String(i + 1).padStart(2)}. ${mg.target_name}`
    );
    console.log(
      `    Topic: ${mg.topic_area} | Cases: ${mg.estimated_unique_cases} | Variants: ${mg.variant_count} | Years: ${mg.year_range[0]}-${mg.year_range[1]}`
    );
    console.log(`    Merging ${mg.source_patterns.length} patterns:`);
    for (const name of mg.source_names) {
      console.log(`      - ${name}`);
    }
    console.log(`    Rationale: ${mg.rationale}`);
    console.log("");
  }

  // Prune candidates list
  console.log("-".repeat(70));
  console.log("PRUNE CANDIDATES");
  console.log(`(Criteria: case_count < ${PRUNE_CASE_THRESHOLD} AND most_recent_year < ${PRUNE_RECENCY_CUTOFF})`);
  console.log("-".repeat(70));
  console.log("");

  if (pruneList.length === 0) {
    console.log("  No patterns meet the prune criteria.");
  } else {
    for (const pe of pruneList) {
      const badge = pe.is_structural ? " [STRUCTURAL]" : "";
      console.log(
        `  - ${pe.pattern_name}${badge}: ${pe.case_count} cases, last seen ${pe.most_recent_year}`
      );
    }
  }
  console.log("");

  // Passthrough patterns
  console.log("-".repeat(70));
  console.log(`PASSTHROUGH (${passthrough.length} patterns unchanged)`);
  console.log("-".repeat(70));
  console.log("");

  for (const p of passthrough) {
    const badge = p.is_structural ? " [S]" : "";
    console.log(
      `  ${String(p.case_count).padStart(3)} cases | ${p.year_range[0]}-${p.most_recent_year} | ${p.name}${badge}`
    );
  }
  console.log("");

  console.log("=".repeat(70));
  console.log(
    `SUMMARY: ${patterns.length} -> ${projectedFinal} patterns (${mergeGroups.length} merge groups, ${patternsPruned} pruned)`
  );
  console.log("=".repeat(70));
  console.log("");
  console.log("Review the proposal above, then approve to proceed with Plan 07-02.");
  console.log(`Config file: ${CONFIG_PATH}`);
}

// --- CLI ---

const args = process.argv.slice(2);

if (args.includes("--propose")) {
  propose();
} else {
  console.log("Usage: npx tsx scripts/condense-patterns.ts --propose");
  console.log("");
  console.log("Modes:");
  console.log("  --propose  Analyze patterns and write merge/prune proposal");
  process.exit(1);
}
