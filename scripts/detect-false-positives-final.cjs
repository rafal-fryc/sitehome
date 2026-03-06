/**
 * detect-false-positives-final.cjs
 *
 * SURGICAL detection: only flags patterns confirmed as false positives
 * by agent analysis and manual review. No broad heuristics.
 *
 * Strategy: search CLEANED text for specific broken patterns, then verify
 * against the ORIGINAL to confirm a number was removed.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PROV_BACKUP = path.join(ROOT, "public", "data", "provisions-backup");

const modifiedFiles = execSync("git diff --name-only", {
  encoding: "utf8",
  cwd: ROOT,
})
  .trim()
  .split("\n")
  .filter((f) => f.includes("ftc-files/") || f.includes("provisions/"));

console.log(`Scanning ${modifiedFiles.length} modified files...\n`);

/**
 * HIGH-CONFIDENCE patterns for missing numbers.
 * Each returns an array of { pattern, fix, missingNum } for a given text pair.
 */
function findConfirmedFalsePositives(cleaned, original) {
  const results = [];

  // === PATTERN 1: "Sections and of the FTC Act" ===
  // Should be "Sections 9 and 20 of the FTC Act"
  if (/Sections\s+and\s+of\s+the\s+FTC/i.test(cleaned)) {
    results.push({
      pattern: "Sections N and M of the FTC Act",
      cleanedSnippet: extractSnippet(cleaned, /Sections\s+and\s+of\s+the\s+FTC/i),
      fix: 'Restore "Sections 9 and 20 of the FTC Act"',
      missingNums: ["9", "20"],
      searchReplace: {
        search: "Sections and of the FTC Act",
        replace: "Sections 9 and 20 of the FTC Act",
      },
    });
  }
  // "Sections 9 and of" (only 20 missing)
  if (/Sections\s+9\s+and\s+of\s+the\s+FTC/i.test(cleaned)) {
    results.push({
      pattern: "Sections 9 and M of the FTC Act",
      cleanedSnippet: extractSnippet(cleaned, /Sections\s+9\s+and\s+of/i),
      fix: 'Restore "20" → "Sections 9 and 20 of the FTC Act"',
      missingNums: ["20"],
      searchReplace: {
        search: "Sections 9 and of the FTC Act",
        replace: "Sections 9 and 20 of the FTC Act",
      },
    });
  }
  // "Sections and 20 of" (only 9 missing)
  if (/Sections\s+and\s+20\s+of\s+the\s+FTC/i.test(cleaned)) {
    results.push({
      pattern: "Sections N and 20 of the FTC Act",
      cleanedSnippet: extractSnippet(cleaned, /Sections\s+and\s+20\s+of/i),
      fix: 'Restore "9" → "Sections 9 and 20 of the FTC Act"',
      missingNums: ["9"],
      searchReplace: {
        search: "Sections and 20 of the FTC Act",
        replace: "Sections 9 and 20 of the FTC Act",
      },
    });
  }

  // === PATTERN 2: "Section of the FTC Act" ===
  // Should be "Section 5 of the FTC Act"
  if (/Section\s+of\s+the\s+FTC\s+Act/i.test(cleaned) && !(/Sections?\s+\d/.test(cleaned.match(/Section\s+of/i)?.input?.slice(Math.max(0, (cleaned.match(/Section\s+of/i)?.index || 0) - 10), (cleaned.match(/Section\s+of/i)?.index || 0)) || ""))) {
    // Verify in original
    if (/Section\s+5\s+of\s+the\s+FTC\s+Act/i.test(original)) {
      results.push({
        pattern: "Section 5 of the FTC Act",
        cleanedSnippet: extractSnippet(cleaned, /Section\s+of\s+the\s+FTC\s+Act/i),
        fix: 'Restore "5" → "Section 5 of the FTC Act"',
        missingNums: ["5"],
        searchReplace: {
          search: "Section of the FTC Act",
          replace: "Section 5 of the FTC Act",
        },
      });
    }
  }

  // === PATTERN 3: "terminate years from" ===
  // Should be "terminate 20 years from"
  const terminateMatch = cleaned.match(/terminate\s+years\s+from/i);
  if (terminateMatch) {
    // Verify original had "terminate 20 years"
    if (/terminate\s+20\s+years/i.test(original)) {
      results.push({
        pattern: "terminate 20 years from",
        cleanedSnippet: extractSnippet(cleaned, /terminate\s+years\s+from/i),
        fix: 'Restore "20" → "terminate 20 years from"',
        missingNums: ["20"],
        searchReplace: {
          search: "terminate years from",
          replace: "terminate 20 years from",
        },
      });
    }
  }

  // === PATTERN 4: "or years from the most recent" (after date/year) ===
  // Should be "or 20 years from"
  if (/or\s+years\s+from\s+the/i.test(cleaned)) {
    if (/or\s+20\s+years\s+from/i.test(original)) {
      results.push({
        pattern: "or 20 years from",
        cleanedSnippet: extractSnippet(cleaned, /or\s+years\s+from\s+the/i),
        fix: 'Restore "20" → "or 20 years from"',
        missingNums: ["20"],
        searchReplace: {
          search: "or years from the",
          replace: "or 20 years from the",
        },
      });
    }
  }

  // === PATTERN 5: COPPA age 13 ===
  // "age or older/over" → should be "age 13 or older/over"
  const ageOlderMatch = cleaned.match(/age\s+or\s+(older|over)\b/gi);
  if (ageOlderMatch) {
    for (const m of ageOlderMatch) {
      if (/age\s+13\s+or\s+(older|over)/i.test(original)) {
        results.push({
          pattern: "age 13 or older/over",
          cleanedSnippet: extractSnippet(cleaned, /age\s+or\s+(older|over)/i),
          fix: 'Restore "13" → "age 13 or older/over"',
          missingNums: ["13"],
          searchReplace: {
            search: m.trim(),
            replace: m.trim().replace(/age\s+or/i, "age 13 or"),
          },
        });
        break; // one per occurrence
      }
    }
  }

  // "under age at the time" → "under age 13 at the time"
  if (/under\s+age\s+at\s+the\s+time/i.test(cleaned)) {
    if (/under\s+age\s+13/i.test(original)) {
      results.push({
        pattern: "under age 13 at the time",
        cleanedSnippet: extractSnippet(cleaned, /under\s+age\s+at\s+the\s+time/i),
        fix: 'Restore "13" → "under age 13 at the time"',
        missingNums: ["13"],
        searchReplace: {
          search: "under age at the time",
          replace: "under age 13 at the time",
        },
      });
    }
  }

  // "children under who" → "children under 13 who"
  if (/children\s+under\s+who/i.test(cleaned)) {
    if (/children\s+under\s+13/i.test(original)) {
      results.push({
        pattern: "children under 13 who",
        cleanedSnippet: extractSnippet(cleaned, /children\s+under\s+who/i),
        fix: 'Restore "13" → "children under 13 who"',
        missingNums: ["13"],
        searchReplace: {
          search: "children under who",
          replace: "children under 13 who",
        },
      });
    }
  }

  // "under in violation" → "under 13 in violation" (from musical.ly)
  if (/age\s+in\s+violation/i.test(cleaned)) {
    if (/age\s+13\s+in\s+violation/i.test(original)) {
      results.push({
        pattern: "age 13 in violation",
        cleanedSnippet: extractSnippet(cleaned, /age\s+in\s+violation/i),
        fix: 'Restore "13" → "age 13 in violation"',
        missingNums: ["13"],
        searchReplace: {
          search: "age in violation",
          replace: "age 13 in violation",
        },
      });
    }
  }

  // === PATTERN 6: "minimum of years" ===
  if (/minimum\s+of\s+years/i.test(cleaned)) {
    // Find what number was there
    const origMatch = original.match(/minimum\s+of\s+(\d{1,2})\s+years/i);
    if (origMatch && parseInt(origMatch[1]) >= 1 && parseInt(origMatch[1]) <= 28) {
      results.push({
        pattern: `minimum of ${origMatch[1]} years`,
        cleanedSnippet: extractSnippet(cleaned, /minimum\s+of\s+years/i),
        fix: `Restore "${origMatch[1]}" → "minimum of ${origMatch[1]} years"`,
        missingNums: [origMatch[1]],
        searchReplace: {
          search: "minimum of years",
          replace: `minimum of ${origMatch[1]} years`,
        },
      });
    }
  }

  // === PATTERN 7: "number of child-directed" (from Disney) ===
  if (/number\s+of\s+child-directed/i.test(cleaned)) {
    const origMatch = original.match(
      /number\s+of\s+(\d{1,2})\s+child-directed/i
    );
    if (origMatch) {
      results.push({
        pattern: `number of ${origMatch[1]} child-directed`,
        cleanedSnippet: extractSnippet(cleaned, /number\s+of\s+child-directed/i),
        fix: `Restore "${origMatch[1]}" → "number of ${origMatch[1]} child-directed"`,
        missingNums: [origMatch[1]],
        searchReplace: {
          search: "number of child-directed",
          replace: `number of ${origMatch[1]} child-directed`,
        },
      });
    }
  }

  // === PATTERN 8: Generic "of years of experience" ===
  if (/of\s+years\s+of\s+experience/i.test(cleaned)) {
    const origMatch = original.match(/of\s+(\d{1,2})\s+years\s+of\s+experience/i);
    if (origMatch) {
      results.push({
        pattern: `of ${origMatch[1]} years of experience`,
        cleanedSnippet: extractSnippet(cleaned, /of\s+years\s+of\s+experience/i),
        fix: `Restore "${origMatch[1]}" → "of ${origMatch[1]} years of experience"`,
        missingNums: [origMatch[1]],
        searchReplace: {
          search: "of years of experience",
          replace: `of ${origMatch[1]} years of experience`,
        },
      });
    }
  }

  // === PATTERN 9: Generic verified missing number ===
  // Catch any "KEYWORD years/days" where a number 1-28 was between them in original
  // Only for VERY specific keywords that always need a number
  const strictKeywords = [
    "terminate", "terminating", "exceed", "exceeding",
  ];
  for (const kw of strictKeywords) {
    const timeWords = ["years", "days", "months", "weeks"];
    for (const tw of timeWords) {
      const cleanRegex = new RegExp(`\\b${kw}\\s+${tw}\\b`, "gi");
      if (cleanRegex.test(cleaned)) {
        const origRegex = new RegExp(
          `\\b${kw}\\s+(\\d{1,2})\\s+${tw}\\b`,
          "i"
        );
        const origMatch = original.match(origRegex);
        if (origMatch) {
          const n = parseInt(origMatch[1]);
          if (n >= 1 && n <= 28) {
            results.push({
              pattern: `${kw} ${origMatch[1]} ${tw}`,
              cleanedSnippet: extractSnippet(
                cleaned,
                new RegExp(`${kw}\\s+${tw}`, "i")
              ),
              fix: `Restore "${origMatch[1]}" → "${kw} ${origMatch[1]} ${tw}"`,
              missingNums: [origMatch[1]],
              searchReplace: {
                search: `${kw} ${tw}`,
                replace: `${kw} ${origMatch[1]} ${tw}`,
              },
            });
          }
        }
      }
    }
  }

  return results;
}

function extractSnippet(text, regex) {
  const match = text.match(regex);
  if (!match) return "";
  const pos = match.index;
  const start = Math.max(0, pos - 30);
  const end = Math.min(text.length, pos + match[0].length + 30);
  return "..." + text.slice(start, end).replace(/\n/g, " ").trim() + "...";
}

// === Helpers ===
function getOriginal(file) {
  try {
    return JSON.parse(
      execSync(`git show HEAD:"${file}"`, {
        encoding: "utf8",
        cwd: ROOT,
        maxBuffer: 10 * 1024 * 1024,
      })
    );
  } catch {
    return null;
  }
}

const allFPs = [];

// === Process FTC files ===
for (const file of modifiedFiles.filter((f) => f.includes("ftc-files/"))) {
  const orig = getOriginal(file);
  let curr;
  try {
    curr = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  } catch {
    continue;
  }
  if (!orig || !curr) continue;

  const basename = path.basename(file);

  // complaint.representations_made[].quoted_text
  const oReps = orig.complaint?.representations_made || [];
  const cReps = curr.complaint?.representations_made || [];
  for (let i = 0; i < Math.min(oReps.length, cReps.length); i++) {
    if (!oReps[i].quoted_text || !cReps[i].quoted_text) continue;
    if (oReps[i].quoted_text === cReps[i].quoted_text) continue;
    const fps = findConfirmedFalsePositives(
      cReps[i].quoted_text,
      oReps[i].quoted_text
    );
    for (const fp of fps) {
      allFPs.push({
        file: basename,
        filePath: file,
        location: `complaint.representations_made[${i}].quoted_text`,
        ...fp,
      });
    }
  }

  // order.provisions[].requirements[].quoted_text
  const oProvs = orig.order?.provisions || [];
  const cProvs = curr.order?.provisions || [];
  for (let p = 0; p < Math.min(oProvs.length, cProvs.length); p++) {
    const oReqs = oProvs[p].requirements || [];
    const cReqs = cProvs[p].requirements || [];
    for (let r = 0; r < Math.min(oReqs.length, cReqs.length); r++) {
      if (!oReqs[r].quoted_text || !cReqs[r].quoted_text) continue;
      if (oReqs[r].quoted_text === cReqs[r].quoted_text) continue;
      const fps = findConfirmedFalsePositives(
        cReqs[r].quoted_text,
        oReqs[r].quoted_text
      );
      for (const fp of fps) {
        allFPs.push({
          file: basename,
          filePath: file,
          location: `order.provisions[${p}].requirements[${r}].quoted_text`,
          ...fp,
        });
      }
    }
  }
}

// === Process provisions files ===
for (const file of modifiedFiles.filter((f) => f.includes("provisions/"))) {
  const basename = path.basename(file);
  const backupPath = path.join(PROV_BACKUP, basename);

  let orig;
  if (fs.existsSync(backupPath)) {
    orig = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  } else {
    orig = getOriginal(file);
  }
  let curr;
  try {
    curr = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  } catch {
    continue;
  }
  if (!orig || !curr) continue;

  const oProvs = orig.provisions || [];
  const cProvs = curr.provisions || [];

  for (let i = 0; i < Math.min(oProvs.length, cProvs.length); i++) {
    const oText = oProvs[i].verbatim_text;
    const cText = cProvs[i].verbatim_text;
    if (!oText || !cText || oText === cText) continue;

    const fps = findConfirmedFalsePositives(cText, oText);
    for (const fp of fps) {
      allFPs.push({
        file: basename,
        filePath: file,
        location: `provisions[${i}].verbatim_text (${oProvs[i].provision_number || "?"})`,
        ...fp,
      });
    }
  }
}

// === Deduplicate ===
const seen = new Set();
const deduped = allFPs.filter((fp) => {
  const key = `${fp.file}|${fp.pattern}|${fp.cleanedSnippet?.slice(0, 60)}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// === Output ===
console.log("=== CONFIRMED FALSE POSITIVE REPORT ===\n");
console.log(`Files scanned: ${modifiedFiles.length}`);
console.log(`Confirmed false positives: ${deduped.length}`);
console.log(`Files affected: ${new Set(deduped.map((f) => f.file)).size}\n`);

// By pattern
const byPattern = {};
for (const fp of deduped) {
  if (!byPattern[fp.pattern]) byPattern[fp.pattern] = [];
  byPattern[fp.pattern].push(fp);
}

console.log("=== BY PATTERN ===\n");
for (const [pat, fps] of Object.entries(byPattern).sort(
  (a, b) => b[1].length - a[1].length
)) {
  console.log(`[${fps.length}x] ${pat}`);
  for (const fp of fps.slice(0, 3)) {
    console.log(`     ${fp.file} → ${fp.fix}`);
  }
  if (fps.length > 3) console.log(`     ... +${fps.length - 3} more`);
  console.log("");
}

// Detailed
console.log("\n=== COMPLETE LIST ===\n");
for (const fp of deduped) {
  console.log(`FILE: ${fp.file}`);
  console.log(`  LOC: ${fp.location}`);
  console.log(`  PAT: ${fp.pattern}`);
  console.log(`  CTX: ${fp.cleanedSnippet}`);
  console.log(`  FIX: ${fp.fix}`);
  if (fp.searchReplace) {
    console.log(
      `  S/R: "${fp.searchReplace.search}" → "${fp.searchReplace.replace}"`
    );
  }
  console.log("");
}

// JSON
const report = {
  totalFilesScanned: modifiedFiles.length,
  confirmedFalsePositives: deduped.length,
  filesAffected: new Set(deduped.map((f) => f.file)).size,
  byPattern: Object.fromEntries(
    Object.entries(byPattern).map(([k, v]) => [k, v.length])
  ),
  falsePositives: deduped,
};
const reportPath = path.join(ROOT, "false-positives-final.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nJSON report: ${reportPath}`);
