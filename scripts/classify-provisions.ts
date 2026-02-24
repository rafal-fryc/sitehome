/**
 * classify-provisions.ts
 *
 * One-time classification agent script that reads all FTC case source files,
 * invokes Claude Sonnet to classify each case, and writes statutory topic,
 * practice area, remedy type, and industry sector tags back into source files.
 *
 * Usage:
 *   npx tsx scripts/classify-provisions.ts          # Full run
 *   npx tsx scripts/classify-provisions.ts --dry-run # Process first 3 files only, print prompts
 *
 * Requires ANTHROPIC_API_KEY environment variable.
 */

import Anthropic from "@anthropic-ai/sdk";
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

// ── SDK initialization ──────────────────────────────────────────────

const anthropic = new Anthropic();
// Uses ANTHROPIC_API_KEY env var automatically.
// In Claude Code sessions (Max subscription), this is provided automatically.

// ── Local types ─────────────────────────────────────────────────────

interface ClassificationResult {
  case_statutory_topics: StatutoryTopic[];
  case_practice_areas: PracticeArea[];
  case_industry_sectors: IndustrySector[];
  provisions: Array<{
    provision_number: string;
    statutory_topics: StatutoryTopic[];
    practice_areas: PracticeArea[];
    remedy_types: RemedyType[];
  }>;
}

// ── Rule-based hint builders ────────────────────────────────────────
// These are INPUTS to the LLM prompt, not final answers.

function deriveStatutoryTopicHints(legal_authority: string): string[] {
  const la = legal_authority.toLowerCase();
  const hints: string[] = [];

  if (la.includes("coppa") || la.includes("children's online privacy protection")) {
    hints.push("COPPA");
  }
  if (la.includes("fcra") || la.includes("fair credit reporting")) {
    hints.push("FCRA");
  }
  if (
    la.includes("glba") ||
    la.includes("gramm-leach-bliley") ||
    la.includes("financial modernization")
  ) {
    hints.push("GLBA");
  }
  if (la.includes("health breach notification")) {
    hints.push("Health Breach Notification");
  }
  if (la.includes("can-spam")) {
    hints.push("CAN-SPAM");
  }
  if (la.includes("tcpa") || la.includes("telephone consumer protection")) {
    hints.push("TCPA");
  }
  if (la.includes("telemarketing sales rule") || la.includes("tsr")) {
    hints.push("TSR");
  }

  if (hints.length === 0) {
    hints.push("Section 5 Only");
  }

  return hints;
}

function deriveRemedyTypeHints(category: string, title: string): string[] {
  const cat = category.toLowerCase();
  const t = title.toLowerCase();
  const hints: string[] = [];

  if (cat === "assessment") {
    hints.push("Third-Party Assessment");
  } else if (cat === "compliance_reporting" || cat === "monitoring") {
    hints.push("Compliance Monitoring");
  } else if (cat === "recordkeeping" || cat === "acknowledgment") {
    hints.push("Recordkeeping");
  } else if (cat === "prohibition") {
    if (t.includes("facial recognition") || t.includes("biometric")) {
      hints.push("Biometric Ban");
    } else if (t.includes("algorithm") || t.includes("model destruction")) {
      hints.push("Algorithmic Destruction");
    } else {
      hints.push("Prohibition");
    }
  } else if (cat === "affirmative_obligation") {
    if (t.includes("civil penalty") || t.includes("monetary") || t.includes("judgment")) {
      hints.push("Monetary Penalty");
    } else if (t.includes("deletion") || t.includes("dispose") || t.includes("destroy")) {
      hints.push("Data Deletion");
    } else if (
      t.includes("security program") ||
      t.includes("information security") ||
      t.includes("safeguard")
    ) {
      hints.push("Comprehensive Security Program");
    }
    // else: leave empty, let LLM decide
  } else if (cat === "duration") {
    hints.push("Other");
  }

  return hints;
}

// ── Prompt builder ──────────────────────────────────────────────────

function buildClassificationPrompt(
  caseData: any,
  businessDescription: string,
  statutoryHints: string[],
  provisionHints: Array<{ provision_number: string; remedy_hints: string[] }>
): string {
  const caseInfo = caseData.case_info ?? {};
  const companyName = caseInfo.company?.name ?? "Unknown";
  const dateIssued = caseInfo.date_issued
    ? caseInfo.date_issued
    : caseInfo.case_date
      ? `${caseInfo.case_date.month ?? "?"}/${caseInfo.case_date.year ?? "?"}`
      : "Unknown";
  const legalAuthority = caseInfo.legal_authority ?? "Unknown";
  const provisions: any[] = caseData.order?.provisions ?? [];

  const provisionBlock = provisions
    .map((p: any) => {
      const hintEntry = provisionHints.find(
        (h) => h.provision_number === p.provision_number
      );
      const remedyHintStr =
        hintEntry && hintEntry.remedy_hints.length > 0
          ? `\n      Rule-based remedy hint: ${hintEntry.remedy_hints.join(", ")}. Please verify.`
          : "";
      return `    - Provision ${p.provision_number}: "${p.title ?? ""}"
      Category: ${p.category ?? "unknown"}
      Summary: ${(p.summary ?? "").slice(0, 300)}${remedyHintStr}`;
    })
    .join("\n");

  return `You are classifying an FTC enforcement action for a legal provisions library.

CASE INFORMATION:
  Company: ${companyName}
  Date: ${dateIssued}
  Legal Authority: ${legalAuthority}
  Company business description: ${businessDescription || "Not provided."}

PROVISIONS:
${provisionBlock}

RULE-BASED ANALYSIS (verify and correct if needed):
  Based on the legal_authority field, rule-based analysis suggests these statutory topics: ${statutoryHints.join(", ")}.

CLASSIFICATION INSTRUCTIONS:
Classify this case and each provision using ONLY the enum values listed below. Multi-tag when multiple apply.

Valid StatutoryTopics: COPPA, FCRA, GLBA, Health Breach Notification, CAN-SPAM, TCPA, TSR, Section 5 Only
Valid PracticeAreas: Privacy, Data Security, Deceptive Design / Dark Patterns, AI / Automated Decision-Making, Surveillance, Financial Practices, Telemarketing, Other
Valid RemedyTypes: Monetary Penalty, Data Deletion, Comprehensive Security Program, Third-Party Assessment, Algorithmic Destruction, Biometric Ban, Compliance Monitoring, Recordkeeping, Prohibition, Other
Valid IndustrySectors: Technology, Healthcare, Financial Services, Retail, Telecom, Education, Social Media, Other

IMPORTANT NOTES:
- "Privacy" as a practice area should be reserved for cases where the PRIMARY violation involves misrepresentation about privacy practices. If the case primarily concerns a specific statute (COPPA, FCRA, GLBA), its practice area should reflect that domain, not "Privacy" generically.
- Industry sector should be inferred primarily from the business description, not from the company name alone.
- case_statutory_topics should be the UNION of all provision-level statutory_topics.
- For affirmative_obligation provisions, examine the title and summary carefully to distinguish Monetary Penalty vs Data Deletion vs Comprehensive Security Program vs other remedy types.

Return ONLY valid JSON matching the structure below. Do not include explanation. Use only the enum values listed.

{
  "case_statutory_topics": ["..."],
  "case_practice_areas": ["..."],
  "case_industry_sectors": ["..."],
  "provisions": [
    {
      "provision_number": "...",
      "statutory_topics": ["..."],
      "practice_areas": ["..."],
      "remedy_types": ["..."]
    }
  ]
}`;
}

// ── LLM call function ───────────────────────────────────────────────

async function classifyWithLLM(prompt: string): Promise<ClassificationResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present (```json ... ```)
  const cleaned = text
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*$/m, "")
    .trim();

  return JSON.parse(cleaned) as ClassificationResult;
}

// ── Apply classification to case data ───────────────────────────────

function applyClassification(
  caseData: any,
  result: ClassificationResult
): any {
  // Deep clone to avoid mutation issues
  const data = JSON.parse(JSON.stringify(caseData));

  // Set case-level tags
  data.case_info.statutory_topics = result.case_statutory_topics;
  data.case_info.practice_areas = result.case_practice_areas;
  data.case_info.industry_sectors = result.case_industry_sectors;

  // Set provision-level tags
  const provisions: any[] = data.order?.provisions ?? [];
  for (const prov of provisions) {
    const match = result.provisions.find(
      (r) => r.provision_number === prov.provision_number
    );
    if (match) {
      prov.statutory_topics = match.statutory_topics;
      prov.practice_areas = match.practice_areas;
      prov.remedy_types = match.remedy_types;
    } else {
      // Default to empty arrays if no matching provision in result
      console.warn(
        `  WARN: No classification result for provision ${prov.provision_number}`
      );
      prov.statutory_topics = prov.statutory_topics ?? [];
      prov.practice_areas = prov.practice_areas ?? [];
      prov.remedy_types = prov.remedy_types ?? [];
    }
  }

  return data;
}

// ── Safe file write (prevents source file corruption) ───────────────

function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // throws if invalid -- validates before writing
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}

// ── Idempotency check ───────────────────────────────────────────────

function isAlreadyClassified(caseData: any): boolean {
  return caseData?.case_info?.statutory_topics !== undefined;
}

// ── Main loop ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const DRY_RUN = process.argv.includes("--dry-run");
  const DATA_DIR = path.resolve("public/data/ftc-files");

  if (DRY_RUN) {
    console.log("=== DRY RUN MODE (first 3 files only) ===\n");
  }

  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const filesToProcess = DRY_RUN ? files.slice(0, 3) : files;

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

      // Extract business_description for industry sector inference (locked CONTEXT.md decision)
      const businessDescription = data.case_info?.business_description
        ?? data.case_info?.company?.business_description
        ?? "";

      // Build hints for this case
      const statutoryHints = deriveStatutoryTopicHints(
        data.case_info?.legal_authority ?? ""
      );
      const provisionHints = (data.order?.provisions ?? []).map((p: any) => ({
        provision_number: p.provision_number as string,
        remedy_hints: deriveRemedyTypeHints(p.category ?? "", p.title ?? ""),
      }));

      const prompt = buildClassificationPrompt(
        data,
        businessDescription,
        statutoryHints,
        provisionHints
      );

      if (DRY_RUN) {
        console.log(`--- PROMPT for ${filename} ---`);
        console.log(prompt.slice(0, 2000));
        console.log("...\n");
      }

      const result = await classifyWithLLM(prompt);

      if (DRY_RUN) {
        console.log(`--- RESULT for ${filename} ---`);
        console.log(JSON.stringify(result, null, 2));
        console.log("");
      }

      const classifiedData = applyClassification(data, result);

      if (!DRY_RUN) {
        writeJSONSafe(filePath, classifiedData);
      }

      console.log(
        `OK   ${filename} — topics: ${result.case_statutory_topics.join(", ")}`
      );
      classified++;

      // Rate-limiting pause between API calls (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`ERR  ${filename}: ${err}`);
      errors++;
    }
  }

  console.log(
    `\nDone: ${classified} classified, ${skipped} skipped, ${errors} errors`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
