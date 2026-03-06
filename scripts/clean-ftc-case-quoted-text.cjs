/**
 * clean-ftc-case-quoted-text.js
 *
 * Removes court document line numbers from `quoted_text` fields in FTC case files.
 * Applies the same cleaning rules as clean-line-numbers.ts (which handles provisions).
 *
 * Target fields:
 *   - complaint.representations_made[].quoted_text
 *   - order.provisions[].requirements[].quoted_text
 *
 * Usage: node scripts/clean-ftc-case-quoted-text.js [--dry-run] [--verbose]
 */

const fs = require("fs");
const path = require("path");

const FTC_DIR = path.join(__dirname, "..", "public", "data", "ftc-files");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// Accept specific files via --files arg (comma-separated filenames)
const filesArgIdx = process.argv.indexOf("--files");
const SPECIFIC_FILES = filesArgIdx !== -1 ? process.argv[filesArgIdx + 1].split(",") : null;

// --- Cleaning regexes (same as clean-line-numbers.ts) ---

// Page-break header embedded in text
const PAGE_HEADER_RE =
  /\s*-?\d*-?\s*Case \d+:\d+-\w+-\d+.*?Page \d+ of \d+.*?(?:\n|$)/g;

// STIPULATED ... CASE NO. header fragments
const STIPULATED_RE = /\s*STIPULATED.*?CASE NO\..*?(?:\n|$)/gi;

/**
 * Remove a single mid-line court line number, checking surrounding context
 * to avoid removing legitimate numbers like "within 30 days" or "Section 5".
 */
function removeMidLineNumbers(text) {
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

    // Preceded by temporal/quantity keywords
    if (/\b(?:within|before|least|over|than|approximately|about)\s*$/i.test(before)) return match;

    // "after N days/months/years" etc.
    if (/\b(?:after|for|to|next|first|last)\s*$/i.test(before) &&
        /^(?:days?|months?|years?|weeks?|hours?|minutes?|business|calendar|consecutive|additional)\b/i.test(after)) return match;

    // "following N days" etc.
    if (/\bfollowing\s*$/i.test(before) &&
        /^(?:days?|months?|years?|weeks?|business|calendar|conditions?|requirements?|provisions?)\b/i.test(after)) return match;

    // "every N months/years" etc.
    if (/\b(?:every|each)\s*$/i.test(before) &&
        /^(?:days?|months?|years?|weeks?|business|calendar|such|other)\b/i.test(after)) return match;

    // Preceded by section-type keywords
    if (/\b(?:Section|Sections|Provision|Provisions|Paragraph|Paragraphs|Subsection|Part|Rule|Rules|Exhibit|Schedule|Article|subpart|Clause|Title|Chapter|Count|Counts|Item|sub-Provision)\s*$/i.test(before)) return match;

    // "and/or" in number-to-number contexts
    if (/\band\s*$/i.test(before) && /\d\s+and\s*$/.test(before)) return match;
    if (/\bor\s*$/i.test(before) && /\d\s+or\s*$/.test(before)) return match;

    // Followed by "and \d" or "or \d"
    if (/^and\s+\d/i.test(after)) return match;
    if (/^or\s+\d/i.test(after)) return match;

    // Preceded by digit+comma
    if (/\d,\s*$/.test(before)) return match;

    // Preceded by digit+hyphen or followed by hyphen+digit
    if (/\d-$/.test(before) || /^-\d/.test(after)) return match;

    // Followed by percent
    if (/^[%]/.test(after)) return match;

    // It's a court line number — replace " N " with " "
    return " ";
  });
}

function cleanQuotedText(text) {
  if (!text) return text;

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
  cleaned = cleaned.replace(/ (\d{1,2})(?=\s*\n|$)/gm, (match, numStr) => {
    const n = parseInt(numStr, 10);
    return n >= 1 && n <= 28 ? "" : match;
  });

  // Step 5: Collapse double spaces and double blank lines
  cleaned = cleaned.replace(/ {2,}/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

function main() {
  const files = SPECIFIC_FILES
    ? SPECIFIC_FILES.filter(f => fs.existsSync(path.join(FTC_DIR, f)))
    : fs.readdirSync(FTC_DIR).filter(f => f.endsWith(".json"));

  console.log(`Processing ${files.length} unmodified FTC case files...`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  let totalFiles = 0;
  let totalFieldsCleaned = 0;

  let parseErrors = [];

  for (const file of files) {
    const filePath = path.join(FTC_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      parseErrors.push(file);
      console.error(`  SKIP (JSON parse error): ${file}`);
      continue;
    }
    let fileModified = false;
    let fileCleaned = 0;

    // Clean complaint.representations_made[].quoted_text
    if (data.complaint && Array.isArray(data.complaint.representations_made)) {
      for (const rep of data.complaint.representations_made) {
        if (rep.quoted_text && typeof rep.quoted_text === "string") {
          const cleaned = cleanQuotedText(rep.quoted_text);
          if (cleaned !== rep.quoted_text) {
            rep.quoted_text = cleaned;
            fileModified = true;
            fileCleaned++;
          }
        }
      }
    }

    // Clean order.provisions[].requirements[].quoted_text
    if (data.order && Array.isArray(data.order.provisions)) {
      for (const prov of data.order.provisions) {
        if (Array.isArray(prov.requirements)) {
          for (const req of prov.requirements) {
            if (req.quoted_text && typeof req.quoted_text === "string") {
              const cleaned = cleanQuotedText(req.quoted_text);
              if (cleaned !== req.quoted_text) {
                req.quoted_text = cleaned;
                fileModified = true;
                fileCleaned++;
              }
            }
          }
        }
      }
    }

    if (fileModified) {
      totalFiles++;
      totalFieldsCleaned += fileCleaned;
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      }
      if (VERBOSE || fileCleaned > 0) {
        console.log(`  ${file}: ${fileCleaned} fields cleaned`);
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Files modified: ${totalFiles} / ${files.length}`);
  console.log(`Total quoted_text fields cleaned: ${totalFieldsCleaned}`);
  if (parseErrors.length > 0) {
    console.log(`Files with JSON parse errors (skipped): ${parseErrors.length}`);
    parseErrors.forEach(f => console.log(`  - ${f}`));
  }
}

main();
