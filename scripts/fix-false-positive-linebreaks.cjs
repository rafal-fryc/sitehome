/**
 * fix-false-positive-linebreaks.cjs
 *
 * Fixes false-positive \n\n insertions in quoted_text fields.
 * The previous formatting pass correctly added line breaks before list items
 * (A., B., 1., 2., etc.) but also incorrectly split legal abbreviations,
 * addresses, and citations.
 *
 * Known false-positive patterns:
 * 1. D.C.\n\n20580 — FTC address "Washington, D.C. 20580"
 * 2. Fed.\n\nR. Civ.\n\nP. — Federal Rules citation
 * 3. U.S.\n\nC. — U.S. Code citation
 * 4. U.\n\nC. — OCR artifact (assail.json)
 * 5. Paragraph IV.\n\nB. of — cross-reference split
 */

const fs = require("fs");
const path = require("path");

const FTC_DIR = path.join(__dirname, "..", "public", "data", "ftc-files");

// Get all JSON files in ftc-files directory
const files = fs.readdirSync(FTC_DIR).filter(f => f.endsWith(".json") && !f.endsWith(".attempted"));

let totalFixed = 0;
let filesFixed = 0;
const details = [];

function fixFalsePositiveBreaks(text) {
  if (!text || typeof text !== "string" || !text.includes("\n")) return text;

  let fixed = text;
  const fixes = [];

  // Pattern 1: D.C.\n\n2XXXX → D.C. 2XXXX
  // Washington D.C. address split at the zip code (20580 FTC, 20530 DOJ, etc.)
  if (/D\.C\.\n\n2\d{4}/.test(fixed)) {
    fixed = fixed.replace(/D\.C\.\n\n(2\d{4})/g, "D.C. $1");
    fixes.push("D.C. zip");
  }

  // Pattern 2: Fed.\n\nR. Civ.\n\nP. → Fed. R. Civ. P.
  // Federal Rules of Civil Procedure citation
  if (fixed.includes("Fed.\n\nR. Civ.\n\nP.")) {
    fixed = fixed.replace(/Fed\.\n\nR\. Civ\.\n\nP\./g, "Fed. R. Civ. P.");
    fixes.push("Fed. R. Civ. P.");
  }
  // Also handle partial variants: Fed.\n\nR. (where Civ. P. wasn't split)
  if (fixed.includes("Fed.\n\nR. Civ. P.")) {
    fixed = fixed.replace(/Fed\.\n\nR\. Civ\. P\./g, "Fed. R. Civ. P.");
    fixes.push("Fed. R. (partial)");
  }
  // OCR variant: "Fed.\n\nR. Civ ..\n\nP." (extra space and period)
  if (fixed.includes("Fed.\n\nR. Civ ..")) {
    fixed = fixed.replace(/Fed\.\n\nR\. Civ \.\.\n\nP\./g, "Fed. R. Civ. P.");
    fixes.push("Fed. R. Civ. P. (OCR variant)");
  }
  // OCR variant: "Fed.\n\nR. Cir.\n\nP." (Cir instead of Civ)
  if (fixed.includes("Fed.\n\nR. Cir.")) {
    fixed = fixed.replace(/Fed\.\n\nR\. Cir\.\n\nP\./g, "Fed. R. Cir. P.");
    fixes.push("Fed. R. Cir. P. (OCR variant)");
  }

  // Pattern 3: U.S.\n\nC. → U.S.C.
  // U.S. Code citation
  if (fixed.includes("U.S.\n\nC.")) {
    fixed = fixed.replace(/U\.S\.\n\nC\./g, "U.S.C.");
    fixes.push("U.S.C.");
  }

  // Pattern 4: U.\n\nC. → U.C.
  // OCR artifact in assail.json (15 U.\n\nC. → 15 U.C.)
  if (fixed.includes("U.\n\nC.")) {
    fixed = fixed.replace(/U\.\n\nC\./g, "U.C.");
    fixes.push("U.C.");
  }

  // Pattern 5: Cross-reference splits
  // "Paragraph IV.\n\nB. of this order" → "Paragraph IV.B. of this order"
  // Only merge when what follows is clearly a sub-reference (e.g., ". of this order")
  fixed = fixed.replace(
    /Paragraph\s+([IVX]+)\.\n\n([A-Z])\.\s+of\s+(this|the)\s+order/g,
    "Paragraph $1.$2. of $3 order"
  );
  if (fixed !== text && fixes.length === 0) fixes.push("Paragraph cross-ref");

  // Pattern 6: "Part [Roman].\n\n[Letter]. of this order" → similar cross-ref
  fixed = fixed.replace(
    /Part\s+([IVX]+)\.\n\n([A-Z])\.\s+of\s+(this|the)\s+order/g,
    "Part $1.$2. of $3 order"
  );

  return { text: fixed, fixes };
}

function processQuotedTexts(obj, filePath) {
  let fileFixCount = 0;

  // Process order.provisions[].requirements[].quoted_text
  const provisions = obj.order?.provisions || [];
  for (const prov of provisions) {
    const reqs = prov.requirements || [];
    for (const req of reqs) {
      if (req.quoted_text && req.quoted_text.includes("\n")) {
        const result = fixFalsePositiveBreaks(req.quoted_text);
        if (result.text !== req.quoted_text) {
          req.quoted_text = result.text;
          fileFixCount++;
          details.push({
            file: path.basename(filePath),
            provision: prov.title || prov.category,
            fixes: result.fixes,
          });
        }
      }
    }
  }

  // Process complaint.representations_made[].quoted_text
  const reps = obj.complaint?.representations_made || [];
  for (const rep of reps) {
    if (rep.quoted_text && rep.quoted_text.includes("\n")) {
      const result = fixFalsePositiveBreaks(rep.quoted_text);
      if (result.text !== rep.quoted_text) {
        rep.quoted_text = result.text;
        fileFixCount++;
        details.push({
          file: path.basename(filePath),
          location: "complaint.representations_made",
          fixes: result.fixes,
        });
      }
    }
  }

  return fileFixCount;
}

console.log(`Scanning ${files.length} FTC case files for false-positive line breaks...\n`);

for (const file of files) {
  const filePath = path.join(FTC_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error(`  ERROR parsing ${file}: ${e.message}`);
    continue;
  }

  const fixCount = processQuotedTexts(data, filePath);
  if (fixCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    filesFixed++;
    totalFixed += fixCount;
    console.log(`  FIXED ${file}: ${fixCount} quoted_text block(s)`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Files fixed: ${filesFixed}`);
console.log(`Total quoted_text blocks fixed: ${totalFixed}`);
console.log(`\nFix details:`);
const byPattern = {};
for (const d of details) {
  for (const f of d.fixes) {
    byPattern[f] = (byPattern[f] || 0) + 1;
  }
}
for (const [pat, count] of Object.entries(byPattern).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${pat}: ${count} occurrences`);
}
