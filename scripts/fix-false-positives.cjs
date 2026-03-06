/**
 * fix-false-positives.cjs
 *
 * Applies targeted fixes for confirmed false positives from the line-number
 * cleanup operation. Uses the false-positives-final.json report as input.
 *
 * Usage: node scripts/fix-false-positives.cjs [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");
const report = require(path.join(ROOT, "false-positives-final.json"));

console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
console.log(`Processing ${report.confirmedFalsePositives} false positives in ${report.filesAffected} files...\n`);

// Group FPs by file
const byFile = {};
for (const fp of report.falsePositives) {
  if (!byFile[fp.filePath]) byFile[fp.filePath] = [];
  byFile[fp.filePath].push(fp);
}

let filesFixed = 0;
let totalFixes = 0;
let errors = [];

for (const [filePath, fps] of Object.entries(byFile)) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`File not found: ${filePath}`);
    continue;
  }

  // Read file as raw string to do text replacements
  let content = fs.readFileSync(fullPath, "utf8");
  let modified = false;
  let fileFixes = 0;

  // Sort FPs by search string length (longest first) to avoid partial matches
  const sortedFps = [...fps].sort(
    (a, b) =>
      (b.searchReplace?.search?.length || 0) -
      (a.searchReplace?.search?.length || 0)
  );

  // Deduplicate search/replace ops for this file
  const opsApplied = new Set();

  for (const fp of sortedFps) {
    if (!fp.searchReplace) continue;

    const { search, replace } = fp.searchReplace;
    const opKey = `${search}→${replace}`;

    if (opsApplied.has(opKey)) continue;
    opsApplied.add(opKey);

    // Count occurrences before replacing
    const count = (content.match(new RegExp(escapeRegex(search), "g")) || [])
      .length;

    if (count === 0) {
      // Pattern not found — might have been fixed already or context mismatch
      continue;
    }

    content = content.split(search).join(replace);
    modified = true;
    fileFixes += count;
    totalFixes += count;

    console.log(
      `  ${path.basename(filePath)}: "${search}" → "${replace}" (${count}x)`
    );
  }

  if (modified) {
    // Validate JSON before writing
    try {
      JSON.parse(content);
    } catch (e) {
      errors.push(`JSON validation failed after fixes for ${filePath}: ${e.message}`);
      console.error(`  ⚠ JSON INVALID after fixes: ${filePath} — skipping write`);
      continue;
    }

    if (!DRY_RUN) {
      fs.writeFileSync(fullPath, content, "utf8");
    }
    filesFixed++;
    console.log(
      `  → ${path.basename(filePath)}: ${fileFixes} fixes applied${DRY_RUN ? " (dry run)" : ""}`
    );
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Files fixed: ${filesFixed}`);
console.log(`Total replacements: ${totalFixes}`);
if (errors.length > 0) {
  console.log(`\nErrors (${errors.length}):`);
  for (const err of errors) console.log(`  - ${err}`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
