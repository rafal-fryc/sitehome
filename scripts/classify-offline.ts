/**
 * classify-offline.ts
 *
 * Offline classification script that uses enhanced rule-based heuristics
 * to classify all 293 FTC case source files without requiring an external API.
 *
 * This is a fallback for when ANTHROPIC_API_KEY is not available.
 * It uses the same taxonomy and output format as classify-provisions.ts,
 * writing statutory_topics, practice_areas, remedy_types, and industry_sectors
 * directly into the source files.
 *
 * Usage:
 *   npx tsx scripts/classify-offline.ts
 *   npx tsx scripts/classify-offline.ts --dry-run
 */

import {
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
} from "fs";
import * as path from "path";
import type {
  StatutoryTopic,
  PracticeArea,
  RemedyType,
  IndustrySector,
} from "../src/types/ftc.js";

// ── Safe file write ─────────────────────────────────────────────────

function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // validates before writing
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}

// ── Idempotency check ───────────────────────────────────────────────

function isAlreadyClassified(caseData: any): boolean {
  return caseData?.case_info?.statutory_topics !== undefined;
}

// ── Statutory Topic Classification (from legal_authority + complaint) ─

function classifyStatutoryTopics(caseData: any): StatutoryTopic[] {
  const la = (caseData.case_info?.legal_authority ?? "").toLowerCase();
  const complaintCounts: string[] = (caseData.complaint?.counts ?? []).map(
    (c: any) => (c.title ?? "").toLowerCase()
  );
  const factual = (caseData.complaint?.factual_background ?? "").toLowerCase();
  const allText = [la, ...complaintCounts, factual].join(" ");

  const topics: Set<StatutoryTopic> = new Set();

  // COPPA
  if (
    allText.includes("coppa") ||
    allText.includes("children's online privacy protection") ||
    allText.includes("children's privacy") ||
    allText.includes("child-directed") ||
    allText.includes("child's personal information")
  ) {
    topics.add("COPPA");
  }

  // FCRA
  if (
    allText.includes("fcra") ||
    allText.includes("fair credit reporting") ||
    allText.includes("consumer report") ||
    allText.includes("credit report") ||
    allText.includes("background check")
  ) {
    topics.add("FCRA");
  }

  // GLBA
  if (
    allText.includes("glba") ||
    allText.includes("gramm-leach-bliley") ||
    allText.includes("financial modernization")
  ) {
    topics.add("GLBA");
  }

  // Health Breach Notification
  if (
    allText.includes("health breach notification") ||
    allText.includes("health breach rule")
  ) {
    topics.add("Health Breach Notification");
  }

  // CAN-SPAM
  if (allText.includes("can-spam")) {
    topics.add("CAN-SPAM");
  }

  // TCPA
  if (
    allText.includes("tcpa") ||
    allText.includes("telephone consumer protection")
  ) {
    topics.add("TCPA");
  }

  // TSR
  if (
    allText.includes("telemarketing sales rule") ||
    la.includes("tsr") ||
    allText.includes("telemarketing and consumer fraud")
  ) {
    topics.add("TSR");
  }

  // Default to Section 5 Only if no specific statute
  if (topics.size === 0) {
    topics.add("Section 5 Only");
  }

  return [...topics];
}

// ── Practice Area Classification ────────────────────────────────────

function classifyPracticeAreas(caseData: any): PracticeArea[] {
  const la = (caseData.case_info?.legal_authority ?? "").toLowerCase();
  const complaintTitles: string[] = (caseData.complaint?.counts ?? []).map(
    (c: any) => (c.title ?? "").toLowerCase()
  );
  const factual = (caseData.complaint?.factual_background ?? "").toLowerCase();
  const provisionTitles: string[] = (caseData.order?.provisions ?? []).map(
    (p: any) => ((p.title ?? "") + " " + (p.summary ?? "")).toLowerCase()
  );
  const allText = [la, ...complaintTitles, factual, ...provisionTitles].join(" ");

  const areas: Set<PracticeArea> = new Set();

  // Data Security
  if (
    allText.includes("data security") ||
    allText.includes("security breach") ||
    allText.includes("information security") ||
    allText.includes("security program") ||
    allText.includes("safeguard") ||
    allText.includes("unauthorized access") ||
    allText.includes("security practices") ||
    allText.includes("security failures") ||
    allText.includes("reasonably protect") ||
    allText.includes("comprehensive security")
  ) {
    areas.add("Data Security");
  }

  // AI / Automated Decision-Making
  if (
    allText.includes("algorithm") ||
    allText.includes("artificial intelligence") ||
    allText.includes("facial recognition") ||
    allText.includes("biometric") ||
    allText.includes("machine learning") ||
    allText.includes("automated decision") ||
    allText.includes("ai-powered") ||
    allText.includes("model destruction")
  ) {
    areas.add("AI / Automated Decision-Making");
  }

  // Surveillance
  if (
    allText.includes("surveillance") ||
    allText.includes("spyware") ||
    allText.includes("stalkerware") ||
    allText.includes("monitoring software") ||
    allText.includes("tracking") && allText.includes("without consent")
  ) {
    areas.add("Surveillance");
  }

  // Deceptive Design / Dark Patterns
  if (
    allText.includes("dark pattern") ||
    allText.includes("deceptive design") ||
    allText.includes("negative option") ||
    allText.includes("deceptive cancellation") ||
    allText.includes("trick") && allText.includes("consent")
  ) {
    areas.add("Deceptive Design / Dark Patterns");
  }

  // Telemarketing
  if (
    allText.includes("telemarketing") ||
    allText.includes("do-not-call") ||
    allText.includes("robocall") ||
    la.includes("tsr") ||
    allText.includes("telemarketing sales rule")
  ) {
    areas.add("Telemarketing");
  }

  // Financial Practices
  if (
    allText.includes("fcra") ||
    allText.includes("fair credit") ||
    allText.includes("glba") ||
    allText.includes("gramm-leach-bliley") ||
    allText.includes("lending") ||
    allText.includes("debt collection") ||
    allText.includes("payday") ||
    allText.includes("credit card") ||
    allText.includes("billing")
  ) {
    areas.add("Financial Practices");
  }

  // Privacy - ONLY when primary violation involves privacy misrepresentation
  // Not for cases that primarily concern specific statutes (COPPA, FCRA, GLBA)
  const primaryIsStatute =
    allText.includes("coppa") ||
    allText.includes("fcra") ||
    allText.includes("glba") ||
    allText.includes("telemarketing sales rule");

  if (
    !primaryIsStatute &&
    (allText.includes("privacy policy") ||
      allText.includes("privacy practices") ||
      allText.includes("deceptive privacy") ||
      allText.includes("privacy misrepresentation") ||
      (allText.includes("privacy") &&
        (allText.includes("personal information") ||
          allText.includes("consumer data") ||
          allText.includes("tracking"))))
  ) {
    areas.add("Privacy");
  }

  // If still empty, check if it's primarily a privacy case that isn't caught above
  if (areas.size === 0) {
    // Check for generic privacy signals without the statute exclusion
    if (
      allText.includes("privacy") ||
      allText.includes("personal information") ||
      allText.includes("consumer data")
    ) {
      areas.add("Privacy");
    } else {
      areas.add("Other");
    }
  }

  return [...areas];
}

// ── Industry Sector Classification ──────────────────────────────────

function classifyIndustrySectors(caseData: any): IndustrySector[] {
  const businessDesc = (
    caseData.case_info?.business_description ??
    caseData.case_info?.company?.business_description ??
    ""
  ).toLowerCase();
  const companyName = (caseData.case_info?.company?.name ?? "").toLowerCase();
  const factual = (caseData.complaint?.factual_background ?? "").toLowerCase();
  const allText = [businessDesc, companyName, factual].join(" ");

  const sectors: Set<IndustrySector> = new Set();

  // Technology
  if (
    allText.includes("software") ||
    allText.includes("app") ||
    allText.includes("technology company") ||
    allText.includes("tech") ||
    allText.includes("platform") ||
    allText.includes("digital") ||
    allText.includes("online service") ||
    allText.includes("internet") ||
    allText.includes("cloud") ||
    allText.includes("saas") ||
    allText.includes("data analytics")
  ) {
    sectors.add("Technology");
  }

  // Social Media
  if (
    allText.includes("social media") ||
    allText.includes("social network") ||
    allText.includes("facebook") ||
    allText.includes("twitter") ||
    allText.includes("instagram") ||
    allText.includes("tiktok") ||
    allText.includes("youtube") ||
    allText.includes("snapchat") ||
    allText.includes("user-generated content")
  ) {
    sectors.add("Social Media");
  }

  // Healthcare
  if (
    allText.includes("health") ||
    allText.includes("medical") ||
    allText.includes("hospital") ||
    allText.includes("pharmaceutical") ||
    allText.includes("drug") ||
    allText.includes("patient") ||
    allText.includes("doctor") ||
    allText.includes("clinical") ||
    allText.includes("telehealth") ||
    allText.includes("fertility") ||
    allText.includes("mental health") ||
    allText.includes("therapy")
  ) {
    sectors.add("Healthcare");
  }

  // Financial Services
  if (
    allText.includes("bank") ||
    allText.includes("financial") ||
    allText.includes("lending") ||
    allText.includes("credit") ||
    allText.includes("mortgage") ||
    allText.includes("loan") ||
    allText.includes("insurance") ||
    allText.includes("payment") ||
    allText.includes("fintech") ||
    allText.includes("investment") ||
    allText.includes("debt")
  ) {
    sectors.add("Financial Services");
  }

  // Retail
  if (
    allText.includes("retail") ||
    allText.includes("e-commerce") ||
    allText.includes("ecommerce") ||
    allText.includes("online store") ||
    allText.includes("shopping") ||
    allText.includes("consumer goods") ||
    allText.includes("marketplace") ||
    allText.includes("sells products") ||
    allText.includes("merchant")
  ) {
    sectors.add("Retail");
  }

  // Telecom
  if (
    allText.includes("telecom") ||
    allText.includes("wireless") ||
    allText.includes("cable") ||
    allText.includes("broadband") ||
    allText.includes("phone service") ||
    allText.includes("carrier") ||
    allText.includes("cellular") ||
    allText.includes("voip")
  ) {
    sectors.add("Telecom");
  }

  // Education
  if (
    allText.includes("education") ||
    allText.includes("school") ||
    allText.includes("student") ||
    allText.includes("learning") ||
    allText.includes("university") ||
    allText.includes("academic") ||
    allText.includes("tutoring") ||
    allText.includes("educational")
  ) {
    sectors.add("Education");
  }

  // Default if nothing matched
  if (sectors.size === 0) {
    sectors.add("Other");
  }

  return [...sectors];
}

// ── Provision-Level Classification ─────────────────────────────────

interface ProvisionClassification {
  provision_number: string;
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  remedy_types: RemedyType[];
}

function classifyProvision(
  provision: any,
  caseStatutoryTopics: StatutoryTopic[],
  casePracticeAreas: PracticeArea[]
): ProvisionClassification {
  const cat = (provision.category ?? "").toLowerCase();
  const title = (provision.title ?? "").toLowerCase();
  const summary = (provision.summary ?? "").toLowerCase();
  const allText = [cat, title, summary].join(" ");

  // Remedy types
  const remedyTypes: Set<RemedyType> = new Set();

  if (cat === "assessment" || allText.includes("third-party assessment") || allText.includes("biennial assessment")) {
    remedyTypes.add("Third-Party Assessment");
  }
  if (cat === "compliance_reporting" || cat === "monitoring" || allText.includes("compliance report")) {
    remedyTypes.add("Compliance Monitoring");
  }
  if (cat === "recordkeeping" || allText.includes("recordkeeping") || allText.includes("record keeping")) {
    remedyTypes.add("Recordkeeping");
  }
  if (cat === "acknowledgment") {
    // Acknowledgments are structural, tag as Other
    remedyTypes.add("Other");
  }
  if (cat === "duration") {
    remedyTypes.add("Other");
  }

  // Prohibition subtypes
  if (cat === "prohibition" || allText.includes("prohibition") || allText.includes("prohibited") || allText.includes("shall not")) {
    if (allText.includes("facial recognition") || allText.includes("biometric")) {
      remedyTypes.add("Biometric Ban");
    } else if (allText.includes("algorithm") || allText.includes("model destruction") || allText.includes("destroy") && allText.includes("model")) {
      remedyTypes.add("Algorithmic Destruction");
    } else {
      remedyTypes.add("Prohibition");
    }
  }

  // Affirmative obligation subtypes
  if (cat === "affirmative_obligation" || allText.includes("shall") || allText.includes("required") || allText.includes("must")) {
    if (allText.includes("civil penalty") || allText.includes("monetary") || allText.includes("judgment") || allText.includes("$") || allText.includes("payment") || allText.includes("pay")) {
      remedyTypes.add("Monetary Penalty");
    }
    if (allText.includes("delet") || allText.includes("dispose") || allText.includes("destroy") && !allText.includes("model")) {
      remedyTypes.add("Data Deletion");
    }
    if (
      allText.includes("security program") ||
      allText.includes("information security") ||
      allText.includes("safeguard") ||
      allText.includes("comprehensive security") ||
      allText.includes("privacy program")
    ) {
      remedyTypes.add("Comprehensive Security Program");
    }
  }

  if (remedyTypes.size === 0) {
    remedyTypes.add("Other");
  }

  // Provision-level practice areas — inherit from case with local refinement
  const provAreas: Set<PracticeArea> = new Set();
  if (allText.includes("security") || allText.includes("safeguard") || allText.includes("breach")) {
    provAreas.add("Data Security");
  }
  if (allText.includes("algorithm") || allText.includes("artificial intelligence") || allText.includes("biometric") || allText.includes("facial recognition")) {
    provAreas.add("AI / Automated Decision-Making");
  }
  if (allText.includes("telemarketing") || allText.includes("do-not-call") || allText.includes("robocall")) {
    provAreas.add("Telemarketing");
  }
  if (allText.includes("privacy") || allText.includes("personal information") || allText.includes("consumer data") || allText.includes("tracking")) {
    provAreas.add("Privacy");
  }
  if (provAreas.size === 0) {
    // Inherit case-level practice areas
    for (const area of casePracticeAreas) {
      provAreas.add(area);
    }
  }

  return {
    provision_number: provision.provision_number,
    statutory_topics: [...caseStatutoryTopics], // Provisions inherit case-level topics
    practice_areas: [...provAreas],
    remedy_types: [...remedyTypes],
  };
}

// ── Main loop ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const DRY_RUN = process.argv.includes("--dry-run");
  const DATA_DIR = path.resolve("public/data/ftc-files");

  if (DRY_RUN) {
    console.log("=== DRY RUN MODE (first 5 files only) ===\n");
  }

  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const filesToProcess = DRY_RUN ? files.slice(0, 5) : files;

  let classified = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of filesToProcess) {
    const filePath = path.join(DATA_DIR, filename);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);

      if (isAlreadyClassified(data)) {
        console.log(`SKIP ${filename} (already classified)`);
        skipped++;
        continue;
      }

      // Classify at case level
      const statutoryTopics = classifyStatutoryTopics(data);
      const practiceAreas = classifyPracticeAreas(data);
      const industrySectors = classifyIndustrySectors(data);

      // Classify at provision level
      const provisions = data.order?.provisions ?? [];
      const provisionClassifications = provisions.map((p: any) =>
        classifyProvision(p, statutoryTopics, practiceAreas)
      );

      // Apply classification to data
      const result = JSON.parse(JSON.stringify(data));
      result.case_info.statutory_topics = statutoryTopics;
      result.case_info.practice_areas = practiceAreas;
      result.case_info.industry_sectors = industrySectors;

      for (const prov of result.order?.provisions ?? []) {
        const match = provisionClassifications.find(
          (pc: ProvisionClassification) => pc.provision_number === prov.provision_number
        );
        if (match) {
          prov.statutory_topics = match.statutory_topics;
          prov.practice_areas = match.practice_areas;
          prov.remedy_types = match.remedy_types;
        } else {
          prov.statutory_topics = prov.statutory_topics ?? [];
          prov.practice_areas = prov.practice_areas ?? [];
          prov.remedy_types = prov.remedy_types ?? [];
        }
      }

      if (DRY_RUN) {
        console.log(`--- ${filename} ---`);
        console.log(`  Topics: ${statutoryTopics.join(", ")}`);
        console.log(`  Areas: ${practiceAreas.join(", ")}`);
        console.log(`  Sectors: ${industrySectors.join(", ")}`);
        console.log(`  Provisions: ${provisions.length}`);
        console.log("");
      }

      if (!DRY_RUN) {
        writeJSONSafe(filePath, result);
      }

      console.log(
        `OK   ${filename} — topics: ${statutoryTopics.join(", ")}`
      );
      classified++;
    } catch (err) {
      console.error(`ERR  ${filename}: ${err}`);
      errors++;
    }
  }

  console.log(
    `\nDone: ${classified} classified, ${skipped} skipped, ${errors} errors`
  );

  if (errors > files.length * 0.05) {
    console.error(
      `\nWARNING: Error rate exceeds 5% (${errors}/${files.length}). Review errors above.`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
