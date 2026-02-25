import * as fs from "fs";
import * as path from "path";

// Inline types to avoid tsx path alias issues (same pattern as build-provisions.ts)

interface ProvisionRecord {
  provision_number: string;
  title: string;
  category: string;
  summary: string;
  verbatim_text: string;
  violation_type: "deceptive" | "unfair" | "both" | "";
  statutory_topics: string[];
  practice_areas: string[];
  remedy_types: string[];
  case_id: string;
  company_name: string;
  date_issued: string;
  year: number;
  administration: string;
  legal_authority: string;
  ftc_url?: string;
  docket_number: string;
}

interface ProvisionShardFile {
  topic: string;
  generated_at: string;
  total_provisions: number;
  provisions: ProvisionRecord[];
}

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

// --- Helpers ---

function normalizeForGrouping(title: string): string {
  return title
    .toLowerCase()
    .replace(/[—–\-]/g, " ") // Normalize dashes to spaces
    .replace(/[^a-z0-9\s]/g, "") // Strip punctuation
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

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

const STRUCTURAL_CATEGORIES = new Set([
  "compliance_reporting",
  "acknowledgment",
  "recordkeeping",
  "monitoring",
  "duration",
]);

// --- Main ---

const PROVISIONS_DIR = path.resolve("public/data/provisions");
const OUT_FILE = path.resolve("public/data/ftc-patterns.json");

console.log("Building cross-case pattern groups...");
console.log(`Source: ${PROVISIONS_DIR}`);

if (!fs.existsSync(PROVISIONS_DIR)) {
  console.error(`ERROR: Provisions directory not found: ${PROVISIONS_DIR}`);
  process.exit(1);
}

// Step 1: Read all statutory topic provision shards (exclude pa-* and rt-* to avoid double-counting)
const shardFiles = fs
  .readdirSync(PROVISIONS_DIR)
  .filter(
    (f) =>
      f.endsWith("-provisions.json") &&
      !f.startsWith("pa-") &&
      !f.startsWith("rt-")
  );

console.log(
  `Found ${shardFiles.length} statutory shard files: ${shardFiles.join(", ")}`
);

// Step 2: Collect all provisions, deduplicating by composite key
const seen = new Set<string>();
const allProvisions: ProvisionRecord[] = [];

for (const file of shardFiles) {
  const filepath = path.join(PROVISIONS_DIR, file);
  const shard: ProvisionShardFile = JSON.parse(
    fs.readFileSync(filepath, "utf-8")
  );

  for (const prov of shard.provisions) {
    const key = `${prov.case_id}__${prov.provision_number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    allProvisions.push(prov);
  }
}

console.log(
  `Loaded ${allProvisions.length} unique provisions (deduplicated from ${shardFiles.length} shards)`
);

// Step 3: Pass 1 — Group by normalized title
interface RawGroup {
  normalizedTitle: string;
  provisions: ProvisionRecord[];
  titles: Map<string, number>; // original title -> count
  cases: Set<string>;
}

const groups = new Map<string, RawGroup>();

for (const prov of allProvisions) {
  const norm = normalizeForGrouping(prov.title);
  if (!groups.has(norm)) {
    groups.set(norm, {
      normalizedTitle: norm,
      provisions: [],
      titles: new Map(),
      cases: new Set(),
    });
  }
  const g = groups.get(norm)!;
  g.provisions.push(prov);
  g.titles.set(prov.title, (g.titles.get(prov.title) || 0) + 1);
  g.cases.add(prov.case_id);
}

console.log(`Pass 1 (exact normalized): ${groups.size} unique groups`);

// Step 4: Pass 2 — Prefix merge for orphans (groups with < 3 unique cases)
// Sort groups by case count descending so large groups are checked as targets first
const sortedKeys = [...groups.keys()].sort((a, b) => {
  const ga = groups.get(a)!;
  const gb = groups.get(b)!;
  return gb.cases.size - ga.cases.size;
});

let mergeCount = 0;

for (const smallKey of sortedKeys) {
  const small = groups.get(smallKey);
  if (!small || small.cases.size >= 3) continue; // Only merge small groups

  for (const largeKey of sortedKeys) {
    if (largeKey === smallKey) continue;
    const large = groups.get(largeKey);
    if (!large || large.cases.size < 3) continue;

    // Check if small title starts with large title (minimum 3 words in prefix)
    const largeWords = largeKey.split(" ");
    if (largeWords.length >= 3 && smallKey.startsWith(largeKey + " ")) {
      // Merge small into large
      for (const p of small.provisions) {
        large.provisions.push(p);
        large.titles.set(p.title, (large.titles.get(p.title) || 0) + 1);
        large.cases.add(p.case_id);
      }
      groups.delete(smallKey);
      mergeCount++;
      break;
    }
  }
}

console.log(
  `Pass 2 (prefix merge): merged ${mergeCount} orphan groups into larger parents`
);

// Step 5: Filter to groups with 3+ unique cases
const qualifiedGroups = [...groups.values()].filter(
  (g) => g.cases.size >= 3
);

console.log(
  `After filtering (3+ cases): ${qualifiedGroups.length} pattern groups`
);

// Step 6: Build PatternGroup objects
const patternGroups: PatternGroup[] = qualifiedGroups.map((g) => {
  // Pattern name: most common original title variant
  let bestTitle = "";
  let bestCount = 0;
  for (const [title, count] of g.titles.entries()) {
    if (count > bestCount) {
      bestTitle = title;
      bestCount = count;
    }
  }

  // Pattern ID: slugified name
  const id = slugify(bestTitle);

  // Structural classification: >50% of provisions in structural categories
  const structuralCount = g.provisions.filter((p) =>
    STRUCTURAL_CATEGORIES.has(p.category)
  ).length;
  const isStructural = structuralCount > g.provisions.length * 0.5;

  // Year range
  const years = g.provisions.map((p) => p.year).filter((y) => !isNaN(y));
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Collect enforcement topics and practice areas
  const topicsSet = new Set<string>();
  const areasSet = new Set<string>();
  for (const p of g.provisions) {
    for (const t of p.statutory_topics) topicsSet.add(t);
    for (const a of p.practice_areas) areasSet.add(a);
  }

  // Sort variants by date_issued ascending (chronological)
  const sortedProvisions = [...g.provisions].sort((a, b) =>
    a.date_issued.localeCompare(b.date_issued)
  );

  // Build PatternVariant objects
  // For patterns with <= 30 variants: include full verbatim_text
  // For patterns with 30+ variants: full text only for the 30 most recent, empty for older ones
  const variantCount = sortedProvisions.length;
  const fullTextCutoff =
    variantCount > 30 ? variantCount - 30 : 0;

  const variants: PatternVariant[] = sortedProvisions.map((p, idx) => ({
    case_id: p.case_id,
    company_name: p.company_name,
    date_issued: p.date_issued,
    year: p.year,
    provision_number: p.provision_number,
    title: p.title,
    text_preview: p.verbatim_text.substring(0, 300),
    verbatim_text: idx >= fullTextCutoff ? p.verbatim_text : "",
    docket_number: p.docket_number,
    ftc_url: p.ftc_url,
    administration: p.administration,
  }));

  return {
    id,
    name: bestTitle,
    is_structural: isStructural,
    case_count: g.cases.size,
    variant_count: variantCount,
    year_range: [minYear, maxYear] as [number, number],
    most_recent_year: maxYear,
    enforcement_topics: [...topicsSet].sort(),
    practice_areas: [...areasSet].sort(),
    variants,
  };
});

// Step 7: Sort pattern groups by most_recent_year descending (default recency sort)
patternGroups.sort((a, b) => {
  if (b.most_recent_year !== a.most_recent_year)
    return b.most_recent_year - a.most_recent_year;
  return b.case_count - a.case_count; // Tiebreak by case count
});

// Step 8: Build output
const totalVariants = patternGroups.reduce(
  (sum, g) => sum + g.variant_count,
  0
);

const output: PatternsFile = {
  generated_at: new Date().toISOString(),
  total_patterns: patternGroups.length,
  total_variants: totalVariants,
  patterns: patternGroups,
};

// Step 9: Write output
writeJSONSafe(OUT_FILE, output);

const fileSizeKB = (
  Buffer.byteLength(JSON.stringify(output, null, 2), "utf-8") / 1024
).toFixed(1);

// Step 10: Print summary report
console.log("");
console.log("=".repeat(60));
console.log("PATTERN DETECTION SUMMARY");
console.log("=".repeat(60));
console.log(`Total pattern groups: ${patternGroups.length}`);
console.log(`Total variants: ${totalVariants}`);
console.log(`Output file: ${OUT_FILE}`);
console.log(`Output size: ${fileSizeKB} KB`);
console.log("");

// Structural vs substantive breakdown
const structuralPatterns = patternGroups.filter((p) => p.is_structural);
const substantivePatterns = patternGroups.filter((p) => !p.is_structural);
console.log(
  `Structural patterns: ${structuralPatterns.length} (${((structuralPatterns.length / patternGroups.length) * 100).toFixed(1)}%)`
);
console.log(
  `Substantive patterns: ${substantivePatterns.length} (${((substantivePatterns.length / patternGroups.length) * 100).toFixed(1)}%)`
);
console.log("");

// Top 10 patterns by case count
console.log("Top 10 patterns by case count:");
console.log("-".repeat(60));
const top10 = [...patternGroups]
  .sort((a, b) => b.case_count - a.case_count)
  .slice(0, 10);
for (const p of top10) {
  const badge = p.is_structural ? " [STRUCTURAL]" : "";
  const name = p.name.length > 50 ? p.name.substring(0, 47) + "..." : p.name;
  console.log(
    `  ${String(p.case_count).padStart(3)} cases | ${p.year_range[0]}-${p.year_range[1]} | ${name}${badge}`
  );
}

console.log("");
console.log("Done!");
