import * as fs from "fs";
import * as path from "path";

// Inline types to avoid path alias issues in tsx scripts (same pattern as build-ftc-data.ts)

type StatutoryTopic =
  | "COPPA"
  | "FCRA"
  | "GLBA"
  | "Health Breach Notification"
  | "CAN-SPAM"
  | "TCPA"
  | "TSR"
  | "Section 5 Only";

type PracticeArea =
  | "Privacy"
  | "Data Security"
  | "Deceptive Design / Dark Patterns"
  | "AI / Automated Decision-Making"
  | "Surveillance"
  | "Financial Practices"
  | "Telemarketing"
  | "Other";

type RemedyType =
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

interface ProvisionRecord {
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

interface ProvisionShardFile {
  topic: string;
  generated_at: string;
  total_provisions: number;
  provisions: ProvisionRecord[];
}

// Administration ranges (same as build-ftc-data.ts)
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

// --- Helpers ---

function parseDateFromFilename(filename: string): string | null {
  // Match both original (MM.YY, ...) and sanitized (MM.YY_...) filename formats
  const match = filename.match(/^(\d{2})\.(\d{2})[,_]/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const yearShort = parseInt(match[2], 10);
  const year = yearShort >= 90 ? 1900 + yearShort : 2000 + yearShort;
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}-15`;
}

function resolveDateFromCaseDate(caseInfo: any): string | null {
  // Fallback: use case_date object { month, year } if available
  const cd = caseInfo.case_date;
  if (cd && cd.year && cd.month) {
    return `${cd.year}-${String(cd.month).padStart(2, "0")}-15`;
  }
  return null;
}

function resolveDateIssued(caseInfo: any, filename: string): string | null {
  let dateIssued = caseInfo.date_issued || "";
  if (!dateIssued || dateIssued.length < 7) {
    const fallback = parseDateFromFilename(filename);
    if (fallback) dateIssued = fallback;
    else {
      // Try case_date object as final fallback
      const caseDateFallback = resolveDateFromCaseDate(caseInfo);
      if (caseDateFallback) dateIssued = caseDateFallback;
      else return null;
    }
  }
  return dateIssued;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\//g, "-")
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

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

// --- Main ---

const FILES_DIR = path.resolve("public/data/ftc-files");
const OUT_DIR = path.resolve("public/data/provisions");

console.log("Building provision shard files...");
console.log(`Source: ${FILES_DIR}`);

if (!fs.existsSync(FILES_DIR)) {
  console.error(`ERROR: Source directory not found: ${FILES_DIR}`);
  process.exit(1);
}

const jsonFiles = fs.readdirSync(FILES_DIR).filter((f) => f.endsWith(".json"));
console.log(`Found ${jsonFiles.length} case files`);

// Accumulate provisions into topic and practice-area shards
const topicShards = new Map<string, ProvisionRecord[]>();
const practiceAreaShards = new Map<string, ProvisionRecord[]>();
let warnCount = 0;
let totalProvisions = 0;

for (const file of jsonFiles) {
  const filepath = path.join(FILES_DIR, file);
  let raw: any;
  try {
    raw = JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    console.warn(`  Skipping (parse error): ${file}`);
    continue;
  }

  const caseInfo = raw.case_info;
  if (!caseInfo) {
    console.warn(`  Skipping (no case_info): ${file}`);
    continue;
  }

  // Check if file has been classified
  if (caseInfo.statutory_topics === undefined) {
    console.warn(`WARN: ${file} not yet classified — run build:classify first`);
    warnCount++;
    continue;
  }

  // Resolve date
  const dateIssued = resolveDateIssued(caseInfo, file);
  if (!dateIssued) {
    console.warn(`  Skipping (no date): ${file}`);
    continue;
  }

  const year = parseInt(dateIssued.substring(0, 4), 10);
  if (isNaN(year)) continue;

  const caseId = caseInfo.id ?? sanitizeFilename(file.replace(".json", ""));
  const companyName = caseInfo.company?.name ?? caseInfo.company_name ?? "";
  const administration = caseInfo.administration ?? getAdministration(dateIssued);
  const legalAuthority = caseInfo.legal_authority ?? "";
  const ftcUrl = caseInfo.ftc_url;
  const docketNumber = caseInfo.docket_number ?? "";

  const provisions = raw.order?.provisions ?? [];

  for (const provision of provisions) {
    const record: ProvisionRecord = {
      provision_number: provision.provision_number,
      title: provision.title,
      category: provision.category,
      summary: provision.summary ?? "",
      statutory_topics: provision.statutory_topics ?? [],
      practice_areas: provision.practice_areas ?? [],
      remedy_types: provision.remedy_types ?? [],
      case_id: caseId,
      company_name: companyName,
      date_issued: dateIssued,
      year,
      administration,
      legal_authority: legalAuthority,
      ftc_url: ftcUrl,
      docket_number: docketNumber,
    };

    totalProvisions++;

    // Add to topic shards (provision appears in each of its statutory_topics)
    const provTopics: string[] = record.statutory_topics;
    if (provTopics.length === 0) {
      // Unclassified provisions go into "other" shard
      const slug = "other";
      if (!topicShards.has(slug)) topicShards.set(slug, []);
      topicShards.get(slug)!.push(record);
    } else {
      for (const topic of provTopics) {
        const slug = slugify(topic);
        if (!topicShards.has(slug)) topicShards.set(slug, []);
        topicShards.get(slug)!.push(record);
      }
    }

    // Add to practice-area shards
    const provAreas: string[] = record.practice_areas;
    if (provAreas.length === 0) {
      const slug = "other";
      if (!practiceAreaShards.has(slug)) practiceAreaShards.set(slug, []);
      practiceAreaShards.get(slug)!.push(record);
    } else {
      for (const area of provAreas) {
        const slug = slugify(area);
        if (!practiceAreaShards.has(slug)) practiceAreaShards.set(slug, []);
        practiceAreaShards.get(slug)!.push(record);
      }
    }
  }
}

// Create output directory
fs.mkdirSync(OUT_DIR, { recursive: true });

// Write shard files and collect stats for report
interface ShardStat {
  filename: string;
  provisions: number;
  bytes: number;
}

const shardStats: ShardStat[] = [];
let totalAcrossShards = 0;

// Write topic shards
for (const [slug, provisions] of topicShards.entries()) {
  const filename = `${slug}-provisions.json`;
  const shardFile: ProvisionShardFile = {
    topic: slug,
    generated_at: new Date().toISOString(),
    total_provisions: provisions.length,
    provisions,
  };

  const outPath = path.join(OUT_DIR, filename);
  writeJSONSafe(outPath, shardFile);

  const bytes = Buffer.byteLength(JSON.stringify(shardFile, null, 2), "utf-8");
  shardStats.push({ filename, provisions: provisions.length, bytes });
  totalAcrossShards += provisions.length;
}

// Write practice-area shards
for (const [slug, provisions] of practiceAreaShards.entries()) {
  const filename = `pa-${slug}-provisions.json`;
  const shardFile: ProvisionShardFile = {
    topic: slug,
    generated_at: new Date().toISOString(),
    total_provisions: provisions.length,
    provisions,
  };

  const outPath = path.join(OUT_DIR, filename);
  writeJSONSafe(outPath, shardFile);

  const bytes = Buffer.byteLength(JSON.stringify(shardFile, null, 2), "utf-8");
  shardStats.push({ filename, provisions: provisions.length, bytes });
  totalAcrossShards += provisions.length;
}

// Print summary report
console.log("");
console.log("Provisions build complete");
console.log("\u2500".repeat(50));

// Sort by provision count descending
shardStats.sort((a, b) => b.provisions - a.provisions);

for (const stat of shardStats) {
  const kb = (stat.bytes / 1024).toFixed(1);
  const name = stat.filename.padEnd(45);
  const count = String(stat.provisions).padStart(5);
  console.log(`${name} ${count} provisions  (${kb} KB)`);
}

console.log("\u2500".repeat(50));
console.log(
  `Total provisions across all shards: ${totalAcrossShards} (provisions appear in multiple shards if multi-tagged)`
);
console.log(`Unique provisions processed: ${totalProvisions}`);

if (warnCount > 0) {
  console.log("");
  console.log(
    `WARNING: ${warnCount} case file(s) were not yet classified. Run build:classify first.`
  );
  process.exit(1);
}

console.log("");
console.log("Done!");
