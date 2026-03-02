/**
 * generate-takeaways.ts
 *
 * Build-time script that generates plain-language takeaway summaries for each
 * FTC case file using Claude Sonnet. Produces a brief (1-sentence, card display)
 * and full (2-3 sentence, panel display) takeaway for each case.
 *
 * Follows the classify-provisions.ts pipeline pattern: sequential processing,
 * idempotency checks, atomic file writes, dry-run support.
 *
 * Usage:
 *   npx tsx scripts/generate-takeaways.ts          # Full run (all ~293 files)
 *   npx tsx scripts/generate-takeaways.ts --dry-run # Process 10 sample cases, print prompts + results
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

// ── SDK initialization ──────────────────────────────────────────────

const anthropic = new Anthropic();
// Uses ANTHROPIC_API_KEY env var automatically.

// ── Local types ─────────────────────────────────────────────────────

interface TakeawayResult {
  brief: string;
  full: string;
}

// ── Representative sample IDs for dry-run (TAKE-05) ─────────────────
// Mix of: COPPA, data security, surveillance, TSR/financial, edge cases,
// different violation types (deceptive, unfair, both), old vs recent cases.

const SAMPLE_IDS = [
  "12.25_disney",                              // COPPA, Technology, recent (2025), both
  "07.19_equifax",                             // Data security, Financial Services, complex (2019)
  "12.24_gravy_analytics",                     // Surveillance, recent (2024)
  "01.05_assail",                              // TSR/GLBA, old (2005), both
  "10.20_ntt_global_data_centers_americas",    // Edge case: no factual_background
  "05.24_betterhelp",                          // Health data, Privacy (2024)
  "01.24_epic_games",                          // Dark patterns, Technology (2024)
  "09.19_google_llc_and_youtube",              // COPPA, Social Media (2019)
  "10.18_uber_technologies",                   // Data security, unfair (2018)
  "04.22_credit_bureau_center",                // FCRA, Financial Services (2022)
];

// ── Prompt builder ──────────────────────────────────────────────────

function buildTakeawayPrompt(caseData: any): string {
  const caseInfo = caseData.case_info ?? {};
  const complaint = caseData.complaint ?? {};
  const provisions = caseData.order?.provisions ?? [];

  const companyName = caseInfo.company?.name ?? "Unknown";
  const year = caseInfo.case_date?.year ?? "Unknown";
  const violationType = caseInfo.violation_type ?? "Unknown";
  const legalAuthority = caseInfo.legal_authority ?? "Unknown";

  const factualBackground = complaint.factual_background || "Not available.";

  const representationDescs = (complaint.representations_made ?? [])
    .map((r: any) => `- ${r.description}`)
    .join("\n");

  const countTitles = (complaint.counts ?? [])
    .map((c: any) => `- ${c.title}`)
    .join("\n");

  const provisionBlock = provisions
    .map((p: any) => `- ${p.title ?? "Untitled"}: ${(p.summary ?? "").slice(0, 200)}`)
    .join("\n");

  return `You are summarizing an FTC enforcement action for legal practitioners.

CASE DATA:
  Company: ${companyName}
  Year: ${year}
  Violation type: ${violationType}
  Legal authority: ${legalAuthority}

COMPLAINT BACKGROUND:
${factualBackground}

REPRESENTATIONS MADE:
${representationDescs || "None listed."}

COMPLAINT COUNTS:
${countTitles || "None listed."}

ORDER PROVISION TITLES AND SUMMARIES:
${provisionBlock || "None listed."}

INSTRUCTIONS:
Generate two summaries of this case.

1. "brief": One sentence (15-25 words) describing ONLY what the business did wrong.
   - Focus on the violation, not the remedy.
   - Use plain practitioner English -- direct and factual.

2. "full": A short paragraph (2-3 sentences) covering what went wrong AND what the FTC ordered.
   - First sentence: what the business did wrong.
   - Remaining sentences: what the FTC required (drawn from provision titles).
   - Plain English, no legalese.

EXAMPLES:
Brief example: "Charged consumers without consent using dark patterns and retaliated against chargeback disputes."
Full example: "The company deceived consumers about how it collected and used personal data, including precise geolocation. The FTC required deletion of illegally collected data, a comprehensive privacy program, and third-party assessments for 20 years."

CRITICAL CONSTRAINTS:
- ONLY state facts that are directly derivable from the data above.
- Do NOT invent specific dollar amounts, dates, or statute section numbers unless they appear in the data.
- Do NOT name statutes not listed in the legal authority field.
- Do NOT speculate about consumer harm beyond what the complaint describes.
- If data is sparse, write a shorter, more general summary rather than fabricating details.

Return ONLY valid JSON:
{
  "brief": "...",
  "full": "..."
}`;
}

// ── LLM call function ───────────────────────────────────────────────

async function generateTakeaway(prompt: string): Promise<TakeawayResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 512,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present (```json ... ```)
  const cleaned = text
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*$/m, "")
    .trim();

  return JSON.parse(cleaned) as TakeawayResult;
}

// ── Post-generation validation (TAKE-04) ─────────────────────────────

function validateTakeaway(
  filename: string,
  result: TakeawayResult,
  inputData: string
): void {
  // Word count check on brief
  const wordCount = result.brief.split(/\s+/).length;
  if (wordCount > 30) {
    console.log(`WARN ${filename}: brief has ${wordCount} words (expected 15-30)`);
  }

  // Check for dollar signs in output not in input
  if (result.brief.includes("$") || result.full.includes("$")) {
    if (!inputData.includes("$")) {
      console.log(`WARN ${filename}: output contains '$' not found in input data`);
    }
  }

  // Check for 4-digit year patterns in output not present in input
  const outputYears = new Set(
    [...(result.brief + " " + result.full).matchAll(/\b(19|20)\d{2}\b/g)].map(
      (m) => m[0]
    )
  );
  for (const year of outputYears) {
    if (!inputData.includes(year)) {
      console.log(
        `WARN ${filename}: output contains year ${year} not found in input data`
      );
    }
  }
}

// ── Safe file write (prevents source file corruption) ────────────────

function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // throws if invalid -- validates before writing
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}

// ── Idempotency check ────────────────────────────────────────────────

function isAlreadyProcessed(caseData: any): boolean {
  return caseData?.takeaway_brief !== undefined;
}

// ── Main loop ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const DRY_RUN = process.argv.includes("--dry-run");
  const DATA_DIR = path.resolve("public/data/ftc-files");

  if (DRY_RUN) {
    console.log("=== DRY RUN MODE (10 sample cases) ===\n");
  }

  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const filesToProcess = DRY_RUN
    ? files.filter((f) =>
        SAMPLE_IDS.some((id) => f === id + ".json")
      )
    : files;

  if (DRY_RUN) {
    console.log(`Selected ${filesToProcess.length} sample files:\n${filesToProcess.join("\n")}\n`);
  }

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of filesToProcess) {
    const filePath = path.join(DATA_DIR, filename);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);

      if (isAlreadyProcessed(data)) {
        console.log(`SKIP ${filename} (already has takeaway)`);
        skipped++;
        continue;
      }

      const prompt = buildTakeawayPrompt(data);

      if (DRY_RUN) {
        console.log(`--- PROMPT for ${filename} (first 1500 chars) ---`);
        console.log(prompt.slice(0, 1500));
        console.log("...\n");
      }

      const result = await generateTakeaway(prompt);

      // Build input data string for validation
      const inputDataStr = JSON.stringify(data);
      validateTakeaway(filename, result, inputDataStr);

      if (DRY_RUN) {
        console.log(`--- RESULT for ${filename} ---`);
        console.log(JSON.stringify(result, null, 2));
        console.log(`  brief word count: ${result.brief.split(/\s+/).length}`);
        console.log("");
      }

      // Apply takeaways at top level of case JSON (NOT inside case_info)
      data.takeaway_brief = result.brief;
      data.takeaway_full = result.full;

      if (!DRY_RUN) {
        writeJSONSafe(filePath, data);
      }

      console.log(
        `OK   ${filename} -- brief: ${result.brief.substring(0, 60)}...`
      );
      generated++;

      // Rate-limiting pause between API calls (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`ERR  ${filename}: ${err}`);
      errors++;
    }
  }

  console.log(
    `\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
