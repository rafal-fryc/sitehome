#!/usr/bin/env node
/**
 * reclassify-remedy-other.ts
 *
 * Phase 6: Remedy Reclassification
 *
 * Usage:
 *   npx tsx scripts/reclassify-remedy-other.ts --propose
 *     Reads all "Other" provisions, prints a structured proposal for Claude
 *     to analyze and propose new remedy categories. No files are written.
 *
 *   npx tsx scripts/reclassify-remedy-other.ts --apply
 *     Reads scripts/remedy-approved-categories.json, then reads all "Other"
 *     provisions and prints them as a structured classification prompt for
 *     Claude to process. Claude outputs a JSON mapping, then the user
 *     confirms before source files are written.
 *
 * See: .planning/phases/06-remedy-reclassification/ for phase context.
 */

import { readFileSync, readdirSync, writeFileSync, renameSync } from "fs";
import * as path from "path";

// --- RemedyType enum (keep in sync with src/types/ftc.ts) ---
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
  | "Order Administration"
  | "Consumer Notification"
  | "Consumer Redress"
  | "Other";

// --- Paths ---
const DATA_DIR = path.resolve("public/data/ftc-files");
const PROPOSAL_FILE = path.resolve("scripts/remedy-proposal.json");
const APPROVED_FILE = path.resolve("scripts/remedy-approved-categories.json");

// --- Safe write (from classify-provisions.ts pattern) ---
function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // throws if invalid -- validates before write
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}

// --- Load all purely-Other provisions ---
interface OtherProvision {
  filename: string;
  provision_number: string;
  title: string;
  summary: string;
  category: string; // structural category field (e.g., "duration", "acknowledgment")
}

function loadOtherProvisions(): OtherProvision[] {
  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const results: OtherProvision[] = [];
  let mixedTagCount = 0;

  for (const filename of files) {
    const filePath = path.join(DATA_DIR, filename);
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const provisions: any[] = data.order?.provisions ?? [];

    for (const prov of provisions) {
      const remedies: string[] = prov.remedy_types ?? [];

      // Only purely-Other provisions -- not mixed-tagged (e.g., ["Recordkeeping", "Other"])
      if (remedies.length === 1 && remedies[0] === "Other") {
        results.push({
          filename,
          provision_number: prov.provision_number ?? "",
          title: prov.title ?? "",
          summary: (prov.summary ?? "").slice(0, 400),
          category: prov.category ?? "",
        });
      } else if (remedies.includes("Other") && remedies.length > 1) {
        mixedTagCount++;
      }
    }
  }

  console.log(`Found ${results.length} purely-Other provisions (in scope)`);
  console.log(
    `Found ${mixedTagCount} mixed-tagged provisions containing "Other" (out of scope -- not touched)`
  );

  return results;
}

// --- PROPOSE MODE ---
function runPropose(): void {
  console.log("\n=== PROPOSE MODE ===");
  console.log(
    "Reading all purely-Other provisions to generate a classification proposal.\n"
  );

  const provisions = loadOtherProvisions();

  // Write proposal file with all provisions for Claude to analyze
  const proposal = {
    generated_at: new Date().toISOString(),
    mode: "propose",
    total_other_provisions: provisions.length,
    instructions: [
      "Claude: Analyze the provisions below and propose 5-10 new remedy categories.",
      "Requirements:",
      "  - Use legal terminology matching the existing taxonomy style",
      "    (e.g., 'Monetary Penalty', 'Comprehensive Security Program')",
      "  - 'Order Administration' is already decided -- include it for structural provisions",
      "  - Categories should be at the same granularity as existing ones",
      "  - Target <5% remaining in 'Other' after reclassification",
      "  - The ~585 structural/administrative provisions map to 'Order Administration'",
      "  - Group structural provisions by category field: duration, acknowledgment,",
      "    recordkeeping-adjacent administrative, jurisdiction, service, modification",
      "Output format:",
      "  For each proposed category:",
      "    - Category name (legal terminology)",
      "    - Estimated count",
      "    - 3-5 example provision titles from the list below",
      "    - Brief description of what types of provisions it covers",
    ],
    provisions,
  };

  writeJSONSafe(PROPOSAL_FILE, proposal);

  console.log(`\nProposal data written to: ${PROPOSAL_FILE}`);
  console.log("\n--- WHAT TO DO NEXT ---");
  console.log("1. Claude (in Claude Code) will now analyze the proposal file.");
  console.log("2. Claude reads scripts/remedy-proposal.json and proposes categories.");
  console.log("3. Review the proposed categories and examples.");
  console.log("4. Edit scripts/remedy-approved-categories.json with your approved list.");
  console.log("5. Then run: npx tsx scripts/reclassify-remedy-other.ts --apply");
  console.log("\nApproved categories file format (create this file):");
  console.log(
    JSON.stringify(
      {
        approved_categories: [
          "Order Administration",
          "Consumer Notification",
          "CATEGORY_NAME_3",
          "CATEGORY_NAME_4",
          "CATEGORY_NAME_5",
        ],
        notes: "Edit this list after reviewing the --propose output",
      },
      null,
      2
    )
  );
}

// --- APPLY MODE ---
function runApply(): void {
  console.log("\n=== APPLY MODE ===");

  // Load approved categories
  let approvedConfig: { approved_categories: string[] };
  try {
    approvedConfig = JSON.parse(readFileSync(APPROVED_FILE, "utf-8"));
  } catch {
    console.error(`ERROR: Cannot read ${APPROVED_FILE}`);
    console.error("Run --propose first, then create the approved categories file.");
    process.exit(1);
  }

  const approvedCategories = approvedConfig.approved_categories;
  console.log(`\nApproved categories (${approvedCategories.length}):`);
  approvedCategories.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));

  const provisions = loadOtherProvisions();

  // Build a structured prompt for Claude to classify each provision
  console.log(`\n--- CLASSIFICATION PROMPT FOR CLAUDE ---`);
  console.log(
    "Claude: Classify each provision below into exactly ONE of the approved categories."
  );
  console.log("\nApproved categories:", approvedCategories.join(", "));
  console.log("\nRules:");
  console.log(
    "  - Return exactly one category string per provision (not an array)"
  );
  console.log(
    "  - If ambiguous, choose the primary enforcement intent"
  );
  console.log(
    "  - Provisions about duration, acknowledgment, service, modification, jurisdiction -> Order Administration"
  );
  console.log(
    "  - Truly unique provisions with no clear fit -> Other"
  );
  console.log(
    "  - Output format: JSON object mapping 'filename|provision_number' to category string"
  );
  console.log("\nProvisions to classify:");
  provisions.forEach((p) => {
    const key = `${p.filename}|${p.provision_number}`;
    console.log(`\n[${key}]`);
    console.log(`  title: ${p.title}`);
    console.log(`  category_field: ${p.category}`);
    console.log(`  summary: ${p.summary.slice(0, 200)}`);
  });

  console.log("\n--- AFTER CLAUDE OUTPUTS CLASSIFICATION JSON ---");
  console.log(
    "Save the JSON output to scripts/remedy-approved-categories.json under key 'classifications',"
  );
  console.log("then run this script again with --write to apply changes.");
  console.log(
    "(Or proceed to manual write step as directed by the executor plan.)"
  );
}

// ─── WRITE MODE ────────────────────────────────────────────────────────────
function runWrite(): void {
  console.log("\n=== WRITE MODE ===");

  // Load approved categories + classifications
  let config: {
    approved_categories: string[];
    classifications: Record<string, string>; // "filename|provision_number" -> category
  };
  try {
    config = JSON.parse(readFileSync(APPROVED_FILE, "utf-8"));
  } catch {
    console.error(`ERROR: Cannot read ${APPROVED_FILE}`);
    console.error("Run --apply first, have Claude output the classification JSON,");
    console.error("then add it to remedy-approved-categories.json under 'classifications'.");
    process.exit(1);
  }

  const { approved_categories, classifications } = config;

  if (!classifications || Object.keys(classifications).length === 0) {
    console.error("ERROR: No 'classifications' key found in remedy-approved-categories.json");
    console.error("Add Claude's classification output under the 'classifications' key.");
    process.exit(1);
  }

  // Validate all mapped categories are approved
  const unapproved = Object.entries(classifications)
    .filter(([, cat]) => cat !== "Other" && !approved_categories.includes(cat))
    .map(([key, cat]) => `${key} -> "${cat}"`);

  if (unapproved.length > 0) {
    console.error("ERROR: Unapproved categories found in classifications:");
    unapproved.forEach((u) => console.error(`  ${u}`));
    console.error("Fix the classifications to use only approved category names.");
    process.exit(1);
  }

  // Count results by category
  const categoryCounts: Record<string, number> = {};
  for (const cat of Object.values(classifications)) {
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  // Print summary
  console.log("\n--- CLASSIFICATION SUMMARY ---");
  console.log("New category assignments:");
  Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count} provisions`));

  const otherCount = categoryCounts["Other"] ?? 0;
  const totalClassified = Object.keys(classifications).length;
  const pctOther = ((otherCount / totalClassified) * 100).toFixed(1);
  console.log(`\n  TOTAL classified: ${totalClassified}`);
  console.log(`  Remaining "Other": ${otherCount} (${pctOther}% -- target <5%)`);

  if (otherCount > totalClassified * 0.05) {
    console.warn(
      `\nWARNING: "Other" bucket is ${pctOther}% -- above the 5% target.`
    );
    console.warn(
      "Consider reviewing flagged provisions or adding a category before proceeding."
    );
  }

  // Confirm before write
  console.log("\n--- CONFIRM WRITE ---");
  console.log("About to write changes to source files in public/data/ftc-files/.");
  console.log(
    "This will update remedy_types for the classified provisions above."
  );
  console.log("\nProceed? (This confirmation is shown to the user -- await explicit approval.)");
  console.log("When approved by user, the executor continues to the write step.");
}

// ─── WRITE-APPLY MODE ──────────────────────────────────────────────────────
function runWriteApply(): void {
  console.log("\n=== WRITE-APPLY MODE ===");

  // Load approved categories + classifications
  const config = JSON.parse(readFileSync(APPROVED_FILE, "utf-8"));
  const classifications: Record<string, string> = config.classifications;

  // Group classifications by filename
  const byFile: Record<string, Record<string, string>> = {};
  for (const [key, cat] of Object.entries(classifications)) {
    const [filename, provision_number] = key.split("|");
    if (!byFile[filename]) byFile[filename] = {};
    byFile[filename][provision_number] = cat;
  }

  // Apply to each file
  let filesModified = 0;
  let provisionsUpdated = 0;
  let skipped = 0;

  for (const [filename, reclassifications] of Object.entries(byFile)) {
    const filePath = path.join(DATA_DIR, filename);
    let data: any;
    try {
      data = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
      console.warn(`SKIP FILE: Cannot read ${filename}`);
      continue;
    }
    const provisions: any[] = data.order?.provisions ?? [];

    let changed = false;
    for (const prov of provisions) {
      const newCat = reclassifications[prov.provision_number];
      if (newCat !== undefined) {
        // Validate: provision must currently be purely "Other"
        const current: string[] = prov.remedy_types ?? [];
        if (!(current.length === 1 && current[0] === "Other")) {
          console.warn(
            `SKIP: ${filename}|${prov.provision_number} is not purely-Other (${JSON.stringify(current)}) -- skipping`
          );
          skipped++;
          continue;
        }
        prov.remedy_types = [newCat]; // single value, still an array
        provisionsUpdated++;
        changed = true;
      }
    }

    if (changed) {
      writeJSONSafe(filePath, data);
      filesModified++;
    }
  }

  console.log(`\nWRITE COMPLETE:`);
  console.log(`  Files modified: ${filesModified}`);
  console.log(`  Provisions updated: ${provisionsUpdated}`);
  if (skipped > 0) {
    console.log(`  Skipped (not purely-Other): ${skipped}`);
  }
}

// --- Entry point ---
const mode = process.argv[2];

if (mode === "--propose") {
  runPropose();
} else if (mode === "--apply") {
  runApply();
} else if (mode === "--write") {
  runWrite();
} else if (mode === "--write-apply") {
  runWriteApply();
} else {
  console.error("Usage:");
  console.error(
    "  npx tsx scripts/reclassify-remedy-other.ts --propose       # Step 1-2: analyze and propose categories"
  );
  console.error(
    "  npx tsx scripts/reclassify-remedy-other.ts --apply        # Step 4-5: classify provisions (after approval)"
  );
  console.error(
    "  npx tsx scripts/reclassify-remedy-other.ts --write        # Step 5: show summary, confirm before write"
  );
  console.error(
    "  npx tsx scripts/reclassify-remedy-other.ts --write-apply  # Step 6: apply classifications to source files"
  );
  process.exit(1);
}
