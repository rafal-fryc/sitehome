/**
 * clean-line-numbers.ts
 *
 * Removes court document line numbers from provision verbatim_text fields.
 * Court PDFs include line numbers (1-28 per page) that get captured during extraction,
 * both at the start of lines and embedded mid-line.
 *
 * Rules:
 *   - Strip `^\d{1,2} ` when NOT followed by `.` or `)` (start-of-line court numbers)
 *   - Remove mid-line court numbers ` N ` (1-28) with context-aware false-positive protection
 *   - Remove page-break header fragments (Case X:XX-cv-XXXXX ... Page N of M)
 *   - Remove trailing orphan line numbers before newlines
 *   - Collapse double-blank lines and double spaces
 *
 * Usage: npx tsx scripts/clean-line-numbers.ts [--dry-run] [--verbose]
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROVISIONS_DIR = join(__dirname, "..", "public", "data", "provisions");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// Page-break header embedded in text
const PAGE_HEADER_RE =
  /\s*-?\d*-?\s*Case \d+:\d+-\w+-\d+.*?Page \d+ of \d+.*?(?:\n|$)/g;

// STIPULATED ... CASE NO. header fragments
const STIPULATED_RE = /\s*STIPULATED.*?CASE NO\..*?(?:\n|$)/gi;

interface Provision {
  provision_number: string;
  verbatim_text: string;
  [key: string]: unknown;
}

interface ShardFile {
  topic: string;
  provisions: Provision[];
  [key: string]: unknown;
}

/**
 * Remove a single mid-line court line number, checking surrounding context
 * to avoid removing legitimate numbers like "within 30 days" or "Section 5".
 */
function removeMidLineNumbers(text: string): string {
  return text.replace(/ (\d{1,2}) /g, (match, numStr, offset) => {
    const n = parseInt(numStr, 10);

    // Court line numbers are 1-28 only
    if (n < 1 || n > 28) return match;

    const before = text.slice(Math.max(0, offset - 60), offset);
    const after = text.slice(offset + match.length, offset + match.length + 40);

    // --- Protect legitimate numbers ---

    // Followed by U.S.C., C.F.R., business, calendar, days
    if (/^(?:U\.S\.C|C\.F\.R|business|calendar|days?\b)/.test(after)) return match;

    // Followed by closing paren
    if (/^\)/.test(after)) return match;

    // Preceded by § or $
    if (/[§$]$/.test(before)) return match;

    // Preceded by opening paren
    if (/\($/.test(before)) return match;

    // Preceded by temporal/quantity keywords — only words that ALWAYS take a number
    if (/\b(?:within|before|least|over|than|approximately|about)\s*$/i.test(before)) return match;

    // "after N days/months/years" is legitimate, but "after N the" is a line number
    // "for N years/days" is legitimate, but "for N the" is a line number
    // "to N business" is legitimate, but "to N identify" is a line number
    // Protect only when followed by a time/quantity word
    if (/\b(?:after|for|to|next|first|last)\s*$/i.test(before) &&
        /^(?:days?|months?|years?|weeks?|hours?|minutes?|business|calendar|consecutive|additional)\b/i.test(after)) return match;

    // "following N days" is legitimate, "following N information" is a line number
    if (/\bfollowing\s*$/i.test(before) &&
        /^(?:days?|months?|years?|weeks?|business|calendar|conditions?|requirements?|provisions?)\b/i.test(after)) return match;

    // "every N months/years" is legitimate, "every N twelve" is a line number
    if (/\b(?:every|each)\s*$/i.test(before) &&
        /^(?:days?|months?|years?|weeks?|business|calendar|such|other)\b/i.test(after)) return match;

    // Preceded by section-type keywords
    if (/\b(?:Section|Sections|Provision|Provisions|Paragraph|Paragraphs|Subsection|Part|Rule|Rules|Exhibit|Schedule|Article|subpart|Clause|Title|Chapter|Count|Counts|Item|sub-Provision)\s*$/i.test(before)) return match;

    // "and/or" only protected in number-to-number contexts ("Sections 9 and 20")
    // A digit must appear nearby before "and/or"
    if (/\band\s*$/i.test(before) && /\d\s+and\s*$/.test(before)) return match;
    if (/\bor\s*$/i.test(before) && /\d\s+or\s*$/.test(before)) return match;

    // Followed by "and \d" or "or \d" (part of a number range)
    if (/^and\s+\d/i.test(after)) return match;
    if (/^or\s+\d/i.test(after)) return match;

    // Preceded by digit+comma (number list: "29, 30")
    if (/\d,\s*$/.test(before)) return match;

    // Preceded by digit+hyphen or followed by hyphen+digit (ranges: "10-15")
    if (/\d-$/.test(before) || /^-\d/.test(after)) return match;

    // Followed by percent or other unit indicators
    if (/^[%]/.test(after)) return match;

    // It's a court line number — replace " N " with " "
    return " ";
  });
}

function cleanVerbatimText(text: string, caseId?: string, provNum?: string): string {
  // Step 1: Remove page-break header lines
  let cleaned = text.replace(PAGE_HEADER_RE, "\n");
  cleaned = cleaned.replace(STIPULATED_RE, "\n");

  // Step 2: Strip leading court line numbers per line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.replace(/^\d{1,2} (?![.)])/, ""))
    .join("\n");

  // Step 3: Remove mid-line court line numbers (iterate until stable)
  let prev = "";
  let iterations = 0;
  while (prev !== cleaned && iterations < 5) {
    prev = cleaned;
    cleaned = removeMidLineNumbers(cleaned);
    iterations++;
  }

  // Step 4: Remove trailing orphan line numbers before newlines
  // e.g., "that protects 26 27 28\n\n" → "that protects\n\n"
  cleaned = cleaned.replace(/ (\d{1,2})(?=\s*\n|$)/gm, (match, numStr) => {
    const n = parseInt(numStr, 10);
    return n >= 1 && n <= 28 ? "" : match;
  });

  // Step 5: Collapse double spaces and double blank lines
  cleaned = cleaned.replace(/ {2,}/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  if (VERBOSE && cleaned !== text.trim()) {
    // Show a few diffs for verification
    const origLines = text.split("\n");
    const cleanLines = cleaned.split("\n");
    for (let i = 0; i < Math.min(origLines.length, 3); i++) {
      if (origLines[i] !== cleanLines[i]) {
        console.log(`  [${caseId}] ${provNum}:`);
        console.log(`    BEFORE: "${origLines[i].slice(0, 120)}"`);
        console.log(`    AFTER:  "${(cleanLines[i] || "").slice(0, 120)}"`);
        break;
      }
    }
  }

  return cleaned;
}

function main() {
  const files = readdirSync(PROVISIONS_DIR).filter(
    (f) => f.endsWith(".json") && f !== "manifest.json"
  );

  let totalFiles = 0;
  let totalProvisions = 0;
  let totalProvisionsModified = 0;

  for (const file of files) {
    const filePath = join(PROVISIONS_DIR, file);
    const data: ShardFile = JSON.parse(readFileSync(filePath, "utf8"));
    let fileModified = false;
    let fileProvisionsModified = 0;

    for (const provision of data.provisions) {
      const original = provision.verbatim_text;
      if (!original) continue;

      const cleaned = cleanVerbatimText(original, (provision as any).case_id, provision.provision_number);

      if (cleaned !== original) {
        provision.verbatim_text = cleaned;
        fileModified = true;
        fileProvisionsModified++;
        totalProvisionsModified++;
      }

      totalProvisions++;
    }

    if (fileModified) {
      totalFiles++;
      if (!DRY_RUN) {
        writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      }
    }

    if (fileProvisionsModified > 0) {
      console.log(`  ${file}: ${fileProvisionsModified} provisions cleaned`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`Files modified: ${totalFiles} / ${files.length}`);
  console.log(`Provisions modified: ${totalProvisionsModified} / ${totalProvisions}`);
}

main();
